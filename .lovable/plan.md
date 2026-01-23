
# Typeform Integration Plan

## Overview

Connect Typeform to capture form responses as leads in Infostack. This integration follows the established per-team OAuth pattern used by Zoom, Slack, and other integrations.

---

## What You'll Get

- **Connect Typeform** via OAuth from the Apps portal
- **Capture form responses** as leads automatically
- **Trigger automations** when new responses come in
- **View connection status** with the connected account email

---

## Architecture

The integration uses the same two-phase OAuth handshake pattern as Zoom:

```text
+------------------+     +-----------------------+     +------------------+
|   Apps Portal    | --> | typeform-oauth-start  | --> | Typeform OAuth   |
|   (Frontend)     |     | (Edge Function)       |     | Authorization    |
+------------------+     +-----------------------+     +------------------+
                                                                |
                                                                v
+------------------+     +-----------------------+     +------------------+
| TypeformConfig   | <-- | typeform-oauth-       | <-- | Typeform         |
| (Success Toast)  |     | callback (Edge Func)  |     | Redirect + Code  |
+------------------+     +-----------------------+     +------------------+
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/assets/integrations/typeform.svg` | Create | Typeform logo |
| `supabase/functions/typeform-oauth-start/index.ts` | Create | Initiate OAuth flow |
| `supabase/functions/typeform-oauth-callback/index.ts` | Create | Handle callback, store tokens |
| `public/typeform-callback.html` | Create | Popup callback handler |
| `src/components/TypeformConfig.tsx` | Create | Frontend config component |
| `src/pages/AppsPortal.tsx` | Modify | Add Typeform to apps list |

---

## Required Secrets

You'll need to add these secrets to Supabase Edge Functions:

| Secret | Description |
|--------|-------------|
| `TYPEFORM_CLIENT_ID` | From Typeform Developer Portal |
| `TYPEFORM_CLIENT_SECRET` | From Typeform Developer Portal |

---

## Typeform App Setup (External)

Before testing, you'll need to create a Typeform app:

1. Go to [Typeform Developer Portal](https://admin.typeform.com/applications)
2. Create a new application
3. Set the Redirect URI to: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/typeform-oauth-callback`
4. Copy the Client ID and Client Secret
5. Add them as Supabase secrets

---

## Technical Details

### Edge Function: `typeform-oauth-start`

Based on the Zoom pattern, this function will:
- Verify user authentication via JWT
- Check team membership
- Generate a state token (UUID) for CSRF protection
- Store state in `team_integrations` table with `integration_type: "typeform"`
- Return the Typeform authorization URL

**Scopes requested:**
- `forms:read` - Read form definitions
- `responses:read` - Read form responses
- `webhooks:write` - Create webhooks for real-time responses
- `accounts:read` - Get account info (email)

### Edge Function: `typeform-oauth-callback`

This function will:
- Validate the state token
- Exchange the authorization code for access/refresh tokens
- Fetch user account info from Typeform API
- Store tokens and metadata in `team_integrations`
- Redirect to `typeform-callback.html` with success/error status

### Frontend Component: `TypeformConfig.tsx`

Following the `ZoomConfig.tsx` pattern:
- Use synchronous popup (`window.open("about:blank")`) to avoid blockers
- Listen for `postMessage` from callback page
- Polling fallback (every 2.5s) to detect connection completion
- Query `team_integrations_public` view for connection status
- Disconnect mutation to remove integration

### Apps Portal Updates

Add Typeform to:
- The `apps` array under category `"analytics"` (form data collection)
- Import the Typeform logo
- Add dialog state and handler
- Add dialog component for TypeformConfig

---

## Database

No schema changes needed - uses existing `team_integrations` table with:
- `integration_type: "typeform"`
- `config` JSONB containing tokens and metadata
- `is_connected: true` after successful OAuth

The `team_integrations_public` view already handles masking sensitive tokens.

---

## Implementation Steps

1. **Add Typeform secrets** to Supabase (TYPEFORM_CLIENT_ID, TYPEFORM_CLIENT_SECRET)
2. **Create Typeform logo** SVG asset
3. **Create `typeform-oauth-start`** edge function
4. **Create `typeform-oauth-callback`** edge function  
5. **Create `typeform-callback.html`** popup callback page
6. **Create `TypeformConfig.tsx`** frontend component
7. **Update `AppsPortal.tsx`** to include Typeform
8. **Deploy and test** the OAuth flow
