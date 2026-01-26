
# Update Total MRR Gradient to Purple

## Overview
Change the gradient for the Total MRR card from pink to a purple/violet gradient to better match the desired visual style.

---

## Change Required

**File**: `src/components/dashboard/DashboardMetricCard.tsx`

Update the `pink` gradient preset to use purple tones instead:

```typescript
// Before (line 20)
pink: "from-pink-500 via-rose-500 to-orange-500",

// After - change to purple/violet gradient
pink: "from-violet-500 via-purple-500 to-fuchsia-600",
```

Alternatively, we could rename it to `purple` to be more accurate, but since the SalesDashboard is currently using the `blue` gradient for Total MRR, I need to check the actual usage.

---

## Verification

Looking at the current implementation:
- CC Revenue uses `green` gradient
- Total MRR uses `blue` gradient  
- Close Rate uses `red` gradient

Since Total MRR is using `blue`, we need to update the `blue` gradient definition to be more purple:

```typescript
// Before (line 22)
blue: "from-blue-500 via-blue-600 to-indigo-600",

// After - change to purple/violet gradient
blue: "from-violet-500 via-purple-500 to-indigo-600",
```

---

## Visual Result

The Total MRR card will display a purple-to-violet gradient instead of the current blue gradient, giving it a more vibrant purple appearance like the reference image.
