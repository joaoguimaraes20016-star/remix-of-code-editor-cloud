
# Funnel Builder: Selection IDs, Font Sizing, Duplicate Constant & Perspective Cards Fixes

## Executive Summary

This plan addresses **4 distinct issues** in the funnel builder that cause broken behaviors, build failures, and missing features:

1. **Selection ID mismatch** - Click-to-edit doesn't focus the right sidebar field
2. **Mobile font sizing inconsistency** - Live preview uses smaller fonts on mobile than published funnels
3. **Duplicate constant declaration** - TypeScript build error from duplicate `OPTION_HOVER_OPTIONS`
4. **Missing perspective cards** - Image-based multi-choice cards aren't available in flow-canvas

---

## Issue 1: Selection ID Mismatch

### Problem
When a user clicks elements in `StepPreview`, the selection ID doesn't match what `StepContentEditor` expects, so the sidebar doesn't auto-focus the right input field.

| Element Clicked | StepPreview sends | StepContentEditor expects |
|-----------------|-------------------|---------------------------|
| CTA Button | `"button"` | `"button_text"` |
| Input field | `"input"` | `"placeholder"` |
| Submit button | `"submit_button"` | (no mapping) |

**Root Cause**: 
- `StepPreview.tsx:616-617` - Button selection uses `elementId` which is `"button"`
- `StepContentEditor.tsx:114-115` - Auto-focus expects `"button_text"` and `"placeholder"`

### Fix
Update `StepPreview.tsx` to send the correct IDs that match what the sidebar expects:

```typescript
// Button at line ~617: Change elementId to 'button_text'
onSelect={() => onSelectElement('button_text')}
isSelected={selectedElementId === 'button_text'}

// Input placeholder area: Change to 'placeholder'
onSelect={() => onSelectElement('placeholder')}
isSelected={selectedElementId === 'placeholder'}
```

Also update `EditorSidebar.tsx:132-133` label mappings to handle both IDs gracefully:
```typescript
if (selectedElementId === 'button' || selectedElementId === 'button_text') return 'Button';
if (selectedElementId === 'input' || selectedElementId === 'placeholder') return 'Input Field';
```

**Files to modify:**
- `src/components/funnel-builder/StepPreview.tsx` (~6 lines)
- `src/components/funnel-builder/EditorSidebar.tsx` (~4 lines)

---

## Issue 2: Live Preview Font Sizing Mismatch

### Problem
`LivePreviewMode.tsx:232` passes `isPreview={device === 'mobile'}` to `DynamicElementRenderer`, which then selects a smaller font map (`PREVIEW_FONT_SIZE_MAP`) only for mobile.

This means:
- **Mobile preview**: Uses small "editor" fonts
- **Tablet/Desktop preview**: Uses large "public" fonts
- **Actual published funnel (all devices)**: Uses large "public" fonts

The mobile preview looks wrong compared to what users will actually see.

**Root Cause**: The conditional `isPreview={device === 'mobile'}` is backwards logic from when previews needed smaller fonts in a constrained space. Now the live preview should match public rendering exactly.

### Fix
Change `LivePreviewMode.tsx:232` to always use public font sizing:

```typescript
// BEFORE (broken):
isPreview={device === 'mobile'}

// AFTER (consistent):
isPreview={false}  // Always use public font sizing in live preview
```

Alternatively, remove the `isPreview` prop entirely since `false` is the default.

**Files to modify:**
- `src/components/funnel-builder/LivePreviewMode.tsx` (~1 line)

---

## Issue 3: Duplicate Constant Declaration

### Problem
`DesignEditor.tsx` declares `OPTION_HOVER_OPTIONS` twice at lines 91-96 and 98-103:

```typescript
// Line 91-96:
const OPTION_HOVER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'scale', label: 'Scale' },
  { value: 'glow', label: 'Glow' },
  { value: 'lift', label: 'Lift' },
];

// Line 98-103 (DUPLICATE):
const OPTION_HOVER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'scale', label: 'Scale' },
  { value: 'glow', label: 'Glow' },
  { value: 'lift', label: 'Lift' },
];
```

This causes TypeScript error: `Cannot redeclare block-scoped variable 'OPTION_HOVER_OPTIONS'`

### Fix
Delete lines 98-103 (the duplicate declaration).

**Files to modify:**
- `src/components/funnel-builder/DesignEditor.tsx` (delete 6 lines)

---

## Issue 4: Missing Perspective-Style Multi-Choice Cards

### Problem
The `builder_v2` system has image-based "perspective" cards for multi-choice questions, but the active `flow-canvas` funnel builder only renders simple text buttons without image support.

**Schema Support**: The schema already supports images!
- `CaptureNodeChoice.imageUrl` exists in `src/flow-canvas/types/captureFlow.ts:56`
- The legacy adapter maps `imageUrl` correctly

**Missing**: The renderers (`SingleChoiceNode.tsx`, `MultiChoiceNode.tsx`) don't use `choice.imageUrl`.

### Fix
Update `SingleChoiceNode.tsx` and `MultiChoiceNode.tsx` to:
1. Detect if any choices have images: `const hasImages = choices.some(c => c.imageUrl);`
2. Apply perspective grid layout when images exist
3. Render image cards with the image on top and label below

**Updated SingleChoiceNode rendering logic:**

```tsx
// Detect image layout mode
const hasImages = choices.some(c => c.imageUrl);

return (
  <div className={cn(
    "w-full",
    hasImages ? "grid grid-cols-2 gap-4" : "flex flex-col gap-2"
  )}>
    {choices.map((choice) => (
      <button
        key={choice.id}
        className={cn(
          'transition-all text-left',
          hasImages && choice.imageUrl
            ? 'flex flex-col rounded-xl overflow-hidden border border-border'
            : 'flex items-center gap-3 p-4 rounded-lg border',
          // ... selection styles
        )}
      >
        {/* Image card layout */}
        {hasImages && choice.imageUrl && (
          <div 
            className="w-full aspect-[4/3] bg-cover bg-center"
            style={{ backgroundImage: `url(${choice.imageUrl})` }}
          />
        )}
        
        {/* Label area */}
        <div className={cn(
          hasImages && choice.imageUrl 
            ? "p-3 bg-primary text-primary-foreground"
            : "flex items-center gap-3"
        )}>
          {!hasImages && choice.emoji && (
            <span className="text-lg">{choice.emoji}</span>
          )}
          <span className="text-sm font-medium">{choice.label}</span>
        </div>
      </button>
    ))}
  </div>
);
```

**Also add CSS for perspective cards** (in `mobile.css` or as Tailwind classes):

```css
/* Perspective card grid */
.choice-grid--perspective {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.choice-card--image {
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: 14px;
}
```

**Files to modify:**
- `src/flow-canvas/builder/components/capture-flow/nodes/SingleChoiceNode.tsx` (~40 lines)
- `src/flow-canvas/builder/components/capture-flow/nodes/MultiChoiceNode.tsx` (~40 lines)
- Add image URL field to choice inspector if not present

---

## Implementation Priority

| Issue | Priority | Risk | Effort |
|-------|----------|------|--------|
| 3 - Duplicate constant | **P0** | Build breaking | 2 min |
| 2 - Font sizing | **P1** | User confusion | 5 min |
| 1 - Selection IDs | **P1** | Poor UX | 15 min |
| 4 - Perspective cards | **P2** | Missing feature | 45 min |

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/funnel-builder/DesignEditor.tsx` | Delete duplicate lines 98-103 |
| `src/components/funnel-builder/LivePreviewMode.tsx` | Change `isPreview={device === 'mobile'}` to `isPreview={false}` |
| `src/components/funnel-builder/StepPreview.tsx` | Update selection IDs for button and input |
| `src/components/funnel-builder/EditorSidebar.tsx` | Update label mapping to handle both ID formats |
| `src/flow-canvas/builder/components/capture-flow/nodes/SingleChoiceNode.tsx` | Add image card layout |
| `src/flow-canvas/builder/components/capture-flow/nodes/MultiChoiceNode.tsx` | Add image card layout |

---

## Testing Checklist

After implementation:
- [ ] Build succeeds without TypeScript errors
- [ ] Clicking CTA button in preview focuses sidebar "Button Text" field
- [ ] Clicking input placeholder focuses sidebar "Placeholder" field
- [ ] Mobile live preview shows same font sizes as tablet/desktop
- [ ] Published funnels match live preview exactly on all devices
- [ ] Multi-choice with images renders as 2-column card grid
- [ ] Multi-choice without images renders as vertical list buttons
