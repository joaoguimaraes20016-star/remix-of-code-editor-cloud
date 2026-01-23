import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
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

  // Default redirect for errors
  const siteUrl = Deno.env.get("SITE_URL") || "https://code-hug-hub.lovable.app";
  const callbackPage = `${siteUrl}/google-callback`;

  // Handle OAuth errors from Google
  if (error) {
    console.error("[Google OAuth Callback] Error from Google:", error);
    return Response.redirect(
      buildRedirectUrl(callbackPage, { success: "false", error: error }),
      302
    );
  }

  if (!code || !stateParam) {
    console.error("[Google OAuth Callback] Missing code or state");
    return Response.redirect(
      buildRedirectUrl(callbackPage, { success: "false", error: "missing_params" }),
      302
    );
  }

  try {
    // Decode and parse state
    let state: { teamId: string; stateToken: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch (e) {
      console.error("[Google OAuth Callback] Failed to parse state:", e);
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "invalid_state" }),
        302
      );
    }

    const { teamId, stateToken } = state;
    const supabase = getSupabaseClient();

    // Verify state token matches what we stored
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "google_sheets")
      .single();

    if (fetchError || !integration) {
      console.error("[Google OAuth Callback] Integration not found:", fetchError);
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "state_not_found" }),
        302
      );
    }

    const config = integration.config as Record<string, any>;
    if (config.state_token !== stateToken) {
      console.error("[Google OAuth Callback] State token mismatch");
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "state_mismatch" }),
        302
      );
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    if (!clientId || !clientSecret) {
      console.error("[Google OAuth Callback] Missing OAuth credentials");
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "config_error" }),
        302
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("[Google OAuth Callback] Token exchange failed:", errorData);
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "token_exchange_failed" }),
        302
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokens;

    console.log("[Google OAuth Callback] Token exchange successful, expires_in:", expires_in);

    // Fetch user info to get email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let userEmail = "";
    let userName = "";
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      userEmail = userInfo.email || "";
      userName = userInfo.name || "";
      console.log("[Google OAuth Callback] Connected account:", userEmail);
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Store tokens in team_integrations
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        config: {
          access_token,
          refresh_token,
          expires_at: expiresAt,
          scope,
          email: userEmail,
          name: userName,
          connected_at: new Date().toISOString(),
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "google_sheets");

    if (updateError) {
      console.error("[Google OAuth Callback] Failed to store tokens:", updateError);
      return Response.redirect(
        buildRedirectUrl(callbackPage, { success: "false", error: "storage_failed" }),
        302
      );
    }

    console.log(`[Google OAuth Callback] Successfully connected Google Sheets for team ${teamId}`);

    // Redirect to success page
    return Response.redirect(
      buildRedirectUrl(callbackPage, { success: "true", email: userEmail }),
      302
    );

  } catch (error) {
    console.error("[Google OAuth Callback] Unexpected error:", error);
    return Response.redirect(
      buildRedirectUrl(callbackPage, { success: "false", error: "unexpected_error" }),
      302
    );
  }
});
