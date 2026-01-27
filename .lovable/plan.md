
# Funnel Builder Consistency & Architecture Fix

## Overview
This plan addresses all P0 and P1 issues identified in the funnel builder: type fragmentation, deprecated code cleanup, missing inspector controls, and utility consolidation.

---

## Phase 1: StepIntent Type Unification (P0)

### Problem
`StepIntent` is defined inconsistently across 5 files with different values, causing type errors and runtime bugs.

### Solution
Establish `src/flow-canvas/types/infostack.ts` as the single source of truth.

**Canonical Definition:**
```typescript
export type StepIntent = 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete';
```

### Files to Update

| File | Current | Action |
|------|---------|--------|
| `src/builder_v2/types.ts` | `'optin' \| 'content' \| 'checkout' \| 'thank_you'` | Re-export from infostack.ts |
| `src/lib/funnel/types.ts` | `'capture' \| 'collect' \| 'schedule' \| 'complete'` | Re-export from infostack.ts |
| `src/lib/funnels/stepIntent.ts` | Local type definition | Import from infostack.ts |
| `src/flow-canvas/shared/hooks/useUnifiedLeadSubmit.ts` | 6 variants including 'navigate', 'info' | Import canonical + extend locally if needed |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Local `StepIntentType` | Remove local type, import canonical |

---

## Phase 2: Deprecated Code Removal (P0)

### 2.1 Remove `video-thumbnail-block` from BlockPickerPanel
**File:** `src/flow-canvas/builder/components/BlockPickerPanel.tsx`
**Action:** Remove the template entry at line ~937

### 2.2 Remove `capture-flow-embed` from BlockType
**File:** `src/flow-canvas/types/infostack.ts`
**Action:** Remove `'capture-flow-embed'` from the `BlockType` union (line 64)

---

## Phase 3: Loader Element Parity (P1)

### 3.1 Fix CanvasRenderer Loader Props
**File:** `src/flow-canvas/builder/components/CanvasRenderer.tsx`
**Location:** Lines 3360-3405

**Current (broken):**
```typescript
<LoaderAnimation
  steps={loaderSteps}
  stepDuration={stepDuration}
  isBuilder={true}
/>
```

**Fixed:**
```typescript
<LoaderAnimation
  steps={loaderSteps}
  stepDuration={stepDuration}
  autoAdvance={element.props?.autoAdvance ?? true}
  isBuilder={true}
  onComplete={() => {
    // In editor, just log completion
    console.log('[Builder] Loader complete');
  }}
/>
```

### 3.2 Add Loader Inspector Section
**File:** `src/flow-canvas/builder/components/RightPanel.tsx`

Add `'loader'` to `ELEMENT_SECTIONS` and create inspector UI with:
- Duration slider (1-10 seconds)
- Auto-advance toggle
- Custom step text editor
- Color pickers (text, background, accent)
- Animation style selector

---

## Phase 4: Utility Consolidation (P1)

### 4.1 Consolidate `shiftHue`
**Single Source:** `src/flow-canvas/builder/components/renderers/CanvasUtilities.ts`

**Files to Update:**
| File | Action |
|------|--------|
| `FlowCanvasRenderer.tsx` (line 42) | Remove local, import from CanvasUtilities |
| `templateThemeUtils.ts` (line 132) | Remove local, import from CanvasUtilities |

### 4.2 Consolidate `getContrastTextColor`
**Single Source:** `src/flow-canvas/shared/utils/ContrastEngine.ts`

**Files to Update:**
| File | Action |
|------|--------|
| `CanvasUtilities.ts` | Already delegates ✓ |
| `templateThemeUtils.ts` (line 83) | Replace with import from ContrastEngine |

### 4.3 Consolidate `gradientToCSS`
**Single Source:** `src/flow-canvas/builder/components/modals/GradientPickerPopover.tsx`

**Files to Update:**
| File | Action |
|------|--------|
| `FlowCanvasRenderer.tsx` (line 32) | Remove local, import from GradientPickerPopover |

### 4.4 Consolidate `effectClasses`
**Single Source:** `src/flow-canvas/builder/components/renderers/CanvasUtilities.ts`

**Files to Update:**
| File | Action |
|------|--------|
| `CanvasRenderer.tsx` (line 253-283) | Remove local, import from CanvasUtilities |

---

## Phase 5: Context Consolidation (P2)

### 5.1 FormStateContext & ThemeContext
**Single Source:** `src/flow-canvas/builder/components/renderers/CanvasUtilities.ts`

**Files to Update:**
| File | Action |
|------|--------|
| `CanvasRenderer.tsx` (lines 166-183, 236-244) | Remove local definitions, import from CanvasUtilities |

---

## Implementation Order

```text
┌─────────────────────────────────────────────────────────┐
│ Step 1: Type Unification                                │
│   └─► Update 5 files to use canonical StepIntent        │
├─────────────────────────────────────────────────────────┤
│ Step 2: Deprecated Removal                              │
│   └─► Remove video-thumbnail-block, capture-flow-embed  │
├─────────────────────────────────────────────────────────┤
│ Step 3: Loader Fixes                                    │
│   ├─► Fix CanvasRenderer props                          │
│   └─► Add loader inspector section                      │
├─────────────────────────────────────────────────────────┤
│ Step 4: Utility Consolidation                           │
│   ├─► shiftHue → CanvasUtilities                        │
│   ├─► getContrastTextColor → ContrastEngine             │
│   ├─► gradientToCSS → GradientPickerPopover             │
│   └─► effectClasses → CanvasUtilities                   │
├─────────────────────────────────────────────────────────┤
│ Step 5: Context Consolidation                           │
│   └─► FormStateContext, ThemeContext → CanvasUtilities  │
└─────────────────────────────────────────────────────────┘
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/flow-canvas/types/infostack.ts` | Remove `capture-flow-embed` |
| `src/builder_v2/types.ts` | Re-export StepIntent |
| `src/lib/funnel/types.ts` | Re-export StepIntent |
| `src/lib/funnels/stepIntent.ts` | Import canonical StepIntent |
| `src/flow-canvas/shared/hooks/useUnifiedLeadSubmit.ts` | Import canonical StepIntent |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Remove local types/utils, import consolidated |
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Fix loader props, import utilities |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Add loader inspector section |
| `src/flow-canvas/builder/components/BlockPickerPanel.tsx` | Remove video-thumbnail-block |
| `src/flow-canvas/shared/utils/templateThemeUtils.ts` | Remove duplicated utilities |

---

## Expected Outcomes

1. **Single Source of Truth**: All `StepIntent` references point to `infostack.ts`
2. **No Deprecated Code**: `video-thumbnail-block` and `capture-flow-embed` completely removed
3. **Editor-Runtime Parity**: Loader element behaves identically in editor and published site
4. **Configurable Loader**: Users can customize loader via inspector panel
5. **Maintainable Utilities**: Color/gradient functions consolidated, reducing code duplication by ~150 lines
