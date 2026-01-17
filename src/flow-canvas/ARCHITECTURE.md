# Flow Canvas Builder - Architecture Documentation

## Overview

The Flow Canvas Builder is a modular, component-based system for creating funnels and websites. It follows a clean separation of concerns with distinct layers for UI, logic, and state management.

## Phase Summary

### Phase 1: Core Type Consolidation
- Unified type definitions in `types/infostack.ts`
- Consistent interfaces across all components
- Clear type hierarchy: Page → Step → Frame → Stack → Block → Element

### Phase 2: Button System Consolidation
- `UnifiedButton` is the single source of truth for all buttons
- `FlowButton` re-exports `UnifiedButton` for backward compatibility
- Standardized shadow presets including glow and neon effects
- Consistent variant system across all button usage

### Phase 3: Renderer Improvements
- Modular renderer components in `builder/components/renderers/`
- `CanvasRenderer` orchestrates sub-renderers via render props
- Error boundaries for graceful failure handling
- Improved drag overlay components

### Phase 4: Inspector Enhancements
- Extended validation settings for form inputs
- Phone-specific controls (country code, format)
- Min/max length validation
- Better UI organization with collapsible sections

### Phase 5: Text Editor Improvements
- Enhanced `InlineEditContext` with selection change notifications
- `useInlineSelectionSync` hook for Right Panel reactivity
- `SelectionManager` utilities for robust range handling
- Improved `textHighlight` with escape support and index tracking

### Phase 6: Cleanup & Documentation
- Consolidated exports in `builder/index.ts`
- Comprehensive module documentation
- Architecture documentation (this file)

### Phase 7: Integration Verification & Fixes
- Verified all module integrations work together
- Fixed export compatibility for FlowButton → UnifiedButton
- Added missing type exports in builder components index
- Confirmed no TypeScript errors or runtime issues

## Directory Structure

```
src/flow-canvas/
├── builder/
│   ├── components/
│   │   ├── renderers/          # Phase 3: Modular renderers
│   │   │   ├── CanvasUtilities.ts
│   │   │   ├── ElementDragOverlay.tsx
│   │   │   ├── BlockDragOverlay.tsx
│   │   │   ├── StackRenderer.tsx
│   │   │   ├── FrameRenderer.tsx
│   │   │   └── index.ts
│   │   ├── inspectors/         # Phase 4: Inspector components
│   │   │   ├── ApplicationStepInspector.tsx
│   │   │   ├── InteractiveBlockInspector.tsx
│   │   │   └── ...
│   │   ├── CanvasRenderer.tsx  # Main canvas orchestrator
│   │   ├── EditorShell.tsx     # Main editor container
│   │   ├── InlineTextEditor.tsx # Phase 5: Enhanced text editor
│   │   ├── RightPanel.tsx
│   │   ├── LeftPanel.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── InlineEditContext.tsx  # Phase 5: Selection bridge
│   ├── hooks/
│   │   ├── useHistory.ts
│   │   ├── useSnapGuides.tsx
│   │   └── useScrollAnimation.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── selectionManager.ts    # Phase 5: Selection utilities
│   │   ├── selectionStyles.ts
│   │   ├── selectionFormat.ts
│   │   ├── textHighlight.ts       # Phase 5: Enhanced highlights
│   │   └── ...
│   └── index.ts                   # Phase 6: Consolidated exports
├── shared/
│   └── types/
│       └── applicationEngine.ts   # Phase 4: Extended validation types
├── types/
│   └── infostack.ts               # Phase 1: Core type definitions
└── ARCHITECTURE.md                # This file
```

## Key Design Principles

### 1. Single Source of Truth
Each concept has ONE authoritative location:
- Button styling → `UnifiedButton`
- Type definitions → `types/infostack.ts`
- Selection state → `InlineEditContext`

### 2. Layered Architecture
```
┌─────────────────────────────────────┐
│           UI Components             │ ← Visual rendering
├─────────────────────────────────────┤
│        Context Providers            │ ← State management
├─────────────────────────────────────┤
│             Hooks                   │ ← Behavior logic
├─────────────────────────────────────┤
│           Utilities                 │ ← Pure functions
├─────────────────────────────────────┤
│            Types                    │ ← Type definitions
└─────────────────────────────────────┘
```

### 3. Explicit Over Magic
- All behavior is explicit and configurable
- No hidden defaults that can't be overridden
- Clear cause → effect relationships

### 4. Backward Compatibility
- Old APIs are maintained via re-exports
- Deprecation warnings guide migration
- No breaking changes without alternatives

## Integration Points

### InlineEditContext
Bridges the Right Panel with the InlineTextEditor:
```tsx
const { applyInlineStyle, hasActiveEditor, getInlineSelectionStyles } = useInlineEdit();

// Apply styles to selected text
const handled = applyInlineStyle(elementId, { textColor: '#FF0000' });

// Check if selection is active
if (hasActiveEditor(elementId)) {
  const styles = getInlineSelectionStyles(elementId);
}
```

### UnifiedButton Usage
```tsx
import { UnifiedButton } from '@/components/builder';

<UnifiedButton
  variant="primary"
  size="lg"
  radius="lg"
  fullWidth
  onClick={handleClick}
>
  Continue
</UnifiedButton>
```

### Selection Manager
```tsx
import { captureSelection, restoreSelection, getBestSelectionRange } from '@/flow-canvas/builder';

// Capture current selection
const snapshot = captureSelection(editorElement);

// Restore later
restoreSelection(snapshot, editorElement);

// Get best available range for styling
const range = getBestSelectionRange(element, lastSelection, lastCaret);
```

## Performance Considerations

1. **Debounced Updates**: Text changes and selection updates are debounced to prevent jitter
2. **RequestAnimationFrame**: Toolbar positioning and selection updates use RAF
3. **Lazy Registration**: Editor bridges are registered only when editing starts
4. **Selective Re-renders**: Context changes trigger targeted component updates

## Testing Strategy

1. **Unit Tests**: Pure utilities (selectionManager, textHighlight)
2. **Integration Tests**: Context + Component interactions
3. **E2E Tests**: Full editor workflows (selection, formatting, saving)

## Migration Guide

### From FlowButton to UnifiedButton
```tsx
// Before
import { FlowButton } from './FlowButton';
<FlowButton preset="primary" fullWidth onClick={...}>

// After (FlowButton still works, but prefer UnifiedButton)
import { UnifiedButton } from '@/components/builder';
<UnifiedButton variant="primary" fullWidth onClick={...}>
```

### Selection Handling
```tsx
// Before: Manual selection management
const sel = window.getSelection();
// ... complex range handling

// After: Use SelectionManager utilities
import { captureSelection, isRangeValid } from '@/flow-canvas/builder';
const snapshot = captureSelection(element);
if (snapshot && isRangeValid(snapshot.range)) {
  // Apply styles
}
```
