import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Centralized HTML response headers to ensure proper content-type
const htmlHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
};

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, { 
    status,
    headers: htmlHeaders,
  });
}

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function generateAuthCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    const responseType = url.searchParams.get("response_type");

    // Validate required OAuth parameters
    if (!clientId || !redirectUri || !state) {
      return htmlResponse(renderErrorPage("Missing required OAuth parameters (client_id, redirect_uri, or state)"));
    }

    // Validate client_id with actionable error messages
    const expectedClientId = Deno.env.get("ZAPIER_CLIENT_ID");
    
    if (!expectedClientId) {
      console.error("ZAPIER_CLIENT_ID secret is not configured in Supabase");
      return htmlResponse(renderErrorPage("Server misconfigured: missing ZAPIER_CLIENT_ID secret. Please contact the administrator."));
    }
    
    if (clientId !== expectedClientId) {
      // Log redacted hint for debugging (first 4 chars + length)
      const receivedHint = clientId.length > 4 ? `${clientId.slice(0, 4)}... (len=${clientId.length})` : "(too short)";
      const expectedHint = expectedClientId.length > 4 ? `${expectedClientId.slice(0, 4)}... (len=${expectedClientId.length})` : "(too short)";
      console.error(`client_id mismatch - received: ${receivedHint}, expected: ${expectedHint}`);
      
      return htmlResponse(renderErrorPage("Invalid client_id. Ensure the Zapier integration's Client ID matches the ZAPIER_CLIENT_ID secret in Supabase."));
    }

    // Check for authorization header (user session)
    const authHeader = req.headers.get("Authorization");
    const teamIdParam = url.searchParams.get("team_id");

    // If POST request, user is submitting the authorization form
    if (req.method === "POST") {
      const formData = await req.formData();
      const teamId = formData.get("team_id") as string;
      const userToken = formData.get("user_token") as string;

      if (!teamId || !userToken) {
        return htmlResponse(renderErrorPage("Missing team selection or authentication"));
      }

      const supabase = getSupabaseClient();

      // Verify user token
      const { data: userData, error: userError } = await supabase.auth.getUser(userToken);
      if (userError || !userData.user) {
        return htmlResponse(renderErrorPage("Invalid or expired session"));
      }

      // Verify user is member of the team
      const { data: membership, error: memberError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userData.user.id)
        .single();

      if (memberError || !membership) {
        return htmlResponse(renderErrorPage("You don't have access to this team"));
      }

      // Generate authorization code
      const authCode = generateAuthCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Store the authorization code in team_integrations
      const { error: upsertError } = await supabase
        .from("team_integrations")
        .upsert({
          team_id: teamId,
          integration_type: "zapier",
          oauth_state: state,
          config: {
            auth_code: authCode,
            auth_code_expires_at: expiresAt,
            redirect_uri: redirectUri,
            user_id: userData.user.id,
            user_email: userData.user.email,
          },
          is_connected: false,
        }, {
          onConflict: "team_id,integration_type",
        });

      if (upsertError) {
        console.error("Error storing auth code:", upsertError);
        return htmlResponse(renderErrorPage("Failed to process authorization"));
      }

      // Redirect back to Zapier with the auth code
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("code", authCode);
      callbackUrl.searchParams.set("state", state);

      return Response.redirect(callbackUrl.toString(), 302);
    }

    // GET request - render authorization page
    // For the authorization page, we need to get team list from query param or show login prompt
    return htmlResponse(renderAuthPage(clientId, redirectUri, state, teamIdParam));

  } catch (error) {
    console.error("Authorization error:", error);
    return htmlResponse(renderErrorPage("An unexpected error occurred"));
  }
});

function renderAuthPage(clientId: string, redirectUri: string, state: string, teamId: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Stackit - Zapier</title>
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
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }
    .logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .stackit { background: #6366f1; color: white; }
    .zapier { background: #ff4a00; color: white; }
    .connector { color: #94a3b8; font-size: 24px; }
    h1 {
      font-size: 24px;
      color: #1e293b;
      margin-bottom: 10px;
      text-align: center;
    }
    p {
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 25px;
      text-align: center;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }
    input, select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .permissions {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 25px;
    }
    .permissions h3 {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }
    .permission-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #64748b;
      padding: 6px 0;
    }
    .permission-item svg {
      color: #22c55e;
      width: 16px;
      height: 16px;
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
    }
    .btn-primary {
      background: #6366f1;
      color: white;
    }
    .btn-primary:hover {
      background: #4f46e5;
    }
    .btn-cancel {
      background: transparent;
      color: #64748b;
      margin-top: 10px;
    }
    .btn-cancel:hover {
      color: #374151;
    }
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
      display: none;
    }
    .loading {
      display: none;
      text-align: center;
      padding: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-row">
      <div class="logo stackit">📊</div>
      <span class="connector">↔</span>
      <div class="logo zapier">⚡</div>
    </div>
    
    <h1>Connect to Zapier</h1>
    <p>Zapier is requesting access to your Stackit account to automate your workflows.</p>
    
    <div id="error" class="error"></div>
    
    <div id="auth-form">
      <div id="login-section" style="display: none;">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" />
        </div>
        <button class="btn btn-primary" onclick="login()">Sign In</button>
      </div>
      
      <div id="team-section" style="display: none;">
        <div class="form-group">
          <label for="team">Select Team</label>
          <select id="team">
            <option value="">Select a team...</option>
          </select>
        </div>
        
        <div class="permissions">
          <h3>Zapier will be able to:</h3>
          <div class="permission-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Read and create leads/contacts</span>
          </div>
          <div class="permission-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Read appointments</span>
          </div>
          <div class="permission-item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Trigger automations on new events</span>
          </div>
        </div>
        
        <button class="btn btn-primary" onclick="authorize()">Authorize Access</button>
        <button class="btn btn-cancel" onclick="cancel()">Cancel</button>
      </div>
    </div>
    
    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Authorizing...</p>
    </div>
  </div>
  
  <script>
    const SUPABASE_URL = 'https://kqfyevdblvgxaycdvfxe.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZnlldmRibHZneGF5Y2R2ZnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODEzNDUsImV4cCI6MjA4MTE1NzM0NX0.2qw-D1zz7uPumYRqDfFm1ur-0uxqXiBDPH4EWIDH66o';
    
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client_id');
    const redirectUri = params.get('redirect_uri');
    const state = params.get('state');
    const teamIdParam = ${teamId ? `"${teamId}"` : 'null'};
    
    let accessToken = null;
    let teams = [];
    
    // Check for existing session
    async function checkSession() {
      try {
        const stored = localStorage.getItem('sb-kqfyevdblvgxaycdvfxe-auth-token');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.access_token) {
            accessToken = parsed.access_token;
            await loadTeams();
            return;
          }
        }
      } catch (e) {}
      
      document.getElementById('login-section').style.display = 'block';
    }
    
    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        showError('Please enter email and password');
        return;
      }
      
      try {
        const response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          showError(data.error_description || data.error);
          return;
        }
        
        accessToken = data.access_token;
        localStorage.setItem('sb-kqfyevdblvgxaycdvfxe-auth-token', JSON.stringify(data));
        await loadTeams();
      } catch (e) {
        showError('Login failed. Please try again.');
      }
    }
    
    async function loadTeams() {
      try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/team_members?select=team_id,teams(id,name)', {
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'apikey': SUPABASE_ANON_KEY,
          },
        });
        
        const data = await response.json();
        teams = data.map(tm => tm.teams).filter(Boolean);
        
        const select = document.getElementById('team');
        select.innerHTML = '<option value="">Select a team...</option>';
        teams.forEach(team => {
          const option = document.createElement('option');
          option.value = team.id;
          option.textContent = team.name;
          if (teamIdParam && team.id === teamIdParam) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('team-section').style.display = 'block';
      } catch (e) {
        showError('Failed to load teams');
      }
    }
    
    async function authorize() {
      const teamId = document.getElementById('team').value;
      if (!teamId) {
        showError('Please select a team');
        return;
      }
      
      document.getElementById('auth-form').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      
      try {
        const formData = new FormData();
        formData.append('team_id', teamId);
        formData.append('user_token', accessToken);
        
        const response = await fetch(window.location.href, {
          method: 'POST',
          body: formData,
        });
        
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          const text = await response.text();
          document.body.innerHTML = text;
        }
      } catch (e) {
        showError('Authorization failed');
        document.getElementById('auth-form').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
      }
    }
    
    function cancel() {
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set('error', 'access_denied');
      callbackUrl.searchParams.set('state', state);
      window.location.href = callbackUrl.toString();
    }
    
    function showError(msg) {
      const el = document.getElementById('error');
      el.textContent = msg;
      el.style.display = 'block';
    }
    
    checkSession();
  </script>
</body>
</html>`;
}

function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
    }
    .error-icon {
      width: 60px;
      height: 60px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 30px;
    }
    h1 { color: #dc2626; font-size: 20px; margin-bottom: 10px; }
    p { color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">❌</div>
    <h1>Authorization Failed</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
