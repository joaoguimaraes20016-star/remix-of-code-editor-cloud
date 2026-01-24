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
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const { teamId, redirectUri } = await req.json();
    
    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: membership, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "User is not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get TikTok OAuth credentials
    const clientId = Deno.env.get("TIKTOK_CLIENT_ID");
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "TikTok client ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Store state in team_integrations
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "tiktok",
        oauth_state: stateToken,
        redirect_uri: redirectUri || null,
        is_connected: false,
        config: {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "team_id,integration_type",
      });

    if (upsertError) {
      console.error("Error storing OAuth state:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build TikTok OAuth URL
    // TikTok uses a specific authorization endpoint
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tiktok-oauth-callback`;
    const state = `${teamId}:${stateToken}`;
    
    // TikTok OAuth scopes
    const scopes = ["user.info.basic", "user.info.profile"];
    
    const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authUrl.searchParams.set("client_key", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(","));
    authUrl.searchParams.set("state", state);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tiktok-oauth-start:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
