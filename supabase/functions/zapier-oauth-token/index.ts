import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Constants
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
      // Try to parse as form-urlencoded by default
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    const { grant_type, code, client_id, client_secret, refresh_token, redirect_uri } = body;

    console.log("Token request:", { grant_type, hasCode: !!code, hasRefreshToken: !!refresh_token });

    // Validate client credentials
    if (client_id !== EXPECTED_CLIENT_ID) {
      console.error(`Invalid client_id: ${client_id?.substring(0, 8)}...`);
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

      // Find the team_integration with this auth code
      const { data: integrations, error: findError } = await supabase
        .from("team_integrations")
        .select("*")
        .eq("integration_type", "zapier")
        .not("config", "is", null);

      if (findError) {
        console.error("Error finding integration:", findError);
        return jsonError("server_error", "Database error", 500);
      }

      // Find matching integration with the auth code
      const integration = integrations?.find(i => {
        const config = i.config as Record<string, unknown>;
        return config?.auth_code === code;
      });

      if (!integration) {
        console.error("Auth code not found");
        return jsonError("invalid_grant", "Invalid or expired authorization code", 400);
      }

      const config = integration.config as Record<string, unknown>;

      // Check if code is expired
      const expiresAt = config.auth_code_expires_at as string;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        console.error("Auth code expired");
        return jsonError("invalid_grant", "Authorization code has expired", 400);
      }

      // Validate redirect_uri if provided (OAuth 2.0 spec)
      const storedRedirectUri = config.auth_code_redirect_uri as string;
      if (redirect_uri && redirect_uri !== storedRedirectUri) {
        console.error("Redirect URI mismatch");
        return jsonError("invalid_grant", "redirect_uri mismatch", 400);
      }

      // Generate new tokens using secure random generation
      const accessToken = generateSecureToken("zat");
      const newRefreshToken = generateSecureToken("zrt");
      const tokenExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();

      // Update the integration with new tokens and clear auth code
      const { error: updateError } = await supabase
        .from("team_integrations")
        .update({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_expires_at: tokenExpiresAt,
          is_connected: true,
          config: {
            ...config,
            auth_code: null, // Clear used auth code (one-time use)
            auth_code_expires_at: null,
            auth_code_redirect_uri: null,
            connected_at: new Date().toISOString(),
          },
        })
        .eq("id", integration.id);

      if (updateError) {
        console.error("Error updating tokens:", updateError);
        return jsonError("server_error", "Failed to issue tokens", 500);
      }

      console.log(`Tokens issued for team: ${integration.team_id}`);

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

      // Generate new access token (optionally rotate refresh token)
      const newAccessToken = generateSecureToken("zat");
      const newRefreshToken = generateSecureToken("zrt"); // Rotate refresh token
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
    }

    return jsonError("unsupported_grant_type", "Unsupported grant type", 400);

  } catch (error) {
    console.error("Token endpoint error:", error);
    return jsonError("server_error", "Internal server error", 500);
  }
});
