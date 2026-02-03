// Stripe publishable key - safe for frontend use
// TODO: Replace with your actual publishable key (pk_test_... or pk_live_...)
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SrqRH3DXhRyTdVsFQLNCW2E4i4Y2lQsIHD2YEhqMQ3srsJaKEHZ3CXlxYjbsqzEI7XTbEAx8aQgp0BsTUtYkDWU0064TmFm9a";

// Check if we're on a custom domain (for serving funnels at root)
function isCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Not a custom domain if it's localhost, preview, or Lovable domains
  return !hostname.includes('localhost') && 
         !hostname.includes('.app') && 
         !hostname.includes('.lovable.') &&
         !hostname.includes('lovableproject.com') &&
         !hostname.includes('127.0.0.1');
}

// Check if funnel data was injected by serve-funnel edge function
function hasInjectedFunnelData(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__INFOSTACK_FUNNEL__;
}

// Lazy initialization with dynamic import - only loads Stripe when actually needed
// This prevents Stripe from loading on custom domain funnel views
// Dynamic import ensures @stripe/stripe-js is not loaded until getStripePromise is called
let stripePromiseInstance: Promise<any> | null = null;

export const getStripePromise = async (): Promise<any> => {
  // Never load Stripe on custom domain funnel views
  if (isCustomDomain() && hasInjectedFunnelData()) {
    // Return a rejected promise that won't cause unhandled rejection errors
    return Promise.reject(new Error("Stripe is not available on custom domain funnel views"));
  }

  // Double-check before importing
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isCustom = !hostname.includes('localhost') && 
                     !hostname.includes('.app') && 
                     !hostname.includes('.lovable.') &&
                     !hostname.includes('lovableproject.com') &&
                     !hostname.includes('127.0.0.1');
    const hasFunnel = !!(window as any).__INFOSTACK_FUNNEL__;
    
    if (isCustom && hasFunnel) {
      return Promise.reject(new Error("Stripe is not available on custom domain funnel views"));
    }
  }

  if (!stripePromiseInstance) {
    try {
      // Dynamically import loadStripe only when needed
      const { loadStripe } = await import("@stripe/stripe-js");
      stripePromiseInstance = loadStripe(STRIPE_PUBLISHABLE_KEY);
    } catch (error) {
      // If Stripe fails to load, don't retry
      console.warn("Failed to load Stripe:", error);
      throw error;
    }
  }
  return stripePromiseInstance;
};
