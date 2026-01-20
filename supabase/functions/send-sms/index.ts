// supabase/functions/send-sms/index.ts
// Twilio SMS Provider Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  to: string;
  body: string;
  from?: string;
  teamId: string;
  automationId?: string;
  runId?: string;
  leadId?: string;
  appointmentId?: string;
}

interface TwilioResponse {
  sid: string;
  status: string;
  error_code?: number;
  error_message?: string;
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
    const requestData: SendSmsRequest = await req.json();
    const { to, body, from, teamId, automationId, runId, leadId, appointmentId } = requestData;

    if (!to || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromNumber = from || Deno.env.get("TWILIO_PHONE_NUMBER");

    // Check if Twilio is configured
    const isTwilioConfigured = twilioAccountSid && twilioAuthToken && twilioFromNumber;

    let messageId: string;
    let status: "sent" | "failed" | "queued";
    let provider: string;
    let errorMessage: string | undefined;

    if (isTwilioConfigured) {
      // Real Twilio implementation
      provider = "twilio";

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const formData = new URLSearchParams();
        formData.append("To", to);
        formData.append("From", twilioFromNumber!);
        formData.append("Body", body);

        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const result: TwilioResponse = await twilioResponse.json();

        if (twilioResponse.ok) {
          messageId = result.sid;
          status = result.status === "queued" || result.status === "sent" ? "sent" : "queued";
          console.log("[send-sms] Twilio SMS sent:", { sid: result.sid, status: result.status });
        } else {
          messageId = `failed_${Date.now()}`;
          status = "failed";
          errorMessage = result.error_message || `Twilio error: ${result.error_code}`;
          console.error("[send-sms] Twilio error:", result);
        }
      } catch (twilioError) {
        messageId = `failed_${Date.now()}`;
        status = "failed";
        errorMessage = twilioError instanceof Error ? twilioError.message : "Twilio request failed";
        console.error("[send-sms] Twilio exception:", twilioError);
      }
    } else {
      // Stub mode - log only
      provider = "stub";
      messageId = `stub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      status = "sent";
      console.log("[send-sms] Stub mode - SMS logged:", { to, bodyLength: body.length });
    }

    // Log to message_logs
    try {
      const { error: logError } = await supabase.from("message_logs").insert([
        {
          team_id: teamId,
          automation_id: automationId || null,
          run_id: runId || null,
          channel: "sms",
          provider,
          to_address: to,
          from_address: from || twilioFromNumber || null,
          payload: {
            to,
            body,
            leadId,
            appointmentId,
          },
          status,
          error_message: errorMessage || null,
          provider_message_id: messageId,
        },
      ]);

      if (logError) {
        console.error("[send-sms] Failed to log message:", logError);
      }
    } catch (logErr) {
      console.error("[send-sms] Exception logging message:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: status !== "failed",
        messageId,
        status,
        provider,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-sms] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
