

# Add Quiz/Form Section Category

## Summary

Add a new "Quiz/Form" section category under "About Us" in the Section Picker. This category contains 9 Perspective-style interactive quiz templates that leverage the FlowContainer (choice/question) blocks but as pre-styled section templates.

---

## Template Patterns Identified

From the uploaded screenshots, I identified **9 distinct Quiz/Form patterns**:

| Template | Layout | Key Elements |
|----------|--------|--------------|
| **Quiz Split + Benefits** | 50/50 | Quiz question left (blue label, title, 4 radio options, submit button), benefits card right (title + 3 icon features) |
| **Quiz Centered Simple** | Centered | Blue label, title, subtext, 2x2 grid of white text options with icons |
| **Quiz Centered Filled** | Centered | Same layout but with filled blue button options |
| **Quiz Centered Gray BG** | Centered | Same as simple but with gray background |
| **Quiz Centered Card** | Centered | Quiz inside a white/gray card container with rounded corners |
| **Quiz Image Cards** | Centered | Blue label, title, subtext, 4 image cards in a row with labels at bottom |
| **Quiz Image Cards (Gray BG)** | Centered | Same as above but with gray background |
| **Quiz 2 Image Cards** | Centered | For fewer options - 2 large image cards side by side |
| **Quiz Split + Info Card** | 50/50 | Quiz with 2x2 image cards left, info card with icon right |

---

## File Changes

### 1. `SectionPicker.tsx`

Add `quiz_form` to `SECTION_CATEGORIES` after `about_us`:

```typescript
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta', label: 'Call to Action', icon: 'sparkles' as const },
  { id: 'about_us', label: 'About Us', icon: 'squares' as const },
  { id: 'quiz_form', label: 'Quiz/Form', icon: 'sparkles' as const }, // NEW
  { id: 'team', label: 'Team', icon: 'people' as const },
  // ...
];
```

### 2. `sectionTemplates.ts`

Update `SectionTemplate` interface to add `quiz_form` category:

```typescript
category: 'hero' | 'content' | 'cta' | 'about_us' | 'quiz_form' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
```

Add 9 new Quiz/Form templates:

| Template ID | Name |
|-------------|------|
| `quiz-split-benefits` | Quiz + Benefits Card |
| `quiz-centered-simple` | Quiz Centered (Simple) |
| `quiz-centered-filled` | Quiz Centered (Filled) |
| `quiz-centered-gray` | Quiz Centered (Gray BG) |
| `quiz-centered-card` | Quiz Card |
| `quiz-image-cards` | Quiz Image Cards |
| `quiz-image-cards-gray` | Quiz Image Cards (Gray BG) |
| `quiz-2-images` | Quiz 2 Options |
| `quiz-split-info` | Quiz + Info Card |

### 3. `HighTicketPreviewCard.tsx`

Add new `QuizFormPreview` component with 9 variants:

---

## ASCII Template Layouts

### Quiz Split + Benefits
```text
+------------------------+------------------------+
| Tell us about your...  |  Your exclusive        |
| What is your goal      |  benefits              |
| with the Community?    |                        |
|                        |  💡 Scalable           |
| ○ Gain loyal fans      |     Our templates...   |
| ○ Secure competitive.. |  ⚡ Easy & Fast        |
| ○ Create customer...   |     Achieve results... |
| ○ Receive support      |  🌱 Sustainable Growth |
|                        |     Generate robust... |
| [Submit and Continue]  |                        |
+------------------------+------------------------+
```

### Quiz Centered Simple
```text
+------------------------------------------------+
|              One last Question                  |
|    What is your Community goal?                 |
|  Answer the question to find the right course   |
|                                                 |
|   [🏆 Gain loyal fans] [🚀 Secure competitive] |
|   [⭐ Create customer] [📞 Receive support]    |
|                                                 |
+------------------------------------------------+
```

### Quiz Centered Filled
```text
+------------------------------------------------+
|              One last Question                  |
|    What is your Community goal?                 |
|  Answer the question to find the right course   |
|                                                 |
| [🏆 Gain loyal fans ] [🚀 Secure competitive ] |
| [⭐ Create customer ] [📞 Receive support     ] |
|         (Blue filled buttons)                   |
+------------------------------------------------+
```

### Quiz Centered Gray BG
```text
+------------------------------------------------+
| [Gray Background]                              |
|              One last Question                  |
|    What is your Community goal?                 |
|  Answer the question to find the right course   |
|                                                 |
|   [🏆 Gain loyal fans] [🚀 Secure competitive] |
|   [⭐ Create customer] [📞 Receive support]    |
+------------------------------------------------+
```

### Quiz Centered Card
```text
+------------------------------------------------+
|           ┌────────────────────────┐           |
| [Gray BG] │  One last Question     │           |
|           │  What is your goal?    │           |
|           │                        │           |
|           │  ○ Option 1  ○ Option 2│           |
|           │  ○ Option 3  ○ Option 4│           |
|           └────────────────────────┘           |
+------------------------------------------------+
```

### Quiz Image Cards
```text
+------------------------------------------------+
|              One last Question                  |
|    What is your Community goal?                 |
|                                                 |
|  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       |
|  │ IMG  │  │ IMG  │  │ IMG  │  │ IMG  │       |
|  │      │  │      │  │      │  │      │       |
|  │[Gain]│  │[Stay]│  │[Loyal]│ │[Get] │       |
|  └──────┘  └──────┘  └──────┘  └──────┘       |
+------------------------------------------------+
```

### Quiz 2 Image Cards
```text
+------------------------------------------------+
|           Choose your Model                     |
|  Which model would you like to test drive?      |
|                                                 |
|       ┌──────────┐    ┌──────────┐             |
|       │   IMG    │    │   IMG    │             |
|       │  (Car)   │    │  (Car)   │             |
|       └──────────┘    └──────────┘             |
+------------------------------------------------+
```

### Quiz Split + Info Card
```text
+------------------------+------------------------+
| What is you            |                        |
| Community goal?        |   [💬 Icon/Illustration]|
|                        |                        |
| ┌────┐ ┌────┐         |   Do you want to       |
| │IMG │ │IMG │         |   further expand       |
| │Gain│ │Stay│         |   your community?      |
| └────┘ └────┘         |                        |
| ┌────┐ ┌────┐         |   Our templates helped |
| │IMG │ │IMG │         |   grow to 2,500...     |
| │Loyal││Get │         |                        |
| └────┘ └────┘         |                        |
+------------------------+------------------------+
```

---

## New Preview Components

### QuizFormPreview Component

```tsx
const QuizFormPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // Shared components
    const BlueSectionLabel = () => (
      <div className="text-[6px] text-blue-500 font-medium">One last Question</div>
    );
    
    const QuizOption = ({ filled, icon }: { filled?: boolean; icon?: boolean }) => (
      <div className={cn(
        "h-4 flex items-center gap-1 px-1.5 rounded border",
        filled 
          ? "bg-blue-500 border-blue-500" 
          : "bg-white border-slate-200"
      )}>
        {icon && <div className="w-2 h-2 rounded bg-amber-400" />}
        <div className={cn("h-1 w-10 rounded", filled ? "bg-white" : "bg-slate-600")} />
        {!filled && <div className="w-2 h-2 rounded-full border border-slate-300" />}
      </div>
    );
    
    const ImageCard = () => (
      <div className="flex flex-col rounded overflow-hidden">
        <div className="h-6 bg-gradient-to-br from-slate-200 to-slate-300" />
        <div className="h-3 bg-blue-500 flex items-center justify-center">
          <div className="h-1 w-8 bg-white rounded" />
        </div>
      </div>
    );
    
    // Variant implementations...
  }
);
```

---

## Visual Style Specifications

### Common Elements

| Element | Style |
|---------|-------|
| **Section Label** | Blue text "One last Question" above title |
| **Headlines** | Bold slate-800 text |
| **Subtext** | Light slate-400 text |
| **Radio Options** | White bg + border + circle, or filled blue |
| **Image Cards** | Rounded image + blue footer with label |
| **Icons** | Small colored circles (amber, blue, purple) |

### Color Palette

| Variant | Background | Options |
|---------|------------|---------|
| Simple | White | White + border |
| Filled | White | Blue filled |
| Gray BG | Slate-50 | White + border |
| Card | Slate-50 outer, White card | White + border |
| Image Cards | White/Gray | Image + Blue footer |

---

## Template Node Structure

Each quiz template creates nodes that integrate with the existing FlowContainer/choice system:

```typescript
export const quizCenteredSimple: SectionTemplate = {
  id: 'quiz-centered-simple',
  name: 'Quiz Centered',
  description: 'Centered quiz with 2x2 choice grid',
  category: 'quiz_form',
  icon: 'list',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz' },
    children: [
      { type: 'label', props: { text: 'One last Question' } },
      { type: 'heading', props: { text: 'What is your Community goal?', level: 'h2' } },
      { type: 'paragraph', props: { text: 'Answer the question to find the right course...' } },
      { 
        type: 'choice_group',
        props: { 
          layout: 'grid-2x2',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ]
        }
      },
    ],
  }),
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/SectionPicker/SectionPicker.tsx` | Add `quiz_form` to `SECTION_CATEGORIES` |
| `src/builder_v2/templates/sectionTemplates.ts` | Add `quiz_form` to category type, add 9 new templates, update exports |
| `src/flow-canvas/builder/components/HighTicketPreviewCard.tsx` | Add `QuizFormPreview` component with 9 variants, add case to `getPreviewComponent` |
| `src/builder_v2/components/TemplatePreviewCard.tsx` | Add `quiz_form` category handling if needed |

---

## Implementation Order

1. **Update `sectionTemplates.ts`**:
   - Add `quiz_form` to the category type union
   - Add 9 new quiz template definitions
   - Update `allSectionTemplates` array
   - Update `sectionTemplatesByCategory` object
   - Update `categoryLabels`, `categoryDescriptions`, `categoryIcons`

2. **Update `HighTicketPreviewCard.tsx`**:
   - Add `QuizFormPreview` component with all 9 variants
   - Add `quiz_form` case to `getPreviewComponent` switch

3. **Update `SectionPicker.tsx`**:
   - Add `quiz_form` to `SECTION_CATEGORIES` after `about_us`

4. **Update `TemplatePreviewCard.tsx`** (if needed):
   - Ensure `quiz_form` category is handled

---

## Result

After implementation:
- New "Quiz/Form" category visible in Section Picker below "About Us"
- 9 Perspective-style quiz templates matching the reference screenshots
- Visual consistency with Hero, Features, CTA, and About Us templates
- Templates integrate with existing FlowContainer choice system for runtime functionality

