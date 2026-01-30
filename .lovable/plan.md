
# Use the Fresh Funnel Builder from apps/funnel-flow-studio

## What You Want
You want the main app to use the **complete, working funnel builder** from `apps/funnel-flow-studio` - not the placeholder v3 page, not the flow-canvas builder, and not any legacy builders. Just the fresh, working editor with all its 34+ block types, canvas, panels, and rich editing capabilities.

## Current Problem
Right now when you open `/team/:teamId/funnels/:funnelId/edit`, you see a placeholder page that says "Funnel Builder v3 - The full editor UI is being migrated." The actual working editor exists in `apps/funnel-flow-studio` but is not connected.

## Solution Overview
Copy all the builder components from `apps/funnel-flow-studio/src/` into `src/funnel-builder-v3/`, then wire them into the existing `FunnelEditorV3.tsx` page that already has Supabase persistence working.

---

## Implementation Steps

### Step 1: Copy Editor Components
Copy the full editor structure from `apps/funnel-flow-studio/src/components/editor/` to `src/funnel-builder-v3/editor/`:

| Source | Target |
|--------|--------|
| `components/editor/FunnelEditor.tsx` | `editor/FunnelEditor.tsx` |
| `components/editor/Canvas.tsx` | `editor/Canvas.tsx` |
| `components/editor/LeftPanel.tsx` | `editor/LeftPanel.tsx` |
| `components/editor/RightPanel.tsx` | `editor/RightPanel.tsx` |
| `components/editor/EditorHeader.tsx` | `editor/EditorHeader.tsx` |
| `components/editor/PreviewMode.tsx` | `editor/PreviewMode.tsx` |
| `components/editor/AddBlockModal.tsx` | `editor/AddBlockModal.tsx` |
| `components/editor/blocks/*` (34 files) | `editor/blocks/*` |
| `components/editor/inspector/*` | `editor/inspector/*` |
| All other editor files | `editor/` |

### Step 2: Copy Supporting Files
Copy context, hooks, lib, and types:

| Source | Target |
|--------|--------|
| `context/FunnelContext.tsx` | Replace `context/FunnelContext.tsx` |
| `types/funnel.ts` | Replace `types/funnel.ts` |
| `lib/block-definitions.ts` | Replace `lib/block-definitions.ts` |
| `lib/templates.ts` | `lib/templates.ts` |
| `lib/color-presets.ts` | `lib/color-presets.ts` |
| `lib/niche-presets.ts` | `lib/niche-presets.ts` |
| `lib/selection-utils.ts` | `lib/selection-utils.ts` |
| `hooks/useKeyboardShortcuts.ts` | `hooks/useKeyboardShortcuts.ts` |
| `hooks/useEditableStyleSync.ts` | `hooks/useEditableStyleSync.ts` |

### Step 3: Update Import Paths
All imports need to change from the builder app pattern to main app pattern:
- `@/context/FunnelContext` becomes `@/funnel-builder-v3/context/FunnelContext`
- `@/types/funnel` becomes `@/funnel-builder-v3/types/funnel`
- `@/lib/block-definitions` becomes `@/funnel-builder-v3/lib/block-definitions`
- `@/components/ui/*` stays the same (use main app UI components)
- `@/hooks/*` becomes `@/funnel-builder-v3/hooks/*` for builder-specific hooks

### Step 4: Modify FunnelContext for Supabase Persistence
Update the FunnelContext to accept props for database persistence instead of localStorage:

```typescript
interface FunnelProviderProps {
  children: ReactNode;
  initialFunnel?: Funnel;
  onFunnelChange?: (funnel: Funnel) => void;
}
```

This allows `FunnelEditorV3.tsx` to pass the funnel from Supabase and receive updates for saving.

### Step 5: Update FunnelEditorV3.tsx
Replace the placeholder editor with the real FunnelEditor:

```typescript
import { FunnelEditor } from '@/funnel-builder-v3/editor/FunnelEditor';
import { FunnelProvider } from '@/funnel-builder-v3/context/FunnelContext';

// In the render:
<FunnelProvider 
  initialFunnel={initialFunnel} 
  onFunnelChange={handleFunnelChange}
>
  <FunnelEditor />
</FunnelProvider>
```

### Step 6: Update EditorHeader for Navigation
Modify `EditorHeader.tsx` to use React Router navigation instead of href links:
- "Dashboard" button uses `navigate(`/team/${teamId}/funnels`)`
- Get teamId from URL params instead of calculating from window.location

---

## File Structure After Migration

```text
src/funnel-builder-v3/
├── context/
│   ├── FunnelContext.tsx          ← State management (modified for props)
│   └── FunnelRuntimeContext.tsx   ← Runtime navigation
├── editor/
│   ├── FunnelEditor.tsx           ← Main shell with DnD
│   ├── Canvas.tsx                 ← Device frame + blocks
│   ├── LeftPanel.tsx              ← Steps + Add blocks
│   ├── RightPanel.tsx             ← Inspector panel
│   ├── EditorHeader.tsx           ← Header with actions
│   ├── PreviewMode.tsx            ← Full preview overlay
│   ├── AddBlockModal.tsx          ← Block picker dialog
│   ├── ZoomControl.tsx            ← Zoom slider
│   ├── ThemeToggle.tsx            ← Dark/light toggle
│   ├── blocks/                    ← 34 block components
│   │   ├── BlockRenderer.tsx
│   │   ├── HeadingBlock.tsx
│   │   ├── TextBlock.tsx
│   │   ├── ButtonBlock.tsx
│   │   └── ... (31 more)
│   └── inspector/
│       ├── BlockInspector.tsx
│       └── InspectorUI.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useEditableStyleSync.ts
├── lib/
│   ├── block-definitions.ts       ← Full 34-block library
│   ├── templates.ts               ← Pre-built funnels
│   ├── color-presets.ts
│   ├── niche-presets.ts
│   └── selection-utils.ts
├── types/
│   └── funnel.ts                  ← Complete type definitions
└── index.ts                       ← Public exports
```

---

## What You'll Get

After this migration:

1. **Full editor UI** - Canvas with device frames, left panel with steps, right panel with inspector
2. **34+ block types** - Heading, Text, Button, Form, Quiz, Video, Testimonial, Countdown, etc.
3. **Drag & drop reordering** - Blocks can be dragged within steps
4. **Live preview mode** - Full-screen preview with navigation
5. **Viewport switching** - Mobile, Tablet, Desktop views
6. **Zoom controls** - Scale the canvas up/down
7. **Keyboard shortcuts** - Delete, duplicate, undo/redo
8. **Auto-save to Supabase** - Uses existing persistence from FunnelEditorV3
9. **Publish to Supabase** - Uses existing publish flow

---

## Technical Notes

### Dependencies Already Available
All required dependencies are already in the main app:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `framer-motion`
- `uuid` (or use `crypto.randomUUID()`)
- All Radix UI components

### UUID Usage
The builder uses `uuid` package but the main app might prefer `crypto.randomUUID()`. We can either:
1. Add `uuid` to dependencies
2. Create a helper that uses `crypto.randomUUID()`

### CSS Animations
The builder has custom animation classes. These will need to be added to the main app's `index.css` or Tailwind config.

---

## Lock File Warning

The project is missing a lock file (`package-lock.json` or `bun.lockb`). Please run:
```bash
npm install
# or
bun install
```
This generates the lock file to ensure consistent dependency versions.
