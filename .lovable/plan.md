
# Make Section Templates Display Like Perspective

## Summary

Currently, section templates use element types like `logo_bar`, `rating_display`, `feature_list`, and `faq_accordion` that aren't properly recognized by the template converter or rendered by CanvasRenderer. This causes templates to display incorrectly or with placeholder content.

This plan upgrades the rendering pipeline to create polished, Perspective-style displays for all section template elements.

---

## Problem Analysis

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Current Data Flow (Broken)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Section Template                Template Converter                 │
│  ┌─────────────────┐            ┌─────────────────┐                │
│  │ type: logo_bar  │ ─────────> │ maps to: text   │ ─> Wrong!      │
│  │ type: rating_   │            │                 │                │
│  │   display       │            │ (unrecognized)  │                │
│  └─────────────────┘            └─────────────────┘                │
│                                                                     │
│                                        │                            │
│                                        ▼                            │
│                               CanvasRenderer                        │
│                               ┌─────────────────┐                   │
│                               │ case 'text':    │                   │
│                               │   render plain  │ ─> No visual!    │
│                               │   text (wrong)  │                   │
│                               └─────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Solution Overview

### 1. Update Template Converter Mappings

Add proper element type recognition for all template-specific node types:

| Node Type | Should Map To | Description |
|-----------|---------------|-------------|
| `logo_bar` | `logo-bar` | Company logo strip |
| `rating_display` | `rating-display` | Star rating with count |
| `feature_list` | `feature-list` | Icon + text features |
| `faq_accordion` | `faq-accordion` | Collapsible Q&A |
| `testimonial_card` | `testimonial` | Quote with avatar |
| `form_group` | `form-group` | Multi-field form |

### 2. Add Canvas Renderer Cases

Create high-fidelity visual rendering for each element type:

**Logo Bar (Perspective-style)**
- Grayscale logos with hover color effect
- Smooth marquee animation option
- Proper spacing and alignment

**Rating Display (Perspective-style)**
- Overlapping avatar group
- Gold star rating with gradient
- "4.8 from 148 reviews" format

**Feature List (Perspective-style)**
- Colored icon circles
- Bold titles with descriptions
- Consistent spacing

### 3. Enhance CSS Styling

Add/refine premium CSS classes for polished animations and effects.

---

## File Changes

### 1. Template Converter (`src/flow-canvas/builder/utils/templateConverter.ts`)

**Add new element type mappings:**

```typescript
function mapNodeTypeToElementType(nodeType: string): ElementType {
  const mapping: Record<string, ElementType> = {
    // Existing mappings...
    'heading': 'heading',
    'paragraph': 'text',
    'cta_button': 'button',
    'image': 'image',
    
    // NEW: Template-specific element types
    'logo_bar': 'logo-bar',
    'rating_display': 'rating-display',
    'feature_list': 'feature-list',
    'faq_accordion': 'faq-accordion',
    'testimonial_card': 'testimonial',
    'form_group': 'form-group',
    'form_input': 'input',
  };
  return mapping[nodeType] || 'text';
}
```

**Update element type recognition:**

```typescript
function isElementType(nodeType: string): boolean {
  const elementTypes = [
    // Existing...
    'heading', 'paragraph', 'cta_button', 'image',
    
    // NEW
    'logo_bar', 'rating_display', 'feature_list',
    'faq_accordion', 'testimonial_card', 'form_group', 'form_input'
  ];
  return elementTypes.includes(nodeType);
}
```

---

### 2. Canvas Renderer (`src/flow-canvas/builder/components/CanvasRenderer.tsx`)

**Add rendering case for `logo-bar`:**

Perspective-style logo bar with:
- Text-based logo placeholders (e.g., "Zalando", "Braun", "IKEA")
- Grayscale by default, color on hover
- Proper spacing and alignment

**Add rendering case for `rating-display`:**

Perspective-style rating with:
- Avatar group (4 overlapping circles)
- 5 gold stars
- "4.8 from 148 reviews" text

**Add rendering case for `feature-list`:**

Professional feature cards with:
- Colored icon containers
- Bold title + description
- Consistent spacing

---

### 3. CSS Enhancements (`src/flow-canvas/index.css`)

**Logo Bar Styling:**

```css
.perspective-logo-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 16px 0;
}

.perspective-logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.2s ease;
}

.perspective-logo:hover {
  color: rgba(0, 0, 0, 0.8);
}
```

**Rating Display Styling:**

```css
.perspective-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.perspective-stars {
  display: flex;
  gap: 2px;
}

.perspective-star {
  color: #FACC15;
  fill: #FACC15;
}

.perspective-rating-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
```

---

## Visual Quality Targets

### Logo Bar
- Clean typography matching Perspective's wordmarks
- Proper opacity (40% base, 80% hover)
- Consistent 32px gap
- Optional grayscale mode

### Rating Display
- Overlapping avatars (4 circles, -8px overlap)
- Gold star icons (not yellow - #FACC15)
- Professional text formatting ("4.8 from 148 reviews")
- Centered layout

### Images in Templates
- Proper aspect ratio containers
- Placeholder styling when no image set
- Rounded corners matching Perspective

---

## Implementation Order

1. **Update templateConverter.ts** - Add all node type mappings
2. **Add CanvasRenderer cases** - Rating display, logo bar, feature list
3. **Enhance CSS** - Perspective-style classes
4. **Test all templates** - Verify each category renders correctly

---

## Result

After implementation:
- Hero + Reviews template shows avatars, stars, and rating text
- Hero + Logos template shows clean wordmark-style logos
- All section templates render with Perspective-quality visuals
- Consistent styling between editor and published funnel
