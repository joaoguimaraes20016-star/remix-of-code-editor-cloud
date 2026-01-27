

# Block Picker Visual Redesign - Perspective Style Tile Cards

## Current vs Target

| Current Implementation | Perspective Style (Target) |
|----------------------|---------------------------|
| List rows with chevrons | 2-column grid of tile cards |
| Dark builder theme | Light cards with soft colored backgrounds |
| Category navigation first | Direct grid of blocks organized by headers |
| Simple geometric icons | Rich visual icons/previews in cards |
| Click to see subcategory | Click to add directly |

## Visual Target Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│  Core Components                                                │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │     ═══════════       │  │    ┌──────────────────────┐   │   │
│  │     ══════════        │  │    │    Button Text       │   │   │
│  │                       │  │    └──────────────────────┘   │   │
│  │       Text            │  │         Button                │   │
│  └───────────────────────┘  └───────────────────────────────┘   │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │     ┌─────────┐       │  │   ● ═════════════             │   │
│  │     │  📷     │       │  │   ● ═══════════               │   │
│  │     └─────────┘       │  │   ● ════════                  │   │
│  │       Image           │  │         List                  │   │
│  └───────────────────────┘  └───────────────────────────────┘   │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │      ◇                │  │    ■ ▲ ★ ●                    │   │
│  │     ───               │  │                               │   │
│  │      ◇                │  │         Logo Bar              │   │
│  │     Divider           │  │                               │   │
│  └───────────────────────┘  └───────────────────────────────┘   │
│                                                                 │
│  Media Elements                                                 │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │     ┌─────────┐       │  │    ┌───────────────────────┐  │   │
│  │     │   ▶     │       │  │    │  👤  Quote text...    │  │   │
│  │     └─────────┘       │  │    └───────────────────────┘  │   │
│  │       Video           │  │       Testimonial             │   │
│  └───────────────────────┘  └───────────────────────────────┘   │
│                                                                 │
│  Embed Blocks                                                   │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │       📅              │  │          ⬚                    │   │
│  │    Calendar           │  │                               │   │
│  │                       │  │        HTML                   │   │
│  └───────────────────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Block Categories & Cards

### Core Components (8 cards)
| Block | Icon Description | Background Color |
|-------|------------------|------------------|
| Text | Gray text lines | `bg-gray-50` |
| Button | Blue rounded button | `bg-blue-50` |
| Image | Photo placeholder | `bg-gray-50` |
| List | Bullet points | `bg-purple-50` |
| Divider | Up/down arrows with line | `bg-gray-50` |
| Logo Bar | Colored shapes (square, triangle, star, circle) | `bg-yellow-50` |
| Reviews | Star rating + avatars | `bg-yellow-50` |
| Spacer | Vertical arrows | `bg-gray-50` |

### Media Elements (4 cards)
| Block | Icon Description | Background Color |
|-------|------------------|------------------|
| Video | Video player with play button | `bg-gray-50` |
| Testimonial | Quote card with avatar | `bg-orange-50` |
| FAQ | Accordion lines | `bg-green-50` |
| Team | Person avatar | `bg-blue-50` |

### Embed Blocks (3 cards)
| Block | Icon Description | Background Color |
|-------|------------------|------------------|
| Calendar | Calendar icon | `bg-blue-50` |
| Custom Embed | Code brackets | `bg-gray-50` |
| Form | Input fields | `bg-green-50` |

---

## Technical Implementation

### 1. Create New BlockTileCard Component

A new card component with:
- Soft colored background (tailwind colors like `bg-blue-50`, `bg-yellow-50`)
- Rich visual icon in the center
- Block name below the icon
- Click to add directly

```tsx
interface BlockTileCardProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  bgColor: string;
  onAdd: () => void;
}
```

### 2. Define Block Grid Items

New configuration array with visual details:

```tsx
const CORE_COMPONENTS = [
  { id: 'text', name: 'Text', bgColor: 'bg-gray-50', icon: <TextIcon /> },
  { id: 'button', name: 'Button', bgColor: 'bg-blue-50', icon: <ButtonIcon /> },
  { id: 'image', name: 'Image', bgColor: 'bg-gray-50', icon: <ImageIcon /> },
  { id: 'list', name: 'List', bgColor: 'bg-purple-50', icon: <ListIcon /> },
  { id: 'divider', name: 'Divider', bgColor: 'bg-gray-50', icon: <DividerIcon /> },
  { id: 'logo-bar', name: 'Logo Bar', bgColor: 'bg-yellow-50', icon: <LogoBarIcon /> },
  { id: 'reviews', name: 'Reviews', bgColor: 'bg-yellow-50', icon: <ReviewsIcon /> },
];

const MEDIA_ELEMENTS = [
  { id: 'video', name: 'Video', bgColor: 'bg-gray-50', icon: <VideoIcon /> },
  { id: 'testimonial', name: 'Testimonial', bgColor: 'bg-orange-50', icon: <TestimonialIcon /> },
  { id: 'faq', name: 'FAQ', bgColor: 'bg-green-50', icon: <FAQIcon /> },
];

const EMBED_BLOCKS = [
  { id: 'calendar', name: 'Calendar', bgColor: 'bg-blue-50', icon: <CalendarIcon /> },
  { id: 'html', name: 'HTML', bgColor: 'bg-gray-50', icon: <HTMLIcon /> },
];
```

### 3. Create Visual Block Icons

Each icon will be a small SVG/component that visually represents the block:

**Text Icon:**
```tsx
// Gray horizontal lines representing text
<div className="flex flex-col gap-1 items-center">
  <div className="w-12 h-1.5 bg-slate-400 rounded-full" />
  <div className="w-16 h-3 bg-slate-600 rounded" />
  <div className="w-14 h-3 bg-slate-500 rounded" />
</div>
```

**Button Icon:**
```tsx
// Blue rounded button shape
<div className="px-6 py-2 bg-blue-500 rounded-lg text-white text-xs font-medium">
  Button
</div>
```

**List Icon:**
```tsx
// Bullet points with lines
<div className="flex flex-col gap-1">
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-purple-500 rounded-full" />
    <div className="w-12 h-1.5 bg-slate-400 rounded" />
  </div>
  {/* ... more rows */}
</div>
```

**Logo Bar Icon:**
```tsx
// Colorful shapes
<div className="flex items-center gap-2">
  <div className="w-4 h-4 bg-purple-500 rounded" />
  <div className="w-4 h-4 bg-green-500 rotate-45" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
  <Star size={16} className="text-yellow-500 fill-yellow-500" />
  <div className="w-4 h-4 bg-blue-500 rounded-full" />
</div>
```

### 4. Update SectionPicker to Use Grid Layout

When "Basic blocks" category is selected, show the tile grid instead of template previews:

```tsx
// In SectionPicker.tsx
if (activeCategory === 'content' || activeCategory === 'cta') {
  return (
    <div className="p-6 overflow-y-auto">
      {/* Core Components */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Core Components</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {CORE_COMPONENTS.map(block => (
          <BlockTileCard key={block.id} {...block} onAdd={() => handleAddBlock(block.id)} />
        ))}
      </div>
      
      {/* Media Elements */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Media Elements</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {MEDIA_ELEMENTS.map(block => (
          <BlockTileCard key={block.id} {...block} onAdd={() => handleAddBlock(block.id)} />
        ))}
      </div>
      
      {/* Embed Blocks */}
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Embed Blocks</h3>
      <div className="grid grid-cols-2 gap-3">
        {EMBED_BLOCKS.map(block => (
          <BlockTileCard key={block.id} {...block} onAdd={() => handleAddBlock(block.id)} />
        ))}
      </div>
    </div>
  );
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/flow-canvas/builder/components/SectionPicker/BlockTileCard.tsx` | Tile card component |
| `src/flow-canvas/builder/components/SectionPicker/BlockIcons.tsx` | Visual icon components |
| `src/flow-canvas/builder/components/SectionPicker/BlockGrid.tsx` | Grid layout with categories |

## Files to Modify

| File | Changes |
|------|---------|
| `SectionPicker.tsx` | Render BlockGrid for block categories, keep TemplateGallery for sections |
| `sectionTemplates.ts` | Add block template definitions |

---

## Visual Style Details

### Card Styling
```css
.block-tile-card {
  /* Size */
  aspect-ratio: 1;
  padding: 24px;
  
  /* Background - soft pastel */
  background: var(--card-bg-color);
  border-radius: 16px;
  
  /* Hover */
  transition: transform 0.15s, box-shadow 0.15s;
}

.block-tile-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
```

### Color Palette
| Color Name | Tailwind Class | Usage |
|------------|----------------|-------|
| Gray | `bg-gray-50` | Text, Image, Divider, Spacer |
| Blue | `bg-blue-50` | Button, Calendar, Team |
| Purple | `bg-purple-50` | List |
| Yellow | `bg-yellow-50` | Logo Bar, Reviews |
| Orange | `bg-orange-50` | Testimonial |
| Green | `bg-green-50` | FAQ, Form |

---

## Result

After this change:

| Before | After |
|--------|-------|
| Category list with chevrons | Visual tile grid |
| Click to see templates | Click to add directly |
| Dark theme | Light cards with soft colors |
| No visual preview | Rich icons in each card |
| Flat category structure | Group headers (Core, Media, Embed) |

