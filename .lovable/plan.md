
# Block vs Element vs Section — IMPLEMENTED ✅

## Summary of Changes Made

1. **Removed `video-thumbnail` from ElementType** — Use `video` with `displayMode: 'thumbnail'`
2. **Removed `spacer`, `divider` from BlockType** — These are Elements, wrap in `'custom'` block
3. **Added `faq` to BlockType** — FAQ section template (contains faq accordion elements)
4. **Updated `getBlockCategory()`** — Returns `'Section' | 'Content'` instead of `'Container' | 'Content' | 'Layout'`
5. **Added `FrameTemplateType`** — Documents Frame = Section mapping
6. **Updated all templates** — AddSectionPopover, BlockPickerPanel use correct types
7. **Updated AI parsers** — parseFunnelResponse, parseAIBlockResponse, templateConverter

## Architecture Reference

---

## Part 1: The Intended Architecture (Per ARCHITECTURE.md)

```text
Page
└── Step (funnel step/page)
    └── Frame (visual container = "Section" in UI)
        └── Stack (layout direction: vertical/horizontal)
            └── Block (content group with type)
                └── Element (atomic unit: text, button, input, etc.)
```

**Key definitions:**
- **Frame** = A visual section container (labeled "Section" in UI)
- **Block** = A content group (hero, cta, form-field, etc.)
- **Element** = Atomic content (text, heading, button, input, video, etc.)

---

## Part 2: Inconsistencies Found

### Category A: Type Collision — Same Type in Both BlockType AND ElementType

These types exist in BOTH `BlockType` and `ElementType`, creating ambiguity:

| Type | In BlockType? | In ElementType? | Issue |
|------|--------------|-----------------|-------|
| `faq` | ✅ Yes | ✅ Yes | Block AND element — which renders? |
| `spacer` | ✅ Yes | ✅ Yes | Block OR element? Different rendering paths |
| `divider` | ✅ Yes | ✅ Yes | Block OR element? Different rendering paths |

**Evidence:**
- `infostack.ts:64` - `'faq'` as BlockType
- `infostack.ts:47` - `'faq'` as ElementType
- `infostack.ts:71` - `'spacer'` as BlockType
- `infostack.ts:23` - `'spacer'` as ElementType
- `infostack.ts:72` - `'divider'` as BlockType
- `infostack.ts:22` - `'divider'` as ElementType

**Problem:** When the renderer sees `type: 'faq'`, should it:
1. Render as a Block (container with elements inside)?
2. Render as an Element (atomic FAQ accordion)?

---

### Category B: BlockType That Should Be Sections

Some BlockTypes are actually full-page sections (containers), not content blocks:

| BlockType | Reality | Should Be |
|-----------|---------|-----------|
| `hero` | Full-width page section | Frame (Section) template |
| `footer` | Full-width page section | Frame (Section) template |
| `pricing` | Full-width page section | Frame (Section) template |
| `about` | Full-width page section | Frame (Section) template |
| `team` | Full-width page section | Frame (Section) template |
| `contact` | Full-width page section | Frame (Section) template |
| `trust` | Full-width page section | Frame (Section) template |
| `feature` | Full-width page section | Frame (Section) template |

**Evidence from `labels.ts:8-11`:**
```typescript
const sectionTypes = new Set([
  'hero', 'cta', 'about', 'testimonial', 'feature', 'pricing', 
  'faq', 'team', 'trust', 'footer', 'contact', 'custom'
]);
```

The code **acknowledges** these are sections but stores them as BlockTypes.

---

### Category C: Elements That Should Be Blocks (or Vice Versa)

| Item | Currently | Should Be | Reason |
|------|-----------|-----------|--------|
| `video-thumbnail` | ElementType | Merged into `video` | Duplicate of `video` with different rendering |
| `form-field` | BlockType | Template, not type | It's a grouping concept, not a visual type |
| `media` | BlockType | Template | Contains image OR video elements |
| `text-block` | BlockType | Template | Just a container for text elements |
| `cta` | BlockType | Template | Just a container for button elements |
| `logo-bar` | BlockType | Template | Should be `logo-marquee` element |
| `booking` | BlockType | Template | Container for calendar embed |
| `testimonial` | BlockType | Template | Container for quote + attribution |

---

### Category D: Naming Inconsistencies (Internal vs UI)

| Internal Name | UI Label | Files Using Internal | Files Using UI Label |
|---------------|----------|---------------------|---------------------|
| `Frame` | `Section` | 15+ components | SectionActionBar, LeftPanel, AddSectionPopover |
| `Block` | `Block` (sometimes "Content Block") | CanvasRenderer | BlockPickerPanel |
| `Stack` | (Hidden from user) | CanvasRenderer | N/A |
| `application-flow` | `Multi-Step` | Types, Renderer | BlockPickerPanel labels |
| `capture-flow-embed` | (Deprecated) | Types | N/A |

**Problem:** User sees "Add Section" but code manipulates "Frame".

---

### Category E: Templates Creating Wrong Types

In `BlockPickerPanel.tsx`, templates create inconsistent structures:

| Template | Block.type Created | Elements Created | Issue |
|----------|-------------------|------------------|-------|
| Divider | `'custom'` | `[{ type: 'divider' }]` | Why not `type: 'divider'` block? |
| Logo Bar | `'custom'` | `[{ type: 'image', variant: 'logo-bar' }]` | Should be `logo-marquee` element |
| Reviews | `'custom'` | `[{ type: 'text', variant: 'reviews' }]` | Should be `trustpilot` or dedicated element |
| Slider | `'custom'` | `[{ type: 'image', variant: 'slider' }]` | Should be `carousel` element |
| Spacer | `'spacer'` | `[]` | Block with no elements? |

**Evidence (`BlockPickerPanel.tsx:386-396`):**
```typescript
{
  type: 'divider',
  label: 'Divider',
  template: () => ({
    id: generateId(),
    type: 'custom',  // ← Creates 'custom' block
    label: 'Divider',
    elements: [{ id: generateId(), type: 'divider', ... }], // ← With 'divider' element
  }),
}
```

---

### Category F: Rendering Path Confusion

The `CanvasRenderer.tsx` has **multiple render paths** for the same concept:

1. **Block-level rendering** - Renders the Block container with styling
2. **Element-level rendering** - Renders each Element inside
3. **Special block types** - `application-flow` gets completely different rendering

| Type | Rendered At | Notes |
|------|-------------|-------|
| `hero` block | Block level | Gets `py-12 text-center` automatically |
| `text` element | Element level | Normal rendering |
| `divider` block | N/A | Block has no elements, so nothing renders! |
| `divider` element | Element level | Renders the line |
| `spacer` block | Block level | Just adds height |
| `spacer` element | Element level | Also adds height |
| `faq` element | Element level | Renders accordion |
| `faq` block | Block level | What happens? Just wrapper |

---

### Category G: Inspector Logic Mismatches

The `RightPanel.tsx` uses `getBlockCategory()` to decide which controls to show:

```typescript
// labels.ts:53-56
export const getBlockCategory = (type: BlockType): 'Container' | 'Content' | 'Layout' => {
  if (type === 'spacer' || type === 'divider') return 'Layout';
  return sectionTypes.has(type) ? 'Container' : 'Content';
};
```

**Problems:**
- `hero`, `cta`, `testimonial` → `Container` → Show layout controls
- `text-block`, `media`, `form-field` → `Content` → Hide layout controls
- `spacer`, `divider` → `Layout` → What controls?

But then **elements inside blocks** don't respect this. A button element inside a `cta` block has its own styling, separate from the block's "Container" category.

---

### Category H: video-thumbnail Still Exists Everywhere

Despite claims of unification, `video-thumbnail` is still:

1. **In ElementType** (`infostack.ts:38`)
2. **Created by templates** (`AddSectionPopover.tsx:419, 671, 856`)
3. **Has separate inspector** (`PremiumElementInspector.tsx:1361`)
4. **Handled in FlowCanvasRenderer separately** (`FlowCanvasRenderer.tsx:1683`)

---

## Part 3: The Correct Conceptual Model

### What Each Level SHOULD Be

| Level | Purpose | Contains | UI Term |
|-------|---------|----------|---------|
| **Frame** | Visual section boundary | Stacks | "Section" |
| **Stack** | Layout direction control | Blocks | (Hidden) |
| **Block** | Content grouping | Elements | "Block" or "Content" |
| **Element** | Atomic content unit | Props only | "Element" or by type name |

### BlockType SHOULD Be Limited To:
- `text-block` - Text content container
- `form-field` - Input fields container
- `cta` - Button/action container
- `media` - Image/video container
- `testimonial` - Quote container
- `booking` - Calendar container
- `application-flow` - Multi-step interactive
- `custom` - Empty container

### BlockType Should NOT Include:
- `hero`, `footer`, `pricing`, `about`, `team`, `contact`, `trust`, `feature`
  - These are **Frame templates** (sections), not block types
- `spacer`, `divider`, `faq`
  - These are **Elements**, not blocks

---

## Part 4: Recommended Fixes

### Fix 1: Remove Duplicate Types

Remove from `BlockType` (keep only in `ElementType`):
- `spacer`
- `divider`  
- `faq`

Update templates to create Elements directly within a `custom` block.

### Fix 2: Rename Section Types as Frame Templates

Move these from BlockType to a new `FrameTemplateType`:
- `hero`, `footer`, `pricing`, `about`, `team`, `contact`, `trust`, `feature`

These become templates for creating Frames, not block types.

### Fix 3: Fully Remove video-thumbnail

1. Delete from `ElementType`
2. Update ALL templates to use `type: 'video'` with `displayMode: 'thumbnail'`
3. Remove separate inspector handling
4. Remove separate FlowCanvasRenderer case

### Fix 4: Normalize Template Output

All templates in `BlockPickerPanel.tsx` and `AddSectionPopover.tsx` should:
1. Create blocks with correct `type` (not always `'custom'`)
2. Create elements with correct `type` (not variants of other types)

### Fix 5: Align Internal/External Naming

| Internal | External (UI) | Action |
|----------|---------------|--------|
| Frame | Section | Keep — document mapping |
| Stack | (Hidden) | Keep hidden |
| Block | Block | Keep consistent |
| Element | (By type name) | Keep — show "Button", "Text", etc. |

### Fix 6: Simplify getBlockCategory

```typescript
// New approach: blocks don't have categories
// ALL blocks just contain elements
// Layout/Container distinction should be at Frame level
```

---

## Part 5: Implementation Priority

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | Remove duplicate types (spacer, divider, faq) | Reduces confusion | Medium |
| P0 | Fully eliminate video-thumbnail | Reduces redundancy | Low |
| P1 | Move section types to FrameTemplateType | Architectural clarity | High |
| P1 | Normalize template output | Consistency | Medium |
| P2 | Document Frame = Section mapping | Developer clarity | Low |
| P2 | Simplify inspector category logic | Cleaner code | Medium |

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `src/flow-canvas/types/infostack.ts` | Remove duplicate types, add FrameTemplateType |
| `src/flow-canvas/builder/utils/labels.ts` | Update category logic, remove sectionTypes |
| `src/flow-canvas/builder/components/BlockPickerPanel.tsx` | Fix template output types |
| `src/flow-canvas/builder/components/AddSectionPopover.tsx` | Fix template output types, remove video-thumbnail |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Remove video-thumbnail case |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Remove video-thumbnail case |
| `src/flow-canvas/builder/components/inspectors/PremiumElementInspector.tsx` | Remove video-thumbnail section |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Simplify block category display |
