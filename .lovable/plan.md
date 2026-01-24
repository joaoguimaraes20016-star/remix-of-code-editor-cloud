
## Add Zapier OAuth Test Endpoint

Zapier requires a **Test Authentication** endpoint to verify that the OAuth flow is working correctly. This endpoint validates the access token and returns basic account information.

---

### The Issue

Your Zapier configuration is looking for:
```
GET https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-test
```

This endpoint doesn't exist yet, so Zapier can't complete the authentication test.

---

### Solution

Create a new edge function that:
1. Validates the Bearer access token from the Authorization header
2. Returns basic account/team info that Zapier can use for the connection label

---

### File to Create

| File | Purpose |
|------|---------|
| `supabase/functions/zapier-oauth-test/index.ts` | Validates access token and returns team info |

---

### File to Modify

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `zapier-oauth-test` function configuration |

---

### What the Test Endpoint Returns

```json
{
  "id": "team-uuid",
  "name": "Team Name",
  "connected_at": "2024-01-24T..."
}
```

This allows Zapier to:
- Verify the token is valid
- Display a meaningful connection label (e.g., "Team Name" instead of just "Connected")

---

### Technical Implementation

The function will:
1. Extract the Bearer token from the `Authorization` header
2. Look up the `team_integrations` record with matching `access_token`
3. Check that `is_connected = true` and token hasn't expired
4. Fetch the associated team name from the `teams` table
5. Return team info or 401 if invalid

This follows the same token validation pattern already used in `zapier-triggers` and `zapier-actions`.
