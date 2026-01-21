// Add Wallet Funds Edge Function
// Charges saved payment method and adds funds to wallet

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

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { teamId, amountCents } = await req.json();

    if (!teamId || !amountCents) {
      return new Response(
        JSON.stringify({ error: "Team ID and amount required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Minimum $5 deposit
    if (amountCents < 500) {
      return new Response(
        JSON.stringify({ error: "Minimum deposit is $5.00" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is admin of the team
    const { data: member } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!member || member.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only team admins can add funds" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get billing record
    const { data: billing } = await supabase
      .from("team_billing")
      .select("*")
      .eq("team_id", teamId)
      .single();

    if (!billing?.stripe_customer_id || !billing?.stripe_payment_method_id) {
      return new Response(
        JSON.stringify({ error: "No payment method on file. Please add a card first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create payment intent and confirm immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: billing.stripe_customer_id,
      payment_method: billing.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      metadata: {
        team_id: teamId,
        type: "wallet_deposit",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: "Payment failed", status: paymentIntent.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add funds to wallet using RPC
    const { data: result, error: rpcError } = await supabase.rpc("add_wallet_balance", {
      p_team_id: teamId,
      p_amount_cents: amountCents,
      p_transaction_type: "deposit",
      p_reference_id: paymentIntent.id,
      p_description: `Added $${(amountCents / 100).toFixed(2)} to wallet`,
    });

    if (rpcError) {
      console.error("[add-wallet-funds] RPC error:", rpcError);
      // Payment succeeded but wallet update failed - log for manual reconciliation
      return new Response(
        JSON.stringify({ 
          error: "Payment processed but wallet update failed. Contact support.",
          paymentId: paymentIntent.id,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        newBalanceCents: result.new_balance_cents,
        paymentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[add-wallet-funds] Error:", error);
    
    // Handle Stripe card errors specifically
    const stripeError = error as { type?: string; message?: string };
    if (stripeError?.type === "StripeCardError" && stripeError.message) {
      return new Response(
        JSON.stringify({ error: stripeError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
