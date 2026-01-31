# Fanbasis OAuth Integration Setup Guide

This guide walks you through setting up the Fanbasis OAuth integration for your application.

## Prerequisites

- Fanbasis OAuth Client ID
- Fanbasis OAuth Client Secret
- Supabase project with Edge Functions enabled

## 1. Environment Variables

Add the following environment variables to your Supabase Edge Functions:

```bash
# Navigate to your Supabase project dashboard
# Settings > Edge Functions > Secrets

# Required
FANBASIS_CLIENT_ID=your_client_id_here
FANBASIS_CLIENT_SECRET=your_client_secret_here

# Optional - only if using a different Fanbasis instance
FANBASIS_BASE_URL=https://fanbasis.com
```

### Using Supabase CLI

```bash
# Set secrets using CLI
supabase secrets set FANBASIS_CLIENT_ID=your_client_id_here
supabase secrets set FANBASIS_CLIENT_SECRET=your_client_secret_here
```

## 2. OAuth Configuration with Fanbasis

Register your application with Fanbasis with these settings:

- **Redirect URI**: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback`
- **OAuth Flow**: Authorization Code + PKCE
- **Scope**: `creator:api`

## 3. Deploy Edge Functions

Deploy the Fanbasis OAuth functions to Supabase:

```bash
# Deploy the start function
supabase functions deploy fanbasis-oauth-start

# Deploy the callback function
supabase functions deploy fanbasis-oauth-callback
```

## 4. Database Setup

The integration uses the existing `team_integrations` table. Ensure it has the following structure:

```sql
-- The table should already exist, but verify these columns
CREATE TABLE IF NOT EXISTS team_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, integration_type)
);
```

## 5. Frontend Integration

### Example React Component

```typescript
import { supabase } from '@/lib/supabase';

const FanbasisConnect = ({ teamId }: { teamId: string }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fanbasis-oauth-start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            redirectUri: window.location.href
          })
        }
      );

      const { authUrl } = await response.json();
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'fanbasis-oauth',
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for OAuth completion
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'fanbasis-oauth-success') {
          console.log('Fanbasis connected!', event.data.creatorId);
          popup?.close();
          // Refresh integration status
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        } else if (event.data.type === 'fanbasis-oauth-error') {
          console.error('Fanbasis connection failed:', event.data.error);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      setIsConnecting(false);
    }
  };

  return (
    <button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect Fanbasis'}
    </button>
  );
};
```

## 6. Using the Access Token

Once connected, retrieve the access token from the database:

```typescript
// Fetch integration
const { data: integration } = await supabase
  .from('team_integrations')
  .select('config')
  .eq('team_id', teamId)
  .eq('integration_type', 'fanbasis')
  .eq('is_connected', true)
  .single();

const accessToken = integration?.config?.access_token;

// Make API calls to Fanbasis
const response = await fetch('https://fanbasis.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 7. Token Refresh

Implement token refresh logic for when the access token expires:

```typescript
async function refreshFanbasisToken(teamId: string) {
  const { data: integration } = await supabase
    .from('team_integrations')
    .select('config')
    .eq('team_id', teamId)
    .eq('integration_type', 'fanbasis')
    .single();

  const refreshToken = integration?.config?.refresh_token;
  
  const response = await fetch('https://fanbasis.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.FANBASIS_CLIENT_ID!,
      client_secret: process.env.FANBASIS_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  const tokenData = await response.json();
  
  // Update stored tokens
  await supabase
    .from('team_integrations')
    .update({
      config: {
        ...integration?.config,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('team_id', teamId)
    .eq('integration_type', 'fanbasis');
}
```

## 8. Testing

Test the integration:

1. Click "Connect Fanbasis" in your app
2. OAuth popup should open
3. Authenticate with Fanbasis
4. Grant permissions (scope: creator:api)
5. Popup should show success and auto-close
6. Check database for stored tokens

### Verify Database Entry

```sql
SELECT 
  team_id,
  integration_type,
  is_connected,
  config->>'creator_id' as creator_id,
  config->>'connected_at' as connected_at
FROM team_integrations
WHERE integration_type = 'fanbasis';
```

## 9. Security Considerations

- ✅ Uses PKCE (RFC 7636) for enhanced security
- ✅ State parameter prevents CSRF attacks
- ✅ Code verifier stored server-side only
- ✅ Client secret never exposed to frontend
- ✅ Tokens encrypted at rest in database
- ✅ Short-lived authorization codes
- ✅ Token expiration tracking

## 10. API Endpoints Reference

Based on Fanbasis OAuth 2.0 API Documentation:

### OAuth Endpoints
- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange endpoint
- `POST /api/oauth/introspect` - Token introspection (RFC 7662)
- `POST /api/oauth/revoke` - Token revocation (RFC 7009)
- `GET /api/oauth/discovery` - OAuth discovery document
- `GET /api/.well-known/jwks.json` - JSON Web Key Set

### Token Lifetimes
- **Access Token**: 15 days (1,296,000 seconds)
- **Refresh Token**: 30 days

### Rate Limits
- OAuth endpoints: 60 requests/minute per IP
- API endpoints: 60 requests/minute per authenticated client

## Troubleshooting

### "OAuth session not found"
- State token mismatch or expired
- Check that the OAuth flow completed within 15 minutes
- Verify team_integrations entry exists

### "Token exchange failed"
- Verify FANBASIS_CLIENT_ID and FANBASIS_CLIENT_SECRET are correct
- Check that redirect URI matches exactly
- Ensure PKCE code_verifier is present

### "Invalid state token"
- CSRF protection triggered
- User may have reused an old authorization link
- Start OAuth flow again

### Popup Blocked
- Browser may block popup windows
- Use `window.open()` in direct response to user click
- Provide fallback for blocked popups

## Support

For issues with:
- OAuth implementation: Check function logs in Supabase dashboard
- Fanbasis API: Contact Fanbasis support team
- Integration bugs: Check application logs and database state
