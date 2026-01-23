import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

const buildRedirectUrl = (baseUri: string, params: Record<string, string>) => {
  const url = new URL(baseUri);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const guildId = url.searchParams.get("guild_id");

  const supabase = getSupabaseClient();

  // Helper to build callback redirect
  const buildCallbackRedirect = async (teamId: string | null, params: Record<string, string>) => {
    let redirectBase = Deno.env.get("SUPABASE_URL") || "";

    if (teamId) {
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("redirect_uri")
        .eq("team_id", teamId)
        .eq("integration_type", "discord")
        .maybeSingle();

      if (integration?.redirect_uri) {
        redirectBase = integration.redirect_uri;
      }
    }

    return buildRedirectUrl(`${redirectBase}/discord-callback.html`, params);
  };

  // Handle error from Discord
  if (error) {
    console.error("Discord OAuth error:", error);
    const teamId = state?.split(":")[0] || null;
    const redirectUrl = await buildCallbackRedirect(teamId, {
      success: "false",
      error: error,
    });
    return Response.redirect(redirectUrl, 302);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error("Missing code or state");
    const redirectUrl = await buildCallbackRedirect(null, {
      success: "false",
      error: "missing_params",
    });
    return Response.redirect(redirectUrl, 302);
  }

  try {
    // Parse state
    const [teamId, stateToken] = state.split(":");

    if (!teamId || !stateToken) {
      console.error("Invalid state format");
      const redirectUrl = await buildCallbackRedirect(null, {
        success: "false",
        error: "invalid_state",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Verify state token
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("oauth_state, redirect_uri")
      .eq("team_id", teamId)
      .eq("integration_type", "discord")
      .maybeSingle();

    if (fetchError || !integration) {
      console.error("Integration not found:", fetchError);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "integration_not_found",
      });
      return Response.redirect(redirectUrl, 302);
    }

    if (integration.oauth_state !== stateToken) {
      console.error("State mismatch");
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "state_mismatch",
      });
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange code for tokens
    const discordClientId = Deno.env.get("DISCORD_CLIENT_ID")!;
    const discordClientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-oauth-callback`;

    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: discordClientId,
        client_secret: discordClientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "token_exchange_failed",
      });
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, token_type } = tokenData;

    // Get guild info if guild_id is provided
    let guildName = null;
    if (guildId) {
      try {
        const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
          headers: {
            Authorization: `Bot ${access_token}`,
          },
        });
        if (guildResponse.ok) {
          const guildData = await guildResponse.json();
          guildName = guildData.name;
        }
      } catch (e) {
        console.log("Could not fetch guild info:", e);
      }
    }

    // Get bot user info
    let botUserId = null;
    try {
      const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        botUserId = userData.id;
      }
    } catch (e) {
      console.log("Could not fetch bot user info:", e);
    }

    // Update integration with tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        access_token: access_token,
        refresh_token: refresh_token || null,
        token_expires_at: expires_in 
          ? new Date(Date.now() + expires_in * 1000).toISOString() 
          : null,
        is_connected: true,
        oauth_state: null,
        config: {
          guild_id: guildId,
          guild_name: guildName,
          bot_user_id: botUserId,
          connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "discord");

    if (updateError) {
      console.error("Failed to update integration:", updateError);
      const redirectUrl = await buildCallbackRedirect(teamId, {
        success: "false",
        error: "update_failed",
      });
      return Response.redirect(redirectUrl, 302);
    }

    console.log("Discord connected successfully for team:", teamId, "guild:", guildId);

    // Redirect to success page
    const redirectUrl = await buildCallbackRedirect(teamId, {
      success: "true",
      guild: guildName || guildId || "Discord Server",
    });
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error("Discord OAuth callback error:", error);
    const redirectUrl = await buildCallbackRedirect(null, {
      success: "false",
      error: "unexpected_error",
    });
    return Response.redirect(redirectUrl, 302);
  }
});
