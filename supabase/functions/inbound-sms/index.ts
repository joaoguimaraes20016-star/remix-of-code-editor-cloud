// supabase/functions/inbound-sms/index.ts
// Handles inbound SMS/WhatsApp messages from Twilio.
// Logs the message and fires the customer_replied trigger.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    // Twilio sends inbound messages as URL-encoded form data
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const numMedia = parseInt(formData.get("NumMedia") as string || "0", 10);
    const fromCity = formData.get("FromCity") as string | null;
    const fromState = formData.get("FromState") as string | null;
    const fromCountry = formData.get("FromCountry") as string | null;

    if (!from || !to) {
      console.error("[inbound-sms] Missing required fields");
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } },
      );
    }

    // Determine channel (SMS vs WhatsApp)
    const isWhatsApp = from.startsWith("whatsapp:") || to.startsWith("whatsapp:");
    const channel = isWhatsApp ? "whatsapp" : "sms";
    const senderPhone = from.replace("whatsapp:", "");
    const recipientPhone = to.replace("whatsapp:", "");

    console.log("[inbound-sms] Received:", {
      messageSid,
      from: senderPhone,
      to: recipientPhone,
      channel,
      bodyLength: body?.length || 0,
      numMedia,
    });

    // Find the team by matching the recipient phone number
    // First check team_phone_numbers table, then fallback to team_integrations
    let teamId: string | null = null;

    const { data: phoneMatch } = await supabase
      .from("team_phone_numbers")
      .select("team_id")
      .eq("phone_number", recipientPhone)
      .eq("is_active", true)
      .maybeSingle();

    if (phoneMatch) {
      teamId = phoneMatch.team_id;
    } else {
      // Fallback: look up by Twilio phone number in team_integrations
      const { data: integration } = await supabase
        .from("team_integrations")
        .select("team_id")
        .eq("provider", "twilio")
        .filter("settings->phone_number", "eq", recipientPhone)
        .maybeSingle();

      if (integration) {
        teamId = integration.team_id;
      }
    }

    if (!teamId) {
      console.warn("[inbound-sms] No team found for phone:", recipientPhone);
      // Return empty TwiML response
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } },
      );
    }

    // Find contact by sender phone number
    let leadContext: Record<string, any> = { phone: senderPhone };

    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name, first_name, last_name, email, phone, tags, custom_fields, owner_user_id")
      .eq("team_id", teamId)
      .eq("phone", senderPhone)
      .maybeSingle();

    if (contact) {
      leadContext = {
        id: contact.id,
        name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        tags: contact.tags || [],
        custom_fields: contact.custom_fields || {},
        owner_user_id: contact.owner_user_id,
      };
    }

    // Collect media URLs if present
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`) as string | null;
      if (mediaUrl) mediaUrls.push(mediaUrl);
    }

    // Log the inbound message
    try {
      await supabase.from("message_logs").insert({
        team_id: teamId,
        channel,
        provider: isWhatsApp ? "twilio_whatsapp" : "twilio",
        direction: "inbound",
        to_address: recipientPhone,
        from_address: senderPhone,
        payload: {
          messageSid,
          body: body || "",
          numMedia,
          mediaUrls,
          fromCity,
          fromState,
          fromCountry,
        },
        status: "received",
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
        provider_message_id: messageSid,
      });
    } catch (logErr) {
      console.error("[inbound-sms] Failed to log inbound message:", logErr);
    }

    // Fire customer_replied automation trigger
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        triggerType: "customer_replied",
        teamId,
        eventPayload: {
          lead: leadContext,
          meta: {
            channel,
            messageSid,
            messageBody: body || "",
            hasMedia: numMedia > 0,
            mediaUrls,
            senderPhone,
            recipientPhone,
            fromLocation: fromCity ? `${fromCity}, ${fromState}, ${fromCountry}` : null,
          },
        },
        eventId: `customer_replied:${messageSid}`,
      }),
    });

    console.log("[inbound-sms] Fired customer_replied trigger for team:", teamId);

    // Return empty TwiML response (no auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } },
    );
  } catch (error) {
    console.error("[inbound-sms] Error:", error);
    // Return empty TwiML to prevent Twilio errors
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } },
    );
  }
});
