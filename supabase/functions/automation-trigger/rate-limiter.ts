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
};

/**
 * Check if a message can be sent based on rate limits
 */
export async function checkRateLimit(
  supabase: any,
  teamId: string,
  channel: string,
  automationId?: string,
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    // Get or create rate limit record
    let { data: limitRecord, error } = await supabase
      .from("automation_rate_limits")
      .select("*")
      .eq("team_id", teamId)
      .eq("channel", channel)
      .eq("automation_id", automationId ?? null)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[rate-limiter] Error fetching rate limit:", error);
      return { allowed: true }; // Fail open
    }

    const limits = DEFAULT_LIMITS[channel] || DEFAULT_LIMITS.email;

    if (!limitRecord) {
      // Create new record
      const { data: newRecord, error: insertError } = await supabase
        .from("automation_rate_limits")
        .insert([
          {
            team_id: teamId,
            channel,
            automation_id: automationId ?? null,
            max_per_hour: limits.maxPerHour,
            max_per_day: limits.maxPerDay,
            current_hour_count: 1,
            current_day_count: 1,
            hour_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
            day_reset_at: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("[rate-limiter] Error creating rate limit:", insertError);
        return { allowed: true };
      }

      return {
        allowed: true,
        currentHourCount: 1,
        currentDayCount: 1,
      };
    }

    // Check if counters need reset
    const hourResetAt = new Date(limitRecord.hour_reset_at);
    const dayResetAt = new Date(limitRecord.day_reset_at);

    let currentHourCount = limitRecord.current_hour_count || 0;
    let currentDayCount = limitRecord.current_day_count || 0;
    let needsUpdate = false;

    if (now >= hourResetAt) {
      currentHourCount = 0;
      needsUpdate = true;
    }

    if (now >= dayResetAt) {
      currentDayCount = 0;
      needsUpdate = true;
    }

    // Check limits
    const maxPerHour = limitRecord.max_per_hour || limits.maxPerHour;
    const maxPerDay = limitRecord.max_per_day || limits.maxPerDay;

    if (currentHourCount >= maxPerHour) {
      return {
        allowed: false,
        reason: `Hourly limit exceeded (${currentHourCount}/${maxPerHour})`,
        currentHourCount,
        currentDayCount,
      };
    }

    if (currentDayCount >= maxPerDay) {
      return {
        allowed: false,
        reason: `Daily limit exceeded (${currentDayCount}/${maxPerDay})`,
        currentHourCount,
        currentDayCount,
      };
    }

    // Increment counters
    const updateData: Record<string, any> = {
      current_hour_count: currentHourCount + 1,
      current_day_count: currentDayCount + 1,
      updated_at: now.toISOString(),
    };

    if (needsUpdate || now >= hourResetAt) {
      updateData.hour_reset_at = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }

    if (needsUpdate || now >= dayResetAt) {
      updateData.day_reset_at = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    await supabase.from("automation_rate_limits").update(updateData).eq("id", limitRecord.id);

    return {
      allowed: true,
      currentHourCount: currentHourCount + 1,
      currentDayCount: currentDayCount + 1,
    };
  } catch (err) {
    console.error("[rate-limiter] Exception:", err);
    return { allowed: true }; // Fail open
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
