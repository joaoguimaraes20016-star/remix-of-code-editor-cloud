
# Hero Templates Redesign - Match Perspective Style

## Reference Analysis

From the uploaded reference images, I can identify **10 distinct hero template variations** that follow a clean, light-themed design language:

### Template Inventory from Reference

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Hero Simple** | Centered | Headline + Subtext + Button + Hero Image below |
| **Hero + Reviews** | Centered | Headline + Subtext + Button + Avatar stack + Stars + "4.8 from 148 reviews" + Image |
| **Hero + Logos** | Centered | Headline + Subtext + Button + Logo bar (Coca-Cola, Zalando, Braun, IKEA, Sony) |
| **Hero Split Left** | 50/50 | Text left + Image right + Logo bar below text |
| **Hero + Form Card** | Split | Title left + Form card right (Name, Email, Phone + CTA) |
| **Hero + Inline Form** | Split | Title + inputs + button left + Image right |
| **Hero Gradient BG** | Centered | Soft blue/gray gradient background + Headline + Button + Logos below card |
| **Hero Dark BG + Image** | Full | Dark blue-gray background + White headline + Outline button + Large image below |

---

## Visual Style Specifications

### Card Design (Light Theme)
```text
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   More Success with              │  │
│  │   Less Effort                    │  │  ← Bold headline
│  │                                   │  │
│  │   With our tailored solutions... │  │  ← Light gray subtext
│  │                                   │  │
│  │      ┌──────────────────┐        │  │
│  │      │  Learn more now  │        │  │  ← Blue button
│  │      └──────────────────┘        │  │
│  │                                   │  │
│  │   ┌─────────────────────────┐    │  │
│  │   │                         │    │  │  ← Hero image
│  │   │     Person Photo        │    │  │
│  │   │                         │    │  │
│  │   └─────────────────────────┘    │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│           Template Name                 │  ← Label below
└─────────────────────────────────────────┘
```

### Color Palette
| Element | Color |
|---------|-------|
| Card background | White (`#ffffff`) |
| Headline | Dark gray (`slate-800`) |
| Subtext | Light gray (`slate-400`) |
| CTA Button | Blue (`blue-500`) |
| Avatar border | White |
| Logo placeholders | Gray (`slate-300`) |
| Gradient backgrounds | `blue-50` to `slate-100` |
| Dark hero bg | `slate-600` or `slate-700` |

---

## New Hero Template Previews

### 1. Hero Simple (Centered + Image)
```tsx
// Light card with centered content + image placeholder
<div className="bg-white rounded-lg p-4">
  <h3>More Success with Less Effort</h3>
  <p>With our tailored solutions...</p>
  <button>Learn more now</button>
  <img placeholder />
</div>
```

### 2. Hero + Reviews
```tsx
// Same as above but with avatar stack + star rating
<div className="bg-white">
  ...headline/subtext/button...
  <div className="flex items-center gap-1">
    <AvatarStack />
    <Stars />
    <span>4.8 from 148 reviews</span>
  </div>
  <img />
</div>
```

### 3. Hero + Logo Bar
```tsx
// Centered content with trusted-by logos below
<div className="bg-white">
  ...headline/subtext/button...
  <div className="flex gap-4">
    <Logo /> <Logo /> <Logo /> <Logo /> <Logo />
  </div>
</div>
```

### 4. Hero Split (Text Left + Image Right)
```tsx
// 50/50 layout
<div className="bg-white grid grid-cols-2">
  <div>
    <h3>More Success...</h3>
    <p>...</p>
    <button />
    <LogoBar />
  </div>
  <div>
    <img />
  </div>
</div>
```

### 5. Hero + Form Card
```tsx
// Split with form card on right
<div className="bg-white grid grid-cols-2">
  <div>
    <h3>Secure Your Exclusive...</h3>
    <p>...</p>
  </div>
  <div className="bg-slate-50 rounded-lg p-4">
    <h4>Get your exclusive bundle!</h4>
    <input placeholder="Name" />
    <input placeholder="E-Mail" />
    <input placeholder="Phone" />
    <button />
  </div>
</div>
```

### 6. Hero + Inline Form
```tsx
// Form inputs inline with content
<div className="bg-white grid grid-cols-2">
  <div>
    <h3>Secure Your...</h3>
    <p>...</p>
    <input />
    <input />
    <button />
  </div>
  <img />
</div>
```

### 7. Hero Gradient Background
```tsx
// Soft gradient bg with centered content
<div className="bg-gradient-to-b from-blue-50 to-slate-50">
  <h3>Get Your Exclusive Discount</h3>
  <p>...</p>
  <button />
  <LogoBar />
</div>
```

### 8. Hero Dark (Dark BG + Image)
```tsx
// Dark background with light text
<div className="bg-slate-600">
  <h3 className="text-white">Get Your Exclusive Discount</h3>
  <p className="text-white/70">...</p>
  <button className="border-white text-white">...</button>
  <img />
</div>
```

---

## File Changes

### 1. Update `sectionTemplates.ts`

Add 8 new hero templates to replace the current 5:

| Old Template | New Template |
|--------------|--------------|
| `hero-impact` | `hero-simple` |
| `hero-video` | `hero-reviews` |
| `hero-authority` | `hero-logos` |
| `hero-minimal` | `hero-split` |
| `hero-split` | `hero-form-card` |
| NEW | `hero-inline-form` |
| NEW | `hero-gradient` |
| NEW | `hero-dark` |

### 2. Update `HighTicketPreviewCard.tsx`

Replace the `HeroPreview` component with new Perspective-style previews:
- Light backgrounds (white/cream)
- Centered or split layouts
- Placeholder image areas with gradient fills
- Avatar stacks with overlapping circles
- Logo placeholder bars
- Form input mockups for form variants
- Dark variant for dark hero

---

## Technical Implementation

### New HeroPreview Component Structure

```tsx
const HeroPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // Map variant to specific preview
    switch (variant) {
      case 'simple':
        return <HeroSimplePreview ref={ref} />;
      case 'reviews':
        return <HeroReviewsPreview ref={ref} />;
      case 'logos':
        return <HeroLogosPreview ref={ref} />;
      case 'split':
        return <HeroSplitPreview ref={ref} />;
      case 'form-card':
        return <HeroFormCardPreview ref={ref} />;
      case 'inline-form':
        return <HeroInlineFormPreview ref={ref} />;
      case 'gradient':
        return <HeroGradientPreview ref={ref} />;
      case 'dark':
        return <HeroDarkPreview ref={ref} />;
    }
  }
);
```

### Visual Elements to Create

| Element | Implementation |
|---------|----------------|
| **Avatar Stack** | 3-4 overlapping circles with gradient fills, white borders |
| **Star Rating** | 5 small yellow stars in a row |
| **Logo Bar** | 3-5 gray rounded rectangles as placeholders |
| **Form Inputs** | Gray rounded rectangles with left-aligned placeholder text |
| **Image Placeholder** | Gradient fill with subtle person silhouette or landscape |
| **Blue CTA** | Solid blue rounded button with white text |
| **Outline CTA** | White border button for dark backgrounds |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/builder_v2/templates/sectionTemplates.ts` | Update hero section templates (8 new templates) |
| `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` | Redesign HeroPreview component with 8 Perspective-style variants |

---

## Result

After implementation:
- Hero templates will have a clean, light Perspective-style design
- 8 distinct variations covering common hero patterns
- Visual preview cards will accurately represent what users get
- Consistent with the modern SaaS/landing page aesthetic
