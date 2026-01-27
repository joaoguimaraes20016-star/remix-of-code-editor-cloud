

# Fix: Preview Mode Not Matching Editor Display

## Problem Summary

The preview mode shows a blank/unstyled canvas instead of the content visible in the editor (Hero section with "Welcome to Your Funnel" heading and blue background). The user sees only faint gray text "Start building your funnel by adding blocks" on a white/empty background.

## Root Cause Analysis

The issue is caused by **over-aggressive CSS rules in `runtime.css`** that strip backgrounds and styling when the preview mode class is active:

### The Conflict

1. **In the Editor** (`CanvasRenderer.tsx` lines 5077-5089):
   - The `device-frame` div receives inline background styles via `getPageBackgroundStyles()`
   - This correctly applies the blue gradient/solid background visible in the editor

2. **In Preview Mode** (`runtime.css` lines 372-379):
   ```css
   .builder-v2-canvas--preview .device-frame {
     background: transparent !important;  /* ← Overrides inline styles */
     border-radius: 0 !important;
     box-shadow: none !important;
     border: none !important;
   }
   ```
   - This CSS rule uses `!important` to force transparent backgrounds
   - It overrides the inline background styles from `CanvasRenderer`
   - Result: Blue background disappears, content appears unstyled

3. **Additional Contributing Rules** (`canvas.css` lines 699-704):
   ```css
   .builder-v2-canvas--preview .builder-v2-node {
     background: transparent;
     border-color: transparent;
     box-shadow: none;
   }
   ```
   - This may also strip section/block-level backgrounds

### Documentation Violation

The internal documentation (`mem://style/runtime-css-constraints`) explicitly states:
> "runtime.css is explicitly prohibited from overriding layout, width, or **background styles** (like 'background: transparent !important' on '.device-frame')"

The current CSS directly violates this constraint.

---

## Solution

### Fix 1: Remove Background Override from `runtime.css`

**File**: `src/flow-canvas/components/runtime/runtime.css` (lines 372-379)

**Current**:
```css
/* Device-frame full transparency in runtime/preview - background comes from root only */
.flowcanvas-runtime .device-frame,
.builder-v2-canvas--preview .device-frame {
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
}
```

**Updated**:
```css
/* Device-frame cleanup for runtime/preview - remove editor chrome but preserve inline backgrounds */
.flowcanvas-runtime .device-frame,
.builder-v2-canvas--preview .device-frame {
  /* CRITICAL: Do NOT override background - inline styles from CanvasRenderer must be preserved */
  /* background: transparent !important; ← REMOVED per runtime-css-constraints */
  border-radius: 0 !important;
  box-shadow: none !important;
  border: none !important;
}
```

### Fix 2: Preserve Section/Node Backgrounds in Preview

**File**: `src/builder_v2/canvas/canvas.css` (lines 699-704)

**Current**:
```css
.builder-v2-canvas--preview .builder-v2-node {
  /* Remove all editing affordances in preview */
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
```

**Updated**:
```css
.builder-v2-canvas--preview .builder-v2-node {
  /* Remove editing affordances but preserve visual styling */
  /* background: transparent; ← REMOVED - preserve section backgrounds */
  border-color: transparent;
  box-shadow: none;
  /* Ensure content is interactive in preview */
  pointer-events: auto;
}
```

### Fix 3: Also Check Scroll Container Override

**File**: `src/flow-canvas/components/runtime/runtime.css` (lines 366-370)

Review and potentially keep this rule since it affects the outer scroll container, not the frame itself:
```css
.flowcanvas-runtime .builder-scroll,
.builder-v2-canvas--preview .builder-scroll {
  background: transparent !important;
}
```

This rule is likely intentional (to let the device frame's background show through), so keep it.

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/flow-canvas/components/runtime/runtime.css` | 372-379 | Remove `background: transparent !important` from `.device-frame` rule |
| `src/builder_v2/canvas/canvas.css` | 699-704 | Remove `background: transparent` from `.builder-v2-node` preview rule |

---

## Technical Details

### Why This Happened

The CSS rules were added during "editor chrome cleanup" to ensure preview mode looks like a published funnel. However, the implementation went too far by stripping visual backgrounds rather than just editor UI (selection rings, hover toolbars, etc.).

### Why the Fix is Safe

1. **Inline styles have higher specificity**: Without `!important`, the inline background styles from `getPageBackgroundStyles()` will naturally take precedence
2. **Preserves editor-preview parity**: The same background computation runs in both modes (lines 5083-5088)
3. **Maintains chrome stripping**: Border, shadow, and border-radius resets remain (for frame-less preview appearance)
4. **Aligns with documented constraints**: Follows the `runtime-css-constraints` memory directive

---

## Testing Checklist

After implementation:

- [ ] **Editor → Preview Toggle**: Background visible in both modes
- [ ] **Blue gradient background**: Hero section blue background renders in preview
- [ ] **Text content**: "Welcome to Your Funnel" heading visible with correct styling
- [ ] **Subtitle text**: "Start building your funnel by adding blocks" styled correctly
- [ ] **No editor chrome**: Selection rings, hover toolbars, and action buttons still hidden in preview
- [ ] **Device frame clean**: No visible device frame borders/shadows in preview
- [ ] **Published runtime**: Verify actual published funnel still renders correctly

---

## Related Context

- **Memory**: `mem://style/runtime-css-constraints` - Documents the constraint being violated
- **Memory**: `mem://features/funnel-builder/preview-font-consistency` - Preview mode configuration
- **Previous Work**: The preview mode was recently renamed to "Test Draft" for clarity, but the underlying rendering bug existed prior

