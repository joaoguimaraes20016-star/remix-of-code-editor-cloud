
# Full OAuth Integration: Meta & Google Ads

## Overview

Implement full OAuth integrations for Meta (Facebook Business) and Google Ads, following the same proven pattern as Zoom, Discord, and Fathom. Users will be able to connect their Meta Business and Google Ads accounts to enable:

- **Meta**: Lead Forms, Conversions API (CAPI), Custom Audiences
- **Google Ads**: Conversion tracking, Offline conversions, Customer Match

---

## Required Secrets

Before implementation, you'll need to add these API credentials:

| Secret | Provider | Where to Get |
|--------|----------|--------------|
| `META_CLIENT_ID` | Meta | [Meta Developers](https://developers.facebook.com/) → Create App |
| `META_CLIENT_SECRET` | Meta | Same as above |
| `GOOGLE_ADS_CLIENT_ID` | Google | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_ADS_CLIENT_SECRET` | Google | Same as above |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google | [Google Ads API Center](https://ads.google.com/aw/apicenter) |

---

## Files to Create

### 1. Edge Functions (8 files)

| File | Purpose |
|------|---------|
| `supabase/functions/meta-oauth-start/index.ts` | Initiates Meta OAuth flow |
| `supabase/functions/meta-oauth-callback/index.ts` | Handles Meta callback, stores tokens |
| `supabase/functions/google-ads-oauth-start/index.ts` | Initiates Google Ads OAuth flow |
| `supabase/functions/google-ads-oauth-callback/index.ts` | Handles Google Ads callback |

### 2. Callback HTML Pages (2 files)

| File | Purpose |
|------|---------|
| `public/meta-callback.html` | Popup callback for Meta OAuth |
| `public/google-ads-callback.html` | Popup callback for Google Ads OAuth |

### 3. Config Components (2 files)

| File | Purpose |
|------|---------|
| `src/components/MetaConfig.tsx` | Meta connection/disconnect UI |
| `src/components/GoogleAdsConfig.tsx` | Google Ads connection/disconnect UI |

### 4. Assets (2 files)

| File | Purpose |
|------|---------|
| `src/assets/integrations/meta.svg` | Already exists ✓ |
| `src/assets/integrations/google-ads.svg` | Google Ads logo |

### 5. Updates to Existing Files

| File | Changes |
|------|---------|
| `src/pages/AppsPortal.tsx` | Add Meta & Google Ads to apps array, dialogs, handlers |
| `supabase/config.toml` | Add function configurations |

---

## Technical Implementation Details

### Meta OAuth Scopes
```text
ads_management
ads_read
business_management
leads_retrieval
pages_read_engagement
```

### Google Ads OAuth Scopes
```text
https://www.googleapis.com/auth/adwords
```

### OAuth Flow Pattern (Same as Zoom/Discord)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         OAuth Flow Diagram                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks "Connect"                                              │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────┐                                              │
│  │  Frontend opens  │                                              │
│  │  popup window    │                                              │
│  └────────┬─────────┘                                              │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────┐      ┌─────────────────────┐             │
│  │  *-oauth-start       │─────►│  Meta/Google OAuth  │             │
│  │  Edge Function       │      │  Consent Screen     │             │
│  └──────────────────────┘      └──────────┬──────────┘             │
│                                           │                         │
│                                           ▼                         │
│                                ┌─────────────────────┐             │
│                                │  *-oauth-callback   │             │
│                                │  Edge Function      │             │
│                                └──────────┬──────────┘             │
│                                           │                         │
│           ┌───────────────────────────────┘                         │
│           ▼                                                         │
│  ┌──────────────────┐                                              │
│  │  Callback HTML   │──► postMessage to parent window              │
│  │  (popup closes)  │                                              │
│  └────────┬─────────┘                                              │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐                                              │
│  │  Frontend refetch│──► Shows "Connected" state                   │
│  │  integrations    │                                              │
│  └──────────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Storage

Tokens stored in `team_integrations` table:
- `integration_type`: "meta" or "google_ads"
- `is_connected`: true when authenticated
- `config`: JSONB with tokens, user info, scope

### Security View

The `team_integrations_public` view masks tokens, exposing only:
- `is_connected`
- `config_safe` (email, name, connected_at)

---

## Implementation Order

1. **Create secrets** (META_CLIENT_ID, META_CLIENT_SECRET, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN)
2. **Create edge functions** (meta-oauth-start/callback, google-ads-oauth-start/callback)
3. **Update config.toml** with new function configurations
4. **Create callback HTML pages** (meta-callback.html, google-ads-callback.html)
5. **Create config components** (MetaConfig.tsx, GoogleAdsConfig.tsx)
6. **Create Google Ads logo** asset
7. **Update AppsPortal.tsx** to add both integrations

---

## Usage After Connection

Once connected, these integrations enable:

### Meta
- Automation action: "Meta Conversion" (CAPI events)
- Trigger: "Facebook Lead Form" (lead capture)
- Future: Custom Audiences sync

### Google Ads
- Automation action: "Google Conversion" (offline conversions)
- Trigger: "Google Lead Form" (lead capture)
- Future: Customer Match sync

---

## Summary

| Integration | Edge Functions | Config Component | Callback Page | Logo |
|-------------|----------------|------------------|---------------|------|
| Meta | 2 (start + callback) | MetaConfig.tsx | meta-callback.html | ✓ exists |
| Google Ads | 2 (start + callback) | GoogleAdsConfig.tsx | google-ads-callback.html | Create new |

**Total new files**: 8 (4 edge functions, 2 components, 1 asset, 2 callbacks) + 2 file updates
