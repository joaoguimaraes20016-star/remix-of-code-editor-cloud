
# Complete Funnel Builder Unification - Full Refactor Plan

## Executive Summary

The funnel builder has become a tangled mess of **redundant systems, broken factories, and disconnected flows**. This plan addresses the core issue: **clicking "Multi-step Quiz" creates an `application-flow` block, but the canvas doesn't know how to properly initialize or display it**, resulting in "Step not found" errors.

## Root Cause Analysis

### Issue 1: Block Factory Creates Empty Steps
The `createQuizBlock()` in `blockFactory.ts` creates an `application-flow` block with steps that have `elements: []` arrays:

```typescript
// Current broken code (blockFactory.ts line 472-513)
function createQuizBlock(): Block {
  return {
    type: 'application-flow',
    props: {
      flowSettings: {
        steps: [{
          name: 'Question 1',
          elements: [],  // <-- EMPTY! No actual content
          settings: { questionType: 'multiple-choice', options: ['Beginner', 'Intermediate', 'Expert'] },
        }]
      }
    }
  };
}
```

The `ApplicationFlowCard` expects steps to have proper structure, but renders nothing when `elements: []`.

### Issue 2: RightPanel Can't Find Parent Block
When you click on the quiz block, the RightPanel tries to find the parent block using `selection.applicationEngineId`:

```typescript
// RightPanel.tsx line 6082
const { node: parentBlock } = findNodeById(page, selection.applicationEngineId);
if (parentBlock && parentBlock.type === 'application-flow') {
  // Show inspector
} else {
  // "Flow Step Not Found" error
}
```

But `applicationEngineId` is never set properly when clicking the quiz.

### Issue 3: Three Competing Builder Systems

| System | Location | Status |
|--------|----------|--------|
| `flow-canvas/builder/` | Active | Used by FunnelEditor |
| `builder_v2/` | Legacy | Has templates, used for conversion |
| `components/funnel-builder/` | Legacy | 32 separate files, partially used |

---

## Solution Architecture

### New Mental Model: "Screens" Not "Flows"

Perspective's approach is simple:
- **Screen = Full-page content** (Hero, Form, Thank You)
- **Each screen can have elements** (text, images, buttons, inputs)
- **Quiz = Multi-screen flow** with progress bar

We should follow this pattern:

```text
CURRENT (Broken):                    TARGET (Clean):
┌─────────────────────┐             ┌─────────────────────┐
│ Page                │             │ Funnel              │
│  └─ Steps           │             │  └─ Screens[]       │
│      └─ Frames      │             │       └─ Elements[] │
│          └─ Stacks  │     →       └─────────────────────┘
│              └─ Blocks
│                  └─ Elements
└─────────────────────┘
```

---

## Implementation Plan

### Phase 1: Fix Block Factories (Critical - Day 1)

**Goal**: Make every block in the picker actually work.

**File: `src/flow-canvas/builder/utils/blockFactory.ts`**

1. **Fix `createQuizBlock()`** - Generate proper content:
```typescript
function createQuizBlock(): Block {
  return {
    id: generateId(),
    type: 'application-flow' as BlockType,
    label: 'Quiz',
    elements: [
      // Welcome element
      { id: generateId(), type: 'heading', content: 'Apply Now', props: { level: 2 } },
      { id: generateId(), type: 'text', content: 'Answer a few quick questions to see if we are a good fit.' },
      { id: generateId(), type: 'button', content: 'Start Application →', props: { action: { type: 'next-step' } } }
    ],
    props: {
      flowSettings: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        currentStepIndex: 0,
        steps: [
          {
            id: generateId(),
            name: 'Welcome',
            type: 'welcome',
            settings: {
              title: 'Apply Now',
              description: 'Answer a few quick questions to see if we are a good fit.',
              buttonText: 'Start Application →',
            },
          },
          {
            id: generateId(),
            name: 'Question 1',
            type: 'question',
            settings: {
              title: 'What describes you best?',
              questionType: 'single-choice',
              options: [
                { id: generateId(), label: 'Beginner', value: 'beginner' },
                { id: generateId(), label: 'Intermediate', value: 'intermediate' },
                { id: generateId(), label: 'Expert', value: 'expert' },
              ],
              buttonText: 'Next',
            },
          },
          {
            id: generateId(),
            name: 'Thank You',
            type: 'ending',
            settings: {
              title: 'Thanks! We will be in touch.',
              showConfetti: true,
            },
          },
        ],
      },
    },
  };
}
```

2. **Verify all 26 block factories** create proper structures with content.

3. **Add factory validation** - Every factory must return:
   - Valid `id`
   - Valid `type`
   - At least one `element` OR valid `props.flowSettings.steps`

### Phase 2: Fix Selection & Inspector Routing (Day 1-2)

**Goal**: Clicking any block opens the correct inspector.

**File: `src/flow-canvas/builder/components/EditorShell.tsx`**

1. **Fix selection propagation** for application-flow blocks:
```typescript
// When clicking an application-flow block, set applicationEngineId
const handleSelect = useCallback((newSelection: SelectionState, isShiftHeld?: boolean) => {
  // If selecting an application-flow block, set applicationEngineId
  if (newSelection.type === 'block') {
    const block = findBlockById(page, newSelection.id);
    if (block?.type === 'application-flow') {
      newSelection.applicationEngineId = block.id;
    }
  }
  setSelection(newSelection);
}, [page]);
```

**File: `src/flow-canvas/builder/components/RightPanel.tsx`**

2. **Improve block lookup** to handle direct block selection:
```typescript
// Line ~6080: Add fallback for when applicationEngineId matches the selected block
if (selection.type === 'block' && selectedNode?.type === 'application-flow') {
  return (
    <ApplicationFlowInspector 
      block={selectedNode as Block}
      onUpdateBlock={(updates) => handleUpdate(updates)}
      selectedStepId={selectedFlowSteps[selectedNode.id] || null}
      onSelectStep={onSelectApplicationStep}
    />
  );
}
```

### Phase 3: Consolidate Redundant Systems (Day 2-3)

**Goal**: Single source of truth for the builder.

1. **Keep**: `src/flow-canvas/builder/` as the canonical implementation

2. **Migrate from `builder_v2`**:
   - Move `allSectionTemplates` to `src/flow-canvas/builder/templates/`
   - Deprecate `builder_v2/EditorShell.tsx` (keep route for backward compatibility)

3. **Audit `components/funnel-builder`**:
   - Check what's still imported
   - Mark for deprecation or removal

4. **Create unified exports**:
   ```typescript
   // src/flow-canvas/builder/index.ts
   export { EditorShell } from './components/EditorShell';
   export { CanvasRenderer } from './components/CanvasRenderer';
   export { createBlock, isValidBlockId } from './utils/blockFactory';
   export { convertTemplateToFrame } from './utils/templateConverter';
   ```

### Phase 4: Simplify Block Picker Categories (Day 3)

**Goal**: Clear mental model for users.

**File: `src/flow-canvas/builder/components/SectionPicker/`**

New categories:
| Category | Contents | Badge |
|----------|----------|-------|
| **Content** | Text, Image, Video, Divider, Spacer, List, FAQ | "Display only" |
| **Lead Capture** | Email Input, Phone Input, Contact Form | "Collects identity" |
| **Questions** | Single Choice, Multiple Choice, Dropdown, Text Input | "Collects answers" |
| **Multi-Step** | Quiz Flow, Application Form | "Full experience" |
| **Embeds** | Calendar, Payment, HTML | "External" |

### Phase 5: Runtime Parity (Day 4)

**Goal**: Published funnels match editor exactly.

1. **Verify `FlowCanvasRenderer`** uses the same rendering logic as `CanvasRenderer`
2. **Test all block types** in published mode
3. **Fix any discrepancies** between editor preview and runtime

---

## Files to Modify

| File | Action | Priority |
|------|--------|----------|
| `src/flow-canvas/builder/utils/blockFactory.ts` | Fix quiz/form factories | P0 |
| `src/flow-canvas/builder/components/EditorShell.tsx` | Fix selection routing | P0 |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Fix block type detection | P0 |
| `src/flow-canvas/builder/components/SectionPicker/*` | Reorganize categories | P1 |
| `src/flow-canvas/builder/components/ApplicationFlowCard.tsx` | Handle empty steps | P1 |
| `src/builder_v2/EditorShell.tsx` | Add deprecation banner | P2 |
| `src/components/funnel-builder/*` | Audit and deprecate | P2 |

---

## Success Criteria

1. **Clicking "Multi-step Quiz" creates a working quiz with visible content**
2. **Inspector opens correctly for all block types**
3. **No "Template not found" or "Step not found" errors**
4. **One clear path through the codebase (no confusion about which builder to use)**
5. **Published funnels render identically to editor preview**

---

## Technical Constraints

- Must maintain backward compatibility with existing saved funnels
- Cannot break published funnels (FlowCanvas format is canonical)
- Keep `builder_v2` route working (but deprecated) for edge cases
- All changes must work on mobile and desktop viewports

---

## Estimated Effort

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Fix Factories | 4 hours | Medium |
| Phase 2: Fix Selection | 3 hours | Medium |
| Phase 3: Consolidate | 4 hours | Low |
| Phase 4: Simplify Picker | 2 hours | Low |
| Phase 5: Runtime Parity | 3 hours | Medium |
| **Total** | **16 hours** | - |

