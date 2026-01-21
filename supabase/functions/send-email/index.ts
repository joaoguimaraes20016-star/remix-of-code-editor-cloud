// supabase/functions/send-email/index.ts
// Email Provider Edge Function with routing for Stackit Default (Resend) and Custom Domains (Mailgun)

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
  fromEmail?: string; // Custom domain email address
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

interface MailgunResponse {
  id?: string;
  message?: string;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function sendViaResend(payload: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.log("[send-email] Resend not configured, using stub mode");
    return {
      success: true,
      messageId: `stub_resend_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  });

  const result: ResendResponse = await response.json();

  if (response.ok && result.id) {
    return { success: true, messageId: result.id };
  } else {
    return { 
      success: false, 
      error: result.error?.message || `Resend error: ${response.status}`,
    };
  }
}

async function sendViaMailgun(
  domain: string,
  payload: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunBaseUrl = Deno.env.get("MAILGUN_BASE_URL") || "https://api.mailgun.net/v3";

  if (!mailgunApiKey) {
    console.log("[send-email] Mailgun not configured, using stub mode");
    return {
      success: true,
      messageId: `stub_mailgun_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  const formData = new URLSearchParams();
  formData.append("from", payload.from);
  formData.append("to", payload.to);
  formData.append("subject", payload.subject);
  formData.append("html", payload.html);
  formData.append("text", payload.text);
  if (payload.replyTo) {
    formData.append("h:Reply-To", payload.replyTo);
  }

  const response = await fetch(`${mailgunBaseUrl}/${domain}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const result: MailgunResponse = await response.json();

  if (response.ok && result.id) {
    return { success: true, messageId: result.id };
  } else {
    return {
      success: false,
      error: result.message || `Mailgun error: ${response.status}`,
    };
  }
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
      fromEmail,
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

    // Determine sending method: custom domain or Stackit default
    let useCustomDomain = false;
    let customDomain: string | null = null;
    let senderEmail = from || Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@send.stackitmail.com";
    const senderName = fromName || Deno.env.get("DEFAULT_FROM_NAME") || "Stackit";

    // Check if fromEmail specifies a custom domain
    if (fromEmail && fromEmail !== "default") {
      // Verify the domain is verified for this team
      const { data: domainRecord } = await supabase
        .from("team_sending_domains")
        .select("full_domain, status")
        .eq("team_id", teamId)
        .eq("full_domain", fromEmail)
        .eq("status", "verified")
        .single();

      if (domainRecord) {
        useCustomDomain = true;
        customDomain = domainRecord.full_domain;
        // Construct email address from fromEmail domain
        senderEmail = fromEmail.includes("@") ? fromEmail : `noreply@${fromEmail}`;
      }
    }

    const fullFrom = `${senderName} <${senderEmail}>`;
    const emailHtml = html || `<p>${body.replace(/\n/g, "<br/>")}</p>`;

    console.log(`[send-email] Sending via ${useCustomDomain ? `Mailgun (${customDomain})` : "Resend (default)"} to ${to}`);

    let result: { success: boolean; messageId?: string; error?: string };
    let provider: string;

    if (useCustomDomain && customDomain) {
      provider = "mailgun";
      result = await sendViaMailgun(customDomain, {
        to,
        from: fullFrom,
        subject,
        html: emailHtml,
        text: body,
        replyTo,
      });
    } else {
      provider = "resend";
      result = await sendViaResend({
        to,
        from: fullFrom,
        subject,
        html: emailHtml,
        text: body,
        replyTo,
      });
    }

    const status = result.success ? "sent" : "failed";
    const messageId = result.messageId || `failed_${Date.now()}`;

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
            customDomain: customDomain || null,
          },
          status,
          error_message: result.error || null,
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
        success: result.success,
        messageId,
        status,
        provider,
        customDomain,
        error: result.error,
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
