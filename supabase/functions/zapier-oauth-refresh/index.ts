import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Constants - must match token endpoint
const EXPECTED_CLIENT_ID = "stackit_zapier_client_9f3a7c2d1b84e6f0";
const EXPECTED_CLIENT_SECRET = "sk_stackit_zapier_live_7c1f93e4a2d8b6f059e1c4a9d3b2f8aa";
const ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour

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

// Secure random token generation using crypto.getRandomValues
function generateSecureToken(prefix: string, length: number = 40): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${token}`;
}

function jsonError(error: string, description: string, status: number): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    { status, headers: corsHeaders }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("invalid_request", "Method not allowed", 405);
  }

  try {
    // Parse request body (support both form-urlencoded and JSON)
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    } else if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    const { grant_type, refresh_token, client_id, client_secret } = body;

    console.log("Refresh request:", { grant_type, hasRefreshToken: !!refresh_token });

    // Validate grant_type
    if (grant_type !== "refresh_token") {
      return jsonError("unsupported_grant_type", "Only refresh_token grant type is supported", 400);
    }

    // Validate client credentials
    if (client_id !== EXPECTED_CLIENT_ID) {
      console.error(`Invalid client_id: ${client_id?.substring(0, 8)}...`);
      return jsonError("invalid_client", "Invalid client_id", 401);
    }

    if (client_secret !== EXPECTED_CLIENT_SECRET) {
      console.error("Invalid client_secret");
      return jsonError("invalid_client", "Invalid client_secret", 401);
    }

    if (!refresh_token) {
      return jsonError("invalid_request", "Missing refresh token", 400);
    }

    const supabase = getSupabaseClient();

    // Find integration with this refresh token
    const { data: integration, error: findError } = await supabase
      .from("team_integrations")
      .select("*")
      .eq("integration_type", "zapier")
      .eq("refresh_token", refresh_token)
      .single();

    if (findError || !integration) {
      console.error("Invalid refresh token");
      return jsonError("invalid_grant", "Invalid refresh token", 400);
    }

    // Check if integration is still connected
    if (!integration.is_connected) {
      console.error("Integration is disconnected");
      return jsonError("invalid_grant", "Integration has been disconnected", 400);
    }

    // Generate new tokens (rotate both access and refresh)
    const newAccessToken = generateSecureToken("zat");
    const newRefreshToken = generateSecureToken("zrt");
    const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();

    // Update with new tokens
    const { error: updateError } = await supabase
      .from("team_integrations")
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_expires_at: tokenExpiresAt,
      })
      .eq("id", integration.id);

    if (updateError) {
      console.error("Error refreshing token:", updateError);
      return jsonError("server_error", "Failed to refresh token", 500);
    }

    console.log(`Token refreshed for team: ${integration.team_id}`);

    return new Response(
      JSON.stringify({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: ACCESS_TOKEN_TTL_SECONDS,
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Refresh endpoint error:", error);
    return jsonError("server_error", "Internal server error", 500);
  }
});
