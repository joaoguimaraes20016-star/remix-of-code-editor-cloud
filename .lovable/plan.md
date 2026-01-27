

# Remove FAQ from Section Categories

## Summary

FAQ should not be listed as a section category in the SectionPicker. FAQ is an interactive block (accordion-style Q&A component), not a full-page section template like Hero, Features, or Team.

---

## Current Issue

In `SectionPicker.tsx` line 42:
```tsx
const SECTION_CATEGORIES = [
  // ... other sections
  { id: 'faq', label: 'FAQ', icon: 'bars' as const },  // ← This should be removed
];
```

FAQ currently shows as a section but has no templates (shows "No templates in this category" when clicked), because it's actually handled in the Interactive Blocks grid.

---

## Fix

### File: `src/flow-canvas/builder/components/SectionPicker/SectionPicker.tsx`

Remove the FAQ entry from `SECTION_CATEGORIES`:

**Before (lines 33-43):**
```tsx
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta', label: 'Call to Action', icon: 'sparkles' as const },
  { id: 'about_us', label: 'About Us', icon: 'squares' as const },
  { id: 'quiz_form', label: 'Quiz/Form', icon: 'sparkles' as const },
  { id: 'team', label: 'Team', icon: 'people' as const },
  { id: 'testimonials', label: 'Testimonials', icon: 'quote' as const },
  { id: 'social_proof', label: 'Trust', icon: 'grid' as const },
  { id: 'faq', label: 'FAQ', icon: 'bars' as const },
] as const;
```

**After:**
```tsx
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta', label: 'Call to Action', icon: 'sparkles' as const },
  { id: 'about_us', label: 'About Us', icon: 'squares' as const },
  { id: 'quiz_form', label: 'Quiz/Form', icon: 'sparkles' as const },
  { id: 'team', label: 'Team', icon: 'people' as const },
  { id: 'testimonials', label: 'Testimonials', icon: 'quote' as const },
  { id: 'social_proof', label: 'Trust', icon: 'grid' as const },
] as const;
```

---

## Result

- FAQ removed from section categories list
- Users can still add FAQ blocks via "Interactive blocks" category
- Clean section list with only actual section templates

