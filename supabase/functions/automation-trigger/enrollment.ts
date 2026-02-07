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
 * Check if contact is already enrolled in automation and create enrollment if not.
 * Supports GHL-compatible re-enrollment rules:
 * - 'never': Only enroll once (default)
 * - 'after_exit': Re-enroll after contact has exited the automation
 * - 'after_complete': Re-enroll after contact has completed the automation
 * - 'always': Always allow re-enrollment (with cooldown)
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
    // Fetch automation settings for re-enrollment rules
    const { data: automation } = await supabase
      .from("automations")
      .select("allow_reenrollment, reenrollment_condition, reenrollment_wait_days, max_active_contacts")
      .eq("id", automationId)
      .single();

    const reenrollmentCondition = automation?.reenrollment_condition || "never";
    const allowReenrollment = automation?.allow_reenrollment || false;
    const waitDays = automation?.reenrollment_wait_days || 0;
    const maxActiveContacts = automation?.max_active_contacts || null;

    // Check for existing active enrollment
    let activeQuery = supabase
      .from("automation_enrollments")
      .select("id, status")
      .eq("automation_id", automationId)
      .eq("team_id", teamId)
      .eq("status", "active");
    
    if (contactId) {
      activeQuery = activeQuery.eq("contact_id", contactId);
    }
    if (appointmentId) {
      activeQuery = activeQuery.eq("appointment_id", appointmentId);
    }
    
    const { data: existing, error: checkError } = await activeQuery.maybeSingle();
    
    if (checkError) {
      console.error("[Enrollment] Error checking enrollment:", checkError);
      return { shouldRun: true }; // Fail open
    }
    
    // If already actively enrolled, always block
    if (existing) {
      console.log(`[Enrollment] Contact already actively enrolled in automation ${automationId}`);
      return {
        shouldRun: false,
        reason: "already_enrolled",
        existingEnrollmentId: existing.id,
      };
    }

    // Check re-enrollment rules for contacts that previously completed/exited
    if (allowReenrollment && reenrollmentCondition !== "never") {
      // Look for the most recent past enrollment
      // Query by both completed_at and exited_at, using created_at as fallback ordering
      // since either completed_at or exited_at could be set depending on how it ended
      let pastQuery = supabase
        .from("automation_enrollments")
        .select("id, status, completed_at, exited_at, reenrollment_count, created_at")
        .eq("automation_id", automationId)
        .eq("team_id", teamId)
        .in("status", ["completed", "exited"])
        .order("created_at", { ascending: false });

      if (contactId) {
        pastQuery = pastQuery.eq("contact_id", contactId);
      }
      if (appointmentId) {
        pastQuery = pastQuery.eq("appointment_id", appointmentId);
      }

      const { data: pastEnrollment } = await pastQuery.limit(1).maybeSingle();

      if (pastEnrollment) {
        // Check condition — 'always' allows any past status
        if (reenrollmentCondition === "after_complete" && pastEnrollment.status !== "completed") {
          console.log("[Enrollment] Re-enrollment requires completion, but last enrollment was exited");
          return { shouldRun: false, reason: "reenrollment_requires_completion" };
        }

        if (reenrollmentCondition === "after_exit" && pastEnrollment.status !== "exited") {
          console.log("[Enrollment] Re-enrollment requires exit, but last enrollment was completed");
          return { shouldRun: false, reason: "reenrollment_requires_exit" };
        }

        // Check cooldown period using the most recent finish timestamp
        if (waitDays > 0) {
          const lastFinished = pastEnrollment.completed_at || pastEnrollment.exited_at || pastEnrollment.created_at;
          if (lastFinished) {
            const daysSince = (Date.now() - new Date(lastFinished).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < waitDays) {
              console.log(`[Enrollment] Re-enrollment cooldown: ${daysSince.toFixed(1)} of ${waitDays} days elapsed`);
              return { shouldRun: false, reason: "reenrollment_cooldown" };
            }
          }
        }
      }
    } else {
      // Re-enrollment not allowed - check for any past enrollment
      let anyPastQuery = supabase
        .from("automation_enrollments")
        .select("id")
        .eq("automation_id", automationId)
        .eq("team_id", teamId);

      if (contactId) {
        anyPastQuery = anyPastQuery.eq("contact_id", contactId);
      }
      if (appointmentId) {
        anyPastQuery = anyPastQuery.eq("appointment_id", appointmentId);
      }

      const { data: anyPast } = await anyPastQuery.limit(1).maybeSingle();

      if (anyPast) {
        console.log(`[Enrollment] Contact already enrolled previously, re-enrollment not allowed`);
        return { shouldRun: false, reason: "reenrollment_not_allowed" };
      }
    }

    // Check max active contacts limit
    if (maxActiveContacts) {
      const { count, error: countError } = await supabase
        .from("automation_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("automation_id", automationId)
        .eq("status", "active");

      if (!countError && count !== null && count >= maxActiveContacts) {
        console.log(`[Enrollment] Max active contacts (${maxActiveContacts}) reached`);
        return { shouldRun: false, reason: "enrollment_limit_reached" };
      }
    }
    
    // Count previous enrollments for this contact (used for tracking and safety guard)
    let reenrollmentCount = 0;
    if (allowReenrollment) {
      let countQuery = supabase
        .from("automation_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("automation_id", automationId)
        .eq("team_id", teamId)
        .in("status", ["completed", "exited"]);

      // Apply both filters when both identifiers exist
      if (contactId) {
        countQuery = countQuery.eq("contact_id", contactId);
      }
      if (appointmentId) {
        countQuery = countQuery.eq("appointment_id", appointmentId);
      }

      const { count } = await countQuery;
      reenrollmentCount = count || 0;

      // Safety guard: max 100 re-enrollments per contact per automation
      if (reenrollmentCount >= 100) {
        console.log(`[Enrollment] Max re-enrollment count (100) reached for automation ${automationId}`);
        return { shouldRun: false, reason: "max_reenrollments_reached" };
      }
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
        reenrollment_count: reenrollmentCount,
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
      return { shouldRun: true }; // Fail open
    }
    
    console.log(`[Enrollment] Created enrollment ${enrollment.id} for automation ${automationId} (reenrollment #${reenrollmentCount})`);
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
