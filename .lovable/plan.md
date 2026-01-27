

# Change Embed to About Us - Perspective-Style Templates

## Summary

Replace the "Embed" section category with "About Us" containing 9 Perspective-style templates matching the reference screenshots. The embed functionality (calendar embeds) will remain available in Interactive Blocks.

---

## Template Patterns Identified

From the uploaded screenshots, there are **9 distinct About Us patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **About Split + Icons** | 50/50 | Image left, Title + 3 icon features (Innovation, Efficiency, Sustainability) right |
| **About Split + FAQ** | 50/50 | Title + FAQ accordion left, large image right |
| **About Full Image** | Centered | "This is us" label + title + subtext + large full-width office image |
| **About Logos** | Centered | Title + subtext + logo bar (Google, Braun, Coca-Cola, etc.) |
| **About 2-Column Text** | 2-column | "About us" title + paragraph left, 2-column mission text right |
| **About Split + Image** | 50/50 | Title + long paragraphs left, large image right |
| **About Contact Info** | Split | "Contact us" + subtext left, Email/Phone/Location icons right |
| **About Contact + Image** | Split | Contact info + large building image below |
| **About Contact + Map** | Split | Contact info + embedded Google map below |

---

## Visual Style Specifications

### Common Elements

| Element | Style |
|---------|-------|
| **Section Label** | Blue text "This is us" above title |
| **Headlines** | Bold slate-800 text |
| **Subtext** | Light slate-400 text |
| **Icon Features** | Blue/purple icons + bold title + description |
| **Contact Icons** | Blue circles with white icons (mail, phone, pin) |
| **Images** | Rounded corners, office/building photos |

### Icon Color Palette

| Icon Type | Background |
|-----------|------------|
| Innovation | Blue |
| Efficiency | Yellow/Amber |
| Sustainability | Gray |
| Email | Blue |
| Phone | Blue |
| Location | Blue |

---

## ASCII Template Layouts

### About Split + Icons
```text
+------------------------+------------------------+
|                        |  A smart future.       |
|   [Person/Workspace    |  * Innovation          |
|    Image]              |    Cutting-edge tech.. |
|                        |  ⚡ Efficiency          |
|                        |    Automated systems.. |
|                        |  ◯ Sustainability      |
|                        |    Optimized use of..  |
+------------------------+------------------------+
```

### About Split + FAQ
```text
+------------------------+------------------------+
|  Our company           |                        |
|  Learn how we are..    |   [Office Interior     |
|                        |    Image]              |
|  > How do we promote?  |                        |
|    Our technologies..  |                        |
|  > Which industries?   |                        |
|  > How safe are..?     |                        |
+------------------------+------------------------+
```

### About Full Image
```text
+------------------------------------------------+
|              This is us                        |
|    Learn more about our company                |
|  We want to show you how we are transforming.. |
|                                                |
|   [Full-Width Office/Team Photo]               |
|                                                |
+------------------------------------------------+
```

### About Logos
```text
+------------------------------------------------+
|    Learn more about our company                |
|  We want to show you how we are transforming.. |
|                                                |
|   [indo] [Google] [Braun] [Coca-Cola] [DHL]   |
|                                                |
+------------------------------------------------+
```

### About 2-Column Text
```text
+------------------------+------------------------+
|  About us              |  Our mission is to     |
|                        |  improve manufacturing |
|  We want to show you   |  through cutting-edge  |
|  how we are            |  technologies...       |
|  transforming the      |                        |
|  manufacturing sector  |  We develop tailor-made|
|  with advanced         |  solutions perfectly   |
|  robotics...           |  tailored to needs...  |
+------------------------+------------------------+
```

### About Split + Image
```text
+------------------------+------------------------+
|  Learn more about      |                        |
|  our company           |   [Office Interior     |
|                        |    Image]              |
|  We want to show you   |                        |
|  how we are            |                        |
|  transforming...       |                        |
|                        |                        |
|  Our mission is to     |                        |
|  improve the...        |                        |
+------------------------+------------------------+
```

### About Contact Info
```text
+------------------------+------------------------+
|  This is us            |  ✉ E-Mail              |
|  Contact us.           |    max.muster@co.com   |
|                        |                        |
|  State-of-the-art      |  📞 Phone              |
|  technologies and      |    +49 123 456789      |
|  innovative solutions  |                        |
|  optimize the          |  📍 Location           |
|  manufacturing...      |    Musterstraße 123    |
+------------------------+------------------------+
```

### About Contact + Image
```text
+------------------------------------------------+
|  [Contact Info Section from above]             |
+------------------------------------------------+
|                                                |
|   [Large Building/Skyscraper Image]            |
|                                                |
+------------------------------------------------+
```

### About Contact + Map
```text
+------------------------------------------------+
|  [Contact Info Section from above]             |
+------------------------------------------------+
|                                                |
|   [Embedded Google Map]                        |
|                                                |
+------------------------------------------------+
```

---

## File Changes

### 1. `SectionPicker.tsx`

Update `SECTION_CATEGORIES` to replace embed with about_us:

**Before:**
```typescript
{ id: 'embed', label: 'Embed', icon: 'squares' as const },
```

**After:**
```typescript
{ id: 'about_us', label: 'About Us', icon: 'squares' as const },
```

### 2. `sectionTemplates.ts`

Update the `SectionTemplate` interface to replace `embed` with `about_us`:

**Before:**
```typescript
category: 'hero' | 'content' | 'cta' | 'embed' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
```

**After:**
```typescript
category: 'hero' | 'content' | 'cta' | 'about_us' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
```

Remove the 2 embed templates and add 9 new About Us templates:

| New Template ID | Name |
|-----------------|------|
| `about-split-icons` | About + Icon Features |
| `about-split-faq` | About + FAQ |
| `about-full-image` | About Full Image |
| `about-logos` | About + Logos |
| `about-2col-text` | About 2-Column Text |
| `about-split-image` | About Split + Image |
| `about-contact-info` | Contact Info |
| `about-contact-image` | Contact + Image |
| `about-contact-map` | Contact + Map |

### 3. `HighTicketPreviewCard.tsx`

Replace `EmbedPreview` with new `AboutUsPreview` component handling 9 variants:

**New preview patterns:**

| Variant | Visual Elements |
|---------|-----------------|
| `split-icons` | Image left, title + 3 icon features right |
| `split-faq` | Title + FAQ accordion left, image right |
| `full-image` | Blue label + centered title + full-width image |
| `logos` | Centered title + logo bar |
| `2col-text` | 2-column text layout |
| `split-image` | Text left, image right |
| `contact-info` | Contact title + 3 contact detail rows |
| `contact-image` | Contact info + large image below |
| `contact-map` | Contact info + map placeholder below |

### 4. `TemplatePreviewCard.tsx`

Update the category handling to replace `embed` with `about_us` if referenced.

---

## New Preview Components

### Shared Helper Components

```tsx
// Blue section label
const SectionLabel = ({ text }: { text: string }) => (
  <div className="text-[6px] text-blue-500 font-medium">{text}</div>
);

// Icon feature row (for About split-icons)
const IconFeatureRow = ({ icon, color }: { icon: 'sparkle' | 'bolt' | 'circle'; color: string }) => (
  <div className="flex items-start gap-1.5">
    <div className={cn("w-3 h-3 rounded", color)} />
    <div className="flex-1">
      <div className="h-1 w-10 bg-slate-700 rounded mb-0.5" />
      <div className="h-0.5 w-14 bg-slate-300 rounded" />
    </div>
  </div>
);

// Contact info row
const ContactRow = ({ icon }: { icon: 'mail' | 'phone' | 'pin' }) => (
  <div className="flex items-start gap-1.5">
    <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
      {/* Icon */}
    </div>
    <div className="flex-1">
      <div className="h-1 w-8 bg-slate-700 rounded mb-0.5" />
      <div className="h-0.5 w-12 bg-slate-300 rounded" />
    </div>
  </div>
);

// FAQ row
const FAQRow = () => (
  <div className="bg-white rounded p-1 border border-slate-100 flex items-center justify-between">
    <div className="h-1 w-16 bg-slate-600 rounded" />
    <ChevronDown size={6} className="text-slate-400" />
  </div>
);
```

---

## Implementation Order

1. Update `sectionTemplates.ts`:
   - Change `embed` to `about_us` in the category type
   - Remove `embedCalendar` and `embedEmpty` templates
   - Add 9 new About Us templates

2. Update `HighTicketPreviewCard.tsx`:
   - Remove `EmbedPreview` component
   - Add `AboutUsPreview` component with 9 variants
   - Update `getPreviewComponent` switch case

3. Update `SectionPicker.tsx`:
   - Change `embed` to `about_us` in `SECTION_CATEGORIES`

4. Update `TemplatePreviewCard.tsx`:
   - Replace any `embed` category references with `about_us`

---

## Result

After implementation:
- "Embed" category removed from section picker (calendar embeds available in Interactive Blocks)
- "About Us" category with 9 Perspective-style templates
- Consistent visual language with Hero, Features, and CTA templates
- Clean, professional preview cards for company/contact sections

