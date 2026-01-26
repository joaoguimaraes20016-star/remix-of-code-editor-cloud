

# Remove Placeholder Integrations (HubSpot & GoHighLevel)

## Overview
Remove HubSpot and GoHighLevel from the Apps Portal since they are placeholder entries with no actual integration logic. All other integrations are properly implemented with standardized OAuth flows.

---

## Current State

| Integration | Status | Has Config Component | Has OAuth Flow | Action |
|-------------|--------|---------------------|----------------|--------|
| HubSpot | `coming_soon` | No | No | **Remove** |
| GoHighLevel | `available` | No | No | **Remove** |
| Calendly | Connected | Yes | Yes | Keep |
| Slack | Connected | Yes | Yes | Keep |
| Zoom | Connected | Yes | Yes | Keep |
| Typeform | Connected | Yes | Yes | Keep |
| Discord | Connected | Yes | Yes | Keep |
| Fathom | Connected | Yes | Yes | Keep |
| Meta | Connected | Yes | Yes | Keep |
| Google Ads | Connected | Yes | Yes | Keep |
| TikTok | Connected | Yes | Yes | Keep |
| Zapier | Connected | Yes | Yes (OAuth v2) | Keep |
| Google Workspace | Connected | Yes | Yes | Keep |

---

## Changes Required

### 1. Update AppsPortal.tsx

**Remove from imports:**
```typescript
// Remove these lines
import ghlLogo from "@/assets/integrations/ghl.svg";
import hubspotLogo from "@/assets/integrations/hubspot.svg";
```

**Remove from apps array:**
```typescript
// Remove GoHighLevel entry (lines 112-118)
{
  id: "ghl",
  name: "GoHighLevel",
  description: "CRM and marketing automation",
  logo: ghlLogo,
  category: "crm",
  status: "available",
},

// Remove HubSpot entry (lines 146-152)
{
  id: "hubspot",
  name: "HubSpot",
  description: "CRM and sales automation",
  logo: hubspotLogo,
  category: "crm",
  status: "coming_soon",
},
```

### 2. Delete Unused Logo Assets (Optional Cleanup)

| File | Action |
|------|--------|
| `src/assets/integrations/ghl.svg` | Delete |
| `src/assets/integrations/hubspot.svg` | Delete |

---

## Result

After this change, the Apps Portal will only show integrations that are fully functional:

**Scheduling:** Calendly, Zoom, Fathom
**Communication:** Slack, Discord, Zapier
**Analytics:** Typeform
**Ads & Marketing:** Meta, Google Ads, TikTok
**Google Workspace:** Sheets, Calendar, Drive, Forms

---

## Technical Notes

- No database changes required
- No Edge Function changes required
- This is purely a UI cleanup
- The `crm` category will become empty (can be removed from `categoryLabels` if desired)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AppsPortal.tsx` | Remove 2 imports, remove 2 app entries |
| `src/assets/integrations/ghl.svg` | Delete (optional) |
| `src/assets/integrations/hubspot.svg` | Delete (optional) |

