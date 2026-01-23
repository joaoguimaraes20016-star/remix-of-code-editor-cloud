
# Fathom Integration

## Overview
Add Fathom (meeting recording & transcription) integration following the established OAuth pattern used by Discord, Slack, Zoom, and Typeform.

## Prerequisites

Before implementing, you'll need to:
1. Register an app in the [Fathom Developer Portal](https://developers.fathom.ai)
2. Obtain your `Client ID` and `Client Secret`
3. Configure the redirect URI in Fathom's portal to: `https://inbvluddkutyfhsxfqco.supabase.co/functions/v1/fathom-oauth-callback`

## Secrets Required

| Secret | Description |
|--------|-------------|
| `FATHOM_CLIENT_ID` | OAuth Client ID from Fathom Developer Portal |
| `FATHOM_CLIENT_SECRET` | OAuth Client Secret from Fathom Developer Portal |

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/fathom-oauth-start/index.ts` | Initiates OAuth flow, stores state token |
| `supabase/functions/fathom-oauth-callback/index.ts` | Exchanges auth code for tokens, stores connection |
| `public/fathom-callback.html` | Popup callback page with success/error UI |
| `src/components/FathomConfig.tsx` | Frontend config component with connect/disconnect UI |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/config.toml` | Add config for both edge functions (`verify_jwt = false`) |
| `src/components/IntegrationsPortal.tsx` | Add Fathom to integrations list and dialog handler |

## Fathom OAuth Endpoints

| Endpoint | URL |
|----------|-----|
| Authorization | `https://fathom.video/external/v1/oauth2/authorize` |
| Token Exchange | `https://fathom.video/external/v1/oauth2/token` |

---

## Implementation Details

### 1. Edge Function: `fathom-oauth-start`

Handles the initiation of the OAuth flow:
- Verifies user auth token
- Validates team membership
- Generates CSRF state token
- Stores state in `team_integrations` table
- Returns Fathom authorization URL

```
Request: POST { teamId, redirectUri }
Response: { authUrl: "https://fathom.video/external/v1/oauth2/authorize?..." }
```

**Auth URL Parameters:**
- `client_id`: From `FATHOM_CLIENT_ID` secret
- `redirect_uri`: Edge function callback URL
- `response_type`: `code`
- `scope`: `public_api`
- `state`: `{teamId}:{stateToken}`

### 2. Edge Function: `fathom-oauth-callback`

Handles the OAuth callback from Fathom:
- Parses authorization code and state from URL
- Validates state token against stored value
- Exchanges code for access/refresh tokens via POST to token endpoint
- Fetches user info from Fathom API
- Stores tokens and connection info in `team_integrations`
- Redirects to `fathom-callback.html` with success/error status

**Token Exchange Request:**
```
POST https://fathom.video/external/v1/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
code={authorization_code}
client_id={FATHOM_CLIENT_ID}
client_secret={FATHOM_CLIENT_SECRET}
redirect_uri={callback_url}
```

### 3. Callback HTML: `public/fathom-callback.html`

Displays connection status and communicates back to parent window:
- Shows success/error message with Fathom branding (purple gradient: `#5636D3`)
- Posts message to opener window via `postMessage`
- Auto-closes after 1.5 seconds

### 4. Frontend Component: `src/components/FathomConfig.tsx`

React component following the Discord/Slack pattern:
- Fetches integration status from `team_integrations_public` view
- Shows connected status with user info when connected
- Shows connect button when disconnected
- Opens popup for OAuth flow
- Handles `postMessage` from callback + polling fallback
- Disconnect mutation to remove integration

### 5. Update IntegrationsPortal

Add Fathom to the integrations list:

```typescript
{
  id: "fathom",
  name: "Fathom",
  description: "Meeting recordings and transcriptions",
  icon: Video,
  category: "video",
  status: "available",
  configurable: true,
}
```

Add state and dialog handler for Fathom config.

### 6. Update config.toml

Add function configurations:

```toml
[functions.fathom-oauth-start]
verify_jwt = false

[functions.fathom-oauth-callback]
verify_jwt = false
```

---

## Data Flow Diagram

```text
User clicks "Connect Fathom"
         │
         ▼
┌─────────────────────────────────────┐
│  FathomConfig.tsx                   │
│  - Opens popup                      │
│  - Calls fathom-oauth-start         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  fathom-oauth-start (Edge Function) │
│  - Validates auth & team membership │
│  - Generates state token            │
│  - Stores in team_integrations      │
│  - Returns Fathom auth URL          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Fathom OAuth Page                  │
│  - User authorizes app              │
│  - Redirects with code + state      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  fathom-oauth-callback (Edge Func)  │
│  - Validates state token            │
│  - Exchanges code for tokens        │
│  - Stores tokens in team_integ.     │
│  - Redirects to callback HTML       │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  fathom-callback.html               │
│  - Shows success/error              │
│  - Posts message to parent window   │
│  - Auto-closes                      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  FathomConfig.tsx                   │
│  - Receives postMessage             │
│  - Refetches integration status     │
│  - Shows "Connected" state          │
└─────────────────────────────────────┘
```

---

## Security Considerations

- State token for CSRF protection (validated on callback)
- Tokens stored server-side only (not exposed to frontend)
- RLS policies on `team_integrations` protect data
- Frontend uses `team_integrations_public` view (exposes only safe fields)

## After Implementation

Once connected, Fathom can be used to:
- Automatically import meeting recordings
- Trigger automations based on call events
- Attach recordings to CRM leads
- Generate call summaries and transcripts
