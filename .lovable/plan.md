
# Phase 15: Inspector UX Overhaul + Template Wiring Fix

## Problem Summary

Based on your feedback, there are **two major issues**:

### Issue 1: Inspector Feels Different from Old Builder
The v3 inspector doesn't feel as polished as the old builder when editing blocks. Key problems:
- No inline editing on canvas (double-click to edit text directly)
- Tab doesn't auto-switch to "Block" when you select a block
- Content editing is buried - should be front and center when a block is selected
- Missing the clean Framer-like field groupings from the old inspector

### Issue 2: Section Templates Don't Actually Work
When you select a template from the SectionPicker (like Hero, CTA, etc.), nothing happens because:
- The v3 `handleSectionPickerSelect` only maps simple block types (`heading`, `text`, etc.)
- It tries `getTemplateBlocks()` for other IDs, but section templates use `allSectionTemplates` which have a different format (`createNode()` returns `CanvasNode`, not v3 `Block[]`)
- There's no converter to transform `CanvasNode` (from builder_v2) → v3 `Block[]`

---

## Solution

### Part A: Make Inspector Feel Right

**1. Auto-Switch to Block Tab on Selection**
When a block is selected, automatically switch from "Add" tab to "Block" (style) tab so editing controls are immediately visible.

**2. Inline Text Editing on Canvas**
Enable double-click on text/heading blocks to edit content directly on canvas (like Perspective/Framer).

**3. Improve Field Hierarchy**
Reorganize the BlockStyleEditor to put content editing prominently at the top with better visual groupings.

### Part B: Wire Section Templates Properly

**1. Create Template Converter**
Build `convertSectionTemplateToBlocks()` that transforms `CanvasNode` → `Block[]`:
- Maps `heading` → v3 `heading` block
- Maps `paragraph`/`text` → v3 `text` block
- Maps `cta_button`/`button` → v3 `button` block
- Maps `image` → v3 `image` block
- Maps `spacer` → v3 `spacer` block
- Maps `divider` → v3 `divider` block
- Recursively flattens nested children

**2. Update SectionPicker Handler**
Modify `handleSectionPickerSelect` in Editor.tsx to:
- First check if it's a known BlockType → add single block
- Then check `allSectionTemplates` → convert and add blocks
- Finally fall back to `BLOCK_TEMPLATES` → use `getTemplateBlocks()`

---

## Technical Implementation

### File: `src/funnel-builder-v3/utils/templateConverter.ts` (NEW)

```typescript
/**
 * Convert builder_v2 section templates to v3 Block format
 */
import { Block, BlockType, createId } from '../types/funnel';
import type { CanvasNode } from '@/builder_v2/types';
import { allSectionTemplates } from '@/builder_v2/templates/sectionTemplates';

// Map CanvasNode types to v3 BlockType
const NODE_TO_BLOCK_TYPE: Record<string, BlockType | null> = {
  'heading': 'heading',
  'paragraph': 'text',
  'text': 'text',
  'cta_button': 'button',
  'button': 'button',
  'image': 'image',
  'video': 'video',
  'spacer': 'spacer',
  'divider': 'divider',
  'email_input': 'input',
  'phone_input': 'input',
  'text_input': 'input',
  // Skip complex types for now
  'section': null,
  'logo_bar': null,
  'rating_display': null,
};

function nodeToBlock(node: CanvasNode): Block | null {
  const blockType = NODE_TO_BLOCK_TYPE[node.type];
  if (!blockType) return null;

  return {
    id: createId(),
    type: blockType,
    content: node.props?.text || node.props?.label || '',
    props: mapNodeProps(node, blockType),
  };
}

function flattenNodes(node: CanvasNode): Block[] {
  const blocks: Block[] = [];
  
  // Convert this node
  const block = nodeToBlock(node);
  if (block) blocks.push(block);
  
  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      blocks.push(...flattenNodes(child));
    }
  }
  
  return blocks;
}

export function convertSectionTemplateToBlocks(templateId: string): Block[] {
  const template = allSectionTemplates.find(t => t.id === templateId);
  if (!template) return [];
  
  const rootNode = template.createNode();
  return flattenNodes(rootNode);
}
```

### File: `src/funnel-builder-v3/components/Editor.tsx`

Update `handleSectionPickerSelect`:

```typescript
import { convertSectionTemplateToBlocks } from '../utils/templateConverter';

const handleSectionPickerSelect = useCallback((blockId: string) => {
  if (!selectedScreenId) return;
  
  // 1. Direct block type?
  const blockTypeMap: Record<string, BlockType> = { ... };
  const blockType = blockTypeMap[blockId];
  if (blockType) {
    addBlock(selectedScreenId, blockType, selectedBlockId || undefined);
    setSectionPickerOpen(false);
    return;
  }
  
  // 2. Section template (hero-simple, cta-gray-card, etc.)?
  const sectionBlocks = convertSectionTemplateToBlocks(blockId);
  if (sectionBlocks.length > 0) {
    addBlocks(selectedScreenId, sectionBlocks, selectedBlockId || undefined);
    setSectionPickerOpen(false);
    return;
  }
  
  // 3. Block template from blockTemplates.ts?
  const templateBlocks = getTemplateBlocks(blockId);
  if (templateBlocks.length > 0) {
    addBlocks(selectedScreenId, templateBlocks, selectedBlockId || undefined);
    setSectionPickerOpen(false);
    return;
  }
  
  console.warn('Unknown template/block:', blockId);
  setSectionPickerOpen(false);
}, [...]);
```

### File: `src/funnel-builder-v3/components/RightPanel.tsx`

Add auto-tab switching hook:

```typescript
// At top of RightPanel component
useEffect(() => {
  if (block) {
    setActiveTab('style'); // Switch to Block tab when block selected
  }
}, [block]);
```

### File: `src/funnel-builder-v3/components/Canvas.tsx`

Add inline editing for text blocks:

```typescript
const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

const handleDoubleClick = (blockId: string, blockType: string) => {
  if (['text', 'heading', 'button'].includes(blockType)) {
    setEditingBlockId(blockId);
  }
};
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `utils/templateConverter.ts` | Create | Convert builder_v2 templates to v3 blocks |
| `Editor.tsx` | Modify | Wire template conversion in selection handler |
| `RightPanel.tsx` | Modify | Auto-switch tab on block selection |
| `Canvas.tsx` | Modify | Add inline editing on double-click |
| `blocks/TextBlock.tsx` | Modify | Support inline edit mode |
| `blocks/HeadingBlock.tsx` | Modify | Support inline edit mode |

---

## Success Criteria

1. Selecting a block auto-switches inspector to "Block" tab
2. Double-clicking text/heading enables inline editing
3. Section templates (Hero, CTA, etc.) actually insert blocks
4. Inspector feels responsive and immediate like the old builder
