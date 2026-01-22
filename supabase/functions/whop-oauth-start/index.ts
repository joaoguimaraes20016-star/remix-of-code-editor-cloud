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
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Verify the user's JWT
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
        JSON.stringify({ error: "teamId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: membership, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Whop OAuth credentials
    const clientId = Deno.env.get("WHOP_CLIENT_ID");

    if (!clientId) {
      console.error("WHOP_CLIENT_ID not configured");
      return new Response(
        JSON.stringify({ error: "Whop OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Store state in team_integrations (upsert)
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "whop",
        is_connected: false,
        config: {
          state_token: stateToken,
          redirect_uri: redirectUri,
          initiated_at: new Date().toISOString(),
        },
      }, {
        onConflict: "team_id,integration_type",
      });

    if (upsertError) {
      console.error("Failed to store OAuth state:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to initiate OAuth" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Whop OAuth URL
    // Whop OAuth endpoint: https://whop.com/oauth
    const callbackUrl = `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/whop-oauth-callback`;
    
    // State includes teamId and token for verification
    const state = JSON.stringify({ teamId, stateToken, redirectUri });
    const encodedState = btoa(state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "offline",
      state: encodedState,
    });

    const authUrl = `https://whop.com/oauth?${params.toString()}`;

    console.log(`[whop-oauth-start] Generated auth URL for team ${teamId}`);

    return new Response(
      JSON.stringify({ authUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[whop-oauth-start] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
