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
  const errorReason = url.searchParams.get("error_reason");
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
        .eq("integration_type", "meta")
        .single();
      
      if (data?.redirect_uri) {
        redirectUri = data.redirect_uri;
      }
    }
    
    return Response.redirect(buildRedirectUrl(`${redirectUri}/meta-callback.html`, params), 302);
  }

  // Handle OAuth error
  if (error) {
    console.error("Meta OAuth error:", error, errorReason, errorDescription);
    return buildCallbackRedirect(null, {
      success: "false",
      error: errorDescription || errorReason || error,
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
      .eq("integration_type", "meta")
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

    // Exchange code for access token
    const clientId = Deno.env.get("META_CLIENT_ID")!;
    const clientSecret = Deno.env.get("META_CLIENT_SECRET")!;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-oauth-callback`;

    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", callbackUrl);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return buildCallbackRedirect(teamId, {
        success: "false",
        error: tokenData.error?.message || "Failed to exchange code for token",
      });
    }

    const { access_token, expires_in } = tokenData;

    // Exchange short-lived token for long-lived token
    const longLivedUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", clientId);
    longLivedUrl.searchParams.set("client_secret", clientSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", access_token);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();

    const finalToken = longLivedData.access_token || access_token;
    const finalExpiresIn = longLivedData.expires_in || expires_in;

    // Fetch user info
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${finalToken}`
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
      Date.now() + (finalExpiresIn || 5184000) * 1000
    ).toISOString();

    // Update integration with tokens and user info
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        access_token: finalToken,
        token_expires_at: tokenExpiresAt,
        oauth_state: null,
        config: {
          user_id: userData.id,
          name: userData.name,
          email: userData.email,
          connected_at: new Date().toISOString(),
          scope: "ads_management,ads_read,business_management,leads_retrieval,pages_read_engagement",
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "meta");

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
      name: userData.name || "",
      email: userData.email || "",
    });
  } catch (error) {
    console.error("Error in meta-oauth-callback:", error);
    return buildCallbackRedirect(null, {
      success: "false",
      error: "Internal server error",
    });
  }
});
