

# Remove Closed Deals Card & Clean Up Stats Grid

## Overview

Remove the "Closed Deals" gradient card and adjust the layout to show only 2 stat cards (Team Members & Team Assets).

---

## Changes to Make

### File: `src/pages/TeamHubOverview.tsx`

**1. Remove the Closed Deals Card (lines 720-735)**

Delete the entire third gradient card:
```typescript
// REMOVE THIS ENTIRE BLOCK:
{/* Closed Deals - Green/Teal gradient */}
<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white shadow-lg">
  ...
</div>
```

**2. Update Grid Layout (line 685)**

Change from 3 columns to 2 columns:

```typescript
// FROM:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

// TO:
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

## Result

After this change:
- Only 2 gradient stat cards will display: **Team Members** and **Team Assets**
- The grid will be 2 columns on desktop, 1 column on mobile

---

## About the Preset Sections

The preset sections (RESOURCES, OFFER, SCRIPTS & SOPS, etc.) are stored in the database for your team. The **"Clear All"** button in Admin Controls will remove them. Once clicked, they will be permanently cleared and your team can create custom sections from scratch.

