
# Swap Hero Panel Layout - Logo & Headline on Top

## Overview

Reorder the hero panel elements so the logo, brand name, and headline appear at the top, with the stats card below.

---

## Summary of Changes

| Area | Change |
|------|--------|
| **Layout Order** | Move logo + headline section above the Card |
| **Card Logo** | Remove the logo/header from inside the Card |
| **Text Opacity** | Restore headline and description to full visibility |
| **Spacing** | Adjust margins for proper spacing between sections |

---

## Visual Layout (Before → After)

```text
BEFORE:                          AFTER:
┌──────────────────┐             ┌──────────────────┐
│  ┌────────────┐  │             │       🔷         │  ← Big logo
│  │ 🔷 Stackit │  │             │     Stackit      │  ← Brand name
│  │   Stats    │  │             │                  │
│  │   Items    │  │             │    Headline      │  ← Full opacity
│  └────────────┘  │             │   Description    │
│                  │             │                  │
│  Headline (40%)  │             │  ┌────────────┐  │
│  Description     │             │  │   Stats    │  │  ← Card (no logo)
└──────────────────┘             │  │   Items    │  │
                                 │  └────────────┘  │
                                 └──────────────────┘
```

---

## Implementation Details

### File: `src/pages/Auth.tsx`

**1. Reorder the flex container children (lines 1110-1179)**

Swap the order so the text section comes first:

```tsx
<div className="relative z-10 flex flex-col items-center">
  {/* Copy - Now at TOP */}
  <div className="text-center max-w-md mb-8">
    <img src={stackitLogo} alt="Stackit" className="w-16 h-16 mx-auto mb-4" />
    <span className="text-white font-bold text-xl tracking-tight mb-6 block">Stackit</span>
    <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
      The Operating System for Scaling Digital Offers.
    </h2>
    <p className="text-slate-400 text-sm drop-shadow-md">
      Build funnels, get leads, book calls, manage deals, and automate follow-ups — all inside Stackit.
    </p>
  </div>
  
  {/* Feature Card - Now BELOW */}
  <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 w-[340px] shadow-2xl">
    <CardContent className="p-6">
      {/* Stats Row - starts directly, no logo header */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        ...
      </div>
      
      {/* Progress Items */}
      <div className="space-y-3">
        ...
      </div>
    </CardContent>
  </Card>
</div>
```

**2. Remove logo header from Card (lines 1114-1120)**

Delete this entire section from inside the Card:
```tsx
// REMOVE:
<div className="flex items-center gap-3 mb-6">
  <img src={stackitLogo} alt="Stackit" className="w-10 h-10" />
  <div>
    <h3 className="font-semibold text-white">Stackit Dashboard</h3>
    <p className="text-xs text-slate-400">Business Operating System</p>
  </div>
</div>
```

**3. Update margins**
- Add `mb-8` to the text section (for spacing between headline and card)
- Remove `mb-8` from the Card (since it's now at the bottom)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Reorder sections, remove card header logo, restore text opacity, adjust margins |
