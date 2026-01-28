

# Fix Builder UI Fonts Inheriting User Content Fonts

## Problem

Builder UI elements (like the "Add Section" button, labels, hints) inside the canvas are incorrectly inheriting user content fonts. When a user's funnel uses display fonts like "Oswald" or "Bebas Neue", the builder chrome also picks up these fonts instead of staying with the standard system font (Inter/DM Sans).

### Root Cause

1. **CSS rule at line 464-470 in `src/flow-canvas/index.css`**:
   ```css
   .device-frame *,
   .device-frame button {
     font-family: inherit;
   }
   ```
   This forces ALL elements inside the device frame to inherit font-family - including builder UI.

2. **Inline style on the Add Section button** at line 5461 in `CanvasRenderer.tsx`:
   ```tsx
   style={{ fontFamily: 'inherit' }}
   ```
   This explicitly tells the button to inherit whatever font is cascading down.

---

## Solution

### Strategy
Create a clear separation between **user content** (which uses custom fonts) and **builder UI** (which always uses system fonts).

### Changes

#### 1. Update CSS - Scope Font Inheritance to User Content Only

**File:** `src/flow-canvas/index.css`

Replace the overly broad inheritance rule with scoped rules:

```css
/* Before (broken) */
.device-frame *,
.device-frame button,
.device-frame input,
.device-frame textarea,
.device-frame select {
  font-family: inherit;
}

/* After (fixed) */
/* User content inherits custom fonts */
.device-frame .user-content,
.device-frame .user-content * {
  font-family: inherit;
}

/* Builder UI always uses system font */
.device-frame .builder-chrome,
.device-frame .builder-chrome * {
  font-family: 'Inter', 'DM Sans', system-ui, -apple-system, sans-serif !important;
}
```

#### 2. Add builder-chrome class to UI elements in CanvasRenderer.tsx

**File:** `src/flow-canvas/builder/components/CanvasRenderer.tsx`

**Empty state (lines 5423-5467):**
- Add `builder-chrome` class to the container
- Remove the inline `fontFamily: 'inherit'` style

```tsx
// Before
<div className="flex items-center justify-center min-h-[500px] px-4">

// After  
<div className="flex items-center justify-center min-h-[500px] px-4 builder-chrome">
```

**Bottom Add Section button (lines 5489-5509):**
- Add `builder-chrome` class to the container

```tsx
// Before
<div className="flex flex-col items-center py-8 group">

// After
<div className="flex flex-col items-center py-8 group builder-chrome">
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/flow-canvas/index.css` | Replace broad `font-family: inherit` rule with scoped rules for user-content vs builder-chrome |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Add `builder-chrome` class to empty state and bottom Add Section button containers, remove inline font style |

---

## Result

After this fix:
- User content (headings, text, buttons the user creates) uses whatever font they select
- Builder UI (Add Section, labels, hints, tooltips inside the canvas) always uses Inter/DM Sans
- Clean visual separation between editable content and builder chrome
- No more display fonts bleeding into system UI

