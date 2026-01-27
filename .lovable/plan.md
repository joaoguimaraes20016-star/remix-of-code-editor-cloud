

# Preview Mode UI Polish: Unify State Indicators & Visual Consistency

## Executive Summary

This plan addresses **14 issues** from the UI audit related to preview mode visibility, styling, and interaction consistency. The core problems are:

1. **Trust Failure**: Dual preview indicators (toolbar "Previewing" button + floating "Preview Mode" pill) create conflicting visual states
2. **Visual Inconsistency**: The floating pill uses a different design language than the toolbar system
3. **Interaction Gaps**: Exit button lacks clear hover/focus states and explicit labeling

---

## Issue Categories Overview

| Category | Issues | Impact | Primary Files |
|----------|--------|--------|---------------|
| A. Trust Failures | 2 | Critical | EditorShell.tsx, TopToolbar.tsx |
| B. Visual Inconsistencies | 2 | High | flow-canvas/index.css |
| C. Alignment & Grid | 2 | Medium | EditorShell.tsx, flow-canvas/index.css |
| D. Hover/Interaction | 2 | Medium | EditorShell.tsx, flow-canvas/index.css |
| E. Visual Clutter | 2 | Medium | EditorShell.tsx |
| F. Wording/Labels | 2 | Low | EditorShell.tsx, TopToolbar.tsx |
| G. Premium Feel | 2 | High | EditorShell.tsx, flow-canvas/index.css |

---

## Implementation Strategy: Consolidate to Single Source of Truth

The recommended approach is to **remove the floating center pill** and enhance the toolbar "Previewing" button to be the single, unambiguous preview indicator. This eliminates duplicate status and reduces visual clutter.

---

## A. Critical Trust Failures (2 issues)

### A1 & E1: Dual Preview Indicators Create Confusion

**Problem**: Two preview indicators exist simultaneously:
1. **Toolbar button** (lines 475-486 of TopToolbar.tsx): Shows "Previewing" with eye icon when active
2. **Floating pill** (lines 1858-1872 of EditorShell.tsx): Shows "Preview Mode" with exit button

When both are visible, users can't tell which is the "real" state indicator.

**Current floating pill** (EditorShell.tsx:1858-1872):
```tsx
{previewMode && (
  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 glass border border-builder-border rounded-full pointer-events-auto">
    <div className="w-2 h-2 rounded-full bg-builder-success animate-pulse" />
    <span className="text-xs font-medium text-builder-text">Preview Mode</span>
    <button 
      onClick={(e) => { ... setPreviewMode(false); }}
      className="ml-2 px-2 py-1 text-xs font-medium text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover rounded transition-colors"
    >
      Exit
    </button>
  </div>
)}
```

**Fix**: Remove the floating pill entirely and enhance the toolbar button:

```tsx
// EditorShell.tsx - REMOVE lines 1858-1872 completely

// TopToolbar.tsx - Enhance the preview button (lines 474-486)
{/* Preview Toggle - Single Source of Truth */}
<button 
  onClick={onPreviewToggle}
  className={cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
    previewMode 
      ? 'bg-builder-success/20 text-[hsl(var(--builder-success))] ring-1 ring-builder-success/50' 
      : 'text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover'
  )}
>
  {previewMode ? (
    <>
      <div className="w-2 h-2 rounded-full bg-builder-success animate-pulse" />
      <Eye className="w-4 h-4" />
      <span>Previewing</span>
      <span className="text-[hsl(var(--builder-text-muted))]">·</span>
      <span className="text-[hsl(var(--builder-text-secondary))] hover:text-[hsl(var(--builder-success))]">
        Exit
      </span>
    </>
  ) : (
    <>
      <Play className="w-4 h-4" />
      <span>Preview</span>
    </>
  )}
</button>
```

**Files to modify**:
- `src/flow-canvas/builder/components/EditorShell.tsx` (remove lines 1858-1872)
- `src/flow-canvas/builder/components/TopToolbar.tsx` (enhance lines 474-486)

---

### A2 & F2: "Exit" Button Is Too Vague

**Problem**: The current "Exit" text doesn't specify what it exits.

**Fix**: The enhanced toolbar button (above) includes "Exit" inline with "Previewing" in the same control, making the action clear. Alternatively, show "Exit Preview" on hover/focus.

---

## B. Visual Inconsistencies (2 issues)

### B1 & G1: Preview Pill Uses Different Design Language

**Problem**: The floating pill uses `glass` + `rounded-full` + white border, while toolbar uses solid `bg-builder-surface-hover` + `rounded-lg`.

**Fix**: By removing the floating pill (solution A1), this issue is resolved. The toolbar button becomes the only preview control, using consistent toolbar styling.

If stakeholders prefer to **keep the floating pill**, unify its styling with the toolbar:

```tsx
// Alternative: Keep pill but match toolbar styling
<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1 bg-[hsl(var(--builder-surface-hover))] border border-[hsl(var(--builder-border))] rounded-lg shadow-lg pointer-events-auto">
  <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--builder-success)/0.15)] rounded-md">
    <div className="w-2 h-2 rounded-full bg-[hsl(var(--builder-success))] animate-pulse" />
    <span className="text-xs font-medium text-[hsl(var(--builder-success))]">Previewing</span>
  </div>
  <button 
    onClick={...}
    className="px-3 py-1.5 text-xs font-medium text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--builder-accent))] focus-visible:ring-offset-1"
  >
    Exit Preview
  </button>
</div>
```

---

### B2: Slider Accent Blue Clashes with Toolbar Blue

**Problem**: Right panel sliders use a more saturated blue than toolbar controls.

**Fix**: Ensure sliders use the same `--builder-accent` token. Add to `flow-canvas/index.css`:

```css
/* Slider accent normalization */
.slider-root [data-orientation="horizontal"] > [role="slider"] {
  background: hsl(var(--builder-accent));
}

.slider-track-active {
  background: hsl(var(--builder-accent)) !important;
}
```

**Files to modify**:
- `src/flow-canvas/index.css` (~10 lines)

---

## C. Alignment & Grid Errors (2 issues)

### C1: Preview Banner Not Aligned with Toolbar

**Problem**: The floating pill sits at `top-4` (16px) while the toolbar is `h-14` (56px) with centered content.

**Fix**: If keeping the pill, align it to the toolbar's visual line:

```tsx
// Change from:
<div className="absolute top-4 left-1/2 ...">

// To: Anchor to toolbar height + small offset
<div className="absolute top-[60px] left-1/2 ...">
```

However, the **recommended solution (A1) removes the pill entirely**, eliminating alignment issues.

---

### C2: Center Collision Between Banner and Empty State

**Problem**: Both the preview banner and empty state are centered, creating visual competition.

**Fix**: Resolved by removing the floating pill (A1). The empty state becomes the clear focal point without banner collision.

If keeping the pill, position it at top-left of canvas area instead of center:

```tsx
// Alternative positioning
<div className="absolute top-[60px] left-4 z-50 ...">
```

---

## D. Hover/Interaction Inconsistencies (2 issues)

### D1 & D2: Exit Button Lacks Hover/Focus States

**Problem**: The Exit button in the floating pill has minimal hover feedback and no focus ring.

**Fix**: Add proper interactive states:

```css
/* flow-canvas/index.css */
.preview-exit-btn {
  @apply px-3 py-1.5 text-xs font-medium rounded-md transition-all;
  color: hsl(var(--builder-text-muted));
  background: transparent;
}

.preview-exit-btn:hover {
  color: hsl(var(--builder-text));
  background: hsl(var(--builder-surface-active));
}

.preview-exit-btn:focus-visible {
  outline: none;
  ring: 2px solid hsl(var(--builder-accent));
  ring-offset: 1px;
  ring-offset-color: hsl(var(--builder-surface));
}

.preview-exit-btn:active {
  transform: scale(0.98);
}
```

Apply class in component:
```tsx
<button className="preview-exit-btn" onClick={...}>
  Exit Preview
</button>
```

---

## E. Visual Clutter (Addressed in A1)

### E2: Empty State Appears Too Faint

**Problem**: Empty state message competes with preview banner and looks disabled.

**Fix**: Strengthen empty state styling when in preview mode. The preview banner removal (A1) helps, but also enhance empty state contrast:

```css
/* flow-canvas/index.css */
.canvas-empty-state {
  @apply text-center py-16;
}

.canvas-empty-state h3 {
  @apply text-lg font-semibold text-[hsl(var(--builder-text))];
}

.canvas-empty-state p {
  @apply mt-2 text-sm text-[hsl(var(--builder-text-secondary))];
}

/* In preview mode, mute the empty state since content should be focus */
.preview-mode .canvas-empty-state {
  @apply opacity-60;
}
```

---

## F. Wording/Labels (2 issues)

### F1: "Previewing" vs "Preview Mode" Inconsistent

**Problem**: Toolbar says "Previewing" while floating pill says "Preview Mode."

**Fix**: Standardize on **"Previewing"** as the active state label (shorter, implies active tense). The consolidated toolbar button (A1) uses only "Previewing."

---

## G. Premium Feel (Addressed in A1, B1)

### G2: Empty State Typography Too Light

**Problem**: Empty state uses low-contrast text that looks placeholder-like.

**Fix**: Update empty state styles (see E2 fix above) with proper text hierarchy.

---

## Implementation Summary

### Option A: Remove Floating Pill (Recommended)

This is the cleaner solution that eliminates duplicate state indicators.

**Changes**:
1. **EditorShell.tsx**: Remove lines 1858-1872 (floating pill)
2. **TopToolbar.tsx**: Enhance preview button with inline "Exit" action and success color when active
3. **flow-canvas/index.css**: Add focus-visible styles for preview button, empty state improvements

### Option B: Keep Floating Pill (If Required)

If the floating pill is a desired UX pattern:

**Changes**:
1. **EditorShell.tsx**: Restyle pill to match toolbar design language
2. **TopToolbar.tsx**: Make toolbar button appear "disabled" when preview is active (to avoid dual indicators)
3. **flow-canvas/index.css**: Add `.preview-banner` class with toolbar-consistent styling, proper focus/hover states

---

## Files Summary

| File | Changes | Lines |
|------|---------|-------|
| `src/flow-canvas/builder/components/EditorShell.tsx` | Remove floating pill OR restyle | ~15 lines |
| `src/flow-canvas/builder/components/TopToolbar.tsx` | Enhance preview button with exit action | ~20 lines |
| `src/flow-canvas/index.css` | Add preview button active styles, focus states | ~30 lines |

---

## CSS Additions (flow-canvas/index.css)

```css
/* ============================================ */
/* PREVIEW MODE STYLES - Single Source of Truth */
/* ============================================ */

/* Preview button active state - uses success color for clear "on" indication */
.toolbar-preview-active {
  @apply bg-[hsl(var(--builder-success)/0.15)] text-[hsl(var(--builder-success))] ring-1;
  ring-color: hsl(var(--builder-success) / 0.4);
}

.toolbar-preview-active:hover {
  @apply bg-[hsl(var(--builder-success)/0.2)];
}

/* Preview indicator dot */
.preview-indicator-dot {
  @apply w-2 h-2 rounded-full bg-[hsl(var(--builder-success))] animate-pulse;
}

/* Exit text within preview button */
.preview-exit-text {
  @apply text-[hsl(var(--builder-text-muted))];
}

.toolbar-preview-active:hover .preview-exit-text {
  @apply text-[hsl(var(--builder-success))];
}

/* Focus states for all preview controls */
.preview-control:focus-visible {
  @apply outline-none ring-2;
  ring-color: hsl(var(--builder-accent));
  ring-offset: 2px;
  ring-offset-color: hsl(var(--builder-surface));
}

/* Empty state improvements */
.canvas-empty-state-title {
  @apply text-lg font-semibold text-[hsl(var(--builder-text))];
}

.canvas-empty-state-description {
  @apply mt-2 text-sm text-[hsl(var(--builder-text-secondary))];
}
```

---

## Testing Checklist

**State Clarity**
- [ ] Preview mode has ONE visible indicator (toolbar button)
- [ ] Button clearly shows "Previewing" with pulsing dot when active
- [ ] Exit action is visible and accessible within the button
- [ ] Clicking "Exit" exits preview mode

**Visual Consistency**
- [ ] Preview button uses success green when active (not competing blue)
- [ ] No floating pill competing with toolbar
- [ ] All accent colors use `--builder-accent` token

**Interactions**
- [ ] Preview button has focus-visible ring
- [ ] Exit text has hover state
- [ ] Keyboard navigation works (Tab → Space/Enter to exit)

**Empty State**
- [ ] Empty state is clearly visible
- [ ] No banner competing for center attention
- [ ] Typography is readable, not washed out

