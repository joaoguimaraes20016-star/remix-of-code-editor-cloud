
# Discord Integration Implementation

## Overview
Add Discord as a fully functional integration allowing teams to send messages to Discord channels from automations. This follows the established OAuth pattern used by Slack, Zoom, and Typeform.

## Prerequisites (User Action Required)

Before implementation, you need to create a Discord application:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → Name it "Infostack" (or your preferred name)
3. Go to **OAuth2** → **General**
4. Add redirect URL: `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/discord-oauth-callback`
5. Copy the **Client ID** and **Client Secret**
6. Go to **Bot** → Click **Add Bot** → Enable required intents if needed
7. Provide me with the Client ID and Client Secret to add as Supabase secrets

## Implementation Summary

| Component | File | Purpose |
|-----------|------|---------|
| OAuth Start | `supabase/functions/discord-oauth-start/index.ts` | Initiates OAuth flow |
| OAuth Callback | `supabase/functions/discord-oauth-callback/index.ts` | Handles token exchange |
| Config Component | `src/components/DiscordConfig.tsx` | Frontend configuration UI |
| Callback Page | `public/discord-callback.html` | Popup communication bridge |
| Logo Asset | `src/assets/integrations/discord.svg` | Discord brand icon |
| Apps Portal Update | `src/pages/AppsPortal.tsx` | Add Discord to app list |
| Edge Config | `supabase/config.toml` | Register new functions |

## Technical Details

### 1. Edge Function: `discord-oauth-start`

Initiates the Discord OAuth flow with bot permissions:

```text
Endpoint: POST /functions/v1/discord-oauth-start
Input: { teamId, redirectUri }
Output: { authUrl }

OAuth URL Parameters:
- client_id: DISCORD_CLIENT_ID
- redirect_uri: discord-oauth-callback URL
- response_type: code
- scope: bot applications.commands
- permissions: 2048 (SEND_MESSAGES)
- state: {teamId}:{stateToken}
```

### 2. Edge Function: `discord-oauth-callback`

Handles the OAuth callback and stores credentials:

```text
Endpoint: GET /functions/v1/discord-oauth-callback
Query Params: code, state, guild_id

Token Exchange:
- POST https://discord.com/api/v10/oauth2/token
- Content-Type: application/x-www-form-urlencoded

Stored in team_integrations:
- access_token, refresh_token
- guild_id, guild_name
- bot_user_id
- connected_at
```

### 3. Frontend Component: `DiscordConfig.tsx`

Follows the `SlackConfig.tsx` pattern:
- Synchronous popup opening (avoids blockers)
- postMessage communication
- Polling fallback (2.5s interval)
- 2-minute connection timeout
- Disconnect with confirmation dialog

### 4. AppsPortal Updates

Add Discord to the apps array and wire up the dialog:
- Category: "communication" (alongside Slack)
- Status: "available"
- Configurable: true

### 5. Required Secrets

| Secret | Description |
|--------|-------------|
| DISCORD_CLIENT_ID | From Discord Developer Portal |
| DISCORD_CLIENT_SECRET | From Discord Developer Portal |

## Data Flow

```text
User clicks "Connect Discord"
         │
         ▼
┌─────────────────────────────┐
│  DiscordConfig.tsx          │
│  Opens popup to about:blank │
│  Invokes discord-oauth-start│
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  discord-oauth-start        │
│  Stores state in DB         │
│  Returns Discord auth URL   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Discord Authorization Page │
│  User selects server        │
│  Authorizes bot permissions │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  discord-oauth-callback     │
│  Exchanges code for tokens  │
│  Stores in team_integrations│
│  Redirects to callback.html │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  discord-callback.html      │
│  postMessage to opener      │
│  Auto-closes after 1.5s     │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  DiscordConfig.tsx          │
│  Receives success message   │
│  Shows "Connected" status   │
└─────────────────────────────┘
```

## Files to Create

1. `supabase/functions/discord-oauth-start/index.ts` - OAuth initiation
2. `supabase/functions/discord-oauth-callback/index.ts` - Token exchange
3. `src/components/DiscordConfig.tsx` - Configuration UI
4. `public/discord-callback.html` - Popup callback page
5. `src/assets/integrations/discord.svg` - Discord logo

## Files to Modify

1. `src/pages/AppsPortal.tsx` - Add Discord app entry and dialog
2. `supabase/config.toml` - Register new edge functions

## Next Steps After Implementation

1. Test the full OAuth flow end-to-end
2. Implement `executeDiscordMessage` action for automations (future)
3. Add channel selection UI (optional enhancement)
