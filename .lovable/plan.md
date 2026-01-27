

# Simplify Section Picker - Match Perspective's Clean Style

## Current vs Target

| Current Issues | Perspective Style |
|----------------|-------------------|
| 10 categories with descriptions | Clean labels only, no descriptions |
| Template count badges | No counts - just chevrons for expandable |
| Varied icons | Simple, consistent icon squares |
| No grouping headers | "Sections" header to group categories |
| Dark builder theme | Light/clean white panel |

## Visual Target

```text
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   ┌─────┐                                                              │
│   │  T  │  Basic blocks                                          ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ✦  │  Interactive blocks                                    ›    │
│   └─────┘                                                              │
│                                                                        │
│   ───────────────────────────────────────────────────────────────────  │
│   Sections                                                             │
│   ───────────────────────────────────────────────────────────────────  │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ■  │  Hero                                                  ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ▪  │  Product                                               ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ═  │  Call to action                                        ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ■  │  About us                                              ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ▪▪ │  Quiz                                                  ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ▪■ │  Team                                                  ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ═  │  Testimonials                                          ›    │
│   └─────┘                                                              │
│                                                                        │
│   ┌─────┐                                                              │
│   │  ▪■ │  Trust                                                 ›    │
│   └─────┘                                                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## New Category Structure

Simplify from 10 to 8 categories that match common funnel needs:

| Category | Icon Style | Description (internal only) |
|----------|------------|----------------------------|
| **Basic blocks** | "T" letter | Text, heading, spacer |
| **Interactive blocks** | Sparkles | Buttons, forms, inputs |
| **Hero** | Solid square | Opening sections |
| **Features** | Small squares grid | Benefits, lists |
| **Call to action** | Horizontal bars | Conversion CTAs |
| **Quiz** | Grid squares | Single/multi choice |
| **Team** | Person squares | About, founder |
| **Testimonials** | Quote bars | Customer quotes |
| **Trust** | Grid squares | Logos, ratings, proof |

---

## Implementation Changes

### 1. Update SectionPicker.tsx - Clean Panel Design

**Changes:**
- Remove description text from category items
- Remove template count badges
- Add "Sections" group header
- Use consistent icon squares (rounded, light fill)
- Light background instead of dark builder surface
- Clean chevron arrows

### 2. Category Icon Components

Create simple, consistent icon squares:

```tsx
// Simple icon square component
function CategoryIcon({ icon }: { icon: string }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
      {/* Simple icon representation */}
    </div>
  );
}
```

### 3. Simplified Category Row

```tsx
// Clean row without descriptions or counts
<button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50">
  <CategoryIcon icon={category.icon} />
  <span className="flex-1 text-sm font-medium text-gray-900">
    {category.label}
  </span>
  <ChevronRight size={16} className="text-gray-400" />
</button>
```

---

## File Changes

### SectionPicker.tsx - Full Restructure

```tsx
// Simplified category config - NO descriptions
const BLOCK_CATEGORIES = [
  { id: 'basic', label: 'Basic blocks', icon: 'T' },
  { id: 'interactive', label: 'Interactive blocks', icon: 'sparkles' },
];

const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' },
  { id: 'features', label: 'Features', icon: 'grid' },
  { id: 'cta', label: 'Call to action', icon: 'bars' },
  { id: 'quiz', label: 'Quiz', icon: 'squares' },
  { id: 'team', label: 'Team', icon: 'people' },
  { id: 'testimonials', label: 'Testimonials', icon: 'bars' },
  { id: 'trust', label: 'Trust', icon: 'grid' },
];
```

**Visual Structure:**
```text
Left Panel (Clean White):
├── Basic blocks → Basic elements
├── Interactive blocks → Forms, buttons
├── ─────────────────────
├── Sections (header)
├── ─────────────────────
├── Hero
├── Features
├── Call to action
├── Quiz
├── Team
├── Testimonials
└── Trust

Right Panel (Template Gallery):
├── Header with category name
└── Grid of visual preview cards
```

---

## Key Style Differences

| Current | New (Perspective-style) |
|---------|------------------------|
| Dark builder-surface background | Clean white/light gray |
| 18px complex Lucide icons | Simple 10x10 filled rectangles |
| Description text under label | Label only |
| Template count badges | Clean chevron only |
| No grouping | "Sections" header divider |
| Accent color active states | Subtle blue highlight |

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `SectionPicker.tsx` | Complete visual overhaul - light theme, simplified items, grouping header |

### New Icon Style

Instead of complex Lucide icons, use simple SVG shapes that match Perspective:

```tsx
// Hero icon - solid square
<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
  <div className="w-5 h-5 rounded bg-blue-400" />
</div>

// Quiz icon - 4 small squares
<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
  <div className="grid grid-cols-2 gap-0.5">
    <div className="w-2 h-2 rounded-sm bg-blue-400" />
    <div className="w-2 h-2 rounded-sm bg-blue-400" />
    <div className="w-2 h-2 rounded-sm bg-blue-400" />
    <div className="w-2 h-2 rounded-sm bg-blue-400" />
  </div>
</div>

// CTA icon - horizontal bars
<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
  <div className="flex flex-col gap-0.5">
    <div className="w-5 h-1.5 rounded bg-blue-400" />
    <div className="w-3 h-1.5 rounded bg-blue-400" />
  </div>
</div>
```

---

## Result

After this change, the section picker will:

1. Match Perspective's clean, simple aesthetic
2. Remove visual clutter (descriptions, counts)
3. Have clear grouping (Blocks vs Sections)
4. Use consistent, simple icon style
5. Feel lighter and more approachable
6. Still show rich previews in the right panel when a category is selected

