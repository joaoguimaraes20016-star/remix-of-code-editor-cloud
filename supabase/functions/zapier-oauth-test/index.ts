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
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const supabase = getSupabaseClient();

    // Look up the team_integrations record with matching access_token
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("team_id, is_connected, token_expires_at, created_at")
      .eq("integration_type", "zapier")
      .eq("access_token", accessToken)
      .single();

    if (integrationError || !integration) {
      console.error("Integration lookup failed:", integrationError);
      return new Response(
        JSON.stringify({ error: "Invalid access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if connected
    if (!integration.is_connected) {
      return new Response(
        JSON.stringify({ error: "Integration is not connected" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check token expiry
    if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Access token has expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch team name
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", integration.team_id)
      .single();

    if (teamError || !team) {
      console.error("Team lookup failed:", teamError);
      return new Response(
        JSON.stringify({ error: "Team not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return team info for Zapier connection label
    return new Response(
      JSON.stringify({
        id: team.id,
        name: team.name,
        connected_at: integration.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in zapier-oauth-test:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
