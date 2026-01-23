import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Refresh Google OAuth token for a team
 * Can be called internally by automation-trigger or as a standalone function
 */
export async function refreshGoogleToken(teamId: string): Promise<{
  success: boolean;
  access_token?: string;
  error?: string;
}> {
  const supabase = getSupabaseClient();

  // Get current integration config
  const { data: integration, error: fetchError } = await supabase
    .from("team_integrations")
    .select("config")
    .eq("team_id", teamId)
    .eq("integration_type", "google_sheets")
    .single();

  if (fetchError || !integration) {
    return { success: false, error: "Integration not found" };
  }

  const config = integration.config as Record<string, any>;
  const refreshToken = config.refresh_token;

  if (!refreshToken) {
    return { success: false, error: "No refresh token available" };
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return { success: false, error: "Google OAuth not configured" };
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("[Refresh Google Token] Failed:", errorData);
      return { success: false, error: "Token refresh failed" };
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update stored tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        config: {
          ...config,
          access_token,
          expires_at: expiresAt,
          last_refreshed: new Date().toISOString(),
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "google_sheets");

    if (updateError) {
      console.error("[Refresh Google Token] Failed to store new token:", updateError);
      return { success: false, error: "Failed to store refreshed token" };
    }

    console.log(`[Refresh Google Token] Successfully refreshed token for team ${teamId}`);
    return { success: true, access_token };

  } catch (error) {
    console.error("[Refresh Google Token] Error:", error);
    return { success: false, error: "Unexpected error during refresh" };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await refreshGoogleToken(teamId);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in refresh-google-token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
