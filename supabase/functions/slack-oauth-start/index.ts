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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const supabase = getSupabaseClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { teamId, redirectUri } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a team member
    const { data: membership, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Slack OAuth credentials
    const clientId = Deno.env.get("SLACK_CLIENT_ID");
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Slack integration not configured. Please add SLACK_CLIENT_ID secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();
    
    // Build the redirect URI for OAuth callback
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const callbackUrl = `${supabaseUrl}/functions/v1/slack-oauth-callback`;

    // Store state token and redirect URI in team_integrations
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "slack",
        config: {
          oauth_state: stateToken,
          redirect_uri: redirectUri || `${new URL(req.url).origin}`,
          initiated_at: new Date().toISOString(),
          initiated_by: user.id,
        },
      }, {
        onConflict: "team_id,integration_type",
      });

    if (upsertError) {
      console.error("Failed to store OAuth state:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to initiate OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Slack OAuth URL
    // Scopes: chat:write for sending messages, channels:read for listing channels
    const scopes = "chat:write,channels:read,groups:read,users:read";
    
    const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackAuthUrl.searchParams.set("client_id", clientId);
    slackAuthUrl.searchParams.set("scope", scopes);
    slackAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    slackAuthUrl.searchParams.set("state", `${teamId}:${stateToken}`);

    console.log(`[Slack OAuth] Initiated for team ${teamId} by user ${user.id}`);

    return new Response(
      JSON.stringify({ authUrl: slackAuthUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Slack OAuth Start] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
