// Auto Recharge Edge Function
// Automatically recharges wallet when balance drops below threshold

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const { teamId } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Team ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get billing record
    const { data: billing, error: billingError } = await supabase
      .from("team_billing")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (billingError || !billing) {
      return new Response(
        JSON.stringify({ error: "No billing record found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if auto-recharge is enabled and needed
    if (!billing.auto_recharge_enabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Auto-recharge not enabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (billing.wallet_balance_cents >= billing.auto_recharge_threshold_cents) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Balance above threshold" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!billing.stripe_customer_id || !billing.stripe_payment_method_id) {
      console.error("[auto-recharge] No payment method on file for team:", teamId);
      return new Response(
        JSON.stringify({ error: "No payment method on file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rechargeAmount = billing.auto_recharge_amount_cents;

    console.log("[auto-recharge] Processing for team:", teamId, "amount:", rechargeAmount);

    // Create and confirm payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: rechargeAmount,
      currency: "usd",
      customer: billing.stripe_customer_id,
      payment_method: billing.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      metadata: {
        team_id: teamId,
        type: "auto_recharge",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      console.error("[auto-recharge] Payment failed:", paymentIntent.status);
      return new Response(
        JSON.stringify({ error: "Auto-recharge payment failed", status: paymentIntent.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add funds to wallet
    const { data: result, error: rpcError } = await supabase.rpc("add_wallet_balance", {
      p_team_id: teamId,
      p_amount_cents: rechargeAmount,
      p_transaction_type: "auto_recharge",
      p_reference_id: paymentIntent.id,
      p_description: `Auto-recharged $${(rechargeAmount / 100).toFixed(2)} (balance was below $${(billing.auto_recharge_threshold_cents / 100).toFixed(2)})`,
    });

    if (rpcError) {
      console.error("[auto-recharge] RPC error:", rpcError);
      return new Response(
        JSON.stringify({ 
          error: "Payment processed but wallet update failed",
          paymentId: paymentIntent.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[auto-recharge] Success for team:", teamId, "new balance:", result.new_balance_cents);

    return new Response(
      JSON.stringify({
        success: true,
        newBalanceCents: result.new_balance_cents,
        rechargedCents: rechargeAmount,
        paymentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[auto-recharge] Error:", error);

    // Handle Stripe card errors
    const stripeError = error as { type?: string; message?: string };
    if (stripeError?.type === "StripeCardError" && stripeError.message) {
      return new Response(
        JSON.stringify({ error: `Card declined: ${stripeError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});