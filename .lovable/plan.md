
# Update Dashboard Gradient Colors

## Overview
Change the gradient colors for the three main metric cards to match the user's preferences:

| Card | Current | New |
|------|---------|-----|
| CC Revenue | Purple (`from-violet-600 via-purple-600 to-indigo-700`) | Green/Cyan (`from-emerald-500 via-teal-500 to-cyan-600`) |
| Total MRR | Pink (`from-pink-500 via-rose-500 to-orange-500`) | Blue (`from-blue-500 via-blue-600 to-indigo-600`) |
| Close Rate | Teal (`from-emerald-600 via-teal-600 to-cyan-700`) | Red (`from-red-500 via-rose-500 to-pink-600`) |

---

## Changes Required

### 1. Update DashboardMetricCard.tsx

Add a `green` and `red` gradient option to the gradients object:

```typescript
const gradients = {
  purple: "from-violet-600 via-purple-600 to-indigo-700",
  pink: "from-pink-500 via-rose-500 to-orange-500",
  teal: "from-emerald-600 via-teal-600 to-cyan-700",
  blue: "from-blue-500 via-blue-600 to-indigo-600",
  orange: "from-orange-500 via-amber-500 to-yellow-500",
  green: "from-emerald-500 via-teal-500 to-cyan-600",  // NEW
  red: "from-red-500 via-rose-500 to-pink-600",        // NEW
};
```

Update the TypeScript type to include the new gradient options:
```typescript
gradient: "purple" | "pink" | "teal" | "blue" | "orange" | "green" | "red";
```

### 2. Update SalesDashboard.tsx

Change the gradient prop values for each card:

```text
Before (lines 850-870):
CC Revenue     → gradient="purple"
Total MRR      → gradient="pink"
Close Rate     → gradient="teal"

After:
CC Revenue     → gradient="green"
Total MRR      → gradient="blue"
Close Rate     → gradient="red"
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardMetricCard.tsx` | Add `green` and `red` gradient presets, update type definition |
| `src/pages/SalesDashboard.tsx` | Update gradient props: CC Revenue → green, Total MRR → blue, Close Rate → red |

---

## Visual Result

The three metric cards will now display:
- **CC Revenue**: Green-to-Cyan gradient (matching money/success theme)
- **Total MRR**: Blue gradient (professional, corporate feel)
- **Close Rate**: Red-to-Pink gradient (attention-grabbing for conversion metrics)

This aligns with common dashboard color conventions where:
- Green = Money/Revenue
- Blue = Recurring/Stable metrics
- Red = Critical performance indicators
