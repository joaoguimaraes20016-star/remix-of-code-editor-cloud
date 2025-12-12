// src/lib/automations/engine.ts
import { type AutomationDefinition, type AutomationCondition, type TriggerType } from "./types";
import { runAction } from "./actions";

interface RunAutomationsParams {
  teamId: string;
  triggerType: TriggerType;
  eventPayload: Record<string, any>;
}

/**
 * Call this whenever something happens
 * (lead created, appointment booked, payment received, etc.).
 */
export async function runAutomationsForTrigger({ teamId, triggerType, eventPayload }: RunAutomationsParams) {
  try {
    const automations = await fetchAutomationsForTeamAndTrigger(teamId, triggerType);

    if (!automations.length) {
      console.info("[automations] no automations for trigger", {
        teamId,
        triggerType,
      });
      return;
    }

    for (const automation of automations) {
      if (!automation.isActive) continue;

      const passed = evaluateConditions(automation.conditions, eventPayload ?? {});
      if (!passed) continue;

      for (const action of automation.actions) {
        await runAction({
          teamId,
          automationId: automation.id,
          actionConfig: action,
          eventPayload,
        });
      }
    }
  } catch (error) {
    console.error("[automations] runAutomationsForTrigger failed", {
      teamId,
      triggerType,
      error,
    });
  }
}

/**
 * TEMP: dev-only hard-coded automation so we can verify the engine.
 * Later this will load from Supabase.
 */
async function fetchAutomationsForTeamAndTrigger(
  teamId: string,
  triggerType: TriggerType,
): Promise<AutomationDefinition[]> {
  // Dev test automation: runs whenever triggerType === 'appointment_booked'
  if (triggerType === "appointment_booked") {
    const devAutomation: AutomationDefinition = {
      id: "dev-test-appointment-booked",
      teamId,
      name: "Dev Test – Appointment booked",
      isActive: true,
      triggerType,
      triggerConfig: {},
      conditions: [], // no conditions = always runs
      actions: [
        {
          type: "send_message",
          params: {
            channel: "sms",
            text: "Dev test: appointment_booked automation fired.",
          },
        },
      ],
    };

    return [devAutomation];
  }

  console.warn("[automations] fetchAutomationsForTeamAndTrigger not implemented yet", { teamId, triggerType });
  return [];
}

function evaluateConditions(conditions: AutomationCondition[], payload: Record<string, any>): boolean {
  if (!conditions.length) return true;

  return conditions.every((cond) => {
    const value = get(payload, cond.field);

    switch (cond.operator) {
      case "equals":
        return value === cond.value;
      case "not_equals":
        return value !== cond.value;
      case "contains":
        return typeof value === "string" && String(value).includes(String(cond.value));
      case "gt":
        return Number(value) > Number(cond.value);
      case "lt":
        return Number(value) < Number(cond.value);
      case "in":
        return Array.isArray(cond.value) && cond.value.includes(value);
      default:
        return false;
    }
  });
}

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}
