

# Complete Funnel Builder Reset - Perspective Parity Architecture

## The Reality Check

The current funnel builder is **beyond repair through incremental fixes**. Here's why:

| File | Lines | Problem |
|------|-------|---------|
| `EditorShell.tsx` | 2,093 | Monolithic, 50+ state variables |
| `RightPanel.tsx` | 6,176 | Giant switch statement, unmaintainable |
| `CanvasRenderer.tsx` | 5,860 | Renders 40+ element types, tangled |
| `infostack.ts` | 776 | 90+ type definitions, deprecated markers everywhere |

**Total: 14,905 lines** in just 4 files. Plus 3 competing builder systems, 4 flow systems, and 28 files with overlapping "flow" logic.

---

## The Nuclear Option: Fresh Start

Instead of patching, we build a **clean, Perspective-style architecture** from scratch in a new folder, then migrate the FunnelEditor to use it.

### Target Architecture

```text
src/funnel-builder-v3/          ← NEW: Clean slate
├── types/
│   └── funnel.ts               ← 1 file, ~150 lines
├── components/
│   ├── Editor.tsx              ← Main shell, ~300 lines
│   ├── Canvas.tsx              ← Preview area, ~200 lines
│   ├── LeftPanel.tsx           ← Screen list, ~100 lines
│   ├── RightPanel.tsx          ← Properties, ~400 lines
│   ├── Toolbar.tsx             ← Top bar, ~150 lines
│   └── blocks/                 ← Individual block renderers
│       ├── TextBlock.tsx       ← ~50 lines each
│       ├── ImageBlock.tsx
│       ├── ButtonBlock.tsx
│       ├── FormBlock.tsx
│       └── ... (10-15 total)
├── hooks/
│   ├── useFunnelState.ts       ← Single state manager
│   └── useBlockSelection.ts
└── index.ts
```

**Target total: ~2,000 lines** (vs current 15,000+)

---

## Perspective's Mental Model (What We Copy)

Perspective Funnels has a **dead-simple** structure:

```text
Funnel
└── Screens[]
    └── Blocks[]
        └── Properties{}
```

That's it. No "Steps", no "Frames", no "Stacks", no "Elements", no "Flow Containers".

### Screen Types (Perspective)
1. **Content Screen** - Text, images, buttons (display only)
2. **Form Screen** - Input fields (collects data)
3. **Choice Screen** - Multiple/single choice (collects selection)
4. **Calendar Screen** - Booking widget
5. **Thank You Screen** - Confirmation

### Block Types (Perspective)
- Text (heading, paragraph)
- Image
- Button
- Input (name, email, phone, custom)
- Choice (single, multiple)
- Divider
- Video
- Embed (calendar, HTML)

---

## Phase 1: Create New Type System (Day 1)

**File: `src/funnel-builder-v3/types/funnel.ts`**

```typescript
// THE ENTIRE TYPE SYSTEM - ~150 lines

export interface Funnel {
  id: string;
  name: string;
  slug: string;
  screens: Screen[];
  settings: FunnelSettings;
}

export interface Screen {
  id: string;
  name: string;
  type: ScreenType;
  blocks: Block[];
  background?: ScreenBackground;
}

export type ScreenType = 
  | 'content'   // Display only
  | 'form'      // Collects identity
  | 'choice'    // Collects selection
  | 'calendar'  // Booking
  | 'thankyou'; // End

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  props: BlockProps;
}

export type BlockType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'input'      // Single field (name/email/phone/custom)
  | 'choice'     // Single or multiple selection
  | 'embed';     // Calendar, HTML, etc.

export interface BlockProps {
  // Text/Heading
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
  color?: string;
  
  // Image/Video
  src?: string;
  alt?: string;
  
  // Button
  action?: ButtonAction;
  variant?: 'primary' | 'secondary' | 'outline';
  
  // Input
  inputType?: 'text' | 'email' | 'phone' | 'name';
  placeholder?: string;
  required?: boolean;
  fieldKey?: string;  // Key for form data
  
  // Choice
  options?: ChoiceOption[];
  multiSelect?: boolean;
  
  // Embed
  embedType?: 'calendar' | 'html' | 'video';
  embedCode?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
  imageUrl?: string;
}

export type ButtonAction = 
  | { type: 'next-screen' }
  | { type: 'go-to-screen'; screenId: string }
  | { type: 'submit' }
  | { type: 'url'; url: string };

export interface FunnelSettings {
  primaryColor?: string;
  fontFamily?: string;
  showProgress?: boolean;
}

export interface ScreenBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: { from: string; to: string; angle: number };
  image?: string;
}
```

---

## Phase 2: Create Editor Shell (Day 1-2)

**File: `src/funnel-builder-v3/components/Editor.tsx`**

```typescript
// CLEAN EDITOR - ~300 lines

import { useState, useCallback } from 'react';
import { Funnel, Screen, Block } from '../types/funnel';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { Toolbar } from './Toolbar';
import { useFunnelState } from '../hooks/useFunnelState';

interface EditorProps {
  initialFunnel: Funnel;
  onSave: (funnel: Funnel) => void;
  onPublish?: () => void;
}

export function Editor({ initialFunnel, onSave, onPublish }: EditorProps) {
  const { 
    funnel, 
    updateScreen, 
    addScreen, 
    deleteScreen,
    updateBlock,
    addBlock,
    deleteBlock,
    reorderScreens,
    reorderBlocks 
  } = useFunnelState(initialFunnel, onSave);
  
  const [selectedScreenId, setSelectedScreenId] = useState(funnel.screens[0]?.id);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const selectedScreen = funnel.screens.find(s => s.id === selectedScreenId);
  const selectedBlock = selectedScreen?.blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar 
        funnelName={funnel.name}
        previewMode={previewMode}
        onTogglePreview={() => setPreviewMode(!previewMode)}
        onPublish={onPublish}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          screens={funnel.screens}
          selectedScreenId={selectedScreenId}
          onSelectScreen={setSelectedScreenId}
          onAddScreen={addScreen}
          onDeleteScreen={deleteScreen}
          onReorder={reorderScreens}
        />
        
        <Canvas
          screen={selectedScreen}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          previewMode={previewMode}
        />
        
        <RightPanel
          screen={selectedScreen}
          block={selectedBlock}
          onUpdateScreen={updateScreen}
          onUpdateBlock={updateBlock}
          onAddBlock={addBlock}
          onDeleteBlock={deleteBlock}
        />
      </div>
    </div>
  );
}
```

---

## Phase 3: Simple Block Renderers (Day 2)

**File: `src/funnel-builder-v3/components/blocks/TextBlock.tsx`**

```typescript
// EACH BLOCK IS SIMPLE - ~50 lines

import { Block } from '../../types/funnel';

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
}

export function TextBlock({ block, isSelected, onSelect, previewMode }: TextBlockProps) {
  const { size = 'md', align = 'left', color } = block.props;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  return (
    <div 
      onClick={previewMode ? undefined : onSelect}
      className={`
        p-2 rounded transition-all
        ${!previewMode && isSelected ? 'ring-2 ring-blue-500' : ''}
        ${!previewMode ? 'cursor-pointer hover:bg-gray-50' : ''}
        text-${align}
      `}
    >
      <p 
        className={sizeClasses[size]}
        style={{ color }}
      >
        {block.content || 'Click to edit text...'}
      </p>
    </div>
  );
}
```

---

## Phase 4: Connect to FunnelEditor (Day 2-3)

**File: `src/pages/FunnelEditor.tsx`** - Replace entirely

```typescript
// SIMPLE PAGE COMPONENT - ~100 lines

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Editor } from '@/funnel-builder-v3/components/Editor';
import { Funnel } from '@/funnel-builder-v3/types/funnel';

export default function FunnelEditor() {
  const { funnelId } = useParams();
  const navigate = useNavigate();
  
  const { data: funnel, isLoading } = useQuery({
    queryKey: ['funnel', funnelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', funnelId)
        .single();
      return data as Funnel;
    },
  });
  
  const saveMutation = useMutation({
    mutationFn: async (funnel: Funnel) => {
      await supabase
        .from('funnels')
        .update({ content: funnel })
        .eq('id', funnelId);
    },
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (!funnel) return <div>Not found</div>;
  
  return (
    <Editor
      initialFunnel={funnel}
      onSave={saveMutation.mutate}
      onPublish={() => {/* publish logic */}}
    />
  );
}
```

---

## Phase 5: Migration & Cleanup (Day 3-4)

1. **Create data converter** - Transform old `Page` format to new `Funnel` format
2. **Keep old code working** - Don't delete yet, just stop using
3. **Add deprecation notices** - Point to new implementation
4. **Clean up routes** - Remove `/builder-v2` and other legacy routes

---

## Files Created (New)

| File | Lines | Purpose |
|------|-------|---------|
| `src/funnel-builder-v3/types/funnel.ts` | ~150 | Clean type system |
| `src/funnel-builder-v3/components/Editor.tsx` | ~300 | Main shell |
| `src/funnel-builder-v3/components/Canvas.tsx` | ~200 | Preview area |
| `src/funnel-builder-v3/components/LeftPanel.tsx` | ~100 | Screen list |
| `src/funnel-builder-v3/components/RightPanel.tsx` | ~400 | Properties |
| `src/funnel-builder-v3/components/Toolbar.tsx` | ~150 | Top bar |
| `src/funnel-builder-v3/components/blocks/*.tsx` | ~500 | Block renderers |
| `src/funnel-builder-v3/hooks/useFunnelState.ts` | ~150 | State manager |
| **Total** | **~1,950** | Clean implementation |

---

## Files Deprecated (Old)

| Location | Lines | Action |
|----------|-------|--------|
| `src/flow-canvas/builder/` | ~15,000+ | Mark deprecated |
| `src/builder_v2/` | ~5,000+ | Already deprecated |
| `src/components/funnel-builder/` | ~3,000+ | Already deprecated |

---

## Success Criteria

1. Adding a Quiz creates visible, working content
2. Every block type works on first click
3. Inspector always shows correct properties
4. No "Template not found" or "Step not found" errors
5. Codebase is ~2,000 lines instead of 15,000+
6. Any developer can understand the architecture in 10 minutes

---

## Timeline

| Phase | Time | Deliverable |
|-------|------|-------------|
| Phase 1: Types | 2 hours | Clean type system |
| Phase 2: Editor | 4 hours | Working shell |
| Phase 3: Blocks | 4 hours | All block renderers |
| Phase 4: Integration | 3 hours | Connected to DB |
| Phase 5: Migration | 3 hours | Data converter |
| **Total** | **16 hours** | Complete rebuild |

---

## Risk Mitigation

1. **Keep old code** - Don't delete until new version is proven
2. **Feature flag** - Add `?builder=v3` URL param to test
3. **Data conversion** - Bidirectional, so we can rollback
4. **Incremental deploy** - Test with team before users see it

