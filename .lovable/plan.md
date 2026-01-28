
# Funnel Builder Finalization Plan

## Current State Assessment

After thorough exploration, the funnel builder is approximately **85% complete**. The core architecture is solid with:
- Full element type system (30+ element types)
- Template conversion pipeline working
- Inspector support for most elements
- Runtime rendering via CanvasRenderer in read-only mode
- Premium elements (gradient-text, stat-number, ticker, badge, etc.)

## Remaining Gaps (Priority Ordered)

### Phase 1: Critical UX Fixes (HIGH PRIORITY)

#### 1.1 Video/Image Empty State Placeholders
**Issue**: Empty video/image elements render as blank gray boxes with no indication they're upload zones.

**Files to modify**:
- `src/flow-canvas/builder/components/CanvasRenderer.tsx`

**Changes**:
```typescript
// For video case (around line 2300):
if (!videoSrc && !readOnly) {
  return (
    <div className="aspect-video bg-gray-900/30 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500/50 cursor-pointer hover:border-primary/50 transition-colors">
      <Play className="w-10 h-10 text-gray-400" />
      <span className="text-sm text-gray-400">Click to add video</span>
    </div>
  );
}

// For image case (around line 2500):
if (!imageSrc && !readOnly) {
  return (
    <div className="aspect-video bg-gray-900/30 rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-500/50 cursor-pointer hover:border-primary/50 transition-colors">
      <ImageIcon className="w-10 h-10 text-gray-400" />
      <span className="text-sm text-gray-400">Click to add image</span>
    </div>
  );
}
```

#### 1.2 Fix Countdown Element Inspector
**Issue**: Countdown element exists but may have incomplete inspector controls.

**Files to check/fix**:
- `src/flow-canvas/builder/components/RightPanel.tsx`

**Changes**: Ensure countdown section includes:
- End date/time picker
- Display format (days/hours/minutes/seconds toggles)
- Expiration action (hide, show message, redirect)
- Styling controls (size, colors)

#### 1.3 Fix Carousel Element Inspector
**Issue**: Carousel element type exists but needs full inspector support.

**Files to modify**:
- `src/flow-canvas/builder/components/RightPanel.tsx`

**Changes**: Add carousel inspector section with:
- Image list management (add/remove/reorder)
- Auto-play toggle and interval
- Navigation style (dots, arrows, both)
- Transition effect (slide, fade)

---

### Phase 2: Visual Polish (MEDIUM PRIORITY)

#### 2.1 Add Ticker CSS Animation
**Status**: Already implemented in CanvasRenderer (lines 3334-3416) with `ticker-container` and `ticker-content` classes.

**Files to verify**:
- `src/flow-canvas/index.css` - Ensure ticker keyframes exist

**Changes if missing**:
```css
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.ticker-container {
  overflow: hidden;
  white-space: nowrap;
}

.ticker-content {
  display: inline-block;
  animation: ticker-scroll var(--ticker-speed, 30s) linear infinite;
  animation-direction: var(--ticker-direction, normal);
}
```

#### 2.2 Process Step Connectors
**Issue**: Process steps show `showConnector: true` but no visual arrows between steps.

**Files to modify**:
- `src/flow-canvas/builder/components/CanvasRenderer.tsx` (around line 3515)

**Changes**: Add connector SVG between process steps:
```typescript
{showConnector && (
  <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-10">
    <ArrowRight className="w-5 h-5 text-white/30" />
  </div>
)}
```

#### 2.3 Avatar Group Enhancement
**Status**: Already implemented with varied colors, gradient mode, and rating display (lines 3212-3331).

**Verify**: Ensure proper overlapping with negative margin and border styling.

---

### Phase 3: Application Flow Enhancements (MEDIUM PRIORITY)

#### 3.1 Inline Choice Option Editing
**Status**: Choice inspector already exists in RightPanel.tsx (lines 3330-3433) with:
- Choice type toggle (single/multiple)
- Layout selector (vertical/horizontal/grid)
- Sortable options list
- Add/remove options
- Image URL support

**Verify**: Ensure changes propagate to canvas immediately.

#### 3.2 Application Flow Step Inspector
**Status**: Full inspector exists in `ApplicationFlowInspector.tsx` with:
- Step list management
- Step content editor
- Design presets
- Background editor

**Enhancement needed**: Add quick actions for common step types (welcome, question, capture, ending).

---

### Phase 4: Runtime Parity Verification (MEDIUM PRIORITY)

#### 4.1 FlowCanvasRenderer Sync
**Current architecture**: FlowCanvasRenderer imports CanvasRenderer in read-only mode, ensuring automatic parity.

**Files to verify**:
- `src/flow-canvas/components/FlowCanvasRenderer.tsx`

**Verify**:
- All element types render correctly at runtime
- Form submission works
- Button actions execute (next-step, submit, redirect)
- Animations play correctly

#### 4.2 Mobile Responsiveness
**Verify**: All elements respect responsive breakpoints and touch targets.

---

### Phase 5: Final Polish (LOW PRIORITY)

#### 5.1 Undo/Redo Support
**If not implemented**: Add history tracking for element changes.

#### 5.2 Keyboard Shortcuts
**Verify shortcuts work**:
- Delete/Backspace: Delete selected element
- Cmd/Ctrl+D: Duplicate
- Cmd/Ctrl+C/V: Copy/Paste
- Arrow keys: Navigate between elements

#### 5.3 Loading States
**Verify**: All async operations (save, publish, image upload) show proper loading indicators.

---

## Implementation Order

```text
Day 1: Phase 1 (Critical UX)
├── 1.1 Video/Image placeholders
├── 1.2 Countdown inspector verification
└── 1.3 Carousel inspector

Day 2: Phase 2 (Visual Polish)
├── 2.1 Ticker animation verification
├── 2.2 Process step connectors
└── 2.3 Avatar group verification

Day 3: Phase 3 & 4 (Flow & Runtime)
├── 3.1 Choice editing verification
├── 3.2 Application Flow quick actions
└── 4.1-4.2 Runtime parity testing

Day 4: Phase 5 (Final Polish)
├── 5.1 Undo/Redo (if needed)
├── 5.2 Keyboard shortcuts
└── 5.3 Loading states
```

---

## Files to Modify (Summary)

| File | Changes |
|------|---------|
| `src/flow-canvas/builder/components/CanvasRenderer.tsx` | Empty state placeholders for video/image, process step connectors |
| `src/flow-canvas/builder/components/RightPanel.tsx` | Verify/complete countdown and carousel inspectors |
| `src/flow-canvas/index.css` | Verify ticker animation keyframes |
| `src/flow-canvas/builder/components/inspectors/ApplicationFlowInspector.tsx` | Add quick step type actions |
| `src/flow-canvas/components/FlowCanvasRenderer.tsx` | Verify runtime parity |

---

## Success Criteria

After implementation:
1. Every template element is fully editable on canvas
2. Empty media elements show clear upload prompts
3. All premium elements (gradient-text, ticker, badge, etc.) render and edit correctly
4. Application Flow steps are fully configurable
5. Published funnels match editor exactly (pixel parity)
6. Mobile experience is smooth and touch-friendly

---

## Technical Notes

- CanvasRenderer is the single source of truth for element rendering
- FlowCanvasRenderer uses CanvasRenderer in read-only mode for automatic parity
- Inspector sections in RightPanel use collapsible sections with consistent styling
- Premium elements handled by PremiumElementInspector for specialized controls
- Template conversion preserves all structured data (fields arrays, items arrays, etc.)
