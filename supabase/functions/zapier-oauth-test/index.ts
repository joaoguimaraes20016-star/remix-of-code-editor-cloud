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

    // Safe debug log
    console.log("OAuth test request:", {
      has_token: !!accessToken,
      token_prefix: accessToken.substring(0, 4)
    });

    const supabase = getSupabaseClient();

    // Look up the token in oauth_tokens table
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("access_token", accessToken)
      .is("revoked_at", null)
      .single();

    if (tokenError || !tokenRecord) {
      console.error("Token lookup failed:", tokenError?.message);
      return jsonError("Invalid access token", 401);
    }

    // Check token expiry
    if (new Date(tokenRecord.expires_at) < new Date()) {
      console.error("Access token has expired");
      return jsonError("Access token has expired", 401);
    }

    console.log(`Test authentication successful for team: ${tokenRecord.team_id}`);

    // Return user/team info for Zapier connection label
    // Zapier expects 'id' and 'email' fields for the connection label
    return new Response(
      JSON.stringify({
        id: tokenRecord.team_id || tokenRecord.user_id,
        email: tokenRecord.user_email || "",
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error in zapier-oauth-test:", error);
    return jsonError("Internal server error", 500);
  }
});
