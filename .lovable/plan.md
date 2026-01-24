

## Add TikTok Integration

This plan adds a complete TikTok OAuth integration following the established pattern used by Discord, Zoom, and Typeform.

---

### Summary

| Component | Status | Action |
|-----------|--------|--------|
| Logo (`tiktok.svg`) | Exists | No change needed |
| Edge Functions | Missing | Create `tiktok-oauth-start` and `tiktok-oauth-callback` |
| Config Component | Missing | Create `TikTokConfig.tsx` |
| Apps Portal | Not listed | Add TikTok to `apps` array |
| Callback HTML | Missing | Create `tiktok-callback.html` |
| Secrets | Not configured | Add `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET` |
| Config.toml | Not registered | Add function entries |

---

### Prerequisites

Before implementation, I will prompt you to add these secrets:
- `TIKTOK_CLIENT_ID` - Your TikTok app's client ID
- `TIKTOK_CLIENT_SECRET` - Your TikTok app's client secret

---

### Implementation Steps

**Step 1: Create Edge Functions**

**`supabase/functions/tiktok-oauth-start/index.ts`**
- Accept `teamId` and `redirectUri` from request body
- Verify user authentication and team membership
- Generate state token for CSRF protection
- Store state in `team_integrations` table
- Build TikTok OAuth URL with scopes for user info and business access
- Return the auth URL to the frontend

**`supabase/functions/tiktok-oauth-callback/index.ts`**
- Parse OAuth response (`code`, `state`, `error`)
- Verify state token matches stored value
- Exchange authorization code for access/refresh tokens
- Fetch TikTok user info (username, display name)
- Update `team_integrations` with tokens and connection status
- Redirect to callback HTML page with success/error status

**Step 2: Create TikTok Callback HTML**

**`public/tiktok-callback.html`**
- Parse URL query params for success/error
- Use `postMessage` to notify parent window of result
- Auto-close popup after short delay

**Step 3: Create TikTok Config Component**

**`src/components/TikTokConfig.tsx`**
- Query `team_integrations` for TikTok connection status
- Handle OAuth popup flow similar to Discord/Zoom
- Display connected account info when connected
- Provide disconnect functionality with confirmation dialog
- Show usage instructions for automations

**Step 4: Update Apps Portal**

**`src/pages/AppsPortal.tsx`**
- Import `TikTokConfig` component
- Import `tiktokLogo` from assets
- Add TikTok to `apps` array in "ads" category
- Add state for TikTok dialog
- Add click handler for TikTok app card
- Add TikTok dialog with config component

**Step 5: Register Edge Functions**

**`supabase/config.toml`**
- Add `[functions.tiktok-oauth-start]` with `verify_jwt = false`
- Add `[functions.tiktok-oauth-callback]` with `verify_jwt = false`

---

### TikTok OAuth Scopes

The integration will request these scopes:
- `user.info.basic` - Access basic user profile
- `user.info.profile` - Access display name and avatar

---

### File Changes Summary

| File | Action |
|------|--------|
| `supabase/functions/tiktok-oauth-start/index.ts` | Create |
| `supabase/functions/tiktok-oauth-callback/index.ts` | Create |
| `public/tiktok-callback.html` | Create |
| `src/components/TikTokConfig.tsx` | Create |
| `src/pages/AppsPortal.tsx` | Modify |
| `supabase/config.toml` | Modify |

---

### Data Flow

```text
┌─────────────────┐     ┌────────────────────┐     ┌─────────────┐
│   AppsPortal    │────▶│  TikTokConfig.tsx  │────▶│   Popup     │
│  (click TikTok) │     │  (opens popup)     │     │  Window     │
└─────────────────┘     └────────────────────┘     └──────┬──────┘
                                                          │
                        ┌────────────────────┐            │
                        │ tiktok-oauth-start │◀───────────┘
                        │   (edge function)  │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │   TikTok OAuth     │
                        │   (authorize app)  │
                        └─────────┬──────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │tiktok-oauth-callback│
                        │   (exchange code)   │
                        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │tiktok-callback.html │
                        │(postMessage result) │
                        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌─────────────────────┐
                        │  TikTokConfig.tsx   │
                        │(receives message,   │
                        │ refetches status)   │
                        └─────────────────────┘
```

