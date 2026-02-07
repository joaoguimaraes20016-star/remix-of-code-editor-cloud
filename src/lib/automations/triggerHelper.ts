// src/lib/automations/triggerHelper.ts
import { supabase } from "@/integrations/supabase/client";
import type { TriggerType } from "./types";

export interface AutomationTriggerPayload {
  triggerType: TriggerType;
  teamId: string;
  eventPayload: {
    lead?: Record<string, any>;
    appointment?: Record<string, any>;
    payment?: Record<string, any>;
    deal?: Record<string, any>;
    meta?: Record<string, any>;
  };
}

export interface StepExecutionLog {
  stepId: string;
  actionType: string;
  channel?: string;
  provider?: string;
  templateVariables?: Record<string, any>;
  skipped: boolean;
  skipReason?: string;
}

export interface AutomationTriggerResponse {
  status: "ok" | "error";
  triggerType: TriggerType;
  automationsRun: string[];
  stepsExecuted: StepExecutionLog[];
  error?: string;
}

/**
 * Triggers automations for a specific event.
 * Call this from anywhere in the app when events occur.
 *
 * @example
 * // When a new lead is created
 * await runAutomationsForEvent({
 *   triggerType: 'lead_created',
 *   teamId: 'uuid-here',
 *   eventPayload: {
 *     lead: { id: '...', first_name: 'John', email: 'john@example.com' }
 *   }
 * });
 *
 * @example
 * // When an appointment is booked
 * await runAutomationsForEvent({
 *   triggerType: 'appointment_booked',
 *   teamId: 'uuid-here',
 *   eventPayload: {
 *     lead: { name: 'John Doe', email: 'john@example.com' },
 *     appointment: { id: '...', start_at_utc: '2025-01-15T10:00:00Z' }
 *   }
 * });
 */
export async function runAutomationsForEvent(
  payload: AutomationTriggerPayload
): Promise<AutomationTriggerResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("automation-trigger", {
      body: payload,
    });

    if (error) {
      console.error("[runAutomationsForEvent] Edge function error:", error);
      return {
        status: "error",
        triggerType: payload.triggerType,
        automationsRun: [],
        stepsExecuted: [],
        error: error.message,
      };
    }

    return data as AutomationTriggerResponse;
  } catch (err) {
    console.error("[runAutomationsForEvent] Unexpected error:", err);
    return {
      status: "error",
      triggerType: payload.triggerType,
      automationsRun: [],
      stepsExecuted: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Convenience helpers for common trigger types
 */
/**
 * Manually run a specific automation with optional contact/appointment context.
 * Used by the "Run Now" button in the automation editor and card menus.
 *
 * @param automationId - The automation to run
 * @param teamId - The team that owns the automation
 * @param contactId - Optional contact ID to run the automation against
 * @param appointmentId - Optional appointment ID for appointment-based context
 */
export async function runAutomationManually(
  automationId: string,
  teamId: string,
  contactId?: string,
  appointmentId?: string,
): Promise<{ success: boolean; automationsRun?: string[]; runId?: string; error?: string }> {
  try {
    // Build event payload with contact and/or appointment data
    const eventPayload: Record<string, any> = {
      meta: {
        manualRun: true,
        triggeredAt: new Date().toISOString(),
      },
    };

    // Fetch contact data if provided
    if (contactId) {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (contactError) {
        return { success: false, error: `Failed to fetch contact: ${contactError.message}` };
      }

      eventPayload.lead = contact;
    }

    // Fetch appointment data if provided
    if (appointmentId) {
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (apptError) {
        return { success: false, error: `Failed to fetch appointment: ${apptError.message}` };
      }

      eventPayload.appointment = appointment;
      eventPayload.deal = appointment;
    }

    // Call automation-trigger with the manual trigger type and specific automation ID
    const { data, error } = await supabase.functions.invoke("automation-trigger", {
      body: {
        triggerType: "manual_trigger" as TriggerType,
        teamId,
        eventPayload,
        automationId, // Target specific automation
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const response = data as AutomationTriggerResponse;
    return {
      success: response.status === "ok",
      automationsRun: response.automationsRun,
      error: response.error,
    };
  } catch (err) {
    console.error("[runAutomationManually] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export const AutomationTriggers = {
  /**
   * Trigger automations when a new lead is created
   */
  onLeadCreated: (teamId: string, lead: Record<string, any>) =>
    runAutomationsForEvent({
      triggerType: "lead_created",
      teamId,
      eventPayload: { lead },
    }),

  /**
   * Trigger automations when a tag is added to a lead
   */
  onLeadTagAdded: (teamId: string, lead: Record<string, any>, tag: string) =>
    runAutomationsForEvent({
      triggerType: "lead_tag_added",
      teamId,
      eventPayload: { lead, meta: { tag } },
    }),

  /**
   * Trigger automations when an appointment is booked
   */
  onAppointmentBooked: (
    teamId: string,
    appointment: Record<string, any>,
    lead?: Record<string, any>
  ) =>
    runAutomationsForEvent({
      triggerType: "appointment_booked",
      teamId,
      eventPayload: { appointment, lead },
    }),

  /**
   * Trigger automations when an appointment is rescheduled
   */
  onAppointmentRescheduled: (
    teamId: string,
    appointment: Record<string, any>,
    lead?: Record<string, any>
  ) =>
    runAutomationsForEvent({
      triggerType: "appointment_rescheduled",
      teamId,
      eventPayload: { appointment, lead },
    }),

  /**
   * Trigger automations when a no-show occurs
   */
  onAppointmentNoShow: (
    teamId: string,
    appointment: Record<string, any>,
    lead?: Record<string, any>
  ) =>
    runAutomationsForEvent({
      triggerType: "appointment_no_show",
      teamId,
      eventPayload: { appointment, lead },
    }),

  /**
   * Trigger automations when an appointment is completed
   */
  onAppointmentCompleted: (
    teamId: string,
    appointment: Record<string, any>,
    lead?: Record<string, any>
  ) =>
    runAutomationsForEvent({
      triggerType: "appointment_completed",
      teamId,
      eventPayload: { appointment, lead },
    }),

  /**
   * Trigger automations when a payment is received
   */
  onPaymentReceived: (
    teamId: string,
    payment: Record<string, any>,
    deal?: Record<string, any>
  ) =>
    runAutomationsForEvent({
      triggerType: "payment_received",
      teamId,
      eventPayload: { payment, deal },
    }),
};
