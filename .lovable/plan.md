
# Transfer Working Editor to Replace flow-canvas

## Overview

You have a working, stable editor in another Lovable/GitHub project that you want to bring into this repo to replace the buggy `src/flow-canvas` builder entirely.

## Migration Pattern (Based on How flow-canvas Was Originally Added)

The current flow-canvas was integrated using this pattern:

```text
src/flow-canvas/
├── builder/              ← Core editor components
│   ├── components/       ← EditorShell, CanvasRenderer, panels, etc.
│   ├── contexts/         ← State contexts
│   ├── hooks/            ← Custom hooks
│   ├── utils/            ← Helpers
│   └── index.ts          ← Main exports
├── types/                ← Data contracts
├── shared/               ← Shared types/adapters
├── pages/                ← Index.tsx entry point
└── index.css             ← Builder-specific styles
```

The entry point (`pages/Index.tsx`) wraps `EditorShell` with sample data and is mounted at `/flow-canvas` route in `src/App.tsx`.

---

## Step-by-Step Transfer Process

### Step 1: Prepare Your Export

From your working Lovable/GitHub project, you'll need to share:

1. **Core editor folder structure** (your equivalent of `/builder` or `/editor`)
2. **Type definitions** (data contracts for screens, blocks, elements)
3. **CSS/styles** (any builder-specific theming)
4. **Entry component** (your main EditorShell equivalent)

### Step 2: Create Clean Target Directory

I'll create a fresh directory structure for the new editor:

```text
src/funnel-builder-v3/        ← New clean namespace
├── editor/                   ← Your editor components
│   ├── EditorShell.tsx
│   ├── Canvas.tsx
│   ├── LeftPanel.tsx
│   ├── RightPanel.tsx
│   └── ...
├── state/                    ← State management
├── hooks/                    ← Custom hooks
├── types/                    ← Data contracts
├── styles/                   ← CSS
├── pages/
│   └── Index.tsx             ← Entry point
└── index.ts                  ← Public exports
```

### Step 3: Update Routing

Update `src/App.tsx` to add a route for the new editor:

```tsx
// Add import
import FunnelBuilderV3Index from './funnel-builder-v3/pages/Index';

// Add route (keep /flow-canvas temporarily for comparison)
<Route path="/builder-v3" element={<FunnelBuilderV3Index />} />
```

### Step 4: Migrate FunnelEditor Integration

Update `src/pages/FunnelEditor.tsx` to use the new editor:

```tsx
// Change import from
import { EditorShell } from '@/flow-canvas/builder/components/EditorShell';

// To
import { EditorShell } from '@/funnel-builder-v3/editor/EditorShell';
```

### Step 5: Clean Up Old Code

Once the new editor is verified working:
- Remove `src/flow-canvas/` directory entirely
- Update any imports that reference it
- Remove the `/flow-canvas` route

---

## What I Need From You

To proceed, please share your working editor code. You can do this by:

1. **Copy-paste key files** directly into the chat
2. **Share the GitHub repo URL** so I can reference the structure
3. **Export as a ZIP** and upload the key components

The minimum files I need:
- Main editor shell/layout component
- Canvas/preview component
- Inspector/right panel component
- Type definitions for your data model
- Any CSS/styles

---

## Alternative: Point Me to the Files

If your working editor is in a GitHub repo, share the link and I can look at the file structure to understand:
- Which folder contains the editor
- How state is managed
- What the data model looks like

Then I'll create a detailed file-by-file transfer plan.

---

## Technical Notes

### Data Model Compatibility

Your new editor likely has a different data model than the current flow-canvas. I'll need to:
- Create a data converter (like the existing `dataConverter.ts`) if you want to preserve existing funnels
- OR start fresh if existing funnels can be recreated

### State Management

The current system uses:
- `Page → Step → Frame → Stack → Block → Element` hierarchy
- `EditorShell` with internal `useState` + `useHistory`
- External persistence via `FunnelEditor.tsx` callbacks

Your new editor might use different patterns (Zustand, context, reducer, etc.) - all are supported.

### Styling

The current builder uses:
- CSS variables (`--builder-bg`, `--builder-text`, etc.)
- Glassmorphism aesthetic
- Dark theme by default

Your editor's styles will be isolated in its own namespace to prevent conflicts.

---

## Next Steps

**Share your working editor code** (copy-paste files, GitHub link, or describe the structure) and I'll create the transfer plan with specific file mappings.
