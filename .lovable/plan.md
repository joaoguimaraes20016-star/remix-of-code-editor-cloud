
## Zapier Integration Setup

This plan creates a full Zapier integration using Zapier's "Private Integration" model, where **you** act as the OAuth provider and generate your own credentials.

---

### How Zapier Works (Different from other integrations!)

Unlike Slack/Zoom where **they** give you credentials, with Zapier:
1. **You generate** a Client ID and Secret (we'll create random UUIDs)
2. **You provide** OAuth endpoints that Zapier calls to authorize users
3. Users connect via Zapier → Zapier calls your OAuth server → tokens issued

This allows Zapier to trigger actions in your app (e.g., "New Lead" triggers a Zap) and let Zaps write data to your app.

---

### Credentials to Generate

You'll need to generate these and save them as Supabase secrets:

| Secret Name | Description |
|-------------|-------------|
| `ZAPIER_CLIENT_ID` | Random UUID you generate (e.g., `zap_abc123...`) |
| `ZAPIER_CLIENT_SECRET` | Random UUID you generate (strong random string) |

You can generate these yourself or I can provide values for you to copy.

---

### Edge Functions to Create

| Function | Purpose |
|----------|---------|
| `zapier-oauth-authorize` | Authorization page where users approve Zapier access |
| `zapier-oauth-token` | Token exchange endpoint Zapier calls |
| `zapier-oauth-refresh` | Token refresh endpoint |
| `zapier-triggers` | Exposes triggers (New Lead, New Appointment, etc.) |
| `zapier-actions` | Receives actions from Zaps (Create Lead, Send Message, etc.) |

---

### Frontend Changes

| File | Action |
|------|--------|
| `src/components/ZapierConfig.tsx` | New config component for Zapier setup |
| `src/components/IntegrationsPortal.tsx` | Add Zapier dialog and connection status |
| `public/zapier-callback.html` | OAuth callback page |

---

### Database Usage

Zapier tokens will be stored in the existing `team_integrations` table with `integration_type = 'zapier'`, following the established pattern.

---

### Zapier Developer Portal Configuration

After implementation, you'll configure these URLs in Zapier Developer Platform:

| Setting | Value |
|---------|-------|
| Authorization URL | `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-authorize` |
| Token URL | `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-token` |
| Refresh URL | `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-oauth-refresh` |
| Triggers URL | `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/zapier-triggers` |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/zapier-oauth-authorize/index.ts` | Create |
| `supabase/functions/zapier-oauth-token/index.ts` | Create |
| `supabase/functions/zapier-oauth-refresh/index.ts` | Create |
| `supabase/functions/zapier-triggers/index.ts` | Create |
| `supabase/functions/zapier-actions/index.ts` | Create |
| `src/components/ZapierConfig.tsx` | Create |
| `src/components/IntegrationsPortal.tsx` | Modify |
| `public/zapier-callback.html` | Create |
| `supabase/config.toml` | Add function configurations |

---

### Triggers to Expose

Initial triggers available to Zapier users:

- **New Lead** - Fires when a new lead is created
- **New Appointment** - Fires when a Calendly appointment is booked
- **Lead Status Changed** - Fires when a lead moves pipeline stages

### Actions to Expose

Initial actions Zapier users can trigger:

- **Create Lead** - Add a new lead to CRM
- **Update Lead** - Modify an existing lead
- **Add Note to Lead** - Append a note to a lead record

---

### Technical Details

**zapier-oauth-authorize:**
- Renders an authorization page with team selector
- Validates user session via Supabase Auth
- Generates authorization code and redirects to Zapier's `redirect_uri`

**zapier-oauth-token:**
- Validates `client_id` and `client_secret` against stored secrets
- Exchanges authorization code for access token
- Returns access_token, refresh_token, and expiry

**zapier-triggers:**
- Uses polling or REST hooks pattern
- Returns latest data for trigger type
- Supports deduplication via unique IDs

**zapier-actions:**
- Validates access token
- Performs requested action (create lead, etc.)
- Returns result to Zapier
