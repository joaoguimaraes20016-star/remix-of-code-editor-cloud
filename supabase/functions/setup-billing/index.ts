// Setup Billing Edge Function
// Creates Stripe customer and checkout session for saving payment method

import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

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

    const { teamId, returnUrl } = await req.json();

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Team ID required" }),
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
        JSON.stringify({ error: "Only team admins can manage billing" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create team billing record
    let { data: billing } = await supabase
      .from("team_billing")
      .select("*")
      .eq("team_id", teamId)
      .single();

    let stripeCustomerId = billing?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!stripeCustomerId) {
      // Get team name for customer
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: team?.name || "Team",
        metadata: {
          team_id: teamId,
          user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Upsert billing record with customer ID
      await supabase
        .from("team_billing")
        .upsert({
          team_id: teamId,
          stripe_customer_id: stripeCustomerId,
        }, { onConflict: "team_id" });
    }

    // Create checkout session in setup mode (for saving card)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${returnUrl}?setup=success`,
      cancel_url: `${returnUrl}?setup=cancelled`,
      metadata: {
        team_id: teamId,
      },
      // Branding: Custom messaging for Infostack
      custom_text: {
        submit: {
          message: "Your card will be saved securely for wallet top-ups and auto-recharge. No charges today.",
        },
      },
    });

    return new Response(
      JSON.stringify({ 
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[setup-billing] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
