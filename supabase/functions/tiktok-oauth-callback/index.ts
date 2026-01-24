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
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
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
  const errorDescription = url.searchParams.get("error_description");

  const supabase = getSupabaseClient();

  // Helper to build callback redirect
  async function buildCallbackRedirect(teamId: string | null, params: Record<string, string>): Promise<string> {
    let baseRedirectUri = "/tiktok-callback.html";
    
    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("redirect_uri")
        .eq("team_id", teamId)
        .eq("integration_type", "tiktok")
        .single();
      
      if (integration?.redirect_uri) {
        baseRedirectUri = `${integration.redirect_uri}/tiktok-callback.html`;
      }
    }
    
    return buildRedirectUrl(baseRedirectUri, params);
  }

  try {
    // Handle OAuth error
    if (error) {
      console.error("TikTok OAuth error:", error, errorDescription);
      const redirectUrl = await buildCallbackRedirect(null, {
        success: "false",
        error: errorDescription || error,
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Validate required params
    if (!code || !state) {
      const redirectUrl = await buildCallbackRedirect(null, {
        success: "false",
        error: "Missing code or state parameter",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Parse state
    const stateParts = state.split(":");
    if (stateParts.length !== 2) {
      const redirectUrl = await buildCallbackRedirect(null, {
        success: "false",
        error: "Invalid state format",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const [teamId, stateToken] = stateParts;

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("oauth_state, redirect_uri")
      .eq("team_id", teamId)
      .eq("integration_type", "tiktok")
      .single();

    if (fetchError || !integration) {
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "Integration not found",
      });
      return Response.redirect(redirectUrl, 302);
    }

    if (integration.oauth_state !== stateToken) {
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "State mismatch - possible CSRF attack",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("TIKTOK_CLIENT_ID");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tiktok-oauth-callback`;

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("TikTok token exchange error:", tokenData);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: tokenData.error_description || tokenData.error || "Token exchange failed",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    // Fetch user info
    let userInfo: { display_name?: string; avatar_url?: string; username?: string } = {};
    try {
      const userResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      const userData = await userResponse.json();
      if (userData.data?.user) {
        userInfo = {
          display_name: userData.data.user.display_name,
          avatar_url: userData.data.user.avatar_url,
          username: userData.data.user.username,
        };
      }
    } catch (userError) {
      console.error("Error fetching TikTok user info:", userError);
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update integration with tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt,
        oauth_state: null,
        config: {
          open_id: open_id,
          display_name: userInfo.display_name,
          username: userInfo.username,
          avatar_url: userInfo.avatar_url,
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "tiktok");

    if (updateError) {
      console.error("Error updating integration:", updateError);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "Failed to save connection",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Redirect to success page
    const redirectUrl = await buildCallbackRedirect(teamId, {
      success: "true",
      username: userInfo.username || userInfo.display_name || "TikTok User",
    });
    return Response.redirect(redirectUrl, 302);
  } catch (err) {
    console.error("Error in tiktok-oauth-callback:", err);
    const redirectUrl = await buildCallbackRedirect(null, {
      success: "false",
      error: "Internal server error",
    });
    return Response.redirect(redirectUrl, 302);
  }
});
