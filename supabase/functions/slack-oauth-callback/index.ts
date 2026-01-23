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
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

  // Helper function to build redirect URL
  // Uses the stored redirect_uri (app domain) for proper postMessage communication
  const buildCallbackRedirect = (baseUri: string | null | undefined, params: Record<string, string>): string => {
    // If we have the app's redirect_uri, use it (this is the user's app domain)
    if (baseUri) {
      const callbackUrl = baseUri.endsWith('/') ? `${baseUri}slack-callback.html` : `${baseUri}/slack-callback.html`;
      return buildRedirectUrl(callbackUrl, params);
    }
    // Fallback: redirect to a generic error page or use project URL
    // This should rarely happen as redirect_uri is set during OAuth start
    console.warn("[Slack OAuth] No redirect_uri available, using fallback");
    return buildRedirectUrl("https://code-hug-hub.lovable.app/slack-callback.html", params);
  };

  // Variable to store redirect_uri once we fetch it
  let appRedirectUri: string | null = null;

  try {
    // For early errors (before we can fetch redirect_uri from DB), we need to parse state
    // to get teamId so we can look up the redirect_uri
    let teamId: string | null = null;
    let stateToken: string | null = null;

    if (state) {
      const parts = state.split(":");
      teamId = parts[0] || null;
      stateToken = parts[1] || null;
    }

    // Try to fetch redirect_uri early if we have teamId
    if (teamId) {
      const supabase = getSupabaseClient();
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "slack")
        .single();
      
      if (integration?.config?.redirect_uri) {
        appRedirectUri = integration.config.redirect_uri;
        console.log("[Slack OAuth] Retrieved redirect_uri:", appRedirectUri);
      }
    }

    // Handle OAuth errors from Slack
    if (error) {
      console.error("[Slack OAuth] Error from Slack:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error }),
        },
      });
    }

    if (!code || !state) {
      console.error("[Slack OAuth] Missing code or state");
      return new Response(null, {
        status: 302,
        headers: {
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "Missing authorization code" }),
        },
      });
    }

    if (!teamId || !stateToken) {
      console.error("[Slack OAuth] Invalid state format");
      return new Response(null, {
        status: 302,
        headers: {
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "Invalid state" }),
        },
      });
    }

    const supabase = getSupabaseClient();

    // Verify state token (re-fetch to ensure we have latest data)
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
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "OAuth session not found" }),
        },
      });
    }

    const storedState = integration.config?.oauth_state;
    const redirectUri = integration.config?.redirect_uri;
    
    // Update appRedirectUri if we got it from the fresh fetch
    if (redirectUri) {
      appRedirectUri = redirectUri;
    }

    if (storedState !== stateToken) {
      console.error("[Slack OAuth] State mismatch. Expected:", storedState, "Got:", stateToken);
      return new Response(null, {
        status: 302,
        headers: {
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "State mismatch - possible CSRF attack" }),
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
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "Slack integration not configured" }),
        },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/slack-oauth-callback`;
    console.log("[Slack OAuth] Exchanging code for token with callback URL:", callbackUrl);

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
    console.log("[Slack OAuth] Token response ok:", tokenData.ok, "error:", tokenData.error);

    if (!tokenData.ok) {
      console.error("[Slack OAuth] Token exchange failed:", tokenData.error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: tokenData.error || "Token exchange failed" }),
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
          Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "Failed to save connection" }),
        },
      });
    }

    console.log(`[Slack OAuth] Successfully connected workspace "${tokenData.team?.name}" for team ${teamId}`);
    console.log("[Slack OAuth] Redirecting to:", buildCallbackRedirect(appRedirectUri, { success: "true", workspace: tokenData.team?.name || "Slack" }));

    // Redirect to callback page with success
    return new Response(null, {
      status: 302,
      headers: {
        Location: buildCallbackRedirect(appRedirectUri, { success: "true", workspace: tokenData.team?.name || "Slack" }),
      },
    });

  } catch (err) {
    console.error("[Slack OAuth] Unexpected error:", err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: buildCallbackRedirect(appRedirectUri, { success: "false", error: "Unexpected error occurred" }),
      },
    });
  }
});
