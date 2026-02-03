# Fix Stripe Loading Error on Custom Domains

## Problem

When viewing published funnels on custom domains, the app crashes with "Failed to load Stripe.js" error because:
- Stripe is eagerly initialized in `src/lib/stripe.ts`
- All code is bundled into one chunk (Vite `inlineDynamicImports: true`)
- Funnel runtime doesn't need Stripe but loads it anyway

## Solution

Convert Stripe initialization from eager to lazy loading.

### 1. Update `src/lib/stripe.ts`

Replace eager initialization with lazy loading:

```typescript
// Before:
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// After:
let stripePromiseInstance: ReturnType<typeof loadStripe> | null = null;

export const getStripePromise = () => {
  if (!stripePromiseInstance) {
    stripePromiseInstance = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromiseInstance;
};
```

### 2. Update `src/components/billing/AddCardModal.tsx`

Replace direct import with getter function:

```typescript
// Before:
import { stripePromise } from "@/lib/stripe";
<Elements stripe={stripePromise}>

// After:
import { getStripePromise } from "@/lib/stripe";
<Elements stripe={getStripePromise()}>
```

## Benefits

- Stripe only loads when billing modal opens
- Custom domain visitors never trigger Stripe loading
- No bundling changes needed
- Existing billing functionality unchanged
