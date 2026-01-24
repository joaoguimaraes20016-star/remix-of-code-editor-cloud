import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function jsonError(error: string, status: number): Response {
  return new Response(
    JSON.stringify({ error }),
    { status, headers: corsHeaders }
  );
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonError("Method not allowed", 405);
  }

  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return jsonError("Missing or invalid Authorization header", 401);
    }

    const accessToken = authHeader.replace("Bearer ", "");
    
    if (!accessToken || accessToken.length < 10) {
      console.error("Invalid access token format");
      return jsonError("Invalid access token", 401);
    }

    const supabase = getSupabaseClient();

    // Look up the team_integrations record with matching access_token
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("team_id, is_connected, token_expires_at, config, created_at")
      .eq("integration_type", "zapier")
      .eq("access_token", accessToken)
      .single();

    if (integrationError || !integration) {
      console.error("Integration lookup failed:", integrationError?.message);
      return jsonError("Invalid access token", 401);
    }

    // Check if connected
    if (!integration.is_connected) {
      console.error("Integration is not connected");
      return jsonError("Integration is not connected", 401);
    }

    // Check token expiry
    if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
      console.error("Access token has expired");
      return jsonError("Access token has expired", 401);
    }

    // Get config data
    const config = integration.config as Record<string, unknown> || {};
    const userEmail = config.user_email as string || "";
    const teamName = config.team_name as string || "";
    const connectedAt = config.connected_at as string || integration.created_at;

    // Fetch team info
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", integration.team_id)
      .single();

    if (teamError || !team) {
      console.error("Team lookup failed:", teamError?.message);
      return jsonError("Team not found", 404);
    }

    console.log(`Test authentication successful for team: ${team.id}`);

    // Return user/team info for Zapier connection label
    // Zapier expects 'id' and 'email' fields for the connection label
    return new Response(
      JSON.stringify({
        id: team.id,
        email: userEmail,
        name: teamName || team.name,
        team_name: team.name,
        connected_at: connectedAt,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error in zapier-oauth-test:", error);
    return jsonError("Internal server error", 500);
  }
});
