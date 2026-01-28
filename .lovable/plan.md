
# Fix Multiple Choice Rendering & Font Consistency

## Problem Summary

Two critical issues identified in the funnel builder:

1. **Multiple Choice block renders as generic placeholder** - When adding a Multiple Choice block, instead of showing 4 Perspective-style blue choice cards with emoji icons, it displays a generic fallback that says "Multiple Choice"
2. **Font inconsistencies remain** - The Inter font isn't being applied consistently across all builder components

## Root Cause Analysis

### Issue 1: Missing Case Handler
The `CanvasRenderer.tsx` has no `case 'multiple-choice':` or `case 'single-choice':` handlers in its element type switch statement (around line 1132). When the interactive block factory creates a block with element type `multiple-choice`, it falls through to the `default:` case which renders a generic placeholder.

**Factory output (correct):**
```typescript
// From interactiveBlockFactory.ts
{
  type: 'multiple-choice',
  props: {
    options: [
      { id: '...', label: 'Social media', icon: '🎟️' },
      { id: '...', label: 'Word of mouth', icon: '💬' },
      { id: '...', label: 'Advertising', icon: '⭐' },
      { id: '...', label: 'Search engine', icon: '👀' },
    ],
    layout: 'vertical',
    cardStyle: 'filled',
    cardBackgroundColor: '#2563EB',
    ...
  }
}
```

**Actual rendering (broken):**
Falls through to default case showing "Multiple Choice" text label instead of actual cards.

### Issue 2: CSS Specificity
Some builder components have inline styles or tailwind classes that override the global `font-family: var(--font-sans)` setting.

## Implementation Plan

### Phase 1: Add Multiple Choice Renderer (Priority: Critical)

**File: `src/flow-canvas/builder/components/CanvasRenderer.tsx`**

Add a new case handler for `multiple-choice` and `single-choice` element types that renders Perspective-style choice cards:

1. Add `case 'multiple-choice':` and `case 'single-choice':` handlers before the default case
2. Render a vertical stack of clickable cards, each showing:
   - Emoji icon on the left
   - Choice label text
   - Full-width blue background (Perspective style)
   - Rounded corners (16px)
   - Hover/selected states
3. Wire up selection handling for preview mode
4. Support both `vertical` and `grid` layouts

**Technical implementation:**
- Extract `options` array from `element.props`
- Map over options to render individual choice cards
- Apply Perspective styling: `bg-[#2563EB]`, `text-white`, `rounded-2xl`, `px-7 py-6`
- Handle selection state with ring indicator

### Phase 2: Add Quiz/Grid Choice Renderer (Priority: High)

For quiz blocks with image cards in a 2x2 grid layout:
- Render placeholder image areas
- Blue footer with label
- Grid layout with gap

### Phase 3: Force Font Inheritance (Priority: Medium)

**File: `src/flow-canvas/index.css`**

Add targeted rules to force Inter font across all canvas content:

```css
/* Force Inter font on all canvas content */
.device-frame,
.device-frame *,
[data-canvas-element],
[data-canvas-element] * {
  font-family: var(--font-sans) !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}
```

### Phase 4: Update Block Picker Components

**Files:**
- `src/flow-canvas/builder/components/SectionPicker/InteractiveBlockCard.tsx`
- `src/flow-canvas/builder/components/SectionPicker/BlockTileCard.tsx`
- `src/flow-canvas/builder/components/BlockAdder.tsx`

Ensure all text elements explicitly use `font-sans` and proper tracking.

---

## Detailed Code Changes

### CanvasRenderer.tsx - New Choice Element Handlers

Insert before the `default:` case (around line 3645):

```typescript
case 'multiple-choice':
case 'single-choice': {
  const options = (element.props?.options as Array<{
    id: string;
    label: string;
    icon?: string;
    imageUrl?: string;
  }>) || [];
  
  const layout = (element.props?.layout as string) || 'vertical';
  const cardBg = (element.props?.cardBackgroundColor as string) || '#2563EB';
  const cardTextColor = (element.props?.cardTextColor as string) || '#FFFFFF';
  const cardRadius = (element.props?.cardBorderRadius as string) || '16px';
  const gap = (element.props?.gap as number) || 16;
  const isMultiple = element.type === 'multiple-choice';
  
  return (
    <div ref={combinedRef} style={style} className={cn(baseClasses, 'relative')} {...stateHandlers}>
      {stateStylesCSS && <style>{stateStylesCSS}</style>}
      {!readOnly && (
        <UnifiedElementToolbar ... />
      )}
      <div 
        className={cn(
          'flex flex-col w-full',
          layout === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'
        )}
        style={{ gap: `${gap}px` }}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              'flex items-center gap-4 w-full text-left transition-all duration-200',
              'hover:opacity-90 hover:scale-[1.01]',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            )}
            style={{
              backgroundColor: cardBg,
              color: cardTextColor,
              borderRadius: cardRadius,
              padding: '24px 28px',
              fontWeight: 500,
              fontSize: '16px',
            }}
          >
            {option.icon && (
              <span className="text-2xl">{option.icon}</span>
            )}
            <span className="font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Add `case 'multiple-choice':` and `case 'single-choice':` handlers with full Perspective-style rendering |
| `src/flow-canvas/index.css` | Add !important font rules for canvas content inheritance |
| `src/flow-canvas/builder/components/BlockAdder.tsx` | Add explicit font-sans class |
| `src/flow-canvas/builder/components/SectionPicker/InteractiveBlockCard.tsx` | Ensure font consistency |
| `src/flow-canvas/builder/components/SectionPicker/BlockTileCard.tsx` | Ensure font consistency |

---

## Expected Result

After implementation:
1. Adding a "Multiple Choice" block will render 4 Perspective-style blue cards with emoji icons (Social media, Word of mouth, Advertising, Search engine)
2. Cards will have proper hover states and selection behavior
3. All text in the builder will use Inter font consistently
4. The visual output will match the Perspective screenshots provided

---

## Technical Notes

- The `multiple-choice` element already has all the data (4 options with icons/labels) in the factory - we just need to render it
- Grid layouts (2x2) should use `grid grid-cols-2` with image placeholders for quiz-style blocks
- Selection state tracking will integrate with the existing preview mode form values system
