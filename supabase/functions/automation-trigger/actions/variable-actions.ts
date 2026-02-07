// supabase/functions/automation-trigger/actions/variable-actions.ts
// Variable and workflow management actions

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate } from "../template-engine.ts";

type FlexibleConfig = Record<string, unknown>;

/**
 * Set Variable - store a value in context for downstream steps
 * Supports template rendering and simple expressions
 * 
 * Access patterns for downstream steps:
 *   {{stepOutputs.variables.myVar}}  — clean named access
 *   {{stepOutputs.<step_id>.value}}  — standard step output access (set by index.ts)
 */
export async function executeSetVariable(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const variableName = config.name as string;
  const rawValue = (config.value as string) || "";

  if (!variableName) {
    log.status = "skipped";
    log.skipReason = "no_variable_name";
    return log;
  }

  // Render template variables in the value
  const value = renderTemplate(rawValue, context);

  log.output = { name: variableName, value };

  return log;
}

/**
 * Add contact to another workflow - triggers another automation for the same contact
 */
export async function executeAddToWorkflow(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const workflowId = config.workflowId as string;
  if (!workflowId) {
    log.status = "skipped";
    log.skipReason = "no_workflow_specified";
    return log;
  }

  try {
    // Verify the workflow exists and is active
    const { data: workflow, error: fetchError } = await supabase
      .from("automations")
      .select("id, trigger_type, is_active")
      .eq("id", workflowId)
      .single();

    if (fetchError || !workflow) {
      log.status = "error";
      log.error = fetchError?.message || "Workflow not found";
      return log;
    }

    if (!workflow.is_active) {
      log.status = "skipped";
      log.skipReason = "workflow_inactive";
      return log;
    }

    // Trigger the workflow
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(`${supabaseUrl}/functions/v1/automation-trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        triggerType: workflow.trigger_type,
        teamId: context.teamId,
        eventPayload: {
          lead: context.lead,
          appointment: context.appointment,
          deal: context.deal,
          meta: { ...context.meta, addedByWorkflow: true },
        },
        eventId: `add_to_workflow:${workflowId}:${context.lead?.id || "unknown"}:${Date.now()}`,
      }),
    });

    if (!response.ok) {
      log.status = "error";
      log.error = `Failed to trigger workflow: HTTP ${response.status}`;
    } else {
      log.output = { enrolledWorkflowId: workflowId };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

/**
 * Remove contact from another workflow - exit enrollment in the target workflow
 */
export async function executeRemoveFromWorkflow(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  const workflowId = config.workflowId as string;
  if (!workflowId) {
    log.status = "skipped";
    log.skipReason = "no_workflow_specified";
    return log;
  }

  const contactId = context.lead?.id;
  const appointmentId = context.appointment?.id;

  if (!contactId && !appointmentId) {
    log.status = "skipped";
    log.skipReason = "no_contact_in_context";
    return log;
  }

  try {
    // Find and exit active enrollment
    let query = supabase
      .from("automation_enrollments")
      .update({
        status: "exited",
        exited_at: new Date().toISOString(),
        exit_reason: "Removed by automation action",
      })
      .eq("automation_id", workflowId)
      .eq("status", "active");

    if (contactId) {
      query = query.eq("contact_id", contactId);
    }
    if (appointmentId) {
      query = query.eq("appointment_id", appointmentId);
    }

    const { error } = await query;

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { removedFromWorkflowId: workflowId };
    }

    // Also cancel any pending scheduled jobs for this contact in that workflow
    let jobQuery = supabase
      .from("scheduled_automation_jobs")
      .update({ status: "cancelled" })
      .eq("automation_id", workflowId)
      .eq("status", "pending");

    if (contactId) {
      jobQuery = jobQuery.contains("context_snapshot", { lead: { id: contactId } });
    }

    await jobQuery;
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}
