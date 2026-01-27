
# Builder V2 UI Polish: Phase 2 — Trust, Theme, and Terminology Fixes

## Executive Summary

This plan addresses **18 issues** across 8 categories from the UI/UX audit. The core problems fall into three groups:

1. **Trust Failures**: Preview mode misleads users; block insertion behavior contradicts labels
2. **Visual Inconsistencies**: Light-themed components (SectionPicker, TemplatePreviewCard) inside dark builder shell
3. **Polish Gaps**: Emoji empty states, inline styles, inconsistent terminology

---

## Issue Categories Overview

| Category | Issues | Impact | Primary Files |
|----------|--------|--------|---------------|
| A. Trust Failures | 2 | Critical | MultiDocEditorShell.tsx, SectionPicker.tsx |
| B. Visual Inconsistencies | 5 | High | SectionPicker.tsx, TemplatePreviewCard.tsx, primitives.css |
| C. Alignment & Grid | 2 | Medium | enhanced-inspector.css, MultiDocEditorShell.tsx |
| D. Hover/Interaction | 2 | Medium | SectionPicker.tsx, EditorLayout.css |
| E. Visual Clutter | 2 | Low | SectionPicker.tsx, MultiDocEditorShell.tsx |
| F. Wording/Labels | 3 | Medium | MultiDocEditorShell.tsx, SectionPicker.tsx |
| G. Premium Feel | 2 | High | PreviewCanvas.tsx, DraftPreviewCanvas.tsx, CanvasEditor.tsx |

---

## A. Critical UI Trust Failures

### A1: Preview Mode Renders Draft, Not Published Snapshot

**Problem**: `MultiDocEditorShell.tsx` routes `mode === 'preview'` to `DraftPreviewCanvas`, which renders the live draft. The label "Preview" and Phase 14 comments imply the published output, creating a trust breach.

**Location**: `src/builder_v2/MultiDocEditorShell.tsx:291-300`

**Current behavior**:
```tsx
{/* Phase 14 + Phase 2: Preview mode - now renders draft with runtime interactivity */}
<div className={isPreviewMode ? '' : 'builder-v2-hidden'}>
  <DraftPreviewCanvas 
    pages={pages} 
    activePageId={activePageId}
    ...
  />
</div>
```

**Fix Options**:

**Option A (Recommended) — Add Mode Clarity**: Rename "preview" mode to "test" in the UI while keeping draft behavior for testing, and add a separate "Published" view option:

```tsx
// Update mode toggle labels (line 151-162)
const modeLabels: Record<string, { label: string; icon?: LucideIcon }> = {
  structure: { label: 'Structure' },
  canvas: { label: 'Edit' },
  preview: { label: 'Test Draft' }, // Clarify this is the draft
};

// Add published preview link when published
{isPublished && (
  <button onClick={() => setMode('published')} style={...}>
    View Published
  </button>
)}
```

**Option B — Show Published by Default**: Change preview to show `PreviewCanvas` (published snapshot) with a "Test Draft" secondary option.

**Files to modify**:
- `src/builder_v2/MultiDocEditorShell.tsx` (~20 lines)
- `src/builder_v2/editorMode.ts` (add mode labels)

---

### A2: "Basic blocks" / "Interactive blocks" Create Sections, Not Blocks

**Problem**: `SectionPicker.tsx` labels grids as "blocks" but `handleAddBlock` wraps every selection in a new section node.

**Location**: `src/builder_v2/components/SectionPicker.tsx:291-306`

**Current**:
```tsx
const handleAddBlock = (block: { type: string; props: Record<string, unknown> }) => {
  const sectionNode: CanvasNode = {
    id: `section-${Date.now()}`,
    type: 'section',  // Always creates a section wrapper!
    props: { variant: 'content' },
    children: [{ ... }],
  };
  onAddSection(sectionNode);
};
```

**Fix Options**:

**Option A (Recommended) — Rename Labels**: Change "Basic blocks" → "Basic sections" and "Interactive blocks" → "Form sections" to match behavior:

```tsx
// Line 338
<span className="...">Basic sections</span>

// Line 372  
<span className="...">Form sections</span>
```

**Option B — Change Behavior**: Add a true block insertion mode that inserts into the selected section, not as a new section. This requires deeper architectural changes.

**Files to modify**:
- `src/builder_v2/components/SectionPicker.tsx` (~4 lines for label change)

---

## B. Visual Inconsistencies

### B3: SectionPicker Uses Light Theme, Clashing with Dark Builder

**Problem**: `SectionPicker.tsx` and `TemplatePreviewCard.tsx` hardcode light-mode Tailwind classes (`bg-white`, `text-slate-700`, `bg-slate-100`).

**Location**: 
- `SectionPicker.tsx:319` — `bg-white`
- `SectionPicker.tsx:255, 332` — `bg-slate-100`, `hover:bg-slate-50`
- `TemplatePreviewCard.tsx:19` — `bg-white`, `border-slate-200`

**Fix**: Replace with theme-aware builder tokens:

```tsx
// SectionPicker.tsx:319
<div className="h-full flex flex-col bg-[var(--builder-panel-bg)]">

// SectionPicker.tsx:255
className={cn(
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
  isExpanded ? "bg-[var(--builder-active-bg)]" : "hover:bg-[var(--builder-hover-bg)]"
)}

// Text colors
<span className="... text-[var(--builder-text-primary)]">{name}</span>
<span className="... text-[var(--builder-text-secondary)]">Basic sections</span>
```

**For TemplatePreviewCard.tsx**:
```tsx
// Line 19
className="group relative w-full rounded-lg border border-[var(--builder-panel-border)] bg-[var(--builder-hover-bg)] overflow-hidden transition-all hover:border-[var(--builder-accent)] hover:shadow-md"

// Line 35
<span className="text-[11px] font-medium text-[var(--builder-text-secondary)] truncate block">
```

**Files to modify**:
- `src/builder_v2/components/SectionPicker.tsx` (~40 token replacements)
- `src/builder_v2/components/TemplatePreviewCard.tsx` (~10 token replacements)

---

### B4: StepPalette Colors Are Hardcoded HSLs

**Problem**: Despite the comment "theme-aligned," `StepPalette.tsx` uses fixed HSL values that don't reference CSS variables.

**Current** (from previous fix):
```typescript
{ type: 'welcome', icon: Play, color: 'hsl(239 84% 67%)' },
```

**Fix**: Reference actual theme tokens:

```typescript
const STEP_TYPE_CONFIG = [
  { type: 'welcome', icon: Play, colorToken: '--primary' },
  { type: 'text_question', icon: MessageSquare, colorToken: '--primary' },
  { type: 'multi_choice', icon: List, colorToken: '--accent' },
  { type: 'email_capture', icon: Mail, colorToken: '--destructive' },
  // ...
];

// In render:
style={{ 
  backgroundColor: `hsl(var(${config.colorToken}) / 0.15)`, 
  color: `hsl(var(${config.colorToken}))` 
}}
```

**Alternative**: Keep distinct colors but use CSS variables defined in EditorLayout.css:
```css
:root {
  --step-color-welcome: 239 84% 67%;
  --step-color-question: 250 84% 67%;
  /* ... */
}
```

**Files to modify**:
- `src/builder_v2/structure/StepPalette.tsx` (~15 lines)
- `src/builder_v2/EditorLayout.css` (~12 lines for step color tokens)

---

### B5: Primitives Use Hard-Coded White/Purple

**Problem**: `primitives.css` uses raw hex/rgba values (`#ffffff`, `rgba(255, 255, 255, ...)`, `#6366f1`) instead of CSS variables.

**Key locations**:
- Line 74: `color: #ffffff;`
- Line 96: `color: rgba(255, 255, 255, 0.7);`
- Line 172-188: Input styles with hardcoded colors
- Line 437: `background: #6366f1;`

**Fix**: Replace with HSL tokens:

```css
.builder-heading {
  color: hsl(var(--builder-text, 0 0% 100%));
}

.builder-paragraph {
  color: hsl(var(--builder-text) / 0.7);
}

.builder-input:focus {
  border-color: hsl(var(--primary) / 0.5);
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15);
}

.builder-consent-checkbox:checked {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
```

**Files to modify**:
- `src/builder_v2/components/primitives/primitives.css` (~30 replacements)

---

### B6: Canvas Gradients/Selection Are Hardcoded Purple

**Problem**: `canvas.css` uses `#6366f1`, `#8b5cf6`, and fixed rgba rings.

**Note**: Some of these were addressed in the previous plan. Verify and complete remaining instances.

**Files to modify**:
- `src/builder_v2/canvas/canvas.css` (~10 remaining replacements)

---

### B7: Destructive Actions Use Raw Red

**Problem**: `enhanced-inspector.css` hardcodes `hsl(0 72% 51%)` for delete buttons.

**Fix**: Use destructive token:

```css
.ei-delete-btn {
  color: hsl(var(--destructive));
}

.ei-delete-btn:hover {
  background: hsl(var(--destructive) / 0.15);
}
```

**Files to modify**:
- `src/builder_v2/inspector/enhanced-inspector.css` (~5 lines)

---

## C. Alignment & Grid Errors

### C8: Border Radius Values Drift (2px–10px)

**Problem**: `enhanced-inspector.css` uses inconsistent border-radius values across adjacent controls.

**Fix**: Define radius tokens and apply consistently:

```css
:root {
  --builder-radius-sm: 4px;
  --builder-radius-md: 8px;
  --builder-radius-lg: 12px;
}

/* Apply consistently */
.ei-text-input,
.ei-select,
.ei-color-input {
  border-radius: var(--builder-radius-md);
}

.ei-tabs {
  border-radius: var(--builder-radius-lg);
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (add tokens)
- `src/builder_v2/inspector/enhanced-inspector.css` (~15 radius replacements)

---

### C9: Panel Buttons Use Inline Spacing

**Problem**: `MultiDocEditorShell.tsx` uses inline styles with values like `padding: '10px 12px'`, `borderRadius: 10` that don't match token system.

**Current** (lines 184-198):
```tsx
style={{
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
  // ...
}}
```

**Fix**: Move to CSS classes using builder tokens:

```css
/* EditorLayout.css */
.builder-v2-page-button {
  width: 100%;
  padding: var(--builder-spacing-sm) var(--builder-spacing-md);
  border-radius: var(--builder-radius-lg);
  background: var(--builder-hover-bg);
  border: 1px solid var(--builder-panel-border);
  color: var(--builder-text-primary);
  transition: all 150ms ease;
}

.builder-v2-page-button--active {
  background: hsl(var(--primary) / 0.2);
  border-color: hsl(var(--primary) / 0.7);
}
```

**Files to modify**:
- `src/builder_v2/MultiDocEditorShell.tsx` (remove inline styles, add classes)
- `src/builder_v2/EditorLayout.css` (~30 lines for new classes)

---

## D. Hover/Interaction Inconsistencies

### D10: Focus-Visible States Missing

**Problem**: Buttons in SectionPicker, TemplatePreviewCard, and inspector lack visible focus states.

**Fix**: Add focus-visible rules:

```css
/* EditorLayout.css or dedicated file */
.builder-v2-focus-ring:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* For buttons within section picker */
.section-picker-button:focus-visible {
  outline: 2px solid var(--builder-accent);
  outline-offset: 2px;
  background: var(--builder-active-bg);
}
```

Also add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to Tailwind button classes.

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~10 lines)
- `src/builder_v2/components/SectionPicker.tsx` (add focus classes)
- `src/builder_v2/components/TemplatePreviewCard.tsx` (add focus classes)

---

### D11: Mode Toggle Has No CSS

**Problem**: `.builder-v2-mode-toggle` buttons have no styles.

**Current** (MultiDocEditorShell.tsx:151-162):
```tsx
<div className="builder-v2-mode-toggle">
  {editorModes.map((nextMode) => (
    <button key={nextMode} aria-pressed={mode === nextMode} onClick={() => setMode(nextMode)}>
      {nextMode}  {/* Raw lowercase string */}
    </button>
  ))}
</div>
```

**Fix**: Add styles to EditorLayout.css:

```css
.builder-v2-mode-toggle {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--builder-hover-bg);
  border-radius: var(--builder-radius-lg);
  margin: 12px 0;
}

.builder-v2-mode-toggle button {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--builder-radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--builder-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  text-transform: capitalize;
}

.builder-v2-mode-toggle button:hover {
  color: var(--builder-text-primary);
}

.builder-v2-mode-toggle button[aria-pressed="true"] {
  background: var(--builder-active-bg);
  color: var(--builder-text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.builder-v2-mode-toggle button:focus-visible {
  outline: 2px solid var(--builder-accent);
  outline-offset: 1px;
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~25 lines)

---

## E. Visual Clutter

### E12: SectionPicker Dense List

**Fix**: Already addressed by category structure. Optionally add search or collapsible headers in future iteration.

---

### E13: Left Panel Lacks Hierarchy

**Problem**: Document switcher, mode toggle, pages list, and structure tree are stacked without visual separation.

**Fix**: Add section headers and spacing:

```css
.builder-v2-panel-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--builder-panel-border);
}

.builder-v2-panel-section:last-child {
  border-bottom: none;
}

.builder-v2-panel-section-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--builder-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px 8px;
}
```

**Files to modify**:
- `src/builder_v2/EditorLayout.css` (~15 lines)
- `src/builder_v2/MultiDocEditorShell.tsx` (wrap sections in divs with classes)

---

## F. Wording/Label Fixes

### F14: Mode Labels Are Raw Lowercase Strings

**Problem**: Mode toggle shows "structure", "canvas", "preview" instead of polished labels.

**Fix**: Create mode label map and use in UI:

```tsx
// editorMode.ts or MultiDocEditorShell.tsx
const modeDisplayLabels: Record<EditorMode, string> = {
  structure: 'Structure',
  canvas: 'Edit',
  preview: 'Test',
};

// In render:
<button ...>
  {modeDisplayLabels[nextMode]}
</button>
```

**Files to modify**:
- `src/builder_v2/MultiDocEditorShell.tsx` (~10 lines)

---

### F15: "Pages" vs "Steps" Terminology Inconsistent

**Problem**: Left panel says "Pages" while StepPalette says "Add Step."

**Fix**: Standardize on "Steps" for funnel context:

```tsx
// MultiDocEditorShell.tsx:174
<div style={styles.pageListHeader}>Steps</div>

// StepPalette.tsx - already uses "Add Step" ✓
```

**Files to modify**:
- `src/builder_v2/MultiDocEditorShell.tsx` (~2 lines)

---

### F16: Category Labels Mix Title/Sentence Case

**Problem**: SectionPicker has "Call to action" vs "Hero" vs "About us"

**Fix**: Normalize to Title Case:

```tsx
const sectionCategories = [
  { id: 'hero', name: 'Hero', ... },
  { id: 'cta', name: 'Call to Action', ... },  // Was "Call to action"
  { id: 'about', name: 'About Us', ... },       // Was "About us"
  // ...
];
```

**Files to modify**:
- `src/builder_v2/components/SectionPicker.tsx` (~5 lines)

---

## G. Premium-Feel Fixes

### G17: Emoji Empty States Feel Prototype-Like

**Problem**: Empty states use emoji icons (📄) in PreviewCanvas, DraftPreviewCanvas, CanvasEditor.

**Location**:
- `PreviewCanvas.tsx:41` — `📄`
- `DraftPreviewCanvas.tsx:74` — `📄`

**Fix**: Replace with Lucide icons:

```tsx
import { FileText, FileQuestion } from 'lucide-react';

function NothingPublishedState() {
  return (
    <div className="builder-v2-preview-empty">
      <div className="builder-v2-preview-empty-icon">
        <FileText size={48} className="text-[var(--builder-text-muted)]" />
      </div>
      <h3 className="builder-v2-preview-empty-title">Nothing published yet</h3>
      ...
    </div>
  );
}
```

Update CSS to style icon container:
```css
.builder-v2-preview-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: var(--builder-hover-bg);
  border-radius: 50%;
}
```

**Files to modify**:
- `src/builder_v2/canvas/PreviewCanvas.tsx` (~10 lines)
- `src/builder_v2/canvas/DraftPreviewCanvas.tsx` (~10 lines)
- `src/builder_v2/canvas/canvas.css` (~10 lines)

---

### G18: Inline Styles in MultiDocEditorShell

**Problem**: Page list buttons and header buttons use inline styles (lines 184-198, 358-377).

**Fix**: Move all inline styles to CSS classes (addressed in C9).

---

## Implementation Priority

| Priority | Issues | Impact | Effort |
|----------|--------|--------|--------|
| P0 | A1 (Preview truth) | Trust | 30 min |
| P0 | A2 (Block labels) | Trust | 10 min |
| P1 | B3 (SectionPicker theme) | Visual | 1 hour |
| P1 | G17 (Emoji icons) | Premium | 30 min |
| P2 | D11 (Mode toggle styles) | Interaction | 20 min |
| P2 | F14-F16 (Labels) | Polish | 20 min |
| P2 | C9 (Inline styles) | Maintainability | 45 min |
| P3 | B4-B7 (Token cleanup) | Consistency | 1 hour |
| P3 | C8, D10 (Focus/radius) | Accessibility | 30 min |

---

## Files Summary

| File | Issues | Changes |
|------|--------|---------|
| `src/builder_v2/MultiDocEditorShell.tsx` | A1, C9, E13, F14, F15, G18 | ~80 lines |
| `src/builder_v2/components/SectionPicker.tsx` | A2, B3, D10, F16 | ~50 lines |
| `src/builder_v2/components/TemplatePreviewCard.tsx` | B3, D10 | ~15 lines |
| `src/builder_v2/structure/StepPalette.tsx` | B4 | ~20 lines |
| `src/builder_v2/components/primitives/primitives.css` | B5 | ~30 lines |
| `src/builder_v2/canvas/canvas.css` | B6 | ~10 lines |
| `src/builder_v2/inspector/enhanced-inspector.css` | B7, C8 | ~25 lines |
| `src/builder_v2/EditorLayout.css` | C8, C9, D10, D11, E13 | ~80 lines |
| `src/builder_v2/canvas/PreviewCanvas.tsx` | G17 | ~15 lines |
| `src/builder_v2/canvas/DraftPreviewCanvas.tsx` | G17 | ~15 lines |

---

## Testing Checklist

**Trust Controls**
- [ ] Preview mode label says "Test Draft" (or shows published with clear distinction)
- [ ] "Basic sections" label matches behavior (creates section, not inline block)

**Visual Consistency**
- [ ] SectionPicker matches dark builder theme
- [ ] TemplatePreviewCard has dark background
- [ ] No light "islands" in the builder UI
- [ ] Mode toggle is styled and matches theme

**Interactions**
- [ ] All buttons have visible focus states (Tab navigation)
- [ ] Mode toggle buttons have hover/active feedback

**Labels**
- [ ] Mode labels are capitalized properly
- [ ] "Steps" terminology used consistently
- [ ] Category names use Title Case

**Premium Feel**
- [ ] Empty states use Lucide icons, not emojis
- [ ] No inline styles in MultiDocEditorShell
