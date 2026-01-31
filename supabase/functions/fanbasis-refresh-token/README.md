# Fanbasis Token Refresh Function

Refreshes expired Fanbasis OAuth access tokens using the refresh token.

## Environment Variables Required

```bash
FANBASIS_CLIENT_ID=your_client_id_here
FANBASIS_CLIENT_SECRET=your_client_secret_here
FANBASIS_BASE_URL=https://fanbasis.com  # Optional
```

## Usage

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/fanbasis-refresh-token`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId: 'team-uuid'
    })
  }
);

const result = await response.json();
// { success: true, expires_at: "2026-02-15T...", scope: "creator:api" }
```

## When to Refresh

Access tokens expire after 15 days. Refresh when:
- Token expiration is approaching (e.g., within 1 day)
- API calls return 401 Unauthorized
- Proactively before making API calls

## Automatic Refresh Example

```typescript
async function getFanbasisToken(teamId: string) {
  const { data: integration } = await supabase
    .from('team_integrations')
    .select('config')
    .eq('team_id', teamId)
    .eq('integration_type', 'fanbasis')
    .eq('is_connected', true)
    .single();

  if (!integration) {
    throw new Error('Fanbasis not connected');
  }

  const config = integration.config;
  const expiresAt = new Date(config.expires_at);
  const now = new Date();
  
  // Refresh if token expires within 24 hours
  const shouldRefresh = (expiresAt.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

  if (shouldRefresh) {
    const { data: { session } } = await supabase.auth.getSession();
    
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fanbasis-refresh-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId })
      }
    );

    // Fetch updated token
    const { data: updated } = await supabase
      .from('team_integrations')
      .select('config')
      .eq('team_id', teamId)
      .eq('integration_type', 'fanbasis')
      .single();

    return updated?.config?.access_token;
  }

  return config.access_token;
}
```

## Error Handling

### Invalid Refresh Token (401)
If the refresh token is invalid or expired:
- Integration is marked as `is_connected: false`
- User must reconnect their Fanbasis account
- Response includes `reconnect_required: true`

### Other Errors
- Network errors: Retry with exponential backoff
- Server errors (500): Retry later
- Rate limits (429): Wait and retry

## Response Format

### Success
```json
{
  "success": true,
  "expires_at": "2026-02-15T10:30:00.000Z",
  "scope": "creator:api"
}
```

### Error - Reconnect Required
```json
{
  "error": "Refresh token invalid or expired. Please reconnect your Fanbasis account.",
  "reconnect_required": true
}
```

### Error - Other
```json
{
  "error": "Token refresh failed: ..."
}
```

## Security

- Requires valid user authentication
- Verifies team membership
- Refresh token never exposed to frontend
- Failed refresh attempts logged
- Invalid tokens trigger disconnection
