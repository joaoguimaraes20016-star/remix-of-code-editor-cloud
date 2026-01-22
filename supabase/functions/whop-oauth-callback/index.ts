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

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Default fallback callback page
    let callbackPage = "https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/whop-callback.html";

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
          callbackPage = `${originUrl.origin}/whop-callback.html`;
        }
      } catch (e) {
        console.error("[whop-oauth-callback] Failed to parse state:", e);
        const redirectUrl = buildRedirectUrl(callbackPage, {
          error: "Invalid state parameter",
        });
        return Response.redirect(redirectUrl, 302);
      }
    }

    // Handle OAuth errors from Whop
    if (error) {
      console.error(`[whop-oauth-callback] OAuth error: ${error} - ${errorDescription}`);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: errorDescription || error,
      });
      return Response.redirect(redirectUrl, 302);
    }

    if (!code || !stateParam || !teamId) {
      console.error("[whop-oauth-callback] Missing code, state, or teamId");
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
      .eq("integration_type", "whop")
      .maybeSingle();

    if (fetchError || !integration) {
      console.error("[whop-oauth-callback] Failed to fetch integration:", fetchError);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "OAuth session not found",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const storedConfig = integration.config as Record<string, unknown>;
    if (storedConfig?.state_token !== stateToken) {
      console.error("[whop-oauth-callback] State token mismatch");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Invalid state token",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Retrieve the stored code_verifier for PKCE
    const codeVerifier = storedConfig?.code_verifier as string | undefined;
    if (!codeVerifier) {
      console.error("[whop-oauth-callback] Missing code_verifier for PKCE");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "OAuth session expired or invalid",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for access token
    const clientId = Deno.env.get("WHOP_CLIENT_ID");
    const REDIRECT_URI = "https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/whop-oauth-callback";

    if (!clientId) {
      console.error("[whop-oauth-callback] Missing Whop client ID");
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Server configuration error",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Token exchange with PKCE - using correct endpoint and form-urlencoded
    console.log(`[whop-oauth-callback] Exchanging code with PKCE for team ${teamId}`);
    
    const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: codeVerifier,
      }).toString(),
    });

    console.log(`[whop-oauth-callback] Token response status: ${tokenResponse.status}`);

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[whop-oauth-callback] Token exchange failed:", errorBody);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: `Token exchange failed: ${errorBody.substring(0, 100)}`,
      });
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Fetch company info using the access token
    const companyResponse = await fetch("https://api.whop.com/api/v5/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let companyId = null;
    let companyName = null;

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      companyId = companyData.id;
      companyName = companyData.username || companyData.name;
      console.log(`[whop-oauth-callback] Connected company: ${companyId}`);
    }

    // Update team_integrations with the tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        config: {
          access_token: accessToken,
          refresh_token: refreshToken,
          company_id: companyId,
          company_name: companyName,
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "whop");

    if (updateError) {
      console.error("[whop-oauth-callback] Failed to save tokens:", updateError);
      const redirectUrl = buildRedirectUrl(callbackPage, {
        error: "Failed to save connection",
      });
      return Response.redirect(redirectUrl, 302);
    }

    console.log(`[whop-oauth-callback] Successfully connected Whop for team ${teamId}`);

    // Redirect to success page
    const redirectUrl = buildRedirectUrl(callbackPage, {
      success: "true",
      company_id: companyId || "",
    });

    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error("[whop-oauth-callback] Unexpected error:", error);
    const fallbackPage = "https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/whop-callback.html";
    const redirectUrl = buildRedirectUrl(fallbackPage, {
      error: "An unexpected error occurred",
    });
    return Response.redirect(redirectUrl, 302);
  }
});
