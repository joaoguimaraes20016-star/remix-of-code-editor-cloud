// supabase/functions/stripe-user-webhook/index.ts
// Handles webhooks from user's connected Stripe accounts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Map Stripe event types to automation trigger types
const EVENT_TO_TRIGGER: Record<string, string> = {
  "payment_intent.succeeded": "payment_received",
  "payment_intent.payment_failed": "payment_failed",
  "invoice.paid": "invoice_paid",
  "invoice.payment_failed": "payment_failed",
  "customer.subscription.created": "subscription_created",
  "customer.subscription.updated": "subscription_renewed",
  "customer.subscription.deleted": "subscription_cancelled",
  "charge.refunded": "refund_issued",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const url = new URL(req.url);

  try {
    // Get team ID from query params
    const teamId = url.searchParams.get("teamId");
    
    if (!teamId) {
      console.error("[stripe-user-webhook] Missing teamId");
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Get team's webhook secret
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("provider", "stripe")
      .eq("is_connected", true)
      .single();

    if (fetchError || !integration) {
      console.error("[stripe-user-webhook] Team integration not found:", teamId);
      return new Response(
        JSON.stringify({ error: "Integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = integration.config as Record<string, any>;
    const webhookSecret = config?.webhook_secret;

    // Verify webhook signature if we have a secret
    if (webhookSecret && signature) {
      const isValid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("[stripe-user-webhook] Invalid signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse the event
    const event = JSON.parse(body);
    const eventType = event.type;
    const eventData = event.data?.object;

    console.log("[stripe-user-webhook] Received event:", eventType, "for team:", teamId);

    // Store raw event for debugging
    await supabase.from("payment_events").insert({
      team_id: teamId,
      provider: "stripe",
      event_type: eventType,
      event_id: event.id,
      customer_id: eventData?.customer,
      amount: eventData?.amount || eventData?.amount_total,
      currency: eventData?.currency,
      status: eventData?.status,
      raw_data: event,
      created_at: new Date().toISOString(),
    });

    // Map to automation trigger
    const triggerType = EVENT_TO_TRIGGER[eventType];
    
    if (triggerType) {
      // Build context for automation
      const customerEmail = await getCustomerEmail(eventData, config.access_token);
      
      const eventPayload = {
        teamId,
        payment: {
          id: eventData.id,
          amount: (eventData.amount || eventData.amount_total || 0) / 100, // Convert from cents
          currency: eventData.currency?.toUpperCase(),
          status: eventData.status,
          customerId: eventData.customer,
          customerEmail: customerEmail,
          subscriptionId: eventData.subscription,
          invoiceId: eventData.invoice || eventData.id,
          paymentType: eventType.includes("subscription") ? "recurring" : "one_time",
        },
        lead: customerEmail ? {
          email: customerEmail,
        } : null,
        meta: {
          stripeEventId: event.id,
          stripeEventType: eventType,
          provider: "stripe",
        },
      };

      // Fire automation trigger
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          triggerType,
          teamId,
          eventPayload,
          eventId: `stripe:${event.id}`,
        }),
      });

      console.log("[stripe-user-webhook] Fired trigger:", triggerType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[stripe-user-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts.t;
    const expectedSig = parts.v1;

    if (!timestamp || !expectedSig) return false;

    // Check timestamp is within 5 minutes
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) return false;

    // Compute expected signature
    const payload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSig === expectedSig;
  } catch {
    return false;
  }
}

async function getCustomerEmail(
  eventData: any,
  accessToken: string
): Promise<string | null> {
  // Try to get email from event data first
  if (eventData.receipt_email) return eventData.receipt_email;
  if (eventData.billing_details?.email) return eventData.billing_details.email;
  if (eventData.customer_email) return eventData.customer_email;

  // If we have a customer ID and access token, fetch customer details
  const customerId = eventData.customer;
  if (customerId && accessToken) {
    try {
      const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      const customer = await response.json();
      return customer.email || null;
    } catch {
      return null;
    }
  }

  return null;
}
