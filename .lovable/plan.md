
# Extended Inconsistency Analysis — Part 2

## Summary

Following the previous analysis, I've found **18 additional inconsistencies** that still exist in the codebase. These range from deprecated code still being actively used, to duplicate implementations, to conflicting type definitions.

---

## Category A: Deprecated Code Still in Active Use

### Issue A.1: `video-thumbnail` Still Has Dedicated Rendering in FlowCanvasRenderer

**Location**: `src/flow-canvas/components/FlowCanvasRenderer.tsx:1683-1757`

Despite the unification effort, there's a **complete separate case block** for `video-thumbnail` that duplicates the logic:

```typescript
case 'video-thumbnail': {
  const thumbnailUrl = (element.props?.thumbnailUrl as string);
  const videoUrl = (element.props?.videoUrl as string);
  // ... 70+ lines of duplicate rendering code
}
```

**Impact**: Two different render paths for the same concept, causing maintenance burden and potential visual inconsistencies.

**Fix Required**: Remove this case block entirely — the unified `video` case with `displayMode: 'thumbnail'` should handle all scenarios.

---

### Issue A.2: `video-thumbnail` Still in PREMIUM_ELEMENT_TYPES Array

**Location**: `src/flow-canvas/builder/components/RightPanel.tsx:363, 370`

```typescript
const ELEMENT_SECTIONS = {
  // ...
  'video-thumbnail': ['premium'],
} as const;

const PREMIUM_ELEMENT_TYPES = [
  'gradient-text', 'stat-number', 'avatar-group', 'ticker',
  'badge', 'process-step', 'video-thumbnail', 'underline-text'  // ← Still here
] as const;
```

**Impact**: Inspector routing logic still treats `video-thumbnail` as a separate type, leading to inconsistent inspector experiences.

---

### Issue A.3: `capture-flow-embed` Still in Valid Block Types

**Locations**:
- `src/lib/ai/parseFunnelResponse.ts:216`
- `src/lib/ai/parseAIBlockResponse.ts:28`

```typescript
const validTypes: BlockType[] = [
  'hero', 'form-field', 'cta', ..., 'capture-flow-embed',  // ← Deprecated!
];
```

**Impact**: AI can still generate deprecated block types.

---

## Category B: Duplicate Element/Block Concepts

### Issue B.1: `logo-bar` (Block) vs `logo-marquee` (Element)

**Both exist and do similar things:**

| Item | Type | Location | Behavior |
|------|------|----------|----------|
| `logo-bar` | BlockType | `infostack.ts:74` | Static logo row |
| `logo-marquee` | ElementType | `infostack.ts:44` | Animated scrolling logos |

**Templates create them inconsistently:**
- `BlockPickerPanel.tsx:412` creates `logo-bar` block with `image` element having `variant: 'logo-bar'`
- `BlockPickerPanel.tsx:686` creates `custom` block with `logo-marquee` element

**Recommended**: Unify into single `logo-marquee` element with `animated: true/false` prop.

---

### Issue B.2: FAQ as Both Block and Element

**Current State**:
- `faq` is in `FrameTemplateType` (section-level)
- `faq` is in `ElementType` (accordion widget)
- Templates create `faq` blocks that contain `faq` elements

**Confusion**: When user adds "FAQ" from BlockPicker, which one do they get?

---

### Issue B.3: `inputStyle` Type Mismatch Across Files

| File | Allowed Values |
|------|----------------|
| `infostack.ts:136` | `'default' \| 'minimal' \| 'rounded' \| 'square' \| 'pill'` |
| `captureFlow.ts:84` | `'default' \| 'minimal' \| 'rounded' \| 'square'` (missing `pill`) |
| `applicationEngine.ts:93` | `'default' \| 'minimal' \| 'rounded' \| 'square' \| 'pill'` |

**Impact**: Setting `inputStyle: 'pill'` in captureFlow will be silently invalid.

---

## Category C: Inconsistent Rendering Logic

### Issue C.1: Multiple `getContrastTextColor` Implementations

**Found 3 different implementations:**

| Location | Implementation |
|----------|----------------|
| `templateThemeUtils.ts:83` | Simple light/dark check |
| `ContrastEngine.ts:273` | Full WCAG-compliant engine |
| `CanvasUtilities.ts:110` | Wrapper around ContrastEngine |

**Problem**: Some components use the simple version, others use the full engine, leading to inconsistent text contrast.

---

### Issue C.2: `autoAdvance` Not Wired to Runtime

**Location**: `src/flow-canvas/builder/components/elements/LoaderAnimation.tsx`

The `LoaderAnimation` component has `autoAdvance` prop and `onComplete` callback, but when rendered in `FlowCanvasRenderer.tsx:1822-1834`, the `onComplete` is never connected to step progression:

```typescript
// FlowCanvasRenderer.tsx:1833
autoAdvance={autoAdvance}
// But no onComplete handler passed!
```

**Impact**: Loader element doesn't actually advance to next step when complete in published funnel.

---

### Issue C.3: `placeholder: true` Prop Has No Standard Handling

**Found in templates:**
```typescript
{ type: 'video', props: { displayMode: 'thumbnail', placeholder: true, ... } }
```

But `placeholder: true` is **never checked** in the renderer — it should show a placeholder UI but doesn't.

---

## Category D: Type System Gaps

### Issue D.1: `ButtonPreset` Defined in Multiple Places

| Location | Values |
|----------|--------|
| `infostack.ts:126` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` |
| `UnifiedButton.tsx:256` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'gradient'` (extra!) |
| `captureFlow.ts:90` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` |

**Impact**: Setting `buttonPreset: 'gradient'` on a CaptureNode will be invalid at the type level.

---

### Issue D.2: `FrameTemplateType` Includes Extra Types Not in BlockType

`labels.ts:16-20` defines frame templates:
```typescript
const frameTemplateTypes = new Set<string>([
  'hero', 'cta', 'about', 'testimonial', 'feature', 'pricing', 'faq',
  'team', 'trust', 'footer', 'contact', 'custom',
  'credibility-bar', 'stats-row', 'process-flow', 'urgency-banner',
  'ticker-bar', 'video-hero', 'split-hero', 'guarantee'  // ← Not in BlockType!
]);
```

But `BlockType` in `infostack.ts` doesn't include all of these, causing type mismatches.

---

### Issue D.3: `StepIntent` Has 5 Values But Only 4 Used

```typescript
// infostack.ts
export type StepIntent = 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete';

// labels.ts:122
export const stepIntentLabels: Record<StepIntent, string> = {
  capture: 'Collect Info',
  qualify: 'Questions',
  schedule: 'Booking',
  convert: 'Checkout',
  complete: 'Thank You',
};
```

But in actual templates and builders, only `capture`, `qualify`, and `complete` are ever used. `convert` and `schedule` have no actual implementation.

---

## Category E: builder_v2 vs flow-canvas Fragmentation

### Issue E.1: Two Parallel Builder Systems

The codebase has **two complete builder implementations**:

| System | Location | Used By |
|--------|----------|---------|
| `builder_v2` | `src/builder_v2/` | Legacy funnels, some templates |
| `flow-canvas` | `src/flow-canvas/` | New funnels |

**Shared via:**
- `templateConverter.ts` converts builder_v2 templates to flow-canvas format
- `EditorDocumentRenderer.tsx` renders builder_v2 documents in runtime

**Problems:**
- Duplicate type definitions
- Inconsistent rendering between systems
- Maintenance burden

---

### Issue E.2: `allSectionTemplates` Imported from builder_v2

**Locations**:
- `src/flow-canvas/builder/components/InlineSectionPicker.tsx:22`
- `src/flow-canvas/builder/components/EditorShell.tsx:22`

The flow-canvas builder **imports templates from builder_v2**, then converts them. This creates a dependency chain:

```
flow-canvas → builder_v2 templates → templateConverter → flow-canvas format
```

Should either:
1. Fully migrate templates to flow-canvas native format
2. Create shared template format used by both

---

## Category F: Inspector UI Gaps

### Issue F.1: Premium Element Inspector Comment Says "video-thumbnail" but Logic Changed

**Location**: `PremiumElementInspector.tsx:3-6`

```typescript
/**
 * Premium Element Inspector
 * Provides editing controls for all premium element types:
 * - gradient-text, stat-number, avatar-group, ticker
 * - badge, process-step, video-thumbnail, underline-text  // ← Comment outdated
 */
```

The comment still references `video-thumbnail` but line 1361-1362 handles it via `video` element with `displayMode: 'thumbnail'`.

---

### Issue F.2: Missing Inspector for `loader` Element

The `loader` element has:
- Rendering in `CanvasRenderer.tsx`
- Template in `BlockPickerPanel.tsx`
- Component in `LoaderAnimation.tsx`

But **no inspector section** in `RightPanel.tsx` to configure:
- Duration
- Animation type
- Auto-advance behavior
- Colors

---

## Implementation Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Remove FlowCanvasRenderer video-thumbnail case | Low | Reduces code duplication |
| P0 | Remove video-thumbnail from PREMIUM_ELEMENT_TYPES | Low | Fixes inspector routing |
| P0 | Remove capture-flow-embed from AI parsers | Low | Prevents deprecated output |
| P1 | Unify logo-bar/logo-marquee | Medium | Reduces confusion |
| P1 | Fix inputStyle type mismatch | Low | Type safety |
| P1 | Wire LoaderAnimation onComplete to runtime | Medium | Fixes broken functionality |
| P1 | Add loader element inspector | Medium | Feature completeness |
| P2 | Consolidate getContrastTextColor implementations | Medium | Consistent text contrast |
| P2 | Add missing BlockType entries | Low | Type safety |
| P2 | Document builder_v2/flow-canvas relationship | Low | Developer clarity |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Remove `video-thumbnail` case, wire loader onComplete |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Remove video-thumbnail from arrays, add loader inspector |
| `src/lib/ai/parseFunnelResponse.ts` | Remove capture-flow-embed from valid types |
| `src/lib/ai/parseAIBlockResponse.ts` | Remove capture-flow-embed from valid types |
| `src/flow-canvas/types/infostack.ts` | Add missing premium BlockTypes |
| `src/flow-canvas/types/captureFlow.ts` | Add 'pill' to inputStyle union |
| `src/flow-canvas/builder/components/inspectors/PremiumElementInspector.tsx` | Update comment |
| `src/flow-canvas/builder/utils/templateThemeUtils.ts` | Remove duplicate getContrastTextColor, use ContrastEngine |

---

## Expected Outcomes

After implementation:

1. **No duplicate rendering** — video-thumbnail completely removed
2. **Consistent types** — inputStyle, ButtonPreset unified across all files  
3. **Working loader** — auto-advances in published funnel
4. **Cleaner AI output** — no deprecated block types generated
5. **Better DX** — loader element has inspector controls
