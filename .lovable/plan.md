

# Fix v3 Builder CSS Not Loading

## Problem Identified

The v3 builder **CSS is not being loaded** because the FunnelEditor page imports the Editor component directly from the component file instead of from the package index:

```tsx
// Current (BROKEN) - CSS not imported
import { Editor } from '@/funnel-builder-v3/components/Editor';

// Correct - CSS is imported via index.ts
import { Editor } from '@/funnel-builder-v3';
```

The `src/funnel-builder-v3/index.ts` file contains the CSS import:
```tsx
import './styles/builder.css';  // ← This never runs
export { Editor } from './components/Editor';
```

## The Fix

**One simple change** to `src/pages/FunnelEditor.tsx`:

```diff
- import { Editor } from '@/funnel-builder-v3/components/Editor';
+ import { Editor } from '@/funnel-builder-v3';
```

This ensures the index file runs, which imports the CSS file with all the dark theme variables.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/FunnelEditor.tsx` | Update import path for Editor component |

**Total: 1 line changed**

---

## Verification

After this fix:
1. The CSS variables (`--builder-v3-bg`, `--builder-v3-surface`, etc.) will be defined
2. The Editor shell will have the dark charcoal background (HSL 220 13% 8%)
3. All panels will have proper dark surfaces
4. The canvas will have the very dark background
5. Selection states, animations, and all v3 CSS classes will work

## Why This Works

The CSS import chain:
```
FunnelEditor.tsx
  └── import { Editor } from '@/funnel-builder-v3'
        └── funnel-builder-v3/index.ts
              └── import './styles/builder.css'  ✅ CSS loads!
```

---

## Success Criteria

1. Dark charcoal theme visible in the builder
2. Left panel has dark surface with proper text colors
3. Right panel has dark surface with themed tabs
4. Canvas has very dark background
5. Device frame has proper shadow/glow effects
6. No TypeScript errors

