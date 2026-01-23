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
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const supabase = getSupabaseClient();

  // Helper to build callback redirect URL
  async function buildCallbackRedirect(params: Record<string, string>, teamId?: string): Promise<string> {
    let redirectUri = "";
    
    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("redirect_uri")
        .eq("team_id", teamId)
        .eq("integration_type", "fathom")
        .single();
      
      redirectUri = integration?.redirect_uri || "";
    }
    
    if (!redirectUri) {
      redirectUri = Deno.env.get("SITE_URL") || "https://lovable.dev";
    }
    
    return buildRedirectUrl(`${redirectUri}/fathom-callback.html`, params);
  }

  // Handle OAuth errors from Fathom
  if (error) {
    console.error("Fathom OAuth error:", error);
    const redirectUrl = await buildCallbackRedirect({ 
      status: "error", 
      error: error 
    });
    return Response.redirect(redirectUrl, 302);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing code or state parameter");
    const redirectUrl = await buildCallbackRedirect({ 
      status: "error", 
      error: "missing_params" 
    });
    return Response.redirect(redirectUrl, 302);
  }

  // Parse state to get teamId and stateToken
  const [teamId, stateToken] = state.split(":");
  if (!teamId || !stateToken) {
    console.error("Invalid state format");
    const redirectUrl = await buildCallbackRedirect({ 
      status: "error", 
      error: "invalid_state" 
    });
    return Response.redirect(redirectUrl, 302);
  }

  try {
    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("oauth_state, redirect_uri")
      .eq("team_id", teamId)
      .eq("integration_type", "fathom")
      .single();

    if (fetchError || !integration) {
      console.error("Integration not found:", fetchError);
      const redirectUrl = await buildCallbackRedirect({ 
        status: "error", 
        error: "integration_not_found" 
      }, teamId);
      return Response.redirect(redirectUrl, 302);
    }

    if (integration.oauth_state !== stateToken) {
      console.error("State token mismatch");
      const redirectUrl = await buildCallbackRedirect({ 
        status: "error", 
        error: "state_mismatch" 
      }, teamId);
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("FATHOM_CLIENT_ID")!;
    const clientSecret = Deno.env.get("FATHOM_CLIENT_SECRET")!;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fathom-oauth-callback`;

    const tokenResponse = await fetch("https://fathom.video/external/v1/oauth2/token", {
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
      const redirectUrl = await buildCallbackRedirect({ 
        status: "error", 
        error: "token_exchange_failed" 
      }, teamId);
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Calculate token expiration
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Fetch user info from Fathom
    let userEmail = null;
    let userName = null;
    try {
      const userResponse = await fetch("https://fathom.video/external/v1/user", {
        headers: {
          "Authorization": `Bearer ${access_token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userEmail = userData.email || null;
        userName = userData.name || null;
      }
    } catch (userError) {
      console.warn("Failed to fetch Fathom user info:", userError);
    }

    // Update team_integrations with tokens and connection info
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        access_token: access_token,
        refresh_token: refresh_token || null,
        token_expires_at: expiresAt,
        is_connected: true,
        oauth_state: null,
        config: {
          user_email: userEmail,
          user_name: userName,
          connected_at: new Date().toISOString(),
          scope: "public_api",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "fathom");

    if (updateError) {
      console.error("Failed to update integration:", updateError);
      const redirectUrl = await buildCallbackRedirect({ 
        status: "error", 
        error: "update_failed" 
      }, teamId);
      return Response.redirect(redirectUrl, 302);
    }

    console.log("Fathom OAuth completed successfully for team:", teamId);

    const redirectUrl = await buildCallbackRedirect({ 
      status: "success",
      email: userEmail || "",
    }, teamId);
    return Response.redirect(redirectUrl, 302);

  } catch (err) {
    console.error("Unexpected error in Fathom OAuth callback:", err);
    const redirectUrl = await buildCallbackRedirect({ 
      status: "error", 
      error: "unexpected_error" 
    }, teamId);
    return Response.redirect(redirectUrl, 302);
  }
});
