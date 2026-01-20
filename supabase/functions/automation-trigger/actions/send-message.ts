// supabase/functions/automation-trigger/actions/send-message.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";

interface SendMessageConfig {
  channel: "sms" | "email" | "voice";
  template?: string;
  body?: string;
  subject?: string;
  to?: string;
  fromName?: string;
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
  const provider = "stub"; // Will be replaced with real provider lookup

  // Resolve recipient
  let toAddress = config.to || "";
  if (!toAddress) {
    if (channel === "email") {
      toAddress = context.lead?.email || context.appointment?.lead_email || "";
    } else {
      toAddress = context.lead?.phone || context.appointment?.lead_phone || "";
    }
  }

  // Render template
  const renderedBody = renderTemplate(template, context);
  const messageId = `${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const log: StepExecutionLog = {
    channel,
    provider,
    to: toAddress,
    messageId,
    renderedBody,
    templateVariables: extractTemplateVariables(template, context),
    status: "success",
  };

  if (!toAddress) {
    log.status = "skipped";
    log.skipReason = `no_${channel === "email" ? "email" : "phone"}_address`;
    return log;
  }

  try {
    // Log to message_logs
    const { error } = await supabase.from("message_logs").insert([
      {
        team_id: context.teamId,
        automation_id: automationId,
        run_id: runId,
        channel,
        provider,
        to_address: toAddress,
        from_address: config.fromName || null,
        template,
        payload: {
          to: toAddress,
          body: renderedBody,
          subject: config.subject,
          templateVariables: log.templateVariables,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
        },
        status: "sent",
      },
    ]);

    if (error) {
      log.status = "error";
      log.error = error.message;
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

function renderTemplate(template: string, context: AutomationContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getFieldValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

function extractTemplateVariables(template: string, context: AutomationContext): Record<string, any> {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  const variables: Record<string, any> = {};
  for (const match of matches) {
    const path = match.replace(/\{\{|\}\}/g, "").trim();
    variables[path] = getFieldValue(context, path);
  }
  return variables;
}

function getFieldValue(context: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let value: any = context;
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
}
