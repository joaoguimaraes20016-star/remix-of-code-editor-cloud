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

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Get the static callback page URL
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // Use the same pattern as Stripe - redirect to a static HTML page
  const callbackPageUrl = supabaseUrl.replace(".supabase.co", ".supabase.co").replace(
    "https://",
    "https://"
  ) + "/storage/v1/object/public/static/slack-callback.html";

  // For now, use a simple redirect approach with query params
  // The frontend will handle the postMessage
  
  try {
    // Handle OAuth errors from Slack
    if (error) {
      console.error("[Slack OAuth] Error from Slack:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent(error)}`,
        },
      });
    }

    if (!code || !state) {
      console.error("[Slack OAuth] Missing code or state");
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("Missing authorization code")}`,
        },
      });
    }

    // Parse state: format is "teamId:stateToken"
    const [teamId, stateToken] = state.split(":");
    if (!teamId || !stateToken) {
      console.error("[Slack OAuth] Invalid state format");
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("Invalid state")}`,
        },
      });
    }

    const supabase = getSupabaseClient();

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "slack")
      .single();

    if (fetchError || !integration) {
      console.error("[Slack OAuth] Integration not found:", fetchError);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("OAuth session not found")}`,
        },
      });
    }

    const storedState = integration.config?.oauth_state;
    const redirectUri = integration.config?.redirect_uri;

    if (storedState !== stateToken) {
      console.error("[Slack OAuth] State mismatch");
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("State mismatch - possible CSRF attack")}`,
        },
      });
    }

    // Exchange code for access token
    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    const clientSecret = Deno.env.get("SLACK_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("[Slack OAuth] Missing Slack credentials");
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("Slack integration not configured")}`,
        },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/slack-oauth-callback`;

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error("[Slack OAuth] Token exchange failed:", tokenData.error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent(tokenData.error || "Token exchange failed")}`,
        },
      });
    }

    // Store the access token and workspace info
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        config: {
          access_token: tokenData.access_token,
          team_id: tokenData.team?.id,
          team_name: tokenData.team?.name,
          bot_user_id: tokenData.bot_user_id,
          scope: tokenData.scope,
          connected_at: new Date().toISOString(),
          // Clear OAuth state
          oauth_state: null,
          redirect_uri: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "slack");

    if (updateError) {
      console.error("[Slack OAuth] Failed to store token:", updateError);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/slack-callback.html?success=false&error=${encodeURIComponent("Failed to save connection")}`,
        },
      });
    }

    console.log(`[Slack OAuth] Successfully connected workspace "${tokenData.team?.name}" for team ${teamId}`);

    // Redirect to callback page with success
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/slack-callback.html?success=true&workspace=${encodeURIComponent(tokenData.team?.name || "Slack")}`,
      },
    });

  } catch (err) {
    console.error("[Slack OAuth] Unexpected error:", err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/slack-callback.html?success=false&error=${encodeURIComponent("Unexpected error occurred")}`,
      },
    });
  }
});
