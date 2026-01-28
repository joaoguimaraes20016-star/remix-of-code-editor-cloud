

# Remove Duplicate "Add Section" Button from Toolbar

## Summary

Since the SectionPicker now contains both sections AND blocks (basic + interactive), having two separate "Add" buttons is redundant. The toolbar "+" button and the canvas dotted-circle button both open the exact same SectionPicker modal.

We'll remove the toolbar "+" button while keeping the canvas-level add buttons (empty state CTA + bottom dotted circle), which are more contextual and intuitive.

---

## Current State

Two "Add Section" entry points:

| Location | Element | Action |
|----------|---------|--------|
| **TopToolbar** | Plus icon button with tooltip "Add Section (F)" | Opens SectionPicker |
| **Canvas** | Dotted circle at bottom (or full empty state when no frames) | Opens SectionPicker |

Both open the same modal that contains:
- Basic blocks
- Interactive blocks  
- All section categories (Hero, Features, CTA, etc.)

---

## Proposed Change

Remove the "+" button from `TopToolbar.tsx` since the canvas already provides a clear, contextual way to add content.

---

## File Changes

### `src/flow-canvas/builder/components/TopToolbar.tsx`

Remove the "Add Section" toolbar button (lines 313-321):

```tsx
// REMOVE THIS BLOCK:
{/* Single "Add Section" button - opens section picker */}
<ToolbarButton
  onClick={onAddFrame}
  disabled={isAddFrameDisabled}
  disabledReason={addFrameDisabledReason}
  tooltip="Add Section (F)"
>
  <Plus className="w-4 h-4" />
</ToolbarButton>
```

Also remove the related disabled state variables that are no longer needed (lines 247-250):

```tsx
// REMOVE:
const isAddFrameDisabled = previewMode;
const addFrameDisabledReason = previewMode 
  ? "Exit preview mode to add sections" 
  : undefined;
```

Optionally, the `onAddFrame` prop can remain in the interface for flexibility, but it won't be used in the toolbar UI.

---

## Cleanup

### Unused Component

The `AddSectionButton.tsx` component exists but is not imported or used anywhere. Consider deleting it as part of cleanup:

- `src/flow-canvas/builder/components/AddSectionButton.tsx`

---

## Result

After this change:
- Single, clear entry point for adding content: the canvas itself
- Cleaner toolbar with fewer buttons
- No confusion about "which add button to use"
- SectionPicker (with all sections + blocks) accessible directly from the canvas

