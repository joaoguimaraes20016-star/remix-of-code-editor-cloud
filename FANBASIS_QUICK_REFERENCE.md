# Fanbasis OAuth - Quick Reference

## 🔑 Credentials

```bash
Client ID: [YOUR_CLIENT_ID]
Client Secret: [YOUR_CLIENT_SECRET]
Redirect URI: https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback
```

## 📋 OAuth Configuration

| Parameter | Value |
|-----------|-------|
| OAuth Flow | Authorization Code + PKCE |
| Scope | `creator:api` |
| Code Challenge Method | S256 (SHA-256) |
| Authorization URL | `https://fanbasis.com/oauth/authorize` |
| Token URL | `https://fanbasis.com/oauth/token` |

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
supabase secrets set FANBASIS_CLIENT_ID=your_client_id
supabase secrets set FANBASIS_CLIENT_SECRET=your_client_secret
```

### 2. Deploy Functions

```bash
supabase functions deploy fanbasis-oauth-start
supabase functions deploy fanbasis-oauth-callback
supabase functions deploy fanbasis-refresh-token
```

### 3. Connect from Frontend

```typescript
// Start OAuth flow
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/fanbasis-oauth-start`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: 'your-team-id',
      redirectUri: window.location.href
    })
  }
);

const { authUrl } = await response.json();

// Open OAuth popup
window.open(authUrl, 'fanbasis-oauth', 'width=600,height=700');
```

## 📊 Token Information

| Token Type | Lifetime | Refreshable |
|------------|----------|-------------|
| Access Token | 15 days | ✅ Yes |
| Refresh Token | 30 days | ✅ Yes |

## 🔄 Token Refresh

```typescript
// Refresh expired token
await fetch(
  `${SUPABASE_URL}/functions/v1/fanbasis-refresh-token`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ teamId: 'your-team-id' })
  }
);
```

## 📡 API Endpoints

### OAuth Endpoints
- `GET /oauth/authorize` - Start authorization
- `POST /oauth/token` - Exchange code/refresh token
- `POST /api/oauth/introspect` - Validate token
- `POST /api/oauth/revoke` - Revoke token
- `GET /api/oauth/discovery` - Discovery document
- `GET /api/.well-known/jwks.json` - JWT keys

### Rate Limits
- OAuth: 60 req/min per IP
- API: 60 req/min per client

## 🗄️ Database Schema

```typescript
// team_integrations table
{
  team_id: UUID,
  integration_type: 'fanbasis',
  is_connected: boolean,
  config: {
    access_token: string,
    refresh_token: string,
    expires_at: string,        // ISO timestamp
    scope: string,             // "creator:api"
    creator_id: string,
    creator_name: string,
    connected_at: string,      // ISO timestamp
    last_refreshed_at?: string
  }
}
```

## 🔍 Check Connection Status

```typescript
const { data } = await supabase
  .from('team_integrations')
  .select('is_connected, config')
  .eq('team_id', teamId)
  .eq('integration_type', 'fanbasis')
  .single();

if (data?.is_connected) {
  const accessToken = data.config.access_token;
  // Use token for API calls
}
```

## 🎯 Making API Calls

```typescript
// Get access token
const { data: integration } = await supabase
  .from('team_integrations')
  .select('config')
  .eq('team_id', teamId)
  .eq('integration_type', 'fanbasis')
  .eq('is_connected', true)
  .single();

const accessToken = integration?.config?.access_token;

// Call Fanbasis API
const response = await fetch('https://fanbasis.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "OAuth session not found" | Restart OAuth flow, check state token |
| "Token exchange failed" | Verify client credentials |
| "Invalid state token" | CSRF protection - restart flow |
| Popup blocked | Use direct user click, check browser settings |
| Token expired | Call refresh-token function |
| 401 Unauthorized | Refresh token or reconnect |

## 📝 Testing Checklist

- [ ] Environment variables set
- [ ] Functions deployed
- [ ] OAuth flow completes successfully
- [ ] Tokens stored in database
- [ ] API calls work with access token
- [ ] Token refresh works
- [ ] Error handling works
- [ ] Popup auto-closes on success

## 🔐 Security Features

- ✅ PKCE (RFC 7636) - Prevents authorization code interception
- ✅ State parameter - CSRF protection
- ✅ Server-side code verifier - Never exposed to client
- ✅ Client secret on server - Not in frontend code
- ✅ Token encryption - At rest in database
- ✅ Short-lived codes - Authorization codes expire quickly
- ✅ Token expiration - Automatic expiry tracking

## 📚 Files Created

```
supabase/functions/
  ├── fanbasis-oauth-start/
  │   ├── index.ts
  │   └── README.md
  ├── fanbasis-oauth-callback/
  │   ├── index.ts
  │   └── README.md
  └── fanbasis-refresh-token/
      ├── index.ts
      └── README.md

public/
  └── fanbasis-callback.html

src/assets/integrations/
  └── fanbasis.svg

docs/
  ├── FANBASIS_OAUTH_SETUP.md
  └── FANBASIS_QUICK_REFERENCE.md (this file)
```

## 🆘 Support

- **OAuth Issues**: Check Supabase function logs
- **API Issues**: Check Fanbasis API documentation
- **Integration Issues**: Verify database state and token validity
