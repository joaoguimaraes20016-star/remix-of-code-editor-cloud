

# Refactor Meta Integration: 2-Phase OAuth + Asset Selection + Webhooks

## Summary

ChatGPT's analysis is correct. The current Meta implementation requests all business scopes (`ads_management`, `leads_retrieval`, etc.) in a single OAuth flow, which:
- Triggers Meta's stricter App Review requirements
- Doesn't match how GoHighLevel and enterprise tools handle it
- Reduces conversion (users see scary permissions upfront)

The proper architecture uses a **2-phase OAuth strategy** with **modular feature enablement** and **webhook-based lead sync**.

---

## Current vs. Proposed Architecture

| Aspect | Current | Proposed |
|--------|---------|----------|
| OAuth Scopes | All at once (8 permissions) | Phase 1: `public_profile, email` only |
| Business Permissions | Requested on first connect | Phase 2: Requested when user enables feature |
| Asset Selection | None | User selects Business → Ad Account → Page → Lead Form |
| Lead Sync | Not implemented | Meta webhooks → Edge Function → CRM |
| Reporting | Not implemented | Campaign insights via Marketing API |

---

## Implementation Phases

### Phase 1: Basic Meta Login (Low-Risk OAuth)

Update the OAuth start function to request **only identity scopes**:

```text
Scopes: public_profile, email
```

This identifies the user without triggering business permission requirements.

**Files to modify:**
- `supabase/functions/meta-oauth-start/index.ts` - Change scopes to identity only
- `supabase/functions/meta-oauth-callback/index.ts` - Store basic user token

---

### Phase 2: Modular Feature OAuth (GHL-Style)

Create a new edge function for requesting business permissions incrementally:

```text
supabase/functions/meta-connect-feature/index.ts
```

**Features and their scopes:**

| Feature | Scopes Required |
|---------|-----------------|
| `ads_reporting` | `ads_read` |
| `ads_management` | `ads_management, ads_read` |
| `lead_forms` | `leads_retrieval, pages_read_engagement` |
| `capi` | `ads_management` (for Conversions API) |

When user clicks "Enable Lead Forms", the system:
1. Checks if Meta is connected (Phase 1 complete)
2. Requests only the `leads_retrieval` + `pages_read_engagement` scopes
3. Uses `auth_type=rerequest` for incremental authorization
4. Merges new scopes with existing token

---

### Phase 3: Asset Selection UI

After business permissions are granted, show asset selection UI:

**New components:**

```text
src/components/meta/MetaAssetSelector.tsx
  ├── MetaBusinessPicker    (Select business)
  ├── MetaAdAccountPicker   (Select ad account)
  ├── MetaPagePicker        (Select pages)
  └── MetaLeadFormPicker    (Select lead forms per page)
```

**New edge functions for fetching assets:**

```text
supabase/functions/meta-fetch-assets/index.ts
  - GET /me/businesses
  - GET /{business_id}/owned_ad_accounts
  - GET /me/accounts (pages)
  - GET /{page_id}/leadgen_forms
```

**Storage:** Selected assets stored in `team_integrations.config`:

```json
{
  "selected_business_id": "...",
  "selected_ad_account_id": "...",
  "selected_pages": [
    { "id": "...", "name": "...", "access_token": "..." }
  ],
  "selected_lead_forms": [
    { "id": "...", "page_id": "...", "name": "..." }
  ]
}
```

---

### Phase 4: Lead Sync via Webhooks

Create a dedicated webhook receiver for Meta leadgen events:

**New edge function:**

```text
supabase/functions/meta-leadgen-webhook/index.ts
```

**Webhook flow:**

```text
┌────────────────────────────────────────────────────────────────────┐
│                    Meta Lead Sync Flow                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  User submits Facebook Lead Form                                   │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Meta sends webhook to:                                   │     │
│  │  https://[supabase]/functions/v1/meta-leadgen-webhook    │     │
│  │                                                           │     │
│  │  Payload: { leadgen_id, page_id, form_id, ... }          │     │
│  └───────────────────────┬──────────────────────────────────┘     │
│                          │                                         │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Edge function:                                           │     │
│  │  1. Verify webhook signature (X-Hub-Signature-256)       │     │
│  │  2. Look up page → team mapping                          │     │
│  │  3. Fetch full lead data via Graph API                   │     │
│  │  4. Normalize to CRM format                              │     │
│  │  5. Insert into funnel_leads / contacts                  │     │
│  │  6. Trigger facebook_lead_form automation                │     │
│  └───────────────────────┬──────────────────────────────────┘     │
│                          │                                         │
│                          ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Automation engine fires:                                 │     │
│  │  - Add to pipeline                                        │     │
│  │  - Send notification                                      │     │
│  │  - Create task                                            │     │
│  │  - Send email/SMS                                         │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Webhook subscription:** When user selects a page for lead sync, we call:

```
POST /{page_id}/subscribed_apps
?subscribed_fields=leadgen
&access_token={page_access_token}
```

---

### Phase 5: Ads Reporting (Read-Only)

**New edge function:**

```text
supabase/functions/meta-ads-insights/index.ts
```

Fetches campaign-level metrics:
- Spend
- Impressions
- Clicks
- Cost per lead
- Conversions

**New UI component:**

```text
src/components/meta/MetaAdsReportingCard.tsx
```

---

## Files to Create/Modify

### New Files (10)

| File | Purpose |
|------|---------|
| `supabase/functions/meta-connect-feature/index.ts` | Incremental OAuth for business features |
| `supabase/functions/meta-fetch-assets/index.ts` | Fetch businesses, ad accounts, pages, forms |
| `supabase/functions/meta-leadgen-webhook/index.ts` | Receive and process lead form submissions |
| `supabase/functions/meta-subscribe-page/index.ts` | Subscribe page to leadgen webhooks |
| `supabase/functions/meta-ads-insights/index.ts` | Fetch ad campaign reporting data |
| `src/components/meta/MetaAssetSelector.tsx` | Asset selection UI (business, accounts, pages, forms) |
| `src/components/meta/MetaPagePicker.tsx` | Page selection component |
| `src/components/meta/MetaLeadFormPicker.tsx` | Lead form selection per page |
| `src/components/meta/MetaAdsReportingCard.tsx` | Ads insights display |
| `public/meta-business-callback.html` | Callback for business OAuth phase |

### Modified Files (4)

| File | Changes |
|------|---------|
| `supabase/functions/meta-oauth-start/index.ts` | Change to identity-only scopes |
| `supabase/functions/meta-oauth-callback/index.ts` | Store basic token, mark Phase 1 complete |
| `src/components/MetaConfig.tsx` | Add feature cards and asset selection UI |
| `supabase/config.toml` | Register new edge functions |

---

## Database Changes

Store Meta assets in `team_integrations.config`:

```json
{
  "phase": "business_connected",
  "user_id": "...",
  "email": "...",
  "name": "...",
  "access_token": "...",
  "token_expires_at": "...",
  "enabled_features": {
    "lead_forms": true,
    "ads_reporting": false,
    "capi": false
  },
  "selected_business": { "id": "...", "name": "..." },
  "selected_ad_account": { "id": "...", "name": "..." },
  "selected_pages": [
    { "id": "...", "name": "...", "access_token": "..." }
  ],
  "subscribed_forms": [
    { "form_id": "...", "page_id": "...", "name": "..." }
  ]
}
```

---

## Meta App Configuration Requirements

1. **App Type:** Business
2. **Products to Add:**
   - Facebook Login for Business
   - Marketing API
   - Webhooks
3. **Webhook Configuration:**
   - Object: `page`
   - Fields: `leadgen`
   - Callback URL: `https://[supabase]/functions/v1/meta-leadgen-webhook`
   - Verify Token: Store as `META_WEBHOOK_VERIFY_TOKEN` secret
4. **App Review:** Required for production access to:
   - `leads_retrieval`
   - `ads_management`
   - `pages_read_engagement`

---

## Implementation Order

1. **Refactor OAuth to 2-phase** (identity first, business later)
2. **Create meta-connect-feature** for incremental scope requests
3. **Create meta-fetch-assets** to list businesses, accounts, pages, forms
4. **Build MetaAssetSelector UI** for visual asset selection
5. **Create meta-leadgen-webhook** to receive lead submissions
6. **Create meta-subscribe-page** to enable webhook subscriptions
7. **Update MetaConfig** to show modular feature cards
8. **Create meta-ads-insights** for reporting (Phase 2 launch)

---

## Summary

This refactor transforms Meta from a single OAuth flow into a modular, GHL-style integration:

| Component | Before | After |
|-----------|--------|-------|
| Initial OAuth | 8 scary permissions | 2 basic permissions |
| Business Access | All or nothing | Modular feature unlock |
| Asset Selection | None | Full picker UI |
| Lead Sync | Not implemented | Real-time webhooks |
| Reporting | Not implemented | Campaign insights |
| App Review Risk | High | Lower (modular approach) |

