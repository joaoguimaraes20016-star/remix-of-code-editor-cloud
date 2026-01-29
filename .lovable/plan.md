
# Bug Audit: Funnel Builder New Features

## Summary of Issues Found

After thoroughly investigating the codebase, I've identified **7 major bugs** causing the glitchy, flashing, non-editable behavior.

---

## Issue 1: Missing Element Renderers (CRITICAL)

**Symptoms:** Elements flash/pulse briefly then display fallback. Cannot edit.

**Root Cause:** Several new element types in `basicBlockFactory.ts` have NO corresponding `case` handlers in `CanvasRenderer.tsx`:

| Element Type | Created In Factory | Case Handler in CanvasRenderer |
|--------------|-------------------|-------------------------------|
| `social-proof` | Reviews block | MISSING |
| `feature-list` | List block | MISSING |
| `input` | Form blocks | MISSING (falls to default) |
| `checkbox` | Form/Consent blocks | MISSING |
| `gradient-text` | Premium block | MISSING |
| `underline-text` | Premium block | MISSING |
| `stat-number` | Premium block | MISSING |
| `avatar-group` | Premium block | MISSING |
| `ticker` | Premium block | MISSING |
| `badge` | Premium block | MISSING |
| `process-step` | Premium block | MISSING |

**Why It Flashes:** The `React.Suspense` fallback shows `animate-pulse` skeleton loaders. When the renderer hits the `default` case, it shows the fallback placeholder instead of real content.

**Fix:** Add explicit `case` handlers for each missing element type in `CanvasRenderer.tsx`.

---

## Issue 2: Premium Blocks Have No Factory Functions

**Symptoms:** Clicking premium blocks in the picker does nothing useful.

**Root Cause:** `BasicBlockGrid.tsx` lists 7 premium blocks (gradient-text, underline-text, stat-number, avatar-group, ticker, badge, process-step), but these IDs are NOT handled by:
- `createBasicBlock()` in `basicBlockFactory.ts`
- `createInteractiveBlock()` in `interactiveBlockFactory.ts`

The picker calls `onSelectTemplate(blockId)` but no factory knows how to create these blocks.

**Fix:** Add factory functions for all premium block types OR remove them from the picker until implemented.

---

## Issue 3: Block ID Mismatch Between Picker and Factory

**Symptoms:** Some blocks don't appear when added.

**Root Cause:** Block IDs in `BasicBlockGrid.tsx` don't match factory function expectations:

| Picker ID | Factory Expected ID |
|-----------|---------------------|
| `logo-bar` | `logo-bar` (OK) |
| `video` | `video` (OK) |
| `form` | `form` (BUT creates simple form, not form-block) |

**Fix:** Ensure consistent ID mapping between picker and factory.

---

## Issue 4: Quiz/Choice Blocks Missing Grid Layout Renderer

**Symptoms:** Quiz blocks with 2x2 grid layout don't render correctly.

**Root Cause:** The `case 'single-choice':` handler was added but only supports vertical/flex layout. Quiz blocks specify `layout: 'grid'` with `columns: 2`, but the renderer doesn't properly handle the image-card grid style.

The current code:
```typescript
layout === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'
```

But it doesn't render the image placeholders, footers, or card structure that quiz blocks define.

**Fix:** Extend the choice renderer to support the `cardStyle: 'image-footer'` variant with proper image placeholders and blue footer labels.

---

## Issue 5: Form Input Elements Missing Proper Renderer

**Symptoms:** Form blocks show raw placeholders instead of styled inputs.

**Root Cause:** The interactive block factory creates elements with `type: 'input'` and rich props (borderRadius, padding, icon, iconPosition), but `CanvasRenderer.tsx` doesn't have a case handler for `'input'` type with these props.

It falls through to the default case showing "Input" text instead of an actual input field.

**Fix:** Add `case 'input':` handler that renders a proper styled input with icon support.

---

## Issue 6: Checkbox/Consent Elements Missing Renderer

**Symptoms:** Consent checkboxes in forms don't render.

**Root Cause:** `createFormBlockBlock()` creates elements with `type: 'checkbox'` containing:
- checkboxSize, checkboxColor, checkboxBorderRadius
- labelColor, labelSize
- linkText, linkUrl

No case handler exists for `'checkbox'` type elements.

**Fix:** Add `case 'checkbox':` handler with proper styling.

---

## Issue 7: Font Inheritance Breaking in Lazy-Loaded Components

**Symptoms:** Some elements show system fonts instead of Inter.

**Root Cause:** Lazy-loaded components (`React.lazy()`) mount outside the CSS variable context briefly, causing font flicker. The `!important` rules in `index.css` help but don't fully solve it for dynamically rendered content.

**Fix:** Ensure all lazy-loaded element components explicitly inherit `font-family: var(--font-sans)` in their root elements.

---

## Implementation Plan

### Phase 1: Add Missing Element Renderers (Priority: Critical)

**File: `src/flow-canvas/builder/components/CanvasRenderer.tsx`**

Add case handlers before `default:` for:

1. **`case 'social-proof':`** - Render avatar group + stars + rating text
2. **`case 'feature-list':`** - Render emoji icon list with titles/descriptions
3. **`case 'input':`** - Render styled input with icon support
4. **`case 'checkbox':`** - Render checkbox with label and link

### Phase 2: Fix Quiz/Choice Grid Layout

Extend `case 'single-choice':` to detect `cardStyle: 'image-footer'` and render:
- 2x2 grid layout
- Image placeholder areas
- Blue footer with white label text

### Phase 3: Remove or Implement Premium Blocks

**Option A (Quick):** Remove premium blocks from `BasicBlockGrid.tsx` until implemented
**Option B (Full):** Add factory functions and renderers for all 7 premium types

### Phase 4: Ensure Font Consistency

Update all lazy-loaded components to explicitly set:
```css
font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Add 4+ new case handlers (social-proof, feature-list, input, checkbox) |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Extend single-choice handler for image-footer grid style |
| `src/flow-canvas/builder/utils/basicBlockFactory.ts` | Add premium block factory functions OR... |
| `src/flow-canvas/builder/components/SectionPicker/BasicBlockGrid.tsx` | Remove premium blocks until implemented |
| `src/flow-canvas/builder/components/elements/*.tsx` | Add explicit font-family to lazy-loaded components |

---

## Expected Outcome

After implementation:
1. All blocks from the picker will render correctly
2. No more flashing/pulse animations on real content
3. All elements will be editable when clicked
4. Quiz blocks will show proper 2x2 image card grids
5. Form blocks will show styled inputs with icons
6. Fonts will be consistent across all components
