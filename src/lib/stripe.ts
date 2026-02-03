// Stripe publishable key - safe for frontend use
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SrqRH3DXhRyTdVsFQLNCW2E4i4Y2lQsIHD2YEhqMQ3srsJaKEHZ3CXlxYjbsqzEI7XTbEAx8aQgp0BsTUtYkDWU0064TmFm9a";

// Check if we're on a custom domain serving a funnel
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

// Lazy initialization - only loads Stripe when actually needed
// Returns null on custom domains to prevent loading errors
let stripePromiseInstance: Promise<any> | null = null;

export const getStripePromise = async (): Promise<any> => {
  // CRITICAL: Return null on custom domain funnel views (don't throw)
  if (isCustomDomainFunnel()) {
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
