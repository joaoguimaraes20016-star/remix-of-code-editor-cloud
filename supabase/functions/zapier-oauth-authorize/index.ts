import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Read from environment - DO NOT hardcode
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const ALLOWED_REDIRECT_URI = "https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/";
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CSP that allows inline styles, form submissions, but no sandbox
const CONTENT_SECURITY_POLICY = "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self' https://zapier.com; base-uri 'none'; frame-ancestors 'none'";

/**
 * Returns HTML with explicit headers to ensure proper rendering.
 * Sets BOTH lowercase and canonical case for maximum compatibility.
 */
function htmlResponse(body: string, status = 200): Response {
  const headers = new Headers();
  // Set both cases to maximize compatibility with proxies/edge runtime
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("Content-Type", "text/html; charset=utf-8");
  // Encourage browsers/embeds to render instead of treating as a download or plain text
  headers.set("content-disposition", "inline");
  headers.set("Content-Disposition", "inline");
  headers.set("cache-control", "no-store");
  headers.set("Cache-Control", "no-store");
  headers.set("pragma", "no-cache");
  headers.set("Pragma", "no-cache");
  headers.set("x-content-type-options", "nosniff");
  headers.set("X-Content-Type-Options", "nosniff");
  // Override any injected sandbox CSP
  headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  // Debug marker to verify which version is being served (safe, no secrets)
  headers.set("x-stackit-zapier-authorize", "v3-force-html-2026-01-24");
  
  return new Response(body, { status, headers });
}

/**
 * Returns a 302 redirect response
 */
function redirectResponse(location: string): Response {
  const headers = new Headers();
  headers.set("Location", location);
  headers.set("Cache-Control", "no-store");
  headers.set("x-stackit-zapier-authorize", "v3-force-html-2026-01-24");
  return new Response(null, { status: 302, headers });
}

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderErrorPage(error: string, details?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Error - Stackit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
    }
    h1 { color: #dc2626; font-size: 24px; margin-bottom: 12px; }
    p { color: #6b7280; line-height: 1.6; }
    .details { 
      margin-top: 16px; 
      padding: 12px; 
      background: #f3f4f6; 
      border-radius: 8px; 
      font-family: monospace;
      font-size: 13px;
      color: #374151;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">⚠️</div>
    <h1>Authorization Error</h1>
    <p>${escapeHtml(error)}</p>
    ${details ? `<div class="details">${escapeHtml(details)}</div>` : ''}
  </div>
</body>
</html>`;
}

/**
 * Renders auth page with plain HTML form - NO JavaScript required.
 * Form POSTs directly, server responds with 302 redirect.
 */
function renderAuthPage(clientId: string, redirectUri: string, state: string, errorMessage?: string): string {
  const cancelUrl = `${redirectUri}?error=access_denied&state=${encodeURIComponent(state)}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect to Stackit</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    h1 { 
      text-align: center; 
      color: #1f2937; 
      font-size: 24px; 
      margin-bottom: 8px;
    }
    .subtitle {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .form-group { margin-bottom: 20px; }
    label { 
      display: block; 
      margin-bottom: 6px; 
      font-weight: 500; 
      color: #374151;
      font-size: 14px;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;
      text-align: center;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }
    .btn-secondary:hover { background: #e5e7eb; }
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .permissions {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .permissions h3 {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .permission-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      font-size: 14px;
      color: #374151;
    }
    .permission-check {
      color: #10b981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">S</div>
    <h1>Connect to Stackit</h1>
    <p class="subtitle">Allow Zapier to access your Stackit account?</p>
    
    ${errorMessage ? `<div class="error-message">${escapeHtml(errorMessage)}</div>` : ''}
    
    <form method="POST" action="">
      <!-- Hidden OAuth fields -->
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="response_type" value="code">
      
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com" autocomplete="email">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required placeholder="••••••••" autocomplete="current-password">
      </div>
      
      <div class="permissions">
        <h3>Zapier will be able to:</h3>
        <div class="permission-item"><span class="permission-check">✓</span> Read your leads and appointments</div>
        <div class="permission-item"><span class="permission-check">✓</span> Create new leads and contacts</div>
        <div class="permission-item"><span class="permission-check">✓</span> Update lead information</div>
      </div>
      
      <button type="submit" class="btn btn-primary">Authorize Access</button>
      <a href="${escapeHtml(cancelUrl)}" class="btn btn-secondary">Cancel</a>
    </form>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Handle POST request (form submission from auth page)
  if (req.method === "POST") {
    try {
      // Parse form data (application/x-www-form-urlencoded from HTML form)
      const contentType = req.headers.get("content-type") || "";
      let email: string | null = null;
      let password: string | null = null;
      let state: string | null = null;
      let redirectUri: string | null = null;
      let clientId: string | null = null;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        email = formData.get("email") as string | null;
        password = formData.get("password") as string | null;
        state = formData.get("state") as string | null;
        redirectUri = formData.get("redirect_uri") as string | null;
        clientId = formData.get("client_id") as string | null;
      } else if (contentType.includes("application/json")) {
        // Also support JSON for backwards compatibility
        const body = await req.json();
        email = body.email;
        password = body.password;
        state = body.state;
        redirectUri = body.redirect_uri;
        clientId = body.client_id || EXPECTED_CLIENT_ID;
      } else {
        console.error("Unsupported content-type:", contentType);
        return htmlResponse(renderErrorPage("Invalid request", "Unsupported content type"), 400);
      }

      // Safe debug log - NEVER log secrets or passwords
      const maskedClientId = clientId ? `${clientId.substring(0, 12)}...` : 'null';
      console.log("OAuth authorize POST:", {
        has_email: !!email,
        has_password: !!password,
        has_state: !!state,
        received_redirect_uri: redirectUri,
        received_client_id_masked: maskedClientId,
        env_client_id_exists: !!EXPECTED_CLIENT_ID,
        client_id_matches: clientId === EXPECTED_CLIENT_ID
      });

      // Re-validate client_id on POST (never trust hidden fields)
      if (!clientId || clientId !== EXPECTED_CLIENT_ID) {
        console.error(`POST: Invalid client_id`);
        return htmlResponse(
          renderErrorPage("Invalid client_id", "The client credentials are invalid."),
          400
        );
      }

      // Re-validate redirect_uri on POST
      if (!redirectUri || redirectUri !== ALLOWED_REDIRECT_URI) {
        console.error(`POST: Invalid redirect_uri. Expected: ${ALLOWED_REDIRECT_URI}, Got: ${redirectUri}`);
        return htmlResponse(
          renderErrorPage("Invalid redirect_uri", `Expected: ${ALLOWED_REDIRECT_URI}`),
          400
        );
      }

      if (!email || !password) {
        // Show auth page again with error message
        return htmlResponse(
          renderAuthPage(clientId, redirectUri, state || "", "Email and password are required"),
          400
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
        // Show auth page again with error message
        return htmlResponse(
          renderAuthPage(clientId, redirectUri, state || "", "Invalid email or password"),
          401
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
        return htmlResponse(
          renderAuthPage(clientId, redirectUri, state || "", "No team found for this user"),
          403
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
          redirect_uri: redirectUri,
          state: state || null,
          user_id: authData.user.id,
          team_id: teamId,
          user_email: email,
          expires_at: authCodeExpiresAt
        });

      if (insertError) {
        console.error("Insert auth code error:", insertError);
        return htmlResponse(
          renderAuthPage(clientId, redirectUri, state || "", "Failed to create authorization. Please try again."),
          500
        );
      }

      // Build redirect URL with auth code and perform 302 redirect
      const redirectUrl = `${redirectUri}?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(state || "")}`;

      console.log(`Auth code issued for team ${teamId}, redirecting to Zapier`);

      // Return 302 redirect - no JavaScript needed
      return redirectResponse(redirectUrl);

    } catch (error) {
      console.error("POST handler error:", error);
      return htmlResponse(
        renderErrorPage("Internal server error", "An unexpected error occurred. Please try again."),
        500
      );
    }
  }

  // Handle GET request (OAuth authorize endpoint)
  if (req.method === "GET") {
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const responseType = url.searchParams.get("response_type");
    const state = url.searchParams.get("state") || "";

    // Safe debug log - mask client_id partially, never log secrets
    const maskedClientId = clientId ? `${clientId.substring(0, 12)}...` : 'null';
    console.log("OAuth authorize GET request:", { 
      received_client_id_masked: maskedClientId,
      received_redirect_uri: redirectUri,
      received_response_type: responseType,
      has_state: !!state,
      env_client_id_exists: !!EXPECTED_CLIENT_ID,
      client_id_matches: clientId === EXPECTED_CLIENT_ID
    });

    // Validate client_id
    if (!clientId || clientId !== EXPECTED_CLIENT_ID) {
      console.error(`Invalid client_id. Expected starts with: ${EXPECTED_CLIENT_ID?.substring(0, 8) || 'NOT_SET'}..., Got: ${clientId?.substring(0, 8) || 'null'}...`);
      return htmlResponse(
        renderErrorPage(
          "Invalid client_id",
          "The client_id does not match the expected value. Please check your Zapier integration settings."
        ),
        400
      );
    }

    // Validate redirect_uri (strict match)
    if (!redirectUri || redirectUri !== ALLOWED_REDIRECT_URI) {
      console.error(`Invalid redirect_uri. Expected: ${ALLOWED_REDIRECT_URI}, Got: ${redirectUri}`);
      return htmlResponse(
        renderErrorPage(
          "Invalid redirect_uri",
          `Expected: ${ALLOWED_REDIRECT_URI}`
        ),
        400
      );
    }

    // Validate response_type
    if (responseType !== "code") {
      console.error(`Invalid response_type. Expected: code, Got: ${responseType}`);
      return htmlResponse(
        renderErrorPage(
          "Invalid response_type",
          "Only 'code' response type is supported for OAuth 2.0 authorization code flow."
        ),
        400
      );
    }

    // Render the authorization page with plain HTML form (no JS dependency)
    return htmlResponse(renderAuthPage(clientId, redirectUri, state));
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
