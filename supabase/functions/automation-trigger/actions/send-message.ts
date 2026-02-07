// supabase/functions/automation-trigger/actions/send-message.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate, extractTemplateVariables, getFieldValue } from "../template-engine.ts";

/**
 * Check if Twilio is configured (via environment variables)
 */
function isTwilioConfigured(): boolean {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const apiKeySid = Deno.env.get("TWILIO_API_KEY_SID");
  const apiKeySecret = Deno.env.get("TWILIO_API_KEY_SECRET");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  
  // Twilio is configured if we have account SID and either API keys or auth token
  return !!(accountSid && (apiKeySid && apiKeySecret || authToken));
}

interface SendMessageConfig {
  channel?: "sms" | "email" | "voice" | "whatsapp";
  template?: string;
  body?: string;
  subject?: string;
  to?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  mediaUrl?: string;
  [key: string]: unknown;
}

export async function executeSendMessage(
  config: SendMessageConfig,
  context: AutomationContext,
  supabase: any,
  runId: string | null,
  automationId: string,
): Promise<StepExecutionLog> {
  const channel = config.channel || "sms";
  const template = config.template || config.body || "";

  // Resolve recipient
  let toAddress = config.to || "";
  if (!toAddress) {
    if (channel === "email") {
      toAddress = context.lead?.email || context.appointment?.lead_email || "";
    } else {
      toAddress = context.lead?.phone || context.appointment?.lead_phone || "";
    }
  }

  if (!toAddress) {
    return {
      status: "skipped",
      skipReason: `no_${channel === "email" ? "email" : "phone"}_address`,
    };
  }

  // Render template
  const renderedBody = renderTemplate(template, context);
  const renderedSubject = config.subject ? renderTemplate(config.subject, context) : undefined;

  const log: StepExecutionLog = {
    channel,
    to: toAddress,
    renderedBody,
    templateVariables: extractTemplateVariables(template, context),
    status: "pending",
  };

  try {
    // Check integration configuration before calling edge functions
    if (channel === "sms" || channel === "whatsapp" || channel === "voice") {
      if (!isTwilioConfigured()) {
        log.status = "skipped";
        log.skipReason = "twilio_not_configured";
        return log;
      }
    }
    // Note: Email channel uses Resend/Mailgun which may be configured via env vars or team settings
    // We don't check email integration here as it's more complex and edge function handles stub mode

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let endpoint: string;
    let payload: Record<string, any>;

    switch (channel) {
      case "sms":
        endpoint = `${supabaseUrl}/functions/v1/send-sms`;
        payload = {
          to: toAddress,
          body: renderedBody,
          teamId: context.teamId,
          automationId,
          runId,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
        };
        break;

      case "email":
        endpoint = `${supabaseUrl}/functions/v1/send-email`;
        payload = {
          to: toAddress,
          subject: renderedSubject || "Notification",
          body: renderedBody,
          fromName: config.fromName,
          fromEmail: config.fromEmail,
          replyTo: config.replyTo,
          teamId: context.teamId,
          automationId,
          runId,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
          template: config.template,
        };
        break;

      case "voice":
        endpoint = `${supabaseUrl}/functions/v1/make-call`;
        payload = {
          to: toAddress,
          script: renderedBody,
          teamId: context.teamId,
          automationId,
          runId,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
        };
        break;

      case "whatsapp":
        endpoint = `${supabaseUrl}/functions/v1/send-whatsapp`;
        payload = {
          to: toAddress,
          body: renderedBody,
          mediaUrl: config.mediaUrl,
          teamId: context.teamId,
          automationId,
          runId,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
        };
        break;

      default:
        log.status = "error";
        log.error = `Unknown channel: ${channel}`;
        return log;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      log.status = "success";
      log.provider = result.provider;
      log.messageId = result.messageId || result.callId;
    } else {
      log.status = "error";
      log.error = result.error || "Unknown error";
      log.provider = result.provider;
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// renderTemplate, extractTemplateVariables, getFieldValue imported from ../template-engine.ts
