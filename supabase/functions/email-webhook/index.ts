// supabase/functions/email-webhook/index.ts
// Handles email event webhooks from Resend and Mailgun.
// Tracks opens, clicks, bounces, deliveries, and complaints.
// Fires email_opened, email_bounced, and messaging_error triggers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Detect which email provider sent the webhook based on payload structure
function detectProvider(body: any): "resend" | "mailgun" | "unknown" {
  // Resend sends { type: "email.delivered", data: { ... } }
  if (body.type && body.data && typeof body.type === "string" && body.type.startsWith("email.")) {
    return "resend";
  }
  // Mailgun sends { event-data: { event: "...", message: { ... } } }
  if (body["event-data"] || body.signature) {
    return "mailgun";
  }
  return "unknown";
}

// Normalize event from different providers into a common format
interface NormalizedEmailEvent {
  eventType: "delivered" | "opened" | "clicked" | "bounced" | "complained" | "failed" | "unknown";
  messageId: string | null;
  recipientEmail: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

function normalizeResendEvent(body: any): NormalizedEmailEvent {
  const eventType = body.type?.replace("email.", "") || "unknown";
  const data = body.data || {};

  const typeMap: Record<string, NormalizedEmailEvent["eventType"]> = {
    "delivered": "delivered",
    "opened": "opened",
    "clicked": "clicked",
    "bounced": "bounced",
    "complained": "complained",
    "delivery_delayed": "failed",
  };

  return {
    eventType: typeMap[eventType] || "unknown",
    messageId: data.email_id || data.message_id || null,
    recipientEmail: data.to?.[0] || data.email || null,
    timestamp: data.created_at || new Date().toISOString(),
    metadata: {
      subject: data.subject,
      from: data.from,
      tags: data.tags,
      bounceType: data.bounce?.type,
    },
  };
}

function normalizeMailgunEvent(body: any): NormalizedEmailEvent {
  const eventData = body["event-data"] || {};
  const event = eventData.event || "";
  const message = eventData.message || {};

  const typeMap: Record<string, NormalizedEmailEvent["eventType"]> = {
    "delivered": "delivered",
    "opened": "opened",
    "clicked": "clicked",
    "failed": "bounced",
    "rejected": "bounced",
    "complained": "complained",
    "unsubscribed": "complained",
  };

  return {
    eventType: typeMap[event] || "unknown",
    messageId: message.headers?.["message-id"] || eventData.id || null,
    recipientEmail: eventData.recipient || null,
    timestamp: eventData.timestamp
      ? new Date(eventData.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    metadata: {
      severity: eventData.severity,
      reason: eventData.reason,
      deliveryStatus: eventData["delivery-status"],
      url: eventData.url, // For click events
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle Mailgun webhook verification (GET request with challenge)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = getSupabaseClient();

  try {
    const body = await req.json();
    const provider = detectProvider(body);

    console.log("[email-webhook] Received event from provider:", provider);

    if (provider === "unknown") {
      console.warn("[email-webhook] Unknown provider, raw body keys:", Object.keys(body));
      return new Response(
        JSON.stringify({ received: true, warning: "Unknown provider" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Normalize the event
    const event =
      provider === "resend"
        ? normalizeResendEvent(body)
        : normalizeMailgunEvent(body);

    console.log("[email-webhook] Normalized event:", {
      provider,
      eventType: event.eventType,
      messageId: event.messageId,
      recipientEmail: event.recipientEmail,
    });

    if (event.eventType === "unknown") {
      return new Response(
        JSON.stringify({ received: true, skipped: "unknown event type" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update message_logs based on event type
    if (event.messageId) {
      const updateData: Record<string, any> = {};

      switch (event.eventType) {
        case "delivered":
          updateData.delivery_status = "delivered";
          updateData.delivered_at = event.timestamp;
          break;
        case "opened":
          updateData.delivery_status = "opened";
          updateData.opened_at = event.timestamp;
          break;
        case "clicked":
          updateData.delivery_status = "clicked";
          updateData.clicked_at = event.timestamp;
          break;
        case "bounced":
          updateData.delivery_status = "bounced";
          updateData.error_message = event.metadata?.reason || event.metadata?.bounceType || "Email bounced";
          break;
        case "complained":
          updateData.delivery_status = "complained";
          updateData.error_message = "Recipient marked as spam";
          break;
        case "failed":
          updateData.delivery_status = "failed";
          updateData.error_message = event.metadata?.reason || "Delivery failed";
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("message_logs")
          .update(updateData)
          .eq("provider_message_id", event.messageId);

        if (updateError) {
          console.error("[email-webhook] Failed to update message_logs:", updateError);
        }
      }
    }

    // Fire automation triggers for specific event types
    const triggerableEvents = ["opened", "bounced", "complained", "failed"];
    if (triggerableEvents.includes(event.eventType) && event.recipientEmail) {
      // Determine trigger type
      let triggerType: string | null = null;
      if (event.eventType === "opened") {
        triggerType = "email_opened";
      } else if (event.eventType === "bounced" || event.eventType === "complained" || event.eventType === "failed") {
        triggerType = "email_bounced";
      }

      if (triggerType) {
        // Find contact and team by email
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, name, first_name, last_name, email, phone, tags, team_id, owner_user_id")
          .eq("email", event.recipientEmail)
          .maybeSingle();

        // Also check message_logs for team_id if contact not found
        let teamId = contact?.team_id || null;
        if (!teamId && event.messageId) {
          const { data: logEntry } = await supabase
            .from("message_logs")
            .select("team_id")
            .eq("provider_message_id", event.messageId)
            .maybeSingle();

          teamId = logEntry?.team_id || null;
        }

        if (teamId) {
          const leadContext = contact
            ? {
                id: contact.id,
                name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                tags: contact.tags || [],
                owner_user_id: contact.owner_user_id,
              }
            : { email: event.recipientEmail };

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
              eventPayload: {
                lead: leadContext,
                meta: {
                  channel: "email",
                  provider,
                  eventType: event.eventType,
                  messageId: event.messageId,
                  recipientEmail: event.recipientEmail,
                  timestamp: event.timestamp,
                  ...event.metadata,
                },
              },
              eventId: `${triggerType}:${event.messageId}:${event.eventType}`,
            }),
          });

          console.log("[email-webhook] Fired trigger:", triggerType, "for team:", teamId);
        } else {
          console.warn("[email-webhook] No team found for email:", event.recipientEmail);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true, eventType: event.eventType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[email-webhook] Error:", error);
    // Return 200 to prevent webhook retries
    return new Response(
      JSON.stringify({ received: true, error: "Internal processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
