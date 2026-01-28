

# Complete Funnel Builder Unification & Fix Plan

## Executive Summary

The funnel builder is broken at a fundamental level. The UI shows 30+ blocks to add, but **26 of them produce "Template not found" errors** because there's no factory code to create them. Additionally, there are **3 separate builder implementations** causing confusion and maintenance overhead.

---

## Problem Analysis

### Problem 1: Missing Block Factories (Critical)

The `SectionPicker` UI defines these block IDs that **don't exist** in any factory:

**Basic Blocks (BasicBlockGrid.tsx):**
| Block ID | Status |
|----------|--------|
| `text` | Missing |
| `button` | Missing |
| `image` | Missing |
| `list` | Missing |
| `divider` | Missing |
| `logo-bar` | Missing |
| `reviews` | Missing |
| `spacer` | Missing |
| `video` | Missing |
| `testimonial` | Missing |
| `faq` | Missing |
| `team` | Missing |
| `calendar` | Missing |
| `html` | Missing |
| `form` | Missing |

**Interactive Blocks (InteractiveBlockGrid.tsx):**
| Block ID | Status |
|----------|--------|
| `multiple-choice` | Missing |
| `choice` | Missing |
| `quiz` | Missing |
| `video-question` | Missing |
| `form-block` | Missing |
| `appointment` | Missing |
| `upload` | Missing |
| `message` | Missing |
| `date` | Missing |
| `dropdown` | Missing |
| `payment` | Missing |

**Premium Blocks (Working):**
`gradient-text`, `underline-text`, `stat-number`, `avatar-group`, `ticker`, `badge`, `process-step` - These 7 work correctly.

### Problem 2: Fragmented Architecture

```text
src/
├── flow-canvas/builder/          ← ACTIVE (used by FunnelEditor.tsx)
│   ├── components/EditorShell.tsx  ← Main shell
│   ├── components/RightPanel.tsx   ← Inspector
│   ├── utils/templateConverter.ts  ← Template factory
│   └── ...
├── builder_v2/                   ← LEGACY (route: /builder-v2)
│   ├── EditorShell.tsx
│   ├── templates/sectionTemplates.ts ← Template definitions
│   └── ...
├── components/funnel-builder/    ← LEGACY (partially used)
│   ├── EditorShell.tsx           ← Different component!
│   └── ...
```

The `flow-canvas` builder imports templates from `builder_v2` but doesn't have factories for most block types.

---

## Implementation Plan

### Phase 1: Create Missing Block Factories (Critical)

**File to modify:** `src/flow-canvas/builder/utils/premiumBlockFactory.ts` → Rename to `src/flow-canvas/builder/utils/blockFactory.ts`

Add factory functions for ALL missing blocks:

```typescript
// Basic Blocks
createTextBlock()         → heading or text element
createButtonBlock()       → button element
createImageBlock()        → image element with upload placeholder
createListBlock()         → feature-list element
createDividerBlock()      → divider element
createLogoBarBlock()      → logo-marquee element
createReviewsBlock()      → avatar-group with rating
createSpacerBlock()       → spacer element
createVideoBlock()        → video element with placeholder
createTestimonialBlock()  → testimonial element
createFaqBlock()          → faq element with default items
createTeamBlock()         → team grid (new element type)
createCalendarBlock()     → calendar embed (uses calendly)
createHtmlBlock()         → html-embed element
createFormBlock()         → form-group element

// Interactive Blocks
createMultipleChoiceBlock()  → multiple-choice element
createSingleChoiceBlock()    → single-choice element
createQuizBlock()            → quiz flow (application-flow style)
createVideoQuestionBlock()   → video + question combo
createAppointmentBlock()     → calendar with form
createUploadBlock()          → file upload element
createMessageBlock()         → open-ended text element
createDateBlock()            → date picker element
createDropdownBlock()        → select/dropdown element
createPaymentBlock()         → payment integration element
```

### Phase 2: Update Template Converter

**File:** `src/flow-canvas/builder/utils/templateConverter.ts`

Update `convertTemplateToFrame()` to:
1. First check `allSectionTemplates` (for full section templates)
2. Then check the new expanded block factory
3. Return proper frames with correct structure

```typescript
export function convertTemplateToFrame(templateId: string): Frame | null {
  // 1. Check section templates
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (template) {
    return canvasNodeToFrame(template.createNode());
  }

  // 2. Check block factory (expanded)
  const block = createBlock(templateId);
  if (block) {
    return wrapBlockInFrame(block);
  }

  console.warn(`Template not found: ${templateId}`);
  return null;
}
```

### Phase 3: Consolidate Architecture (Medium Priority)

**Goal:** Single source of truth for the funnel builder.

1. Keep `src/flow-canvas/builder/` as the canonical implementation
2. Move remaining useful code from `builder_v2/templates/` into flow-canvas
3. Mark `builder_v2/EditorShell.tsx` as deprecated (keep route for existing users)
4. Delete or deprecate `src/components/funnel-builder/` (check for any active usage first)

### Phase 4: Inspector Completeness

After blocks are created, ensure each has corresponding inspector controls in `RightPanel.tsx`:
- `team` element inspector
- `calendar` element inspector  
- `html-embed` element inspector
- `upload` element inspector
- `dropdown` element inspector
- `date` element inspector
- `payment` element inspector

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/flow-canvas/builder/utils/blockFactory.ts` | Create (or expand premiumBlockFactory) | All 26 missing block factories |
| `src/flow-canvas/builder/utils/templateConverter.ts` | Modify | Use new block factory |
| `src/flow-canvas/types/infostack.ts` | Modify | Add any missing element types |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Modify | Render new element types |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Modify | Add inspectors for new types |
| `src/builder_v2/EditorShell.tsx` | Deprecate | Add deprecation notice |
| `src/components/funnel-builder/*` | Audit | Check usage, deprecate if unused |

---

## Expected Outcome

After implementation:
1. All 30+ blocks in the picker will create actual content
2. No more "Template not found" errors
3. Clear architecture with one canonical builder
4. Every block type has working inspector controls
5. Perspective-style polish on all elements

---

## Technical Notes

- Block factory should return `Block` objects, wrapped into `Frame` by the converter
- Each block needs a unique element type in `ElementType` union
- CanvasRenderer must have a `case` for each new element type
- Runtime parity is automatic since FlowCanvasRenderer uses CanvasRenderer

