
# Funnel Builder UI/UX Audit Fix Plan

## Executive Summary

This plan addresses **20 identified issues** across 8 categories from the static audit. The core problems fall into three groups:

1. **Trust Failures**: Inspector controls that don't work (Hide, Animation, Hover, Autoplay, CTA actions)
2. **Visual Inconsistencies**: Theme clashes between inspector and dark builder shell
3. **CSS Conflicts**: Duplicate/conflicting rules causing unpredictable visuals

---

## A. Critical UI Trust Failures (5 issues)

### A1: "Hide Element" Toggle Does Nothing

**Problem**: The inspector exposes `nodeProps.hidden` but no renderer reads it.

**Location**: 
- Inspector: `EnhancedInspector.tsx:1016-1022` (sets `hidden` prop)
- Renderers: `renderNode.tsx:48-53` and `renderRuntimeTree.tsx:51-56` (ignore `hidden`)

**Fix**: Add visibility check in both renderers:

```typescript
// renderNode.tsx - Add after line 50
const props = {
  ...definition.defaultProps,
  ...node.props,
};

// Skip rendering if hidden (but show ghost in editor for discoverability)
const isHidden = props.hidden === true;
if (isHidden && readonly) {
  return <></>;  // Don't render in preview/runtime
}

// For editor mode, render with visual indicator
const hiddenClass = isHidden && !readonly ? ' builder-v2-node--hidden' : '';
```

Add CSS for hidden state:
```css
.builder-v2-node--hidden {
  opacity: 0.35;
  border: 1px dashed rgba(148, 163, 184, 0.3);
}
.builder-v2-node--hidden::after {
  content: "Hidden";
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
}
```

**Files to modify**:
- `src/builder_v2/canvas/renderNode.tsx` (~15 lines)
- `src/builder_v2/runtime/renderRuntimeTree.tsx` (~10 lines)
- `src/builder_v2/canvas/canvas.css` (~15 lines)

---

### A2: Animation & Hover Effect Controls Are Non-Functional

**Problem**: Inspector sets `nodeProps.animation` and `nodeProps.hoverEffect` but no CSS or component consumes them.

**Location**:
- Inspector: `EnhancedInspector.tsx:79-95` (defines presets)
- Inspector: `EnhancedInspector.tsx:920-933` (UI controls)
- Renderers: No consumption anywhere

**Fix Options**:

**Option A - Wire the controls (Recommended)**: Add CSS classes based on animation/hover values.

```typescript
// In renderNode.tsx - build class string
const animationClass = props.animation && props.animation !== 'none' 
  ? ` builder-v2-anim--${props.animation}` 
  : '';
const hoverClass = props.hoverEffect && props.hoverEffect !== 'none'
  ? ` builder-v2-hover--${props.hoverEffect}`
  : '';
```

Add corresponding CSS:
```css
/* Enter animations */
.builder-v2-anim--fadeIn { animation: fadeIn 0.4s ease-out; }
.builder-v2-anim--slideUp { animation: slideUp 0.4s ease-out; }
.builder-v2-anim--slideDown { animation: slideDown 0.4s ease-out; }
.builder-v2-anim--scale { animation: scaleIn 0.3s ease-out; }
.builder-v2-anim--bounce { animation: bounce 0.5s ease-out; }

/* Hover effects */
.builder-v2-hover--lift:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.builder-v2-hover--glow:hover { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
.builder-v2-hover--scale:hover { transform: scale(1.02); }
.builder-v2-hover--brighten:hover { filter: brightness(1.08); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes bounce { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
```

**Option B - Remove the UI**: If animations are out of scope, remove the controls to avoid misleading users.

**Files to modify**:
- `src/builder_v2/canvas/renderNode.tsx` (~8 lines)
- `src/builder_v2/runtime/renderRuntimeTree.tsx` (~8 lines)
- `src/builder_v2/canvas/canvas.css` (~40 lines)

---

### A3: Video "Autoplay" Toggle Is a Lie

**Problem**: Inspector exposes `autoplay` but `VideoStep.tsx` never uses it when building the iframe URL.

**Location**:
- Inspector: `EnhancedInspector.tsx:759-763` (UI control)
- VideoStep: `VideoStep.tsx:7-21` (URL builder ignores autoplay)

**Fix**: Update `getVideoEmbedUrl` to accept autoplay parameter:

```typescript
function getVideoEmbedUrl(url?: string, autoplay = false): string | null {
  if (!url) return null;
  
  const autoplayParam = autoplay ? '1' : '0';
  
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=${autoplayParam}&mute=1`;
  
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplayParam}&muted=1`;
  
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=${autoplayParam}`;
  
  // Existing embed URLs - append autoplay if not present
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}autoplay=${autoplayParam}`;
  }
  
  return null;
}
```

Update component to pass autoplay:
```typescript
const embedUrl = getVideoEmbedUrl(content.video_url, content.autoplay ?? false);
```

**Note**: Browsers require videos to be muted for autoplay, hence `mute=1` parameter.

**Files to modify**:
- `src/builder_v2/components/steps/VideoStep.tsx` (~20 lines)

---

### A4: "On Click" Actions for Step CTA Buttons Don't Execute

**Problem**: Step components (WelcomeStep, VideoStep, OptInStep) render `UnifiedButton` with no `onClick` handler.

**Location**:
- WelcomeStep: `WelcomeStep.tsx:45-54` (no onClick)
- VideoStep: `VideoStep.tsx:77-88` (no onClick)
- ButtonActionSection: `EnhancedInspector.tsx:445-494` (sets buttonAction prop)

**Fix**: Add onClick handler to step CTA buttons that reads `buttonAction` from content/design:

```typescript
// In WelcomeStep.tsx, VideoStep.tsx, etc.
const handleButtonClick = () => {
  const action = content.buttonAction || (d as any).buttonAction;
  if (!action) return;
  
  switch (action.type) {
    case 'next-step':
    case 'continue':
      // Emit flow intent - handled by parent
      window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'next-step' } }));
      break;
    case 'go-to-step':
      window.dispatchEvent(new CustomEvent('flow-intent', { detail: { type: 'go-to-step', stepId: action.stepId } }));
      break;
    case 'url':
    case 'redirect':
      if (action.url) {
        if (action.openNewTab) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = action.url;
        }
      }
      break;
    // ... other action types
  }
};

// Update UnifiedButton
<UnifiedButton
  onClick={handleButtonClick}
  // ... existing props
>
```

**Better approach**: Create a shared `useButtonAction` hook that all step components use.

**Files to modify**:
- Create `src/builder_v2/hooks/useButtonAction.ts` (~50 lines)
- `src/builder_v2/components/steps/WelcomeStep.tsx` (~10 lines)
- `src/builder_v2/components/steps/VideoStep.tsx` (~10 lines)
- `src/builder_v2/components/steps/OptInStep.tsx` (~10 lines)
- `src/builder_v2/components/steps/ThankYouStep.tsx` (~10 lines)

---

## B. Visual Inconsistencies (5 issues)

### B1: Inspector Theme Clashes with Dark Builder Shell

**Problem**: `enhanced-inspector.css` uses bright white theme (`background: #ffffff`) while the builder shell is dark.

**Location**: `enhanced-inspector.css:9` and throughout

**Fix**: Update enhanced-inspector.css to use dark theme tokens:

```css
.ei-inspector {
  background: var(--builder-panel-bg);
  color: var(--builder-text-primary);
}

.ei-header {
  border-bottom: 1px solid var(--builder-panel-border);
}

.ei-title {
  color: var(--builder-text-primary);
}

.ei-tabs {
  background: var(--builder-hover-bg);
}

.ei-tab {
  color: var(--builder-text-secondary);
}

.ei-tab--active {
  background: var(--builder-active-bg);
  color: var(--builder-text-primary);
}

.ei-text-input, .ei-textarea, .ei-select {
  background: var(--builder-hover-bg);
  border: 1px solid var(--builder-panel-border);
  color: var(--builder-text-primary);
}

.ei-color-popover {
  background: var(--builder-panel-bg);
  border: 1px solid var(--builder-panel-border);
}
```

**Files to modify**:
- `src/builder_v2/inspector/enhanced-inspector.css` (~100 lines of token replacements)

---

### B2: Multiple Accent Colors Compete

**Problem**: Selection uses blue (#3b82f6), indigo (#6366f1), and cyan (#38bdf8) in different places.

**Location**:
- `EditorLayout.css:1091-1097` (cyan for element wrapper)
- `canvas.css:235-239` (indigo for node selection)
- Various other places

**Fix**: Standardize on a single selection color token:

```css
:root {
  --builder-selection-primary: hsl(217 91% 60%); /* Blue */
  --builder-selection-hover: hsl(217 91% 60% / 0.5);
  --builder-selection-ring: hsl(217 91% 60% / 0.3);
}
```

Replace all hardcoded selection colors with these tokens.

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~20 replacements)
- `src/builder_v2/canvas/canvas.css` (~15 replacements)

---

### B3: CTA Gradients Conflict Between Files

**Problem**: 
- `visual-parity.css:138-142` defines blue gradient
- `canvas.css:337` defines purple gradient

**Fix**: Consolidate to single source of truth using CSS variable:

```css
:root {
  --builder-cta-gradient: linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark, 217 91% 45%)) 100%);
}

/* In both files, use: */
background: var(--builder-cta-gradient);
```

**Files to modify**:
- `src/builder_v2/styles/visual-parity.css` (~5 lines)
- `src/builder_v2/canvas/canvas.css` (~5 lines)

---

### B4: Duplicate Empty-State Styles Conflict

**Problem**: `.builder-v2-empty-page-state` defined in both `EditorLayout.css` and `canvas.css` with different values.

**Location**:
- `canvas.css:1294-1330`
- `EditorLayout.css` (similar classes)

**Fix**: Keep definitions only in `canvas.css` (the authoritative canvas styles) and remove duplicates from `EditorLayout.css`.

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (remove duplicate ~20 lines)

---

### B5: StepPalette Has No CSS

**Problem**: `StepPalette.tsx` uses classes like `.step-palette`, `.step-palette-grid`, `.step-palette-item` that have no styles anywhere.

**Fix**: Add styles to `EditorLayout.css`:

```css
/* Step Palette - Add Step Panel */
.step-palette {
  padding: 12px;
}

.step-palette--compact {
  padding: 8px;
}

.step-palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  margin-bottom: 8px;
}

.step-palette-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--builder-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.step-palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.step-palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--builder-hover-bg);
  border: 1px solid var(--builder-panel-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease;
}

.step-palette-item:hover {
  background: var(--builder-active-bg);
  border-color: var(--builder-accent);
}

.step-palette-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.step-palette-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--builder-text-primary);
  text-align: center;
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~50 lines)

---

## C. Alignment & Grid Errors (3 issues)

### C1: Structure Tree Indentation Variable Mismatch

**Problem**: Component sets `--builder-v2-structure-depth` but CSS reads `var(--depth)`.

**Location**:
- `StructureTree.tsx:78-79` (sets `--builder-v2-structure-depth`)
- CSS likely uses wrong variable name

**Fix**: Update CSS to use correct variable:

```css
.builder-v2-structure-row {
  padding-left: calc(12px + (var(--builder-v2-structure-depth, 0) * 16px));
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` or structure tree CSS (~3 lines)

---

### C2: Device Frame Width Calculations Can Collapse

**Problem**: `min(375px, calc(100vw - 560px))` yields negative values on small viewports.

**Fix**: Add minimum floor:

```css
.device-frame--phone {
  width: max(280px, min(375px, calc(100vw - 560px)));
}

.device-frame--tablet {
  width: max(320px, min(768px, calc(100vw - 560px)));
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~4 lines)

---

### C3: Selection Outline Geometry Shifts

**Problem**: 
- `EditorLayout.css` uses `inset: -1px; border: 2px`
- `canvas.css` uses `inset: 0; border: 1px`

**Fix**: Standardize on one approach:

```css
/* Single source of truth */
.builder-v2-node-overlay {
  inset: -1px;
  border: 2px solid transparent;
  border-radius: inherit;
}
```

Remove conflicting rules from the other file.

**Files to modify**:
- `src/builder_v2/canvas/canvas.css` (~5 lines)

---

## D. Hover/Interaction Inconsistencies (2 issues)

### D1: Hidden Affordances with No Focus State

**Problem**: Page context menu and drag handle only appear on hover, no keyboard focus.

**Fix**: Add focus-visible states:

```css
.builder-page-item:focus-visible .page-context-trigger,
.builder-page-item:focus-visible .builder-page-drag-handle {
  opacity: 1;
}

.page-context-trigger:focus-visible {
  opacity: 1;
  outline: 2px solid var(--builder-accent);
  outline-offset: 2px;
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~10 lines)

---

### D2: Structure Tree Controls Are Unstyled

**Problem**: `.builder-v2-structure-chip` buttons are never styled.

**Fix**: Add styles:

```css
.builder-v2-structure-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--builder-hover-bg);
  border: 1px solid var(--builder-panel-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--builder-text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.builder-v2-structure-chip:hover:not(:disabled) {
  background: var(--builder-active-bg);
  color: var(--builder-text-primary);
}

.builder-v2-structure-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.builder-v2-structure-chip--add {
  color: var(--builder-accent);
}

.builder-v2-structure-chip--danger {
  color: hsl(0 72% 51%);
}

.builder-v2-structure-chip--danger:hover {
  background: hsl(0 72% 51% / 0.15);
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~30 lines)

---

## E. Visual Clutter (2 issues)

### E1: Add Step Palette Overloads Left Panel

**Fix**: Add dismiss button and optional grouping:

```tsx
// In StepPalette.tsx
<div className="step-palette-header">
  <span className="step-palette-title">Add Step</span>
  <button 
    className="step-palette-dismiss"
    onClick={onDismiss}
    aria-label="Close"
  >
    ×
  </button>
</div>
```

Add prop: `onDismiss?: () => void`

**Files to modify**:
- `src/builder_v2/structure/StepPalette.tsx` (~10 lines)
- `src/builder_v2/EditorLayout.css` (~5 lines)

---

### E2: Page List Row Density

**Fix**: Simplify by hiding index when not hovered:

```css
.builder-page-index {
  opacity: 0;
  transition: opacity 150ms ease;
}

.builder-page-item:hover .builder-page-index,
.builder-page-item--active .builder-page-index {
  opacity: 1;
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~8 lines)

---

## F. Wording/Label Fixes (2 issues)

### F1: Rename "Blocks" Tab

**Fix**: Rename to "Layout" in EnhancedInspector.tsx:

```tsx
<button
  type="button"
  className={cn("ei-tab", activeTab === 'blocks' && "ei-tab--active")}
  onClick={() => setActiveTab('blocks')}
>
  <LayoutGrid size={14} /> Layout
</button>
```

**Files to modify**:
- `src/builder_v2/inspector/EnhancedInspector.tsx` (~1 line)

---

### F2: Clarify "Layout Personality" Copy

**Fix**: Update description text:

```typescript
const PERSONALITY_OPTIONS = [
  { value: 'clean', label: 'Clean', description: 'Minimal spacing, subtle emphasis' },
  { value: 'bold', label: 'Bold', description: 'Stronger hover effects' },
  { value: 'editorial', label: 'Editorial', description: 'Reading-focused interactions' },
  { value: 'dense', label: 'Dense', description: 'Compact, efficient feedback' },
  { value: 'conversion', label: 'Conversion', description: 'Prominent CTA effects' },
];
```

**Files to modify**:
- `src/builder_v2/inspector/EnhancedInspector.tsx` (~5 lines)

---

## G. Premium-Feel Issues (2 issues)

### G1: Hardcoded StepPalette Colors

**Problem**: Each step type has custom hex colors that ignore theme.

**Fix**: Use theme-derived colors or a consistent palette:

```typescript
const STEP_TYPE_CONFIG = [
  { type: 'welcome', icon: Play, color: 'hsl(var(--primary))' },
  { type: 'text_question', icon: MessageSquare, color: 'hsl(var(--primary) / 0.9)' },
  // ... use theme variables
];
```

**Files to modify**:
- `src/builder_v2/structure/StepPalette.tsx` (~10 lines)

---

### G2: Typography Drift

**Problem**: `visual-parity.css:227-233` forces system fonts while EditorLayout uses DM Sans.

**Fix**: Align canvas typography to builder tokens:

```css
.builder-page {
  font-family: var(--font-sans, 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
}
```

**Files to modify**:
- `src/builder_v2/styles/visual-parity.css` (~2 lines)

---

## Implementation Priority

| Priority | Category | Issues | Effort |
|----------|----------|--------|--------|
| P0 | Trust Failures | A1-A4 | 3-4 hours |
| P1 | Visual Theme | B1, B2, B5 | 2-3 hours |
| P2 | CSS Conflicts | B3, B4, C3 | 1-2 hours |
| P3 | Interaction Polish | C1, C2, D1, D2 | 1-2 hours |
| P4 | Clutter/Labels | E1, E2, F1, F2 | 1 hour |
| P5 | Premium Feel | G1, G2 | 30 min |

---

## Files Summary

| File | Issues | Changes |
|------|--------|---------|
| `src/builder_v2/canvas/renderNode.tsx` | A1, A2 | ~25 lines |
| `src/builder_v2/runtime/renderRuntimeTree.tsx` | A1, A2 | ~20 lines |
| `src/builder_v2/components/steps/VideoStep.tsx` | A3 | ~20 lines |
| `src/builder_v2/hooks/useButtonAction.ts` | A4 | NEW (~50 lines) |
| `src/builder_v2/components/steps/*.tsx` | A4 | ~10 lines each |
| `src/builder_v2/inspector/enhanced-inspector.css` | B1 | ~100 lines |
| `src/builder_v2/inspector/EnhancedInspector.tsx` | F1, F2 | ~10 lines |
| `src/builder_v2/EditorLayout.css` | B4, B5, C1-C3, D1, D2, E2 | ~120 lines |
| `src/builder_v2/canvas/canvas.css` | A1, A2, B2, B3, C3 | ~60 lines |
| `src/builder_v2/styles/visual-parity.css` | B3, G2 | ~10 lines |
| `src/builder_v2/structure/StepPalette.tsx` | E1, G1 | ~15 lines |

---

## Testing Checklist

**Trust Controls**
- [ ] Toggle "Hide Element" → element shows ghost in editor, hidden in preview
- [ ] Select "Fade In" animation → element animates on load
- [ ] Select "Lift" hover → element lifts on hover
- [ ] Toggle Video "Autoplay" → video autoplays when visible
- [ ] Set button action to URL → button navigates on click

**Visual Consistency**
- [ ] Inspector matches dark theme (no white panels)
- [ ] Selection outlines use consistent blue color
- [ ] CTA buttons use same gradient everywhere
- [ ] StepPalette is styled and usable

**Interactions**
- [ ] Structure tree chips are styled and clickable
- [ ] Keyboard navigation shows focus states
- [ ] Device frames don't collapse on narrow screens
