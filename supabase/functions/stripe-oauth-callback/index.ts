// supabase/functions/stripe-oauth-callback/index.ts
// Handles Stripe Connect OAuth callback with redirect-based completion

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

function buildRedirectUrl(baseUri: string, params: Record<string, string>): string {
  const url = new URL(baseUri);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const url = new URL(req.url);

  try {
    // Get OAuth params from query string
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Parse state early to get redirect URI for error handling
    let redirectUri = "";
    let teamId = "";
    
    if (state) {
      const parts = state.split(":");
      teamId = parts[0] || "";
      // Default redirect URI - will be updated from stored config
      redirectUri = `https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/team/${teamId}/payments`;
    }

    // Handle OAuth errors
    if (error) {
      console.error("[stripe-oauth-callback] OAuth error:", error, errorDescription);
      const errorMessage = errorDescription || error;
      const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; }
    .container { text-align: center; padding: 2rem; max-width: 400px; }
    .error-icon { width: 64px; height: 64px; margin: 0 auto 1rem; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .error-icon svg { width: 32px; height: 32px; color: white; }
    h1 { color: #dc2626; margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { color: #6b7280; margin: 0 0 0.5rem; }
    .error-detail { font-size: 0.875rem; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
    </div>
    <h1>Connection Failed</h1>
    <p class="error-detail">${errorMessage}</p>
    <p>This window will close automatically...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'stripe-oauth-error', error: '${errorMessage.replace(/'/g, "\\'")}' }, '*');
    }
    setTimeout(function() { window.close(); }, 2500);
  </script>
</body>
</html>`;
      return new Response(errorHtml, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    if (!code || !state) {
      if (redirectUri) {
        return Response.redirect(
          buildRedirectUrl(redirectUri, { stripe_error: "Missing authorization code" }),
          302
        );
      }
      return new Response("Missing code or state parameter", { status: 400 });
    }

    // Parse state: format is "teamId:stateToken"
    const [parsedTeamId, stateToken] = state.split(":");
    teamId = parsedTeamId;
    
    if (!teamId || !stateToken) {
      return new Response("Malformed state parameter", { status: 400 });
    }

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "stripe")
      .single();

    if (fetchError || !integration) {
      console.error("[stripe-oauth-callback] Integration not found:", fetchError);
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: "OAuth session not found" }),
        302
      );
    }

    const config = integration.config as Record<string, any>;
    
    // Update redirect URI from stored config if available
    if (config?.redirect_uri) {
      redirectUri = config.redirect_uri;
    }
    
    if (config?.oauth_state !== stateToken) {
      console.error("[stripe-oauth-callback] State mismatch");
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: "Invalid state token" }),
        302
      );
    }

    // Check if OAuth session expired (15 minutes)
    const startedAt = new Date(config.oauth_started_at).getTime();
    if (Date.now() - startedAt > 15 * 60 * 1000) {
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: "Session expired, please try again" }),
        302
      );
    }

    // Exchange code for access token
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: "Stripe not configured" }),
        302
      );
    }

    const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_secret: stripeSecretKey,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("[stripe-oauth-callback] Token exchange failed:", tokenData.error);
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: tokenData.error_description || tokenData.error }),
        302
      );
    }

    // Extract connected account details
    const {
      access_token,
      refresh_token,
      stripe_user_id,
      livemode,
      scope,
      stripe_publishable_key,
    } = tokenData;

    console.log("[stripe-oauth-callback] Successfully connected account:", stripe_user_id);

    // Update team_integrations with connected account
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        config: {
          stripe_account_id: stripe_user_id,
          access_token: access_token,
          refresh_token: refresh_token,
          livemode: livemode,
          scope: scope,
          publishable_key: stripe_publishable_key,
          connected_at: new Date().toISOString(),
          // Clear OAuth state
          oauth_state: null,
          oauth_started_at: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "stripe");

    if (updateError) {
      console.error("[stripe-oauth-callback] Failed to save credentials:", updateError);
      return Response.redirect(
        buildRedirectUrl(redirectUri, { stripe_error: "Failed to save connection" }),
        302
      );
    }

    // Success! Return self-closing HTML page
    console.log("[stripe-oauth-callback] Connection successful, returning self-closing page");
    const successHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Stripe Connected</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; }
    .container { text-align: center; padding: 2rem; }
    .success-icon { width: 64px; height: 64px; margin: 0 auto 1rem; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .success-icon svg { width: 32px; height: 32px; color: white; }
    h1 { color: #059669; margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
    </div>
    <h1>Stripe Connected!</h1>
    <p>This window will close automatically...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'stripe-oauth-success', accountId: '${stripe_user_id}' }, '*');
    }
    setTimeout(function() { window.close(); }, 1500);
  </script>
</body>
</html>`;
    return new Response(successHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });

  } catch (err) {
    console.error("[stripe-oauth-callback] Error:", err);
    // Try to redirect with error if we have a redirect URI
    const state = url.searchParams.get("state");
    if (state) {
      const teamId = state.split(":")[0];
      const fallbackUri = `https://id-preview--3953e671-1532-4998-9201-5d787bfebd43.lovable.app/team/${teamId}/payments`;
      return Response.redirect(
        buildRedirectUrl(fallbackUri, { stripe_error: "An unexpected error occurred" }),
        302
      );
    }
    return new Response("An unexpected error occurred", { status: 500 });
  }
});
