
# Unify Funnel Builder Apps

## Executive Summary

We'll merge the `apps/funnel-flow-studio` editor directly into the main app, completely replacing the existing `flow-canvas` builder. This eliminates:
- The separate monorepo app complexity
- Session sharing issues between apps
- The need for complex data converters
- Two different data models fighting each other

After this unification, you'll have **one app** with the new `Funnel → Steps → Blocks` builder that saves directly to Supabase.

---

## Current State (Problem)

```text
┌─────────────────────────────────────┐
│          MAIN APP (root)            │
│  • Uses flow-canvas builder         │
│  • Complex Page/Step/Frame/Stack    │
│    /Block/Element hierarchy         │
│  • dataConverter.ts to bridge       │
└─────────────────────────────────────┘
                 ↕ (session sharing issues)
┌─────────────────────────────────────┐
│  apps/funnel-flow-studio (separate) │
│  • Clean Funnel/Steps/Blocks model  │
│  • Working localStorage persistence │
│  • Needs Supabase integration       │
└─────────────────────────────────────┘
```

---

## Target State (Solution)

```text
┌─────────────────────────────────────────────────────┐
│                   UNIFIED MAIN APP                  │
│                                                     │
│  src/funnel-builder-v3/                             │
│  ├── editor/          ← FunnelEditor, Canvas, etc. │
│  ├── context/         ← FunnelContext (w/ Supabase)│
│  ├── blocks/          ← Block components           │
│  ├── inspector/       ← Property editors           │
│  ├── hooks/           ← Keyboard shortcuts, etc.   │
│  ├── lib/             ← Templates, block defs      │
│  └── types/           ← Funnel, Step, Block types  │
│                                                     │
│  Route: /team/:teamId/funnels/:funnelId/edit        │
│  Uses: FunnelEditorPage (unified wrapper)           │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Copy Builder App Files to Main App

Create new directory `src/funnel-builder-v3/` and copy these files from `apps/funnel-flow-studio/src/`:

| Source (apps/funnel-flow-studio/src/) | Target (src/funnel-builder-v3/) |
|---------------------------------------|----------------------------------|
| `components/editor/*`                 | `editor/*`                       |
| `context/FunnelContext.tsx`           | `context/FunnelContext.tsx`      |
| `context/FunnelRuntimeContext.tsx`    | `context/FunnelRuntimeContext.tsx`|
| `types/funnel.ts`                     | `types/funnel.ts`                |
| `lib/block-definitions.ts`            | `lib/block-definitions.ts`       |
| `lib/templates.ts`                    | `lib/templates.ts`               |
| `lib/color-presets.ts`                | `lib/color-presets.ts`           |
| `lib/selection-utils.ts`              | `lib/selection-utils.ts`         |
| `hooks/useKeyboardShortcuts.ts`       | `hooks/useKeyboardShortcuts.ts`  |

### Step 2: Fix Import Paths

All `@/` imports need to be updated:
- `@/components/...` → `@/funnel-builder-v3/...` or existing main app components
- `@/types/funnel` → `@/funnel-builder-v3/types/funnel`
- `@/lib/...` → `@/funnel-builder-v3/lib/...`
- `@/context/...` → `@/funnel-builder-v3/context/...`

### Step 3: Add Supabase Persistence to FunnelContext

Update `FunnelContext.tsx` to:

1. Accept props for `funnelId` and `teamId`
2. Load funnel from Supabase on mount (instead of localStorage)
3. Auto-save to Supabase with debouncing
4. Support publish action

```typescript
interface FunnelProviderProps {
  children: ReactNode;
  funnelId?: string;
  teamId?: string;
  onSave?: (funnel: Funnel) => void;
  onPublish?: (funnel: Funnel) => void;
}
```

### Step 4: Create Unified FunnelEditorPage

Create `src/pages/FunnelEditorV3.tsx` that:

1. Gets `funnelId` and `teamId` from URL params
2. Fetches funnel data from Supabase
3. Passes data to `FunnelProvider`
4. Handles save/publish mutations

```typescript
export default function FunnelEditorV3() {
  const { teamId, funnelId } = useParams();
  
  // Fetch funnel from Supabase
  const { data: funnel, isLoading } = useQuery({...});
  
  // Convert DB format to editor format
  const initialFunnel = useMemo(() => 
    dbFunnelToEditorFunnel(funnel), [funnel]
  );
  
  return (
    <FunnelProvider 
      initialFunnel={initialFunnel}
      funnelId={funnelId}
      teamId={teamId}
      onSave={handleSave}
      onPublish={handlePublish}
    >
      <FunnelEditor />
    </FunnelProvider>
  );
}
```

### Step 5: Data Model Mapping

The new builder stores data in a simpler format. Map to existing DB columns:

```text
Editor State (Funnel)          →    Supabase funnels table
───────────────────────────────────────────────────────────
funnel.id                      →    id (existing)
funnel.name                    →    name (existing)
funnel (full JSON)             →    builder_document (JSON column)
funnel.settings                →    settings (JSON column)
'draft' / 'published'          →    status (existing)
funnel (snapshot on publish)   →    published_document_snapshot
```

### Step 6: Update Routes in App.tsx

```typescript
// Remove old import
// import FlowCanvasIndex from "./flow-canvas/pages/Index";

// Add new import
import FunnelEditorV3 from "./pages/FunnelEditorV3";

// Update route
<Route path="/team/:teamId/funnels/:funnelId/edit" element={<FunnelEditorV3 />} />
```

### Step 7: Update Runtime Renderer

Create a simple runtime renderer that reads the new format:

```typescript
// src/components/funnel-runtime/FunnelRuntime.tsx
export function FunnelRuntime({ funnel }: { funnel: Funnel }) {
  // Uses same block components as editor but in read-only mode
  return (
    <FunnelRuntimeProvider funnel={funnel}>
      <RuntimeCanvas />
    </FunnelRuntimeProvider>
  );
}
```

Update `PublicFunnel.tsx` to use this for published funnels.

### Step 8: Clean Up Old Code

After verification, remove:
- `src/flow-canvas/` directory entirely
- `apps/funnel-flow-studio/` directory entirely
- `src/lib/funnel/dataConverter.ts` (no longer needed)
- Old builder_v2 references

---

## File Structure After Unification

```text
src/
├── funnel-builder-v3/
│   ├── editor/
│   │   ├── FunnelEditor.tsx      ← Main editor shell
│   │   ├── Canvas.tsx            ← Preview canvas
│   │   ├── LeftPanel.tsx         ← Steps list + add blocks
│   │   ├── RightPanel.tsx        ← Inspector
│   │   ├── EditorHeader.tsx      ← Header with save/publish
│   │   ├── PreviewMode.tsx       ← Full preview mode
│   │   ├── blocks/               ← Block renderers
│   │   └── inspector/            ← Property editors
│   ├── context/
│   │   ├── FunnelContext.tsx     ← State management
│   │   └── FunnelRuntimeContext.tsx
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── block-definitions.ts
│   │   ├── templates.ts
│   │   └── color-presets.ts
│   ├── types/
│   │   └── funnel.ts
│   └── index.ts                  ← Public exports
├── pages/
│   └── FunnelEditorV3.tsx        ← Route handler with DB logic
└── components/
    └── funnel-runtime/
        └── FunnelRuntime.tsx     ← Published funnel renderer
```

---

## Benefits

1. **Single app** - No monorepo complexity for funnels
2. **Shared auth** - Uses main app's auth session natively
3. **Simple data model** - `Funnel → Steps → Blocks` vs 6-level hierarchy
4. **Direct Supabase access** - No edge function needed for saves
5. **Same components for edit and runtime** - True WYSIWYG
6. **Easier maintenance** - One codebase to update

---

## Migration Considerations

### Existing Funnels

Existing funnels use the flow-canvas format in `builder_document`. Options:
1. **Write a one-time migration** - Convert old format to new
2. **Support both formats** - Detect format version and convert on load
3. **Start fresh** - Old funnels stay read-only, new ones use v3

Recommendation: **Option 2** - Detect format on load and convert automatically.

### Dependencies

The builder app uses these packages already in main app:
- `@dnd-kit/core`, `@dnd-kit/sortable` ✓
- `framer-motion` ✓
- `uuid` → use crypto.randomUUID() or install uuid

Missing: None significant - both apps share the same base.

---

## Note on Lock File

The project is missing a lock file. To ensure consistent dependency versions, please run:

```bash
npm install
# or
bun install
```

This will generate `package-lock.json` or `bun.lockb` which you should commit to the repository.
