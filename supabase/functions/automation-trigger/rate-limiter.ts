// supabase/functions/automation-trigger/rate-limiter.ts

interface RateLimitConfig {
  maxPerHour: number;
  maxPerDay: number;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  currentHourCount?: number;
  currentDayCount?: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  sms: { maxPerHour: 100, maxPerDay: 1000 },
  email: { maxPerHour: 500, maxPerDay: 5000 },
  voice: { maxPerHour: 50, maxPerDay: 200 },
  webhook: { maxPerHour: 1000, maxPerDay: 10000 },
  whatsapp: { maxPerHour: 80, maxPerDay: 1000 },       // WhatsApp Business API Tier 1
  notification: { maxPerHour: 200, maxPerDay: 2000 },   // Internal notifications
  slack: { maxPerHour: 100, maxPerDay: 1000 },          // Slack Tier 3 limits
  discord: { maxPerHour: 100, maxPerDay: 1000 },        // Discord per-channel limits
  google_ads: { maxPerHour: 50, maxPerDay: 500 },       // Conservative for conversion API
  tiktok: { maxPerHour: 50, maxPerDay: 500 },           // Conservative for events API
  meta: { maxPerHour: 50, maxPerDay: 500 },             // Conservative for CAPI
  google_sheets: { maxPerHour: 100, maxPerDay: 1000 },  // Sheets API quota
};

/**
 * Check if a message can be sent based on rate limits.
 * Uses an atomic PostgreSQL RPC function to prevent race conditions
 * where concurrent requests could both pass the check before either increments.
 *
 * Fail-closed by default: denies execution when DB is unavailable.
 * Set RATE_LIMITER_FAIL_CLOSED=false env var to revert to fail-open behavior.
 */
export async function checkRateLimit(
  supabase: any,
  teamId: string,
  channel: string,
  automationId?: string,
): Promise<RateLimitResult> {
  // Allow runtime override via environment variable for emergency rollback
  const failClosed = Deno.env.get("RATE_LIMITER_FAIL_CLOSED") !== "false";

  try {
    const limits = DEFAULT_LIMITS[channel] || DEFAULT_LIMITS.email;

    const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
      p_team_id: teamId,
      p_channel: channel,
      p_automation_id: automationId ?? null,
      p_max_per_hour: limits.maxPerHour,
      p_max_per_day: limits.maxPerDay,
    });

    if (error) {
      console.error("[rate-limiter] RPC error:", error, { teamId, channel });
      if (failClosed) {
        return { allowed: false, reason: "Rate limiting unavailable - denying for safety" };
      }
      console.warn("[rate-limiter] Failing OPEN due to RATE_LIMITER_FAIL_CLOSED=false override");
      return { allowed: true, reason: "Rate limiter unavailable - fail-open override" };
    }

    if (!data) {
      console.error("[rate-limiter] RPC returned null data", { teamId, channel });
      if (failClosed) {
        return { allowed: false, reason: "Rate limit check returned no data" };
      }
      return { allowed: true, reason: "Rate limiter null data - fail-open override" };
    }

    return {
      allowed: data.allowed,
      reason: data.reason ?? undefined,
      currentHourCount: data.current_hour_count,
      currentDayCount: data.current_day_count,
    };
  } catch (err) {
    console.error("[rate-limiter] Exception:", err, { teamId, channel });
    if (failClosed) {
      return { allowed: false, reason: "Rate limiter exception - denying for safety" };
    }
    console.warn("[rate-limiter] Failing OPEN due to RATE_LIMITER_FAIL_CLOSED=false override");
    return { allowed: true, reason: "Rate limiter exception - fail-open override" };
  }
}

/**
 * Check business hours before executing an action
 */
export async function isWithinBusinessHours(
  supabase: any,
  teamId: string,
  timezone: string = "America/New_York",
): Promise<{ withinHours: boolean; nextOpenTime?: string }> {
  try {
    // Get team business hours
    const { data: hours, error } = await supabase
      .from("team_business_hours")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (error || !hours || hours.length === 0) {
      // No business hours configured = always open
      return { withinHours: true };
    }

    // Get current time in team's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const dayOfWeek = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentMinutes = hour * 60 + minute;

    // Find today's hours
    const todayHours = hours.find((h: any) => h.day_of_week.toLowerCase() === dayOfWeek);

    if (!todayHours) {
      return { withinHours: false, nextOpenTime: findNextOpenTime(hours, dayOfWeek!, timezone) };
    }

    const [openHour, openMinute] = todayHours.open_time.split(":").map(Number);
    const [closeHour, closeMinute] = todayHours.close_time.split(":").map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return { withinHours: true };
    }

    return { withinHours: false, nextOpenTime: findNextOpenTime(hours, dayOfWeek!, timezone) };
  } catch (err) {
    console.error("[rate-limiter] Business hours check failed:", err);
    return { withinHours: true }; // Fail open
  }
}

function findNextOpenTime(hours: any[], currentDay: string, timezone: string): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDayIndex = days.indexOf(currentDay.toLowerCase());

  for (let i = 0; i < 7; i++) {
    const checkDayIndex = (currentDayIndex + i) % 7;
    const checkDay = days[checkDayIndex];
    const dayHours = hours.find((h: any) => h.day_of_week.toLowerCase() === checkDay);

    if (dayHours) {
      // Calculate the actual date
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);
      const [openHour, openMinute] = dayHours.open_time.split(":").map(Number);
      targetDate.setHours(openHour, openMinute, 0, 0);

      if (targetDate > now) {
        return targetDate.toISOString();
      }
    }
  }

  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}
