

# Funnel Builder Full Refactor - Perspective Consistency Audit

## Executive Summary

The funnel builder has accumulated significant architectural debt across multiple areas: inconsistent design tokens, duplicated components, fragmented type definitions, and visual/behavioral inconsistencies. This refactor consolidates everything into a unified "Perspective-style" experience that is predictable, understandable, and consistent.

---

## Part 1: Architecture Inconsistencies Found

### 1.1 Dual Builder Systems (Critical)

Two parallel builder systems exist with overlapping responsibilities:

| Directory | Purpose | Issues |
|-----------|---------|--------|
| `src/flow-canvas/builder/` | Primary funnel builder | 2183-line EditorShell, 5521-line CanvasRenderer |
| `src/builder_v2/` | "V2" builder components | Separate EditorShell, templates, state management |

**Problems:**
- Templates defined in `builder_v2/templates/sectionTemplates.ts` but consumed by `flow-canvas/builder`
- CSS tokens split between `EditorLayout.css` and inline styles
- Duplicate `EditorShell.tsx` files with different implementations

### 1.2 Design Token Fragmentation

Three separate token systems in use:

```text
1. EditorLayout.css:       --builder-* (HSL values)
2. EditorLayout.css:       --coaching-* (Premium palette)
3. Inline Tailwind:        hsl(var(--builder-*)) and direct colors
```

**Example of inconsistency:**
- `TopToolbar.tsx` uses `text-builder-accent` (Tailwind utility)
- `PerspectiveSectionPicker.tsx` uses `hsl(var(--coaching-accent))` (CSS var)
- `RightPanel.tsx` uses `text-[hsl(var(--builder-text-muted))]` (arbitrary value)

### 1.3 Component Duplication

| Component | Locations | Issue |
|-----------|-----------|-------|
| Color utilities | `CanvasUtilities.ts`, `FlowCanvasRenderer.tsx`, `templateThemeUtils.ts` | `shiftHue`, `getContrastTextColor` duplicated |
| Button component | `FlowButton.tsx` (deprecated), `UnifiedButton.tsx`, `RuntimeButton.tsx` | 3 button implementations |
| Section picker | `BlockPickerPanel.tsx`, `PerspectiveSectionPicker.tsx`, `InlineSectionPicker.tsx` | 3 picker implementations |
| Form contexts | `CanvasRenderer.tsx`, `CanvasUtilities.ts` | `FormStateContext`, `ThemeContext` defined twice |

### 1.4 Console Errors Found

```text
Warning: Function components cannot be given refs. 
Check the render method of `HighTicketPreviewCard`.
```

**Cause:** `CTAPreview` and other preview components don't use `forwardRef`.

### 1.5 Type Fragmentation

`StepIntent` defined in 5 files with different values:

| File | Values |
|------|--------|
| `infostack.ts` | `'capture' | 'qualify' | 'schedule' | 'convert' | 'complete'` |
| `builder_v2/types.ts` | `'optin' | 'content' | 'checkout' | 'thank_you'` |
| `lib/funnel/types.ts` | `'capture' | 'collect' | 'schedule' | 'complete'` |
| `useUnifiedLeadSubmit.ts` | 6 variants including `'navigate'`, `'info'` |
| `FlowCanvasRenderer.tsx` | Local `StepIntentType` |

### 1.6 Deprecated Code Still Present

| File | Deprecated Item |
|------|----------------|
| `infostack.ts` | `capture-flow-embed` BlockType |
| `BlockPickerPanel.tsx` | Legacy block templates |
| `FlowButton.tsx` | Entire file (re-exports only) |
| `leadCaptureBlocks.ts` | Deprecated utility file |
| `CanvasRenderer.tsx` | Legacy array gradient format handling |

### 1.7 Inspector Inconsistencies

- `RightPanel.tsx`: 5732 lines - monolithic, hard to maintain
- Loader element: Missing inspector section (only recently added)
- Animation section: Uses "legacy element.animation structure"
- Slide/logo editing: Uses React state but previously used global window variables

---

## Part 2: Refactor Plan

### Phase 1: Design Token Consolidation

**Create unified token system in `EditorLayout.css`:**

```css
:root {
  /* === PRIMARY BUILDER TOKENS === */
  --builder-bg: 225 12% 10%;
  --builder-surface: 225 12% 14%;
  --builder-surface-hover: 225 10% 18%;
  --builder-surface-active: 225 8% 22%;
  --builder-border: 225 8% 20%;
  --builder-border-subtle: 225 8% 16%;
  
  --builder-text: 210 20% 96%;
  --builder-text-secondary: 215 16% 65%;
  --builder-text-muted: 215 12% 50%;
  --builder-text-dim: 215 8% 40%;
  
  --builder-accent: 217 91% 60%;
  --builder-accent-hover: 217 91% 55%;
  --builder-accent-secondary: 280 80% 60%;
  --builder-accent-tertiary: 160 70% 50%;
  
  --builder-error: 0 84% 60%;
  --builder-success: 142 71% 45%;
  --builder-warning: 45 90% 55%;
  
  /* === PREMIUM COACHING TOKENS (Aliased) === */
  --coaching-dark: var(--builder-bg);
  --coaching-surface: var(--builder-surface);
  --coaching-border: var(--builder-border);
  --coaching-accent: var(--builder-accent);
  --coaching-text: var(--builder-text);
  --coaching-muted: var(--builder-text-muted);
  --coaching-gold: 45 90% 55%;
  --coaching-emerald: 160 70% 45%;
}
```

**Files to update:**
- All `hsl(var(--coaching-*))` → `hsl(var(--builder-*))`
- All arbitrary Tailwind values → Tailwind utility classes

### Phase 2: Component Consolidation

#### 2.1 Create Unified Section Picker

Merge `BlockPickerPanel.tsx`, `PerspectiveSectionPicker.tsx`, and `InlineSectionPicker.tsx` into one:

```text
src/flow-canvas/builder/components/
├── SectionPicker/
│   ├── index.tsx           # Main export
│   ├── SectionPicker.tsx   # Two-panel Perspective-style layout
│   ├── CategorySidebar.tsx # Left panel with category navigation
│   ├── TemplateGallery.tsx # Right panel with preview cards
│   ├── PreviewCard.tsx     # Single preview card component
│   └── previews/           # Category-specific preview renderers
│       ├── HeroPreview.tsx
│       ├── CTAPreview.tsx
│       ├── MediaPreview.tsx
│       └── ...
```

#### 2.2 Consolidate Button Components

Keep only `UnifiedButton.tsx` as the single source:

```text
┌─────────────────────────────────────────────────────────┐
│ DELETE: FlowButton.tsx (deprecation wrapper)            │
│ KEEP:   UnifiedButton.tsx (canonical implementation)    │
│ UPDATE: RuntimeButton.tsx (import from UnifiedButton)   │
└─────────────────────────────────────────────────────────┘
```

#### 2.3 Consolidate Utility Functions

Create single source in `CanvasUtilities.ts`:

| Function | Current Locations | Canonical Location |
|----------|-------------------|-------------------|
| `shiftHue` | 3 files | `CanvasUtilities.ts` |
| `getContrastTextColor` | 2 files | `ContrastEngine.ts` |
| `gradientToCSS` | 2 files | `GradientPickerPopover.tsx` |
| `effectClasses` | 2 files | `CanvasUtilities.ts` |
| `getPageBackgroundStyles` | 2 files | `CanvasUtilities.ts` |

### Phase 3: Type System Cleanup

#### 3.1 Establish Single StepIntent Source

```typescript
// src/flow-canvas/types/infostack.ts (canonical)
export type StepIntent = 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete';

// Other files: Re-export or import from infostack.ts
```

#### 3.2 Remove Deprecated Types

```typescript
// DELETE from infostack.ts
| 'capture-flow-embed' // Remove from BlockType union

// DELETE file
src/flow-canvas/builder/utils/leadCaptureBlocks.ts
```

### Phase 4: Inspector Modularization

Split `RightPanel.tsx` (5732 lines) into focused modules:

```text
src/flow-canvas/builder/components/inspectors/
├── RightPanel.tsx              # Shell (~300 lines)
├── SiteInfoSection.tsx         # Domain/publish info
├── PageSettingsSection.tsx     # Step/page settings
├── FrameSettingsSection.tsx    # Section/frame settings
├── BlockInspector.tsx          # Block type inspector
├── ElementInspector/           
│   ├── index.tsx               # Element inspector shell
│   ├── TextElementSection.tsx
│   ├── ButtonElementSection.tsx
│   ├── ImageElementSection.tsx
│   ├── VideoElementSection.tsx
│   ├── InputElementSection.tsx
│   ├── LoaderElementSection.tsx
│   └── CountdownElementSection.tsx
└── shared/
    ├── FieldGroup.tsx          # Already exists
    ├── CollapsibleSection.tsx  # Extract from RightPanel
    └── ColorPickerField.tsx    # Common color picker wrapper
```

### Phase 5: Fix Console Errors

#### 5.1 Add forwardRef to Preview Components

```typescript
// HighTicketPreviewCard.tsx - Fix CTAPreview and other preview components
const CTAPreview = React.forwardRef<HTMLDivElement, { hasText?: boolean }>(
  ({ hasText }, ref) => (
    <div ref={ref} className="w-full h-full bg-gradient-to-r ...">
      {/* ... */}
    </div>
  )
);
CTAPreview.displayName = 'CTAPreview';
```

### Phase 6: Visual Consistency Fixes

#### 6.1 Standardize Selection States

```css
/* Single selection style system */
.builder-selection-ring {
  @apply ring-2 ring-[hsl(var(--builder-accent))] ring-offset-2 ring-offset-[hsl(var(--builder-bg))];
}

.builder-selection-ring-dashed {
  @apply ring-2 ring-dashed ring-[hsl(var(--builder-accent))] ring-offset-4;
}
```

#### 6.2 Standardize Hover States

```css
/* Consistent hover treatment */
.builder-hover-lift {
  @apply transition-transform duration-150 hover:scale-[1.02];
}

.builder-hover-glow {
  @apply transition-shadow duration-200 hover:shadow-lg hover:shadow-[hsl(var(--builder-accent)/0.15)];
}
```

#### 6.3 Standardize Empty States

```tsx
// Create unified EmptyState component
function BuilderEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--builder-surface))] 
                      flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[hsl(var(--builder-text-muted))]" />
      </div>
      <h3 className="text-sm font-medium text-[hsl(var(--builder-text))]">{title}</h3>
      <p className="text-xs text-[hsl(var(--builder-text-muted))] mt-1">{description}</p>
      {action}
    </div>
  );
}
```

---

## Part 3: Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `EditorLayout.css` | Modify | Consolidate all tokens, add Tailwind utilities |
| `PerspectiveSectionPicker.tsx` | Modify | Use builder tokens, fix forwardRef issues |
| `HighTicketPreviewCard.tsx` | Modify | Add forwardRef to all preview components |
| `RightPanel.tsx` | Split | Extract into 10+ focused modules |
| `FlowButton.tsx` | Delete | Remove deprecated file |
| `BlockPickerPanel.tsx` | Deprecate | Route to unified SectionPicker |
| `InlineSectionPicker.tsx` | Modify | Simplify to wrapper only |
| `CanvasRenderer.tsx` | Modify | Import utilities from CanvasUtilities |
| `FlowCanvasRenderer.tsx` | Modify | Import utilities from CanvasUtilities |
| `infostack.ts` | Modify | Remove deprecated types |
| `builder_v2/types.ts` | Modify | Re-export StepIntent from infostack.ts |
| `lib/funnel/types.ts` | Modify | Re-export StepIntent from infostack.ts |

---

## Part 4: Implementation Order

```text
┌─────────────────────────────────────────────────────────────────┐
│ Week 1: Foundation                                              │
├─────────────────────────────────────────────────────────────────┤
│ • Phase 1: Token consolidation in EditorLayout.css              │
│ • Phase 3: Type system cleanup (StepIntent unification)         │
│ • Phase 5: Fix forwardRef console errors                        │
├─────────────────────────────────────────────────────────────────┤
│ Week 2: Component Consolidation                                 │
├─────────────────────────────────────────────────────────────────┤
│ • Phase 2.1: Unified SectionPicker (Perspective-style)          │
│ • Phase 2.2: Button component consolidation                     │
│ • Phase 2.3: Utility function consolidation                     │
├─────────────────────────────────────────────────────────────────┤
│ Week 3: Inspector Refactor                                      │
├─────────────────────────────────────────────────────────────────┤
│ • Phase 4: RightPanel modularization                            │
│ • Phase 6: Visual consistency standardization                   │
├─────────────────────────────────────────────────────────────────┤
│ Week 4: Cleanup & Polish                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Delete deprecated files                                       │
│ • Remove dead code paths                                        │
│ • Documentation and comments                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Success Criteria

After this refactor:

1. **Single Token System**: All UI uses `--builder-*` tokens consistently
2. **No Duplicate Components**: One button, one picker, one set of utilities
3. **Clean Types**: StepIntent defined in exactly one place
4. **Modular Inspector**: RightPanel split into <500 line modules
5. **Zero Console Errors**: No forwardRef warnings
6. **Perspective Feel**: Premium dark aesthetic with coaching-focused previews
7. **Predictable Behavior**: Every control works consistently across the app

---

## Technical Appendix: Key Code Patterns

### Pattern A: Token Usage

```tsx
// CORRECT - Use Tailwind utilities
<div className="bg-builder-surface text-builder-text border-builder-border" />

// AVOID - Arbitrary values
<div className="bg-[hsl(var(--builder-surface))]" />
```

### Pattern B: Component Exports

```tsx
// CORRECT - Named exports with clear purpose
export { SectionPicker } from './SectionPicker';
export type { SectionPickerProps } from './SectionPicker';

// AVOID - Default exports with ambiguous names
export default function Picker() {}
```

### Pattern C: Type Re-exports

```tsx
// In builder_v2/types.ts
export type { StepIntent } from '@/flow-canvas/types/infostack';

// NOT duplicating the type definition
```

