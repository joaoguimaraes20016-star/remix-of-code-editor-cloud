
# Fix Contrast-Adaptive "Add Section" and "Add Content" Buttons

## Problem Statement

The screenshot clearly shows the issue: on a blue background (#3B82F6), the "+ Add content" button and the dotted-circle empty state are barely visible because they use hardcoded gray/white colors.

### Current Hardcoded Styling (Not Adaptive)

**Empty State Card** (`CanvasRenderer.tsx:4388-4421`):
```tsx
// Uses hardcoded colors - fails on blue/dark backgrounds
className="border-2 border-dashed border-purple-300/50 rounded-2xl bg-white"
// ...
<span className="text-lg font-semibold text-gray-800 mb-1">
<span className="text-sm text-gray-400 mb-6">
```

**"+ Add content" Button** (`CanvasRenderer.tsx:4486-4492`):
```tsx
className="text-xs text-gray-500 hover:text-gray-700"
```

### Why It Fails

On a blue background (#3B82F6):
- `text-gray-500` (#6b7280) has only ~2.1:1 contrast ratio (needs 4.5:1 for AA)
- `border-purple-300/50` is nearly invisible
- White card with bg-white creates jarring visual contrast

---

## Solution Overview

Use the existing `ContrastEngine` from `src/builder/utils/ContrastEngine.ts` to compute adaptive colors based on the parent frame's background. The key functions we already have:

```typescript
isLightColor(color: string): boolean
getContrastTextColor(backgroundColor: string): string
getThemeAwareColors(backgroundColor: string): ThemeAwareColors
```

---

## Implementation Details

### Change 1: Pass Background Context to StackRenderer

The `StackRenderer` needs to know the parent frame's background color. Add a new prop:

```typescript
interface StackRendererProps {
  // ... existing props
  parentBackgroundColor?: string;  // NEW: Pass from FrameRenderer
}
```

### Change 2: Update FrameRenderer to Pass Background

In `FrameRenderer`, compute the effective background color and pass it to `StackRenderer`:

```typescript
// Compute effective background color for the frame
const effectiveBackgroundColor = (() => {
  const bg = frame.background || 'transparent';
  if (bg === 'custom') return frame.backgroundColor || '#ffffff';
  if (bg === 'white') return '#ffffff';
  if (bg === 'dark') return '#111827';
  if (bg === 'transparent') return 'transparent';
  // For gradient/image/video, extract dominant color or default
  return 'transparent';
})();

// Pass to StackRenderer
<StackRenderer
  // ... existing props
  parentBackgroundColor={effectiveBackgroundColor}
/>
```

### Change 3: Update StackRenderer Empty State (Contrast-Adaptive)

Import and use ContrastEngine:

```typescript
import { isLightColor, getContrastTextColor } from '@/builder/utils/ContrastEngine';

// Inside component:
const isParentDark = parentBackgroundColor && !isLightColor(parentBackgroundColor);

// Empty state - adapt colors
<div 
  className={cn(
    "relative flex flex-col items-center justify-center py-16 px-8 rounded-xl cursor-pointer transition-all",
    "border-2 border-dashed",
    isParentDark 
      ? "border-white/30 hover:border-white/50 bg-white/5"
      : "border-gray-300 hover:border-gray-400 bg-gray-50/50",
    "group/empty"
  )}
>
  <div className={cn(
    "w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center transition-all",
    isParentDark
      ? "bg-white/10 border-white/20 group-hover/empty:bg-white/15"
      : "bg-white border-gray-200 group-hover/empty:border-gray-300"
  )}>
    <LayoutGrid className={cn(
      "w-5 h-5 transition-colors",
      isParentDark 
        ? "text-white/60 group-hover/empty:text-white/80" 
        : "text-gray-400 group-hover/empty:text-gray-600"
    )} />
  </div>
  <div className="text-center">
    <p className={cn(
      "text-sm font-medium transition-colors",
      isParentDark 
        ? "text-white/80 group-hover/empty:text-white" 
        : "text-gray-600 group-hover/empty:text-gray-800"
    )}>
      Add Block
    </p>
    <p className={cn(
      "text-xs mt-0.5",
      isParentDark ? "text-white/50" : "text-gray-400"
    )}>
      Click to add content
    </p>
  </div>
</div>
```

### Change 4: Update "+ Add content" Button (Contrast-Adaptive)

```typescript
{/* Add content button */}
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

### Change 5: Update Main CanvasRenderer StackRenderer (Same Pattern)

The inline `StackRenderer` in `CanvasRenderer.tsx` (lines 4260-4499) also needs the same treatment:

1. Add `parentBackgroundColor` prop computation in the parent loop
2. Apply identical adaptive styling

### Change 6: Update StackRenderer.tsx (Standalone Component)

The standalone `StackRenderer.tsx` file needs:
1. Add `parentBackgroundColor?: string` prop
2. Import ContrastEngine
3. Apply same adaptive styling pattern

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Add background color prop to StackRenderer, update inline StackRenderer styling, update FrameRenderer to pass background |
| `src/flow-canvas/builder/components/renderers/StackRenderer.tsx` | Add background prop, import ContrastEngine, apply adaptive colors |

---

## Visual Result

### Before (Current - Broken)
- Blue background → gray text barely visible
- Dotted border invisible
- Poor contrast ratio (~2.1:1)

### After (Fixed)
- Blue background → white/light text with good contrast
- Dashed border visible as white/30% opacity
- Contrast ratio ≥4.5:1 (WCAG AA compliant)
- Dark backgrounds → light UI elements
- Light backgrounds → dark UI elements (unchanged behavior)

---

## Testing Scenarios

After implementation, verify:

| Background | Expected Empty State | Expected "+ Add content" |
|------------|---------------------|--------------------------|
| White (#fff) | Dark text, gray borders | Gray text |
| Blue (#3B82F6) | White text, white/30 borders | White/50 text |
| Dark (#111827) | White text, white/30 borders | White/50 text |
| Red (#ef4444) | White text, white/30 borders | White/50 text |
| Yellow (#fbbf24) | Dark text, gray borders | Gray text |
| Transparent | Inherit from page background | Inherit from page background |

---

## Technical Notes

### Handling Transparent Backgrounds

When `parentBackgroundColor` is `'transparent'` or not provided, we need to check the step/page background as fallback. This is already done in the "Add Section" button logic (lines 5296-5310) and can be reused.

### Gradient Backgrounds

For gradient backgrounds, extract the first color stop (already have `extractGradientFirstColor` in ContrastEngine) to determine contrast.

### Performance

The `isLightColor` function is lightweight (simple luminance calculation) and only runs on mount/background change, not on every render.
