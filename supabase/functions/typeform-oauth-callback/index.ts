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

  const supabase = getSupabaseClient();

  // Helper to build callback redirect
  async function buildCallbackRedirect(teamId: string | null, params: Record<string, string>): Promise<string> {
    let redirectUri = url.origin;

    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("config")
        .eq("team_id", teamId)
        .eq("integration_type", "typeform")
        .maybeSingle();

      if (integration?.config?.redirect_uri) {
        redirectUri = integration.config.redirect_uri;
      }
    }

    return buildRedirectUrl(`${redirectUri}/typeform-callback.html`, params);
  }

  // Handle OAuth error from Typeform
  if (error) {
    console.error("Typeform OAuth error:", error);
    const redirectUrl = await buildCallbackRedirect(null, { 
      success: "false", 
      error: error 
    });
    return Response.redirect(redirectUrl, 302);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing code or state");
    const redirectUrl = await buildCallbackRedirect(null, { 
      success: "false", 
      error: "Missing parameters" 
    });
    return Response.redirect(redirectUrl, 302);
  }

  try {
    // Parse state (format: teamId:stateToken)
    const [teamId, stateToken] = state.split(":");

    if (!teamId || !stateToken) {
      const redirectUrl = await buildCallbackRedirect(null, { 
        success: "false", 
        error: "Invalid state format" 
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "typeform")
      .maybeSingle();

    if (fetchError || !integration) {
      console.error("Failed to fetch integration:", fetchError);
      const redirectUrl = await buildCallbackRedirect(teamId, { 
        success: "false", 
        error: "Integration not found" 
      });
      return Response.redirect(redirectUrl, 302);
    }

    if (integration.config?.oauth_state !== stateToken) {
      console.error("State mismatch");
      const redirectUrl = await buildCallbackRedirect(teamId, { 
        success: "false", 
        error: "Invalid state" 
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("TYPEFORM_CLIENT_ID")!;
    const clientSecret = Deno.env.get("TYPEFORM_CLIENT_SECRET")!;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/typeform-oauth-callback`;

    const tokenResponse = await fetch("https://api.typeform.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      const redirectUrl = await buildCallbackRedirect(teamId, { 
        success: "false", 
        error: "Token exchange failed" 
      });
      return Response.redirect(redirectUrl, 302);
    }

    const tokens = await tokenResponse.json();

    // Fetch user info from Typeform
    const userResponse = await fetch("https://api.typeform.com/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    let userInfo = { email: null, alias: null };
    if (userResponse.ok) {
      userInfo = await userResponse.json();
    }

    // Update integration with tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        config: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          email: userInfo.email,
          alias: userInfo.alias,
          connected_at: new Date().toISOString(),
          redirect_uri: integration.config?.redirect_uri,
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "typeform");

    if (updateError) {
      console.error("Failed to update integration:", updateError);
      const redirectUrl = await buildCallbackRedirect(teamId, { 
        success: "false", 
        error: "Failed to save connection" 
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Success redirect
    const redirectUrl = await buildCallbackRedirect(teamId, { 
      success: "true",
      email: userInfo.email || "",
    });
    return Response.redirect(redirectUrl, 302);

  } catch (err) {
    console.error("Unexpected error:", err);
    const redirectUrl = await buildCallbackRedirect(null, { 
      success: "false", 
      error: "Unexpected error" 
    });
    return Response.redirect(redirectUrl, 302);
  }
});
