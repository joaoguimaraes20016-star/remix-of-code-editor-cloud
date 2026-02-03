

# Fix Stripe Loading Error on Custom Domains

## Problem

When users visit a funnel on a custom domain (e.g., `goldeneramastery.us`), they see:

```
INFOSTACK RUNTIME
Unhandled promise rejection
Error: Failed to load Stripe.js
```

**Root Cause:** The Vite configuration uses `inlineDynamicImports: true`, which bundles ALL code into a single JavaScript file. This means even "dynamic" imports of `@stripe/stripe-js` get bundled together. When the bundle loads, Stripe's internal initialization code tries to inject a script tag and fails on custom domains.

## Current State

1. **Vite config** (`vite.config.ts` line 48): Forces single bundle
2. **Stripe lib** (`src/lib/stripe.ts`): Uses lazy loading pattern, but it doesn't help with single bundle
3. **Error handlers** (`main.tsx`): Try to suppress Stripe errors, but they fire too late
4. **Build errors**: Missing `Button` import in `AddCardModal.tsx` and `published_at` column issue

## Solution

Since we cannot change the bundling strategy (needed for custom domain serving), we need to **completely prevent Stripe code from executing** on custom domains.

### Part 1: Fix Build Errors

**File: `src/components/billing/AddCardModal.tsx`**
- Add missing `Button` import from `@/components/ui/button`

**File: `src/funnel-builder-v3/hooks/useFunnelPersistence.ts`**
- Remove all references to `published_at` column (doesn't exist in database)
  - Line 26: Remove from `FunnelRecord` interface
  - Line 48: Remove from select query
  - Lines 52-55: Remove from type assertion
  - Lines 328, 332: Remove from cache updates
  - Line 369: Remove from return value

### Part 2: Block Stripe Import at Build Time

**File: `vite.config.ts`**

Add a custom Vite plugin that replaces Stripe imports with empty stubs on custom domains. This prevents the Stripe bundle from executing entirely:

```typescript
const stripeBloackPlugin = () => ({
  name: 'stripe-block',
  resolveId(source: string) {
    // On custom domains, replace Stripe with empty module
    if (source === '@stripe/stripe-js' || source === '@stripe/react-stripe-js') {
      return '\0virtual:stripe-stub';
    }
    return null;
  },
  load(id: string) {
    if (id === '\0virtual:stripe-stub') {
      return `
        export const loadStripe = () => Promise.reject(new Error('Stripe not available'));
        export const Elements = () => null;
        export const CardElement = () => null;
        export const useStripe = () => null;
        export const useElements = () => null;
      `;
    }
    return null;
  }
});
```

**Problem:** This would break Stripe in the main app too.

### Part 3: Better Approach - Early Domain Check

**File: `src/main.tsx`**

Add an early check BEFORE React renders. If we're on a custom domain with funnel data, skip loading the full app and render just the funnel runtime:

```typescript
// At the very top of main.tsx, before any imports that might trigger Stripe
const isCustomDomainFunnel = typeof window !== 'undefined' && 
  (() => {
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.includes('localhost') && 
                           !hostname.includes('.app') && 
                           !hostname.includes('.lovable.') &&
                           !hostname.includes('lovableproject.com') &&
                           !hostname.includes('127.0.0.1');
    const hasFunnelData = !!(window as any).__INFOSTACK_FUNNEL__;
    return isCustomDomain && hasFunnelData;
  })();

if (isCustomDomainFunnel) {
  // Load minimal funnel runtime only
  import('./funnel-runtime-entry').then(({ bootstrap }) => bootstrap());
} else {
  // Load full app
  bootstrap();
}
```

**Problem:** With `inlineDynamicImports: true`, this won't work either because all imports are already bundled.

### Part 4: Recommended Solution - Suppress at Stripe Library Level

**File: `src/lib/stripe.ts`**

The `@stripe/stripe-js` package loads Stripe via a script tag. The error occurs because the script fails to load on custom domains (CSP, network issues, etc.).

The real fix is to **not call loadStripe at all** on custom domains, and ensure the dynamic import is wrapped in a try-catch that returns early:

```typescript
// src/lib/stripe.ts - Complete rewrite

const STRIPE_PUBLISHABLE_KEY = "pk_test_...";

function isCustomDomainFunnel(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const isCustomDomain = !hostname.includes('localhost') && 
                         !hostname.includes('.app') && 
                         !hostname.includes('.lovable.') &&
                         !hostname.includes('lovableproject.com') &&
                         !hostname.includes('127.0.0.1');
  const hasFunnelData = !!(window as any).__INFOSTACK_FUNNEL__;
  return isCustomDomain && hasFunnelData;
}

let stripePromiseInstance: Promise<any> | null = null;

export async function getStripePromise(): Promise<any> {
  // CRITICAL: Check BEFORE any Stripe code runs
  if (isCustomDomainFunnel()) {
    return null; // Return null instead of throwing
  }

  if (!stripePromiseInstance) {
    try {
      const { loadStripe } = await import("@stripe/stripe-js");
      stripePromiseInstance = loadStripe(STRIPE_PUBLISHABLE_KEY);
    } catch (error) {
      console.warn("Failed to load Stripe:", error);
      return null;
    }
  }
  return stripePromiseInstance;
}
```

**File: `src/components/billing/AddCardModal.tsx`**

Update to handle null Stripe gracefully and add missing Button import:

```typescript
import { Button } from "@/components/ui/button";

// In useEffect:
Promise.all([
  getStripePromise().catch(() => null),
  import("@stripe/react-stripe-js").catch(() => null)
]).then(([promise, module]) => {
  if (promise && module) {
    setStripePromise(promise);
    setStripeElements(() => module.Elements);
  } else {
    // Stripe not available - show fallback UI
    setStripeError(true);
  }
});
```

### Part 5: Alternative - Remove Stripe from Bundle

The cleanest solution would be to change Vite config to allow code splitting:

**File: `vite.config.ts`**

```typescript
// Change from:
inlineDynamicImports: true,

// To:
inlineDynamicImports: false,
manualChunks: {
  stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
}
```

**However**, the comment says this is needed "to avoid React initialization / chunk order issues" and for "custom domain serving". This would require testing to ensure custom domain serving still works.

---

## Recommended Implementation Order

1. **Fix build errors first** (missing Button import, published_at references)
2. **Update `getStripePromise` to return null instead of throwing**
3. **Update `AddCardModal` to handle null Stripe gracefully**
4. **Test on custom domain**

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/billing/AddCardModal.tsx` | Add `Button` import, handle null Stripe |
| `src/funnel-builder-v3/hooks/useFunnelPersistence.ts` | Remove all `published_at` references |
| `src/lib/stripe.ts` | Return null instead of rejecting on custom domains |

## Technical Notes

- The `inlineDynamicImports: true` setting is required for custom domain serving
- With single bundle, we can't truly lazy-load Stripe separately
- The Stripe library attempts to load even when imported dynamically due to module side effects
- Returning `null` from `getStripePromise` instead of throwing prevents unhandled rejections
- The UI should show "Payment form not available on this domain" when Stripe is null

