
# Phase 12: Merge Flow-Canvas Components into v3 Builder

## Overview

This phase directly ports the proven, working components from `flow-canvas/builder` into the new `funnel-builder-v3`, ensuring the v3 builder looks and feels as polished as the original while maintaining the simplified v3 architecture.

---

## Current State

### v3 Builder Has
- Basic block rendering (text, heading, image, video, button, choice, input, divider, spacer, embed, icon)
- Drag-and-drop block reordering via @dnd-kit
- Device frame preview (mobile/tablet/desktop)
- Undo/redo history + keyboard shortcuts
- Screen management (add, delete, duplicate, rename, reorder)
- Basic RightPanel with plain Lucide icons
- Simple EmptyState with plus icon

### What's Missing (Making it look "bland")
1. **Rich Section Picker Modal** - The existing `SectionPicker` from flow-canvas is fully built
2. **Premium Block Icons** - The `BlockIcons.tsx`, `InteractiveBlockIcons.tsx`, `PremiumBlockIcons.tsx` mockups exist
3. **Block Action Bar** - The floating toolbar exists in `BlockActionBar.tsx`
4. **Empty Canvas State** - The `EmptyCanvasState.tsx` with quick-picks exists
5. **Section Templates** - 3500+ lines of templates in `sectionTemplates.ts`
6. **High Ticket Preview Cards** - Rich visual previews in `HighTicketPreviewCard.tsx`

---

## Implementation Strategy

### Step 1: Copy SectionPicker Components (Direct Port)

Copy these existing, working files from `src/flow-canvas/builder/components/SectionPicker/` to `src/funnel-builder-v3/components/SectionPicker/`:

| Source File | Purpose |
|------------|---------|
| `SectionPicker.tsx` | Main modal with left nav + right content |
| `CategoryIcon.tsx` | Geometric category icons |
| `BasicBlockGrid.tsx` | Content blocks grid (Text, Button, Image, etc.) |
| `InteractiveBlockGrid.tsx` | Input/form blocks grid |
| `BlockTileCard.tsx` | Visual tile card component |
| `InteractiveBlockCard.tsx` | Taller card with form mockups |
| `BlockIcons.tsx` | Rich visual mockups for content blocks |
| `InteractiveBlockIcons.tsx` | Form/input mockups |
| `PremiumBlockIcons.tsx` | Gradient text, stats, badges mockups |
| `TemplateGallery.tsx` | Section template grid |
| `QuickPicks.tsx` | Hero/CTA/Form quick cards |
| `index.tsx` | Exports |

**Minor adaptations needed:**
- Update import paths for v3 types
- Connect `onSelectTemplate` to v3's block creation logic

---

### Step 2: Copy Supporting Components

| Source | Destination | Purpose |
|--------|-------------|---------|
| `HighTicketPreviewCard.tsx` | `src/funnel-builder-v3/components/HighTicketPreviewCard.tsx` | Visual template previews |
| `BlockActionBar.tsx` | `src/funnel-builder-v3/components/BlockActionBar.tsx` | Floating selection toolbar |
| `EmptyCanvasState.tsx` | `src/funnel-builder-v3/components/EmptyCanvasState.tsx` | Premium empty state |

---

### Step 3: Integrate Into v3 Editor

**Editor.tsx changes:**
- Add `sectionPickerOpen` state
- Add handler `handleOpenSectionPicker()`
- Add handler `handleSectionPickerSelect(templateId)` - maps template to v3 blocks
- Render `<SectionPicker>` modal

**Canvas.tsx changes:**
- Replace basic `EmptyState` with `EmptyCanvasState`
- Pass `onQuickAdd` and `onBrowseAll` callbacks
- Add "+" button to open SectionPicker from anywhere

**SortableBlockWrapper.tsx changes:**
- Integrate `BlockActionBar` component
- Pass move/duplicate/delete callbacks
- Add "Add above/below" functionality

---

### Step 4: Template to v3 Block Converter

Create a converter utility that maps flow-canvas section templates to v3 blocks:

```text
src/funnel-builder-v3/utils/templateConverter.ts

export function templateToBlocks(templateId: string): Block[] {
  // For simple blocks (text, button, image, etc.)
  // Return single block with default props
  
  // For section templates (hero-simple, cta-form, etc.)
  // Create multiple blocks matching the template structure
}
```

This ensures the rich template library works with v3's simplified `Block[]` structure.

---

## File Summary

### Files to Create (Copy + Adapt)

```text
src/funnel-builder-v3/components/SectionPicker/
  ├── SectionPicker.tsx       (from flow-canvas)
  ├── CategoryIcon.tsx        (direct copy)
  ├── BasicBlockGrid.tsx      (adapted for v3 onAddBlock)
  ├── InteractiveBlockGrid.tsx (adapted for v3 onAddBlock)
  ├── BlockTileCard.tsx       (direct copy)
  ├── InteractiveBlockCard.tsx (direct copy)
  ├── BlockIcons.tsx          (direct copy)
  ├── InteractiveBlockIcons.tsx (direct copy)
  ├── PremiumBlockIcons.tsx   (direct copy)
  ├── TemplateGallery.tsx     (adapted)
  ├── QuickPicks.tsx          (direct copy)
  └── index.ts

src/funnel-builder-v3/components/
  ├── HighTicketPreviewCard.tsx (from flow-canvas)
  ├── BlockActionBar.tsx       (from flow-canvas, simplified)
  └── EmptyCanvasState.tsx     (from flow-canvas)

src/funnel-builder-v3/utils/
  └── templateConverter.ts     (new - maps templates to v3 blocks)
```

### Files to Modify

| File | Changes |
|------|---------|
| `Editor.tsx` | Add SectionPicker state, render modal, handle selection |
| `Canvas.tsx` | Use EmptyCanvasState, add open picker callbacks |
| `SortableBlockWrapper.tsx` | Integrate BlockActionBar |
| `RightPanel.tsx` | Add "Browse Templates" button in Add tab |

---

## Technical Details

### SectionPicker Integration Flow

```text
User clicks "+" or "Browse Templates"
       ↓
SectionPicker modal opens (sectionPickerOpen = true)
       ↓
User selects block or template
       ↓
handleSectionPickerSelect(templateId) called
       ↓
templateConverter.templateToBlocks(templateId)
       ↓
dispatch({ type: 'ADD_BLOCKS', payload: { screenId, blocks } })
       ↓
Modal closes, blocks appear on canvas
```

### Block Category Mapping

The existing SectionPicker categories map to v3 block types:

| Category | v3 Block Types |
|----------|----------------|
| Content | heading, text, image, video, button, divider, spacer, icon |
| Inputs & Forms | input, choice, embed |
| Sections (Hero, CTA, etc.) | Multiple blocks from template |

---

## Success Criteria

1. Full-screen SectionPicker modal opens with categorized blocks
2. Visual block icons (not plain Lucide) in the picker
3. Quick-picks (Hero, CTA, Form) on empty canvas
4. Floating BlockActionBar appears when block is selected
5. "Browse Templates" button in RightPanel opens picker
6. Section templates add multiple blocks at once
7. Same visual polish as the flow-canvas builder

---

## Technical Notes

### Why Direct Copy Works

The flow-canvas SectionPicker is self-contained:
- Uses standard React + Framer Motion
- Imports from `@/lib/utils` (same in v3)
- Uses `@/builder_v2/templates/sectionTemplates` (can reference same file)
- Only interface needed is `onSelectTemplate(templateId: string)`

### BlockActionBar Simplification

The flow-canvas `BlockActionBar` supports both desktop and mobile modes. For v3, we can:
- Keep the full implementation (recommended)
- Or simplify to desktop-only initially

### Template Converter Strategy

For the initial implementation:
- Simple blocks (text, button, etc.) → return single Block
- Section templates → parse `createNode()` output → convert to v3 Block array

This allows using the existing 60+ section templates immediately.
