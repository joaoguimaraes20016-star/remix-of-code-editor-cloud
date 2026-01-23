import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Required scopes for each feature
const FEATURE_SCOPES: Record<string, string[]> = {
  lead_forms: ["pages_show_list", "pages_read_engagement", "leads_retrieval"],
  ads_reporting: ["ads_read"],
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
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { teamId, feature } = await req.json();

    if (!teamId || !feature) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing teamId or feature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate feature
    if (!FEATURE_SCOPES[feature]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid feature" }),
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
        JSON.stringify({ success: false, error: "Not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Meta integration with access token
    const { data: integration, error: integrationError } = await supabase
      .from("team_integrations")
      .select("access_token, config, is_connected")
      .eq("team_id", teamId)
      .eq("integration_type", "meta")
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ success: false, error: "Meta integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!integration.is_connected || !integration.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Meta account not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if feature is already enabled
    const config = (integration.config as Record<string, any>) || {};
    const enabledFeatures = config.enabled_features || {};
    
    if (enabledFeatures[feature]) {
      return new Response(
        JSON.stringify({ success: true, alreadyEnabled: true, feature }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's granted permissions from Meta
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${integration.access_token}`
    );
    
    if (!permissionsResponse.ok) {
      const errorData = await permissionsResponse.json();
      console.error("Meta permissions API error:", errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to check Meta permissions",
          details: errorData.error?.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const permissionsData = await permissionsResponse.json();
    const grantedPermissions = new Set(
      permissionsData.data
        ?.filter((p: { status: string }) => p.status === "granted")
        .map((p: { permission: string }) => p.permission) || []
    );

    console.log("Granted permissions:", Array.from(grantedPermissions));

    // Check if all required scopes for the feature are granted
    const requiredScopes = FEATURE_SCOPES[feature as MetaFeature];
    const missingScopes = requiredScopes.filter(scope => !grantedPermissions.has(scope));

    console.log(`Feature: ${feature}, Required: ${requiredScopes}, Missing: ${missingScopes}`);

    if (missingScopes.length > 0) {
      // User doesn't have required permissions
      return new Response(
        JSON.stringify({
          success: false,
          reason: "app_review_required",
          missingScopes,
          message: "This feature requires Meta App Review approval. Available for app admins/testers in Dev Mode.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All required permissions are granted - enable the feature
    const updatedEnabledFeatures = {
      ...enabledFeatures,
      [feature]: true,
    };

    const updatedConfig = {
      ...config,
      enabled_features: updatedEnabledFeatures,
      [`${feature}_enabled_at`]: new Date().toISOString(),
      granted_scopes: Array.from(grantedPermissions),
    };

    // Update phase if this is first business feature enabled
    if (config.phase === "identity_connected") {
      updatedConfig.phase = "business_connected";
    }

    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({ config: updatedConfig })
      .eq("team_id", teamId)
      .eq("integration_type", "meta");

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save feature status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, feature }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in meta-enable-feature:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
