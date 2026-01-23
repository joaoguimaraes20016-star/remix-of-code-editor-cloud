

# Simplify Meta Features: Remove Ads Management

## Summary

Remove the "Ads Management" feature card and keep only:
- **Lead Forms** - Sync Facebook Lead Ads to CRM
- **Ads Reporting** - View campaign performance metrics
- **Conversions API (CAPI)** - Send conversion events for attribution

---

## Changes Required

### 1. Remove Ads Management from FEATURE_SCOPES (Edge Function)

**File:** `supabase/functions/meta-connect-feature/index.ts`

Remove `ads_management` from the feature scopes mapping:

```typescript
const FEATURE_SCOPES: Record<string, string[]> = {
  ads_reporting: ["ads_read"],
  lead_forms: ["leads_retrieval", "pages_read_engagement", "pages_manage_metadata"],
  capi: ["ads_management"],
};
```

### 2. Remove Ads Management from FEATURES Array (Frontend)

**File:** `src/components/MetaConfig.tsx`

Remove the ads_management entry from the FEATURES array. Keep only:

| Feature | Description | Icon |
|---------|-------------|------|
| `lead_forms` | Sync Facebook Lead Ads directly to your CRM | FileText |
| `ads_reporting` | View campaign performance, spend, and ROI metrics | BarChart3 |
| `capi` | Send conversion events for better attribution | Zap |

Also update the `MetaFeature` type:
```typescript
type MetaFeature = "lead_forms" | "ads_reporting" | "capi";
```

And update the `enabled_features` interface:
```typescript
enabled_features?: {
  lead_forms?: boolean;
  ads_reporting?: boolean;
  capi?: boolean;
};
```

---

## Redirect URLs for Meta Configuration

Add these to your **Meta Developers Console** under **Facebook Login → Settings → Valid OAuth Redirect URIs**:

| URL | Purpose |
|-----|---------|
| `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/meta-oauth-callback` | Phase 1 - Basic login |
| `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/meta-feature-callback` | Phase 2 - Feature enablement |

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/meta-connect-feature/index.ts` | Remove `ads_management` from FEATURE_SCOPES |
| `src/components/MetaConfig.tsx` | Remove ads_management from FEATURES array and types |

---

## Result

After these changes, the Meta integration will show 3 feature cards:

1. **Lead Forms** - for syncing Facebook Lead Ads
2. **Ads Reporting** - for viewing campaign metrics (read-only)
3. **Conversions API** - for sending conversion events

No "coming soon" or disabled features cluttering the interface.

