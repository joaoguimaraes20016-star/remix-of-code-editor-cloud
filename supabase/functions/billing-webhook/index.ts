// Billing Webhook Edge Function
// Handles Stripe webhook events for billing

import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("[billing-webhook] Stripe secret key not configured");
      return new Response("Stripe not configured", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (stripeWebhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      } catch (err) {
        console.error("[billing-webhook] Signature verification failed:", err);
        return new Response("Webhook signature verification failed", { status: 400 });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
      console.log("[billing-webhook] Processing without signature verification");
    }

    console.log("[billing-webhook] Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "setup") {
          const teamId = session.metadata?.team_id;
          const customerId = session.customer as string;
          const setupIntentId = session.setup_intent as string;

          if (!teamId || !setupIntentId) {
            console.error("[billing-webhook] Missing teamId or setupIntentId");
            break;
          }

          // Get the setup intent to find the payment method
          const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
          const paymentMethodId = setupIntent.payment_method as string;

          if (!paymentMethodId) {
            console.error("[billing-webhook] No payment method in setup intent");
            break;
          }

          // Get payment method details
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

          // Set as default payment method for the customer
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });

          // Update billing record
          const { error: updateError } = await supabase
            .from("team_billing")
            .update({
              stripe_payment_method_id: paymentMethodId,
              payment_method_brand: paymentMethod.card?.brand || null,
              payment_method_last4: paymentMethod.card?.last4 || null,
            })
            .eq("team_id", teamId);

          if (updateError) {
            console.error("[billing-webhook] Failed to update billing:", updateError);
          } else {
            console.log("[billing-webhook] Payment method saved for team:", teamId);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const teamId = paymentIntent.metadata?.team_id;
        const type = paymentIntent.metadata?.type;

        console.log("[billing-webhook] Payment succeeded:", {
          teamId,
          type,
          amount: paymentIntent.amount,
        });

        // Wallet deposits are handled in the add-wallet-funds function
        // This is just for logging/confirmation
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const teamId = paymentIntent.metadata?.team_id;

        console.error("[billing-webhook] Payment failed:", {
          teamId,
          error: paymentIntent.last_payment_error?.message,
        });

        // TODO: Send notification to team admin about failed payment
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        // Handle subscription events if we add subscriptions later
        console.log("[billing-webhook] Subscription event:", event.type);
        break;
      }

      default:
        console.log("[billing-webhook] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[billing-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
