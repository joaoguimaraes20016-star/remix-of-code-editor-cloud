# Fanbasis OAuth Callback Function

Handles the OAuth 2.0 callback from Fanbasis and exchanges the authorization code for access tokens.

## Environment Variables Required

```bash
# Required
FANBASIS_CLIENT_ID=your_client_id_here
FANBASIS_CLIENT_SECRET=your_client_secret_here

# Optional - defaults to https://fanbasis.com
FANBASIS_BASE_URL=https://fanbasis.com
```

## Callback URL

This function is registered as the OAuth redirect URI:
```
https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/fanbasis-oauth-callback
```

## What It Does

1. Receives authorization code from Fanbasis
2. Validates state token to prevent CSRF
3. Retrieves stored code_verifier from database
4. Exchanges code for access token using PKCE
5. Fetches creator information (if available)
6. Stores tokens in team_integrations table
7. Redirects to callback HTML page with success/error

## Token Storage

Tokens are stored in the `team_integrations` table:

```typescript
{
  access_token: string;      // JWT access token
  refresh_token: string;     // Refresh token for obtaining new access tokens
  expires_at: string;        // ISO timestamp when token expires
  scope: string;             // Granted scopes (e.g., "creator:api")
  creator_id: string;        // Fanbasis creator ID
  creator_name: string;      // Creator name/username
  connected_at: string;      // ISO timestamp of connection
}
```

## Token Lifetime

- **Access Token**: 15 days (1,296,000 seconds)
- **Refresh Token**: 30 days

## Error Handling

All errors redirect to the callback HTML page with error parameters:
- Invalid state token
- Missing code verifier
- Token exchange failure
- Database update failure

## Callback HTML

Success/error is displayed in `/fanbasis-callback.html` which:
- Shows connection status
- Posts message to parent window
- Auto-closes after 1.5 seconds
