// supabase/functions/send-sms/index.ts
// Twilio SMS Provider Edge Function with Credits System

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
  skipCreditCheck?: boolean; // For system messages
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

// Get Twilio auth credentials - supports both API Keys and Auth Token
function getTwilioCredentials() {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const apiKeySid = Deno.env.get("TWILIO_API_KEY_SID");
  const apiKeySecret = Deno.env.get("TWILIO_API_KEY_SECRET");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  // Prefer API Keys over Auth Token
  if (accountSid && apiKeySid && apiKeySecret) {
    return {
      accountSid,
      credentials: btoa(`${apiKeySid}:${apiKeySecret}`),
      authMethod: "api_key" as const,
    };
  }
  
  // Fallback to Auth Token
  if (accountSid && authToken) {
    return {
      accountSid,
      credentials: btoa(`${accountSid}:${authToken}`),
      authMethod: "auth_token" as const,
    };
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const requestData: SendSmsRequest = await req.json();
    const { to, body, from, teamId, automationId, runId, leadId, appointmentId, skipCreditCheck } = requestData;

    if (!to || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!teamId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // DND enforcement: check if contact has opted out of SMS
    try {
      const { data: dndContact } = await supabase
        .from("contacts")
        .select("dnd_sms")
        .eq("team_id", teamId)
        .eq("phone", to)
        .limit(1)
        .maybeSingle();

      if (dndContact?.dnd_sms === true) {
        console.log(`[send-sms] DND: Contact ${to} has opted out of SMS communications`);
        return new Response(
          JSON.stringify({ success: false, error: "Contact has opted out of SMS (DND)", code: "DND_SMS" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } catch (dndErr) {
      // Non-fatal: if DND check fails, allow the message through (fail-open for DND)
      console.warn("[send-sms] DND check failed, proceeding:", dndErr);
    }

    // Get team's phone number or use provided 'from'
    let fromNumber = from;
    if (!fromNumber) {
      // Try to get team's default phone number
      const { data: teamPhone } = await supabase
        .from("team_phone_numbers")
        .select("phone_number")
        .eq("team_id", teamId)
        .eq("is_default", true)
        .eq("is_active", true)
        .single();
      
      if (teamPhone) {
        fromNumber = teamPhone.phone_number;
      } else {
        // Fallback to legacy env var
        fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      }
    }

    // Check credits (unless skipped for system messages)
    if (!skipCreditCheck) {
      const { data: creditResult, error: creditError } = await supabase.rpc("deduct_credits", {
        p_team_id: teamId,
        p_channel: "sms",
        p_amount: 1,
        p_description: `SMS to ${to.slice(-4).padStart(to.length, "*")}`,
      });

      if (creditError) {
        console.error("[send-sms] Credit deduction error:", creditError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to check credits",
            code: "CREDIT_ERROR"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!creditResult?.success) {
        console.log("[send-sms] Insufficient credits:", creditResult);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: creditResult?.error || "Insufficient SMS credits",
            code: "INSUFFICIENT_CREDITS",
            currentBalance: creditResult?.current_balance,
            required: creditResult?.required || 1
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Get Twilio credentials
    const twilioAuth = getTwilioCredentials();
    const isTwilioConfigured = twilioAuth && fromNumber;

    let messageId: string;
    let status: "sent" | "failed" | "queued";
    let provider: string;
    let errorMessage: string | undefined;

    if (isTwilioConfigured) {
      provider = `twilio_${twilioAuth.authMethod}`;

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAuth.accountSid}/Messages.json`;

        const formData = new URLSearchParams();
        formData.append("To", to);
        formData.append("From", fromNumber!);
        formData.append("Body", body);

        // Add status callback URL for delivery tracking
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        if (supabaseUrl) {
          formData.append("StatusCallback", `${supabaseUrl}/functions/v1/twilio-status-callback`);
        }

        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${twilioAuth.credentials}`,
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
          
          // Refund credit on failure (if we charged)
          if (!skipCreditCheck) {
            await supabase.rpc("add_credits", {
              p_team_id: teamId,
              p_channel: "sms",
              p_amount: 1,
              p_transaction_type: "refund",
              p_description: `Refund: SMS to ${to.slice(-4).padStart(to.length, "*")} failed`,
            });
          }
        }
      } catch (twilioError) {
        messageId = `failed_${Date.now()}`;
        status = "failed";
        errorMessage = twilioError instanceof Error ? twilioError.message : "Twilio request failed";
        console.error("[send-sms] Twilio exception:", twilioError);
        
        // Refund credit on exception
        if (!skipCreditCheck) {
          await supabase.rpc("add_credits", {
            p_team_id: teamId,
            p_channel: "sms",
            p_amount: 1,
            p_transaction_type: "refund",
            p_description: `Refund: SMS failed`,
          });
        }
      }
    } else {
      // Stub mode - log only (no credit charge in stub mode)
      provider = "stub";
      messageId = `stub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      status = "sent";
      console.log("[send-sms] Stub mode - SMS logged:", { to, bodyLength: body.length });
      
      // Refund if we charged in stub mode
      if (!skipCreditCheck) {
        await supabase.rpc("add_credits", {
          p_team_id: teamId,
          p_channel: "sms",
          p_amount: 1,
          p_transaction_type: "refund",
          p_description: "Refund: Stub mode",
        });
      }
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
          from_address: fromNumber || null,
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
