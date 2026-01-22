// supabase/functions/stripe-oauth-callback/index.ts
// Handles Stripe Connect OAuth callback

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

    // Handle OAuth errors
    if (error) {
      console.error("[stripe-oauth-callback] OAuth error:", error, errorDescription);
      return new Response(
        generateErrorHTML("Authorization Failed", errorDescription || error),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      return new Response(
        generateErrorHTML("Invalid Request", "Missing code or state parameter"),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Parse state: format is "teamId:stateToken"
    const [teamId, stateToken] = state.split(":");
    
    if (!teamId || !stateToken) {
      return new Response(
        generateErrorHTML("Invalid State", "Malformed state parameter"),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("provider", "stripe")
      .single();

    if (fetchError || !integration) {
      return new Response(
        generateErrorHTML("Invalid State", "OAuth session not found"),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const config = integration.config as Record<string, any>;
    if (config?.oauth_state !== stateToken) {
      return new Response(
        generateErrorHTML("Invalid State", "State token mismatch - possible CSRF attempt"),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Check if OAuth session expired (15 minutes)
    const startedAt = new Date(config.oauth_started_at).getTime();
    if (Date.now() - startedAt > 15 * 60 * 1000) {
      return new Response(
        generateErrorHTML("Session Expired", "OAuth session expired. Please try again."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Exchange code for access token
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        generateErrorHTML("Configuration Error", "Stripe not configured"),
        { headers: { "Content-Type": "text/html" } }
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
      return new Response(
        generateErrorHTML("Authorization Failed", tokenData.error_description || tokenData.error),
        { headers: { "Content-Type": "text/html" } }
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
      .eq("provider", "stripe");

    if (updateError) {
      console.error("[stripe-oauth-callback] Failed to save credentials:", updateError);
      return new Response(
        generateErrorHTML("Save Failed", "Failed to save connection. Please try again."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Register webhook endpoint for connected account
    await registerWebhookEndpoint(supabase, teamId, stripe_user_id, access_token);

    // Return success page that closes the popup
    const redirectUri = config.redirect_uri || "/team/" + teamId + "/settings/integrations";
    
    return new Response(
      generateSuccessHTML(redirectUri),
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    console.error("[stripe-oauth-callback] Error:", err);
    return new Response(
      generateErrorHTML("Error", "An unexpected error occurred"),
      { headers: { "Content-Type": "text/html" } }
    );
  }
});

async function registerWebhookEndpoint(
  supabase: any,
  teamId: string,
  stripeAccountId: string,
  accessToken: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/stripe-user-webhook?teamId=${teamId}`;

    // Create webhook endpoint using the connected account's credentials
    const response = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Account": stripeAccountId,
      },
      body: new URLSearchParams({
        url: webhookUrl,
        "enabled_events[]": "payment_intent.succeeded",
        "enabled_events[1]": "payment_intent.payment_failed",
        "enabled_events[2]": "invoice.paid",
        "enabled_events[3]": "invoice.payment_failed",
        "enabled_events[4]": "customer.subscription.created",
        "enabled_events[5]": "customer.subscription.updated",
        "enabled_events[6]": "customer.subscription.deleted",
        "enabled_events[7]": "charge.refunded",
      }),
    });

    const webhookData = await response.json();

    if (webhookData.error) {
      console.error("[stripe-oauth-callback] Failed to create webhook:", webhookData.error);
      return;
    }

    // Store webhook secret in integration config
    await supabase
      .from("team_integrations")
      .update({
        config: supabase.sql`config || ${JSON.stringify({
          webhook_endpoint_id: webhookData.id,
          webhook_secret: webhookData.secret,
        })}::jsonb`,
      })
      .eq("team_id", teamId)
      .eq("provider", "stripe");

    console.log("[stripe-oauth-callback] Webhook endpoint created:", webhookData.id);

  } catch (err) {
    console.error("[stripe-oauth-callback] Failed to register webhook:", err);
  }
}

function generateSuccessHTML(redirectUri: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Stripe Connected</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
    .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .success { color: #22c55e; font-size: 48px; margin-bottom: 16px; }
    h1 { color: #1e293b; margin: 0 0 8px; }
    p { color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓</div>
    <h1>Stripe Connected!</h1>
    <p>You can close this window.</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'STRIPE_CONNECTED', success: true }, '*');
      setTimeout(() => window.close(), 1500);
    } else {
      setTimeout(() => window.location.href = '${redirectUri}', 1500);
    }
  </script>
</body>
</html>`;
}

function generateErrorHTML(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
    .container { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; }
    .error { color: #ef4444; font-size: 48px; margin-bottom: 16px; }
    h1 { color: #1e293b; margin: 0 0 8px; }
    p { color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">✕</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'STRIPE_CONNECTED', success: false, error: '${message}' }, '*');
    }
  </script>
</body>
</html>`;
}
