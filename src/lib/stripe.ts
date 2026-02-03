import { isCustomDomainHost } from './runtimeEnv';

// Stripe publishable key - safe for frontend use
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SrqRH3DXhRyTdVsFQLNCW2E4i4Y2lQsIHD2YEhqMQ3srsJaKEHZ3CXlxYjbsqzEI7XTbEAx8aQgp0BsTUtYkDWU0064TmFm9a";

// Lazy initialization with dynamic import - only loads Stripe when actually needed
// This prevents Stripe from loading on custom domain funnel views
// Dynamic import ensures @stripe/stripe-js is not loaded until getStripePromise is called
let stripePromiseInstance: Promise<any> | null = null;

export const getStripePromise = async (): Promise<any> => {
  // Never load Stripe on custom domain hosts - CSP blocks it
  if (isCustomDomainHost()) {
    return null;
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
};
