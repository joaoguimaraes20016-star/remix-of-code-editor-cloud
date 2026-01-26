
# Update Label Text: Earnings → Revenue

## Overview
Simple terminology change in the DashboardHero component to use "Revenue" instead of "Earnings".

---

## Change Required

**File**: `src/components/dashboard/DashboardHero.tsx`

Update the `periodLabels` object (around line 75):

```typescript
// Before
const periodLabels: Record<Period, string> = {
  today: "Total Earnings Today",
  week: "Total Earnings This Week",
  month: "Total Earnings This Month",
};

// After
const periodLabels: Record<Period, string> = {
  today: "Total Revenue Today",
  week: "Total Revenue This Week",
  month: "Total Revenue This Month",
};
```

---

## Visual Result

The label below the large dollar amount will now display:
- **Daily**: "Total Revenue Today"
- **Weekly**: "Total Revenue This Week"  
- **Monthly**: "Total Revenue This Month"
