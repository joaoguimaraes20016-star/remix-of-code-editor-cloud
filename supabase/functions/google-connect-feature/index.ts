import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Feature-specific scopes
const FEATURE_SCOPES: Record<string, string[]> = {
  signin: [], // Master identity - no additional scopes beyond identity
  sheets: ["https://www.googleapis.com/auth/spreadsheets"],
  calendar: ["https://www.googleapis.com/auth/calendar"],
  drive: ["https://www.googleapis.com/auth/drive.readonly"],
  forms: ["https://www.googleapis.com/auth/forms.responses.readonly"],
};

// Base identity scopes (always included on first connection)
const IDENTITY_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

type GoogleFeature = keyof typeof FEATURE_SCOPES;

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // Get authorization header to verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { teamId, feature } = await req.json();
    
    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!feature || !FEATURE_SCOPES[feature as GoogleFeature]) {
      return new Response(
        JSON.stringify({ error: "Invalid feature. Must be one of: sheets, calendar, drive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this team" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already a unified Google integration
    const { data: existingIntegration } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "google")
      .single();

    const hasExistingConnection = !!existingIntegration?.config?.refresh_token;

    // Get Google OAuth credentials from environment
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state token for CSRF protection
    const stateToken = crypto.randomUUID();
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Determine scopes to request
    // If first connection: identity + feature scopes
    // If incremental: just the new feature scope (Google will merge with existing)
    const featureScopes = FEATURE_SCOPES[feature as GoogleFeature];
    const requestedScopes = hasExistingConnection
      ? featureScopes
      : [...IDENTITY_SCOPES, ...featureScopes];

    // Store state token in team_integrations for verification during callback
    const integrationConfig = {
      state_token: stateToken,
      redirect_uri: redirectUri,
      initiated_by: user.id,
      initiated_at: new Date().toISOString(),
      requested_feature: feature,
      // Preserve existing config if incremental auth
      ...(hasExistingConnection ? existingIntegration.config : {}),
    };

    const { error: storeError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "google",
        config: integrationConfig,
      }, {
        onConflict: "team_id,integration_type",
      });

    if (storeError) {
      console.error("Error storing state token:", storeError);
      return new Response(
        JSON.stringify({ error: "Failed to initiate OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Google OAuth URL
    const state = JSON.stringify({ teamId, stateToken, feature });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", requestedScopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    
    // Include granted scopes for incremental auth
    if (hasExistingConnection) {
      authUrl.searchParams.set("include_granted_scopes", "true");
    }
    
    // Force consent to get refresh token on first connection
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", btoa(state));

    console.log(`[Google Connect Feature] Generated auth URL for team ${teamId}, feature: ${feature}, incremental: ${hasExistingConnection}`);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in google-connect-feature:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
