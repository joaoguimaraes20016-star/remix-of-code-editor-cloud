
# Builder V2 UI Polish: Dark Theme Consistency & Visual Refinements

## Executive Summary

This plan addresses **22 micro UI bugs** across 6 categories identified in the builder audit. The core issue is that `EditorLayout.css` contains **hardcoded light-mode hex values** (`#f1f5f9`, `#ffffff`, `#334155`) within a dark-themed builder, creating visual "light islands" that break theme cohesion.

The fixes are organized into 3 tiers by impact and effort.

---

## Issue Categories Overview

| Category | Issues | Impact | Files |
|----------|--------|--------|-------|
| A. Micro UI Bugs | 7 | High - Visual breaks | EditorLayout.css, primitives.css |
| B. Visual Inconsistencies | 4 | Medium - Brand mismatch | EditorLayout.css, types.ts |
| C. Interaction Polish | 3 | Low - Animation jitter | EditorLayout.css |
| D. Responsive Glitches | 3 | Medium - Layout breaks | EditorLayout.css |
| E. Premium Feel | 2 | Medium - "Cheap" appearance | EditorLayout.css |

---

## Tier 1: Critical Dark Theme Alignment (10 fixes)

### A1-A3: Panel Tabs, Device Selector, Canvas Toolbar

**Problem**: These components use light-mode colors on dark panels:

```css
/* Current - WRONG */
.builder-panel-tabs { background: #f1f5f9; }  /* Light gray on dark panel */
.builder-tab--active { background: #ffffff; color: #0f172a; }
.builder-device-selector { background: #f1f5f9; }
.builder-device-btn--active { background: #ffffff; }
.builder-canvas-toolbar { background: #ffffff; }
```

**Fix**: Replace with dark builder tokens:

```css
/* Updated - Correct */
.builder-panel-tabs { 
  background: var(--builder-hover-bg); /* #1f2024 */
}

.builder-tab {
  color: var(--builder-text-secondary);
}

.builder-tab:hover {
  color: var(--builder-text-primary);
}

.builder-tab--active {
  background: var(--builder-active-bg); /* #252629 */
  color: var(--builder-text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.builder-device-selector {
  background: var(--builder-hover-bg);
}

.builder-device-btn {
  color: var(--builder-text-muted);
}

.builder-device-btn--active {
  background: var(--builder-active-bg);
  color: var(--builder-text-primary);
}

.builder-canvas-toolbar {
  background: var(--builder-panel-bg);
  border-bottom: 1px solid var(--builder-panel-border);
}

.builder-nav-btn {
  border: 1px solid var(--builder-panel-border);
  color: var(--builder-text-muted);
}

.builder-nav-btn:hover:not(:disabled) {
  background: var(--builder-hover-bg);
  color: var(--builder-text-primary);
}

.builder-canvas-title {
  color: var(--builder-text-primary);
}
```

**Lines to modify**: 700-730, 745-790, 791-821

---

### A2: Page List Low-Contrast Styling

**Problem**: Page list uses light hover/active backgrounds and dark text:

```css
/* Current - WRONG */
.builder-page-item:hover { background: #f1f5f9; }
.builder-page-item--active { background: #eef2ff; }
.builder-page-name { color: #334155; }
.builder-page-index { background: #e2e8f0; color: #64748b; }
```

**Fix**:

```css
.builder-page-item:hover {
  background: var(--builder-hover-bg);
}

.builder-page-item--active {
  background: rgba(59, 130, 246, 0.12);
}

.builder-page-name {
  color: var(--builder-text-primary);
}

.builder-page-index {
  background: var(--builder-active-bg);
  color: var(--builder-text-secondary);
}

.builder-page-item--active .builder-page-index {
  background: var(--builder-accent);
  color: #ffffff;
}
```

**Lines to modify**: 905-978

---

### A4: Content Card Missing Background

**Problem**: `.builder-content-card` has no background but expects light text:

```css
/* Current - Missing background */
.builder-content-card {
  display: flex;
  /* No background! */
}
```

**Fix in primitives.css**:

```css
.builder-content-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 0;
  text-align: center;
  overflow: hidden;
  /* Add proper light background for card content */
  background: #ffffff;
  border-radius: 16px;
}
```

**File**: `src/builder_v2/components/primitives/primitives.css`, lines 489-497

---

### A6: Selection Overlay Radius Mismatch

**Problem**: Overlay uses hardcoded 8px radius while step cards use 24px:

```css
/* Current */
.builder-v2-node-overlay { border-radius: 8px; }  /* Too small! */
.element-wrapper-overlay { border-radius: 8px; }

/* Step cards use 24px */
.step-card { border-radius: 24px; }
```

**Fix**: Use `inherit` or larger value:

```css
.builder-v2-node-overlay {
  border-radius: inherit;
}

.element-wrapper-overlay {
  border-radius: inherit;
}
```

**Lines to modify**: 246-254, 1066-1074

---

### A7 + E2: Theme Popovers to Dark

**Problem**: Action menus and text toolbars are bright white:

```css
/* Current - WRONG */
.element-action-menu {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.text-edit-toolbar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}
```

**Fix**:

```css
.element-action-menu {
  background: var(--builder-panel-bg);
  border: 1px solid var(--builder-panel-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.element-action-btn {
  color: var(--builder-text-secondary);
}

.element-action-btn:hover:not(:disabled) {
  background: var(--builder-hover-bg);
  color: var(--builder-text-primary);
}

.text-edit-toolbar {
  background: var(--builder-panel-bg);
  border: 1px solid var(--builder-panel-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.text-edit-btn {
  color: var(--builder-text-secondary);
}

.text-edit-btn:hover {
  background: var(--builder-hover-bg);
  color: var(--builder-text-primary);
}

.text-edit-dropdown-menu {
  background: var(--builder-panel-bg);
  border: 1px solid var(--builder-panel-border);
}

.text-edit-dropdown-item {
  color: var(--builder-text-primary);
}

.text-edit-dropdown-item:hover {
  background: var(--builder-hover-bg);
}
```

**Lines to modify**: 1124-1170, 1192-1297

---

## Tier 2: Visual Consistency & Brand Alignment (6 fixes)

### B1: Replace Hardcoded Builder Tokens

**Problem**: Builder tokens in `:root` use hex values, ignoring global HSL tokens:

```css
/* Current - Hardcoded */
:root {
  --builder-bg: #17181c;
  --builder-accent: #3b82f6;
}
```

**Fix**: Reference global HSL variables (from index.css):

```css
:root {
  /* Map to global tokens using HSL */
  --builder-bg: hsl(var(--builder-bg, 220 13% 8%));
  --builder-panel-bg: hsl(var(--builder-surface, 220 13% 10%));
  --builder-accent: hsl(var(--primary, 217 91% 60%));
  --builder-text-primary: hsl(var(--builder-text, 210 20% 96%));
  --builder-text-secondary: hsl(var(--builder-text-secondary, 210 15% 80%));
  --builder-text-muted: hsl(var(--builder-text-muted, 215 12% 62%));
  --builder-hover-bg: hsl(var(--builder-surface-hover, 220 13% 14%));
  --builder-active-bg: hsl(var(--builder-surface-active, 220 13% 18%));
  --builder-panel-border: hsl(var(--builder-border, 220 13% 16%));
}
```

**Lines to modify**: 8-35

---

### B2: Default Step Design to Theme Tokens

**Problem**: DEFAULT_DESIGN uses hardcoded colors:

```typescript
// Current - Hardcoded
export const DEFAULT_DESIGN: StepDesign = {
  backgroundColor: '#0f0f0f',
  buttonColor: '#6366f1',
};
```

**Fix**: Use CSS variable references:

```typescript
export const DEFAULT_DESIGN: StepDesign = {
  backgroundColor: 'hsl(var(--builder-bg))',
  textColor: 'hsl(var(--builder-text))',
  buttonColor: 'hsl(var(--primary))',
  buttonTextColor: 'hsl(var(--primary-foreground))',
  fontSize: 'medium',
  borderRadius: 12,
};
```

**File**: `src/builder_v2/components/steps/types.ts`, lines 51-58

---

### B3: CTA Gradient to Theme Tokens

**Problem**: Primary CTA uses hardcoded purple gradient:

```css
/* Current */
.builder-cta-button--primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}
```

**Fix**:

```css
.builder-cta-button--primary {
  background: var(--gradient-button, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%));
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.35);
}

.builder-cta-button--primary:hover {
  box-shadow: 0 6px 20px hsl(var(--primary) / 0.45);
}
```

**File**: `src/builder_v2/components/primitives/primitives.css`, lines 114-123

---

### B4: Unify Font Family

**Problem**: Builder uses `'Inter'` while app uses system fonts.

**Fix**: Remove the Google Fonts import and align to global font token:

```css
/* Remove line 1: @import url('https://fonts.googleapis.com/css2?family=Inter...'); */

.builder-shell {
  font-family: var(--font-sans, 'DM Sans', 'Inter', system-ui, sans-serif);
}
```

**Lines to modify**: 1, 574-580

---

### A5: Normalize Mixed Image Option Layout

**Problem**: When `hasImages` is true but some options lack images, they render inconsistently:

```tsx
// Current - Only applies card class if BOTH hasImages AND option.image
className={cn(
  "step-option",
  hasImages && option.image && "step-option--card"  // Problem: non-image items stay as list
)}
```

**Fix**: When `hasImages`, all options should use card layout (with placeholder if no image):

```tsx
// Fixed - All options get card layout when any has image
className={cn(
  "step-option",
  hasImages && "step-option--card"  // All cards when ANY has image
)}

// And add placeholder image handling:
{hasImages && (
  <div 
    className="step-option-image"
    style={{
      backgroundImage: option.image ? `url(${option.image})` : 'none',
      backgroundColor: option.image ? undefined : 'rgba(255,255,255,0.06)',
      borderRadius: `${d.borderRadius}px ${d.borderRadius}px 0 0`,
    }}
  >
    {!option.image && option.emoji && (
      <span className="step-option-placeholder-emoji">{option.emoji}</span>
    )}
  </div>
)}
```

**File**: `src/builder_v2/components/steps/MultiChoiceStep.tsx`, lines 56-95

Also add CSS for the emoji placeholder:

```css
.step-option-placeholder-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 32px;
}
```

**File**: `src/builder_v2/canvas/canvas-experience.css`, after line 307

---

## Tier 3: Animation & Responsive Polish (6 fixes)

### C1: Panel Collapse Double Transition

**Problem**: Both `grid-template-columns` and `width/opacity` animate, causing jitter:

```css
/* Current - Double animation */
.builder-shell {
  transition: grid-template-columns 250ms...;
}
.builder-panel {
  transition: width 200ms ease, opacity 200ms ease;
}
```

**Fix**: Remove panel width/opacity transition, rely only on grid:

```css
.builder-panel {
  transition: none; /* Grid handles the transition */
}

.builder-panel--collapsed {
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}
```

**Lines to modify**: 596-610

---

### C2: Collision-Aware Toolbar Positioning

**Problem**: Hover toolbars clip at canvas edges.

**Fix**: Add CSS that flips toolbar to bottom when near top:

```css
.builder-v2-hover-toolbar {
  /* Existing styles */
}

/* Flip to bottom when near top edge */
.builder-v2-node--near-top > .builder-v2-hover-toolbar {
  top: auto;
  bottom: -32px;
}
```

This requires a small JS check in the component to add `--near-top` class when element is close to viewport top.

---

### C3: Drag Handle Visibility During Drag

**Problem**: Handle fades out when dragging:

**Fix**:

```css
.builder-page-item-wrapper--dragging .builder-page-drag-handle {
  opacity: 1 !important;
}
```

**Lines to modify**: After line 936

---

### D1-D2: Responsive Device Frames

**Problem**: Fixed widths overflow on narrow viewports.

**Fix**:

```css
.device-frame--phone {
  width: min(375px, calc(100vw - 560px)); /* 560 = left + right panels + padding */
}

.device-frame--tablet {
  width: min(768px, calc(100vw - 560px));
}

.device-frame--phone .device-screen,
.device-frame--tablet .device-screen,
.device-frame--desktop .device-screen {
  max-height: calc(100vh - 200px);
}
```

**Lines to modify**: 42-82, 105-126, 146-206

---

### D3: Responsive Panel Behavior

**Problem**: Panels don't adapt on narrow viewports.

**Fix**: Add breakpoint for overlay mode:

```css
@media (max-width: 1024px) {
  .builder-shell {
    grid-template-columns: 0 1fr 0; /* Panels collapsed by default */
  }
  
  .builder-panel--left,
  .builder-panel--right {
    position: fixed;
    top: 0;
    height: 100vh;
    z-index: 50;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  }
  
  .builder-panel--left {
    left: 0;
    width: 280px;
    transform: translateX(-100%);
  }
  
  .builder-panel--right {
    right: 0;
    width: 320px;
    transform: translateX(100%);
  }
  
  .builder-panel--left.builder-panel--visible,
  .builder-panel--right.builder-panel--visible {
    transform: translateX(0);
  }
}
```

**Lines to modify**: Add after line 624

---

### E1: Soften Dashed Borders

**Problem**: Bright dashed borders feel like dev UI:

```css
/* Current */
.builder-add-step-btn {
  border: 1px dashed #cbd5e1;
}
```

**Fix**:

```css
.builder-add-step-btn {
  border: 1px dashed rgba(148, 163, 184, 0.4);
}

.builder-add-step-btn:hover {
  border-color: var(--builder-accent);
  border-style: solid;
}

.step-card--empty {
  border: 2px dashed rgba(255, 255, 255, 0.08);
}
```

**Lines to modify**: 1017-1043, also canvas-experience.css lines 338-358

---

## Files Summary

| File | Changes | Priority |
|------|---------|----------|
| `src/builder_v2/EditorLayout.css` | ~200 lines | P0 |
| `src/builder_v2/components/primitives/primitives.css` | ~30 lines | P0 |
| `src/builder_v2/components/steps/types.ts` | ~8 lines | P1 |
| `src/builder_v2/components/steps/MultiChoiceStep.tsx` | ~20 lines | P1 |
| `src/builder_v2/canvas/canvas-experience.css` | ~25 lines | P1 |

---

## Implementation Order

1. **EditorLayout.css token replacement** (Tier 1, A1-A3, A6, A7, E2) - Biggest visual impact
2. **Panel tabs + device selector dark theme** (Tier 1)
3. **Page list styling fixes** (Tier 1, A2)
4. **Popover theming** (Tier 1, A7 + E2)
5. **Content card background** (Tier 1, A4)
6. **Selection overlay radius** (Tier 1, A6)
7. **DEFAULT_DESIGN tokens** (Tier 2, B2)
8. **CTA gradient tokens** (Tier 2, B3)
9. **Mixed option layout** (Tier 2, A5)
10. **Animation polish** (Tier 3, C1-C3)
11. **Responsive frames** (Tier 3, D1-D3)

---

## Testing Checklist

After implementation:

**Dark Theme Consistency**
- [ ] Panel tabs match dark panel background (no light chips)
- [ ] Device selector buttons are dark-themed
- [ ] Canvas toolbar is dark, not white
- [ ] Page list text is readable (light on dark)
- [ ] Popovers match dark theme

**Visual Quality**
- [ ] Selection outlines match component corner radius
- [ ] Content cards have visible background
- [ ] CTA buttons use brand gradient
- [ ] Dashed borders are subtle, not harsh

**Responsive**
- [ ] Device frames don't overflow on 1280px viewport
- [ ] Panels overlay on 1024px and below
- [ ] Device screen heights adapt to viewport

**Animation**
- [ ] Panel collapse is smooth (no jitter)
- [ ] Drag handles stay visible while dragging
- [ ] Hover toolbars don't clip at edges
