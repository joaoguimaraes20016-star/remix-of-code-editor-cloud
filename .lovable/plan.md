

# Funnel Builder v3 - Complete Enhancement & Legacy Cleanup

## Overview

This plan enhances the new v3 funnel builder with all the **editing complexity, templates, animations, and visual polish** from flow-canvas and builder_v2, then **deletes the legacy builders** to create a single, clean, Perspective-style system.

## What We're Migrating

### From `flow-canvas/builder/` (~15,000 lines)

| Feature | Source | Target | Lines |
|---------|--------|--------|-------|
| **Color/Gradient Presets** | `utils/presets.ts` | `v3/shared/presets.ts` | ~400 |
| **Gradient Utilities** | `gradientToCSS`, `cssToGradientValue` | `v3/shared/gradientHelpers.ts` | ~100 |
| **Animation Presets** | `AnimationPresetSection.tsx` | `v3/shared/animationPresets.ts` | ~150 |
| **Collapsible Sections** | `inspectors/shared/CollapsibleSection.tsx` | `v3/components/inspector/` | ~50 |
| **Inline Text Editing** | `InlineTextEditor.tsx` (simplified) | `v3/components/InlineTextEditor.tsx` | ~200 |
| **Device Frames** | TopToolbar device switcher | `v3/components/DeviceFrame.tsx` | ~150 |
| **CSS Design Tokens** | `canvas.css` variables | `v3/styles/builder.css` | ~300 |

### From `builder_v2/templates/` (~3,500 lines)

| Feature | Source | Target |
|---------|--------|--------|
| **50+ Section Templates** | `sectionTemplates.ts` | `v3/templates/` (converted to v3 format) |
| Hero (8), CTA (10), About (9), Forms, Social Proof, FAQ, Features |

## New v3 File Structure

```text
src/funnel-builder-v3/
├── styles/
│   └── builder.css              ← NEW: Design tokens from canvas.css
├── shared/
│   ├── presets.ts               ← NEW: Colors, gradients, fonts
│   ├── gradientHelpers.ts       ← NEW: Gradient utilities
│   ├── animationPresets.ts      ← NEW: Animation config
│   └── videoHelpers.ts          ← NEW: YouTube/Vimeo parsing
├── components/
│   ├── Editor.tsx               ← KEEP (already clean)
│   ├── Toolbar.tsx              ← ENHANCE: Device switcher, save status
│   ├── Canvas.tsx               ← ENHANCE: Device frames, animations
│   ├── LeftPanel.tsx            ← ENHANCE: Template picker
│   ├── RightPanel.tsx           ← ENHANCE: Collapsible sections, design controls
│   ├── DeviceFrame.tsx          ← NEW: Phone/tablet/desktop frames
│   ├── InlineTextEditor.tsx     ← NEW: Click-to-edit text
│   ├── inspector/
│   │   ├── CollapsibleSection.tsx  ← NEW
│   │   ├── FieldGroup.tsx          ← NEW
│   │   ├── ColorPresetGrid.tsx     ← NEW
│   │   ├── GradientEditor.tsx      ← NEW
│   │   └── AnimationPicker.tsx     ← NEW
│   └── blocks/
│       ├── ... (existing - ENHANCE with animations)
│       └── [enhanced block renderers]
├── templates/
│   ├── index.ts                 ← NEW: Template registry
│   ├── heroTemplates.ts         ← NEW: 8 hero templates
│   ├── ctaTemplates.ts          ← NEW: 10 CTA templates
│   ├── formTemplates.ts         ← NEW: Form templates
│   └── socialProofTemplates.ts  ← NEW: Testimonials, logos
├── hooks/
│   └── useFunnelState.ts        ← KEEP
├── types/
│   └── funnel.ts                ← ENHANCE: Add animation, gradient types
└── index.ts
```

## Implementation Phases

### Phase 1: Create Shared Utilities

**Create `src/funnel-builder-v3/shared/presets.ts`**

Port from flow-canvas:
- `masterColorPresets` (48 colors)
- `inspectorColorPresets` (categorized)
- `masterGradientPresets` (12 gradients)
- `masterFontFamilies` (15 fonts)
- Font size, weight, spacing options

**Create `src/funnel-builder-v3/shared/gradientHelpers.ts`**

```typescript
export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

export function gradientToCSS(gradient: GradientValue): string;
export function cssToGradientValue(css: string): GradientValue | null;
export const defaultGradient: GradientValue;
```

**Create `src/funnel-builder-v3/shared/animationPresets.ts`**

```typescript
export interface AnimationPreset {
  id: string;
  label: string;
  type: 'entrance' | 'attention';
  css: {
    animation: string;
    keyframes: string;
  };
}

export const animationPresets: AnimationPreset[] = [
  { id: 'fade-in', label: 'Fade In', type: 'entrance', ... },
  { id: 'slide-up', label: 'Slide Up', type: 'entrance', ... },
  { id: 'scale-in', label: 'Scale In', type: 'entrance', ... },
  { id: 'bounce', label: 'Bounce', type: 'attention', ... },
  { id: 'pulse', label: 'Pulse', type: 'attention', ... },
];
```

**Create `src/funnel-builder-v3/shared/videoHelpers.ts`**

```typescript
export function getVideoEmbedUrl(url: string): string | null;
export function getVideoProvider(url: string): 'youtube' | 'vimeo' | 'loom' | 'direct' | null;
```

### Phase 2: Create CSS Design System

**Create `src/funnel-builder-v3/styles/builder.css`**

Port key CSS variables from `canvas.css`:

```css
:root {
  /* Timing */
  --builder-v3-transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --builder-v3-transition-fast: 150ms;
  --builder-v3-transition-slow: 400ms;
  
  /* Selection */
  --builder-v3-selection-ring: rgba(99, 102, 241, 0.4);
  --builder-v3-hover-bg: rgba(99, 102, 241, 0.08);
  
  /* Component spacing */
  --builder-v3-content-gap: 16px;
  --builder-v3-block-gap: 24px;
}

/* Animation keyframes */
@keyframes builder-fade-in { ... }
@keyframes builder-slide-up { ... }
@keyframes builder-scale-in { ... }
@keyframes builder-bounce { ... }
@keyframes builder-pulse { ... }
```

### Phase 3: Create Inspector Components

**Create `src/funnel-builder-v3/components/inspector/CollapsibleSection.tsx`**

Port from flow-canvas (simplified):

```typescript
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
```

**Create `src/funnel-builder-v3/components/inspector/GradientEditor.tsx`**

- Gradient preview bar
- Type toggle (linear/radial)
- Angle slider
- Color stop management
- Preset selection

**Create `src/funnel-builder-v3/components/inspector/AnimationPicker.tsx`**

- Animation preset selection
- Duration slider (100-2000ms)
- Delay slider (0-2000ms)
- Trigger selection (load/scroll)
- Preview button

### Phase 4: Enhance RightPanel

**Update `src/funnel-builder-v3/components/RightPanel.tsx`**

Replace flat controls with collapsible sections:

```typescript
// Screen Style tab
<CollapsibleSection title="Background" icon={<Palette />} defaultOpen>
  <BackgroundTypeSelector type={screen.background?.type} onChange={...} />
  {type === 'solid' && <ColorPresetGrid presets={backgroundColors} />}
  {type === 'gradient' && <GradientEditor value={...} onChange={...} />}
</CollapsibleSection>

// Block Style tab
<CollapsibleSection title="Typography" icon={<Type />} defaultOpen>
  <FontSizeSelector />
  <FontWeightSelector />
  <TextAlignmentControl />
  <ColorPicker with presets />
</CollapsibleSection>

<CollapsibleSection title="Animation" icon={<Sparkles />}>
  <AnimationPicker />
</CollapsibleSection>
```

### Phase 5: Add Device Frames

**Create `src/funnel-builder-v3/components/DeviceFrame.tsx`**

```typescript
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DeviceFrameProps {
  mode: DeviceMode;
  children: React.ReactNode;
}

// Phone frame: Dynamic island, home indicator
// Tablet frame: Rounded corners, home bar
// Desktop frame: Browser bar with traffic lights, URL bar
```

**Update Toolbar.tsx**

Add device mode switcher:

```typescript
<div className="flex items-center gap-1 bg-muted rounded-lg p-1">
  <button onClick={() => setDevice('desktop')} active={device === 'desktop'}>
    <Monitor />
  </button>
  <button onClick={() => setDevice('tablet')} active={device === 'tablet'}>
    <Tablet />
  </button>
  <button onClick={() => setDevice('mobile')} active={device === 'mobile'}>
    <Smartphone />
  </button>
</div>
```

**Update Canvas.tsx**

Wrap content in DeviceFrame component.

### Phase 6: Add Template System

**Create `src/funnel-builder-v3/templates/index.ts`**

```typescript
export interface ScreenTemplate {
  id: string;
  name: string;
  description: string;
  category: 'hero' | 'cta' | 'form' | 'social_proof' | 'faq';
  thumbnail?: string;
  createScreen: () => Screen;
}

export const TEMPLATE_CATEGORIES = [...];
export const ALL_TEMPLATES: ScreenTemplate[] = [...];
```

**Convert sectionTemplates.ts to v3 format**

Example conversion:

```typescript
// OLD (CanvasNode format)
export const heroSimple = {
  createNode: () => ({
    type: 'section',
    children: [{ type: 'heading', props: { text: '...' } }]
  })
};

// NEW (v3 Screen format)
export const heroSimple: ScreenTemplate = {
  id: 'hero-simple',
  name: 'Hero Simple',
  category: 'hero',
  createScreen: () => ({
    id: createId(),
    name: 'Hero',
    type: 'content',
    blocks: [
      createBlock('heading', 'More Success with Less Effort', { size: '2xl', align: 'center' }),
      createBlock('text', 'With our tailored solutions...', { align: 'center' }),
      createBlock('button', 'Learn more now', { variant: 'primary', action: { type: 'next-screen' } }),
    ]
  })
};
```

**Add Template Picker to LeftPanel**

- "Add Screen" button opens template picker modal
- Categories as tabs: Hero, CTA, Form, Social Proof, FAQ
- Template cards with preview thumbnails

### Phase 7: Enhance Block Types

**Update `src/funnel-builder-v3/types/funnel.ts`**

Add animation and advanced styling:

```typescript
export interface BlockProps {
  // ... existing props
  
  // Animation
  animation?: {
    effect: AnimationEffect;
    trigger: 'load' | 'scroll';
    duration: number;
    delay: number;
  };
  
  // Advanced styling
  gradient?: GradientValue;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: number;
}

export type AnimationEffect = 
  | 'none' | 'fade-in' | 'slide-up' | 'slide-down' 
  | 'scale-in' | 'bounce' | 'pulse';
```

**Enhance block renderers**

Add animation class application:

```typescript
// BlockRenderer.tsx
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

### Phase 8: Delete Legacy Builders

**Delete directories:**

```
rm -rf src/flow-canvas/builder/
rm -rf src/builder_v2/
rm -rf src/components/funnel-builder/
```

**Update FunnelEditor.tsx:**

Remove legacy imports and feature flags:

```typescript
// BEFORE
import { EditorShell as LegacyEditor } from '@/flow-canvas/builder/components/EditorShell';
const useLegacy = searchParams.get('builder') === 'legacy';

// AFTER
import { Editor } from '@/funnel-builder-v3';
// No legacy fallback
```

**Clean up related files:**

- Remove builder exports from `src/flow-canvas/index.ts`
- Update any route references
- Remove deprecated type imports

## Files Changed Summary

| Action | File | Est. Lines |
|--------|------|------------|
| CREATE | `v3/styles/builder.css` | ~300 |
| CREATE | `v3/shared/presets.ts` | ~400 |
| CREATE | `v3/shared/gradientHelpers.ts` | ~80 |
| CREATE | `v3/shared/animationPresets.ts` | ~100 |
| CREATE | `v3/shared/videoHelpers.ts` | ~50 |
| CREATE | `v3/components/DeviceFrame.tsx` | ~150 |
| CREATE | `v3/components/InlineTextEditor.tsx` | ~200 |
| CREATE | `v3/components/inspector/CollapsibleSection.tsx` | ~50 |
| CREATE | `v3/components/inspector/FieldGroup.tsx` | ~30 |
| CREATE | `v3/components/inspector/ColorPresetGrid.tsx` | ~60 |
| CREATE | `v3/components/inspector/GradientEditor.tsx` | ~200 |
| CREATE | `v3/components/inspector/AnimationPicker.tsx` | ~150 |
| CREATE | `v3/templates/index.ts` | ~100 |
| CREATE | `v3/templates/heroTemplates.ts` | ~250 |
| CREATE | `v3/templates/ctaTemplates.ts` | ~300 |
| CREATE | `v3/templates/formTemplates.ts` | ~150 |
| MODIFY | `v3/components/Toolbar.tsx` | +100 |
| MODIFY | `v3/components/Canvas.tsx` | +100 |
| MODIFY | `v3/components/RightPanel.tsx` | +300 |
| MODIFY | `v3/types/funnel.ts` | +50 |
| MODIFY | `v3/components/blocks/*.tsx` | +200 |
| DELETE | `src/flow-canvas/builder/` | -15,000 |
| DELETE | `src/builder_v2/` | -8,000 |
| DELETE | `src/components/funnel-builder/` | -4,000 |

**Net result: ~3,500 lines (v3) vs ~27,000 lines (legacy)**

## Technical Notes

### Animation CSS Classes

```css
.builder-animate-fade-in {
  animation: builder-fade-in var(--animation-duration, 500ms) ease-out forwards;
}

@keyframes builder-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
```

### Template Conversion Pattern

All 50+ templates from builder_v2 will be converted using this pattern:

```typescript
// Input: CanvasNode with children[]
// Output: Screen with blocks[]

function convertTemplate(node: CanvasNode): Screen {
  return {
    id: createId(),
    name: node.props?.name || 'Screen',
    type: inferScreenType(node),
    blocks: node.children?.map(convertNodeToBlock) || [],
    background: node.props?.background,
  };
}
```

## Success Criteria

1. All templates from builder_v2 available in v3
2. Animation presets working on all block types
3. Gradient editor for backgrounds and buttons
4. Device frame switching (desktop/tablet/mobile)
5. Collapsible inspector sections with proper styling
6. ~3,500 lines total (vs 27,000+ legacy)
7. No breaking changes to published funnels
8. Fluid, Perspective-like editing experience

