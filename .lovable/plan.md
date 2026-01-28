
# Funnel Builder v3 - Merge First, Delete Last

## Strategy Overview

This plan takes a **safe, incremental approach**:
1. **Phases 1-11**: Merge all valuable capabilities from legacy builders into v3
2. **Phase 12**: Delete legacy code **only after everything is working**

This ensures no functionality is lost and allows testing at each step.

---

## What We're Keeping (Legacy → v3)

| Feature | Source | Target | Why It's Valuable |
|---------|--------|--------|-------------------|
| **48 Color Presets** | `flow-canvas/builder/utils/presets.ts` | `v3/shared/presets.ts` | Unified palette |
| **12 Gradient Presets** | `flow-canvas/builder/utils/presets.ts` | `v3/shared/presets.ts` | Professional gradients |
| **Gradient Editor** | `GradientValue` interface | `v3/shared/gradientHelpers.ts` | Multi-stop control |
| **14 Animation Presets** | `AnimationPresetSection.tsx` | `v3/shared/animationPresets.ts` | Entrance + attention |
| **Inline Text Editor** | `components/funnel-builder/InlineTextEditor.tsx` | `v3/components/InlineTextEditor.tsx` | Rich text on canvas |
| **Device Frames** | `EditorLayout.css` device frames | `v3/components/DeviceFrame.tsx` | Phone/tablet/desktop |
| **50+ Templates** | `builder_v2/templates/sectionTemplates.ts` | `v3/templates/` | High-converting sections |
| **Collapsible Sections** | Inspector components | `v3/components/inspector/` | Organized property panels |
| **Video URL Parsing** | `getVideoEmbedUrl()` | `v3/shared/videoHelpers.ts` | YouTube/Vimeo/Loom |
| **CSS Design Tokens** | `EditorLayout.css` variables | `v3/styles/builder.css` | Unified visual system |

---

## Phase 1: Create Shared Utilities (~600 lines)

### 1.1 Create Presets System
**File: `src/funnel-builder-v3/shared/presets.ts`**

Port from `flow-canvas/builder/utils/presets.ts`:
- `masterColorPresets` - 48 colors organized in 6 rows × 8 columns
- `inspectorColorPresets` - Categorized: neutrals, brand, warm, cool
- `masterGradientPresets` - 12 gradient presets with `GradientValue` interface
- `masterFontFamilies` - 15+ fonts with categories (display, standard, serif)
- `fontSizeOptions`, `fontWeightOptions`, `letterSpacingOptions`
- `textShadowPresets`, `blockShadowPresets`

### 1.2 Create Gradient Helpers
**File: `src/funnel-builder-v3/shared/gradientHelpers.ts`**

Port from `flow-canvas/builder/utils/gradientHelpers.ts`:
- `GradientValue` interface (type, angle, stops[])
- `gradientToCSS()` - Convert gradient object to CSS string
- `cssToGradientValue()` - Parse CSS gradient to object
- `cloneGradient()` - Deep clone for immutability
- `defaultGradientValue` - Default purple-to-pink gradient

### 1.3 Create Animation Presets
**File: `src/funnel-builder-v3/shared/animationPresets.ts`**

Port from `AnimationPresetSection.tsx`:
- 14 animation presets (entrance + attention categories)
- `AnimationSettings` interface with effect, trigger, duration, delay
- Spring physics presets (Gentle, Default, Snappy, Bouncy, Stiff)
- Easing options (ease-out, ease-in, spring, linear)
- Trigger options (load, scroll, hover)

### 1.4 Create Video Helpers
**File: `src/funnel-builder-v3/shared/videoHelpers.ts`**

- `getVideoEmbedUrl(url)` - Parse and return embed URL
- `getVideoProvider(url)` - Detect: youtube, vimeo, loom, wistia, direct

---

## Phase 2: Create CSS Design System (~400 lines)

**File: `src/funnel-builder-v3/styles/builder.css`**

Port from `EditorLayout.css`:

**Design Tokens:**
- Builder colors: `--builder-bg`, `--builder-surface`, `--builder-accent`, `--builder-text`, `--builder-border`
- Semantic colors: `--builder-success`, `--builder-warning`, `--builder-error`
- Radius: `--builder-radius-sm` (6px), `--builder-radius-md` (10px), `--builder-radius-lg` (16px)
- Transitions: `--builder-transition` (200ms cubic-bezier)

**Device Frame Styles:**
- `.device-frame--phone` - Dynamic island, rounded corners (52px), home indicator
- `.device-frame--tablet` - Rounded corners (28px), home bar
- `.device-frame--desktop` - Browser bar with traffic lights

**Node Selection States:**
- `.builder-v3-node-overlay` - Selection ring styles
- Hover state: semi-transparent blue border
- Selected state: solid blue border

**Animation Keyframes:**
- `@keyframes builder-fade-in`
- `@keyframes builder-slide-up`
- `@keyframes builder-scale-in`
- `@keyframes builder-bounce`
- `@keyframes builder-pulse`

---

## Phase 3: Create Inspector Components (~400 lines)

### 3.1 Collapsible Section
**File: `src/funnel-builder-v3/components/inspector/CollapsibleSection.tsx`**

Features:
- Animated chevron rotation
- Consistent padding (px-4 py-3)
- Icon + title header
- `defaultOpen` prop for initial state

### 3.2 Field Group
**File: `src/funnel-builder-v3/components/inspector/FieldGroup.tsx`**

Features:
- 11px label text (medium weight)
- 9px hint text (muted color)
- Consistent vertical spacing

### 3.3 Color Preset Grid
**File: `src/funnel-builder-v3/components/inspector/ColorPresetGrid.tsx`**

Features:
- 8-column swatch grid
- Category headers: Neutrals, Brand, Warm, Cool
- Active state with ring indicator
- Custom color input option

### 3.4 Gradient Editor
**File: `src/funnel-builder-v3/components/inspector/GradientEditor.tsx`**

Features:
- Gradient preview bar
- Type toggle (linear/radial)
- Angle slider (0-360°)
- Color stop management (add/remove/drag)
- Preset selection grid

### 3.5 Animation Picker
**File: `src/funnel-builder-v3/components/inspector/AnimationPicker.tsx`**

Features:
- Preset selection dropdown (grouped by category)
- Duration slider (100-2000ms)
- Delay slider (0-2000ms)
- Trigger selection (load/scroll/hover)
- Preview/replay button

---

## Phase 4: Create Device Frames (~150 lines)

**File: `src/funnel-builder-v3/components/DeviceFrame.tsx`**

Port from `EditorLayout.css` device frame styles:

**Phone Frame:**
- Dynamic island/notch
- Rounded corners (52px)
- Home indicator bar
- Responsive width: `min(375px, calc(100vw - 560px))`

**Tablet Frame:**
- Rounded corners (28px)
- Home bar
- Responsive width: `min(768px, calc(100vw - 560px))`

**Desktop Frame:**
- Browser bar with traffic lights (red/yellow/green)
- URL bar
- Minimal rounded corners

---

## Phase 5: Create Inline Text Editor (~250 lines)

**File: `src/funnel-builder-v3/components/InlineTextEditor.tsx`**

Port simplified version from `components/funnel-builder/InlineTextEditor.tsx`:

Features:
- Click to enter edit mode
- `contentEditable` div with placeholder
- Floating toolbar on text selection (portaled to body)
- Toolbar controls: Bold, Italic, Underline, Alignment, Color, Font Size
- Keyboard shortcuts (Ctrl+B/I/U)
- Escape to cancel, blur to save
- Debounced save (300ms)

---

## Phase 6: Enhance Type System (~50 lines)

**File: `src/funnel-builder-v3/types/funnel.ts`** (additions)

Add these new types to the existing file:

```typescript
// Animation settings
export interface AnimationSettings {
  effect: AnimationEffect;
  trigger: 'load' | 'scroll' | 'hover';
  duration: number;
  delay: number;
  easing?: string;
}

export type AnimationEffect = 
  | 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'scale-in' | 'bounce' | 'pulse' | 'shake';

// Gradient value (unified with presets)
export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

// Enhanced BlockProps (add to existing)
export interface BlockProps {
  // ... existing props
  animation?: AnimationSettings;
  gradient?: GradientValue;
  useGradient?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  hoverEffect?: 'none' | 'glow' | 'lift' | 'pulse' | 'shine';
}

// Enhanced ScreenBackground (add to existing)
export interface ScreenBackground {
  // ... existing props
  video?: string;
  pattern?: { type: 'dots' | 'grid' | 'lines'; color: string; opacity: number };
  overlay?: 'none' | 'dark' | 'light' | 'gradient-dark';
  overlayOpacity?: number;
}
```

---

## Phase 7: Enhance RightPanel (~300 lines)

**File: `src/funnel-builder-v3/components/RightPanel.tsx`** (rewrite)

Replace flat controls with collapsible sections using new inspector components:

**Screen Style Tab:**
```text
├── CollapsibleSection: Background (defaultOpen)
│   ├── BackgroundTypeSelector (solid/gradient/image/video/pattern)
│   ├── ColorPresetGrid (if solid)
│   ├── GradientEditor (if gradient)
│   └── OverlaySelector
└── CollapsibleSection: Screen Settings
    ├── Screen Name input
    └── Screen Type selector
```

**Block Style Tab:**
```text
├── CollapsibleSection: Content (defaultOpen)
│   ├── Content input/textarea
│   └── InlineTextEditor toggle
├── CollapsibleSection: Typography
│   ├── FontSizeSelector (from presets)
│   ├── FontWeightSelector (from presets)
│   ├── TextAlignmentControl
│   └── ColorPresetGrid
├── CollapsibleSection: Button Style (if button block)
│   ├── VariantSelector
│   ├── GradientToggle + GradientEditor
│   ├── ShadowSelector
│   └── HoverEffectSelector
├── CollapsibleSection: Animation
│   └── AnimationPicker
└── Actions
    ├── Duplicate button
    └── Delete button
```

---

## Phase 8: Enhance Toolbar (~100 lines)

**File: `src/funnel-builder-v3/components/Toolbar.tsx`** (additions)

Add these features:

**Device Mode Switcher:**
- Desktop/Tablet/Mobile icon buttons
- Active state styling
- Pass mode to Canvas

**Save Status:**
- "Saving..." indicator
- "Saved" confirmation
- Error state handling

**Settings Dropdown:**
- Funnel settings access
- Grid toggle (placeholder)

---

## Phase 9: Enhance Canvas (~150 lines)

**File: `src/funnel-builder-v3/components/Canvas.tsx`** (additions)

Add these features:

**DeviceFrame Integration:**
- Wrap content in `DeviceFrame` component
- Pass `deviceMode` from Toolbar

**Enhanced Background Support:**
- Pattern backgrounds (dots, grid, lines)
- Video backgrounds (iframe embed)
- Overlay rendering

**Progress Bar Enhancements:**
- Multiple styles: bar, dots, steps
- Animated transitions

---

## Phase 10: Enhance Block Renderers (~200 lines)

### 10.1 ButtonBlock Enhancements
**File: `src/funnel-builder-v3/components/blocks/ButtonBlock.tsx`**

Add:
- Gradient background support (using `gradientToCSS`)
- Animation class application
- Hover effect classes (glow, lift, pulse, shine)
- Shadow styles

### 10.2 HeadingBlock & TextBlock
Add inline editing support via InlineTextEditor component

### 10.3 ChoiceBlock
Add card-style layout with images (grid view)

### 10.4 All Blocks - Animation Wrapper
Add animation class application to BlockRenderer:

```typescript
const animationClass = block.props.animation?.effect 
  ? `builder-animate-${block.props.animation.effect}` 
  : '';

return (
  <div 
    className={cn('block-wrapper', animationClass)}
    style={{ 
      animationDuration: `${block.props.animation?.duration || 500}ms`,
      animationDelay: `${block.props.animation?.delay || 0}ms`,
    }}
  >
    {/* block content */}
  </div>
);
```

---

## Phase 11: Create Template System (~600 lines)

### 11.1 Template Registry
**File: `src/funnel-builder-v3/templates/index.ts`**

```typescript
export interface ScreenTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  createScreen: () => Screen;
}

export type TemplateCategory = 
  | 'hero' | 'content' | 'cta' | 'form' 
  | 'choice' | 'social_proof' | 'faq' | 'features';

export const TEMPLATE_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'Layout' },
  { id: 'content', label: 'Content', icon: 'FileText' },
  { id: 'cta', label: 'Call to Action', icon: 'Zap' },
  { id: 'form', label: 'Form', icon: 'FormInput' },
  { id: 'choice', label: 'Choice', icon: 'ListChecks' },
  { id: 'social_proof', label: 'Social Proof', icon: 'Star' },
];
```

### 11.2 Template Files
Convert 50+ templates from `builder_v2/templates/sectionTemplates.ts` to v3 format:

**File: `src/funnel-builder-v3/templates/heroTemplates.ts`**
- Hero Simple, Hero + Reviews, Hero + Logos, Hero Split
- Hero + Form Card, Hero Gradient, Hero Dark

**File: `src/funnel-builder-v3/templates/ctaTemplates.ts`**
- CTA Simple, CTA Urgency, CTA Discount
- CTA Comparison, CTA Testimonial

**File: `src/funnel-builder-v3/templates/formTemplates.ts`**
- Contact Form, Application Form, Quiz Start

**File: `src/funnel-builder-v3/templates/socialProofTemplates.ts`**
- Testimonial Grid, Logo Bar, Stats Bar

### 11.3 Template Picker Modal
**File: `src/funnel-builder-v3/components/TemplatePicker.tsx`**

Features:
- Modal dialog with category tabs
- Template cards with preview/description
- One-click insert
- Search/filter functionality

### 11.4 Update LeftPanel
Add "Add Screen" button that opens TemplatePicker modal

---

## Phase 12: Delete Legacy Builders (LAST)

**ONLY execute this phase after Phases 1-11 are complete and tested.**

### Delete Directories
```bash
rm -rf src/flow-canvas/builder/
rm -rf src/builder_v2/
rm -rf src/components/funnel-builder/
```

### Update Imports
**File: `src/pages/FunnelEditor.tsx`**
- Remove legacy builder imports
- Remove `?builder=legacy` feature flag
- Use only v3 Editor

**File: `src/flow-canvas/index.ts`**
- Remove builder exports
- Keep only runtime exports (FlowCanvasRenderer, types)

### Clean Up
- Remove deprecated type imports
- Update any remaining references

---

## Files Changed Summary

| Action | File | Est. Lines |
|--------|------|------------|
| CREATE | `v3/shared/presets.ts` | ~400 |
| CREATE | `v3/shared/gradientHelpers.ts` | ~100 |
| CREATE | `v3/shared/animationPresets.ts` | ~100 |
| CREATE | `v3/shared/videoHelpers.ts` | ~50 |
| CREATE | `v3/styles/builder.css` | ~400 |
| CREATE | `v3/components/DeviceFrame.tsx` | ~150 |
| CREATE | `v3/components/InlineTextEditor.tsx` | ~250 |
| CREATE | `v3/components/TemplatePicker.tsx` | ~200 |
| CREATE | `v3/components/inspector/CollapsibleSection.tsx` | ~60 |
| CREATE | `v3/components/inspector/FieldGroup.tsx` | ~30 |
| CREATE | `v3/components/inspector/ColorPresetGrid.tsx` | ~80 |
| CREATE | `v3/components/inspector/GradientEditor.tsx` | ~200 |
| CREATE | `v3/components/inspector/AnimationPicker.tsx` | ~150 |
| CREATE | `v3/templates/index.ts` | ~100 |
| CREATE | `v3/templates/heroTemplates.ts` | ~250 |
| CREATE | `v3/templates/ctaTemplates.ts` | ~200 |
| CREATE | `v3/templates/formTemplates.ts` | ~150 |
| CREATE | `v3/templates/socialProofTemplates.ts` | ~100 |
| MODIFY | `v3/types/funnel.ts` | +80 |
| MODIFY | `v3/components/Toolbar.tsx` | +100 |
| MODIFY | `v3/components/Canvas.tsx` | +150 |
| MODIFY | `v3/components/LeftPanel.tsx` | +50 |
| MODIFY | `v3/components/RightPanel.tsx` | Rewrite (~400) |
| MODIFY | `v3/components/blocks/*.tsx` | +200 |
| *DEFERRED* | Delete legacy directories | -27,000 |

**Net Result After Phase 11: ~3,500 lines (v3 enhanced) + ~27,000 lines (legacy still present)**
**Net Result After Phase 12: ~3,500 lines total**

---

## Success Criteria

### After Phases 1-11 (Before Deletion):
1. All 50+ templates accessible in v3
2. Animation presets working on all block types
3. Gradient editor functional for backgrounds and buttons
4. Device frame switching (desktop/tablet/mobile) works
5. Collapsible inspector sections render properly
6. Inline text editing works for headings and text
7. Color preset grids display correctly
8. Published funnels still work via FlowCanvasRenderer

### After Phase 12 (After Deletion):
9. No broken imports or references
10. ~3,500 lines total codebase
11. Application runs without errors
12. All v3 features continue working

---

## Implementation Order

Start with **Phase 1** (shared utilities) since all other phases depend on these presets and helpers. Then proceed sequentially through Phase 11. Phase 12 (deletion) should only be executed after manual verification that all features work correctly.

