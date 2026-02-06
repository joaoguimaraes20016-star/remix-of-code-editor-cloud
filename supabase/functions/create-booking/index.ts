// supabase/functions/create-booking/index.ts
// Creates a native booking appointment.
// Handles: slot validation, round-robin assignment, Zoom meeting creation,
// Google Calendar sync, reminder scheduling, contact upsert, automation triggers.

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
    const {
      event_type_id,
      date,        // YYYY-MM-DD
      time,        // HH:mm (in the host's timezone / as selected by user)
      timezone,    // requester's timezone
      name,
      email,
      phone,
      intake_answers,
      funnel_lead_id,
    } = body;

    // Validate required fields
    if (!event_type_id || !date || !time || !name || !email) {
      return new Response(
        JSON.stringify({ error: "event_type_id, date, time, name, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Load event type
    const { data: eventType, error: etError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", event_type_id)
      .eq("is_active", true)
      .single();

    if (etError || !eventType) {
      return new Response(
        JSON.stringify({ error: "Event type not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      team_id,
      duration_minutes,
      round_robin_mode,
      round_robin_members,
      last_assigned_index,
      location_type,
      location_value,
      reminder_config,
    } = eventType;

    // 2. Convert selected time to UTC (needed for conflict checking)
    const slotLocalStr = `${date}T${time}:00`;
    const startAtUtc = convertToUTC(slotLocalStr, timezone || "America/New_York");

    if (!startAtUtc) {
      return new Response(
        JSON.stringify({ error: "Invalid date/time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Determine the host (assigned closer) and validate slot availability
    let assignedUserId: string | null = null;
    let assignedUserName: string | null = null;
    let assignedUserEmail: string | null = null;

    const dayStart = date + "T00:00:00Z";
    const dayEnd = date + "T23:59:59Z";
    const slotStartMs = startAtUtc.getTime();
    const slotEndMs = slotStartMs + duration_minutes * 60 * 1000;
    const bufferBeforeMs = (eventType.buffer_before_minutes || 0) * 60 * 1000;
    const bufferAfterMs = (eventType.buffer_after_minutes || 0) * 60 * 1000;
    const slotEffectiveStart = slotStartMs - bufferBeforeMs;
    const slotEffectiveEnd = slotEndMs + bufferAfterMs;

    if (round_robin_mode === "round_robin" && round_robin_members?.length > 0) {
      // Round-robin: pick next member
      const nextIndex = ((last_assigned_index || 0) + 1) % round_robin_members.length;
      assignedUserId = round_robin_members[nextIndex];

      // Validate slot availability for this host
      const { data: conflictingAppointments } = await supabase
        .from("appointments")
        .select("start_at_utc, duration_minutes")
        .eq("team_id", team_id)
        .or(`closer_id.eq.${assignedUserId},assigned_user_id.eq.${assignedUserId}`)
        .gte("start_at_utc", dayStart)
        .lte("start_at_utc", dayEnd)
        .not("status", "in", '("CANCELLED","RESCHEDULED")');

      for (const appt of conflictingAppointments || []) {
        const apptStart = new Date(appt.start_at_utc).getTime();
        const apptDuration = (appt.duration_minutes || 30) * 60 * 1000;
        const apptEnd = apptStart + apptDuration;

        if (slotEffectiveStart < apptEnd && slotEffectiveEnd > apptStart) {
          return new Response(
            JSON.stringify({ error: "This time slot is no longer available. Please select another time." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update the index
      await supabase
        .from("event_types")
        .update({ last_assigned_index: nextIndex })
        .eq("id", event_type_id);
    } else if (round_robin_mode === "availability_based" && round_robin_members?.length > 0) {
      // Availability-based: pick member with fewest bookings today, but also check slot availability
      let minBookings = Infinity;
      let candidateHosts: string[] = [];

      // First, find members with fewest bookings
      for (const memberId of round_robin_members) {
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team_id)
          .or(`closer_id.eq.${memberId},assigned_user_id.eq.${memberId}`)
          .gte("start_at_utc", dayStart)
          .lte("start_at_utc", dayEnd)
          .not("status", "in", '("CANCELLED","RESCHEDULED")');

        const bookingCount = count || 0;
        if (bookingCount < minBookings) {
          minBookings = bookingCount;
          candidateHosts = [memberId];
        } else if (bookingCount === minBookings) {
          candidateHosts.push(memberId);
        }
      }

      // Check slot availability for candidate hosts
      for (const memberId of candidateHosts) {
        const { data: conflictingAppointments } = await supabase
          .from("appointments")
          .select("start_at_utc, duration_minutes")
          .eq("team_id", team_id)
          .or(`closer_id.eq.${memberId},assigned_user_id.eq.${memberId}`)
          .gte("start_at_utc", dayStart)
          .lte("start_at_utc", dayEnd)
          .not("status", "in", '("CANCELLED","RESCHEDULED")');

        let hasConflict = false;
        for (const appt of conflictingAppointments || []) {
          const apptStart = new Date(appt.start_at_utc).getTime();
          const apptDuration = (appt.duration_minutes || 30) * 60 * 1000;
          const apptEnd = apptStart + apptDuration;

          if (slotEffectiveStart < apptEnd && slotEffectiveEnd > apptStart) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          assignedUserId = memberId;
          break;
        }
      }

      // If no available host found, return error
      if (!assignedUserId) {
        return new Response(
          JSON.stringify({ error: "This time slot is no longer available. Please select another time." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Single host: team owner/admin
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team_id)
        .in("role", ["owner", "admin"])
        .order("created_at", { ascending: true })
        .limit(1);

      if (members && members.length > 0) {
        assignedUserId = members[0].user_id;

        // Validate slot availability for this host
        const { data: conflictingAppointments } = await supabase
          .from("appointments")
          .select("start_at_utc, duration_minutes")
          .eq("team_id", team_id)
          .or(`closer_id.eq.${assignedUserId},assigned_user_id.eq.${assignedUserId}`)
          .gte("start_at_utc", dayStart)
          .lte("start_at_utc", dayEnd)
          .not("status", "in", '("CANCELLED","RESCHEDULED")');

        for (const appt of conflictingAppointments || []) {
          const apptStart = new Date(appt.start_at_utc).getTime();
          const apptDuration = (appt.duration_minutes || 30) * 60 * 1000;
          const apptEnd = apptStart + apptDuration;

          if (slotEffectiveStart < apptEnd && slotEffectiveEnd > apptStart) {
            return new Response(
              JSON.stringify({ error: "This time slot is no longer available. Please select another time." }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Get assigned user details
    if (assignedUserId) {
      const { data: member } = await supabase
        .from("team_members")
        .select("display_name, email")
        .eq("user_id", assignedUserId)
        .eq("team_id", team_id)
        .single();

      if (member) {
        assignedUserName = member.display_name || member.email;
        assignedUserEmail = member.email;
      }
    }

    // 4. Generate booking token for reschedule/cancel URLs
    const bookingToken = crypto.randomUUID();

    // 5. Create Zoom meeting if location type is zoom
    let meetingLink: string | null = location_value || null;

    if (location_type === "zoom") {
      meetingLink = await createZoomMeeting(supabase, team_id, {
        topic: `${eventType.name} with ${name}`,
        startTime: startAtUtc.toISOString(),
        duration: duration_minutes,
        timezone: timezone || "America/New_York",
      });
    }

    // 6. Create Google Calendar event if connected
    let googleCalendarEventId: string | null = null;

    if (assignedUserId) {
      const { data: gcalConn } = await supabase
        .from("google_calendar_connections")
        .select("*")
        .eq("user_id", assignedUserId)
        .eq("team_id", team_id)
        .eq("sync_enabled", true)
        .single();

      if (gcalConn) {
        const gcalResult = await createGoogleCalendarEvent(
          supabase,
          gcalConn,
          {
            summary: `${eventType.name} - ${name}`,
            startTime: startAtUtc.toISOString(),
            duration: duration_minutes,
            attendeeEmail: email,
            description: eventType.description || "",
            location: meetingLink || location_value || "",
            useGoogleMeet: location_type === "google_meet",
          }
        );

        if (gcalResult) {
          googleCalendarEventId = gcalResult.eventId;
          // Use Google Meet link if location is google_meet
          if (location_type === "google_meet" && gcalResult.meetLink) {
            meetingLink = gcalResult.meetLink;
          }
        }
      }
    }

    // 7. Compute end time
    const endAtUtc = new Date(startAtUtc.getTime() + duration_minutes * 60 * 1000);

    // 8. Build reschedule/cancel URLs
    const appUrl = Deno.env.get("APP_URL") || supabaseUrl.replace(".supabase.co", ".vercel.app");
    const rescheduleUrl = `${appUrl}/booking/${bookingToken}/manage`;
    const cancelUrl = `${appUrl}/booking/${bookingToken}/manage`;

    // 9. INSERT appointment
    const appointmentData = {
      team_id,
      source: "native",
      status: "NEW",
      pipeline_stage: "booked",
      lead_name: name,
      lead_email: email,
      lead_phone: phone || null,
      start_at_utc: startAtUtc.toISOString(),
      duration_minutes,
      appointment_type_id: event_type_id,
      event_type_id: event_type_id, // Add foreign key relationship
      event_type_name: eventType.name,
      closer_id: assignedUserId,
      closer_name: assignedUserName,
      assigned_user_id: assignedUserId,
      meeting_link: meetingLink,
      booking_token: bookingToken,
      booking_code: null,
      intake_answers: intake_answers || null,
      google_calendar_event_id: googleCalendarEventId,
      reschedule_url: rescheduleUrl,
      cancel_url: cancelUrl,
      cancellation_link: cancelUrl,
      appointment_timezone: timezone || "America/New_York",
      appointment_notes: intake_answers
        ? Object.entries(intake_answers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : null,
    };

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (insertError) {
      console.error("[create-booking] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create appointment", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Schedule reminders
    if (reminder_config && Array.isArray(reminder_config)) {
      const reminderRows = reminder_config
        .map((rc: { type: string; template: string; offset_hours: number }) => {
          const scheduledFor = new Date(
            startAtUtc.getTime() - (rc.offset_hours || 1) * 60 * 60 * 1000
          );
          // Only schedule if it's in the future
          if (scheduledFor.getTime() > Date.now()) {
            return {
              appointment_id: appointment.id,
              team_id,
              type: rc.type || "email",
              scheduled_for: scheduledFor.toISOString(),
              template: rc.template,
              status: "pending",
            };
          }
          return null;
        })
        .filter(Boolean);

      if (reminderRows.length > 0) {
        await supabase.from("booking_reminders").insert(reminderRows);
      }
    }

    // 11. Upsert contact
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("team_id", team_id)
      .eq("email", email)
      .single();

    if (existingContact) {
      await supabase
        .from("contacts")
        .update({
          full_name: name,
          phone: phone || undefined,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", existingContact.id);
    } else {
      await supabase.from("contacts").insert({
        team_id,
        full_name: name,
        email,
        phone: phone || null,
        source: "native_booking",
      });
    }

    // 12. Link to funnel lead if provided
    if (funnel_lead_id) {
      await supabase
        .from("funnel_leads")
        .update({ calendly_booked_at: new Date().toISOString() })
        .eq("id", funnel_lead_id);
    }

    // 13. Fire automation trigger (appointment_booked)
    try {
      await supabase.functions.invoke("automation-trigger", {
        body: {
          triggerType: "appointment_booked",
          teamId: team_id,
          eventPayload: {
            appointment: {
              id: appointment.id,
              start_at_utc: appointment.start_at_utc,
              duration_minutes,
              event_type_name: eventType.name,
              meeting_link: meetingLink,
              reschedule_url: rescheduleUrl,
              cancel_url: cancelUrl,
              closer_name: assignedUserName,
              status: "NEW",
            },
            lead: {
              name,
              email,
              phone: phone || null,
            },
          },
        },
      });
    } catch (autoErr) {
      // Don't fail the booking if automation trigger fails
      console.error("[create-booking] Automation trigger error:", autoErr);
    }

    // 15. Return confirmation
    return new Response(
      JSON.stringify({
        success: true,
        appointment: {
          id: appointment.id,
          start_at_utc: appointment.start_at_utc,
          duration_minutes,
          event_type_name: eventType.name,
          meeting_link: meetingLink,
          reschedule_url: rescheduleUrl,
          cancel_url: cancelUrl,
          booking_token: bookingToken,
          host_name: assignedUserName,
          host_email: assignedUserEmail,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[create-booking] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
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

/**
 * Create a Zoom meeting using the team's Zoom OAuth credentials
 */
async function createZoomMeeting(
  supabase: any,
  teamId: string,
  opts: { topic: string; startTime: string; duration: number; timezone: string }
): Promise<string | null> {
  try {
    const { data: integration } = await supabase
      .from("team_integrations")
      .select("config")
      .eq("team_id", teamId)
      .eq("integration_type", "zoom")
      .eq("is_connected", true)
      .single();

    if (!integration?.config?.access_token) return null;

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: opts.topic,
        type: 2, // Scheduled meeting
        start_time: opts.startTime,
        duration: opts.duration,
        timezone: opts.timezone,
        settings: {
          join_before_host: true,
          waiting_room: false,
        },
      }),
    });

    if (response.ok) {
      const meeting = await response.json();
      return meeting.join_url;
    }

    console.error("[create-booking] Zoom API error:", await response.text());
    return null;
  } catch (err) {
    console.error("[create-booking] Zoom meeting creation failed:", err);
    return null;
  }
}

/**
 * Create a Google Calendar event
 */
async function createGoogleCalendarEvent(
  supabase: any,
  gcalConn: any,
  opts: {
    summary: string;
    startTime: string;
    duration: number;
    attendeeEmail: string;
    description: string;
    location: string;
    useGoogleMeet: boolean;
  }
): Promise<{ eventId: string; meetLink?: string } | null> {
  try {
    let accessToken = gcalConn.access_token;

    // Refresh token if expired
    if (gcalConn.token_expires_at && new Date(gcalConn.token_expires_at) < new Date()) {
      const refreshed = await refreshGoogleToken(supabase, gcalConn);
      if (refreshed) {
        accessToken = refreshed;
      } else {
        return null;
      }
    }

    const endTime = new Date(new Date(opts.startTime).getTime() + opts.duration * 60 * 1000);

    const eventBody: any = {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startTime, timeZone: "UTC" },
      end: { dateTime: endTime.toISOString(), timeZone: "UTC" },
      attendees: [{ email: opts.attendeeEmail }],
      reminders: { useDefault: false },
    };

    if (opts.location) {
      eventBody.location = opts.location;
    }

    if (opts.useGoogleMeet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const calendarId = gcalConn.calendar_id || "primary";
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${opts.useGoogleMeet ? "?conferenceDataVersion=1" : ""}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });

    if (response.ok) {
      const event = await response.json();
      return {
        eventId: event.id,
        meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
      };
    }

    console.error("[create-booking] Google Calendar API error:", await response.text());
    return null;
  } catch (err) {
    console.error("[create-booking] Google Calendar event creation failed:", err);
    return null;
  }
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(supabase: any, gcalConn: any): Promise<string | null> {
  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret || !gcalConn.refresh_token) return null;

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
      // Update stored tokens
      await supabase
        .from("google_calendar_connections")
        .update({
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("id", gcalConn.id);

      return tokens.access_token;
    }

    return null;
  } catch {
    return null;
  }
}
