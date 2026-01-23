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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("[Zoom OAuth Start] User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
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

    console.log(`[Zoom OAuth Start] User ${userId} initiating Zoom OAuth for team ${teamId}`);

    // Verify user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      console.error("[Zoom OAuth Start] User not a team member:", membershipError);
      return new Response(
        JSON.stringify({ error: "Not a team member" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Zoom credentials from environment
    const clientId = Deno.env.get("ZOOM_CLIENT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!clientId) {
      console.error("[Zoom OAuth Start] Missing ZOOM_CLIENT_ID");
      return new Response(
        JSON.stringify({ error: "Zoom integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();
    const state = `${teamId}:${stateToken}`;

    // Store state and redirect URI in team_integrations config JSONB
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "zoom",
        config: {
          oauth_state: stateToken,
          redirect_uri: redirectUri,
          initiated_by: userId,
          initiated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "team_id,integration_type",
      });

    if (upsertError) {
      console.error("[Zoom OAuth Start] Failed to store state:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize OAuth" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Zoom OAuth URL
    const callbackUrl = `${supabaseUrl}/functions/v1/zoom-oauth-callback`;
    const scopes = "meeting:write meeting:read user:read";

    const authUrl = new URL("https://zoom.us/oauth/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("state", btoa(state));
    authUrl.searchParams.set("scope", scopes);

    console.log(`[Zoom OAuth Start] Generated auth URL for team ${teamId}`);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Zoom OAuth Start] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
