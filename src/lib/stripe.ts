import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - safe for frontend use
// TODO: Replace with your actual publishable key (pk_test_... or pk_live_...)
const STRIPE_PUBLISHABLE_KEY = "pk_test_REPLACE_ME";

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
