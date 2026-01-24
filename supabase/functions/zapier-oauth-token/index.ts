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

function generateToken(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body (application/x-www-form-urlencoded)
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
    }

    const { grant_type, code, client_id, client_secret, refresh_token } = body;

    // Validate client credentials
    const expectedClientId = Deno.env.get("ZAPIER_CLIENT_ID");
    const expectedClientSecret = Deno.env.get("ZAPIER_CLIENT_SECRET");

    if (client_id !== expectedClientId || client_secret !== expectedClientSecret) {
      console.error("Invalid client credentials");
      return new Response(
        JSON.stringify({ error: "invalid_client", error_description: "Invalid client credentials" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseClient();

    if (grant_type === "authorization_code") {
      // Exchange authorization code for tokens
      if (!code) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing authorization code" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Find the team_integration with this auth code
      const { data: integrations, error: findError } = await supabase
        .from("team_integrations")
        .select("*")
        .eq("integration_type", "zapier")
        .not("config", "is", null);

      if (findError) {
        console.error("Error finding integration:", findError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Database error" }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Find matching integration with the auth code
      const integration = integrations?.find(i => {
        const config = i.config as Record<string, any>;
        return config?.auth_code === code;
      });

      if (!integration) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Invalid or expired authorization code" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const config = integration.config as Record<string, any>;

      // Check if code is expired
      if (config.auth_code_expires_at && new Date(config.auth_code_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Authorization code has expired" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Generate new tokens
      const accessToken = generateToken("zat");
      const newRefreshToken = generateToken("zrt");
      const expiresIn = 3600; // 1 hour
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Update the integration with new tokens
      const { error: updateError } = await supabase
        .from("team_integrations")
        .update({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_expires_at: tokenExpiresAt,
          is_connected: true,
          config: {
            ...config,
            auth_code: null, // Clear used auth code
            auth_code_expires_at: null,
            connected_at: new Date().toISOString(),
          },
        })
        .eq("id", integration.id);

      if (updateError) {
        console.error("Error updating tokens:", updateError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Failed to issue tokens" }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log("Tokens issued for team:", integration.team_id);

      return new Response(
        JSON.stringify({
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_type: "Bearer",
          expires_in: expiresIn,
        }),
        { headers: corsHeaders }
      );

    } else if (grant_type === "refresh_token") {
      // Refresh the access token
      if (!refresh_token) {
        return new Response(
          JSON.stringify({ error: "invalid_request", error_description: "Missing refresh token" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Find integration with this refresh token
      const { data: integration, error: findError } = await supabase
        .from("team_integrations")
        .select("*")
        .eq("integration_type", "zapier")
        .eq("refresh_token", refresh_token)
        .single();

      if (findError || !integration) {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Invalid refresh token" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Generate new access token
      const newAccessToken = generateToken("zat");
      const expiresIn = 3600;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Update with new access token
      const { error: updateError } = await supabase
        .from("team_integrations")
        .update({
          access_token: newAccessToken,
          token_expires_at: tokenExpiresAt,
        })
        .eq("id", integration.id);

      if (updateError) {
        console.error("Error refreshing token:", updateError);
        return new Response(
          JSON.stringify({ error: "server_error", error_description: "Failed to refresh token" }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log("Token refreshed for team:", integration.team_id);

      return new Response(
        JSON.stringify({
          access_token: newAccessToken,
          token_type: "Bearer",
          expires_in: expiresIn,
        }),
        { headers: corsHeaders }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "unsupported_grant_type", error_description: "Unsupported grant type" }),
        { status: 400, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error("Token endpoint error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", error_description: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
