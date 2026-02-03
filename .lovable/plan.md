
## What the screenshot is telling us (step-by-step diagnosis)

1. The browser is blocking Stripe’s script injection due to **Content Security Policy (CSP)** on the custom domain:
   - Console shows a CSP error like: loading `https://js.stripe.com/v3/...` violates `script-src ...`
2. That CSP block causes Stripe’s loader to fail, which triggers:
   - `Error: Failed to load Stripe.js`
   - then an **Unhandled promise rejection**
3. Your app’s global boot error handler (`src/main.tsx`) converts that into the “INFOSTACK RUNTIME / Unhandled promise rejection” crash screen.

So the problem is not “Stripe lazy loading” in principle; the problem is: **Stripe is still being attempted on the custom domain**, and CSP forbids it.

## Why the current “custom domain” detection isn’t working reliably

Right now, multiple places (notably `src/lib/stripe.ts`, `src/main.tsx`, and `src/components/billing/CardForm.tsx`) decide “this is a funnel on a custom domain” using:

- `isCustomDomain` AND
- `hasFunnelData = !!window.__INFOSTACK_FUNNEL__`

But your `PublicFunnel.tsx` explicitly supports a fallback mode where **injected funnel data may be absent** (it calls the `resolve-domain` edge function). In that scenario:
- you are still on a custom domain
- but `__INFOSTACK_FUNNEL__` can be undefined at boot time
- therefore your “custom domain funnel” checks return false
- therefore Stripe loading is allowed
- therefore CSP blocks Stripe and the app crashes

## Fix strategy (keep everything predictable and explicit)

Given CSP blocks Stripe on the custom domain, the safest and most deterministic approach is:

- Treat **any custom domain host** as “Stripe disabled”
- Do not rely on `__INFOSTACK_FUNNEL__` being present
- Ensure any Stripe load attempt returns a clean “unavailable” result (no thrown errors, no unhandled rejections)
- Add a final safety net in `main.tsx` to suppress Stripe-related boot errors on custom domains (so even if something slips through, it won’t blank-screen)

This matches your product principles: predictable behavior, no hidden magic, clear cause→effect.

---

## Implementation plan (exact changes)

### 1) Create a single shared “custom domain host” detector
**Goal:** stop duplicating slightly-different hostname logic across files.

- Add a small utility (new file) like:
  - `src/lib/runtimeEnv.ts` (or `src/lib/domain.ts`)
  - export `isLovableHost(hostname)` and `isCustomDomainHost()`

Logic should match what you already do in `App.tsx`:
- Not custom if hostname contains: `localhost`, `127.0.0.1`, `.app`, `.lovable.`, `lovableproject.com`
- Everything else is “custom domain host”

### 2) Update Stripe gating to use “custom host” only (no funnel-data requirement)
**File:** `src/lib/stripe.ts`

- Replace `isCustomDomainFunnel()` with something like `isStripeDisabledHost()` which:
  - returns true if `isCustomDomainHost()` is true
  - does NOT check `window.__INFOSTACK_FUNNEL__`

- Ensure `getStripePromise()`:
  - returns `null` immediately on custom domain hosts
  - never calls `loadStripe()` on custom domain hosts
  - never throws (always resolves `null` on failure)

This prevents the CSP violation entirely because the Stripe script injection never happens.

### 3) Fix AddCardModal’s UI state so “null Stripe” is not an infinite spinner
**File:** `src/components/billing/AddCardModal.tsx`

Right now:
- `stripePromise` starts as `null`
- `StripeElements` starts as `null`
- your render treats `(null, null)` as “loading spinner”
- if `getStripePromise()` returns `null`, you never transition to a “Stripe unavailable” UI state

Change to an explicit state machine, e.g.:
- `status: 'idle' | 'loading' | 'ready' | 'unavailable'`
- On open:
  - set `loading`
  - call `getStripePromise()` and import `@stripe/react-stripe-js`
  - if either returns null/fails => set `unavailable`
  - else => set `ready`

Render:
- `ready` => render Elements + CardForm
- `loading` => spinner
- `unavailable` => show “Payment form isn’t available on this domain” (the UI you already have)

### 4) Apply the same host-based gating in CardForm
**File:** `src/components/billing/CardForm.tsx`

It currently does:
- custom domain AND `__INFOSTACK_FUNNEL__`

Update it to:
- custom domain host only

Also consider matching the AddCardModal state behavior:
- if Stripe module import is skipped/unavailable, show a small inline message instead of only a toast.

### 5) Make boot error suppression work even when `__INFOSTACK_FUNNEL__` is absent
**File:** `src/main.tsx`

Update both handlers (`window.error` and `unhandledrejection`) to suppress Stripe-related failures on custom domain hosts **without requiring `__INFOSTACK_FUNNEL__`**.

This is a safety net. With step (2) it should stop triggering, but this prevents future regressions from blank-screening funnels on custom domains.

### 6) Verification checklist (how we’ll know it’s fixed)
On the custom domain (e.g. `https://goldeneramastery.us`):

- DevTools Console should show:
  - No CSP error referencing `js.stripe.com`
  - No “Failed to load Stripe.js”
  - No “Unhandled promise rejection” boot screen

Optional:
- Add `?debug=1` to confirm `PublicFunnel` runtime selection logs are printed and the correct renderer is chosen.

### 7) Note: Stripe inside funnels on custom domains (future capability)
If you eventually want Stripe checkout/Elements inside the published funnel experience on the custom domain, you will need to change the custom domain CSP to allow:
- `https://js.stripe.com`
- and possibly related Stripe assets

Right now your CSP explicitly blocks it, so the correct behavior is to **not attempt Stripe at all** on those hosts.

---

## Lock file (important for consistency)
Your project is missing a lock file. Please generate and commit one:
- run `npm install` (creates `package-lock.json`) or
- run `bun install` (creates `bun.lockb`)

This prevents “works on my machine” dependency drift.

---

## Files we will touch
- Add: `src/lib/runtimeEnv.ts` (or similar shared helper)
- Update: `src/lib/stripe.ts`
- Update: `src/components/billing/AddCardModal.tsx`
- Update: `src/components/billing/CardForm.tsx`
- Update: `src/main.tsx`
