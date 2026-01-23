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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseClient();

    // Verify the JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { teamId, redirectUri } = await req.json();

    if (!teamId) {
      return new Response(JSON.stringify({ error: "Missing teamId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a member of the team
    const { data: membership, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(JSON.stringify({ error: "Not a team member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Discord credentials
    const discordClientId = Deno.env.get("DISCORD_CLIENT_ID");
    if (!discordClientId) {
      console.error("DISCORD_CLIENT_ID not configured");
      return new Response(JSON.stringify({ error: "Discord not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Store state token and redirect URI in team_integrations
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "discord",
        oauth_state: stateToken,
        redirect_uri: redirectUri,
        is_connected: false,
        config: {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "team_id,integration_type",
      });

    if (upsertError) {
      console.error("Failed to store OAuth state:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to initiate OAuth" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Discord OAuth URL
    // Bot permissions: VIEW_CHANNEL + SEND_MESSAGES + EMBED_LINKS + ATTACH_FILES
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-oauth-callback`;
    const scopes = "bot applications.commands";
    const permissions = "52224"; // VIEW_CHANNEL (1024) + SEND_MESSAGES (2048) + EMBED_LINKS (16384) + ATTACH_FILES (32768)

    const authUrl = new URL("https://discord.com/api/oauth2/authorize");
    authUrl.searchParams.set("client_id", discordClientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("permissions", permissions);
    authUrl.searchParams.set("state", `${teamId}:${stateToken}`);

    console.log("Generated Discord auth URL for team:", teamId);

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Discord OAuth start error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
