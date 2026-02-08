// supabase/functions/send-whatsapp/index.ts
// Twilio WhatsApp Provider Edge Function with wallet billing

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getChannelPrice, 
  deductFromWallet, 
  refundToWallet, 
  triggerAutoRechargeIfNeeded 
} from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  to: string;
  body: string;
  mediaUrl?: string;
  teamId: string;
  automationId?: string;
  runId?: string;
  leadId?: string;
  appointmentId?: string;
  skipBilling?: boolean;
}

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
    const requestData: SendWhatsAppRequest = await req.json();
    const { to, body, mediaUrl, teamId, automationId, runId, leadId, appointmentId, skipBilling } = requestData;

    if (!to || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // DND enforcement: check if contact has opted out of SMS/WhatsApp
    // WhatsApp uses dnd_sms since WhatsApp is an SMS channel variant
    if (teamId) {
      try {
        // Normalize WhatsApp number - strip "whatsapp:" prefix for lookup
        const lookupPhone = to.replace(/^whatsapp:/, '');
        const { data: dndContact } = await supabase
          .from("contacts")
          .select("dnd_sms")
          .eq("team_id", teamId)
          .eq("phone", lookupPhone)
          .limit(1)
          .maybeSingle();

        if (dndContact?.dnd_sms === true) {
          console.log(`[send-whatsapp] DND: Contact ${to} has opted out of SMS/WhatsApp communications`);
          return new Response(
            JSON.stringify({ success: false, error: "Contact has opted out of SMS/WhatsApp (DND)", code: "DND_WHATSAPP" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch (dndErr) {
        // Non-fatal: if DND check fails, allow the message through (fail-open for DND)
        console.warn("[send-whatsapp] DND check failed, proceeding:", dndErr);
      }
    }

    // Get WhatsApp pricing
    const pricing = await getChannelPrice(supabase, "whatsapp");
    const costCents = pricing?.unitPriceCents || 0.8; // Default to 0.8 cents if not found

    // Deduct from wallet (unless skipped)
    let billingResult: { success: boolean; newBalanceCents: number; shouldAutoRecharge: boolean; error?: string } = { 
      success: true, newBalanceCents: 0, shouldAutoRecharge: false 
    };
    
    if (!skipBilling && teamId) {
      billingResult = await deductFromWallet(supabase, {
        teamId,
        amountCents: costCents,
        channel: "whatsapp",
        referenceId: runId || undefined,
        description: `WhatsApp to ${to.slice(-4).padStart(to.length, '*')}`,
      });

      if (!billingResult.success) {
        console.error("[send-whatsapp] Billing failed:", billingResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: billingResult.error || "Insufficient wallet balance",
            code: "INSUFFICIENT_BALANCE",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    const isTwilioConfigured = twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber;

    let messageId: string = `failed_${Date.now()}`;
    let status: "sent" | "failed" | "queued" = "failed";
    let provider: string;
    let errorMessage: string | undefined;

    // Format phone numbers for WhatsApp
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const formattedFrom = twilioWhatsAppNumber?.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    // Use try-finally to ensure refund happens on ALL failure paths,
    // including unexpected exceptions before status is set to "failed"
    try {
      if (isTwilioConfigured) {
        provider = "twilio_whatsapp";

        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

          const formData = new URLSearchParams();
          formData.append("To", formattedTo);
          formData.append("From", formattedFrom);
          formData.append("Body", body);

          if (mediaUrl) {
            formData.append("MediaUrl", mediaUrl);
          }

          // Add status callback URL for delivery tracking
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          if (supabaseUrl) {
            formData.append("StatusCallback", `${supabaseUrl}/functions/v1/twilio-status-callback`);
          }

          const twilioResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          const result = await twilioResponse.json();

          if (twilioResponse.ok) {
            messageId = result.sid;
            status = result.status === "queued" || result.status === "sent" ? "sent" : "queued";
            console.log("[send-whatsapp] WhatsApp message sent:", { sid: result.sid, cost: costCents });
          } else {
            messageId = `failed_${Date.now()}`;
            status = "failed";
            errorMessage = result.message || `Twilio error: ${result.code}`;
            console.error("[send-whatsapp] Twilio error:", result);
          }
        } catch (twilioError) {
          messageId = `failed_${Date.now()}`;
          status = "failed";
          errorMessage = twilioError instanceof Error ? twilioError.message : "Twilio request failed";
          console.error("[send-whatsapp] Twilio exception:", twilioError);
        }
      } else {
        // Stub mode
        provider = "stub";
        messageId = `stub_wa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        status = "sent";
        console.log("[send-whatsapp] Stub mode - WhatsApp logged:", { to, bodyLength: body.length, cost: costCents });
      }
    } finally {
      // Refund on ANY failure path - covers both explicit failures and
      // unexpected exceptions that occur before status can be set
      if (status === "failed" && !skipBilling && teamId) {
        console.log("[send-whatsapp] Refunding failed message cost");
        try {
          await refundToWallet(supabase, {
            teamId,
            amountCents: costCents,
            channel: "whatsapp",
            referenceId: messageId,
            description: "WhatsApp send failed - refund",
          });
        } catch (refundErr) {
          console.error("[send-whatsapp] Refund failed:", refundErr);
        }
      }
    }

    // Trigger auto-recharge if needed
    if (billingResult.shouldAutoRecharge && teamId) {
      triggerAutoRechargeIfNeeded(teamId, true);
    }

    // Log to message_logs
    try {
      const { error: logError } = await supabase.from("message_logs").insert([
        {
          team_id: teamId,
          automation_id: automationId || null,
          run_id: runId || null,
          channel: "whatsapp",
          provider,
          to_address: to,
          from_address: twilioWhatsAppNumber || null,
          payload: {
            to,
            body,
            hasMedia: !!mediaUrl,
            leadId,
            appointmentId,
            costCents,
          },
          status,
          error_message: errorMessage || null,
          provider_message_id: messageId,
        },
      ]);

      if (logError) {
        console.error("[send-whatsapp] Failed to log message:", logError);
      }
    } catch (logErr) {
      console.error("[send-whatsapp] Exception logging message:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: status !== "failed",
        messageId,
        status,
        provider,
        costCents,
        newBalanceCents: billingResult.newBalanceCents,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-whatsapp] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
