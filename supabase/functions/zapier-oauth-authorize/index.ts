import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Read from environment - DO NOT hardcode
const EXPECTED_CLIENT_ID = Deno.env.get("ZAPIER_CLIENT_ID");
const ALLOWED_REDIRECT_URI = "https://zapier.com/dashboard/auth/oauth/return/App235737CLIAPI/";
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlResponse(body: string, status = 200): Response {
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  
  return new Response(body, { status, headers });
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

function renderAuthPage(state: string, redirectUri: string): string {
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
    input {
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
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 12px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
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
      display: none;
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
    .permission-item::before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
    }
    .loading { display: none; }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">S</div>
    <h1>Connect to Stackit</h1>
    <p class="subtitle">Allow Zapier to access your Stackit account?</p>
    
    <div class="error-message" id="error"></div>
    
    <form id="authForm">
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
        <div class="permission-item">Read your leads and appointments</div>
        <div class="permission-item">Create new leads and contacts</div>
        <div class="permission-item">Update lead information</div>
      </div>
      
      <button type="submit" class="btn btn-primary" id="submitBtn">
        <span class="normal">Authorize Access</span>
        <span class="loading"><span class="spinner"></span>Authorizing...</span>
      </button>
      <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
    </form>
  </div>

  <script>
    const form = document.getElementById('authForm');
    const errorEl = document.getElementById('error');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const state = ${JSON.stringify(state)};
    const redirectUri = ${JSON.stringify(redirectUri)};
    
    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    
    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.querySelector('.normal').style.display = loading ? 'none' : 'inline';
      submitBtn.querySelector('.loading').style.display = loading ? 'inline-flex' : 'none';
    }
    
    cancelBtn.addEventListener('click', () => {
      window.location.href = redirectUri + '?error=access_denied&state=' + encodeURIComponent(state);
    });
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      setLoading(true);
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await fetch(window.location.origin + '/functions/v1/zapier-oauth-authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, state, redirect_uri: redirectUri })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Authorization failed');
        }
        
        // Redirect with authorization code
        window.location.href = data.redirect_url;
      } catch (err) {
        showError(err.message);
        setLoading(false);
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
      const body = await req.json();
      const { email, password, state, redirect_uri } = body;

      // Safe debug log - NEVER log secrets
      console.log("OAuth authorize POST:", {
        has_email: !!email,
        has_password: !!password,
        has_state: !!state,
        received_redirect_uri: redirect_uri
      });

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate redirect_uri
      if (redirect_uri !== ALLOWED_REDIRECT_URI) {
        console.error(`Invalid redirect_uri. Expected: ${ALLOWED_REDIRECT_URI}, Got: ${redirect_uri}`);
        return new Response(
          JSON.stringify({ error: "Invalid redirect_uri" }),
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
          state: state,
          user_id: authData.user.id,
          team_id: teamId,
          user_email: email,
          expires_at: authCodeExpiresAt
        });

      if (insertError) {
        console.error("Insert auth code error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create authorization" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build redirect URL with auth code
      const redirectUrl = `${redirect_uri}?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(state)}`;

      console.log(`Auth code issued for team ${teamId}, redirecting to Zapier`);

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

    // Render the authorization page
    return htmlResponse(renderAuthPage(state, redirectUri));
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
