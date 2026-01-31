import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

function buildRedirectUrl(baseUri: string, params: Record<string, string>): string {
  const url = new URL(baseUri);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Note: This is a PUBLIC callback endpoint - it receives redirects from Fanbasis
  // and does NOT require authentication headers (unlike oauth-start which does)
  
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Default fallback callback page
    let callbackPage = "https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/fanbasis-callback.html";

    // Decode and parse state first to get the origin for callback
    let teamId = "";
    let stateToken = "";
    let redirectUri = "";

    if (stateParam) {
      try {
        const decodedState = atob(stateParam);
        const stateData = JSON.parse(decodedState);
        teamId = stateData.teamId || "";
        stateToken = stateData.stateToken || "";
        redirectUri = stateData.redirectUri || "";
        
        // Derive callback page from the redirect URI origin
        if (redirectUri) {
          const originUrl = new URL(redirectUri);
          callbackPage = `${originUrl.origin}/fanbasis-callback.html`;
        }
      } catch (e) {
        console.error("[fanbasis-oauth-callback] Failed to parse state:", e);
        const redirectUrl = buildRedirectUrl(callbackPage, {
          error: "Invalid state parameter",
        });
        return Response.redirect(redirectUrl, 302);
      }
    }

    // Handle OAuth errors from Fanbasis
    if (error) {
      console.error(`[fanbasis-oauth-callback] OAuth error: ${error} - ${errorDescription}`);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: errorDescription || error,
      });
      return Response.redirect(redirectUrl, 302);
    }

    if (!code || !stateParam || !teamId) {
      console.error("[fanbasis-oauth-callback] Missing code, state, or teamId");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Missing authorization code or state",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const supabase = getSupabaseClient();

    // Verify state token matches what we stored
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "fanbasis")
      .maybeSingle();

    if (fetchError || !integration) {
      console.error("[fanbasis-oauth-callback] Failed to fetch integration:", fetchError);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "OAuth session not found",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const storedConfig = integration.config as Record<string, unknown>;
    if (storedConfig?.state_token !== stateToken) {
      console.error("[fanbasis-oauth-callback] State token mismatch");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Invalid state token",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Retrieve the stored code_verifier for PKCE
    const codeVerifier = storedConfig?.code_verifier as string | undefined;
    if (!codeVerifier) {
      console.error("[fanbasis-oauth-callback] Missing code_verifier for PKCE");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "OAuth session expired or invalid",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for access token
    const clientId = Deno.env.get("FANBASIS_CLIENT_ID");
    const clientSecret = Deno.env.get("FANBASIS_CLIENT_SECRET");
    const REDIRECT_URI = "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback";

    if (!clientId || !clientSecret) {
      console.error("[fanbasis-oauth-callback] Missing Fanbasis credentials");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Server configuration error",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Get Fanbasis base URL from environment or use default
    // Try API subdomain for token endpoint (common pattern)
    const fanbasisBaseUrl = Deno.env.get("FANBASIS_BASE_URL") || "https://api.fanbasis.com";

    // Token exchange with PKCE (per Fanbasis documentation)
    console.log(`[fanbasis-oauth-callback] Exchanging code with PKCE for team ${teamId}`);
    console.log(`[fanbasis-oauth-callback] Using redirect_uri: ${REDIRECT_URI}`);
    console.log(`[fanbasis-oauth-callback] Client ID: ${clientId.substring(0, 8)}...`);
    
    // Fanbasis requires BOTH Basic Auth header AND body parameters
    // Use proper base64 encoding for Deno
    const credentials = `${clientId}:${clientSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(credentials);
    const base64 = btoa(String.fromCharCode(...data));
    
    console.log(`[fanbasis-oauth-callback] Basic Auth credentials length: ${credentials.length}`);
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code: code,
      code_verifier: codeVerifier,
    }).toString();

    console.log(`[fanbasis-oauth-callback] Requesting: ${fanbasisBaseUrl}/oauth/token`);
    console.log(`[fanbasis-oauth-callback] Using Basic Auth + body params (grant_type, redirect_uri, code, code_verifier)`);

    const tokenResponse = await fetch(`${fanbasisBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${base64}`,
      },
      body: tokenRequestBody,
    });

    console.log(`[fanbasis-oauth-callback] Token response status: ${tokenResponse.status}`);
    console.log(`[fanbasis-oauth-callback] Token response content-type: ${tokenResponse.headers.get('content-type')}`);

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error(`[fanbasis-oauth-callback] Token exchange failed (${tokenResponse.status}):`, errorBody.substring(0, 500));
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: `Token exchange failed with status ${tokenResponse.status}`,
      });
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // 1296000 seconds (15 days)
    const scope = tokenData.scope;

    // Calculate expiration timestamp
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    // Fetch creator info using the access token (if API endpoint available)
    let creatorId = null;
    let creatorName = null;

    try {
      const meResponse = await fetch(`${fanbasisBaseUrl}/api/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        creatorId = meData.id || meData.creator_id;
        creatorName = meData.name || meData.username;
        console.log(`[fanbasis-oauth-callback] Connected creator: ${creatorId}`);
      }
    } catch (e) {
      console.log("[fanbasis-oauth-callback] Could not fetch creator info:", e);
    }

    // Update team_integrations with the tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        config: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scope: scope,
          creator_id: creatorId,
          creator_name: creatorName,
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "fanbasis");

    if (updateError) {
      console.error("[fanbasis-oauth-callback] Failed to save tokens:", updateError);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Failed to save connection",
      });
      return Response.redirect(redirectUrl, 302);
    }

    console.log(`[fanbasis-oauth-callback] Successfully connected Fanbasis for team ${teamId}`);

    // Redirect to success page (postMessage to opener)
    const redirectUrl = buildRedirectUrl(callbackPage, {
      success: "true",
      creator_id: creatorId || "",
    });

    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error("[fanbasis-oauth-callback] Unexpected error:", error);
    const fallbackPage = "https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/fanbasis-callback.html";
    const redirectUrl = buildRedirectUrl(fallbackPage, {
      error: "An unexpected error occurred",
    });
    return Response.redirect(redirectUrl, 302);
  }
});
