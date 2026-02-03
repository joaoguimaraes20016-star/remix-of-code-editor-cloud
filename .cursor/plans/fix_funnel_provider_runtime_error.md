# Fix FunnelProvider Error in Runtime

## Problem

Blocks use `useFunnel` from `FunnelContext` which requires `FunnelProvider`, but `FunnelV3Renderer` only provides `FunnelRuntimeProvider`. This causes "useFunnel must be used within a FunnelProvider" error on custom domains.

## Solution

Wrap `FunnelV3Content` with a minimal `FunnelProvider` that provides no-op implementations for runtime use. Blocks need access to:
- `updateBlockContent` (no-op in runtime)
- `selectedChildElement` / `setSelectedChildElement` (no-op in runtime)
- `countryCodes` / `defaultCountryId` (from funnel)
- `currentViewport` (default to 'mobile' for runtime)

### File: `src/funnel-builder-v3/runtime/FunnelV3Renderer.tsx`

Wrap `FunnelV3Content` with `FunnelProvider`:

```typescript
import { FunnelProvider } from '@/funnel-builder-v3/context/FunnelContext';

// In FunnelV3Renderer component:
return (
  <FunnelRuntimeProvider 
    funnel={funnel}
    onFormSubmit={handleFormSubmit}
  >
    <FunnelProvider initialFunnel={funnel}>
      <FunnelV3Content funnel={funnel} />
    </FunnelProvider>
  </FunnelRuntimeProvider>
);
```

This provides both contexts:
- `FunnelRuntimeProvider` for runtime functionality (step navigation, form submission)
- `FunnelProvider` for block editing functionality (even though editing is disabled in runtime)
