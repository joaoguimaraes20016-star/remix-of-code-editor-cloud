// supabase/functions/automation-trigger/actions/time-delay.ts

import type { AutomationContext, AutomationStep } from "../types.ts";

interface TimeDelayConfig {
  duration?: number;
  unit?: "minutes" | "hours" | "days";
  onlyDuringBusinessHours?: boolean;
  skipWeekends?: boolean;
  [key: string]: unknown;
}

interface WaitUntilConfig {
  waitType?: 'specific_date' | 'field_date' | 'event' | 'before_appointment';
  specificDate?: string;
  specificTime?: string;
  dateField?: string;
  offsetDays?: number;
  offsetHours?: number; // For before_appointment mode
  offsetDirection?: 'before' | 'after';
  eventType?: string;
  timeoutHours?: number;
  timeoutAction?: 'continue' | 'stop' | 'branch';
  mode?: 'before_appointment'; // Alternative config format
  hours_before?: number; // For before_appointment mode
  appointment_field?: string; // Field path to appointment start time
  [key: string]: unknown;
}

interface BusinessHoursConfig {
  useTeamHours?: boolean;
  timezone?: string;
  [key: string]: unknown;
}

// Default business hours (can be overridden by team settings)
const DEFAULT_BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17,  // 5 PM
  days: [1, 2, 3, 4, 5], // Monday-Friday
};

/**
 * Check if a given date is within business hours
 */
function isWithinBusinessHours(date: Date, businessHours = DEFAULT_BUSINESS_HOURS): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  
  const isBusinessDay = businessHours.days.includes(day);
  const isBusinessHour = hour >= businessHours.start && hour < businessHours.end;
  
  return isBusinessDay && isBusinessHour;
}

/**
 * Get the next business hours start time
 */
function getNextBusinessHoursStart(from: Date, businessHours = DEFAULT_BUSINESS_HOURS): Date {
  const result = new Date(from);
  
  // If currently in business hours, return now
  if (isWithinBusinessHours(result, businessHours)) {
    return result;
  }
  
  // Move to next business hours start
  for (let i = 0; i < 8; i++) { // Max 8 days to find next business day
    const day = result.getDay();
    const hour = result.getHours();
    
    // If it's a business day
    if (businessHours.days.includes(day)) {
      // If before business hours, set to start time
      if (hour < businessHours.start) {
        result.setHours(businessHours.start, 0, 0, 0);
        return result;
      }
    }
    
    // Move to next day at business hours start
    result.setDate(result.getDate() + 1);
    result.setHours(businessHours.start, 0, 0, 0);
    
    if (businessHours.days.includes(result.getDay())) {
      return result;
    }
  }
  
  return result;
}

/**
 * Calculate resume time accounting for business hours and weekends
 */
function calculateResumeTime(
  duration: number,
  unit: string,
  options: { onlyDuringBusinessHours?: boolean; skipWeekends?: boolean } = {}
): Date {
  const now = new Date();
  let resumeAt: Date;

  // Calculate base resume time
  switch (unit) {
    case "minutes":
      resumeAt = new Date(now.getTime() + duration * 60 * 1000);
      break;
    case "hours":
      resumeAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
      break;
    case "days":
      if (options.skipWeekends) {
        // Skip weekends when counting days
        resumeAt = new Date(now);
        let daysToAdd = duration;
        while (daysToAdd > 0) {
          resumeAt.setDate(resumeAt.getDate() + 1);
          const day = resumeAt.getDay();
          if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
            daysToAdd--;
          }
        }
      } else {
        resumeAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      }
      break;
    default:
      resumeAt = new Date(now.getTime() + duration * 60 * 1000);
  }

  // Adjust to next business hours if required
  if (options.onlyDuringBusinessHours && !isWithinBusinessHours(resumeAt)) {
    resumeAt = getNextBusinessHoursStart(resumeAt);
  }

  return resumeAt;
}

/**
 * Schedules remaining steps to run after the delay.
 * Returns the scheduled job ID or null if scheduling failed.
 */
export async function executeTimeDelay(
  config: TimeDelayConfig,
  context: AutomationContext,
  supabase: any,
  automationId: string,
  runId: string | null,
  currentStepId: string,
  remainingSteps: AutomationStep[],
): Promise<{ scheduled: boolean; resumeAt: string; jobId?: string; error?: string }> {
  const duration = config.duration || 5;
  const unit = config.unit || "minutes";

  // Calculate resume time with business hours support
  const resumeAt = calculateResumeTime(duration, unit, {
    onlyDuringBusinessHours: config.onlyDuringBusinessHours,
    skipWeekends: config.skipWeekends,
  });

  try {
    // Insert scheduled job
    const { data, error } = await supabase
      .from("scheduled_automation_jobs")
      .insert([
        {
          team_id: context.teamId,
          automation_id: automationId,
          run_id: runId,
          step_id: currentStepId,
          resume_at: resumeAt.toISOString(),
          status: "pending",
          context_snapshot: {
            ...context,
            remainingSteps: remainingSteps.map((s) => s.id),
          },
        },
      ])
      .select("id")
      .single();

    if (error) {
      return {
        scheduled: false,
        resumeAt: resumeAt.toISOString(),
        error: error.message,
      };
    }

    return {
      scheduled: true,
      resumeAt: resumeAt.toISOString(),
      jobId: data?.id,
    };
  } catch (err) {
    return {
      scheduled: false,
      resumeAt: resumeAt.toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Execute wait_until action - supports specific date, field date, and event waiting
 */
export async function executeWaitUntil(
  config: WaitUntilConfig,
  context: AutomationContext,
  supabase: any,
  automationId: string,
  runId: string | null,
  currentStepId: string,
  remainingSteps: AutomationStep[],
): Promise<{ scheduled: boolean; resumeAt: string; waitingForEvent?: string; jobId?: string; error?: string }> {
  const now = new Date();
  let resumeAt: Date;
  let waitingForEvent: string | undefined;

  // Support both waitType and mode config formats
  const waitType = config.waitType || (config.mode === 'before_appointment' ? 'before_appointment' : config.waitType);
  
  switch (waitType) {
    case 'specific_date': {
      // Wait until a specific date/time
      const dateStr = config.specificDate || new Date().toISOString().split('T')[0];
      const timeStr = config.specificTime || '09:00';
      resumeAt = new Date(`${dateStr}T${timeStr}:00`);
      
      // If date is in the past, continue immediately
      if (resumeAt <= now) {
        return { scheduled: false, resumeAt: now.toISOString() };
      }
      break;
    }
    
    case 'field_date': {
      // Wait until a date from a field (with optional offset)
      const fieldPath = config.dateField || '';
      let fieldValue: any = null;
      
      // Parse field path to get value from context
      const [entity, field] = fieldPath.split('.');
      if (entity && field && (context as any)[entity]) {
        fieldValue = (context as any)[entity][field];
      }
      
      if (!fieldValue) {
        return { scheduled: false, resumeAt: now.toISOString(), error: 'Date field not found' };
      }
      
      resumeAt = new Date(fieldValue);
      
      // Apply offset
      const offsetDays = config.offsetDays || 0;
      if (config.offsetDirection === 'before') {
        resumeAt.setDate(resumeAt.getDate() - offsetDays);
      } else {
        resumeAt.setDate(resumeAt.getDate() + offsetDays);
      }
      
      // If date is in the past, continue immediately
      if (resumeAt <= now) {
        return { scheduled: false, resumeAt: now.toISOString() };
      }
      break;
    }
    
    case 'event': {
      // Wait for an event to occur - use timeout as resume time
      const timeoutHours = config.timeoutHours || 24;
      resumeAt = new Date(now.getTime() + timeoutHours * 60 * 60 * 1000);
      waitingForEvent = config.eventType;
      break;
    }
    
    default:
      return { scheduled: false, resumeAt: now.toISOString(), error: 'Invalid wait type' };
  }

  try {
    // Insert scheduled job
    const { data, error } = await supabase
      .from("scheduled_automation_jobs")
      .insert([
        {
          team_id: context.teamId,
          automation_id: automationId,
          run_id: runId,
          step_id: currentStepId,
          resume_at: resumeAt.toISOString(),
          status: waitingForEvent ? "waiting_for_event" : "pending",
          context_snapshot: {
            ...context,
            remainingSteps: remainingSteps.map((s) => s.id),
            waitingForEvent,
            timeoutAction: config.timeoutAction || 'continue',
          },
        },
      ])
      .select("id")
      .single();

    if (error) {
      return {
        scheduled: false,
        resumeAt: resumeAt.toISOString(),
        error: error.message,
      };
    }

    return {
      scheduled: true,
      resumeAt: resumeAt.toISOString(),
      waitingForEvent,
      jobId: data?.id,
    };
  } catch (err) {
    return {
      scheduled: false,
      resumeAt: resumeAt.toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Execute business_hours action - pauses until business hours
 */
export async function executeBusinessHours(
  config: BusinessHoursConfig,
  context: AutomationContext,
  supabase: any,
  automationId: string,
  runId: string | null,
  currentStepId: string,
  remainingSteps: AutomationStep[],
): Promise<{ scheduled: boolean; resumeAt: string; jobId?: string; error?: string }> {
  const now = new Date();
  
  // Check if currently within business hours
  if (isWithinBusinessHours(now)) {
    // Already in business hours, no need to schedule
    return { scheduled: false, resumeAt: now.toISOString() };
  }

  // Get next business hours start
  const resumeAt = getNextBusinessHoursStart(now);

  try {
    const { data, error } = await supabase
      .from("scheduled_automation_jobs")
      .insert([
        {
          team_id: context.teamId,
          automation_id: automationId,
          run_id: runId,
          step_id: currentStepId,
          resume_at: resumeAt.toISOString(),
          status: "pending",
          context_snapshot: {
            ...context,
            remainingSteps: remainingSteps.map((s) => s.id),
          },
        },
      ])
      .select("id")
      .single();

    if (error) {
      return {
        scheduled: false,
        resumeAt: resumeAt.toISOString(),
        error: error.message,
      };
    }

    return {
      scheduled: true,
      resumeAt: resumeAt.toISOString(),
      jobId: data?.id,
    };
  } catch (err) {
    return {
      scheduled: false,
      resumeAt: resumeAt.toISOString(),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Calculate next resume time for wait_until action (legacy support)
 */
export function calculateWaitUntilTime(config: { type?: string; value?: string; [key: string]: unknown }): Date {
  const now = new Date();

  switch (config.type) {
    case "specific_time": {
      // value is HH:MM format
      const value = config.value || "09:00";
      const [hours, minutes] = value.split(":").map(Number);
      const target = new Date(now);
      target.setHours(hours, minutes, 0, 0);
      // If time already passed today, schedule for tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      return target;
    }
    case "day_of_week": {
      // value is 0-6 (Sunday = 0)
      const value = config.value || "1";
      const targetDay = parseInt(value, 10);
      const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
      const target = new Date(now);
      target.setDate(target.getDate() + daysUntil);
      target.setHours(9, 0, 0, 0); // Default to 9 AM
      return target;
    }
    case "field_value": {
      // value is a path to a date field - handled elsewhere with context
      return now;
    }
    default:
      return now;
  }
}