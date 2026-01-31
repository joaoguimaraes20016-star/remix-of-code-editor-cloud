# Fanbasis OAuth 2.0 Integration

Complete OAuth 2.0 integration for Fanbasis creator accounts with Authorization Code + PKCE flow.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Usage Examples](#usage-examples)
- [Security](#security)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

## 🎯 Overview

This integration allows users to securely connect their Fanbasis creator accounts to your application using OAuth 2.0 with PKCE (Proof Key for Code Exchange). It includes:

- ✅ Complete OAuth 2.0 Authorization Code + PKCE flow
- ✅ Automatic token refresh
- ✅ Secure token storage
- ✅ Frontend utilities for easy integration
- ✅ Comprehensive error handling
- ✅ Full documentation and testing suite

## ✨ Features

### OAuth Implementation
- **PKCE Support** - Enhanced security for public clients
- **State Parameter** - CSRF protection
- **Token Refresh** - Automatic token renewal
- **Error Handling** - Comprehensive error management
- **Popup Flow** - Non-disruptive user experience

### Security
- Server-side token exchange
- Encrypted token storage
- No client secrets in frontend
- Short-lived authorization codes
- Token expiration tracking

### Developer Experience
- TypeScript utilities
- React hooks ready
- Automated tests
- Complete documentation
- Deployment checklist

## 🚀 Quick Start

### 1. Prerequisites

```bash
# You need:
- Fanbasis Client ID
- Fanbasis Client Secret
- Supabase project with Edge Functions
```

### 2. Set Environment Variables

```bash
supabase secrets set FANBASIS_CLIENT_ID=your_client_id
supabase secrets set FANBASIS_CLIENT_SECRET=your_client_secret
```

### 3. Deploy Functions

```bash
supabase functions deploy fanbasis-oauth-start
supabase functions deploy fanbasis-oauth-callback
supabase functions deploy fanbasis-refresh-token
```

### 4. Use in Your App

```typescript
import { connectFanbasis, getFanbasisToken } from '@/lib/integrations/fanbasis';

// Connect account
const result = await connectFanbasis(teamId);
if (result.success) {
  console.log('Connected!', result.creatorId);
}

// Use API
const token = await getFanbasisToken(teamId);
const response = await fetch('https://fanbasis.com/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](./FANBASIS_OAUTH_SETUP.md) | Complete setup instructions |
| [Quick Reference](./FANBASIS_QUICK_REFERENCE.md) | Quick reference card |
| [Deployment Checklist](./FANBASIS_DEPLOYMENT_CHECKLIST.md) | Step-by-step deployment |
| [Integration Summary](./FANBASIS_INTEGRATION_SUMMARY.md) | Complete overview |
| [Function READMEs](./supabase/functions/) | Individual function docs |

## 🏗️ Architecture

### Components

```
Frontend (React/TypeScript)
  ├── src/lib/integrations/fanbasis.ts    # Utility functions
  └── src/assets/integrations/fanbasis.svg # Logo

Edge Functions (Deno)
  ├── fanbasis-oauth-start/               # Initiate OAuth
  ├── fanbasis-oauth-callback/            # Handle callback
  └── fanbasis-refresh-token/             # Refresh tokens

Static Assets
  └── public/fanbasis-callback.html       # OAuth completion page

Database
  └── team_integrations                   # Token storage
```

### OAuth Flow

```
1. User clicks "Connect Fanbasis"
2. Frontend calls fanbasis-oauth-start
3. Function generates PKCE challenge
4. User redirected to Fanbasis
5. User authenticates and grants permission
6. Fanbasis redirects to callback
7. Callback exchanges code for tokens
8. Tokens stored in database
9. Success page shown
10. Popup closes
```

## 💡 Usage Examples

### Basic Connection

```typescript
import { connectFanbasis } from '@/lib/integrations/fanbasis';

const handleConnect = async () => {
  const result = await connectFanbasis(teamId);
  
  if (result.success) {
    toast.success('Fanbasis connected!');
  } else {
    toast.error(result.error || 'Connection failed');
  }
};
```

### Check Connection Status

```typescript
import { isFanbasisConnected } from '@/lib/integrations/fanbasis';

const isConnected = await isFanbasisConnected(teamId);

if (isConnected) {
  // Show connected UI
} else {
  // Show connect button
}
```

### Make API Calls

```typescript
import { callFanbasisAPI } from '@/lib/integrations/fanbasis';

const { data, error } = await callFanbasisAPI(
  teamId,
  '/endpoint',
  {
    method: 'POST',
    body: JSON.stringify({ /* data */ })
  }
);

if (error) {
  console.error('API call failed:', error);
} else {
  console.log('Success:', data);
}
```

### Manual Token Management

```typescript
import { getFanbasisToken, refreshFanbasisToken } from '@/lib/integrations/fanbasis';

// Get token (auto-refreshes if needed)
const token = await getFanbasisToken(teamId);

// Manual refresh
const success = await refreshFanbasisToken(teamId);
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { isFanbasisConnected, connectFanbasis } from '@/lib/integrations/fanbasis';

function useFanbasis(teamId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, [teamId]);

  const checkConnection = async () => {
    setIsLoading(true);
    const connected = await isFanbasisConnected(teamId);
    setIsConnected(connected);
    setIsLoading(false);
  };

  const connect = async () => {
    const result = await connectFanbasis(teamId);
    if (result.success) {
      setIsConnected(true);
    }
    return result;
  };

  return { isConnected, isLoading, connect, refresh: checkConnection };
}

// Usage
function MyComponent() {
  const { isConnected, connect } = useFanbasis(teamId);

  return (
    <button onClick={connect} disabled={isConnected}>
      {isConnected ? 'Connected' : 'Connect Fanbasis'}
    </button>
  );
}
```

## 🔐 Security

### Implemented Security Measures

- ✅ **PKCE (RFC 7636)** - Prevents authorization code interception
- ✅ **State Parameter** - CSRF protection
- ✅ **Server-side Secrets** - Client secret never exposed
- ✅ **Code Verifier Storage** - Stored securely server-side only
- ✅ **Token Encryption** - Encrypted at rest in database
- ✅ **HTTPS Only** - All OAuth requests over HTTPS
- ✅ **Short-lived Codes** - Authorization codes expire quickly
- ✅ **Token Expiration** - Automatic expiry tracking

### Best Practices

```typescript
// ✅ DO: Use the provided utilities
const token = await getFanbasisToken(teamId);

// ❌ DON'T: Store tokens in localStorage
localStorage.setItem('token', token); // NEVER DO THIS

// ✅ DO: Let the utility handle refresh
const token = await getFanbasisToken(teamId); // Auto-refreshes

// ❌ DON'T: Expose client secret in frontend
const secret = 'my_secret'; // NEVER DO THIS
```

## 🧪 Testing

### Automated Tests

```bash
# Set test credentials
export TEST_USER_TOKEN="your_jwt"
export TEST_TEAM_ID="team_uuid"

# Run tests
npx tsx scripts/test-fanbasis-oauth.ts
```

### Manual Testing

1. Start OAuth flow
2. Authenticate with Fanbasis
3. Grant permissions
4. Verify callback success
5. Check database record
6. Test API calls
7. Test token refresh

### Test Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens stored in database
- [ ] API calls work with token
- [ ] Token refresh works
- [ ] Error handling works
- [ ] Popup auto-closes
- [ ] Connection status updates

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Popup blocked | Allow popups in browser settings |
| "OAuth session not found" | Restart OAuth flow |
| "Token exchange failed" | Verify credentials in Supabase secrets |
| "Invalid state token" | CSRF protection - restart flow |
| 401 Unauthorized | Token expired - will auto-refresh |

### Debug Commands

```bash
# Check function logs
supabase functions logs fanbasis-oauth-start --tail

# Check database
psql $DATABASE_URL -c "SELECT * FROM team_integrations WHERE integration_type = 'fanbasis';"

# Test function
curl -X OPTIONS https://your-project.supabase.co/functions/v1/fanbasis-oauth-start
```

### Getting Help

1. Check function logs in Supabase dashboard
2. Review [troubleshooting guide](./FANBASIS_OAUTH_SETUP.md#troubleshooting)
3. Verify environment variables
4. Check database state
5. Test with automated test suite

## 📊 Token Information

| Token Type | Lifetime | Refreshable |
|------------|----------|-------------|
| Access Token | 15 days | ✅ Yes |
| Refresh Token | 30 days | ✅ Yes |

### Token Refresh Strategy

```typescript
// Tokens are automatically refreshed when:
// - Token expires within 24 hours
// - getFanbasisToken() is called
// - API call returns 401

// Manual refresh if needed:
await refreshFanbasisToken(teamId);
```

## 📦 Files Included

```
Integration Files:
├── supabase/functions/
│   ├── fanbasis-oauth-start/
│   │   ├── index.ts
│   │   └── README.md
│   ├── fanbasis-oauth-callback/
│   │   ├── index.ts
│   │   └── README.md
│   └── fanbasis-refresh-token/
│       ├── index.ts
│       └── README.md
├── src/
│   ├── lib/integrations/fanbasis.ts
│   └── assets/integrations/fanbasis.svg
├── public/
│   └── fanbasis-callback.html
├── scripts/
│   └── test-fanbasis-oauth.ts
└── Documentation:
    ├── FANBASIS_README.md (this file)
    ├── FANBASIS_OAUTH_SETUP.md
    ├── FANBASIS_QUICK_REFERENCE.md
    ├── FANBASIS_DEPLOYMENT_CHECKLIST.md
    └── FANBASIS_INTEGRATION_SUMMARY.md
```

## 🔄 Maintenance

### Regular Tasks
- Monitor token refresh failures
- Review OAuth error logs
- Update documentation
- Test after API updates

### Updates
- Check for Fanbasis API changes
- Update token lifetimes if changed
- Review security best practices
- Update dependencies

## 📞 Support

### For Integration Issues
- Check function logs
- Review documentation
- Run automated tests
- Verify environment variables

### For Fanbasis API Issues
- Contact Fanbasis support
- Check API documentation
- Verify API status

## 🎉 Success Criteria

Integration is successful when:
- ✅ OAuth flow completes without errors
- ✅ Tokens stored securely
- ✅ API calls work
- ✅ Token refresh works
- ✅ Error handling is robust
- ✅ Tests pass

## 📝 License

This integration code is part of your application and follows your project's license.

## 🙏 Acknowledgments

- Fanbasis for OAuth 2.0 API
- OAuth 2.0 RFC specifications
- Supabase Edge Functions

---

**Version**: 1.0.0  
**Last Updated**: January 30, 2026  
**Status**: Production Ready ✅

For detailed setup instructions, see [FANBASIS_OAUTH_SETUP.md](./FANBASIS_OAUTH_SETUP.md)
