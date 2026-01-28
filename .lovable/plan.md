
# Make Premium Elements Display Like Perspective

## Overview

Currently, when you select premium elements (Gradient Text, Stat Number, etc.) from the SectionPicker, they fail to appear on the canvas because `handleAddSectionFromTemplate` looks for them in `allSectionTemplates` which doesn't contain block definitions.

This plan creates polished, Perspective-style defaults for all 7 premium elements with clean typography, proper spacing, and professional styling.

---

## What Needs to Change

### 1. Create Premium Block Factory

**New File: `src/flow-canvas/builder/utils/premiumBlockFactory.ts`**

A factory function that creates beautiful, ready-to-use blocks for each premium element type:

| Element | Default Content | Key Styling |
|---------|----------------|-------------|
| **Gradient Text** | "Transform Your Business" | Purple-to-pink gradient, 3xl font, bold |
| **Underline Text** | "Your Success Story" | Orange accent underline, 2xl font |
| **Stat Number** | "2,847+" with "Happy Customers" | Large tabular nums, accent suffix |
| **Avatar Group** | 5 avatars, gradient colors | Overlapping circles, varied palette |
| **Ticker** | "Featured in Forbes • Inc Magazine • TechCrunch" | Scrolling marquee, professional brands |
| **Badge** | "LIMITED TIME OFFER" | Primary gradient, icon, pill style |
| **Process Step** | Step 1 "Get Started" | Numbered circle, description, accent color |

### 2. Update Template Converter

**File: `src/flow-canvas/builder/utils/templateConverter.ts`**

Add fallback logic to handle block IDs that aren't full section templates:

```text
┌─────────────────────────────────────┐
│ convertTemplateToFrame(templateId)  │
└─────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ Is it a section template?   │
    │ (hero-simple, cta-simple)   │
    └─────────────────────────────┘
          │Yes              │No
          ▼                 ▼
    ┌──────────┐    ┌──────────────────┐
    │ Convert  │    │ Is it a block ID?│
    │ template │    │ (gradient-text)  │
    └──────────┘    └──────────────────┘
                          │Yes     │No
                          ▼        ▼
                    ┌──────────┐  ┌───────┐
                    │ Create   │  │ null  │
                    │ block    │  └───────┘
                    │ frame    │
                    └──────────┘
```

### 3. Enhance CSS for Polished Display

**File: `src/flow-canvas/index.css`**

Add refined styles matching Perspective's clean aesthetic:

- Improved gradient text rendering with proper line-height
- Smooth underline animations
- Polished avatar shadows and borders
- Professional ticker spacing
- Refined badge hover states

---

## Technical Implementation

### Premium Block Factory Function

```typescript
// src/flow-canvas/builder/utils/premiumBlockFactory.ts

export function createPremiumBlock(blockId: string): Block | null {
  const id = generateId();
  
  switch (blockId) {
    case 'gradient-text':
      return {
        id,
        type: 'custom' as BlockType,
        label: 'Gradient Text',
        elements: [{
          id: generateId(),
          type: 'gradient-text',
          content: 'Transform Your Business',
          props: {
            gradient: {
              type: 'linear',
              angle: 135,
              stops: [
                { color: '#8B5CF6', position: 0 },
                { color: '#EC4899', position: 100 }
              ]
            },
            fontSize: '3xl',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        }],
        props: {}
      };
    
    case 'stat-number':
      return {
        id,
        type: 'custom',
        label: 'Stat Number',
        elements: [{
          id: generateId(),
          type: 'stat-number',
          content: '2,847',
          props: {
            suffix: '+',
            label: 'Happy Customers',
            size: 'xl',
            fontWeight: 'bold',
            numberColor: '#111827',
            suffixColorType: 'gradient',
            suffixGradient: {
              type: 'linear',
              angle: 135,
              stops: [
                { color: '#8B5CF6', position: 0 },
                { color: '#EC4899', position: 100 }
              ]
            },
            labelColor: 'rgba(0,0,0,0.6)'
          }
        }],
        props: {}
      };
    
    // ... similar for other elements
  }
}
```

### Template Converter Update

```typescript
// src/flow-canvas/builder/utils/templateConverter.ts

import { createPremiumBlock } from './premiumBlockFactory';

export function convertTemplateToFrame(templateId: string): Frame | null {
  // First try section templates
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (template) {
    const canvasNode = template.createNode();
    return canvasNodeToFrame(canvasNode);
  }
  
  // Try premium block factory
  const premiumBlock = createPremiumBlock(templateId);
  if (premiumBlock) {
    return {
      id: generateId(),
      label: premiumBlock.label || 'Section',
      layout: 'full-width',
      stacks: [{
        id: generateId(),
        label: 'Main Stack',
        direction: 'vertical',
        blocks: [premiumBlock],
        props: { alignment: 'center' }
      }],
      props: {}
    };
  }
  
  console.warn(`Template not found: ${templateId}`);
  return null;
}
```

---

## Default Content Philosophy

Following Perspective's design principles:

1. **Professional Copy**: No "Lorem ipsum" - use realistic business text
2. **Meaningful Numbers**: Stats that feel real (2,847 not 10,000)
3. **Recognizable Brands**: Ticker mentions Forbes, Inc, TechCrunch
4. **Action-Oriented**: Labels like "Get Started", "Transform", "Limited Time"
5. **Balanced Proportions**: Proper sizing relative to mobile viewport

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/flow-canvas/builder/utils/premiumBlockFactory.ts` | **Create** | Factory for all 7 premium elements |
| `src/flow-canvas/builder/utils/templateConverter.ts` | **Modify** | Add fallback to premium factory |
| `src/flow-canvas/index.css` | **Modify** | Polish premium element styles |

---

## Visual Quality Targets

**Gradient Text**
- Smooth gradient rendering
- Proper line-height for large text
- Centered by default

**Stat Number**
- Tabular numerics for alignment
- Gradient-colored suffix
- Subtle label styling

**Avatar Group**
- Varied gradient backgrounds (not monotone)
- Clean white borders
- Professional shadow

**Ticker**
- Smooth infinite scroll
- Proper letter-spacing
- Pause on hover

**Badge**
- Pill-shaped with icon
- Gradient background
- Uppercase tracking

**Process Step**
- Numbered or icon indicator
- Optional connector line
- Centered alignment

---

## Result

After implementation:
- Clicking any premium element adds a polished, ready-to-use block
- Default content looks professional and Perspective-like
- Elements render identically in editor and published funnel
- All styling is customizable via inspector panel
