

# Complete Funnel Builder Overhaul: Perspective-Style Clean Experience

## Executive Summary

After deep analysis of both the codebase and Perspective's UI, I've identified the core issues causing the builder to feel "messy" and "hard-coded." This plan provides a comprehensive fix to make the builder match Perspective's clean, professional editing experience.

---

## Problems Identified

### 1. Template Conversion Creates Bloated Structures

**Current behavior:**
```text
Template Definition → templateConverter → Frame
┌──────────────────┐   ┌──────────────────────────────────────────┐
│ heading          │   │ Block 1: heading element                 │
│ spacer (24px)    │→ →│ Block 2: spacer element                  │  ← CLUTTER!
│ text             │   │ Block 3: text element                    │
│ spacer (16px)    │   │ Block 4: spacer element                  │  ← CLUTTER!
│ button           │   │ Block 5: button element                  │
│ spacer (24px)    │   │ Block 6: spacer element                  │  ← CLUTTER!
│ image            │   │ Block 7: image element                   │
└──────────────────┘   └──────────────────────────────────────────┘
```

**Perspective approach:**
- Uses CSS `gap` for spacing between elements
- No visible spacer blocks in the editor
- Clean vertical stack with just the semantic content

### 2. Basic Blocks Have No Factory (Fatal Gap)

When clicking "Text", "Button", "Image" in the SectionPicker, the `templateId` passed to `convertTemplateToFrame()` returns `null` because:
- `allSectionTemplates` only contains section templates (hero-simple, etc.)
- `isPremiumBlockId` only checks premium elements (gradient-text, etc.)
- **No factory exists for basic blocks!**

### 3. Templates Use Legacy Styling Patterns

Current templates specify:
- Hard-coded `variant: 'primary'`
- No gradient/fill controls
- No responsive overrides
- No editable state styles (hover/active)

Perspective provides:
- Direct color controls
- Gradient support
- Star color pickers
- Avatar image selectors
- All props editable in inspector

### 4. Interactive Blocks Missing from Factory

When clicking "Multiple Choice", "Form", etc., same problem - no factory handles these IDs.

---

## Solution Architecture

### Phase 1: Create Block Factories

Create two new factory files to handle all block creation:

```text
src/flow-canvas/builder/utils/
├── basicBlockFactory.ts      (NEW - 15 basic blocks)
├── interactiveBlockFactory.ts (NEW - 11 interactive blocks)
├── premiumBlockFactory.ts     (EXISTS - 7 premium elements)
└── templateConverter.ts       (MODIFY - route to factories)
```

### Phase 2: Clean Template Conversion

Modify `templateConverter.ts` to:
1. **Filter out spacer/divider nodes** from templates
2. **Use gap-based spacing** at the Frame level
3. **Merge adjacent text elements** into single blocks
4. **Route to appropriate factory** based on templateId

### Phase 3: Perspective-Style Inspector Controls

The inspector already has sophisticated controls (per RightPanel.tsx at 5732 lines). The issue is templates don't set the right props. Fix by:
1. Setting proper default props in factories
2. Ensuring element types match inspector switch cases
3. Adding missing controls for template-specific elements

---

## Implementation Details

### File 1: `basicBlockFactory.ts` (NEW)

Creates polished blocks for all basic elements with Perspective-style defaults.

| Block ID | Element Type | Default Content | Key Styling |
|----------|--------------|-----------------|-------------|
| `text` | `text` | "Your text here..." | base, center, #111827 |
| `button` | `button` | "Get Started" | primary, lg, rounded-xl |
| `image` | `image` | placeholder | 16:9, cover, rounded-xl |
| `video` | `video` | placeholder | 16:9, thumbnail mode |
| `divider` | `divider` | — | gray, 1px, 80% width |
| `spacer` | `spacer` | — | 40px height |
| `logo-bar` | `logo-marquee` | 5 brand names | wordmark fallback |
| `reviews` | `avatar-group` | 4 avatars + 4.8★ | showRating: true |
| `list` | `text` + icons | 3 bullet points | checkmark icons |
| `testimonial` | `text` | quote + author | italic, smaller author |
| `faq` | `faq` | 2 Q&As | accordion style |
| `team` | `image` + `text` | photo + name | rounded avatar |
| `calendar` | `video` (placeholder) | booking embed | placeholder state |
| `form` | `input` + `button` | email + submit | stacked, full-width |
| `html` | `html-embed` | code placeholder | monospace preview |

### File 2: `interactiveBlockFactory.ts` (NEW)

Creates blocks for quiz/form elements with proper interaction props.

| Block ID | Element Type | Default Content | Key Props |
|----------|--------------|-----------------|-----------|
| `multiple-choice` | `multiple-choice` | 4 options | grid, 2 cols |
| `choice` | `single-choice` | 2 image cards | card layout |
| `quiz` | `multiple-choice` | question + options | icons, blue bg |
| `video-question` | `video` + `multiple-choice` | video + options | stacked |
| `form-block` | inputs + button | name, email, phone | stacked |
| `appointment` | booking embed | calendar | placeholder |
| `upload` | upload zone | drop area | dashed border |
| `message` | textarea | long message | 4 rows |
| `date` | date picker | date input | calendar icon |
| `dropdown` | select | 4 options | chevron icon |
| `payment` | payment form | Stripe checkout | placeholder |

### File 3: `templateConverter.ts` (MODIFY)

Update the conversion flow:

```typescript
export function convertTemplateToFrame(templateId: string): Frame | null {
  // 1. Try section templates
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (template) {
    return convertSectionTemplateClean(template); // NEW: clean conversion
  }
  
  // 2. Try basic block factory
  if (isBasicBlockId(templateId)) {
    const block = createBasicBlock(templateId);
    if (block) return wrapBlockInCleanFrame(block);
  }
  
  // 3. Try interactive block factory  
  if (isInteractiveBlockId(templateId)) {
    const block = createInteractiveBlock(templateId);
    if (block) return wrapBlockInCleanFrame(block);
  }
  
  // 4. Try premium block factory (existing)
  if (isPremiumBlockId(templateId)) {
    const block = createPremiumBlock(templateId);
    if (block) return wrapBlockInCleanFrame(block);
  }
  
  return null;
}

// NEW: Clean section template conversion (no spacers)
function convertSectionTemplateClean(template: SectionTemplate): Frame {
  const node = template.createNode();
  const blocks: Block[] = [];
  
  // Filter out spacers and dividers - use gap instead
  const contentNodes = (node.children || []).filter(
    child => child.type !== 'spacer' && child.type !== 'divider'
  );
  
  for (const child of contentNodes) {
    blocks.push(convertNodeToCleanBlock(child));
  }
  
  return {
    id: generateId(),
    label: template.name,
    background: 'transparent',
    stacks: [{
      id: generateId(),
      label: 'Content',
      direction: 'vertical',
      blocks,
      props: { gap: 20 }  // Gap replaces spacers
    }],
    // Clean Perspective-style defaults
    paddingVertical: 32,
    paddingHorizontal: 20,
    blockGap: 20,
  };
}

// NEW: Wrap single block in minimal frame
function wrapBlockInCleanFrame(block: Block): Frame {
  return {
    id: generateId(),
    label: block.label || 'Section',
    background: 'transparent',
    stacks: [{
      id: generateId(),
      label: 'Content',
      direction: 'vertical',
      blocks: [block],
      props: { alignment: 'center' }
    }],
    paddingVertical: 24,
    paddingHorizontal: 16,
    blockGap: 16,
  };
}
```

### Phase 4: CSS Updates (`index.css`)

Add Perspective-style visual polish:

```css
/* Clean gap-based layouts */
.perspective-stack {
  display: flex;
  flex-direction: column;
  gap: var(--block-gap, 20px);
}

/* Remove spacer visibility in runtime */
.flow-canvas-runtime .spacer-placeholder {
  display: none;
}

/* Perspective-style choice cards */
.perspective-choice-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: #2563EB;
  color: white;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.perspective-choice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* Perspective-style rating display */
.perspective-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.perspective-star {
  color: #FACC15;
  fill: #FACC15;
}

/* Clean form inputs */
.perspective-input {
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.perspective-input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}
```

---

## Visual Comparison: Before vs After

### Adding "Text" Block

**Before:**
- Click "Text" → Toast: "Template not found"
- Nothing added to canvas

**After:**
- Click "Text" → Clean text block appears
- Centered, readable default: "Your text here. Click to edit."
- Immediate inspector controls for font, size, color

### Adding "Hero + Reviews" Section

**Before:**
```
[Heading Block]
[Spacer Block]      ← Visible, selectable, cluttery
[Text Block]
[Spacer Block]      ← Visible, selectable, cluttery
[Button Block]
[Spacer Block]      ← Visible, selectable, cluttery
[Avatar Group Block]
[Spacer Block]      ← Visible, selectable, cluttery
[Image Block]
```

**After:**
```
[Hero Section Frame]
├── Heading: "More Success with Less Effort"
├── Text: "With our tailored solutions..."
├── Button: "Learn more now"
├── Reviews: 4 avatars + 4.8★ + "from 148 reviews"
└── Image placeholder
(Gap: 20px between all elements, no spacer blocks)
```

### Choice/Quiz Questions (Perspective-style)

**Before:**
- Plain radio buttons
- No icons
- Basic styling

**After:**
- Full-width blue cards
- Emoji icons (🤝 🚀 🌟 📞)
- White text on blue background
- Hover lift effect
- Stacked layout with proper gap

---

## Files to Create/Modify

| File | Action | Lines Est. |
|------|--------|------------|
| `src/flow-canvas/builder/utils/basicBlockFactory.ts` | **Create** | ~250 |
| `src/flow-canvas/builder/utils/interactiveBlockFactory.ts` | **Create** | ~300 |
| `src/flow-canvas/builder/utils/templateConverter.ts` | **Major refactor** | +150 |
| `src/flow-canvas/index.css` | **Add styles** | +100 |

---

## Technical Notes

### Block ID Recognition Chain (Updated)

```text
handleAddSectionFromTemplate(templateId)
           │
           ▼
   convertTemplateToFrame(templateId)
           │
           ├─► Section Template? (hero-simple, cta-simple, etc.)
           │   └─► convertSectionTemplateClean() - filters spacers
           │
           ├─► Basic Block? (text, button, image, logo-bar, etc.)
           │   └─► createBasicBlock() → wrapBlockInCleanFrame()
           │
           ├─► Interactive Block? (multiple-choice, form-block, etc.)
           │   └─► createInteractiveBlock() → wrapBlockInCleanFrame()
           │
           └─► Premium Block? (gradient-text, stat-number, etc.)
               └─► createPremiumBlock() → wrapBlockInCleanFrame()
```

### Spacer Elimination Strategy

Templates define spacers for historical reasons. Instead of modifying 3500+ lines of templates, we filter them during conversion:

```typescript
const contentNodes = (node.children || []).filter(
  child => !['spacer', 'divider'].includes(child.type)
);
```

Then use Frame-level `blockGap` for consistent spacing.

### Inspector Compatibility

All elements created by factories use standard `ElementType` values that already have inspector support in `RightPanel.tsx`:
- `text`, `heading` → Typography controls
- `button` → Fill, gradient, icon, action controls
- `image`, `video` → Media controls
- `avatar-group` → Count, size, rating controls
- `logo-marquee` → Logo list, animation controls
- `multiple-choice` → Options editor, layout controls

---

## Success Criteria

After implementation:

1. **All 15 basic blocks add successfully** with polished defaults
2. **All 11 interactive blocks add successfully** with proper props
3. **Section templates render clean** without visible spacer blocks
4. **Everything is editable** via the inspector
5. **Visual quality matches Perspective** - clean, professional, consistent

