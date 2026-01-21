// supabase/functions/automation-trigger/enrollment.ts
// Enrollment tracking and goal evaluation for automations

import type { AutomationContext } from "./types.ts";

interface EnrollmentCheckResult {
  shouldRun: boolean;
  reason?: string;
  existingEnrollmentId?: string;
}

interface GoalCheckResult {
  goalMet: boolean;
  goal?: {
    id: string;
    name: string;
    exitOnGoal: boolean;
    goToStepId?: string;
  };
}

/**
 * Check if contact is already enrolled in automation and create enrollment if not
 */
export async function checkAndCreateEnrollment(
  supabase: any,
  automationId: string,
  teamId: string,
  context: AutomationContext,
): Promise<EnrollmentCheckResult> {
  // Determine the contact identifier (contact_id or appointment_id)
  const contactId = context.lead?.id || null;
  const appointmentId = context.appointment?.id || null;
  
  // If no identifier, allow the run (no enrollment tracking possible)
  if (!contactId && !appointmentId) {
    console.log("[Enrollment] No contact or appointment ID, skipping enrollment check");
    return { shouldRun: true };
  }
  
  try {
    // Check for existing active enrollment
    let query = supabase
      .from("automation_enrollments")
      .select("id, status")
      .eq("automation_id", automationId)
      .eq("team_id", teamId)
      .eq("status", "active");
    
    if (contactId) {
      query = query.eq("contact_id", contactId);
    }
    if (appointmentId) {
      query = query.eq("appointment_id", appointmentId);
    }
    
    const { data: existing, error: checkError } = await query.maybeSingle();
    
    if (checkError) {
      console.error("[Enrollment] Error checking enrollment:", checkError);
      // Fail open - allow run if check fails
      return { shouldRun: true };
    }
    
    if (existing) {
      console.log(`[Enrollment] Contact already enrolled in automation ${automationId}`);
      return {
        shouldRun: false,
        reason: "already_enrolled",
        existingEnrollmentId: existing.id,
      };
    }
    
    // Create new enrollment
    const { data: enrollment, error: insertError } = await supabase
      .from("automation_enrollments")
      .insert({
        automation_id: automationId,
        team_id: teamId,
        contact_id: contactId,
        appointment_id: appointmentId,
        status: "active",
        enrolled_at: new Date().toISOString(),
        context_snapshot: context,
      })
      .select("id")
      .single();
    
    if (insertError) {
      // Could be unique constraint violation (race condition)
      if (insertError.code === "23505") {
        console.log("[Enrollment] Duplicate enrollment detected (race condition)");
        return { shouldRun: false, reason: "duplicate_enrollment" };
      }
      console.error("[Enrollment] Error creating enrollment:", insertError);
      // Fail open
      return { shouldRun: true };
    }
    
    console.log(`[Enrollment] Created enrollment ${enrollment.id} for automation ${automationId}`);
    return { shouldRun: true };
    
  } catch (err) {
    console.error("[Enrollment] Exception:", err);
    return { shouldRun: true }; // Fail open
  }
}

/**
 * Update enrollment status to completed
 */
export async function completeEnrollment(
  supabase: any,
  automationId: string,
  contactId: string | null,
  appointmentId: string | null,
): Promise<void> {
  try {
    let query = supabase
      .from("automation_enrollments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("automation_id", automationId)
      .eq("status", "active");
    
    if (contactId) {
      query = query.eq("contact_id", contactId);
    }
    if (appointmentId) {
      query = query.eq("appointment_id", appointmentId);
    }
    
    await query;
  } catch (err) {
    console.error("[Enrollment] Error completing enrollment:", err);
  }
}

/**
 * Exit enrollment with reason
 */
export async function exitEnrollment(
  supabase: any,
  automationId: string,
  contactId: string | null,
  appointmentId: string | null,
  exitReason: string,
): Promise<void> {
  try {
    let query = supabase
      .from("automation_enrollments")
      .update({
        status: "exited",
        exited_at: new Date().toISOString(),
        exit_reason: exitReason,
      })
      .eq("automation_id", automationId)
      .eq("status", "active");
    
    if (contactId) {
      query = query.eq("contact_id", contactId);
    }
    if (appointmentId) {
      query = query.eq("appointment_id", appointmentId);
    }
    
    await query;
  } catch (err) {
    console.error("[Enrollment] Error exiting enrollment:", err);
  }
}

/**
 * Check if any automation goals have been met
 */
export async function checkGoals(
  supabase: any,
  automationId: string,
  context: AutomationContext,
): Promise<GoalCheckResult> {
  try {
    const { data: goals, error } = await supabase
      .from("automation_goals")
      .select("*")
      .eq("automation_id", automationId)
      .eq("is_active", true);
    
    if (error || !goals || goals.length === 0) {
      return { goalMet: false };
    }
    
    for (const goal of goals) {
      const conditions = goal.condition || [];
      if (evaluateGoalConditions(conditions, context)) {
        console.log(`[Goals] Goal "${goal.name}" met for automation ${automationId}`);
        return {
          goalMet: true,
          goal: {
            id: goal.id,
            name: goal.name,
            exitOnGoal: goal.exit_on_goal,
            goToStepId: goal.go_to_step_id,
          },
        };
      }
    }
    
    return { goalMet: false };
  } catch (err) {
    console.error("[Goals] Error checking goals:", err);
    return { goalMet: false };
  }
}

/**
 * Evaluate goal conditions against context
 */
function evaluateGoalConditions(
  conditions: Array<{ field: string; operator: string; value: any }>,
  context: AutomationContext,
): boolean {
  if (!conditions || conditions.length === 0) return false;
  
  // All conditions must be met (AND logic)
  return conditions.every((condition) => {
    const actual = getFieldValue(context, condition.field);
    const expected = condition.value;
    
    switch (condition.operator) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "contains":
        return typeof actual === "string" && actual.includes(String(expected));
      case "gt":
        return typeof actual === "number" && actual > Number(expected);
      case "lt":
        return typeof actual === "number" && actual < Number(expected);
      case "in":
        return Array.isArray(expected) && expected.includes(actual);
      case "exists":
        return actual !== undefined && actual !== null;
      case "not_exists":
        return actual === undefined || actual === null;
      default:
        return false;
    }
  });
}

/**
 * Get field value from context using dot notation path
 */
function getFieldValue(context: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let value: any = context;
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
}
