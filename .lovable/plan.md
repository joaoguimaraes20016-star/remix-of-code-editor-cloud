

## Fix: Update Zoom OAuth Scopes to Match Marketplace Configuration

### Problem

The edge function is requesting scopes that don't match the exact scope names configured in your Zoom app:

| Requested (current)  | Configured in Zoom       |
|----------------------|--------------------------|
| `meeting:write`      | `meeting:write:meeting`  |
| `meeting:read`       | `meeting:read:meeting`   |
| `user:read`          | `user:read:user`         |

### Solution

Update `supabase/functions/zoom-oauth-start/index.ts` line 118:

**From:**
```typescript
const scopes = "meeting:write meeting:read user:read";
```

**To:**
```typescript
const scopes = "meeting:write:meeting meeting:read:meeting user:read:user";
```

### Steps

1. Update the scopes string in `zoom-oauth-start/index.ts`
2. Redeploy the `zoom-oauth-start` edge function
3. Test the Zoom connection flow

### Technical Details

- The granular scopes (`meeting:write:meeting`) are the newer format Zoom uses
- These scopes allow: creating meetings for the connected user, viewing meeting details, and reading user profile
- No database changes needed - this is purely an edge function update

