import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Map Whop event types to automation triggers
const EVENT_TO_TRIGGER: Record<string, string> = {
  "payment.succeeded": "payment_received",
  "membership.went_valid": "subscription_created",
  "membership.went_invalid": "subscription_cancelled",
  "membership.activated": "subscription_created",
  "membership.deactivated": "subscription_cancelled",
};

async function verifyWhopSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Whop uses HMAC-SHA256 for webhook verification
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = Uint8Array.from(
      atob(signature),
      (c) => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(body)
    );
  } catch (error) {
    console.error("[whop-webhook] Signature verification error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    if (!teamId) {
      console.error("[whop-webhook] Missing teamId in query params");
      return new Response(
        JSON.stringify({ error: "Missing teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();

    // Get Whop integration for this team
    const { data: integration, error: fetchError } = await supabase
      .from("team_integrations")
      .select("config, is_connected")
      .eq("team_id", teamId)
      .eq("integration_type", "whop")
      .maybeSingle();

    if (fetchError || !integration || !integration.is_connected) {
      console.error("[whop-webhook] Whop not connected for team:", teamId);
      return new Response(
        JSON.stringify({ error: "Whop not connected" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = integration.config as Record<string, any>;

    // Get request body
    const body = await req.text();

    // Verify webhook signature if webhook secret is configured
    const signature = req.headers.get("whop-signature");
    if (config.webhook_secret && signature) {
      const isValid = await verifyWhopSignature(body, signature, config.webhook_secret);
      if (!isValid) {
        console.error("[whop-webhook] Invalid signature for team:", teamId);
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse the event
    const event = JSON.parse(body);
    const eventType = event.event || event.type;
    const eventData = event.data || event;

    console.log(`[whop-webhook] Received ${eventType} for team ${teamId}`);

    // Store raw event in payment_events table
    const { error: insertError } = await supabase.from("payment_events").insert({
      team_id: teamId,
      provider: "whop",
      event_type: eventType,
      event_id: event.id || crypto.randomUUID(),
      payload: event,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[whop-webhook] Failed to store event:", insertError);
    }

    // Map to automation trigger
    const triggerType = EVENT_TO_TRIGGER[eventType];

    if (triggerType) {
      // Build event payload for automation
      const eventPayload = {
        trigger_type: triggerType,
        team_id: teamId,
        provider: "whop",
        event_type: eventType,
        data: {
          amount: eventData.amount || eventData.price || null,
          currency: eventData.currency || "usd",
          customer_email: eventData.user?.email || eventData.email || null,
          customer_name: eventData.user?.name || eventData.username || null,
          customer_id: eventData.user?.id || eventData.user_id || null,
          product_id: eventData.product?.id || eventData.product_id || null,
          product_name: eventData.product?.name || null,
          membership_id: eventData.membership?.id || eventData.id || null,
          raw_event: event,
        },
      };

      // Trigger automation
      try {
        const automationResponse = await fetch(
          `https://kqfyevdblvgxaycdvfxe.supabase.co/functions/v1/automation-trigger`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify(eventPayload),
          }
        );

        if (!automationResponse.ok) {
          console.error("[whop-webhook] Automation trigger failed:", await automationResponse.text());
        } else {
          console.log(`[whop-webhook] Triggered ${triggerType} automation for team ${teamId}`);
        }
      } catch (automationError) {
        console.error("[whop-webhook] Automation trigger error:", automationError);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[whop-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
