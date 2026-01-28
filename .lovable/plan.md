
# Funnel Builder v3 - Complete Enhancement & Legacy Cleanup

## Executive Summary

This plan enhances the new v3 funnel builder with **all the editing complexity, templates, animations, and visual polish** from the legacy builders, then **deletes ~25,000 lines** of legacy code to create a single, clean, Perspective-style system.

**Current State Analysis:**

| Component | Status | Lines | Action |
|-----------|--------|-------|--------|
| `funnel-builder-v3/` | New, minimal | ~1,500 | **ENHANCE** |
| `flow-canvas/builder/` | Complex, unmaintainable | ~15,000+ | **DELETE** |
| `builder_v2/` | Duplicate of flow-canvas | ~8,000+ | **DELETE** |
| `components/funnel-builder/` | Original legacy | ~4,000+ | **DELETE** |

**Target**: ~3,500 lines (v3 enhanced) vs ~27,000 lines (current total)

---

## Phase 1: Create Shared Utilities (~600 lines)

### 1.1 Presets System
**File: `src/funnel-builder-v3/shared/presets.ts`**

Migrate from `flow-canvas/builder/utils/presets.ts`:
- `masterColorPresets` - 48 colors (6 rows x 8 columns)
- `inspectorColorPresets` - Categorized: neutrals, brand, warm, cool
- `masterGradientPresets` - 12 gradient presets with GradientValue interface
- `masterFontFamilies` - 15 fonts with categories
- `fontSizeOptions`, `fontWeightOptions`, `letterSpacingOptions`
- `textShadowPresets`, `blockShadowPresets`

### 1.2 Gradient Helpers
**File: `src/funnel-builder-v3/shared/gradientHelpers.ts`**

```text
Interfaces:
├── GradientValue { type, angle, stops[] }
├── GradientPreset { name, gradient }

Functions:
├── gradientToCSS(gradient) → CSS string
├── cssToGradientValue(css) → GradientValue
├── cloneGradient(gradient) → GradientValue (immutable)
└── defaultGradientValue
```

### 1.3 Animation Presets
**File: `src/funnel-builder-v3/shared/animationPresets.ts`**

Migrate from `AnimationPresetSection.tsx`:
- 14 animation presets (entrance + attention)
- Spring physics presets (Gentle, Default, Snappy, Bouncy, Stiff)
- Trigger options (load, scroll, hover)
- Easing options (ease-out, ease-in, spring, linear)

### 1.4 Video Helpers
**File: `src/funnel-builder-v3/shared/videoHelpers.ts`**

```typescript
getVideoEmbedUrl(url: string): string | null
getVideoProvider(url: string): 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'direct' | null
```

---

## Phase 2: Create CSS Design System (~400 lines)

**File: `src/funnel-builder-v3/styles/builder.css`**

Migrate from `EditorLayout.css`:

```css
:root {
  /* Builder tokens */
  --builder-bg: 225 12% 10%;
  --builder-surface: 225 12% 14%;
  --builder-accent: 217 91% 60%;
  --builder-text: 210 20% 96%;
  --builder-border: 225 8% 20%;
  
  /* Transitions */
  --builder-transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Radius */
  --builder-radius-sm: 6px;
  --builder-radius-md: 10px;
  --builder-radius-lg: 16px;
}

/* Device frame styles */
.device-frame--phone { ... }
.device-frame--tablet { ... }
.device-frame--desktop { ... }

/* Node selection states */
.builder-v3-node-overlay { ... }
.builder-v3-node:hover > .builder-v3-node-overlay { border-color: rgba(59, 130, 246, 0.4); }
.builder-v3-node[data-selected="true"] > .builder-v3-node-overlay { border-color: #3b82f6; }

/* Animation keyframes */
@keyframes builder-fade-in { ... }
@keyframes builder-slide-up { ... }
@keyframes builder-scale-in { ... }
@keyframes builder-bounce { ... }
@keyframes builder-pulse { ... }
```

---

## Phase 3: Create Inspector Components (~400 lines)

### 3.1 Collapsible Section
**File: `src/funnel-builder-v3/components/inspector/CollapsibleSection.tsx`**

```typescript
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
```

Features:
- Animated chevron rotation
- Consistent padding (px-4 py-3)
- Hover state (bg-builder-surface-hover)
- Active badge indicator

### 3.2 Field Group
**File: `src/funnel-builder-v3/components/inspector/FieldGroup.tsx`**

```typescript
interface FieldGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}
```

Features:
- 11px label text
- 9px hint text (dim)
- 1.5 spacing between label and control

### 3.3 Color Preset Grid
**File: `src/funnel-builder-v3/components/inspector/ColorPresetGrid.tsx`**

- 8-column swatch grid
- Categories: Neutrals, Brand, Warm, Cool
- Active state with ring
- Custom color input

### 3.4 Gradient Editor
**File: `src/funnel-builder-v3/components/inspector/GradientEditor.tsx`**

Features:
- Gradient preview bar
- Type toggle (linear/radial)
- Angle slider (0-360)
- Color stop management (add/remove/drag)
- Preset selection grid

### 3.5 Animation Picker
**File: `src/funnel-builder-v3/components/inspector/AnimationPicker.tsx`**

Features:
- Preset selection dropdown (grouped by entrance/attention)
- Duration slider (100-2000ms)
- Delay slider (0-2000ms)
- Trigger selection (load/scroll/hover)
- Easing selection
- Spring physics presets (when easing = spring)
- Preview/replay button

---

## Phase 4: Create Device Frames (~150 lines)

**File: `src/funnel-builder-v3/components/DeviceFrame.tsx`**

```typescript
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DeviceFrameProps {
  mode: DeviceMode;
  children: React.ReactNode;
}
```

Frame styles from `EditorLayout.css`:
- **Phone**: Dynamic island, rounded corners (52px), home indicator
- **Tablet**: Rounded corners (28px), home bar
- **Desktop**: Browser bar with traffic lights (red/yellow/green), URL bar

---

## Phase 5: Create Inline Text Editor (~250 lines)

**File: `src/funnel-builder-v3/components/InlineTextEditor.tsx`**

Simplified version from `components/funnel-builder/InlineTextEditor.tsx`:

Features:
- Click to enter edit mode
- contentEditable div with placeholder
- Floating toolbar on text selection:
  - Bold / Italic / Underline
  - Alignment (left/center/right)
  - Color picker (15 preset colors + custom)
  - Font size (7 options)
- Keyboard shortcuts (Ctrl+B/I/U)
- Escape to cancel, blur to save
- Debounced save (300ms)

---

## Phase 6: Enhance Type System (~50 lines)

**File: `src/funnel-builder-v3/types/funnel.ts`** (additions)

```typescript
// Add animation settings
export interface AnimationSettings {
  effect: AnimationEffect;
  trigger: 'load' | 'scroll' | 'hover';
  duration: number;
  delay: number;
  easing?: string;
  springStiffness?: number;
  springDamping?: number;
}

export type AnimationEffect = 
  | 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'scale-in' | 'scale-up' | 'blur-in' | 'rotate-in'
  | 'bounce' | 'pulse' | 'shake' | 'wiggle';

// Add gradient value
export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

// Enhance BlockProps
export interface BlockProps {
  // ... existing props
  
  // Animation
  animation?: AnimationSettings;
  
  // Advanced styling
  gradient?: GradientValue;
  useGradient?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  borderRadius?: number;
  hoverEffect?: 'none' | 'glow' | 'lift' | 'pulse' | 'shine';
}

// Enhance ScreenBackground
export interface ScreenBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  // ... existing
  video?: string;
  pattern?: {
    type: 'dots' | 'grid' | 'lines';
    color: string;
    opacity: number;
    size: number;
  };
  overlay?: 'none' | 'dark' | 'light' | 'gradient-dark' | 'gradient-light';
  overlayOpacity?: number;
}
```

---

## Phase 7: Enhance RightPanel (~300 lines)

**File: `src/funnel-builder-v3/components/RightPanel.tsx`** (rewrite)

Replace flat controls with collapsible sections:

```text
Screen Style Tab:
├── CollapsibleSection: Background (defaultOpen)
│   ├── BackgroundTypeSelector (solid/gradient/image/video/pattern)
│   ├── ColorPresetGrid (if solid)
│   ├── GradientEditor (if gradient)
│   ├── ImageUploader (if image)
│   └── OverlaySelector
│
└── CollapsibleSection: Screen Settings
    ├── Screen Name
    └── Screen Type

Block Style Tab:
├── CollapsibleSection: Content (defaultOpen)
│   ├── Content input/textarea
│   └── InlineTextEditor toggle
│
├── CollapsibleSection: Typography
│   ├── FontSizeSelector
│   ├── FontWeightSelector
│   ├── TextAlignmentControl
│   └── ColorPicker with presets
│
├── CollapsibleSection: Button Style (if button)
│   ├── VariantSelector (primary/secondary/outline/ghost)
│   ├── GradientToggle + GradientEditor
│   ├── ShadowSelector
│   └── HoverEffectSelector
│
├── CollapsibleSection: Animation
│   └── AnimationPicker
│
└── Actions
    ├── Duplicate button
    └── Delete button
```

---

## Phase 8: Enhance Toolbar (~100 lines)

**File: `src/funnel-builder-v3/components/Toolbar.tsx`** (additions)

Add:
- Device mode switcher (Desktop/Tablet/Mobile icons)
- Undo/Redo buttons (placeholder for Phase 2)
- Save status indicator (Saving... / Saved)
- Settings dropdown (funnel settings)

```typescript
// Device switcher
<div className="flex items-center gap-1 bg-muted rounded-lg p-1">
  <button onClick={() => setDevice('desktop')} className={...}>
    <Monitor className="h-4 w-4" />
  </button>
  <button onClick={() => setDevice('tablet')} className={...}>
    <Tablet className="h-4 w-4" />
  </button>
  <button onClick={() => setDevice('mobile')} className={...}>
    <Smartphone className="h-4 w-4" />
  </button>
</div>
```

---

## Phase 9: Enhance Canvas (~150 lines)

**File: `src/funnel-builder-v3/components/Canvas.tsx`** (additions)

Add:
- DeviceFrame wrapper based on device mode
- Pattern background rendering
- Video background support
- Overlay rendering
- Enhanced progress bar styles

---

## Phase 10: Enhance Block Renderers (~200 lines)

### 10.1 ButtonBlock
**File: `src/funnel-builder-v3/components/blocks/ButtonBlock.tsx`**

Add:
- Gradient background support
- Animation class application
- Hover effect classes
- Shadow styles

### 10.2 HeadingBlock & TextBlock
Add inline editing support via InlineTextEditor

### 10.3 ChoiceBlock
Add card-style layout with images (perspective grid view)

### 10.4 All blocks
Add animation wrapper:

```typescript
const animationClass = block.props.animation?.effect 
  ? `builder-animate-${block.props.animation.effect}` 
  : '';

<div 
  className={cn('block-wrapper', animationClass)}
  style={{ 
    animationDuration: `${block.props.animation?.duration || 500}ms`,
    animationDelay: `${block.props.animation?.delay || 0}ms`,
  }}
>
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
  category: 'hero' | 'content' | 'cta' | 'form' | 'choice' | 'social_proof' | 'faq' | 'features';
  icon: string;
  createScreen: () => Screen;
}

export const TEMPLATE_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'Layout' },
  { id: 'content', label: 'Content', icon: 'FileText' },
  { id: 'cta', label: 'Call to Action', icon: 'Zap' },
  { id: 'form', label: 'Form', icon: 'FormInput' },
  { id: 'choice', label: 'Choice', icon: 'ListChecks' },
  { id: 'social_proof', label: 'Social Proof', icon: 'Star' },
  { id: 'faq', label: 'FAQ', icon: 'HelpCircle' },
  { id: 'features', label: 'Features', icon: 'Grid' },
];

export const ALL_TEMPLATES: ScreenTemplate[] = [
  ...heroTemplates,
  ...contentTemplates,
  ...ctaTemplates,
  ...formTemplates,
  ...socialProofTemplates,
];
```

### 11.2 Template Files
Convert 50+ templates from `builder_v2/templates/sectionTemplates.ts`:

**File: `src/funnel-builder-v3/templates/heroTemplates.ts`**
- Hero Simple
- Hero + Reviews
- Hero + Logos
- Hero Split
- Hero + Form Card
- Hero + Inline Form
- Hero Gradient
- Hero Dark

**File: `src/funnel-builder-v3/templates/ctaTemplates.ts`**
- CTA Simple
- CTA Urgency
- CTA Discount
- CTA Comparison
- CTA Guarantee
- CTA Scarcity
- CTA Social Proof
- CTA Stacked Benefits
- CTA Testimonial
- CTA Video

**File: `src/funnel-builder-v3/templates/formTemplates.ts`**
- Contact Form
- Application Form
- Quiz Start
- Multi-step Form

**File: `src/funnel-builder-v3/templates/socialProofTemplates.ts`**
- Testimonial Grid
- Logo Bar
- Review Cards
- Stats Bar

### 11.3 Template Picker Modal
**File: `src/funnel-builder-v3/components/TemplatePicker.tsx`**

Features:
- Modal with category tabs
- Template cards with preview thumbnails
- Search/filter
- One-click insert

### 11.4 Update LeftPanel
Add "Add Screen" button that opens TemplatePicker

---

## Phase 12: Delete Legacy Builders

### Delete Directories
```bash
rm -rf src/flow-canvas/builder/
rm -rf src/builder_v2/
rm -rf src/components/funnel-builder/
```

### Update FunnelEditor.tsx
Remove legacy imports and feature flag:

```typescript
// REMOVE these imports
import { EditorShell as LegacyEditorShell } from '@/flow-canvas/builder/components/EditorShell';
import type { Page as FlowCanvasPage } from '@/flow-canvas/types/infostack';
import { editorDocumentToFlowCanvas, flowCanvasToEditorDocument } from '@/lib/funnel/dataConverter';

// REMOVE legacy builder check
const useLegacyBuilder = searchParams.get('builder') === 'legacy';

// REMOVE LegacyFunnelEditor component entirely
```

### Clean Up Related Files
- Update `src/flow-canvas/index.ts` - Remove builder exports
- Update route references
- Remove deprecated type imports

---

## Technical Implementation Details

### Animation CSS Classes

```css
.builder-animate-fade-in {
  animation: builder-fade-in var(--animation-duration, 500ms) ease-out forwards;
  opacity: 0;
}

@keyframes builder-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes builder-slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes builder-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes builder-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes builder-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Gradient Value Structure

```typescript
// Used consistently across background, button, text
interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;  // 0-360 for linear
  stops: Array<{ color: string; position: number }>; // position 0-100
}

function gradientToCSS(g: GradientValue): string {
  const stops = g.stops.map(s => `${s.color} ${s.position}%`).join(', ');
  return g.type === 'radial' 
    ? `radial-gradient(circle, ${stops})`
    : `linear-gradient(${g.angle}deg, ${stops})`;
}
```

### Template Conversion Pattern

```typescript
// Convert legacy CanvasNode template to v3 Screen
function convertTemplate(node: CanvasNode, category: string): Screen {
  const blocks: Block[] = [];
  
  for (const child of node.children || []) {
    const block = convertNodeToBlock(child);
    if (block) blocks.push(block);
  }
  
  return {
    id: createId(),
    name: node.props?.name || 'Screen',
    type: inferScreenType(node, category),
    blocks,
    background: node.props?.background,
  };
}

function convertNodeToBlock(node: CanvasNode): Block | null {
  switch (node.type) {
    case 'heading':
      return createBlock('heading', node.props?.text || '', {
        size: levelToSize(node.props?.level),
        align: 'center',
      });
    case 'paragraph':
      return createBlock('text', node.props?.text || '', { align: 'center' });
    case 'cta_button':
      return createBlock('button', node.props?.label || '', {
        variant: node.props?.variant || 'primary',
        action: { type: 'next-screen' },
      });
    // ... more conversions
  }
}
```

---

## Files Changed Summary

| Action | File | Est. Lines |
|--------|------|------------|
| CREATE | `v3/styles/builder.css` | ~400 |
| CREATE | `v3/shared/presets.ts` | ~400 |
| CREATE | `v3/shared/gradientHelpers.ts` | ~100 |
| CREATE | `v3/shared/animationPresets.ts` | ~100 |
| CREATE | `v3/shared/videoHelpers.ts` | ~50 |
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
| MODIFY | `pages/FunnelEditor.tsx` | -150 |
| DELETE | `src/flow-canvas/builder/` | -15,000 |
| DELETE | `src/builder_v2/` | -8,000 |
| DELETE | `src/components/funnel-builder/` | -4,000 |

**Net Result: ~3,500 lines (v3 enhanced) vs ~27,000 lines (current)**

---

## Success Criteria

1. All 50+ templates from builder_v2 available in v3
2. Animation presets working on all block types
3. Gradient editor for backgrounds and buttons
4. Device frame switching (desktop/tablet/mobile)
5. Collapsible inspector sections with proper styling
6. Inline text editing for headings and text blocks
7. Color preset grids with categorized swatches
8. ~3,500 lines total (vs 27,000+ legacy)
9. No breaking changes to published funnels (FlowCanvasRenderer still works)
10. Fluid, Perspective-like editing experience
11. Any developer can understand the architecture in 10 minutes
