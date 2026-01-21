// supabase/functions/make-call/index.ts
// Twilio Voice Provider Edge Function with wallet billing

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

interface MakeCallRequest {
  to: string;
  from?: string;
  teamId: string;
  automationId?: string;
  runId?: string;
  leadId?: string;
  appointmentId?: string;
  twiml?: string;
  url?: string;
  mode?: "immediate" | "dialer_queue";
  script?: string;
  estimatedMinutes?: number; // For upfront billing
  skipBilling?: boolean;
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
      estimatedMinutes,
      skipBilling,
    } = requestData;

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get voice pricing
    const pricing = await getChannelPrice(supabase, "voice");
    const costPerMinute = pricing?.unitPriceCents || 2.0; // Default to 2 cents per minute
    
    // Charge for estimated minutes (minimum 1 minute upfront)
    const minutesToCharge = estimatedMinutes || 1;
    const costCents = costPerMinute * minutesToCharge;

    // For dialer queue mode, just log to queue and return (no billing yet)
    if (mode === "dialer_queue") {
      try {
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
              estimatedCostCents: costCents,
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
            estimatedCostCents: costCents,
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

    // Deduct from wallet for immediate calls (unless skipped)
    let billingResult: { success: boolean; newBalanceCents: number; shouldAutoRecharge: boolean; error?: string } = { 
      success: true, newBalanceCents: 0, shouldAutoRecharge: false 
    };
    
    if (!skipBilling && teamId) {
      billingResult = await deductFromWallet(supabase, {
        teamId,
        amountCents: costCents,
        channel: "voice",
        referenceId: runId || undefined,
        description: `Voice call to ${to.slice(-4).padStart(to.length, '*')} (${minutesToCharge} min)`,
      });

      if (!billingResult.success) {
        console.error("[make-call] Billing failed:", billingResult.error);
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

        if (twiml) {
          formData.append("Twiml", twiml);
        } else if (url) {
          formData.append("Url", url);
        } else if (script) {
          const escapedScript = script.replace(/[<>&'"]/g, (c) => ({
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "'": "&apos;",
            '"': "&quot;",
          })[c] || c);
          formData.append("Twiml", `<Response><Say>${escapedScript}</Say></Response>`);
        } else {
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
          console.log("[make-call] Twilio call initiated:", { sid: result.sid, status: result.status, cost: costCents });
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
      console.log("[make-call] Stub mode - Call logged:", { to, cost: costCents });
    }

    // If call failed, refund the wallet
    if (status === "failed" && !skipBilling && teamId) {
      console.log("[make-call] Refunding failed call cost");
      await refundToWallet(supabase, {
        teamId,
        amountCents: costCents,
        channel: "voice",
        referenceId: callId,
        description: "Voice call failed - refund",
      });
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
            costCents,
            minutesCharged: minutesToCharge,
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
        costCents,
        minutesCharged: minutesToCharge,
        newBalanceCents: billingResult.newBalanceCents,
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
