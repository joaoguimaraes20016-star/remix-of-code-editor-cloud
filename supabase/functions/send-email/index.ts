// supabase/functions/send-email/index.ts
// Resend Email Provider Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  teamId: string;
  automationId?: string;
  runId?: string;
  leadId?: string;
  appointmentId?: string;
  template?: string;
}

interface ResendResponse {
  id?: string;
  error?: {
    message: string;
    statusCode: number;
  };
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
    const requestData: SendEmailRequest = await req.json();
    const {
      to,
      subject,
      body,
      html,
      from,
      fromName,
      replyTo,
      teamId,
      automationId,
      runId,
      leadId,
      appointmentId,
      template,
    } = requestData;

    if (!to || !subject || (!body && !html)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, body/html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const defaultFromEmail = Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@notifications.stackit.app";
    const defaultFromName = Deno.env.get("DEFAULT_FROM_NAME") || "Stackit";

    // Check if Resend is configured
    const isResendConfigured = !!resendApiKey;

    let messageId: string;
    let status: "sent" | "failed" | "queued";
    let provider: string;
    let errorMessage: string | undefined;

    const fromAddress = from || defaultFromEmail;
    const senderName = fromName || defaultFromName;
    const fullFrom = `${senderName} <${fromAddress}>`;

    if (isResendConfigured) {
      // Real Resend implementation
      provider = "resend";

      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fullFrom,
            to: [to],
            subject,
            html: html || `<p>${body.replace(/\n/g, "<br/>")}</p>`,
            text: body,
            reply_to: replyTo,
          }),
        });

        const result: ResendResponse = await resendResponse.json();

        if (resendResponse.ok && result.id) {
          messageId = result.id;
          status = "sent";
          console.log("[send-email] Resend email sent:", { id: result.id, to });
        } else {
          messageId = `failed_${Date.now()}`;
          status = "failed";
          errorMessage = result.error?.message || `Resend error: ${resendResponse.status}`;
          console.error("[send-email] Resend error:", result);
        }
      } catch (resendError) {
        messageId = `failed_${Date.now()}`;
        status = "failed";
        errorMessage = resendError instanceof Error ? resendError.message : "Resend request failed";
        console.error("[send-email] Resend exception:", resendError);
      }
    } else {
      // Stub mode - log only
      provider = "stub";
      messageId = `stub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      status = "sent";
      console.log("[send-email] Stub mode - Email logged:", { to, subject });
    }

    // Log to message_logs
    try {
      const { error: logError } = await supabase.from("message_logs").insert([
        {
          team_id: teamId,
          automation_id: automationId || null,
          run_id: runId || null,
          channel: "email",
          provider,
          to_address: to,
          from_address: fullFrom,
          template: template || null,
          payload: {
            to,
            subject,
            bodyLength: body?.length || 0,
            hasHtml: !!html,
            leadId,
            appointmentId,
            replyTo,
          },
          status,
          error_message: errorMessage || null,
          provider_message_id: messageId,
        },
      ]);

      if (logError) {
        console.error("[send-email] Failed to log message:", logError);
      }
    } catch (logErr) {
      console.error("[send-email] Exception logging message:", logErr);
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
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
