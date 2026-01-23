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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const url = new URL(req.url);
  
  // Parse OAuth response
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Helper to build callback redirect
  async function buildCallbackRedirect(
    teamId: string | null,
    params: Record<string, string>
  ): Promise<Response> {
    let redirectUri = "https://code-hug-hub.lovable.app";
    
    if (teamId) {
      const { data } = await supabase
        .from("team_integrations")
        .select("redirect_uri")
        .eq("team_id", teamId)
        .eq("integration_type", "google_ads")
        .single();
      
      if (data?.redirect_uri) {
        redirectUri = data.redirect_uri;
      }
    }
    
    return Response.redirect(buildRedirectUrl(`${redirectUri}/google-ads-callback.html`, params), 302);
  }

  // Handle OAuth error
  if (error) {
    console.error("Google Ads OAuth error:", error, errorDescription);
    return buildCallbackRedirect(null, {
      success: "false",
      error: errorDescription || error,
    });
  }

  // Validate required params
  if (!code || !state) {
    return buildCallbackRedirect(null, {
      success: "false",
      error: "Missing code or state parameter",
    });
  }

  try {
    // Decode state
    let teamId: string;
    let stateToken: string;
    
    try {
      const decoded = atob(state);
      [teamId, stateToken] = decoded.split(":");
    } catch {
      return buildCallbackRedirect(null, {
        success: "false",
        error: "Invalid state parameter",
      });
    }

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("oauth_state, redirect_uri")
      .eq("team_id", teamId)
      .eq("integration_type", "google_ads")
      .single();

    if (fetchError || !integration) {
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: "Integration not found",
      });
    }

    if (integration.oauth_state !== stateToken) {
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: "Invalid state token",
      });
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-ads-oauth-callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: tokenData.error_description || tokenData.error || "Failed to exchange code for token",
      });
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // Fetch user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const userData = await userResponse.json();

    if (!userResponse.ok || userData.error) {
      console.error("User info error:", userData);
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: "Failed to fetch user info",
      });
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(
      Date.now() + (expires_in || 3600) * 1000
    ).toISOString();

    // Update integration with tokens and user info
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt,
        oauth_state: null,
        config: {
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          connected_at: new Date().toISOString(),
          scope: scope,
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "google_ads");

    if (updateError) {
      console.error("Update error:", updateError);
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: "Failed to save integration",
      });
    }

    // Success redirect
    return buildCallbackRedirect(teamId, {
      success: "true",
      email: userData.email || "",
    });
  } catch (error) {
    console.error("Error in google-ads-oauth-callback:", error);
    return buildCallbackRedirect(null, {
      success: "false",
      error: "Internal server error",
    });
  }
});
