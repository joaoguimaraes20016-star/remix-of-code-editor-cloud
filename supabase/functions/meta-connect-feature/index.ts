import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Feature-specific scopes mapping
const FEATURE_SCOPES: Record<string, string[]> = {
  ads_reporting: ["ads_read"],
  lead_forms: ["leads_retrieval", "pages_read_engagement", "pages_manage_metadata"],
  capi: ["ads_management"],
};

type MetaFeature = keyof typeof FEATURE_SCOPES;

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

Deno.serve(async (req) => {
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

    const supabase = getSupabaseClient();

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { teamId, feature, redirectUri } = await req.json();

    if (!teamId || !feature) {
      return new Response(
        JSON.stringify({ error: "Missing teamId or feature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate feature
    if (!FEATURE_SCOPES[feature as MetaFeature]) {
      return new Response(
        JSON.stringify({ error: `Invalid feature: ${feature}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: teamMember, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userData.user.id)
      .single();

    if (memberError || !teamMember) {
      return new Response(
        JSON.stringify({ error: "Not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Meta is already connected (Phase 1 complete)
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("is_connected, config")
      .eq("team_id", teamId)
      .eq("integration_type", "meta")
      .single();

    if (integrationError || !integration?.is_connected) {
      return new Response(
        JSON.stringify({ error: "Meta account not connected. Please connect your Meta account first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Meta credentials
    const clientId = Deno.env.get("META_CLIENT_ID");
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Meta integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Get existing granted scopes
    const config = integration.config as Record<string, any> || {};
    const existingScopes = config.granted_scopes || ["public_profile", "email"];
    
    // Get new scopes for this feature
    const featureScopes = FEATURE_SCOPES[feature as MetaFeature];
    
    // Combine all scopes (existing + new)
    const allScopes = [...new Set([...existingScopes, ...featureScopes])];

    // Update state token and feature request in database
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        oauth_state: stateToken,
        redirect_uri: redirectUri,
        config: {
          ...config,
          pending_feature: feature,
          pending_scopes: featureScopes,
        },
      })
      .eq("team_id", teamId)
      .eq("integration_type", "meta");

    if (updateError) {
      console.error("Error storing state:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Meta OAuth URL with incremental authorization
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-feature-callback`;
    
    // State includes teamId and feature for callback routing
    const state = btoa(`${teamId}:${stateToken}:${feature}`);

    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", allScopes.join(","));
    authUrl.searchParams.set("response_type", "code");
    // Use auth_type=rerequest to request only new permissions
    authUrl.searchParams.set("auth_type", "rerequest");

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in meta-connect-feature:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
