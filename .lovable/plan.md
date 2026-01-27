
# Page Context Menu: Move Up/Down & Duplicate Fixes

## Executive Summary

This plan fixes **2 critical bugs** in the funnel builder's page context menu:

1. **Move Up/Move Down are no-ops** - The menu items exist but do nothing
2. **Duplicate creates a blank page** - Instead of cloning content with regenerated IDs

These issues affect **both builder versions** (`builder_v2` and `flow-canvas`).

---

## Issue 1: Move Up/Move Down Does Nothing

### Root Cause Analysis

**builder_v2/EditorShell.tsx (lines 247-261):**
```typescript
const handleMovePageUp = (pageId: string) => {
  const pageIndex = pages.findIndex(p => p.id === pageId);
  if (pageIndex > 0) {
    // Empty - just a comment saying "rely on DnD"
  }
};
```

The handlers find the page index but never call `reorderPages()` which already exists and works correctly (used by DnD).

**flow-canvas/LeftPanel.tsx (lines 245-279):**
The context menu has Rename, Duplicate, Delete - but no Move Up/Move Down options at all.

### Solution

#### builder_v2/EditorShell.tsx

Implement the handlers using the existing `reorderPages` action:

```typescript
const handleMovePageUp = (pageId: string) => {
  const pageIndex = pages.findIndex(p => p.id === pageId);
  if (pageIndex > 0) {
    // Swap with previous page using existing reorderPages action
    const newOrder = [...pages.map(p => p.id)];
    [newOrder[pageIndex - 1], newOrder[pageIndex]] = [newOrder[pageIndex], newOrder[pageIndex - 1]];
    reorderPages(newOrder);
  }
};

const handleMovePageDown = (pageId: string) => {
  const pageIndex = pages.findIndex(p => p.id === pageId);
  if (pageIndex >= 0 && pageIndex < pages.length - 1) {
    // Swap with next page
    const newOrder = [...pages.map(p => p.id)];
    [newOrder[pageIndex], newOrder[pageIndex + 1]] = [newOrder[pageIndex + 1], newOrder[pageIndex]];
    reorderPages(newOrder);
  }
};
```

#### flow-canvas/LeftPanel.tsx

Add Move Up/Move Down to the context menu and wire to `onReorderSteps`:

```tsx
// Add props to SortablePageItemProps:
onMoveUp?: (stepId: string) => void;
onMoveDown?: (stepId: string) => void;
canMoveUp?: boolean;
canMoveDown?: boolean;

// Add menu items in DropdownMenuContent:
<DropdownMenuItem 
  onClick={() => onMoveUp?.(step.id)}
  disabled={!canMoveUp}
>
  Move Up
</DropdownMenuItem>
<DropdownMenuItem 
  onClick={() => onMoveDown?.(step.id)}
  disabled={!canMoveDown}
>
  Move Down
</DropdownMenuItem>
```

#### flow-canvas/EditorShell.tsx

Add handlers that use the existing `handleReorderSteps`:

```typescript
const handleMoveStepUp = useCallback((stepId: string) => {
  const index = page.steps.findIndex(s => s.id === stepId);
  if (index > 0) {
    handleReorderSteps(index, index - 1);
  }
}, [page.steps, handleReorderSteps]);

const handleMoveStepDown = useCallback((stepId: string) => {
  const index = page.steps.findIndex(s => s.id === stepId);
  if (index >= 0 && index < page.steps.length - 1) {
    handleReorderSteps(index, index + 1);
  }
}, [page.steps, handleReorderSteps]);
```

---

## Issue 2: Duplicate Creates Blank Page Instead of Clone

### Root Cause Analysis

**builder_v2/EditorShell.tsx (lines 238-245):**
```typescript
const handleDuplicatePage = (pageId: string) => {
  const pageToDuplicate = pages.find(p => p.id === pageId);
  if (pageToDuplicate) {
    addPage(pageToDuplicate.type);  // WRONG: Creates fresh default page
  }
};
```

This calls `addPage()` which creates a brand new page with default content, ignoring the original page's `canvasRoot`, props, and styling.

**flow-canvas already has correct implementation (lines 463-487):**
```typescript
const handleDuplicateStep = useCallback((stepId: string) => {
  const stepToDuplicate = page.steps.find(s => s.id === stepId);
  if (!stepToDuplicate) return;

  const duplicatedStep = deepClone(stepToDuplicate);
  duplicatedStep.id = generateId();
  duplicatedStep.name = `${stepToDuplicate.name} (Copy)`;
  
  // Recursively regenerate all nested IDs
  const regenerateIds = (obj: any) => { ... };
  regenerateIds(duplicatedStep.frames);
  
  // Insert after original
  updatedPage.steps.splice(stepIndex + 1, 0, duplicatedStep);
});
```

### Solution for builder_v2

**Option A: Add DUPLICATE_PAGE action to editorStore** (recommended for undo/redo support)

1. Add action type to `BaseEditorAction`:
```typescript
| { type: 'DUPLICATE_PAGE'; pageId: string }
```

2. Add to `historyTrackedActions`:
```typescript
const historyTrackedActions = new Set([
  // ...existing
  'DUPLICATE_PAGE',
]);
```

3. Implement reducer case:
```typescript
case 'DUPLICATE_PAGE': {
  const pageToDuplicate = state.pages.find(p => p.id === action.pageId);
  if (!pageToDuplicate) return state;

  // Deep clone with ID regeneration
  const clonedPage = JSON.parse(JSON.stringify(pageToDuplicate)) as Page;
  
  // Regenerate all IDs in the tree
  const regenerateIds = (node: CanvasNode): CanvasNode => ({
    ...node,
    id: generateNodeId(node.type.split('_')[0]),
    children: node.children.map(regenerateIds),
  });
  
  const newPage: Page = {
    ...clonedPage,
    id: generateNodeId('page'),
    name: `${pageToDuplicate.name} (Copy)`,
    canvasRoot: regenerateIds(clonedPage.canvasRoot),
  };

  // Insert after original
  const pageIndex = state.pages.findIndex(p => p.id === action.pageId);
  const nextPages = [...state.pages];
  nextPages.splice(pageIndex + 1, 0, newPage);

  return {
    ...state,
    pages: nextPages,
    activePageId: newPage.id,
    selectedNodeId: null,
  };
}
```

4. Add context action:
```typescript
// In EditorStoreContextValue interface:
duplicatePage: (pageId: string) => void;

// In EditorProvider:
const duplicatePage = useCallback(
  (pageId: string) => wrappedDispatch({ type: 'DUPLICATE_PAGE', pageId }),
  [wrappedDispatch],
);
```

5. Update EditorShell.tsx handler:
```typescript
const handleDuplicatePage = (pageId: string) => {
  duplicatePage(pageId);
};
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/builder_v2/EditorShell.tsx` | Implement move handlers, update duplicate to use new action | High |
| `src/builder_v2/state/editorStore.tsx` | Add DUPLICATE_PAGE action + reducer + context method | High |
| `src/flow-canvas/builder/components/LeftPanel.tsx` | Add Move Up/Down menu items | Medium |
| `src/flow-canvas/builder/components/EditorShell.tsx` | Add move handlers, pass to LeftPanel | Medium |

---

## Technical Implementation Details

### builder_v2/state/editorStore.tsx Changes

**Lines to modify:**

1. **Line ~580** - Add action type:
```typescript
| { type: 'DUPLICATE_PAGE'; pageId: string }
```

2. **Line ~669** - Add to history tracking:
```typescript
'DUPLICATE_PAGE',
```

3. **After line ~837** (after REORDER_PAGES case) - Add reducer:
```typescript
case 'DUPLICATE_PAGE': {
  // Implementation as described above
}
```

4. **Line ~631** - Add to context interface:
```typescript
duplicatePage: (pageId: string) => void;
```

5. **After line ~1427** - Add callback:
```typescript
const duplicatePage = useCallback(
  (pageId: string) => wrappedDispatch({ type: 'DUPLICATE_PAGE', pageId }),
  [wrappedDispatch],
);
```

6. **Line ~1504** - Add to context value:
```typescript
duplicatePage,
```

### builder_v2/EditorShell.tsx Changes

**Lines 181-184** - Destructure new method:
```typescript
const {
  // ...existing
  duplicatePage,
} = useEditorStore();
```

**Lines 238-261** - Replace handlers:
```typescript
const handleDuplicatePage = (pageId: string) => {
  duplicatePage(pageId);
};

const handleMovePageUp = (pageId: string) => {
  const pageIndex = pages.findIndex(p => p.id === pageId);
  if (pageIndex > 0) {
    const newOrder = pages.map(p => p.id);
    [newOrder[pageIndex - 1], newOrder[pageIndex]] = [newOrder[pageIndex], newOrder[pageIndex - 1]];
    reorderPages(newOrder);
  }
};

const handleMovePageDown = (pageId: string) => {
  const pageIndex = pages.findIndex(p => p.id === pageId);
  if (pageIndex >= 0 && pageIndex < pages.length - 1) {
    const newOrder = pages.map(p => p.id);
    [newOrder[pageIndex], newOrder[pageIndex + 1]] = [newOrder[pageIndex + 1], newOrder[pageIndex]];
    reorderPages(newOrder);
  }
};
```

### flow-canvas/LeftPanel.tsx Changes

**Lines 121-130** - Add props to SortablePageItemProps:
```typescript
onMoveUp?: (stepId: string) => void;
onMoveDown?: (stepId: string) => void;
canMoveUp?: boolean;
canMoveDown?: boolean;
```

**Lines 265-277** - Add menu items before Delete:
```tsx
<DropdownMenuItem 
  onClick={() => onMoveUp?.(step.id)}
  disabled={!canMoveUp}
  className="text-builder-text hover:bg-builder-surface-hover"
>
  <ChevronUp className="w-3.5 h-3.5 mr-2" />
  Move Up
</DropdownMenuItem>
<DropdownMenuItem 
  onClick={() => onMoveDown?.(step.id)}
  disabled={!canMoveDown}
  className="text-builder-text hover:bg-builder-surface-hover"
>
  <ChevronDown className="w-3.5 h-3.5 mr-2" />
  Move Down
</DropdownMenuItem>
<DropdownMenuSeparator className="bg-builder-border-subtle" />
```

---

## Testing Checklist

After implementation:

### Move Up/Move Down
- [ ] builder_v2: Click Move Up on page 2 → page moves to position 1
- [ ] builder_v2: Click Move Down on page 1 → page moves to position 2
- [ ] builder_v2: Move Up disabled on first page
- [ ] builder_v2: Move Down disabled on last page
- [ ] builder_v2: Undo after move restores original order
- [ ] flow-canvas: Same tests as above

### Duplicate
- [ ] builder_v2: Duplicate a page with custom content → new page has same content
- [ ] builder_v2: Duplicated page has "(Copy)" suffix in name
- [ ] builder_v2: Duplicated page has unique ID (not same as original)
- [ ] builder_v2: All nested nodes in canvasRoot have regenerated IDs
- [ ] builder_v2: Editing duplicated page doesn't affect original
- [ ] builder_v2: Undo after duplicate removes the copy
- [ ] flow-canvas: Same behavior (already works, verify no regression)
