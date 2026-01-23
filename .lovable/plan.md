
# Fix Meta Integration: Remove OAuth Scope Abuse

## Problem

The current `meta-connect-feature` edge function builds an OAuth URL with business scopes (`ads_read`, `leads_retrieval`, `pages_read_engagement`, etc.) at line 153. This causes **"Invalid Scopes"** errors because:

1. Meta does **NOT** allow business/marketing scopes in OAuth popups for apps that haven't passed App Review
2. Unlike Google, Meta does not support `include_granted_scopes=true` for incremental permissions
3. Only `public_profile` and `email` are valid for unapproved apps

## Solution Architecture

Replace OAuth-based feature enablement with a **server-side permission check** flow:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Current (Broken) vs. Fixed Flow                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CURRENT (Broken):                                                      │
│  User clicks "Enable Lead Forms"                                        │
│       │                                                                 │
│       ▼                                                                 │
│  Opens OAuth popup with scope=leads_retrieval,pages_read_engagement     │
│       │                                                                 │
│       ▼                                                                 │
│  ❌ Meta returns "Invalid Scopes" error                                 │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FIXED (No OAuth popup for features):                                   │
│  User clicks "Enable Lead Forms"                                        │
│       │                                                                 │
│       ▼                                                                 │
│  Frontend calls meta-enable-feature edge function                       │
│       │                                                                 │
│       ▼                                                                 │
│  Edge function checks GET /me/permissions                               │
│       │                                                                 │
│       ├─── Has required scopes ──► Enable feature, return success       │
│       │                                                                 │
│       └─── Missing scopes ──► Return { needsAppReview: true }           │
│                │                                                        │
│                ▼                                                        │
│  Frontend shows "Requires Meta App Review" message                      │
│  (Works for admins/testers in Dev Mode)                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

### 1. `supabase/functions/meta-enable-feature/index.ts`

New edge function that enables features WITHOUT OAuth:

**Logic:**
1. Authenticate user, verify team membership
2. Get stored Meta access token from `team_integrations`
3. Call `GET /me/permissions` to get granted scopes
4. Check if feature's required scopes are all present:
   - `lead_forms`: `pages_show_list`, `pages_read_engagement`, `leads_retrieval`
   - `ads_reporting`: `ads_read`
   - `capi`: `ads_management`
5. If all present → Update `config.enabled_features[feature] = true` → Return success
6. If missing → Return `{ success: false, reason: "app_review_required", missingScopes: [...] }`

---

## Files to Modify

### 2. `src/components/MetaConfig.tsx`

**Changes:**
- Remove popup logic from `handleEnableFeature()`
- Create new function `enableFeatureDirectly()` that:
  - Calls `meta-enable-feature` (no popup)
  - If success: toast + refetch
  - If `needsAppReview`: show warning UI
- Add state for tracking App Review requirements per feature
- Update feature card rendering to show "Requires App Review" badge when appropriate

**New UI States:**

| State | Display |
|-------|---------|
| Feature enabled | ✓ Enabled (green) |
| Permissions available | [Enable] button |
| Missing permissions | ⚠️ Requires App Review badge with info |

---

## Files to Delete

### 3. `supabase/functions/meta-connect-feature/index.ts`

This function tries to add invalid scopes to OAuth. Delete entirely.

### 4. `supabase/functions/meta-feature-callback/index.ts`

Not needed since we're not using OAuth for features. Delete.

### 5. `public/meta-feature-callback.html`

Callback page no longer needed. Delete.

---

## Config Updates

### 6. `supabase/config.toml`

- Remove `meta-connect-feature` entry
- Remove `meta-feature-callback` entry  
- Add `meta-enable-feature` entry

---

## Implementation Details

### meta-enable-feature Edge Function

```text
Endpoint: POST /functions/v1/meta-enable-feature
Body: { teamId, feature }

Response (success):
{
  "success": true,
  "feature": "lead_forms"
}

Response (missing permissions):
{
  "success": false,
  "reason": "app_review_required",
  "missingScopes": ["leads_retrieval", "pages_read_engagement"],
  "message": "This feature requires Meta App Review approval. Available for app admins/testers in Dev Mode."
}

Response (already enabled):
{
  "success": true,
  "alreadyEnabled": true
}
```

### Frontend App Review UI

When a feature requires App Review, display inline message:

```text
┌─────────────────────────────────────────────────────────────┐
│ Lead Forms                                                  │
│ Sync Facebook Lead Ads directly to your CRM                 │
│                                                             │
│ ⚠️ Requires Meta App Review                                 │
│                                                             │
│ Until approved, this feature is only available for:         │
│ • App administrators                                        │
│ • App developers                                            │
│ • Test users added in Meta Developer Console                │
│                                                             │
│ Missing: leads_retrieval, pages_read_engagement             │
│                                                             │
│ [Try Enabling (Dev Mode)]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Permission Check Logic

The `/me/permissions` endpoint returns what scopes the user has granted:

```json
{
  "data": [
    { "permission": "email", "status": "granted" },
    { "permission": "public_profile", "status": "granted" },
    { "permission": "leads_retrieval", "status": "granted" }
  ]
}
```

For app admins/testers in Dev Mode, Meta grants the permissions even without App Review approval. For regular users, these scopes won't be present until the app passes App Review.

---

## Summary of Changes

| Action | File |
|--------|------|
| CREATE | `supabase/functions/meta-enable-feature/index.ts` |
| MODIFY | `src/components/MetaConfig.tsx` |
| MODIFY | `supabase/config.toml` |
| DELETE | `supabase/functions/meta-connect-feature/index.ts` |
| DELETE | `supabase/functions/meta-feature-callback/index.ts` |
| DELETE | `public/meta-feature-callback.html` |

---

## Acceptance Criteria

1. ✅ "Connect with Meta" opens OAuth with ONLY `public_profile,email` (already working)
2. ✅ Clicking "Enable" on any feature does NOT open a popup
3. ✅ If user is app admin/tester with permissions → feature enables successfully
4. ✅ If user lacks permissions → clear "Requires App Review" message appears
5. ✅ No "Invalid Scopes" errors anywhere in the flow
6. ✅ GHL-style asset selection (pages/forms) continues to work after lead_forms enabled

---

## Technical Notes

### Why this approach works:

1. **Basic OAuth** (`public_profile`, `email`) always succeeds - no App Review needed
2. **Admins/testers** in Dev Mode already have business permissions granted by Meta
3. **Permission check** via `/me/permissions` reveals what's actually available
4. **No scope abuse** - we never ask for scopes we can't get
5. **Clear user communication** - users know exactly what's blocked and why

### Meta Dev Mode behavior:

- App admins can use all requested scopes
- App developers can use all requested scopes
- Test users (added in Meta console) can use all requested scopes
- Regular users get "Invalid Scopes" until App Review approved

This architecture lets you build and test the full integration in Dev Mode, then seamlessly scale to production users after App Review.
