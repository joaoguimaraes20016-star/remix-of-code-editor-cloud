// supabase/functions/automation-trigger/actions/appointment-actions.ts
// Appointment automation actions: book, update, cancel, create booking link, log call

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

type FlexibleConfig = Record<string, unknown>;

/**
 * Book an appointment by calling the create-booking edge function
 */
export async function executeBookAppointment(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Resolve lead info from context
    const leadEmail = context.lead?.email || context.appointment?.lead_email;
    const leadName = context.lead?.name || context.lead?.first_name || context.appointment?.lead_name;
    const leadPhone = context.lead?.phone || context.appointment?.lead_phone;

    if (!leadEmail && !leadPhone) {
      log.status = "skipped";
      log.skipReason = "no_contact_info_for_booking";
      return log;
    }

    // Build booking request
    const eventTypeId = config.calendarId as string || config.eventTypeId as string;
    const date = config.date as string;
    const time = config.time as string;
    const timezone = (config.timezone as string) || "America/New_York";
    const duration = Number(config.duration) || 30;
    const notes = config.notes ? renderTemplate(config.notes as string, context) : undefined;

    if (!eventTypeId) {
      log.status = "skipped";
      log.skipReason = "no_calendar_or_event_type_specified";
      return log;
    }

    if (!date || !time) {
      log.status = "skipped";
      log.skipReason = "no_date_or_time_specified";
      return log;
    }

    // Call the create-booking edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/create-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        event_type_id: eventTypeId,
        date,
        time,
        name: leadName || "Contact",
        email: leadEmail || "",
        phone: leadPhone || "",
        timezone,
        duration,
        notes,
      }),
    });

    const result = await response.json();

    if (response.ok && result.appointment) {
      log.status = "success";
      log.output = {
        appointmentId: result.appointment.id,
        startTime: result.appointment.start_at_utc,
        meetingLink: result.appointment.meeting_link,
      };
    } else {
      log.status = "error";
      log.error = result.error || "Failed to book appointment";
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Update an existing appointment's status, time, or notes
 */
export async function executeUpdateAppointment(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    // Get appointment ID from context (the triggering appointment)
    const appointmentId = context.appointment?.id;
    if (!appointmentId) {
      log.status = "skipped";
      log.skipReason = "no_appointment_in_context";
      return log;
    }

    const updates: Record<string, any> = {};

    if (config.status) {
      updates.status = (config.status as string).toUpperCase();
    }

    if (config.newTime) {
      updates.start_at_utc = config.newTime as string;
    }

    if (config.notes) {
      updates.notes = renderTemplate(config.notes as string, context);
    }

    if (Object.keys(updates).length === 0) {
      log.status = "skipped";
      log.skipReason = "no_fields_to_update";
      return log;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointmentId);

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { appointmentId, updatedFields: Object.keys(updates) };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Cancel an appointment via the cancel-booking edge function or direct update
 */
export async function executeCancelAppointment(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const appointmentId = context.appointment?.id;
    if (!appointmentId) {
      log.status = "skipped";
      log.skipReason = "no_appointment_in_context";
      return log;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Look up booking_token for the appointment
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("booking_token")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment?.booking_token) {
      // Fallback: directly update the appointment status if no booking_token
      const { error } = await supabase
        .from("appointments")
        .update({ status: "CANCELLED" })
        .eq("id", appointmentId);

      if (error) {
        log.status = "error";
        log.error = error.message;
      } else {
        log.status = "success";
        log.output = { appointmentId, cancelled: true, method: "direct_update" };
      }
      return log;
    }

    // Try to use the cancel-booking edge function for full cancellation flow
    // (includes Google Calendar sync, notifications, etc.)
    const response = await fetch(`${supabaseUrl}/functions/v1/cancel-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        booking_token: appointment.booking_token,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      log.status = "success";
      log.output = { appointmentId, cancelled: true, method: "edge_function" };
    } else {
      // Fallback: directly update the appointment status
      const { error } = await supabase
        .from("appointments")
        .update({ status: "CANCELLED" })
        .eq("id", appointmentId);

      if (error) {
        log.status = "error";
        log.error = error.message;
      } else {
        log.status = "success";
        log.output = { appointmentId, cancelled: true, method: "direct_update_fallback" };
      }
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Generate a booking link for a specific calendar/event type
 */
export async function executeCreateBookingLink(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const calendarId = config.calendarId as string;
    const customSlug = config.customSlug as string;
    const expiresIn = config.expiresIn as string || "never";
    const oneTimeUse = config.oneTimeUse as boolean || false;

    if (!calendarId) {
      log.status = "skipped";
      log.skipReason = "no_calendar_specified";
      return log;
    }

    // Generate a unique booking token
    const token = crypto.randomUUID();
    const slug = customSlug || `book-${token.substring(0, 8)}`;

    // Calculate expiration
    let expiresAt: string | null = null;
    if (expiresIn !== "never") {
      const now = new Date();
      const durationMap: Record<string, number> = {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "48h": 48 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };
      const ms = durationMap[expiresIn] || 0;
      if (ms > 0) {
        expiresAt = new Date(now.getTime() + ms).toISOString();
      }
    }

    // Build the booking URL using the app's domain
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    // Extract the project ref for building the booking URL
    const bookingUrl = `${supabaseUrl.replace('.supabase.co', '')}/book/${slug}?token=${token}&event=${calendarId}`;

    // Store the booking link in context for downstream steps
    log.output = {
      bookingUrl,
      token,
      slug,
      calendarId,
      expiresAt,
      oneTimeUse,
    };

    // Store in context so template variables can reference it
    (context as any).bookingLink = bookingUrl;

  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Log a call record to the appointments/activity table
 */
export async function executeLogCall(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  try {
    const leadId = context.lead?.id;
    if (!leadId) {
      log.status = "skipped";
      log.skipReason = "no_lead_in_context";
      return log;
    }

    const outcome = (config.outcome as string) || "answered";
    const direction = (config.direction as string) || "outbound";
    const duration = Number(config.duration) || 0;
    const notes = config.notes ? renderTemplate(config.notes as string, context) : undefined;

    // Log the call as an appointment/activity record
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        team_id: context.teamId,
        contact_id: leadId,
        lead_name: context.lead?.name || context.lead?.first_name || "Unknown",
        lead_email: context.lead?.email || "",
        lead_phone: context.lead?.phone || "",
        status: outcome === "answered" ? "COMPLETED" : "NO_SHOW",
        notes: `[Call Log] Direction: ${direction} | Outcome: ${outcome} | Duration: ${duration}s${notes ? `\n${notes}` : ""}`,
        start_at_utc: new Date().toISOString(),
        duration_minutes: Math.ceil(duration / 60),
      })
      .select("id")
      .single();

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = {
        callLogId: data?.id,
        outcome,
        direction,
        duration,
      };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}
