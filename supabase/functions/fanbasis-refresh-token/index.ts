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
    const { teamId } = await req.json();

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

    // Fetch current integration
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "fanbasis")
      .eq("is_connected", true)
      .single();

    if (fetchError || !integration) {
      return new Response(
        JSON.stringify({ error: "Fanbasis integration not found or not connected" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = integration.config as Record<string, unknown>;
    const refreshToken = config.refresh_token as string;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: "No refresh token available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fanbasis credentials
    const clientId = Deno.env.get("FANBASIS_CLIENT_ID");
    const clientSecret = Deno.env.get("FANBASIS_CLIENT_SECRET");
    const fanbasisBaseUrl = Deno.env.get("FANBASIS_BASE_URL") || "https://fanbasis.com";

    if (!clientId || !clientSecret) {
      console.error("FANBASIS_CLIENT_ID or FANBASIS_CLIENT_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Fanbasis OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh the token
    console.log(`[fanbasis-refresh-token] Refreshing token for team ${teamId}`);

    const tokenResponse = await fetch(`${fanbasisBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[fanbasis-refresh-token] Token refresh failed:", errorBody);
      
      // If refresh token is invalid, mark integration as disconnected
      if (tokenResponse.status === 401 || tokenResponse.status === 400) {
        await supabase
          .from("team_integrations")
          .update({
            is_connected: false,
            config: {
              ...config,
              disconnected_at: new Date().toISOString(),
              disconnect_reason: "refresh_token_invalid",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", teamId)
          .eq("integration_type", "fanbasis");

        return new Response(
          JSON.stringify({ 
            error: "Refresh token invalid or expired. Please reconnect your Fanbasis account.",
            reconnect_required: true 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Token refresh failed: ${errorBody.substring(0, 100)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken; // Some providers don't return new refresh token
    const expiresIn = tokenData.expires_in;
    const scope = tokenData.scope;

    // Calculate expiration timestamp
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    // Update stored tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        config: {
          ...config,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_at: expiresAt,
          scope: scope,
          last_refreshed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", teamId)
      .eq("integration_type", "fanbasis");

    if (updateError) {
      console.error("[fanbasis-refresh-token] Failed to update tokens:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save refreshed tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[fanbasis-refresh-token] Successfully refreshed token for team ${teamId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        expires_at: expiresAt,
        scope: scope 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[fanbasis-refresh-token] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
