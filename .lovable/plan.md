

# Add Trust (Social Proof) Templates - Perspective-Style

## Summary

Expand the Trust/Social Proof section from 4 basic templates to 10 Perspective-style templates matching the reference screenshots. These showcase company logos ("Companies that rely on us") in various layouts: hero combinations, centered grids, split views, and compact bars.

---

## Template Patterns Identified

From the uploaded screenshots, I identified **10 distinct Trust patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Trust Hero + Logos + CTA** | Centered | Title, subtext, 2-row logo grid (5x2), blue CTA button |
| **Trust Gray Card Centered** | Centered | Gray card background, centered title + subtext, single row logos |
| **Trust Centered Simple** | Centered | White background, centered title + subtext, single row logos |
| **Trust Centered Gray BG** | Full-width | Gray background, centered title + subtext, logos |
| **Trust Split Gray Card** | 50/50 | Text left (title + subtext), gray card with 2x3 logo grid on right |
| **Trust Split White** | 50/50 | Text left, white area with 2x3 logo grid on right |
| **Trust Split Gray BG** | 50/50 | Same as split white but with gray background |
| **Trust Split Outline** | 50/50 | Text left, white card with thin border containing 2x3 logos on right |
| **Trust Compact Bar** | Horizontal | Minimal - title left, 3 logos inline on right (white BG) |
| **Trust Compact Dark** | Horizontal | Same as compact but with dark/accent background |

---

## Visual Style Specifications

### Common Elements

| Element | Style |
|---------|-------|
| **Title** | Bold "Companies that rely on us" |
| **Subtext** | Light slate-400 "Leading companies trust our expertise..." |
| **Logos** | Grayscale placeholder bars representing company logos |
| **Background** | White, gray-50/100, or dark variants |
| **Logo Grid** | 5-column (single row) or 3x2 grid |

---

## ASCII Template Layouts

### Trust Hero + Logos + CTA
```text
+------------------------------------------------+
|          Your Vision is our Mission            |
|  Benefit from our limited-time offer. Act      |
|  quickly and secure exclusive benefits...       |
|                                                 |
|  [logo] [logo] [logo] [logo] [logo] [logo]     |
|  [logo] [logo] [logo] [logo]                   |
|                                                 |
|           [Learn more now]                      |
+------------------------------------------------+
```

### Trust Gray Card Centered
```text
+------------------------------------------------+
| ┌────────────────────────────────────────────┐ |
| │       Companies that rely on us            │ |
| │   Leading companies trust our expertise... │ |
| │                                            │ |
| │   [logo] [logo] [logo] [logo] [logo]      │ |
| └────────────────────────────────────────────┘ |
+------------------------------------------------+
```

### Trust Centered Simple
```text
+------------------------------------------------+
|          Companies that rely on us             |
|   Leading companies trust our expertise and    |
|   innovative solutions...                       |
|                                                 |
|     [logo] [logo] [logo] [logo] [logo]        |
+------------------------------------------------+
```

### Trust Centered Gray BG
```text
+================================================+
| [Gray Background]                              |
|          Companies that rely on us             |
|   Leading companies trust our expertise...     |
|                                                 |
|     [logo] [logo] [logo] [logo] [logo]        |
+================================================+
```

### Trust Split Gray Card
```text
+------------------------+------------------------+
| Companies that rely    | ┌────────────────────┐ |
| on us                  | │ [logo] [logo] [logo]│ |
|                        | │                     │ |
| Leading companies      | │ [logo] [logo] [logo]│ |
| trust our expertise... | └────────────────────┘ |
+------------------------+------------------------+
```

### Trust Split White
```text
+------------------------+------------------------+
| Companies that rely    |                        |
| on us                  |  [logo] [logo] [logo]  |
|                        |                        |
| Leading companies      |  [logo] [logo] [logo]  |
| trust our expertise... |                        |
+------------------------+------------------------+
```

### Trust Split Gray BG
```text
+========================+========================+
| [Gray Background]      |                        |
| Companies that rely    |  [logo] [logo] [logo]  |
| on us                  |                        |
|                        |  [logo] [logo] [logo]  |
| Leading companies...   |                        |
+========================+========================+
```

### Trust Split Outline
```text
+------------------------+------------------------+
| Companies that rely    | ┌────────────────────┐ |
| on us                  | │ [logo] [logo] [logo]│ |
|                        | │                     │ |
| Leading companies      | │ [logo] [logo] [logo]│ |
| trust our expertise... | └────────────────────┘ |
+------------------------+------------------------+
 (White card with thin border on right)
```

### Trust Compact Bar
```text
+------------------------------------------------+
| Companies that rely on us  [logo] [logo] [logo]|
+------------------------------------------------+
```

### Trust Compact Dark
```text
+================================================+
| [Dark/Blue Background]                         |
| Companies that rely on us  [logo] [logo] [logo]|
+================================================+
```

---

## File Changes

### 1. `sectionTemplates.ts`

Replace the 4 existing social_proof templates with 10 new Perspective-style templates:

| New Template ID | Name |
|-----------------|------|
| `trust-hero-logos-cta` | Trust Hero + Logos |
| `trust-gray-card-centered` | Trust Gray Card |
| `trust-centered-simple` | Trust Centered |
| `trust-centered-gray-bg` | Trust Centered (Gray BG) |
| `trust-split-gray-card` | Trust Split (Gray Card) |
| `trust-split-white` | Trust Split (White) |
| `trust-split-gray-bg` | Trust Split (Gray BG) |
| `trust-split-outline` | Trust Split (Outline) |
| `trust-compact-bar` | Trust Compact |
| `trust-compact-dark` | Trust Compact (Dark) |

Update:
- `allSectionTemplates` array
- `sectionTemplatesByCategory.social_proof` array

### 2. `HighTicketPreviewCard.tsx`

Replace the simple `SocialProofPreview` component with a multi-variant `TrustPreview` component:

```tsx
const TrustPreview = React.forwardRef<HTMLDivElement, { template: SectionTemplate }>(
  ({ template }, ref) => {
    const id = template.id;
    
    // Shared components
    const LogoPlaceholder = ({ width = 'w-8' }: { width?: string }) => (
      <div className={cn("h-3 rounded bg-slate-300", width)} />
    );
    
    const LogoRow = ({ count = 5 }: { count?: number }) => (
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <LogoPlaceholder key={i} />
        ))}
      </div>
    );
    
    const LogoGrid3x2 = () => (
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <LogoPlaceholder key={i} />
        ))}
      </div>
    );
    
    const TrustTitle = () => (
      <div className="h-2 w-20 bg-slate-800 rounded" />
    );
    
    const TrustSubtext = () => (
      <div className="space-y-0.5">
        <div className="h-1 w-24 bg-slate-400 rounded" />
        <div className="h-1 w-20 bg-slate-300 rounded" />
      </div>
    );
    
    // Variant implementations based on id...
  }
);
```

Update `getPreviewComponent` to use new multi-variant component:

```tsx
case 'social_proof':
  return <TrustPreview template={template} />;
```

---

## New Preview Component Structure

### Hero + Logos + CTA
- White background
- Centered title + subtext
- 2 rows of logos (5 + 5)
- Blue CTA button at bottom

### Gray Card Centered
- White outer background
- Gray card container (rounded)
- Centered title + subtext + logo row inside card

### Centered Simple
- White background
- Centered title + subtext
- Single row of 5-6 logos

### Centered Gray BG
- Full gray background
- Centered title + subtext
- Single row of logos

### Split Gray Card
- 50/50 layout
- Title + subtext on left (white)
- Gray card with 3x2 logo grid on right

### Split White
- 50/50 layout
- Title + subtext on left
- 3x2 logo grid on right (no card)

### Split Gray BG
- Gray background
- 50/50 layout
- Title + subtext left, logos right

### Split Outline
- 50/50 layout
- Title + subtext left
- White card with thin border containing logos on right

### Compact Bar
- Single horizontal row
- Title on left, 3 logos inline on right
- White background, minimal padding

### Compact Dark
- Same as compact bar
- Dark or blue background
- White/light text and logo placeholders

---

## Implementation Order

1. **Update `sectionTemplates.ts`**:
   - Remove 4 existing social_proof templates (socialProofStars, socialProofLogos, socialProofStats, socialProofBadges)
   - Add 10 new trust templates with proper `createNode` functions
   - Update `allSectionTemplates` array
   - Update `sectionTemplatesByCategory.social_proof` array

2. **Update `HighTicketPreviewCard.tsx`**:
   - Replace `SocialProofPreview` with new multi-variant `TrustPreview` component
   - Add shared components (LogoPlaceholder, LogoRow, LogoGrid3x2, TrustTitle, TrustSubtext)
   - Implement all 10 variant layouts
   - Update `getPreviewComponent` to use new component

---

## Helper Components for Previews

```tsx
// Single logo placeholder bar
const LogoPlaceholder = ({ width = 'w-8' }: { width?: string }) => (
  <div className={cn("h-3 rounded bg-slate-300", width)} />
);

// Row of 5 logos
const LogoRow = ({ count = 5 }: { count?: number }) => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <LogoPlaceholder key={i} />
    ))}
  </div>
);

// 3x2 logo grid
const LogoGrid3x2 = () => (
  <div className="grid grid-cols-3 gap-1.5">
    {Array.from({ length: 6 }).map((_, i) => (
      <LogoPlaceholder key={i} />
    ))}
  </div>
);

// Title bar
const TrustTitle = () => (
  <div className="h-2 w-20 bg-slate-800 rounded" />
);

// Subtext lines
const TrustSubtext = () => (
  <div className="space-y-0.5">
    <div className="h-1 w-24 bg-slate-400 rounded" />
    <div className="h-1 w-20 bg-slate-300 rounded" />
  </div>
);

// Blue CTA button
const BlueButton = () => (
  <div className="h-4 w-14 bg-blue-500 rounded" />
);
```

---

## Color Palette

| Variant | Background | Cards | Logos |
|---------|------------|-------|-------|
| Hero + Logos + CTA | White | - | Slate-200/300 |
| Gray Card Centered | White | Gray-50/100 | Slate-300 |
| Centered Simple | White | - | Slate-300 |
| Centered Gray BG | Slate-50/100 | - | Slate-300 |
| Split Gray Card | White | Gray-50 | Slate-300 |
| Split White | White | - | Slate-300 |
| Split Gray BG | Slate-50 | - | Slate-300 |
| Split Outline | White | White + border | Slate-300 |
| Compact Bar | White | - | Slate-300 |
| Compact Dark | Slate-800 | - | White/30% |

---

## Result

After implementation:
- "Trust" category expanded from 4 basic to 10 Perspective-style templates
- Light-themed previews matching the visual language of Hero, Team, Testimonials, etc.
- Multiple layout options: hero combos, centered, splits, and compact bars
- Consistent grayscale logo placeholders matching reference designs
- Professional "Companies that rely on us" social proof sections

