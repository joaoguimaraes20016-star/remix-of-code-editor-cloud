

# Perspective-Style Typography & Font Consistency

## Overview
This plan addresses typography inconsistencies in the funnel builder to match Perspective's clean, professional aesthetic. The current builder shows "weird fonts" on hover states and when rendering unknown element types.

## Problems Identified
1. **Unknown element types display raw type names** - Elements like `multiple-choice` and `single-choice` fall through to the default case and display the element type as plain unstyled text
2. **Inconsistent font inheritance** - Some UI components don't properly inherit the font family, causing visual inconsistency
3. **Block picker hover states** - Typography in popovers and pickers doesn't feel polished

## Implementation Plan

### Phase 1: Update Font Stack (Priority: High)
**File: `src/flow-canvas/index.css`**

- Update the Google Fonts import to use **Inter** as primary (Perspective's choice), with system fonts as fallback
- Change font import order to prioritize Inter over DM Sans
- Apply `-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility` globally for crisp text

### Phase 2: Fix Default Element Renderer (Priority: High)
**File: `src/flow-canvas/builder/components/CanvasRenderer.tsx`**

In the `default` case (around line 3646-3675):
- Add proper styling classes instead of showing raw `element.type`
- Use a formatted label (e.g., "Multiple Choice" instead of "multiple-choice")
- Apply consistent padding, background, and typography
- Add a subtle icon indicator for unrecognized element types

### Phase 3: Block Adder Typography (Priority: Medium)
**File: `src/flow-canvas/builder/components/BlockAdder.tsx`**

- Apply consistent `font-family: inherit` to all text elements
- Ensure the "Add content" button text uses the correct font weight
- Style the popover content with proper typography tokens

### Phase 4: Block Picker Cards (Priority: Medium)
**Files:**
- `src/flow-canvas/builder/components/SectionPicker/BlockTileCard.tsx`
- `src/flow-canvas/builder/components/SectionPicker/InteractiveBlockCard.tsx`
- `src/flow-canvas/builder/components/SectionPicker/BasicBlockGrid.tsx`

- Update font classes to use `font-medium` for card labels
- Apply `text-gray-800` instead of `text-gray-700` for better contrast
- Ensure hover states maintain font consistency

### Phase 5: Canvas Content Typography (Priority: Medium)
**File: `src/flow-canvas/index.css`**

Add dedicated typography rules for canvas content:
```css
.device-frame,
.device-frame * {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Phase 6: Choice/Quiz Block Rendering (Priority: Medium)
**File: `src/flow-canvas/builder/components/CanvasRenderer.tsx`**

Add explicit `case` handlers for:
- `single-choice`
- `multiple-choice`
- `quiz`

These should render proper UI rather than falling through to the default case with raw type names.

---

## Technical Details

### Font Stack Change
```css
/* Before */
font-family: 'DM Sans', 'Inter', system-ui, sans-serif;

/* After (Perspective-style) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

### Typography Token Additions
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Element Type Label Formatting
```typescript
// Helper function to format element types for display
function formatElementType(type: string): string {
  return type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
// "multiple-choice" → "Multiple Choice"
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/index.css` | Font stack update, typography tokens, canvas content rules |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Default case styling, add choice element handlers |
| `src/flow-canvas/builder/components/BlockAdder.tsx` | Font inheritance fixes |
| `src/flow-canvas/builder/components/SectionPicker/BlockTileCard.tsx` | Typography consistency |
| `src/flow-canvas/builder/components/SectionPicker/InteractiveBlockCard.tsx` | Typography consistency |

---

## Expected Outcome

After implementation:
- All text in the builder will use Inter font consistently
- Unknown element types will display with formatted labels and proper styling
- Block pickers and hovers will feel polished and match Perspective's aesthetic
- Canvas content typography will be crisp and professional
- No more "weird fonts" on any UI elements

