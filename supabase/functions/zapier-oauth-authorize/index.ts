import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Read from environment - DO NOT hardcode
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const ALLOWED_REDIRECT_URI = "https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/";
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// The static OAuth page hosted by the frontend app
const OAUTH_PAGE_URL = "https://code-hug-hub.lovable.app/zapier-oauth.html";

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

// Secure random code generation using crypto.getRandomValues
function generateSecureCode(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Handle POST request (form submission from static OAuth page)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { email, password, state, redirect_uri, client_id } = body;

      // Safe debug log - NEVER log secrets or passwords
      const maskedClientId = client_id ? `${client_id.substring(0, 12)}...` : 'null';
      console.log("OAuth authorize POST:", {
        has_email: !!email,
        has_password: !!password,
        has_state: !!state,
        received_redirect_uri: redirect_uri,
        received_client_id_masked: maskedClientId,
        env_client_id_exists: !!EXPECTED_CLIENT_ID,
        client_id_matches: client_id === EXPECTED_CLIENT_ID
      });

      // Validate client_id
      if (!client_id || client_id !== EXPECTED_CLIENT_ID) {
        console.error(`POST: Invalid client_id`);
        return new Response(
          JSON.stringify({ error: "Invalid client_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate redirect_uri
      if (!redirect_uri || redirect_uri !== ALLOWED_REDIRECT_URI) {
        console.error(`POST: Invalid redirect_uri. Expected: ${ALLOWED_REDIRECT_URI}, Got: ${redirect_uri}`);
        return new Response(
          JSON.stringify({ error: "Invalid redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = getSupabaseClient();

      // Authenticate user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error("Auth error:", authError?.message);
        return new Response(
          JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's team
      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("team_id, teams(id, name)")
        .eq("user_id", authData.user.id)
        .limit(1)
        .single();

      if (teamError || !teamMember) {
        console.error("Team lookup error:", teamError?.message);
        return new Response(
          JSON.stringify({ error: "No team found for this user" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const teamId = teamMember.team_id;

      // Generate secure authorization code
      const authCode = generateSecureCode(32);
      const authCodeExpiresAt = new Date(Date.now() + AUTH_CODE_TTL_MS).toISOString();

      // Store auth code in oauth_auth_codes table
      const { error: insertError } = await supabase
        .from("oauth_auth_codes")
        .insert({
          code: authCode,
          client_id: EXPECTED_CLIENT_ID,
          redirect_uri: redirect_uri,
          state: state || null,
          user_id: authData.user.id,
          team_id: teamId,
          user_email: email,
          expires_at: authCodeExpiresAt
        });

      if (insertError) {
        console.error("Insert auth code error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create authorization. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build redirect URL with auth code
      const redirectUrl = `${redirect_uri}?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(state || "")}`;

      console.log(`Auth code issued for team ${teamId}, redirecting to Zapier`);

      // Return JSON with redirect URL (the static page will handle the redirect)
      return new Response(
        JSON.stringify({ redirect_url: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("POST handler error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Handle GET request (OAuth authorize endpoint) - Redirect to static page
  if (req.method === "GET") {
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const responseType = url.searchParams.get("response_type");
    const state = url.searchParams.get("state") || "";

    // Safe debug log - mask client_id partially, never log secrets
    const maskedClientId = clientId ? `${clientId.substring(0, 12)}...` : 'null';
    console.log("OAuth authorize GET request - redirecting to static page:", { 
      received_client_id_masked: maskedClientId,
      received_redirect_uri: redirectUri,
      received_response_type: responseType,
      has_state: !!state,
      env_client_id_exists: !!EXPECTED_CLIENT_ID,
      client_id_matches: clientId === EXPECTED_CLIENT_ID
    });

    // Build redirect URL to static OAuth page with all params
    const staticPageUrl = new URL(OAUTH_PAGE_URL);
    if (clientId) staticPageUrl.searchParams.set("client_id", clientId);
    if (redirectUri) staticPageUrl.searchParams.set("redirect_uri", redirectUri);
    if (responseType) staticPageUrl.searchParams.set("response_type", responseType);
    if (state) staticPageUrl.searchParams.set("state", state);

    // Return 302 redirect to the static OAuth page
    const headers = new Headers();
    headers.set("Location", staticPageUrl.toString());
    headers.set("Cache-Control", "no-store");
    
    return new Response(null, { status: 302, headers });
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
