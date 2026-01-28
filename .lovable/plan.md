

# Phase 3: Create Inspector Components (Enhanced)

## Philosophy: Complex Under the Hood, Simple to Use

Taking from what works in **v2 EnhancedInspector** and **flow-canvas** inspectors:
- **Complex capabilities** (gradients, animations, spring physics, responsive controls)
- **Simple editing feel** like Perspective (clean tabs, minimal visible options, smart defaults)

The key insight from your existing builders: **power is hidden until needed** - collapsible sections, smart defaults, and progressive disclosure.

---

## What We're Porting (Complete Feature List)

### From EnhancedInspector (v2)
| Component | Lines | Key Features |
|-----------|-------|--------------|
| `ColorPicker` with solid/gradient tabs | ~90 | Preset grid, native picker, gradient toggle |
| `InspectorSection` collapsible | ~30 | Chevron animation, icon + title |
| `TextField` inline | ~25 | Text/textarea with label |
| `SliderField` with value display | ~20 | Min/max/unit, live value badge |
| `SelectField` styled | ~20 | Dark theme select |
| `ButtonGroup` toggle | ~20 | Icon/label options |
| `SwitchField` inline | ~15 | Row layout with toggle |
| `OptionsEditor` for choices | ~60 | Emoji, image URL, add/remove |
| Element-to-tab auto-switching | ~25 | Smart tab selection based on element |

### From flow-canvas UniversalAppearanceSection
| Component | Lines | Key Features |
|-----------|-------|--------------|
| Size & Dimensions section | ~130 | Width/height presets + custom, max/min |
| Position controls | ~45 | Position mode, offset inputs |
| Layout & Spacing | ~95 | Align self, gap, padding grid, margin sliders |
| Layout Mode (flex/grid) | ~80 | Display toggle, direction, wrap, justify, align |

### From AnimationPresetSection
| Component | Lines | Key Features |
|-----------|-------|--------------|
| Animation preset dropdown | ~50 | Grouped by entrance/attention |
| Trigger selection | ~20 | Load/scroll/hover |
| Duration/delay sliders | ~40 | Range 100-2000ms |
| Easing dropdown | ~25 | Including spring option |
| Spring physics presets | ~60 | Gentle/Default/Snappy/Bouncy/Stiff |
| Advanced spring controls | ~50 | Stiffness/damping/mass sliders |
| Replay button | ~10 | Preview animation |

### From GradientPickerPopover
| Component | Lines | Key Features |
|-----------|-------|--------------|
| GradientEditor standalone | ~180 | Type/angle, color stops, presets |
| GradientPickerPopover wrapper | ~90 | Popover with manual dismiss |
| Gradient utilities | ~40 | gradientToCSS, cloneGradient, defaultGradient |

### From inspector/controls/
| Component | Lines | Key Features |
|-----------|-------|--------------|
| ColorControl with popover | ~140 | Outside-dismiss logic, sync |
| SpacingControl 4-way | ~110 | Linked padding/margin visual |
| FontControl | ~80 | Family, size, weight |
| ShadowControl | ~60 | Preset + custom shadow layers |
| AlignmentControl | ~40 | Horizontal + vertical icon buttons |

---

## File Structure (v3 Inspector)

```text
src/funnel-builder-v3/components/inspector/
├── index.ts                      # Public exports
│
├── layout/
│   ├── CollapsibleSection.tsx    # Expandable property group
│   └── FieldGroup.tsx            # Label + control + hint wrapper
│
├── controls/
│   ├── TextField.tsx             # Text/textarea input
│   ├── SelectField.tsx           # Styled dropdown
│   ├── SliderField.tsx           # Range with value display
│   ├── SwitchField.tsx           # Toggle with label
│   ├── ButtonGroup.tsx           # Segmented button toggle
│   ├── SpacingControl.tsx        # 4-way padding/margin
│   └── AlignmentControl.tsx      # Align icons (H + V)
│
├── color/
│   ├── ColorPresetGrid.tsx       # 8-column swatch grid
│   ├── ColorPickerPopover.tsx    # Full picker with popover
│   ├── GradientEditor.tsx        # Standalone gradient editor
│   └── GradientPickerPopover.tsx # Popover wrapper
│
├── animation/
│   └── AnimationPicker.tsx       # Effect + trigger + timing + spring
│
├── specialized/
│   ├── OptionsEditor.tsx         # Choice options with emoji/image
│   ├── TypographySection.tsx     # Font family/size/weight/color
│   └── SizeSection.tsx           # Width/height/max/min presets
│
└── hooks/
    └── useInspectorAutoTab.ts    # Smart tab switching based on selection
```

**Total: ~1,400 lines across 17 files**

---

## Component Specifications

### 1. Layout Components

#### CollapsibleSection.tsx (~70 lines)
Port from `EnhancedInspector.InspectorSection` + flow-canvas styling:

```typescript
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;              // e.g., "Fade In" for active animation
  accentColor?: string;        // Optional gradient accent (like animation section)
}
```

Features:
- Animated chevron rotation (180deg)
- Icon + title + optional badge layout
- Hover state: `bg-[hsl(var(--builder-v3-surface-hover))]`
- Border bottom: `border-[hsl(var(--builder-v3-border))]`
- Content padding: `px-4 pb-4 pt-0`
- Support for accent gradient strip (like animation section)

#### FieldGroup.tsx (~35 lines)
Port from flow-canvas `FieldGroup`:

```typescript
interface FieldGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  horizontal?: boolean;  // Label left, control right
}
```

Features:
- 11px label (font-medium, `text-builder-v3-text-secondary`)
- 9px hint text (`text-builder-v3-text-dim`)
- Vertical (default) or horizontal layout
- `space-y-1.5` gap

---

### 2. Form Controls

#### TextField.tsx (~40 lines)
```typescript
interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}
```

Uses `.builder-v3-input` and `.builder-v3-textarea` from CSS.

#### SelectField.tsx (~50 lines)
Styled select with dark theme:

```typescript
interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  grouped?: Record<string, Array<{ value: string; label: string }>>;  // For animation categories
}
```

#### SliderField.tsx (~55 lines)
Port from EnhancedInspector with value badge:

```typescript
interface SliderFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;  // "px", "ms", "%", "°"
}
```

Features:
- Label left, value badge right (e.g., `500ms`)
- Value badge: `bg-builder-v3-surface-hover px-2 py-0.5 rounded text-xs font-mono`
- Slider uses accent color for thumb

#### ButtonGroup.tsx (~45 lines)
```typescript
interface ButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label?: string; icon?: React.ReactNode }>;
}
```

Features:
- Segmented control appearance
- Active state with accent background
- Icon-only or icon + label

#### SwitchField.tsx (~30 lines)
```typescript
interface SwitchFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}
```

Horizontal layout: label left, switch right.

#### SpacingControl.tsx (~110 lines)
Port from v2 with dark theme:

Features:
- Visual 3x3 grid layout
- Link/unlink toggle in center
- Top/right/bottom/left inputs
- Dark theme styling

#### AlignmentControl.tsx (~50 lines)
```typescript
interface AlignmentControlProps {
  value: { horizontal: 'left' | 'center' | 'right'; vertical?: 'top' | 'center' | 'bottom' };
  onChange: (value: ...) => void;
  label: string;
  showVertical?: boolean;
}
```

Icon buttons: AlignLeft, AlignCenter, AlignRight (+ vertical variants).

---

### 3. Color Components

#### ColorPresetGrid.tsx (~90 lines)
Standalone swatch grid using Phase 1 presets:

```typescript
interface ColorPresetGridProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];  // Override defaults
  columns?: number;    // Default 8
  showTransparent?: boolean;
  showCategories?: boolean;  // Show "Neutrals", "Brand", etc.
}
```

Features:
- 8-column grid (matches v2)
- Active state: `ring-2 ring-[hsl(var(--builder-v3-accent))]`
- Hover: `scale-110` transition
- Transparent swatch with checkerboard pattern
- Optional category headers

#### ColorPickerPopover.tsx (~180 lines)
Port from v2 ColorControl + EnhancedInspector ColorPicker:

```typescript
interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  children?: React.ReactNode;  // Custom trigger
  showGradients?: boolean;
  onSwitchToGradient?: () => void;
}
```

Features:
- Trigger button with swatch preview
- Popover with ColorPresetGrid
- Solid/Gradient tabs (when showGradients=true)
- Native color input + HEX text input
- Recent colors (localStorage)
- Manual outside-dismiss logic (prevent slider close issues)

#### GradientEditor.tsx (~200 lines)
Port from flow-canvas GradientPickerPopover:

```typescript
interface GradientEditorProps {
  value: GradientValue;
  onChange: (gradient: GradientValue) => void;
  compact?: boolean;
}
```

Features:
- "Aa" text preview with gradient
- Type toggle: Linear/Radial
- Angle slider (0-360°) for linear
- Color stops list:
  - Color picker per stop
  - Position slider (0-100%)
  - Add stop (max 5)
  - Remove stop (min 2)
- Preset grid (9 gradients)
- Pure functions: `gradientToCSS`, `cloneGradient`

#### GradientPickerPopover.tsx (~90 lines)
Popover wrapper for GradientEditor:

```typescript
interface GradientPickerPopoverProps {
  value: GradientValue | null;
  onChange: (gradient: GradientValue) => void;
  children: React.ReactNode;
}
```

Features:
- Header with gradient icon
- GradientEditor embedded
- Manual outside-dismiss (like ColorPickerPopover)

---

### 4. Animation Components

#### AnimationPicker.tsx (~250 lines)
Port from flow-canvas AnimationPresetSection:

```typescript
interface AnimationPickerProps {
  value: AnimationSettings | undefined;
  onChange: (settings: AnimationSettings | undefined) => void;
  onReplay?: () => void;
}
```

Features:
- Effect dropdown (grouped):
  - Entrance: None, Fade In, Slide Up/Down/Left/Right, Scale In, Blur In, Rotate In
  - Attention: Bounce, Pulse, Shake, Wiggle
- Trigger dropdown: On Page Load, On Scroll, On Hover
- Duration slider (100-2000ms)
- Delay slider (0-2000ms)
- Easing dropdown: Ease Out, Ease In, Ease In-Out, Spring, Linear
- Spring physics (when easing=spring):
  - Preset buttons: Gentle, Default, Snappy, Bouncy, Stiff
  - Advanced toggle → Stiffness/Damping/Mass sliders
- Replay button
- Remove animation button
- Accent gradient strip on section

---

### 5. Specialized Components

#### OptionsEditor.tsx (~80 lines)
Port from EnhancedInspector:

```typescript
interface OptionsEditorProps {
  options: Array<{ id: string; label: string; emoji?: string; image?: string }>;
  onChange: (options: ...) => void;
}
```

Features:
- Sortable list (drag handle)
- Emoji input
- Label input
- Image URL input (for card-style choices)
- Add/remove buttons

#### TypographySection.tsx (~120 lines)
Combines font controls into one section:

```typescript
interface TypographySectionProps {
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  onChange: (updates: Partial<...>) => void;
}
```

Features:
- Font family dropdown (using Phase 1 masterFontFamilies)
- Font size dropdown (predefined sizes)
- Font weight dropdown
- Text color picker (inline swatch)
- Alignment button group

#### SizeSection.tsx (~130 lines)
Port from UniversalAppearanceSection:

```typescript
interface SizeSectionProps {
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  onChange: (key: string, value: string) => void;
}
```

Features:
- Width: Auto/Full/75%/50%/Fit/Custom presets
- Height: Auto/Full/Fit/Custom presets
- Custom value input when selected
- Max width input
- Min height input

---

### 6. Hooks

#### useInspectorAutoTab.ts (~40 lines)
Port element-to-tab mapping from EnhancedInspector:

```typescript
function useInspectorAutoTab(
  selectedBlockType: string | null,
  setActiveTab: (tab: string) => void
)
```

Automatically switches to:
- `content` tab for text/heading elements
- `style` tab for buttons/inputs
- `add` tab when nothing selected

---

## CSS Integration

All components use the CSS classes from Phase 2:

```css
/* Form controls */
.builder-v3-input         /* Text inputs */
.builder-v3-textarea      /* Multiline inputs */
.builder-v3-select        /* Select dropdowns */

/* Toggle controls */
.builder-v3-toggle-pill   /* Segmented control container */
.builder-v3-toggle-option /* Segmented control option */

/* Inspector structure */
.builder-v3-inspector-section  /* Section container */
.builder-v3-inspector-header   /* Section header */
.builder-v3-inspector-content  /* Section content */

/* Animations */
.builder-v3-animate-*     /* Animation classes for preview */
```

---

## Index Exports

```typescript
// src/funnel-builder-v3/components/inspector/index.ts

// Layout
export { CollapsibleSection } from './layout/CollapsibleSection';
export { FieldGroup } from './layout/FieldGroup';

// Controls
export { TextField } from './controls/TextField';
export { SelectField } from './controls/SelectField';
export { SliderField } from './controls/SliderField';
export { SwitchField } from './controls/SwitchField';
export { ButtonGroup } from './controls/ButtonGroup';
export { SpacingControl } from './controls/SpacingControl';
export { AlignmentControl } from './controls/AlignmentControl';

// Color
export { ColorPresetGrid } from './color/ColorPresetGrid';
export { ColorPickerPopover } from './color/ColorPickerPopover';
export { GradientEditor, gradientToCSS, cloneGradient, defaultGradient } from './color/GradientEditor';
export { GradientPickerPopover } from './color/GradientPickerPopover';

// Animation
export { AnimationPicker } from './animation/AnimationPicker';

// Specialized
export { OptionsEditor } from './specialized/OptionsEditor';
export { TypographySection } from './specialized/TypographySection';
export { SizeSection } from './specialized/SizeSection';

// Hooks
export { useInspectorAutoTab } from './hooks/useInspectorAutoTab';
```

---

## Files Summary

| Directory | Files | Est. Lines |
|-----------|-------|------------|
| `inspector/layout/` | 2 | ~105 |
| `inspector/controls/` | 7 | ~380 |
| `inspector/color/` | 4 | ~560 |
| `inspector/animation/` | 1 | ~250 |
| `inspector/specialized/` | 3 | ~330 |
| `inspector/hooks/` | 1 | ~40 |
| `inspector/index.ts` | 1 | ~35 |
| **Total** | **19 files** | **~1,700 lines** |

---

## Implementation Order

1. **Layout components** (CollapsibleSection, FieldGroup) - foundation for all sections
2. **Basic controls** (TextField, SelectField, SliderField, SwitchField, ButtonGroup) - building blocks
3. **Color components** (ColorPresetGrid → ColorPickerPopover → GradientEditor → GradientPickerPopover)
4. **Alignment & Spacing** (AlignmentControl, SpacingControl)
5. **Animation** (AnimationPicker) - most complex, depends on SliderField
6. **Specialized** (OptionsEditor, TypographySection, SizeSection)
7. **Hook** (useInspectorAutoTab)
8. **Index exports**

---

## Success Criteria

1. All 19 inspector component files created
2. CollapsibleSection animates smoothly with chevron rotation
3. ColorPickerPopover handles outside-dismiss correctly (no slider close bugs)
4. GradientEditor creates valid CSS gradients
5. AnimationPicker shows spring physics controls when easing=spring
6. All components use Phase 2 CSS design tokens
7. TypeScript compiles without errors
8. Components are ready for RightPanel integration (Phase 7)

