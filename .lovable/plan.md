

# Phase 14: Add Sections Categories to v3 SectionPicker

## The Problem

The v3 `SectionPicker` only has **Blocks** (Content, Inputs & Forms), but is missing the entire **Sections** category that exists in the original builder:

| Missing Categories | Purpose |
|-------------------|---------|
| Hero | Landing page hero sections |
| Features | Feature grids and showcases |
| Call to Action | CTA sections with buttons/forms |
| About Us | About/contact sections |
| Quiz/Form | Quiz and form layouts |
| Team | Team member displays |
| Testimonials | Social proof and reviews |
| Trust | Trust badges and logos |

## Solution

Port the complete `SectionPicker.tsx` from `flow-canvas` to `funnel-builder-v3`, including:
1. The `SECTION_CATEGORIES` array
2. The "Sections" divider in the left nav
3. The template gallery for section categories
4. The `HighTicketPreviewCard` component for rich template previews

---

## Files to Create

### `src/funnel-builder-v3/components/HighTicketPreviewCard.tsx`
Copy from `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` - this provides the rich visual preview cards (1800+ lines of visual mockups for Hero, CTA, About, Quiz, Team, Testimonials, Trust sections).

---

## Files to Modify

### `src/funnel-builder-v3/components/SectionPicker/SectionPicker.tsx`

Add the missing pieces:

```typescript
// Add SECTION_CATEGORIES constant
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta', label: 'Call to Action', icon: 'sparkles' as const },
  { id: 'about_us', label: 'About Us', icon: 'squares' as const },
  { id: 'quiz_form', label: 'Quiz/Form', icon: 'sparkles' as const },
  { id: 'team', label: 'Team', icon: 'people' as const },
  { id: 'testimonials', label: 'Testimonials', icon: 'quote' as const },
  { id: 'social_proof', label: 'Trust', icon: 'grid' as const },
];

// Import section templates and preview card
import { allSectionTemplates } from '@/builder_v2/templates/sectionTemplates';
import { HighTicketPreviewCard } from '../HighTicketPreviewCard';

// Add getTemplatesForCategory function
function getTemplatesForCategory(categoryId: string) {
  return allSectionTemplates.filter(
    t => t.category === categoryId && !t.name.includes('(Legacy)')
  );
}
```

**Left Panel Changes:**
- Add "Sections" divider after Blocks
- Render section category buttons with template counts
- Disable categories with 0 templates

**Right Panel Changes:**
- When a section category is selected, render `HighTicketPreviewCard` grid instead of block grid
- Show template count in the header

---

## Visual Layout

```text
┌─────────────────────────────────────────────────────┐
│ BLOCKS                                              │
│ ├─ Content (Display only) ─────────────────> Tiles  │
│ └─ Inputs & Forms (Collects data) ─────────> Tiles  │
│                                                     │
│ ───────────── Sections ─────────────                │
│                                                     │
│ ├─ Hero ───────────────────────────> Preview Cards  │
│ ├─ Features ───────────────────────> Preview Cards  │
│ ├─ Call to Action ─────────────────> Preview Cards  │
│ ├─ About Us ───────────────────────> Preview Cards  │
│ ├─ Quiz/Form ──────────────────────> Preview Cards  │
│ ├─ Team ───────────────────────────> Preview Cards  │
│ ├─ Testimonials ───────────────────> Preview Cards  │
│ └─ Trust ──────────────────────────> Preview Cards  │
└─────────────────────────────────────────────────────┘
```

---

## Technical Details

### Template Category Mapping

The `sectionTemplates.ts` file contains templates with `category` fields:
- `hero` → hero-simple, hero-reviews, hero-logos, hero-split, etc.
- `cta` → cta-simple, cta-gray-card, cta-dark-reviews, etc.
- `about_us` → about-split-icons, about-split-faq, etc.
- `quiz_form` → quiz-split-benefits, quiz-centered-simple, etc.
- `team` → team-simple, team-cards, etc.
- `testimonials` → testimonial-single, testimonial-cards, etc.
- `social_proof` → trust-logos, trust-badges, etc.

### Integration Flow

```text
User clicks "Hero" category
       ↓
getTemplatesForCategory('hero') returns 8 templates
       ↓
Render HighTicketPreviewCard for each template
       ↓
User clicks a template card
       ↓
onSelectBlock('hero-simple') called
       ↓
Editor.tsx handles mapping to v3 blocks
```

---

## Files Summary

| File | Action |
|------|--------|
| `HighTicketPreviewCard.tsx` | Create (copy from flow-canvas) |
| `SectionPicker.tsx` | Modify (add SECTION_CATEGORIES, divider, template gallery) |
| `index.ts` | Update (export HighTicketPreviewCard) |

---

## Success Criteria

1. Left panel shows "Sections" divider below Blocks
2. All 8 section categories visible with icons
3. Clicking a section category shows rich preview cards
4. Template count displayed for each category
5. Clicking a preview card triggers block creation
6. Empty categories show disabled state

