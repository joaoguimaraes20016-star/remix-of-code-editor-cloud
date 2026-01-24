import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Read from environment - DO NOT hardcode
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const EXPECTED_CLIENT_SECRET = Deno.env.get("ZAPIER_CLIENT_SECRET");
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
      // Try to parse as form-urlencoded by default
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    const { grant_type, code, client_id, client_secret, refresh_token, redirect_uri } = body;

    // Safe debug log - NEVER log secrets
    console.log("Token request:", { 
      grant_type, 
      received_client_id: client_id,
      has_code: !!code, 
      has_refresh_token: !!refresh_token,
      has_redirect_uri: !!redirect_uri
    });

    // Validate client credentials
    if (client_id !== EXPECTED_CLIENT_ID) {
      console.error(`Invalid client_id. Expected starts with: ${EXPECTED_CLIENT_ID?.substring(0, 8) || 'NOT_SET'}..., Got: ${client_id?.substring(0, 8) || 'null'}...`);
      return jsonError("invalid_client", "Invalid client_id", 401);
    }

    if (client_secret !== EXPECTED_CLIENT_SECRET) {
      console.error("Invalid client_secret");
      return jsonError("invalid_client", "Invalid client_secret", 401);
    }

    const supabase = getSupabaseClient();

    // Handle authorization_code grant
    if (grant_type === "authorization_code") {
      if (!code) {
        return jsonError("invalid_request", "Missing authorization code", 400);
      }

      // Lookup code in oauth_auth_codes table
      const { data: authCodeRecord, error: findError } = await supabase
        .from("oauth_auth_codes")
        .select("*")
        .eq("code", code)
        .is("used_at", null)
        .single();

      if (findError || !authCodeRecord) {
        console.error("Auth code not found or already used:", findError?.message);
        return jsonError("invalid_grant", "Invalid or expired authorization code", 400);
      }

      // Check if code is expired
      if (new Date(authCodeRecord.expires_at) < new Date()) {
        console.error("Auth code expired");
        return jsonError("invalid_grant", "Authorization code has expired", 400);
      }

      // Validate redirect_uri if provided (OAuth 2.0 spec)
      if (redirect_uri && redirect_uri !== authCodeRecord.redirect_uri) {
        console.error(`Redirect URI mismatch. Expected: ${authCodeRecord.redirect_uri}, Got: ${redirect_uri}`);
        return jsonError("invalid_grant", "redirect_uri mismatch", 400);
      }

      // Mark code as used (one-time use)
      const { error: updateCodeError } = await supabase
        .from("oauth_auth_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("code", code);

      if (updateCodeError) {
        console.error("Error marking code as used:", updateCodeError);
      }

      // Generate new tokens using secure random generation
      const accessToken = generateSecureToken("zat");
      const newRefreshToken = generateSecureToken("zrt");
      const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();

      // Store tokens in oauth_tokens table
      const { error: insertTokenError } = await supabase
        .from("oauth_tokens")
        .insert({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          client_id: client_id,
          user_id: authCodeRecord.user_id,
          team_id: authCodeRecord.team_id,
          user_email: authCodeRecord.user_email,
          expires_at: tokenExpiresAt
        });

      if (insertTokenError) {
        console.error("Error storing tokens:", insertTokenError);
        return jsonError("server_error", "Failed to issue tokens", 500);
      }

      console.log(`Tokens issued for team: ${authCodeRecord.team_id}`);

      return new Response(
        JSON.stringify({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_type: "Bearer",
          expires_in: ACCESS_TOKEN_TTL_SECONDS,
        }),
        { headers: corsHeaders }
      );
    }

    // Handle refresh_token grant
    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        return jsonError("invalid_request", "Missing refresh token", 400);
      }

      // Find token record with this refresh token
      const { data: tokenRecord, error: findError } = await supabase
        .from("oauth_tokens")
        .select("*")
        .eq("refresh_token", refresh_token)
        .is("revoked_at", null)
        .single();

      if (findError || !tokenRecord) {
        console.error("Invalid refresh token:", findError?.message);
        return jsonError("invalid_grant", "Invalid refresh token", 400);
      }

      // Generate new tokens (rotate both access and refresh)
      const newAccessToken = generateSecureToken("zat");
      const newRefreshToken = generateSecureToken("zrt");
      const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();

      // Update with new tokens
      const { error: updateError } = await supabase
        .from("oauth_tokens")
        .update({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_at: tokenExpiresAt,
        })
        .eq("id", tokenRecord.id);

      if (updateError) {
        console.error("Error refreshing token:", updateError);
        return jsonError("server_error", "Failed to refresh token", 500);
      }

      console.log(`Token refreshed for team: ${tokenRecord.team_id}`);

      return new Response(
        JSON.stringify({
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_type: "Bearer",
          expires_in: ACCESS_TOKEN_TTL_SECONDS,
        }),
        { headers: corsHeaders }
      );
    }

    return jsonError("unsupported_grant_type", "Unsupported grant type", 400);

  } catch (error) {
    console.error("Token endpoint error:", error);
    return jsonError("server_error", "Internal server error", 500);
  }
});
