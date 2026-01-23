
# Meta & Google Ads OAuth Integration

## Overview
Implementing full OAuth integrations for Meta (Facebook Business) and Google Ads. Based on your input:
- **Meta**: New OAuth flow using the secrets you just added
- **Google Ads**: Extend existing Google OAuth to add `ads` scope (no new secrets needed)

---

## Secrets Status

| Secret | Status |
|--------|--------|
| `META_CLIENT_ID` | Added by you |
| `META_CLIENT_SECRET` | Added by you |
| `GOOGLE_CLIENT_ID` | Already exists |
| `GOOGLE_CLIENT_SECRET` | Already exists |

Google Ads uses the same Google OAuth credentials. You enabled the Google Ads API scope on your existing Google Cloud project.

---

## Files to Create

### Edge Functions (4 files)

| File | Purpose |
|------|---------|
| `supabase/functions/meta-oauth-start/index.ts` | Initiates Meta OAuth flow |
| `supabase/functions/meta-oauth-callback/index.ts` | Handles Meta callback, stores tokens |
| `supabase/functions/google-ads-oauth-start/index.ts` | Initiates Google Ads OAuth (uses existing Google credentials + ads scope) |
| `supabase/functions/google-ads-oauth-callback/index.ts` | Handles Google Ads callback, stores tokens |

### Callback HTML Pages (2 files)

| File | Purpose |
|------|---------|
| `public/meta-callback.html` | Popup callback for Meta OAuth |
| `public/google-ads-callback.html` | Popup callback for Google Ads OAuth |

### Config Components (2 files)

| File | Purpose |
|------|---------|
| `src/components/MetaConfig.tsx` | Meta connection/disconnect UI |
| `src/components/GoogleAdsConfig.tsx` | Google Ads connection/disconnect UI |

### Assets (1 file)

| File | Status |
|------|--------|
| `src/assets/integrations/meta.svg` | Already exists |
| `src/assets/integrations/google-ads.svg` | Need to create |

---

## Files to Update

### 1. `supabase/config.toml`
Add configurations for the 4 new edge functions:
```toml
[functions.meta-oauth-start]
verify_jwt = false

[functions.meta-oauth-callback]
verify_jwt = false

[functions.google-ads-oauth-start]
verify_jwt = false

[functions.google-ads-oauth-callback]
verify_jwt = false
```

### 2. `src/pages/AppsPortal.tsx`
- Import `MetaConfig` and `GoogleAdsConfig` components
- Import `meta.svg` and `google-ads.svg` logos
- Add Meta and Google Ads to the `apps` array in a new "Ads & Marketing" category
- Add dialog states for both integrations
- Add status checks for `meta_connected` and `google_ads_connected`
- Add dialog components for configuration

---

## Technical Details

### Meta OAuth Configuration
- **Scopes**: `ads_management`, `ads_read`, `business_management`, `leads_retrieval`, `pages_read_engagement`
- **Token URL**: `https://graph.facebook.com/v18.0/oauth/access_token`
- **User Info**: `https://graph.facebook.com/me`
- **State**: Base64 encoded `teamId:stateToken`

### Google Ads OAuth Configuration
- **Scopes**: `https://www.googleapis.com/auth/adwords` (plus identity scopes)
- **Token URL**: `https://oauth2.googleapis.com/token`
- Uses same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Stored as separate `integration_type: "google_ads"` (not merged with existing Google integration)

### Database Storage
Both integrations store in `team_integrations` table:
```text
integration_type: "meta" or "google_ads"
is_connected: true
config: {
  access_token: "...",
  refresh_token: "...",
  token_expires_at: "...",
  email: "...",
  name: "...",
  connected_at: "...",
  scope: "..."
}
```

### Security View
The `team_integrations_public` view automatically masks tokens, exposing:
- `is_connected`
- `config_safe` (email, name, connected_at only)

---

## Implementation Order

1. Create Meta edge functions (meta-oauth-start, meta-oauth-callback)
2. Create Google Ads edge functions (google-ads-oauth-start, google-ads-oauth-callback)
3. Update config.toml with new function configurations
4. Create callback HTML pages (meta-callback.html, google-ads-callback.html)
5. Create config components (MetaConfig.tsx, GoogleAdsConfig.tsx)
6. Create Google Ads logo asset
7. Update AppsPortal.tsx to add both integrations

---

## After Connection

### Meta enables:
- Automation action: "Meta Conversion" (CAPI events)
- Trigger: "Facebook Lead Form" (lead capture)
- Future: Custom Audiences sync

### Google Ads enables:
- Automation action: "Google Ads Conversion" (offline conversions)
- Trigger: "Google Lead Form" (lead capture)
- Future: Customer Match sync

---

## Summary

| Component | Meta | Google Ads |
|-----------|------|------------|
| OAuth Start | `meta-oauth-start` | `google-ads-oauth-start` |
| OAuth Callback | `meta-oauth-callback` | `google-ads-oauth-callback` |
| Config Component | `MetaConfig.tsx` | `GoogleAdsConfig.tsx` |
| Callback Page | `meta-callback.html` | `google-ads-callback.html` |
| Logo | `meta.svg` (exists) | `google-ads.svg` (create) |
| Secrets | `META_CLIENT_ID`, `META_CLIENT_SECRET` | Uses existing Google |

**Total**: 9 new files + 2 file updates
