import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function buildRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
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

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const supabase = getSupabaseClient();

  // Helper to build callback redirect
  const buildCallbackRedirect = async (teamId: string | null, success: boolean, params: Record<string, string> = {}) => {
    let baseUri = Deno.env.get("SITE_URL") || "https://lovable.dev";
    
    // Try to get stored redirect_uri from team_integrations
    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "zoom")
        .single();
      
      if (integration?.config?.redirect_uri) {
        baseUri = integration.config.redirect_uri;
      }
    }
    
    return buildRedirectUrl(`${baseUri}/zoom-callback.html`, {
      success: success.toString(),
      ...params,
    });
  };

  try {
    // Handle Zoom OAuth errors
    if (error) {
      console.error("[Zoom OAuth Callback] Zoom returned error:", error);
      const redirectUrl = await buildCallbackRedirect(null, false, { error });
      return Response.redirect(redirectUrl, 302);
    }

    // Validate required parameters
    if (!code || !stateParam) {
      console.error("[Zoom OAuth Callback] Missing code or state");
      const redirectUrl = await buildCallbackRedirect(null, false, { error: "missing_params" });
      return Response.redirect(redirectUrl, 302);
    }

    // Decode and parse state
    let decodedState: string;
    try {
      decodedState = atob(stateParam);
    } catch {
      console.error("[Zoom OAuth Callback] Invalid state encoding");
      const redirectUrl = await buildCallbackRedirect(null, false, { error: "invalid_state" });
      return Response.redirect(redirectUrl, 302);
    }

    const [teamId, stateToken] = decodedState.split(":");
    
    if (!teamId || !stateToken) {
      console.error("[Zoom OAuth Callback] Invalid state format");
      const redirectUrl = await buildCallbackRedirect(null, false, { error: "invalid_state" });
      return Response.redirect(redirectUrl, 302);
    }

    console.log(`[Zoom OAuth Callback] Processing callback for team ${teamId}`);

    // Verify state token from config JSONB
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "zoom")
      .single();

    if (integrationError || !integration) {
      console.error("[Zoom OAuth Callback] Integration not found:", integrationError);
      const redirectUrl = await buildCallbackRedirect(teamId, false, { error: "integration_not_found" });
      return Response.redirect(redirectUrl, 302);
    }

    if (integration.config?.oauth_state !== stateToken) {
      console.error("[Zoom OAuth Callback] State mismatch");
      const redirectUrl = await buildCallbackRedirect(teamId, false, { error: "state_mismatch" });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange authorization code for tokens
    const clientId = Deno.env.get("ZOOM_CLIENT_ID")!;
    const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/zoom-oauth-callback`;

    // Zoom requires Basic Auth for token exchange
    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Zoom OAuth Callback] Token exchange failed:", errorText);
      const redirectUrl = await buildCallbackRedirect(teamId, false, { error: "token_exchange_failed" });
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    console.log("[Zoom OAuth Callback] Token exchange successful");

    // Fetch user info from Zoom API
    const userResponse = await fetch("https://api.zoom.us/v2/users/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    let userInfo = { email: null as string | null, first_name: "", last_name: "" };
    if (userResponse.ok) {
      userInfo = await userResponse.json();
      console.log(`[Zoom OAuth Callback] User info fetched: ${userInfo.email}`);
    } else {
      console.warn("[Zoom OAuth Callback] Failed to fetch user info");
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Store tokens and user info in config JSONB
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        connected_at: new Date().toISOString(),
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          email: userInfo.email,
          name: `${userInfo.first_name} ${userInfo.last_name}`.trim(),
          scope: tokenData.scope,
          connected_at: new Date().toISOString(),
          oauth_state: null,
          redirect_uri: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "zoom");

    if (updateError) {
      console.error("[Zoom OAuth Callback] Failed to store tokens:", updateError);
      const redirectUrl = await buildCallbackRedirect(teamId, false, { error: "storage_failed" });
      return Response.redirect(redirectUrl, 302);
    }

    console.log(`[Zoom OAuth Callback] Successfully connected Zoom for team ${teamId}`);

    const redirectUrl = await buildCallbackRedirect(teamId, true, {
      email: userInfo.email || "",
    });
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error("[Zoom OAuth Callback] Unexpected error:", error);
    const redirectUrl = await buildCallbackRedirect(null, false, { error: "unexpected_error" });
    return Response.redirect(redirectUrl, 302);
  }
});
