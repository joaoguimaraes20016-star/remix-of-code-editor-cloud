

# Features Templates Redesign - Match Perspective Style

## Reference Analysis

From the uploaded screenshots, I identified **8 distinct Features template patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Split Left + Checklist** | 50/50 | Title + subtext + avatar reviews left, checklist with checkmarks + CTA button right |
| **Split Right + Image** | 50/50 | Title + subtext + avatar reviews left, person photo right |
| **Split Left + Image + Icons** | 50/50 | Person photo left, title + icon feature list + CTA right |
| **3-Column Image Cards** | Centered | Label + title + CTA, 3 image cards with titles + descriptions |
| **4-Column Icon Grid** | Centered | Label + title + CTA, 4 icon features in 2x2 grid |
| **2-Column Cards + Icon Features** | Centered | Label + title + CTA, 2 image cards + 4 icon features below |
| **Split Gray BG + Image** | 50/50 | Gray background, label + title + icon list left, phone/device image right |
| **Split Gray BG + Stats** | 50/50 | Gray background, title + paragraph + avatar reviews left, image right |

---

## Visual Style Specifications

### Common Elements Across All Features Templates

| Element | Style |
|---------|-------|
| **Section Label** | Blue text "Our Services" above title |
| **Headline** | Bold dark text (slate-800) |
| **Subtext** | Light gray (slate-400) |
| **CTA Button** | Blue (blue-500) with white text |
| **Avatar Stack** | 3-4 overlapping gradient circles |
| **Star Rating** | 5 yellow stars with "5.0 from 200+ reviews" |
| **Icon Features** | Colored icon + bold title + description |
| **Image Placeholders** | Rounded corners, gradient fills |

### Color Palette for Icons

| Icon Type | Colors |
|-----------|--------|
| Integration | Blue gradient |
| Lightning/Fast | Yellow/Amber |
| Support/Phone | Indigo |
| Strategy | Purple |

---

## New Features Templates

### 1. Features Split + Checklist (`features-split-checklist`)
```text
┌────────────────────────────────────────────┐
│  Title + Subtext     │  ✓ Easy operation  │
│  ⭐⭐⭐⭐⭐ 5.0       │  ✓ Real-time data  │
│  👤👤👤             │  ✓ Customizable    │
│                      │  [Learn more]      │
└────────────────────────────────────────────┘
```

### 2. Features Split + Image (`features-split-image`)
```text
┌────────────────────────────────────────────┐
│  Title               │                     │
│  Customer Service    │   [Person Photo]    │
│  Subtext...          │                     │
│  ⭐⭐⭐⭐⭐ 5.0       │                     │
└────────────────────────────────────────────┘
```

### 3. Features Split Image + Icons (`features-split-icons`)
```text
┌────────────────────────────────────────────┐
│                      │  Exclusive Analyses │
│   [Person Photo]     │  📊 Industry Reports│
│                      │  📈 Forecasts       │
│                      │  [Get Analysis]     │
└────────────────────────────────────────────┘
```

### 4. Features 3-Column Cards (`features-3col-cards`)
```text
┌────────────────────────────────────────────┐
│        Our Services                        │
│  These Are Your Advantages with Us         │
│         [Secure Offer Now]                 │
│                                            │
│  [Img1]      [Img2]      [Img3]           │
│  Fast        Personal    Cost-Effective   │
│  Implement   Consult     Solutions        │
└────────────────────────────────────────────┘
```

### 5. Features 4-Column Icons (`features-4col-icons`)
```text
┌────────────────────────────────────────────┐
│        Our Services                        │
│  These Are Your Advantages with Us         │
│         [Secure Offer Now]                 │
│                                            │
│  🔗 Easy        ⚡ Immediate               │
│     Integration    Start                   │
│                                            │
│  📞 Personal    💡 Customized             │
│     Support        Strategies              │
└────────────────────────────────────────────┘
```

### 6. Features 2-Column + Icons (`features-2col-icons`)
```text
┌────────────────────────────────────────────┐
│        Our Services                        │
│  These Are Your Advantages                 │
│         [Secure Offer Now]                 │
│                                            │
│  [Image Card 1]    [Image Card 2]         │
│  Fast Implement    Personal Consult        │
│                                            │
│  🔗 Integration   📞 Support              │
│  ⚡ Start         💡 Strategies            │
└────────────────────────────────────────────┘
```

### 7. Features Gray BG + Image (`features-gray-image`)
```text
┌────────────────────────────────────────────┐
│ [Gray Background]                          │
│  Our Services        │                     │
│  Real-Time           │   [Phone/Device]    │
│  Analytics           │   [Image]           │
│  ⚡ Quick Operation  │                     │
│  📊 Real-Time Data   │                     │
│  📱 Dashboards       │                     │
└────────────────────────────────────────────┘
```

### 8. Features Gray BG + Reviews (`features-gray-reviews`)
```text
┌────────────────────────────────────────────┐
│ [Gray Background]                          │
│  Our Services        │                     │
│  Real-Time           │   [Person]          │
│  Analytics           │   [Image]           │
│  Subtext...          │                     │
│  ⭐⭐⭐⭐⭐ 5.0       │                     │
└────────────────────────────────────────────┘
```

---

## File Changes

### 1. Update `sectionTemplates.ts`

Replace the current 2 features templates with 8 new Perspective-style templates:

| Current Templates | New Templates |
|-------------------|---------------|
| `features-list` | `features-split-checklist` |
| `features-grid` | `features-split-image` |
| NEW | `features-split-icons` |
| NEW | `features-3col-cards` |
| NEW | `features-4col-icons` |
| NEW | `features-2col-icons` |
| NEW | `features-gray-image` |
| NEW | `features-gray-reviews` |

### 2. Update `HighTicketPreviewCard.tsx`

Redesign the `FeaturesPreview` component to handle 8 distinct variants with:
- Light backgrounds (white or slate-50)
- Split layouts (50/50)
- Centered grid layouts
- Avatar stacks and star ratings
- Icon feature lists with colored icons
- Image card placeholders
- Gray background variants

---

## Technical Implementation

### New FeaturesPreview Component Structure

```tsx
const FeaturesPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    switch (variant) {
      case 'split-checklist':
        return <FeaturesSplitChecklistPreview ref={ref} />;
      case 'split-image':
        return <FeaturesSplitImagePreview ref={ref} />;
      case 'split-icons':
        return <FeaturesSplitIconsPreview ref={ref} />;
      case '3col-cards':
        return <Features3ColCardsPreview ref={ref} />;
      case '4col-icons':
        return <Features4ColIconsPreview ref={ref} />;
      case '2col-icons':
        return <Features2ColIconsPreview ref={ref} />;
      case 'gray-image':
        return <FeaturesGrayImagePreview ref={ref} />;
      case 'gray-reviews':
        return <FeaturesGrayReviewsPreview ref={ref} />;
    }
  }
);
```

### Visual Elements to Reuse

| Element | Already Exists |
|---------|----------------|
| `AvatarStack` | Yes (from Hero) |
| `StarRating` | Yes (from Hero) |
| `ImagePlaceholder` | Yes (from Hero) |
| `LogoBar` | Yes (from Hero) |

### New Visual Elements Needed

| Element | Implementation |
|---------|----------------|
| **Section Label** | Blue text badge "Our Services" |
| **Checklist Row** | Checkmark icon + text line |
| **Icon Feature** | Colored circle + title + description |
| **Image Card** | Rounded image placeholder + title below |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/builder_v2/templates/sectionTemplates.ts` | Add 8 new features templates, update exports |
| `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` | Add 8 new FeaturesPreview variants |

---

## Variant Mapping in getPreviewComponent

```tsx
case 'features':
  if (id.includes('split-checklist')) return <FeaturesPreview variant="split-checklist" />;
  if (id.includes('split-image')) return <FeaturesPreview variant="split-image" />;
  if (id.includes('split-icons')) return <FeaturesPreview variant="split-icons" />;
  if (id.includes('3col-cards')) return <FeaturesPreview variant="3col-cards" />;
  if (id.includes('4col-icons')) return <FeaturesPreview variant="4col-icons" />;
  if (id.includes('2col-icons')) return <FeaturesPreview variant="2col-icons" />;
  if (id.includes('gray-image')) return <FeaturesPreview variant="gray-image" />;
  if (id.includes('gray-reviews')) return <FeaturesPreview variant="gray-reviews" />;
  return <FeaturesPreview variant="split-checklist" />;
```

---

## Result

After implementation:
- Features templates will have clean, light Perspective-style design
- 8 distinct variations covering common features patterns
- Visual preview cards accurately represent what users get
- Consistent aesthetic with the already-updated Hero templates
- Reuses shared components (AvatarStack, StarRating) for consistency

