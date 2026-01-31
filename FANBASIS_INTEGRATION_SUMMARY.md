# Fanbasis OAuth Integration - Complete Summary

## 🎯 Overview

This integration implements OAuth 2.0 Authorization Code + PKCE flow for Fanbasis, allowing users to securely connect their Fanbasis creator accounts to your application.

## 📦 What's Included

### Edge Functions (3)
1. **fanbasis-oauth-start** - Initiates OAuth flow
2. **fanbasis-oauth-callback** - Handles OAuth callback and token exchange
3. **fanbasis-refresh-token** - Refreshes expired access tokens

### Static Assets (2)
1. **fanbasis-callback.html** - OAuth completion page
2. **fanbasis.svg** - Integration logo

### Documentation (4)
1. **FANBASIS_OAUTH_SETUP.md** - Complete setup guide
2. **FANBASIS_QUICK_REFERENCE.md** - Quick reference card
3. **FANBASIS_DEPLOYMENT_CHECKLIST.md** - Deployment checklist
4. **FANBASIS_INTEGRATION_SUMMARY.md** - This file

### Test Scripts (1)
1. **test-fanbasis-oauth.ts** - Automated test suite

## 🔧 Configuration

### Required Environment Variables
```bash
FANBASIS_CLIENT_ID=your_client_id_here
FANBASIS_CLIENT_SECRET=your_client_secret_here
```

### Optional Environment Variables
```bash
FANBASIS_BASE_URL=https://fanbasis.com  # Default if not set
```

### OAuth Configuration
- **Redirect URI**: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback`
- **Scope**: `creator:api`
- **Flow**: Authorization Code + PKCE (S256)

## 🚀 Quick Start

### 1. Set Credentials
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

### 3. Test Integration
```bash
npx tsx scripts/test-fanbasis-oauth.ts
```

## 📊 Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ 1. Start OAuth
       ▼
┌─────────────────────┐
│ fanbasis-oauth-start│
│   Edge Function     │
└──────┬──────────────┘
       │ 2. Generate PKCE
       │    Store state
       │ 3. Return authUrl
       ▼
┌─────────────┐
│  Fanbasis   │
│   OAuth     │
└──────┬──────┘
       │ 4. User authenticates
       │    & grants permission
       ▼
┌──────────────────────────┐
│ fanbasis-oauth-callback  │
│     Edge Function        │
└──────┬───────────────────┘
       │ 5. Exchange code
       │    for tokens
       │ 6. Store tokens
       ▼
┌─────────────────┐
│ team_integrations│
│     Table       │
└─────────────────┘
```

## 🔐 Security Features

- ✅ **PKCE (RFC 7636)** - Prevents authorization code interception
- ✅ **State Parameter** - CSRF protection
- ✅ **Server-side Secrets** - Client secret never exposed
- ✅ **Code Verifier Storage** - Stored securely server-side
- ✅ **Token Encryption** - Encrypted at rest in database
- ✅ **Short-lived Codes** - Authorization codes expire quickly
- ✅ **Token Expiration** - Automatic expiry tracking

## 💾 Database Schema

```typescript
// team_integrations table
{
  id: UUID,
  team_id: UUID,
  integration_type: 'fanbasis',
  is_connected: boolean,
  config: {
    // OAuth state (temporary, cleared after connection)
    state_token?: string,
    code_verifier?: string,
    redirect_uri?: string,
    initiated_at?: string,
    
    // Connection data (persisted)
    access_token: string,
    refresh_token: string,
    expires_at: string,        // ISO timestamp
    scope: string,             // "creator:api"
    creator_id?: string,
    creator_name?: string,
    connected_at: string,      // ISO timestamp
    last_refreshed_at?: string,
    
    // Disconnection tracking
    disconnected_at?: string,
    disconnect_reason?: string
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

## 🔄 Token Lifecycle

### Access Token
- **Lifetime**: 15 days (1,296,000 seconds)
- **Refresh**: Use refresh token before expiration
- **Storage**: Encrypted in database

### Refresh Token
- **Lifetime**: 30 days
- **Usage**: Obtain new access tokens
- **Invalidation**: On disconnect or security breach

### Refresh Strategy
```typescript
// Recommended: Refresh when token expires within 24 hours
const shouldRefresh = (expiresAt - now) < 24 * 60 * 60 * 1000;

if (shouldRefresh) {
  await refreshFanbasisToken(teamId);
}
```

## 📡 API Usage

### Making Authenticated Requests

```typescript
// 1. Get valid access token
const token = await getFanbasisToken(teamId);

// 2. Make API request
const response = await fetch('https://fanbasis.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* your data */ })
});

// 3. Handle response
if (response.status === 401) {
  // Token expired, refresh and retry
  await refreshFanbasisToken(teamId);
  // Retry request...
}
```

### Available Endpoints (Fanbasis API)

Based on the OAuth documentation:

- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange/refresh
- `POST /api/oauth/introspect` - Token validation (RFC 7662)
- `POST /api/oauth/revoke` - Token revocation (RFC 7009)
- `GET /api/oauth/discovery` - OAuth discovery document
- `GET /api/.well-known/jwks.json` - JWT keys

### Rate Limits
- **OAuth endpoints**: 60 requests/minute per IP
- **API endpoints**: 60 requests/minute per client

## 🧪 Testing

### Automated Tests
```bash
# Set test credentials
export TEST_USER_TOKEN="your_user_jwt"
export TEST_TEAM_ID="team_uuid"

# Run tests
npx tsx scripts/test-fanbasis-oauth.ts
```

### Manual Testing Checklist
1. ✅ Start OAuth flow
2. ✅ Authenticate with Fanbasis
3. ✅ Grant permissions
4. ✅ Verify callback success
5. ✅ Check database record
6. ✅ Test API calls with token
7. ✅ Test token refresh
8. ✅ Test error scenarios

## 📝 Integration Steps for Developers

### Frontend Implementation

```typescript
// 1. Create connect button
const handleConnectFanbasis = async () => {
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
        teamId: currentTeamId,
        redirectUri: window.location.href
      })
    }
  );

  const { authUrl } = await response.json();
  
  // Open OAuth popup
  const popup = window.open(authUrl, 'fanbasis-oauth', 'width=600,height=700');
  
  // Listen for completion
  window.addEventListener('message', (event) => {
    if (event.data.type === 'fanbasis-oauth-success') {
      console.log('Connected!', event.data.creatorId);
      popup?.close();
      // Refresh UI
    }
  });
};

// 2. Check connection status
const checkFanbasisConnection = async () => {
  const { data } = await supabase
    .from('team_integrations')
    .select('is_connected, config')
    .eq('team_id', teamId)
    .eq('integration_type', 'fanbasis')
    .single();
    
  return data?.is_connected || false;
};

// 3. Use the integration
const callFanbasisAPI = async (endpoint: string, options: RequestInit = {}) => {
  // Get token (with auto-refresh)
  const token = await getFanbasisToken(teamId);
  
  // Make request
  const response = await fetch(`https://fanbasis.com/api/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "OAuth session not found" | State token mismatch or expired | Restart OAuth flow |
| "Token exchange failed" | Invalid credentials | Verify client ID/secret |
| "Invalid state token" | CSRF protection triggered | Start new OAuth flow |
| Popup blocked | Browser settings | Use direct user click |
| 401 Unauthorized | Token expired | Refresh token |
| "Reconnect required" | Refresh token invalid | User must reconnect |

### Debug Commands

```bash
# Check function logs
supabase functions logs fanbasis-oauth-start --tail
supabase functions logs fanbasis-oauth-callback --tail

# Check database state
psql $DATABASE_URL -c "
  SELECT 
    team_id,
    is_connected,
    config->>'creator_id' as creator_id,
    config->>'expires_at' as expires_at
  FROM team_integrations 
  WHERE integration_type = 'fanbasis';
"

# Test function accessibility
curl -X OPTIONS https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-start
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `FANBASIS_OAUTH_SETUP.md` | Complete setup guide with code examples |
| `FANBASIS_QUICK_REFERENCE.md` | Quick reference for common tasks |
| `FANBASIS_DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment checklist |
| `FANBASIS_INTEGRATION_SUMMARY.md` | This overview document |
| `supabase/functions/*/README.md` | Function-specific documentation |

## 🎓 Learning Resources

### OAuth 2.0 Standards
- [RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 Framework
- [RFC 7636](https://tools.ietf.org/html/rfc7636) - PKCE Extension
- [RFC 7662](https://tools.ietf.org/html/rfc7662) - Token Introspection
- [RFC 7009](https://tools.ietf.org/html/rfc7009) - Token Revocation

### Fanbasis Documentation
- OAuth 2.0 API Documentation (provided)
- API Endpoints Reference
- Rate Limiting Guidelines

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor token refresh failures
- [ ] Review OAuth error logs
- [ ] Check token expiration patterns
- [ ] Update documentation as needed
- [ ] Test integration after Fanbasis API updates

### Security Audits
- [ ] Review token storage security
- [ ] Audit PKCE implementation
- [ ] Check for exposed secrets
- [ ] Verify HTTPS usage
- [ ] Review error messages for information leakage

## 📞 Support

### For Integration Issues
1. Check function logs in Supabase dashboard
2. Verify environment variables are set
3. Review database state
4. Check Fanbasis API status
5. Consult troubleshooting guide

### For Fanbasis API Issues
- Contact Fanbasis support team
- Check API documentation
- Verify API endpoint availability
- Review rate limit headers

## ✅ Success Criteria

The integration is successful when:
- ✅ Users can connect their Fanbasis accounts
- ✅ OAuth flow completes without errors
- ✅ Tokens are stored securely
- ✅ API calls work with access token
- ✅ Token refresh works automatically
- ✅ Error handling is robust
- ✅ Security best practices followed

## 🎉 Next Steps

After successful deployment:
1. Monitor integration usage
2. Gather user feedback
3. Implement additional Fanbasis features
4. Optimize token refresh strategy
5. Add analytics/tracking
6. Document common use cases
7. Create user guides

---

**Version**: 1.0.0  
**Last Updated**: January 30, 2026  
**Status**: Ready for Deployment ✅
