
# Premium Visual Section Picker - Perspective-Style Upgrade

## Overview
Transform the current element/section picker into a high-fidelity, Perspective-style experience with rich visual previews, a two-panel layout, and design language optimized for high-ticket coaching funnels.

---

## Current State Analysis

### What Exists Today
1. **BlockPickerPanel.tsx** (~2259 lines) - Main picker with Content/Sections tabs
2. **SectionThumbnail.tsx** - Mini visual previews for grid view (320 lines)
3. **InlineSectionPicker.tsx** - Centered popover with category → template drill-down
4. **TemplatePreviewCard.tsx** (builder_v2) - Card component with hover overlay

### Issues with Current Implementation
- Thumbnails are abstract/schematic (tiny colored rectangles)
- No realistic "high-ticket coaching" aesthetic in previews
- Categories use collapsible accordions instead of persistent side navigation
- Templates show as a flat list, not a visual gallery
- No preview pane showing what you're about to add

---

## Target Experience (Based on Perspective Screenshot)

```text
┌────────────────────────────────────────────────────────────────────┐
│  Add Section                                                   [×] │
├──────────────────┬─────────────────────────────────────────────────┤
│                  │                                                 │
│  Basic blocks    │   ┌─────────────────┐  ┌─────────────────┐     │
│                  │   │  Real-Time      │  │  Premium        │     │
│  Interactive ▸   │   │  Analytics      │  │  Customer       │     │
│                  │   │  [Preview]      │  │  Service        │     │
│  ─────────────   │   │  ★★★★★         │  │  [Preview]      │     │
│  Sections        │   │  Learn more     │  │  ★★★★★ 200+    │     │
│  ─────────────   │   └─────────────────┘  └─────────────────┘     │
│  Hero        ▸   │                                                 │
│  Product         │   ┌─────────────────┐  ┌─────────────────┐     │
│  Call to Action  │   │  Exclusive      │  │  Your Advantages│     │
│  About us        │   │  Market         │  │  [3-col grid]   │     │
│  Quiz            │   │  Analyses       │  │                 │     │
│  Team            │   │  [Preview]      │  └─────────────────┘     │
│  Testimonials    │   └─────────────────┘                          │
│  Trust           │                                                 │
│                  │                                                 │
└──────────────────┴─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: New UI Layout Component
**Create `PerspectiveSectionPicker.tsx`**

A new two-panel layout replacing the current collapsible accordion approach:

**Left Panel (Categories)**
- Vertical list of categories with icons
- Hover/active states with accent highlight
- Separator between "Basic Blocks" and "Sections"
- Chevron indicators for expandable sub-categories

**Right Panel (Template Gallery)**
- 2-column grid of visual preview cards
- Rich preview showing actual section layout
- Template name + description overlay
- Hover: subtle scale + accent border + "Add" CTA

```typescript
// New component structure
interface PerspectiveSectionPickerProps {
  onAddTemplate: (template: SectionTemplate | BlockTemplate) => void;
  onClose: () => void;
  defaultCategory?: string;
}
```

---

### Phase 2: High-Fidelity Preview Cards
**Create `HighTicketPreviewCard.tsx`**

Rich visual previews that look like actual coaching funnels:

```typescript
interface HighTicketPreviewCardProps {
  template: SectionTemplate | BlockTemplate;
  onAdd: () => void;
}
```

**Preview Designs by Category:**

| Category | Preview Elements |
|----------|------------------|
| Hero | Dark gradient bg, large headline placeholder, subtext, CTA button |
| Product | Split layout: image placeholder left, text + button right |
| Call to Action | Gradient banner, centered text, prominent button |
| Testimonial | Quote marks, avatar circle, name caption |
| Pricing | Card with price, feature checkmarks, CTA |
| Features | 3-column icon grid with labels |
| FAQ | Accordion-style expandable items |
| Trust | Star rating + review count + logo bar |

**Coaching-Specific Styling:**
- Dark backgrounds with gradient overlays
- Premium gold/emerald accents
- Professional sans-serif typography placeholders
- Star ratings + social proof indicators
- "Limited Spots" / "Exclusive" badge overlays

---

### Phase 3: Enhanced SectionThumbnail Component
**Upgrade `SectionThumbnail.tsx`**

Transform from abstract shapes to realistic mini-layouts:

```typescript
// New thumbnail design principles:
// 1. Dark mode default (matches coaching aesthetic)
// 2. Gradient backgrounds (purple → blue, gold → orange)
// 3. Realistic content placeholders
// 4. Premium badges and trust indicators
// 5. Proper typography hierarchy
```

**Before:**
```tsx
// Current (abstract)
<div className="h-2 w-16 bg-white/90 rounded" />
<div className="h-1 w-12 bg-white/40 rounded" />
```

**After:**
```tsx
// New (realistic)
<div className="bg-gradient-to-br from-slate-900 to-slate-800 p-3">
  <div className="h-3 w-20 bg-gradient-to-r from-white to-white/80 rounded" />
  <div className="h-1.5 w-24 bg-white/40 rounded mt-1" />
  <div className="mt-2 flex items-center gap-1">
    <div className="h-2 w-2 rounded-full bg-emerald-400" />
    <div className="h-1 w-12 bg-white/30 rounded" />
  </div>
  <div className="h-4 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded mt-2" />
</div>
```

---

### Phase 4: Category Navigation with Icons
**New category configuration:**

```typescript
const SECTION_CATEGORIES = [
  { id: 'basic', label: 'Basic Blocks', icon: Type, divider: false },
  { id: 'interactive', label: 'Interactive Blocks', icon: Sparkles, divider: true },
  // --- Sections divider ---
  { id: 'hero', label: 'Hero', icon: Layout, divider: false },
  { id: 'product', label: 'Product', icon: Package, divider: false },
  { id: 'cta', label: 'Call to Action', icon: MousePointerClick, divider: false },
  { id: 'about', label: 'About Us', icon: Users, divider: false },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, divider: false },
  { id: 'team', label: 'Team', icon: Users, divider: false },
  { id: 'testimonials', label: 'Testimonials', icon: Quote, divider: false },
  { id: 'trust', label: 'Trust', icon: Star, divider: false },
];
```

---

### Phase 5: Preview Gallery Grid
**Right panel rendering:**

```tsx
<div className="grid grid-cols-2 gap-4 p-4 overflow-y-auto">
  {templatesForCategory.map((template) => (
    <HighTicketPreviewCard
      key={template.id}
      template={template}
      onAdd={() => handleAddTemplate(template)}
    />
  ))}
</div>
```

**Card interactions:**
- Hover: `scale-[1.02]`, border glow, opacity overlay with "Add" button
- Click: Add template + close picker
- Keyboard: Focus-visible ring, Enter to add

---

### Phase 6: Integration Points

**Update BlockPickerPanel.tsx:**
- Add toggle/feature flag to switch between old and new picker
- Eventually deprecate old collapsible approach

**Update InlineSectionPicker.tsx:**
- Make it a wrapper that opens the new PerspectiveSectionPicker
- Keep the popover trigger behavior

**CSS Updates (EditorLayout.css):**
```css
/* Premium preview cards */
.premium-preview-card {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, hsl(220 20% 10%) 0%, hsl(220 20% 15%) 100%);
  border: 2px solid hsl(220 10% 20%);
  transition: all 0.2s ease;
}

.premium-preview-card:hover {
  border-color: var(--builder-accent);
  transform: scale(1.02);
  box-shadow: 0 8px 24px hsl(0 0% 0% / 0.3);
}

.premium-preview-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, hsl(0 0% 0% / 0.8) 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.premium-preview-card:hover .premium-preview-card-overlay {
  opacity: 1;
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/flow-canvas/builder/components/PerspectiveSectionPicker.tsx` | **CREATE** - New two-panel picker |
| `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` | **CREATE** - Rich preview cards |
| `src/flow-canvas/builder/components/SectionThumbnail.tsx` | **MODIFY** - Upgrade to realistic previews |
| `src/flow-canvas/builder/components/BlockPickerPanel.tsx` | **MODIFY** - Integrate new picker |
| `src/builder_v2/EditorLayout.css` | **MODIFY** - Add premium card styles |

---

## Technical Details

### HighTicketPreviewCard Rendering Logic

```typescript
function HighTicketPreviewCard({ template, onAdd }: Props) {
  const getPreviewContent = () => {
    switch (template.category || template.type) {
      case 'hero':
        return <HeroPreview hasButton={...} hasVideo={...} />;
      case 'product':
        return <ProductPreview layout="split" />;
      case 'cta':
        return <CTAPreview variant={template.id} />;
      case 'testimonial':
        return <TestimonialPreview />;
      case 'pricing':
        return <PricingPreview cards={...} />;
      case 'features':
        return <FeaturesPreview layout="grid" />;
      case 'faq':
        return <FAQPreview />;
      case 'trust':
        return <TrustPreview />;
      default:
        return <GenericPreview />;
    }
  };

  return (
    <button onClick={onAdd} className="premium-preview-card group">
      <div className="preview-content">
        {getPreviewContent()}
      </div>
      <div className="premium-preview-card-overlay">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-white font-medium text-sm">{template.name || template.label}</span>
          <p className="text-white/60 text-xs">{template.description}</p>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
}
```

---

## Expected Outcomes

1. **Premium Visual Experience**: Preview cards that look like actual high-ticket coaching funnels
2. **Efficient Navigation**: Two-panel layout for quick category switching
3. **Clear Mental Model**: Users see exactly what they're adding before clicking
4. **High-Ticket Aesthetic**: Dark gradients, premium badges, professional typography
5. **Pixel-Perfect Parity**: Previews match actual rendered sections

---

## Design Tokens for Coaching Aesthetic

```css
/* Premium coaching palette */
--coaching-dark: hsl(220 20% 8%);
--coaching-surface: hsl(220 15% 12%);
--coaching-border: hsl(220 10% 20%);
--coaching-gold: hsl(45 90% 55%);
--coaching-emerald: hsl(160 70% 45%);
--coaching-accent: hsl(220 80% 60%);
--coaching-text: hsl(0 0% 95%);
--coaching-muted: hsl(0 0% 60%);
```
