import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key - safe for frontend use
// TODO: Replace with your actual publishable key (pk_test_... or pk_live_...)
const STRIPE_PUBLISHABLE_KEY = "pk_test_51SrqRH3DXhRyTdVsFQLNCW2E4i4Y2lQsIHD2YEhqMQ3srsJaKEHZ3CXlxYjbsqzEI7XTbEAx8aQgp0BsTUtYkDWU0064TmFm9a";

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
