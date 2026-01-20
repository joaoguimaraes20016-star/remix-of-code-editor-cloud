// supabase/functions/automation-trigger/actions/time-delay.ts

import type { AutomationContext, AutomationStep } from "../types.ts";

interface TimeDelayConfig {
  duration: number;
  unit: "minutes" | "hours" | "days";
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

  // Calculate resume time
  const now = new Date();
  let resumeAt: Date;

  switch (unit) {
    case "minutes":
      resumeAt = new Date(now.getTime() + duration * 60 * 1000);
      break;
    case "hours":
      resumeAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
      break;
    case "days":
      resumeAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      break;
    default:
      resumeAt = new Date(now.getTime() + duration * 60 * 1000);
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
 * Calculate next resume time for wait_until action
 */
export function calculateWaitUntilTime(config: { type: string; value: string }): Date {
  const now = new Date();

  switch (config.type) {
    case "specific_time": {
      // value is HH:MM format
      const [hours, minutes] = config.value.split(":").map(Number);
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
      const targetDay = parseInt(config.value, 10);
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
