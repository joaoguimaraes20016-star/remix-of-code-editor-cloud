

# Add Testimonials Templates - Perspective-Style

## Summary

Expand the Testimonials section from 2 basic templates to 11 Perspective-style templates matching the reference screenshots. These include single-quote layouts, split layouts with images, and 3-column grids with various card styles.

---

## Template Patterns Identified

From the uploaded screenshots, I identified **11 distinct Testimonial patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Testimonial Single Centered** | Centered | Logo/icon at top, large quote, avatar + name + role below |
| **Testimonial Single + Stars** | Centered | 5-star rating, large quote, avatar + name + role |
| **Testimonial Single Full Image** | Full bleed | Dark background image, logo overlay, white quote text, avatar + name |
| **Testimonial Single Image (Rounded)** | Full bleed | Same as above but with rounded corners |
| **Testimonial Split - Text Left** | 50/50 | Logo + quote + name on left, large image on right |
| **Testimonial Split - Image Left** | 50/50 | Large image on left, quote + name + role on right |
| **Testimonial Grid 3-Column (Yellow Stars)** | Centered | Title + subtext, 3 white cards with yellow 5-star ratings |
| **Testimonial Grid 3-Column (Cards)** | Centered | Same but with gray card styling/shadows |
| **Testimonial Grid 3-Column (No Cards)** | Centered | 3 columns without card borders, extended description |
| **Testimonial Grid Photo Cards (Overlay)** | Centered | 3 photo cards with gradient overlay and text at bottom |
| **Testimonial Grid Photo Cards (Below)** | Centered | 3 photos above, quote + name text below each photo |

---

## Visual Style Specifications

### Common Elements

| Element | Style |
|---------|-------|
| **Logo/Icon** | Small blue icon or "Perspective" logo at top |
| **Stars** | Yellow/amber 5-star ratings |
| **Quotes** | Bold slate-800 text with quotation marks |
| **Subtext** | Light slate-400/500 for role/company |
| **Avatars** | Circular, gradient placeholder |
| **Cards** | White or gray-50 with subtle borders |
| **Photo Overlays** | Dark gradient from bottom |

---

## ASCII Template Layouts

### Testimonial Single Centered
```text
+------------------------------------------------+
|               [P] Perspective                   |
|                                                 |
|    "Partnering with Perspektive resulted       |
|     in over 2000 new leads in 3 months."       |
|                                                 |
|               (o) Ferdinand Schulz              |
|           Software Engineer, Example GmbH       |
+------------------------------------------------+
```

### Testimonial Single + Stars
```text
+------------------------------------------------+
|               ★★★★★                            |
|                                                 |
|    "Partnering with Perspektive resulted       |
|     in over 2000 new leads in 3 months."       |
|                                                 |
|               (o) Ferdinand Schulz              |
|           Software Engineer, Example GmbH       |
+------------------------------------------------+
```

### Testimonial Single Full Image (Dark)
```text
+------------------------------------------------+
| [Full Background Image - Office/Person]        |
|          with dark overlay                      |
|               [P] Perspective                   |
|                                                 |
|    "Partnering with Perspektive resulted       |
|     in over 2000 new leads in 3 months."       |
|                                                 |
|               (o) Ferdinand Schulz              |
|           Software Engineer, Example GmbH       |
+------------------------------------------------+
```

### Testimonial Single Image (Rounded)
```text
+------------------------------------------------+
|  ┌────────────────────────────────────────┐   |
|  │ [Full Background Image with rounded]    │   |
|  │            [P] Perspective              │   |
|  │                                         │   |
|  │  "Partnering with Perspektive..."      │   |
|  │                                         │   |
|  │       (o) Ferdinand Schulz              │   |
|  │   Software Engineer, Example GmbH       │   |
|  └────────────────────────────────────────┘   |
+------------------------------------------------+
```

### Testimonial Split - Text Left
```text
+------------------------+------------------------+
| [P] Perspective        |                        |
|                        |   [Large Professional  |
| "Partnering with       |    Photo]              |
| Perspektive resulted   |                        |
| in over 2000 new       |                        |
| leads in 3 months."    |                        |
|                        |                        |
| Ferdinand Schulz       |                        |
| Software Engineer      |                        |
+------------------------+------------------------+
```

### Testimonial Split - Image Left
```text
+------------------------+------------------------+
|                        |                        |
|   [Large Professional  |   "Partnering with     |
|    Photo]              |   Perspektive resulted |
|                        |   in over 2000 new     |
|                        |   leads in 3 months."  |
|                        |                        |
|                        |   Ferdinand Schulz     |
|                        |   Software Engineer    |
+------------------------+------------------------+
```

### Testimonial Grid 3-Column (Yellow Stars)
```text
+------------------------------------------------+
|          What our customers say                 |
|  With Perspective, our customers make...        |
|                                                 |
| ┌──────────┐ ┌──────────┐ ┌──────────┐        |
| │ ★★★★★   │ │ ★★★★★   │ │ ★★★★★   │        |
| │          │ │          │ │          │        |
| │ "Working │ │ "With    │ │ "Through │        |
| │ with..." │ │ help..." │ │ we have..│        |
| │          │ │          │ │          │        |
| │(o) Name  │ │(o) Name  │ │(o) Name  │        |
| │ Role     │ │ Role     │ │ Role     │        |
| └──────────┘ └──────────┘ └──────────┘        |
+------------------------------------------------+
```

### Testimonial Grid 3-Column (Cards/Gray)
```text
Same layout but cards have:
- Gray background (slate-50)
- Subtle border/shadow
- Slightly darker styling
```

### Testimonial Grid 3-Column (No Cards)
```text
+------------------------------------------------+
|          What our customers say                 |
|  With Perspective, our customers make...        |
|                                                 |
|  ★★★★★        ★★★★★        ★★★★★              |
|                                                 |
| "Working with  "With         "Through           |
| Perspective    Perspective's  Perspective,      |
| increased      help, we were  we have been     |
| revenue..."    able to..."    able to..."       |
|                                                 |
| Thanks to      Through        We have set new   |
| innovative...  creative...    standards with... |
|                                                 |
| Philipp S.     Laura S.       Maximilian W.    |
+------------------------------------------------+
```

### Testimonial Grid Photo Cards (Overlay)
```text
+------------------------------------------------+
|          What our customers say                 |
|  With Perspective, our customers make...        |
|                                                 |
| ┌──────────┐ ┌──────────┐ ┌──────────┐        |
| │  [PHOTO] │ │  [PHOTO] │ │  [PHOTO] │        |
| │          │ │          │ │          │        |
| │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓│        |
| │"Working  │ │"With     │ │"Through  │        |
| │with..."  │ │help..."  │ │we have...│        |
| │Name,Role │ │Name,Role │ │Name,Role │        |
| └──────────┘ └──────────┘ └──────────┘        |
+------------------------------------------------+
```

### Testimonial Grid Photo Cards (Text Below)
```text
+------------------------------------------------+
|          What our customers say                 |
|  With Perspective, our customers make...        |
|                                                 |
| ┌──────────┐ ┌──────────┐ ┌──────────┐        |
| │  [PHOTO] │ │  [PHOTO] │ │  [PHOTO] │        |
| │          │ │          │ │          │        |
| └──────────┘ └──────────┘ └──────────┘        |
|                                                 |
| "Working with  "With help..."  "Through..."     |
| Perspective..."                                 |
|                                                 |
| Name, Role     Name, Role      Name, Role       |
+------------------------------------------------+
```

---

## File Changes

### 1. `sectionTemplates.ts`

Remove the 2 existing testimonial templates and add 11 new Perspective-style templates:

| New Template ID | Name |
|-----------------|------|
| `testimonial-single-centered` | Single Centered |
| `testimonial-single-stars` | Single + Stars |
| `testimonial-single-full-image` | Single Full Image |
| `testimonial-single-image-rounded` | Single Image (Rounded) |
| `testimonial-split-text-left` | Split (Text Left) |
| `testimonial-split-image-left` | Split (Image Left) |
| `testimonial-grid-yellow-stars` | Grid (Yellow Stars) |
| `testimonial-grid-cards` | Grid Cards |
| `testimonial-grid-no-cards` | Grid (No Cards) |
| `testimonial-grid-photo-overlay` | Grid Photo (Overlay) |
| `testimonial-grid-photo-below` | Grid Photo (Text Below) |

Update:
- `allSectionTemplates` array
- `sectionTemplatesByCategory.testimonials` array

### 2. `HighTicketPreviewCard.tsx`

Replace the simple `TestimonialsPreview` component with a multi-variant version:

```tsx
const TestimonialsPreview = React.forwardRef<HTMLDivElement, { template: SectionTemplate }>(
  ({ template }, ref) => {
    const id = template.id;
    
    // Shared components
    const YellowStarRating = () => (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={6} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
    
    const BlueLogo = () => (
      <div className="flex items-center gap-0.5">
        <div className="w-2.5 h-2.5 rounded bg-blue-500" />
        <span className="text-[5px] text-slate-600 font-medium">Perspective</span>
      </div>
    );
    
    const TestimonialAvatar = () => (
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-400" />
        <div>
          <div className="h-0.5 w-8 bg-slate-700 rounded" />
          <div className="h-0.5 w-10 bg-slate-400 rounded mt-0.5" />
        </div>
      </div>
    );
    
    const TestimonialCard = ({ hasStars = true, grayBg = false }: { hasStars?: boolean; grayBg?: boolean }) => (
      <div className={cn(
        "p-1.5 rounded flex flex-col gap-1",
        grayBg ? "bg-slate-50 border border-slate-100" : "bg-white border border-slate-100"
      )}>
        {hasStars && <YellowStarRating />}
        <div className="h-1 w-full bg-slate-600 rounded" />
        <div className="h-0.5 w-4/5 bg-slate-400 rounded" />
        <TestimonialAvatar />
      </div>
    );
    
    // Variant implementations...
  }
);
```

---

## New Preview Component Structure

### Single Centered
- White background
- Blue logo at top
- Large quote placeholder (dark bars)
- Centered avatar + name/role

### Single + Stars
- White background
- 5-star yellow rating at top
- Large quote placeholder
- Centered avatar + name/role

### Single Full Image
- Dark gradient background (simulating image overlay)
- Blue logo
- White quote text
- Avatar + name in white

### Single Image (Rounded)
- Similar to full image but with rounded container
- Inset padding showing outer background

### Split - Text Left
- 50/50 layout
- Logo + quote + avatar on left
- Image placeholder on right

### Split - Image Left
- 50/50 layout
- Image placeholder on left
- Quote + avatar on right

### Grid Yellow Stars
- Title + subtext centered
- 3 white cards with yellow stars, quote, avatar

### Grid Cards
- Title + subtext centered
- 3 gray-50 cards with stars, quote, avatar

### Grid No Cards
- Title + subtext centered
- 3 columns without borders, stars above, quote, extended text, name

### Grid Photo Overlay
- Title + subtext centered
- 3 photo cards with gradient overlay at bottom containing text

### Grid Photo Below
- Title + subtext centered
- 3 photo placeholders above
- Quote + name text below each photo

---

## Implementation Order

1. **Update `sectionTemplates.ts`**:
   - Remove `testimonialSingle` and `testimonialCarousel`
   - Add 11 new testimonial templates with proper `createNode` functions
   - Update `allSectionTemplates` array
   - Update `sectionTemplatesByCategory.testimonials` array

2. **Update `HighTicketPreviewCard.tsx`**:
   - Replace simple `TestimonialsPreview` with multi-variant component
   - Add shared components (YellowStarRating, BlueLogo, TestimonialAvatar, TestimonialCard)
   - Implement all 11 variant layouts
   - Update `getPreviewComponent` to pass template object

---

## Result

After implementation:
- "Testimonials" category expanded from 2 to 11 Perspective-style templates
- Light-themed previews matching the visual language of other sections
- Variety of layouts: single quotes, splits, and 3-column grids
- Yellow star ratings and blue logo accents for brand consistency
- Photo overlay and text-below variants for visual variety

