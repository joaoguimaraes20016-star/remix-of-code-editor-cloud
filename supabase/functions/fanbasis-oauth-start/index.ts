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
    console.log("[fanbasis-oauth-start] Authorization header present:", !!authHeader);
    console.log("[fanbasis-oauth-start] All headers:", Object.fromEntries(req.headers.entries()));
    
    if (!authHeader) {
      console.error("[fanbasis-oauth-start] Missing authorization header");
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

    // Get Fanbasis OAuth credentials
    const clientId = Deno.env.get("FANBASIS_CLIENT_ID");

    if (!clientId) {
      console.error("FANBASIS_CLIENT_ID not configured");
      return new Response(
        JSON.stringify({ error: "Fanbasis OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a state token for CSRF protection
    const stateToken = crypto.randomUUID();

    // Generate PKCE code_verifier (43-128 characters, URL-safe)
    const codeVerifier = crypto.randomUUID() + crypto.randomUUID(); // ~72 chars

    // Generate code_challenge from code_verifier using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);
    const codeChallenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Store state and code_verifier in team_integrations (upsert)
    const { error: upsertError } = await supabase
      .from("team_integrations")
      .upsert({
        team_id: teamId,
        integration_type: "fanbasis",
        is_connected: false,
        config: {
          state_token: stateToken,
          code_verifier: codeVerifier,
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

    // Build Fanbasis OAuth URL with PKCE
    const callbackUrl = `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback`;
    
    // State includes teamId and token for verification
    const state = JSON.stringify({ teamId, stateToken, redirectUri });
    const encodedState = btoa(state);

    // Get Fanbasis base URL from environment or use default
    const fanbasisBaseUrl = Deno.env.get("FANBASIS_BASE_URL") || "https://fanbasis.com";

    const authUrl = new URL(`${fanbasisBaseUrl}/oauth/authorize`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("scope", "creator:api");
    authUrl.searchParams.set("state", encodedState);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    console.log(`[fanbasis-oauth-start] Generated auth URL for team ${teamId}`);

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[fanbasis-oauth-start] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
