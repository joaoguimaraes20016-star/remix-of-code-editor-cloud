

## Fix: Typeform OAuth Scope Format

### Problem

Typeform requires scopes to be separated with `+` in the OAuth URL, not spaces or `%20`. The current implementation uses spaces which get URL-encoded incorrectly.

### Current (Line 106)
```typescript
const scopes = "forms:read responses:read webhooks:write accounts:read";
```

When set via `URLSearchParams`, this becomes:
```
scope=forms%3Aread%20responses%3Aread%20webhooks%3Awrite%20accounts%3Aread
```

### Fixed Version
```typescript
const scopes = "accounts:read+forms:read+responses:read+webhooks:read+webhooks:write";
```

This will produce the correct URL format:
```
scope=accounts%3Aread%2Bforms%3Aread%2Bresponses%3Aread%2Bwebhooks%3Aread%2Bwebhooks%3Awrite
```

### Changes

| Scope | Purpose |
|-------|---------|
| `accounts:read` | Identify connected account via `/me` |
| `forms:read` | List forms so user can pick one |
| `responses:read` | Pull form submissions |
| `webhooks:read` | List/manage existing webhooks |
| `webhooks:write` | Create webhooks for real-time sync |

### Steps

1. Update `supabase/functions/typeform-oauth-start/index.ts` line 106 to use `+` separators
2. Add `webhooks:read` scope for complete webhook management
3. Redeploy the `typeform-oauth-start` edge function
4. Test the Typeform connection flow

