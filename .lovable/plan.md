

## Fix Plan: Zoom OAuth "Invalid Scope" and Missing Database View

### Part 1: Fix Edge Function Scopes

**File:** `supabase/functions/zoom-oauth-start/index.ts`

Change line 118 from:
```typescript
const scopes = "meeting:write:admin meeting:read:admin user:read";
```
To:
```typescript
const scopes = "meeting:write meeting:read user:read";
```

Then redeploy the `zoom-oauth-start` edge function.

---

### Part 2: Add Scopes in Zoom Marketplace

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/) and open your app
2. Navigate to **Build** -> **Scopes**
3. Add these scopes:
   - `meeting:write` - Create and manage meetings
   - `meeting:read` - View meeting details
   - `user:read` - Read user information
4. Click **Save** or **Done**
5. If the app is in development mode, you may need to re-authorize

---

### Part 3: Create the Missing Database View

Create a new SQL migration to add the `team_integrations_public` view that exposes safe integration data:

```sql
-- Create a secure view for team integrations that masks sensitive tokens
CREATE OR REPLACE VIEW public.team_integrations_public
WITH (security_invoker = on)
AS
SELECT
  ti.id,
  ti.team_id,
  ti.integration_type,
  ti.is_connected,
  ti.connected_at,
  ti.created_at,
  ti.updated_at,
  -- Build config_safe by extracting only non-sensitive fields
  jsonb_build_object(
    'email', ti.config->>'email',
    'name', ti.config->>'name',
    'connected_at', ti.config->>'connected_at',
    'workspace_name', ti.config->>'workspace_name',
    'team_name', ti.config->>'team_name',
    'channel_name', ti.config->>'channel_name',
    'scope', ti.config->>'scope'
  ) AS config_safe
FROM public.team_integrations ti;

-- Grant SELECT to authenticated users (RLS on base table will apply)
GRANT SELECT ON public.team_integrations_public TO authenticated;
```

This view:
- Uses `security_invoker = on` so RLS policies from `team_integrations` are enforced
- Only exposes safe metadata (email, name, workspace_name, etc.)
- Excludes sensitive fields like `access_token`, `refresh_token`, `token_expires_at`

---

### Summary of Changes

| Step | Action |
|------|--------|
| 1 | Update `zoom-oauth-start` to use non-admin scopes: `meeting:write meeting:read user:read` |
| 2 | Add those scopes in Zoom App Marketplace and save |
| 3 | Create `team_integrations_public` view via SQL migration |
| 4 | Redeploy `zoom-oauth-start` edge function |
| 5 | Test the Zoom connection flow |

