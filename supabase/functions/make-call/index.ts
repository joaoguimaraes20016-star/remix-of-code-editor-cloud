// supabase/functions/make-call/index.ts
// Twilio Voice Provider Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MakeCallRequest {
  to: string;
  from?: string;
  teamId: string;
  automationId?: string;
  runId?: string;
  leadId?: string;
  appointmentId?: string;
  // TwiML or URL for call handling
  twiml?: string;
  url?: string;
  // For power dialer queue
  mode?: "immediate" | "dialer_queue";
  script?: string;
}

interface TwilioCallResponse {
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
    const requestData: MakeCallRequest = await req.json();
    const {
      to,
      from,
      teamId,
      automationId,
      runId,
      leadId,
      appointmentId,
      twiml,
      url,
      mode,
      script,
    } = requestData;

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // For dialer queue mode, just log to queue and return
    if (mode === "dialer_queue") {
      try {
        // Insert into a dialer queue (using message_logs for now)
        const { error: queueError } = await supabase.from("message_logs").insert([
          {
            team_id: teamId,
            automation_id: automationId || null,
            run_id: runId || null,
            channel: "voice",
            provider: "power_dialer",
            to_address: to,
            payload: {
              to,
              script,
              leadId,
              appointmentId,
              queuedAt: new Date().toISOString(),
            },
            status: "queued",
          },
        ]);

        if (queueError) {
          throw new Error(`Failed to queue call: ${queueError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: "queued",
            provider: "power_dialer",
            message: "Call added to dialer queue",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (queueErr) {
        console.error("[make-call] Queue error:", queueErr);
        return new Response(
          JSON.stringify({
            success: false,
            error: queueErr instanceof Error ? queueErr.message : "Queue failed",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromNumber = from || Deno.env.get("TWILIO_PHONE_NUMBER");

    const isTwilioConfigured = twilioAccountSid && twilioAuthToken && twilioFromNumber;

    let callId: string;
    let status: "initiated" | "queued" | "failed";
    let provider: string;
    let errorMessage: string | undefined;

    if (isTwilioConfigured) {
      provider = "twilio";

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
        const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

        const formData = new URLSearchParams();
        formData.append("To", to);
        formData.append("From", twilioFromNumber!);

        // Use TwiML or URL for call handling
        if (twiml) {
          formData.append("Twiml", twiml);
        } else if (url) {
          formData.append("Url", url);
        } else if (script) {
          // Generate simple TwiML from script
          const escapedScript = script.replace(/[<>&'"]/g, (c) => ({
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "'": "&apos;",
            '"': "&quot;",
          })[c] || c);
          formData.append("Twiml", `<Response><Say>${escapedScript}</Say></Response>`);
        } else {
          // Default: play a message
          formData.append("Twiml", "<Response><Say>Hello, this is an automated call.</Say></Response>");
        }

        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const result: TwilioCallResponse = await twilioResponse.json();

        if (twilioResponse.ok) {
          callId = result.sid;
          status = result.status === "queued" ? "queued" : "initiated";
          console.log("[make-call] Twilio call initiated:", { sid: result.sid, status: result.status });
        } else {
          callId = `failed_${Date.now()}`;
          status = "failed";
          errorMessage = result.error_message || `Twilio error: ${result.error_code}`;
          console.error("[make-call] Twilio error:", result);
        }
      } catch (twilioError) {
        callId = `failed_${Date.now()}`;
        status = "failed";
        errorMessage = twilioError instanceof Error ? twilioError.message : "Twilio request failed";
        console.error("[make-call] Twilio exception:", twilioError);
      }
    } else {
      // Stub mode
      provider = "stub";
      callId = `stub_call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      status = "initiated";
      console.log("[make-call] Stub mode - Call logged:", { to });
    }

    // Log to message_logs
    try {
      const { error: logError } = await supabase.from("message_logs").insert([
        {
          team_id: teamId,
          automation_id: automationId || null,
          run_id: runId || null,
          channel: "voice",
          provider,
          to_address: to,
          from_address: twilioFromNumber || null,
          payload: {
            to,
            script,
            leadId,
            appointmentId,
            hasTwiml: !!twiml,
            hasUrl: !!url,
          },
          status: status === "failed" ? "failed" : "sent",
          error_message: errorMessage || null,
          provider_message_id: callId,
        },
      ]);

      if (logError) {
        console.error("[make-call] Failed to log call:", logError);
      }
    } catch (logErr) {
      console.error("[make-call] Exception logging call:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: status !== "failed",
        callId,
        status,
        provider,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[make-call] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
