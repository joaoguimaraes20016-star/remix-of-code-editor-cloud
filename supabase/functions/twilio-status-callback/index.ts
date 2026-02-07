// supabase/functions/twilio-status-callback/index.ts
// Handles SMS/WhatsApp/Voice delivery status callbacks from Twilio.
// Updates message_logs and fires messaging_error trigger on failures.

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

// Map Twilio status to our delivery status
function mapTwilioStatus(twilioStatus: string): string {
  switch (twilioStatus) {
    case "queued":
    case "accepted":
      return "queued";
    case "sending":
      return "sending";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "undelivered":
    case "failed":
      return "failed";
    default:
      return twilioStatus;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    // Twilio sends callbacks as URL-encoded form data
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid") as string || formData.get("SmsSid") as string;
    const messageStatus = formData.get("MessageStatus") as string || formData.get("SmsStatus") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;
    const to = formData.get("To") as string | null;
    const from = formData.get("From") as string | null;
    const channelPrefix = formData.get("ChannelPrefix") as string | null;

    if (!messageSid || !messageStatus) {
      console.error("[twilio-status-callback] Missing required fields:", { messageSid, messageStatus });
      // Return 200 to prevent Twilio retries
      return new Response(
        JSON.stringify({ received: true, error: "Missing required fields" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const deliveryStatus = mapTwilioStatus(messageStatus);
    const isWhatsApp = to?.startsWith("whatsapp:") || from?.startsWith("whatsapp:") || channelPrefix === "whatsapp";
    const channel = isWhatsApp ? "whatsapp" : "sms";

    console.log("[twilio-status-callback] Received:", {
      messageSid,
      messageStatus,
      deliveryStatus,
      channel,
      errorCode,
    });

    // Update message_logs with delivery status
    const updateData: Record<string, any> = {
      delivery_status: deliveryStatus,
    };

    if (deliveryStatus === "delivered" || deliveryStatus === "read") {
      updateData.delivered_at = new Date().toISOString();
    }

    if (deliveryStatus === "failed") {
      updateData.error_message = errorMessage || `Error code: ${errorCode}`;
    }

    const { data: messageLog, error: updateError } = await supabase
      .from("message_logs")
      .update(updateData)
      .eq("provider_message_id", messageSid)
      .select("id, team_id, to_address, automation_id, payload")
      .maybeSingle();

    if (updateError) {
      console.error("[twilio-status-callback] Failed to update message_logs:", updateError);
    }

    // Fire messaging_error trigger if message failed
    if ((deliveryStatus === "failed") && messageLog?.team_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Find contact by phone number
      const recipientPhone = to?.replace("whatsapp:", "") || null;
      let leadContext: Record<string, any> = {};
      if (recipientPhone) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, name, first_name, last_name, email, phone, tags")
          .eq("team_id", messageLog.team_id)
          .eq("phone", recipientPhone)
          .maybeSingle();

        if (contact) {
          leadContext = {
            id: contact.id,
            name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
            email: contact.email,
            phone: contact.phone,
            tags: contact.tags || [],
          };
        } else {
          leadContext = { phone: recipientPhone };
        }
      }

      await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          triggerType: "messaging_error",
          teamId: messageLog.team_id,
          eventPayload: {
            lead: leadContext,
            meta: {
              channel,
              messageSid,
              errorCode,
              errorMessage: errorMessage || `Delivery failed: ${messageStatus}`,
              originalAutomationId: messageLog.automation_id,
              recipient: to,
            },
          },
          eventId: `messaging_error:${messageSid}`,
        }),
      });

      console.log("[twilio-status-callback] Fired messaging_error trigger for team:", messageLog.team_id);
    }

    // Always return 200 to acknowledge receipt and prevent Twilio retries
    return new Response(
      JSON.stringify({ received: true, status: deliveryStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[twilio-status-callback] Error:", error);
    // Return 200 even on errors to prevent Twilio from retrying
    return new Response(
      JSON.stringify({ received: true, error: "Internal processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
