
# Remove Duplicate "Add Content" Button from Canvas

## Summary

The canvas currently shows **two buttons** that both open the same SectionPicker:

| Button | Location | Label |
|--------|----------|-------|
| **"+ Add content"** | Inside each section (at bottom of stack) | "Add content" |
| **Dotted circle "+"** | Below all sections (outside content) | "Add Section" |

Since the SectionPicker now contains everything (basic blocks, interactive blocks, AND sections), having two buttons is confusing and redundant.

---

## Recommendation

**Remove the "Add content" button inside sections**, keep the dotted circle "Add Section" button below.

### Reasoning

| Keep Dotted Circle | Remove "Add content" |
|--------------------|----------------------|
| Clear separation from content | Confusing - suggests adding inside section |
| Positioned at page level | Positioned inside section |
| "Add Section" label matches picker content | "Add content" is misleading |
| Universal pattern for builders | Creates visual clutter inside sections |

---

## File Change

### `src/flow-canvas/builder/components/CanvasRenderer.tsx`

Remove the "Add content" button block (lines 4606-4622):

**Current code to remove:**
```tsx
{/* Add content button - contrast-adaptive */}
{!readOnly && stack.blocks.length > 0 && (
  <div className="mt-3 opacity-60 hover:opacity-100 transition-opacity">
    <button
      onClick={() => onOpenBlockPickerInPanel?.(stack.id)}
      className={cn(
        "flex items-center justify-center gap-1.5 w-full py-2 text-xs transition-colors",
        isParentDark
          ? "text-white/50 hover:text-white/80"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      <Plus size={14} />
      <span>Add content</span>
    </button>
  </div>
)}
```

This leaves the dotted circle button (lines 5449-5488) as the single, clear entry point.

---

## Result

After this change:
- **Single entry point**: Dotted circle "+" button below sections
- **No visual clutter** inside sections
- **Clear mental model**: "To add anything, click the + at the bottom"
- **SectionPicker** contains all options (blocks + sections)
