
# Add Fathom to Apps Portal

## Problem
The Fathom integration was added to the wrong component (`IntegrationsPortal.tsx`) instead of the actual Apps page component (`AppsPortal.tsx`). That's why you don't see it on the Apps page.

## Solution
Add Fathom to `AppsPortal.tsx` following the same pattern as the other integrations (Zoom, Slack, Discord, etc.).

## Changes Required

### 1. Add Fathom Logo
Create a Fathom logo SVG file at `src/assets/integrations/fathom.svg` (Fathom's brand color is purple `#5636D3`)

### 2. Update AppsPortal.tsx

| Change | Location |
|--------|----------|
| Import FathomConfig component | Line 13 |
| Import Fathom logo | Line 27 |
| Add Fathom to apps array | After line 162 |
| Add fathomDialogOpen state | Line 179 |
| Add fathom_connected to query | Lines 204-225 |
| Add Fathom status check | Lines 243-245 |
| Add Fathom click handler | Lines 262-264 |
| Add Fathom Dialog | After line 460 |

### 3. Apps Array Entry
```typescript
{
  id: "fathom",
  name: "Fathom",
  description: "Meeting recordings and transcriptions",
  logo: fathomLogo,
  category: "scheduling", // Same category as Zoom
  status: "available",
  configurable: true,
}
```

### 4. Query Updates
- Find fathom integration: `integrations.find(i => i.integration_type === "fathom")`
- Return `fathom_connected` boolean in query result

### 5. Status Check
```typescript
if (app.id === "fathom" && teamData?.fathom_connected) {
  return "connected";
}
```

### 6. Click Handler
```typescript
if (app.id === "fathom" && app.configurable) {
  setFathomDialogOpen(true);
}
```

### 7. Dialog Component
Add the Fathom configuration dialog using the same pattern as Zoom/Discord dialogs.

## Files to Modify
- `src/assets/integrations/fathom.svg` (create)
- `src/pages/AppsPortal.tsx` (update)

## Files Already Created (No Changes Needed)
- `src/components/FathomConfig.tsx` - Already exists and working
- `supabase/functions/fathom-oauth-start/index.ts` - Already deployed
- `supabase/functions/fathom-oauth-callback/index.ts` - Already deployed
- `public/fathom-callback.html` - Already exists

## Result
After this fix, Fathom will appear in the "Scheduling" category on the Apps page alongside Calendly and Zoom.
