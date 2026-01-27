
# Complete Visual Refactor - Removing BlockPickerPanel

## The Root Cause

Looking at the codebase, I found **why the old panel is still appearing**:

1. **`handleAddFrame` creates empty sections** instead of opening the SectionPicker
2. **`onOpenBlockPalette` triggers `setBlockPickerOpen(true)`** which shows BlockPickerPanel
3. **Canvas "Add content" buttons call `onOpenBlockPalette`** - the old behavior
4. **`blockPickerOpen` state conditionally renders BlockPickerPanel** instead of LeftPanel

The architecture still has the old system running alongside the new components that were created.

---

## What Needs to Change

### 1. TopToolbar "+" Button → Opens SectionPicker Modal

**Current behavior:**
```
+ button → onAddFrame → handleAddFrame → adds empty section
```

**New behavior:**
```
+ button → onAddFrame → setInlineSectionPickerOpen(true) → opens SectionPicker modal
```

### 2. Remove BlockPickerPanel from Left Panel

**Current (EditorShell lines 1768-1812):**
```tsx
{blockPickerOpen ? (
  <BlockPickerPanel ... />  // 2259 lines of legacy code
) : (
  <LeftPanel ... />
)}
```

**New:**
```tsx
<LeftPanel ... />  // Always show navigation panel
// BlockPickerPanel removed entirely
```

### 3. Canvas "Add content" → Opens BlockAdder Popover

**Current:**
```
"Add content" button → onOpenBlockPalette → opens BlockPickerPanel in left panel
```

**New:**
```
"Add content" button → opens BlockAdder popover inline
```

---

## Implementation Plan

### Step 1: Change TopToolbar Behavior

**File: `EditorShell.tsx`**

Update `handleAddFrame` to open the section picker modal instead of adding an empty section:

```tsx
// BEFORE
const handleAddFrame = useCallback(() => {
  // Creates empty section directly
  step.frames.push({ id: generateId(), ... });
}, [...]);

// AFTER  
const handleAddFrame = useCallback(() => {
  // Opens section picker modal for template selection
  setInlineSectionPickerOpen(true);
}, []);
```

### Step 2: Remove BlockPickerPanel Conditional

**File: `EditorShell.tsx`**

Remove the conditional that switches between BlockPickerPanel and LeftPanel:

```tsx
// BEFORE (lines 1766-1833)
{!previewMode && !isMobile && leftPanelOpen && (
  <div className="w-60 ...">
    {blockPickerOpen ? (
      <BlockPickerPanel ... />
    ) : (
      <LeftPanel ... />
    )}
  </div>
)}

// AFTER
{!previewMode && !isMobile && leftPanelOpen && (
  <div className="w-60 ...">
    <LeftPanel ... />
  </div>
)}
```

### Step 3: Remove blockPickerOpen State

**File: `EditorShell.tsx`**

Remove all related state and handlers:
- `const [blockPickerOpen, setBlockPickerOpen] = useState(false);`
- `const [blockPickerTargetStackId, setBlockPickerTargetStackId] = useState<string | null>(null);`
- `const [blockPickerMode, setBlockPickerMode] = useState<'blocks' | 'sections'>('blocks');`

### Step 4: Update Canvas onOpenBlockPalette

**File: `EditorShell.tsx`**

Change what happens when canvas triggers block palette:

```tsx
// BEFORE
onOpenBlockPalette={() => {
  setBlockPickerOpen(true);
  setBlockPickerMode('blocks');
}}

// AFTER - Remove this entirely or change to BlockAdder
onOpenBlockPalette={undefined}  // Remove prop
```

### Step 5: Update CanvasRenderer to Use BlockAdder

**File: `CanvasRenderer.tsx`**

Replace internal "Add content" buttons with the new `BlockAdder` component:

```tsx
// Import BlockAdder
import { BlockAdder } from './BlockAdder';

// Replace "Add content" triggers with:
<BlockAdder 
  onAddBlock={(blockType) => onAddBlock?.(createBlockFromType(blockType))}
  variant="inline"
/>
```

### Step 6: Delete BlockPickerPanel Import

**File: `EditorShell.tsx`**

Remove the import:
```tsx
// DELETE
import { BlockPickerPanel } from './BlockPickerPanel';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `EditorShell.tsx` | Remove BlockPickerPanel logic, update handleAddFrame |
| `CanvasRenderer.tsx` | Replace "Add content" with BlockAdder |
| `StackRenderer.tsx` | Use BlockAdder component |

## Files to Delete (After Verification)

| File | Reason |
|------|--------|
| `BlockPickerPanel.tsx` | 2259 lines of redundant code |

---

## Result After Changes

### User Experience Flow

```text
1. User opens editor
   └─► Left panel shows Pages + Layers (navigation only)

2. User clicks "+" in toolbar
   └─► SectionPicker modal opens with premium templates

3. User clicks inside a section
   └─► BlockAdder popover appears with 10 block types

4. User clicks "Add Section" between sections
   └─► SectionPicker modal opens

5. Empty canvas
   └─► EmptyCanvasState shows with Quick Picks + "Browse All"
```

### Visual Structure (After)

```text
┌──────────────────────────────────────────────────────────────────┐
│ TopToolbar: [+] opens SectionPicker modal                        │
├────────────┬─────────────────────────────────┬───────────────────┤
│            │                                 │                   │
│  LEFT      │         CANVAS                  │      RIGHT        │
│  PANEL     │                                 │      PANEL        │
│            │  ┌───────────────────────────┐  │                   │
│  Pages     │  │ SECTION                   │  │  Inspector        │
│  ────────  │  │                           │  │                   │
│  • Home    │  │  Content...               │  │                   │
│  • Step 2  │  │                           │  │                   │
│            │  │  [+ Add content] ← opens  │  │                   │
│  ────────  │  │     BlockAdder popover    │  │                   │
│  Layers    │  └───────────────────────────┘  │                   │
│  ────────  │                                 │                   │
│  • Section │  ─────[ + Add Section ]─────    │                   │
│    • Text  │         opens modal             │                   │
│    • CTA   │                                 │                   │
│            │                                 │                   │
└────────────┴─────────────────────────────────┴───────────────────┘
```

---

## Success Criteria

After this refactor:

| Before | After |
|--------|-------|
| Left panel switches to BlockPickerPanel | Left panel always shows navigation |
| "+" adds empty section | "+" opens SectionPicker modal |
| Canvas "Add content" opens panel | Canvas "Add content" opens popover |
| 40+ blocks in overwhelming list | 10 blocks in clean popover |
| 2259-line BlockPickerPanel | Deleted |
| Confusion about sections vs blocks | Clear hierarchy |
