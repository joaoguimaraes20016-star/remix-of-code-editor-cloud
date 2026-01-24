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

    // Exchange code for tokens using Business API
    const clientId = Deno.env.get("TIKTOK_CLIENT_ID");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");

    const tokenResponse = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: clientId,
        secret: clientSecret,
        auth_code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      console.error("TikTok token exchange error:", tokenData);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: tokenData.message || "Token exchange failed",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const { access_token, refresh_token, refresh_token_expires_in } = tokenData.data;
    const advertiserIds = tokenData.data.advertiser_ids || [];

    // Fetch advertiser info for connected ad accounts
    let advertiserInfo: Array<{ advertiser_id: string; advertiser_name?: string }> = [];
    if (advertiserIds.length > 0) {
      try {
        const advertiserResponse = await fetch(
          `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=${JSON.stringify(advertiserIds)}`,
          {
            headers: {
              "Access-Token": access_token,
            },
          }
        );
        const advertiserData = await advertiserResponse.json();
        if (advertiserData.code === 0 && advertiserData.data?.list) {
          advertiserInfo = advertiserData.data.list.map((adv: { advertiser_id: string; advertiser_name?: string }) => ({
            advertiser_id: adv.advertiser_id,
            advertiser_name: adv.advertiser_name,
          }));
        }
      } catch (advError) {
        console.error("Error fetching TikTok advertiser info:", advError);
      }
    }

    // Calculate token expiration (Business API returns seconds until expiry)
    const tokenExpiresAt = new Date(Date.now() + (refresh_token_expires_in || 86400) * 1000).toISOString();

    // Update integration with tokens and advertiser info
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        is_connected: true,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt,
        oauth_state: null,
        config: {
          advertiser_ids: advertiserIds,
          advertisers: advertiserInfo,
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
    const advertiserName = advertiserInfo[0]?.advertiser_name || `${advertiserIds.length} Ad Account(s)`;
    const redirectUrl = await buildCallbackRedirect(teamId, {
      success: "true",
      username: advertiserName,
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
