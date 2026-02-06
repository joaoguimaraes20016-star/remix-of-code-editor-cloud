// supabase/functions/get-available-slots/index.ts
// Returns available booking time slots for a given event type and date range.
// Public endpoint (no auth required) — used by booking pages and funnel embeds.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface TimeSlot {
  time: string; // HH:mm in requester's timezone
  utc: string;  // ISO 8601 UTC
  available: boolean;
}

interface AvailabilityWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const eventTypeId = url.searchParams.get("event_type_id");
    const dateStr = url.searchParams.get("date"); // YYYY-MM-DD
    const timezone = url.searchParams.get("timezone") || "America/New_York";

    if (!eventTypeId || !dateStr) {
      return new Response(
        JSON.stringify({ error: "event_type_id and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate date format
    const dateMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!dateMatch) {
      return new Response(
        JSON.stringify({ error: "date must be in YYYY-MM-DD format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Load event type
    const { data: eventType, error: eventTypeError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", eventTypeId)
      .eq("is_active", true)
      .single();

    if (eventTypeError || !eventType) {
      return new Response(
        JSON.stringify({ error: "Event type not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      team_id,
      duration_minutes,
      buffer_before_minutes,
      buffer_after_minutes,
      min_notice_hours,
      max_advance_days,
      max_bookings_per_day,
      round_robin_mode,
      round_robin_members,
    } = eventType;

    // 2. Determine which hosts to check
    let hostUserIds: string[] = [];

    if (round_robin_mode !== "none" && round_robin_members?.length > 0) {
      hostUserIds = round_robin_members;
    } else {
      // Get team owner/admin as the default host
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, role")
        .eq("team_id", team_id)
        .in("role", ["owner", "admin"])
        .order("created_at", { ascending: true })
        .limit(1);

      if (members && members.length > 0) {
        hostUserIds = [members[0].user_id];
      }
    }

    if (hostUserIds.length === 0) {
      return new Response(
        JSON.stringify({ date: dateStr, slots: [], event_type: eventType }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse the requested date
    const requestedDate = new Date(dateStr + "T00:00:00Z");
    const now = new Date();

    // Check max advance days
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + (max_advance_days || 60));
    if (requestedDate > maxDate) {
      return new Response(
        JSON.stringify({ date: dateStr, slots: [], event_type: eventType, reason: "beyond_max_advance" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get day of week for the requested date (0=Sun, 6=Sat)
    const dayOfWeek = requestedDate.getUTCDay();

    // 4. Load availability schedules for all hosts on this day
    const { data: schedules } = await supabase
      .from("availability_schedules")
      .select("*")
      .eq("team_id", team_id)
      .in("user_id", hostUserIds)
      .eq("day_of_week", dayOfWeek);

    // 5. Load availability overrides for this date
    const { data: overrides } = await supabase
      .from("availability_overrides")
      .select("*")
      .eq("team_id", team_id)
      .in("user_id", hostUserIds)
      .eq("date", dateStr);

    // 6. Load existing appointments for this date (to subtract booked slots)
    const dayStart = dateStr + "T00:00:00Z";
    const dayEnd = dateStr + "T23:59:59Z";

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("start_at_utc, duration_minutes, closer_id, assigned_user_id, status")
      .eq("team_id", team_id)
      .gte("start_at_utc", dayStart)
      .lte("start_at_utc", dayEnd)
      .not("status", "in", '("CANCELLED","RESCHEDULED")');

    // 7. Check daily booking count against max
    if (max_bookings_per_day) {
      const todayBookings = (existingAppointments || []).filter(
        a => a.status !== "CANCELLED" && a.status !== "RESCHEDULED"
      ).length;
      if (todayBookings >= max_bookings_per_day) {
        return new Response(
          JSON.stringify({ date: dateStr, slots: [], event_type: eventType, reason: "max_bookings_reached" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 8. Calculate available slots for each host, then take the union
    const allAvailableSlots = new Map<string, TimeSlot>();
    const debugInfo: any = {
      hostsChecked: hostUserIds,
      availabilityFound: false,
      reason: null,
      hostDetails: [],
    };

    for (const userId of hostUserIds) {
      // Get this user's schedule for the day
      const userSchedule = (schedules || []).find(
        s => s.user_id === userId
      );
      const userOverride = (overrides || []).find(
        o => o.user_id === userId
      );

      // Determine availability windows
      let windows: AvailabilityWindow[] = [];
      let usingDefaults = false;

      if (userOverride) {
        // Override takes precedence
        if (userOverride.is_available && userOverride.start_time && userOverride.end_time) {
          windows = [{ start: userOverride.start_time, end: userOverride.end_time }];
        }
        // If is_available is false, windows stays empty (day off)
      } else if (userSchedule) {
        if (userSchedule.is_available) {
          windows = [{ start: userSchedule.start_time, end: userSchedule.end_time }];
        }
      } else {
        // No schedule exists - use default availability (9am-5pm Mon-Fri)
        // Only apply defaults for weekdays (Mon-Fri = 1-5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          windows = [{ start: "09:00", end: "17:00" }];
          usingDefaults = true;
          console.warn(`[get-available-slots] No availability schedule for user ${userId} on day ${dayOfWeek}, using default 9am-5pm`);
        }
      }

      if (windows.length === 0) {
        debugInfo.hostDetails.push({
          userId,
          hasSchedule: !!userSchedule,
          hasOverride: !!userOverride,
          dayOfWeek,
          reason: dayOfWeek === 0 || dayOfWeek === 6 ? "Weekend (no default)" : "No availability configured",
        });
        continue;
      }

      debugInfo.availabilityFound = true;

      // Get this user's existing appointments
      const userAppointments = (existingAppointments || []).filter(
        a => a.closer_id === userId || a.assigned_user_id === userId
      );

      // Load Google Calendar busy times for this user
      let googleBusyTimes: Array<{ start: Date; end: Date }> = [];
      try {
        const { data: gcalConn } = await supabase
          .from("google_calendar_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("team_id", team_id)
          .eq("sync_enabled", true)
          .single();

        if (gcalConn) {
          const busyTimes = await fetchGoogleBusyTimes(supabase, gcalConn, dayStart, dayEnd);
          googleBusyTimes = busyTimes || [];
        }
      } catch (err) {
        console.error(`[get-available-slots] Error fetching Google Calendar busy times for user ${userId}:`, err);
      }

      // Determine the user's timezone
      const userTimezone = userSchedule?.timezone || userOverride?.timezone || "America/New_York";

      // Generate candidate slots
      for (const window of windows) {
        const [startHour, startMin] = window.start.split(":").map(Number);
        const [endHour, endMin] = window.end.split(":").map(Number);

        // Convert schedule times to UTC for the requested date
        // Create dates in the user's timezone perspective
        const windowStartMinutes = startHour * 60 + startMin;
        const windowEndMinutes = endHour * 60 + endMin;

        // Generate slots in 15-minute increments
        for (let slotStart = windowStartMinutes; slotStart + duration_minutes <= windowEndMinutes; slotStart += 15) {
          const slotHour = Math.floor(slotStart / 60);
          const slotMinute = slotStart % 60;
          const slotTimeStr = `${String(slotHour).padStart(2, "0")}:${String(slotMinute).padStart(2, "0")}`;

          // Create UTC timestamp for this slot
          // We work in the host's timezone for schedule, then convert to UTC
          const slotDateStr = `${dateStr}T${slotTimeStr}:00`;

          // Use Intl to properly convert from host timezone to UTC
          const slotUtc = convertToUTC(slotDateStr, userTimezone);
          if (!slotUtc) continue;

          // Check min notice
          const minNoticeMs = (min_notice_hours || 1) * 60 * 60 * 1000;
          if (slotUtc.getTime() - now.getTime() < minNoticeMs) {
            continue;
          }

          // Check against existing appointments (with buffers)
          const slotStartMs = slotUtc.getTime();
          const slotEndMs = slotStartMs + duration_minutes * 60 * 1000;
          const bufferBeforeMs = (buffer_before_minutes || 0) * 60 * 1000;
          const bufferAfterMs = (buffer_after_minutes || 0) * 60 * 1000;

          let conflicted = false;
          
          // Check database appointments
          for (const appt of userAppointments) {
            const apptStart = new Date(appt.start_at_utc).getTime();
            const apptDuration = (appt.duration_minutes || 30) * 60 * 1000;
            const apptEnd = apptStart + apptDuration;

            // Check overlap including buffers
            const slotEffectiveStart = slotStartMs - bufferBeforeMs;
            const slotEffectiveEnd = slotEndMs + bufferAfterMs;

            if (slotEffectiveStart < apptEnd && slotEffectiveEnd > apptStart) {
              conflicted = true;
              break;
            }
          }

          // Check Google Calendar busy times
          if (!conflicted && googleBusyTimes.length > 0) {
            for (const busy of googleBusyTimes) {
              const busyStart = busy.start.getTime();
              const busyEnd = busy.end.getTime();
              const slotEffectiveStart = slotStartMs - bufferBeforeMs;
              const slotEffectiveEnd = slotEndMs + bufferAfterMs;

              if (slotEffectiveStart < busyEnd && slotEffectiveEnd > busyStart) {
                conflicted = true;
                break;
              }
            }
          }

          if (!conflicted) {
            // Convert slot time to requester's timezone for display
            const displayTime = convertToTimezone(slotUtc, timezone);

            const slotKey = slotUtc.toISOString();
            if (!allAvailableSlots.has(slotKey)) {
              allAvailableSlots.set(slotKey, {
                time: displayTime,
                utc: slotUtc.toISOString(),
                available: true,
              });
            }
          }
        }
      }
    }

    // Sort slots by UTC time
    const slots = Array.from(allAvailableSlots.values()).sort(
      (a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime()
    );

    // Add debug info if no slots found
    if (slots.length === 0 && !debugInfo.reason) {
      if (!debugInfo.availabilityFound) {
        debugInfo.reason = "No availability schedules configured for hosts";
      } else {
        debugInfo.reason = "All slots are booked or blocked";
      }
    }

    return new Response(
      JSON.stringify({
        date: dateStr,
        timezone,
        slots,
        event_type: {
          id: eventType.id,
          name: eventType.name,
          slug: eventType.slug,
          description: eventType.description,
          duration_minutes: eventType.duration_minutes,
          location_type: eventType.location_type,
          color: eventType.color,
        },
        ...(slots.length === 0 ? { debug: debugInfo } : {}),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[get-available-slots] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Convert a local datetime string (YYYY-MM-DDTHH:mm:ss) in a given timezone to UTC.
 */
function convertToUTC(localDateStr: string, timezone: string): Date | null {
  try {
    // Parse the local time components
    const [datePart, timePart] = localDateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = (timePart || "00:00:00").split(":").map(Number);

    // Create a date and use Intl to find the offset
    // We use a binary search approach to find the UTC time that corresponds
    // to the given local time in the target timezone
    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));

    // Get the offset by formatting in the target timezone
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

    // The offset is the difference between the guess and what the guess looks like in the timezone
    const offsetMs = guess.getTime() - localInTz.getTime();

    // The actual UTC time is the local time + offset
    const utcTime = new Date(guess.getTime() + offsetMs);

    return utcTime;
  } catch {
    return null;
  }
}

/**
 * Convert a UTC Date to a HH:mm string in the target timezone.
 */
function convertToTimezone(utcDate: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(utcDate);
  } catch {
    // Fallback to UTC
    return utcDate.toISOString().slice(11, 16);
  }
}

/**
 * Fetch Google Calendar busy times using FreeBusy API
 */
async function fetchGoogleBusyTimes(
  supabase: any,
  gcalConn: any,
  timeMin: string,
  timeMax: string
): Promise<Array<{ start: Date; end: Date }> | null> {
  try {
    let accessToken = gcalConn.access_token;

    // Refresh token if expired
    if (gcalConn.token_expires_at && new Date(gcalConn.token_expires_at) < new Date()) {
      const refreshed = await refreshGoogleToken(supabase, gcalConn);
      if (refreshed) {
        accessToken = refreshed;
      } else {
        console.error("[get-available-slots] Failed to refresh Google token");
        return null;
      }
    }

    // Use busy_calendars array, or default to primary
    const calendarsToCheck = gcalConn.busy_calendars && gcalConn.busy_calendars.length > 0
      ? gcalConn.busy_calendars
      : ["primary"];

    const freeBusyItems = calendarsToCheck.map((calId: string) => ({ id: calId }));

    const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: freeBusyItems,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[get-available-slots] FreeBusy API error:", errorText);
      return null;
    }

    const data = await response.json();
    const busyTimes: Array<{ start: Date; end: Date }> = [];

    // Aggregate busy times from all calendars
    for (const calId of calendarsToCheck) {
      const cal = data.calendars?.[calId];
      if (cal?.busy) {
        for (const busy of cal.busy) {
          busyTimes.push({
            start: new Date(busy.start),
            end: new Date(busy.end),
          });
        }
      }
    }

    return busyTimes;
  } catch (err) {
    console.error("[get-available-slots] Error fetching FreeBusy:", err);
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
