# Fanbasis OAuth Start Function

Initiates the OAuth 2.0 Authorization Code + PKCE flow for Fanbasis integration.

## Environment Variables Required

Add these to your Supabase Edge Function secrets:

```bash
# Required
FANBASIS_CLIENT_ID=your_client_id_here
FANBASIS_CLIENT_SECRET=your_client_secret_here

# Optional - defaults to https://fanbasis.com
FANBASIS_BASE_URL=https://fanbasis.com
```

## OAuth Configuration

- **Redirect URI**: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback`
- **OAuth Flow**: Authorization Code + PKCE
- **Scope**: `creator:api`
- **Code Challenge Method**: S256 (SHA-256)

## Usage

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/fanbasis-oauth-start`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: 'team-uuid',
      redirectUri: 'https://your-app.com/team/team-uuid/integrations'
    })
  }
);

const { authUrl } = await response.json();
// Redirect user to authUrl
window.open(authUrl, '_blank', 'width=600,height=700');
```

## Flow

1. Generates PKCE code_verifier and code_challenge
2. Stores state token and code_verifier in team_integrations
3. Returns authorization URL for user to visit
4. User authenticates and grants permissions
5. Fanbasis redirects to callback function with authorization code
6. Callback exchanges code for access token using code_verifier
7. Tokens are stored in team_integrations

## Security

- Uses PKCE (RFC 7636) for enhanced security
- State parameter prevents CSRF attacks
- Code verifier stored server-side only
- Tokens encrypted at rest in database
