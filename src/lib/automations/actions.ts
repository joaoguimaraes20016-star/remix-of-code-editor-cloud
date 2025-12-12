// src/lib/automations/actions.ts
import type { AutomationActionConfig } from "./types";
import { dispatchMessage } from "../messaging/dispatcher";

interface RunActionParams {
  teamId: string;
  automationId: string;
  actionConfig: AutomationActionConfig;
  eventPayload: Record<string, any>;
}

/**
 * Takes a generic action config and does the thing.
 * Messaging is routed through the provider-agnostic dispatcher.
 */
export async function runAction({ teamId, automationId, actionConfig, eventPayload }: RunActionParams) {
  const { type, params } = actionConfig;

  try {
    switch (type) {
      case "send_message": {
        await dispatchMessage({
          teamId,
          channel: params.channel ?? "sms", // default to SMS
          toPhone: params.toPhone ?? eventPayload.lead?.phone ?? eventPayload.appointment?.phone,
          toEmail: params.toEmail ?? eventPayload.lead?.email ?? eventPayload.appointment?.email,
          subject: params.subject,
          text: params.text ?? "",
          html: params.html,
          metadata: {
            ...params.metadata,
            automationId,
            leadId: eventPayload.lead?.id,
            appointmentId: eventPayload.appointment?.id,
          },
        });

        console.log("[automations] send_message executed", {
          automationId,
          channel: params.channel ?? "sms",
        });

        break;
      }

      case "enqueue_dialer": {
        await dispatchMessage({
          teamId,
          channel: "voice",
          toPhone: params.toPhone ?? eventPayload.lead?.phone ?? eventPayload.appointment?.phone,
          text: params.script ?? "",
          metadata: {
            ...params.metadata,
            automationId,
            mode: "dialer_queue",
            leadId: eventPayload.lead?.id,
            appointmentId: eventPayload.appointment?.id,
          },
        });

        console.log("[automations] enqueue_dialer executed", {
          automationId,
        });

        break;
      }

      // These we’ll wire into tasks / tags / team notifications later
      case "add_task":
      case "add_tag":
      case "notify_team":
      case "custom_webhook":
        console.info("[automations] stub action type", type, params);
        break;

      default:
        console.warn("[automations] unknown action type", type);
    }
  } catch (error) {
    console.error("[automations] runAction failed", {
      automationId,
      type,
      error,
    });
  }
}
