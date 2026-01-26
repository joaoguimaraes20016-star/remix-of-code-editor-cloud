
# Update Dashboard Welcome Message

## Overview
Update the welcome greeting and subtitle text in the DashboardHero component to be more casual and motivational.

---

## Changes Required

**File**: `src/components/dashboard/DashboardHero.tsx`

### 1. Update Welcome Message (line 95)

```typescript
// Before
Welcome Back, {firstName}! 👋

// After
Glad you're back, {firstName} 👋
```

### 2. Update Subtitle Text (line 98)

```typescript
// Before
Here's your revenue performance overview

// After
Keep stacking.
```

---

## Visual Result

The dashboard header will now display:
- **Main greeting**: "Glad you're back, John 👋" (using the user's first name)
- **Subtitle**: "Keep stacking."

This gives the dashboard a more motivational, casual tone that feels personal and encouraging.
