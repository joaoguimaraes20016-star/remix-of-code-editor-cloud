// supabase/functions/automation-trigger/actions/workflow-actions.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";
import { renderTemplate, getFieldValue } from "../template-engine.ts";

// Flexible config type to allow Record<string, any> from step.config
type FlexibleConfig = Record<string, unknown>;

// Create Task
export async function executeAddTask(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawTitle = config.title as string | undefined;

  if (!rawTitle) {
    log.status = "skipped";
    log.skipReason = "no_task_title";
    return log;
  }

  // Render template variables in task title
  const title = renderTemplate(rawTitle, context);

  try {
    // Calculate due date
    let dueAt: Date | null = null;
    const dueIn = config.dueIn as number | undefined;
    const dueUnit = config.dueUnit as string | undefined;
    if (dueIn && dueUnit) {
      const now = new Date();
      switch (dueUnit) {
        case "hours":
          dueAt = new Date(now.getTime() + dueIn * 60 * 60 * 1000);
          break;
        case "days":
          dueAt = new Date(now.getTime() + dueIn * 24 * 60 * 60 * 1000);
          break;
        default:
          dueAt = new Date(now.getTime() + dueIn * 60 * 60 * 1000);
      }
    }

    // Resolve assignee
    const assignTo = config.assignTo as string | undefined;
    let assignedTo: string | null = null;
    if (assignTo === "setter") {
      assignedTo = context.appointment?.setter_id || null;
    } else if (assignTo === "closer") {
      assignedTo = context.appointment?.closer_id || null;
    } else if (assignTo) {
      assignedTo = assignTo;
    }

    const { data, error } = await supabase
      .from("confirmation_tasks")
      .insert([
        {
          team_id: context.teamId,
          appointment_id: context.appointment?.id || context.deal?.id,
          task_type: "custom",
          status: "pending",
          due_at: dueAt?.toISOString() || new Date().toISOString(),
          assigned_to: assignedTo,
          pipeline_stage: title, // Using pipeline_stage to store task title
        },
      ])
      .select("id")
      .single();

    if (error) {
      log.status = "error";
      log.error = error.message;
    } else {
      log.output = { taskId: data?.id };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Notify Team
export async function executeNotifyTeam(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
  automationId: string,
  runId: string | null,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawMessage = config.message as string | undefined;

  if (!rawMessage) {
    log.status = "skipped";
    log.skipReason = "no_message_content";
    return log;
  }

  try {
    // Render message with template engine (supports pipes like {{lead.name | uppercase}})
    const renderedMessage = renderTemplate(rawMessage, context);

    // Log as in-app notification in message_logs
    const notifyAdmin = config.notifyAdmin as boolean | undefined;
    const notifyOwner = config.notifyOwner as boolean | undefined;
    const { error } = await supabase.from("message_logs").insert([
      {
        team_id: context.teamId,
        automation_id: automationId,
        run_id: runId,
        channel: "in_app",
        provider: "internal",
        to_address: notifyAdmin ? "admin" : "team",
        payload: {
          message: renderedMessage,
          notifyAdmin,
          notifyOwner,
          leadId: context.lead?.id,
          appointmentId: context.appointment?.id,
        },
        status: "sent",
      },
    ]);

    if (error) {
      log.status = "error";
      log.error = error.message;
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Custom Webhook
export async function executeCustomWebhook(
  config: FlexibleConfig,
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const rawUrl = config.url as string | undefined;

  if (!rawUrl) {
    log.status = "skipped";
    log.skipReason = "no_webhook_url";
    return log;
  }

  // Render template variables in URL (e.g., https://api.example.com/{{lead.id}})
  const url = renderTemplate(rawUrl, context);

  try {
    // Parse and render payload
    const configPayload = config.payload as string | undefined;
    let body: string | undefined;
    if (configPayload) {
      // Replace template variables in payload - use getFieldValue for JSON values
      body = configPayload.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = getFieldValue(context, path.trim());
        return value !== undefined ? JSON.stringify(value) : match;
      });
    } else {
      // Default payload with context
      body = JSON.stringify({
        teamId: context.teamId,
        triggerType: context.triggerType,
        timestamp: context.now,
        lead: context.lead,
        appointment: context.appointment,
        deal: context.deal,
        stepOutputs: context.stepOutputs,
      });
    }

    const method = (config.method as string) || "POST";
    const headers = config.headers as Record<string, string> | undefined;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body,
    });

    if (!response.ok) {
      log.status = "error";
      log.error = `HTTP ${response.status}: ${response.statusText}`;
    } else {
      log.output = { statusCode: response.status };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Run Another Workflow
export async function executeRunWorkflow(
  config: FlexibleConfig,
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };
  const workflowId = config.workflowId as string | undefined;

  if (!workflowId) {
    log.status = "skipped";
    log.skipReason = "no_workflow_specified";
    return log;
  }

  try {
    // Fetch the target workflow
    const { data: workflow, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", workflowId)
      .eq("is_active", true)
      .single();

    if (fetchError || !workflow) {
      log.status = "error";
      log.error = fetchError?.message || "Workflow not found or inactive";
      return log;
    }

    // Trigger the workflow by calling the edge function
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
          meta: { ...context.meta, triggeredByWorkflow: true },
        },
        eventId: `run_workflow:${workflowId}:${Date.now()}`,
      }),
    });

    if (!response.ok) {
      log.status = "error";
      log.error = `Failed to trigger workflow: HTTP ${response.status}`;
    } else {
      log.output = { triggeredWorkflowId: workflowId };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Stop Workflow
export function executeStopWorkflow(
  config: FlexibleConfig,
  context: AutomationContext,
): { shouldStop: true; reason: string } {
  const rawReason = (config.reason as string) || "stop_workflow action";
  // Render template variables in reason
  const reason = renderTemplate(rawReason, context);
  return {
    shouldStop: true,
    reason,
  };
}

// Go To (jump to another step)
export function executeGoTo(
  config: FlexibleConfig,
): { jumpTo: string } | null {
  const targetStepId = config.targetStepId as string | undefined;
  if (!targetStepId) {
    return null;
  }
  return { jumpTo: targetStepId };
}

// getFieldValue imported from ../template-engine.ts
