

# Change Media to CTA - Perspective-Style Templates

## Summary

Replace the current "Media" section category with an expanded "CTA" category containing 10+ Perspective-style Call-to-Action templates matching the reference screenshots.

## Reference Analysis

From the uploaded screenshots, I identified **10 distinct CTA template patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **CTA Form Split (Reviews)** | 50/50 | Title + avatars + reviews left, form card right |
| **CTA Form Split (Simple)** | 50/50 | Title + subtext left, form card right |
| **CTA Simple** | Centered | Title + subtext + single button |
| **CTA Gray Card** | Centered | Gray background card with title + subtext + button |
| **CTA Dark (Reviews)** | Centered | Dark bg + avatars + stars + "Over 200 customers" + title + button |
| **CTA Dark Card** | Centered | Dark bg with inset gray card + avatars + button |
| **CTA Gradient + Logos** | Centered | Gradient bg + title + button + logo bar below |
| **CTA Split Form** | 50/50 | Light bg, title left + form with privacy note right |
| **CTA + FAQ** | 50/50 | Title left + FAQ accordion right with "non-binding" badge |

---

## Changes

### 1. Update `SectionPicker.tsx`

Remove "Media" from `SECTION_CATEGORIES` - the media elements (video/image) are already in Basic Blocks. Change the section to show the expanded CTA templates.

| Before | After |
|--------|-------|
| `{ id: 'media', label: 'Media', icon: 'bars' }` | Remove this line |

Add CTA to SECTION_CATEGORIES (not just BLOCK_CATEGORIES):

```typescript
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta-sections', label: 'Call to Action', icon: 'sparkles' as const }, // NEW
  { id: 'embed', label: 'Embed', icon: 'squares' as const },
  // ... rest
];
```

### 2. Update `sectionTemplates.ts`

Replace 3 basic CTA templates + 2 Media templates with 10 Perspective-style CTA templates:

| Old Templates | New Templates |
|---------------|---------------|
| `cta-simple` | `cta-simple` (redesigned) |
| `cta-urgency` | `cta-gray-card` |
| `cta-dual` | `cta-dark-reviews` |
| `media-video` | Move to basic blocks |
| `media-image` | Move to basic blocks |
| NEW | `cta-dark-card` |
| NEW | `cta-gradient-logos` |
| NEW | `cta-form-split-reviews` |
| NEW | `cta-form-split-simple` |
| NEW | `cta-split-form` |
| NEW | `cta-faq` |

### 3. Update `HighTicketPreviewCard.tsx`

Replace the old `CTAPreview` with new Perspective-style previews:

```typescript
const CTAPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // CTA Simple - White centered
    if (variant === 'simple') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-32 bg-slate-300 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded mt-2" />
        </div>
      );
    }
    
    // CTA Gray Card
    if (variant === 'gray-card') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-50 p-3 flex items-center justify-center">
          <div className="bg-white rounded-lg p-3 border border-slate-100 flex flex-col items-center gap-1.5">
            <div className="h-2 w-24 bg-slate-800 rounded" />
            <div className="h-1 w-28 bg-slate-300 rounded" />
            <div className="h-4 w-16 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // CTA Dark with Reviews
    if (variant === 'dark-reviews') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-800 p-3 flex flex-col items-center justify-center gap-1.5">
          <AvatarStack />
          <StarRating />
          <div className="text-[5px] text-white/60">Over 200 satisfied customers</div>
          <div className="h-2.5 w-28 bg-white rounded" />
          <div className="h-1.5 w-32 bg-white/40 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded mt-1" />
        </div>
      );
    }
    
    // ... additional variants
  }
);
```

---

## New CTA Template Definitions

### CTA Simple (Centered)
```text
┌────────────────────────────────────────┐
│                                        │
│   Get your exclusive discount now!     │
│   Take advantage of our limited...     │
│                                        │
│         [Get Discount Now]             │
│                                        │
└────────────────────────────────────────┘
```

### CTA Gray Card
```text
┌────────────────────────────────────────┐
│ [Slate-50 Background]                  │
│  ┌──────────────────────────────────┐  │
│  │ Get your exclusive discount now! │  │
│  │ Take advantage of our limited... │  │
│  │       [Get Discount Now]         │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### CTA Dark + Reviews
```text
┌────────────────────────────────────────┐
│ [Dark Slate Background]                │
│           👤👤👤                       │
│        ⭐⭐⭐⭐⭐                        │
│    Over 200 satisfied customers        │
│   Get your exclusive discount now!     │
│   Take advantage of our limited...     │
│         [Get Discount Now]             │
└────────────────────────────────────────┘
```

### CTA Gradient + Logos
```text
┌────────────────────────────────────────┐
│ [Gradient from Blue-50 to Slate-50]    │
│   Get your exclusive discount now!     │
│   Take advantage of our limited...     │
│         [Get Discount Now]             │
│                                        │
│   [Logo] [Logo] [Logo] [Logo] [Logo]   │
└────────────────────────────────────────┘
```

### CTA Form Split (Reviews)
```text
┌────────────────────────────────────────┐
│ More Leads.      │ Start your free... │
│ More Time.       │ 5,000 companies... │
│ More Business.   │ [Name]            │
│ 👤👤👤 ⭐ 5.0    │ [Email]           │
│                  │ [Phone]           │
│                  │ ☐ I accept...     │
│                  │ [14-day free trial]│
└────────────────────────────────────────┘
```

### CTA Form Split (Simple)
```text
┌────────────────────────────────────────┐
│ More Leads.      │ [Name]             │
│ More Time.       │ [Email]            │
│ More Business.   │ [Phone]            │
│                  │ ☐ I accept...      │
│ Subtext...       │ [14-day free trial]│
└────────────────────────────────────────┘
```

### CTA Split Form (Light BG)
```text
┌────────────────────────────────────────┐
│ Get your        │ Take advantage...   │
│ exclusive       │ [Name]              │
│ discount!       │ [Email]             │
│                 │ ☐ I accept...       │
│                 │ [Get non-binding]   │
│                 │ We treat your data..│
└────────────────────────────────────────┘
```

### CTA + FAQ
```text
┌────────────────────────────────────────┐
│ Get your        │ [Get non-binding]   │
│ exclusive       │                     │
│ discount!       │ Is the offer non-   │
│                 │ binding? ▼          │
│ Take advantage..│ Yes, the offer you  │
│                 │ receive is free...  │
└────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/SectionPicker/SectionPicker.tsx` | Remove "Media" from categories, ensure CTA templates show in gallery |
| `src/builder_v2/templates/sectionTemplates.ts` | Replace media templates, add 10 new CTA templates |
| `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` | Add new CTAPreview variants |

---

## Visual Style Specifications

### Color Palette for CTA Templates
| Variant | Background | Text | Button |
|---------|------------|------|--------|
| Simple | White | Slate-800 | Blue-500 |
| Gray Card | Slate-50 + White card | Slate-800 | Blue-500 |
| Dark | Slate-800 | White | Blue-500 |
| Dark Card | Slate-800 + Gray card | White | Blue-500 |
| Gradient | Blue-50 to Slate-50 | Slate-800 | Blue-500 |
| Form variants | White | Slate-800 | Blue-500 |

### Shared Preview Components (reuse from Hero/Features)
- `AvatarStack` - 4 overlapping gradient circles
- `StarRating` - 5 yellow stars
- `LogoBar` - 5 gray placeholder rectangles
- `FormInputMockup` - Gray input field with placeholder text

---

## Implementation Order

1. Update `sectionTemplates.ts` - Add 10 new CTA templates
2. Update `HighTicketPreviewCard.tsx` - Add CTAPreview variants
3. Update `SectionPicker.tsx` - Remove Media, add CTA section category

---

## Result

After implementation:
- "Media" category removed (content available in Basic Blocks)
- CTA section category with 10 Perspective-style templates
- Consistent visual language with Hero and Features
- Form-based CTA variants for lead capture
- Light and dark background options

