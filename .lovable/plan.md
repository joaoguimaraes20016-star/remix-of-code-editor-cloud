
# Phase 16: Integrate Flow-Canvas Components into Funnel Builder V3

## The Problem

The v3 builder feels incomplete compared to the original flow-canvas builder:

1. **Raw HTML showing on canvas** - Text blocks display `<span style="font-weight: 700">` instead of rendered formatted text
2. **Missing rich inspector controls** - No color pickers, gradient editors, typography sliders, animation presets
3. **No floating element toolbar** - No quick access to alignment, color, duplicate, delete
4. **Missing inline text editing** - No rich text toolbar with Bold/Italic/Alignment when editing text
5. **Basic block rendering** - No state-based styling (hover, active), no animations

## Solution Strategy

Rather than rewriting v3 from scratch, we will **import and adapt the proven flow-canvas components** into the v3 architecture:

```text
flow-canvas (6,000+ lines of polished UI)
       ↓
    Adapter Layer
       ↓
funnel-builder-v3 (simplified data model)
```

---

## Phase 16A: Fix Immediate Content Rendering Issues

### Problem: Raw HTML Display
The v3 `TextBlock` and `HeadingBlock` use `dangerouslySetInnerHTML` but then show raw HTML strings.

**Root Cause:** The `sanitizeContent` function strips metadata but doesn't handle HTML entities properly when content is converted from templates.

**Fix:** Update content handling to properly render rich text:

```typescript
// src/funnel-builder-v3/components/blocks/TextBlock.tsx
// Instead of showing raw HTML, strip tags for plain text display or render HTML properly
function renderContent(content: string): React.ReactNode {
  const sanitized = sanitizeContent(content);
  // If it has HTML, render with dangerouslySetInnerHTML but in a div
  if (hasHtml(sanitized)) {
    return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }
  return sanitized;
}
```

---

## Phase 16B: Port Inspector Modals & Controls

### Components to Port

| Component | Source | Purpose |
|-----------|--------|---------|
| `ColorPickerPopover` | `flow-canvas/modals` | Rich color picker with presets |
| `GradientPickerPopover` | `flow-canvas/modals` | Gradient editor with stops |
| `EffectsPickerPopover` | `flow-canvas/modals` | Shadow/blur effects |
| `AnimationPresetSection` | `flow-canvas/inspectors` | Animation dropdown with preview |
| `CollapsibleSection` (enhanced) | `flow-canvas/RightPanel` | Inspector section with auto-scroll |

### Implementation

Create a shared inspector components folder:
```
src/funnel-builder-v3/components/inspector/
  ├── controls/
  │   ├── ColorPickerPopover.tsx    ← Port from flow-canvas
  │   ├── GradientPickerPopover.tsx ← Port from flow-canvas
  │   ├── TextFillControl.tsx       ← Solid/Gradient toggle + pickers
  │   └── TypographyControls.tsx    ← Size slider, weight, font family
  ├── AnimationPresetSection.tsx    ← Port from flow-canvas
  └── ...existing files
```

---

## Phase 16C: Port Floating Element Toolbar

### Component: `ElementActionBar`
Currently exists in flow-canvas as a polished floating toolbar with:
- Drag handle
- Alignment buttons (Left/Center/Right)
- Color picker shortcut
- Duplicate button
- Delete button

**Integration Plan:**
1. Copy `ElementActionBar.tsx` to v3 components
2. Add to `SortableBlockWrapper.tsx` to show on hover/selection
3. Wire up handlers to existing block actions

```typescript
// src/funnel-builder-v3/components/blocks/SortableBlockWrapper.tsx
<div className="group/block relative">
  <ElementActionBar
    elementId={block.id}
    elementType={block.type}
    currentAlign={block.props.align}
    onAlignChange={(align) => onUpdateBlock({ props: { ...block.props, align } })}
    onDuplicate={onDuplicate}
    onDelete={onDelete}
  />
  {children}
</div>
```

---

## Phase 16D: Port Rich Text Toolbar

### Component: `RichTextToolbar` + `InlineTextEditor`
Currently exists in flow-canvas as a floating toolbar when editing text:
- Font size dropdown (M, etc.)
- Bold (B)
- Italic (I)
- Alignment buttons
- Copy/Delete

**Integration Plan:**
1. Port `RichTextToolbar.tsx` to v3
2. Port `InlineTextEditor.tsx` context for managing edit state
3. Show toolbar when double-clicking text/heading blocks

---

## Phase 16E: Enhance Block Rendering

### Add State-Based Styling
Port the `resolveElementStyles` logic from flow-canvas `CanvasRenderer`:

```typescript
// Handle hover/active states on buttons
const [interactionState, setInteractionState] = useState<'base' | 'hover' | 'active'>('base');

// Merge base styles with state-specific overrides
const resolvedStyles = useMemo(() => {
  const base = block.props;
  const stateOverrides = block.props.stateStyles?.[interactionState] || {};
  return { ...base, ...stateOverrides };
}, [block.props, interactionState]);
```

### Add Animation Support
Port the `effectClasses` mapping and animation CSS:

```typescript
const effectClasses: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'bounce': 'animate-bounce',
  // ...etc
};
```

---

## Files to Create/Modify

### New Files (Ported from flow-canvas)

| File | Lines | Purpose |
|------|-------|---------|
| `inspector/controls/ColorPickerPopover.tsx` | ~200 | Rich color picker |
| `inspector/controls/GradientPickerPopover.tsx` | ~300 | Gradient editor |
| `inspector/controls/TextFillControl.tsx` | ~100 | Solid/Gradient toggle |
| `components/ElementActionBar.tsx` | ~240 | Floating toolbar |
| `components/RichTextToolbar.tsx` | ~150 | Inline text editing toolbar |

### Modified Files

| File | Changes |
|------|---------|
| `blocks/TextBlock.tsx` | Fix HTML rendering, add inline edit state |
| `blocks/HeadingBlock.tsx` | Fix HTML rendering, add inline edit state |
| `blocks/SortableBlockWrapper.tsx` | Add ElementActionBar |
| `RightPanel.tsx` | Use ported color/gradient pickers |
| `Canvas.tsx` | Add RichTextToolbar portal |

---

## Visual Comparison

### Current v3 (Broken)
```text
┌──────────────────────────────────┐
│ <span style="font-weight: 700"   │
│ data-inline-style-id="...">200+  │
│ </span>STUDENTS BECAME TOGI...   │
└──────────────────────────────────┘
```

### After Fix (Rendered Properly)
```text
┌──────────────────────────────────┐
│ 200+ STUDENTS BECAME TOGI        │  ← Bold text rendered
│ No Brain Needed...               │  ← Italic text rendered
└──────────────────────────────────┘
│ [≡] [B] [I] [⬛] [≡] [⬛] [🗑]    │  ← Floating toolbar on hover
└──────────────────────────────────┘
```

---

## Implementation Order

1. **Fix content rendering** (immediate visual fix)
2. **Port ColorPickerPopover** (enables color editing)
3. **Port ElementActionBar** (quick actions on canvas)
4. **Port AnimationPresetSection** (animation controls)
5. **Port RichTextToolbar** (inline text formatting)
6. **Enhance RightPanel** (full inspector parity)

---

## Success Criteria

1. Text/heading blocks render formatted content (bold, italic, colors)
2. Hovering blocks shows floating action bar
3. Double-clicking text shows rich text toolbar
4. Inspector has color pickers with presets
5. Animation dropdown works with preview
6. Overall feel matches the original flow-canvas builder
