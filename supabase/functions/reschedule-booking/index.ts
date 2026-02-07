// supabase/functions/reschedule-booking/index.ts
// Reschedules a native booking by booking_token.
// Creates a new appointment linked to the original, updates
// Google Calendar, Zoom, and fires automation trigger.
// Note: Reminders are handled via the automation system (GHL-style).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { booking_token, new_date, new_time, timezone } = body;

    if (!booking_token || !new_date || !new_time) {
      return new Response(
        JSON.stringify({ error: "booking_token, new_date, and new_time are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find original appointment
    const { data: original, error: findError } = await supabase
      .from("appointments")
      .select("*")
      .eq("booking_token", booking_token)
      .single();

    if (findError || !original) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (original.status === "CANCELLED" || original.status === "RESCHEDULED") {
      return new Response(
        JSON.stringify({ error: "Booking cannot be rescheduled (already cancelled or rescheduled)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Convert new time to UTC
    const tz = timezone || original.appointment_timezone || "America/New_York";
    const newSlotStr = `${new_date}T${new_time}:00`;
    const newStartUtc = convertToUTC(newSlotStr, tz);

    if (!newStartUtc) {
      return new Response(
        JSON.stringify({ error: "Invalid new date/time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Generate new booking token
    const newBookingToken = crypto.randomUUID();
    const appUrl = Deno.env.get("APP_URL") || supabaseUrl.replace(".supabase.co", ".vercel.app");
    const rescheduleUrl = `${appUrl}/booking/${newBookingToken}/manage`;
    const cancelUrl = `${appUrl}/booking/${newBookingToken}/manage`;

    // 4. Create new appointment (linked to original)
    const rescheduleCount = (original.reschedule_count || 0) + 1;

    const { data: newAppointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        team_id: original.team_id,
        source: "native",
        status: "NEW",
        pipeline_stage: original.pipeline_stage || "booked",
        lead_name: original.lead_name,
        lead_email: original.lead_email,
        lead_phone: original.lead_phone,
        start_at_utc: newStartUtc.toISOString(),
        duration_minutes: original.duration_minutes,
        appointment_type_id: original.appointment_type_id,
        event_type_name: original.event_type_name,
        closer_id: original.closer_id,
        closer_name: original.closer_name,
        assigned_user_id: original.assigned_user_id,
        meeting_link: original.meeting_link,
        booking_token: newBookingToken,
        intake_answers: original.intake_answers,
        appointment_timezone: tz,
        reschedule_url: rescheduleUrl,
        cancel_url: cancelUrl,
        cancellation_link: cancelUrl,
        original_appointment_id: original.id,
        reschedule_count: rescheduleCount,
        original_booking_date: original.original_booking_date || original.start_at_utc,
        rebooking_type: "reschedule",
        previous_status: original.status,
        setter_id: original.setter_id,
        setter_name: original.setter_name,
        appointment_notes: original.appointment_notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[reschedule-booking] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create rescheduled appointment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Update original appointment
    await supabase
      .from("appointments")
      .update({
        status: "RESCHEDULED",
        previous_status: original.status,
        rescheduled_to_appointment_id: newAppointment.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", original.id);

    // 6. Cancel any scheduled automation jobs for the old appointment
    // (prevents stale reminders from firing via the automation system)
    await supabase
      .from("scheduled_automation_jobs")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .contains("context_snapshot", { appointment: { id: original.id } });

    // 7. Update Google Calendar event if exists
    if (original.google_calendar_event_id && original.assigned_user_id) {
      try {
        const { data: gcalConn } = await supabase
          .from("google_calendar_connections")
          .select("*")
          .eq("user_id", original.assigned_user_id)
          .eq("team_id", original.team_id)
          .eq("sync_enabled", true)
          .single();

        if (gcalConn) {
          let accessToken = gcalConn.access_token;

          // Refresh if expired
          if (gcalConn.token_expires_at && new Date(gcalConn.token_expires_at) < new Date()) {
            const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
            const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
            if (clientId && clientSecret && gcalConn.refresh_token) {
              const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  client_id: clientId,
                  client_secret: clientSecret,
                  refresh_token: gcalConn.refresh_token,
                  grant_type: "refresh_token",
                }),
              });
              if (response.ok) {
                const tokens = await response.json();
                accessToken = tokens.access_token;
              }
            }
          }

          const endTime = new Date(newStartUtc.getTime() + (original.duration_minutes || 30) * 60 * 1000);
          const calendarId = gcalConn.calendar_id || "primary";

          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${original.google_calendar_event_id}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                start: { dateTime: newStartUtc.toISOString(), timeZone: "UTC" },
                end: { dateTime: endTime.toISOString(), timeZone: "UTC" },
              }),
            }
          );

          // Store the same event ID on the new appointment
          await supabase
            .from("appointments")
            .update({ google_calendar_event_id: original.google_calendar_event_id })
            .eq("id", newAppointment.id);
        }
      } catch (gcalErr) {
        console.error("[reschedule-booking] Google Calendar update error:", gcalErr);
      }
    }

    // 9. Fire automation trigger
    try {
      await supabase.functions.invoke("automation-trigger", {
        body: {
          triggerType: "appointment_rescheduled",
          teamId: original.team_id,
          eventPayload: {
            appointment: {
              id: newAppointment.id,
              start_at_utc: newStartUtc.toISOString(),
              duration_minutes: original.duration_minutes,
              event_type_name: original.event_type_name,
              meeting_link: original.meeting_link,
              reschedule_url: rescheduleUrl,
              cancel_url: cancelUrl,
              reschedule_count: rescheduleCount,
              original_appointment_id: original.id,
              status: "NEW",
            },
            lead: {
              name: original.lead_name,
              email: original.lead_email,
              phone: original.lead_phone,
            },
          },
        },
      });
    } catch (autoErr) {
      console.error("[reschedule-booking] Automation trigger error:", autoErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking rescheduled successfully",
        appointment: {
          id: newAppointment.id,
          start_at_utc: newStartUtc.toISOString(),
          duration_minutes: original.duration_minutes,
          event_type_name: original.event_type_name,
          meeting_link: original.meeting_link,
          reschedule_url: rescheduleUrl,
          cancel_url: cancelUrl,
          booking_token: newBookingToken,
          reschedule_count: rescheduleCount,
        },
        original_appointment_id: original.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[reschedule-booking] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Convert a local datetime string to UTC
 */
function convertToUTC(localDateStr: string, timezone: string): Date | null {
  try {
    const [datePart, timePart] = localDateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = (timePart || "00:00:00").split(":").map(Number);

    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(guess);
    const getPart = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

    const localInTz = new Date(
      Date.UTC(
        getPart("year"),
        getPart("month") - 1,
        getPart("day"),
        getPart("hour") === 24 ? 0 : getPart("hour"),
        getPart("minute"),
        getPart("second")
      )
    );

    const offsetMs = guess.getTime() - localInTz.getTime();
    return new Date(guess.getTime() + offsetMs);
  } catch {
    return null;
  }
}
