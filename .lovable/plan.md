
# Rebuild Interactive Blocks with Distinct Visual Style

## Problem Identified

From the screenshot, there are two issues:

1. **Content Bug**: "Interactive blocks" category is showing "Core Components" (Text, Button, Image, List) instead of Questions and Forms
2. **Design Issue**: The Interactive blocks should have a completely different visual style than Basic blocks - not just different icons

## Reference Analysis

From the earlier Perspective reference images, Interactive blocks should have:

| Feature | Basic Blocks | Interactive Blocks |
|---------|--------------|-------------------|
| **Title Bar** | Simple colored line | Semantic colored bar |
| **Preview** | Abstract icons | Realistic form/input mockups |
| **Layout** | Generic tile grid | Input/form-like previews |
| **Colors** | Soft pastels | Category-specific colors (green for checkbox, blue for radio, etc.) |
| **Detail Level** | Low-fidelity | High-fidelity mockups |

Interactive blocks from Perspective show:
- **Multiple-Choice**: Green checkbox rows with actual checkmark
- **Choice**: Blue radio button rows  
- **Quiz**: Two image cards side by side
- **Form**: Stacked input fields with purple accent
- **Appointment**: Teal calendar grid
- **Upload**: Dashed upload area with icon
- **Message**: Text area mockup
- **Date**: Calendar with navigation
- **Dropdown**: Select box with dropdown options
- **Payment**: Card inputs with credit card logo

---

## Architecture Change

### Current Problem
The `BlockGrid` component handles both categories but uses the same `BlockTileCard` component for both - leading to visual similarity.

### Solution
Create **two distinct grid components** with different visual treatments:

1. **BasicBlockGrid** - Simple tile cards for content blocks
2. **InteractiveBlockGrid** - High-fidelity form mockups for CTA blocks

---

## File Changes

### 1. Create `InteractiveBlockGrid.tsx`

A new component specifically for interactive blocks with:
- Higher-fidelity mockups
- Form-like visual treatments
- Interactive preview states

```tsx
// Questions section
const QUESTION_BLOCKS = [
  { id: 'multiple-choice', name: 'Multiple-Choice', ... },
  { id: 'choice', name: 'Choice', ... },
  { id: 'quiz', name: 'Quiz', ... },
  { id: 'video-question', name: 'Video question', ... },
];

// Forms section
const FORM_BLOCKS = [
  { id: 'form-block', name: 'Form', ... },
  { id: 'appointment', name: 'Appointment', ... },
  { id: 'upload', name: 'Upload', ... },
  { id: 'message', name: 'Message', ... },
  { id: 'date', name: 'Date', ... },
  { id: 'dropdown', name: 'Dropdown', ... },
  { id: 'payment', name: 'Payment', ... },
];
```

### 2. Create `InteractiveBlockIcons.tsx`

High-fidelity mockup components that look like actual form elements:

| Block | Mockup Style |
|-------|--------------|
| Multiple-Choice | Checkbox list with green checkmark, stacked options |
| Choice | Radio button list with blue filled dot, stacked options |
| Quiz | Side-by-side image cards with quiz-style selection |
| Video question | Video thumbnail with question overlay |
| Form | Stacked labeled input fields |
| Appointment | Calendar widget with time slots |
| Upload | Dashed upload zone with upload icon |
| Message | Multi-line text area |
| Date | Date picker with calendar grid |
| Dropdown | Select input with dropdown menu |
| Payment | Credit card form with card number, expiry, CVV |

### 3. Create `InteractiveBlockCard.tsx`

Different card component for interactive blocks:
- Larger preview area
- More realistic form mockups
- Different aspect ratio (less square, more form-like)

### 4. Update `SectionPicker.tsx`

```tsx
// Render different grid based on category
{activeCategory === 'content' && (
  <BasicBlockGrid onAddBlock={handleAddBlock} />
)}
{activeCategory === 'cta' && (
  <InteractiveBlockGrid onAddBlock={handleAddBlock} />
)}
```

### 5. Rename and Restructure

| Current File | New Purpose |
|--------------|-------------|
| `BlockGrid.tsx` → `BasicBlockGrid.tsx` | Only handles content category |
| `BlockIcons.tsx` → `BasicBlockIcons.tsx` | Only basic block icons |
| NEW `InteractiveBlockGrid.tsx` | Handles cta category |
| NEW `InteractiveBlockIcons.tsx` | Interactive form mockups |
| NEW `InteractiveBlockCard.tsx` | Card component for interactive blocks |

---

## Visual Specifications

### Interactive Block Card Design

```text
┌────────────────────────────────────────┐
│  ════════════════════                  │  ← Semantic title bar
│                                        │
│   ┌──────────────────────────────┐     │
│   │ ☑ Option selected            │     │  ← Realistic form preview
│   └──────────────────────────────┘     │
│   ┌──────────────────────────────┐     │
│   │ ○ Option not selected        │     │
│   └──────────────────────────────┘     │
│                                        │
│          Multiple-Choice               │  ← Block name
└────────────────────────────────────────┘
```

### Card Styling Differences

| Property | Basic Block Card | Interactive Block Card |
|----------|-----------------|----------------------|
| Aspect ratio | 1:1 (square) | ~3:4 (taller) |
| Preview height | 40-60px | 80-100px |
| Background | Single pastel color | White with colored accent |
| Border | None | Subtle border |
| Preview style | Abstract icon | Form mockup |

---

## Implementation Order

1. **Create `InteractiveBlockIcons.tsx`** - All 11 high-fidelity mockups
2. **Create `InteractiveBlockCard.tsx`** - Taller card with more preview space
3. **Create `InteractiveBlockGrid.tsx`** - Questions + Forms layout
4. **Update `SectionPicker.tsx`** - Conditional rendering
5. **Rename `BlockGrid.tsx` → `BasicBlockGrid.tsx`** - Clarity
6. **Update exports in `index.tsx`**

---

## Result

After these changes:

| Before | After |
|--------|-------|
| Same card style for all blocks | Distinct visual language per category |
| Basic icons for interactive blocks | High-fidelity form mockups |
| Same aspect ratio | Taller cards for interactive |
| Content bug (showing wrong category) | Correct content per category |
| Confusing similarity | Clear visual distinction |
