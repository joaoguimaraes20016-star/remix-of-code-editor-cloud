// supabase/functions/automation-trigger/actions/workflow-actions.ts

import type { AutomationContext, StepExecutionLog } from "../types.ts";

// Create Task
export async function executeAddTask(
  config: { title: string; description?: string; assignTo?: string; dueIn?: number; dueUnit?: string },
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  if (!config.title) {
    log.status = "skipped";
    log.skipReason = "no_task_title";
    return log;
  }

  try {
    // Calculate due date
    let dueAt: Date | null = null;
    if (config.dueIn && config.dueUnit) {
      const now = new Date();
      switch (config.dueUnit) {
        case "hours":
          dueAt = new Date(now.getTime() + config.dueIn * 60 * 60 * 1000);
          break;
        case "days":
          dueAt = new Date(now.getTime() + config.dueIn * 24 * 60 * 60 * 1000);
          break;
        default:
          dueAt = new Date(now.getTime() + config.dueIn * 60 * 60 * 1000);
      }
    }

    // Resolve assignee
    let assignedTo: string | null = null;
    if (config.assignTo === "setter") {
      assignedTo = context.appointment?.setter_id || null;
    } else if (config.assignTo === "closer") {
      assignedTo = context.appointment?.closer_id || null;
    } else if (config.assignTo) {
      assignedTo = config.assignTo;
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
          pipeline_stage: config.title, // Using pipeline_stage to store task title
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
  config: { message: string; notifyAdmin?: boolean; notifyOwner?: boolean },
  context: AutomationContext,
  supabase: any,
  automationId: string,
  runId: string | null,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  if (!config.message) {
    log.status = "skipped";
    log.skipReason = "no_message_content";
    return log;
  }

  try {
    // Render message with context
    const renderedMessage = config.message.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = getFieldValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });

    // Log as in-app notification in message_logs
    const { error } = await supabase.from("message_logs").insert([
      {
        team_id: context.teamId,
        automation_id: automationId,
        run_id: runId,
        channel: "in_app",
        provider: "internal",
        to_address: config.notifyAdmin ? "admin" : "team",
        payload: {
          message: renderedMessage,
          notifyAdmin: config.notifyAdmin,
          notifyOwner: config.notifyOwner,
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
  config: { url: string; method?: string; headers?: Record<string, string>; payload?: string },
  context: AutomationContext,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  if (!config.url) {
    log.status = "skipped";
    log.skipReason = "no_webhook_url";
    return log;
  }

  try {
    // Parse and render payload
    let body: string | undefined;
    if (config.payload) {
      // Replace template variables in payload
      body = config.payload.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
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
      });
    }

    const response = await fetch(config.url, {
      method: config.method || "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
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
  config: { workflowId: string },
  context: AutomationContext,
  supabase: any,
): Promise<StepExecutionLog> {
  const log: StepExecutionLog = { status: "success" };

  if (!config.workflowId) {
    log.status = "skipped";
    log.skipReason = "no_workflow_specified";
    return log;
  }

  try {
    // Fetch the target workflow
    const { data: workflow, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", config.workflowId)
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
        eventId: `run_workflow:${config.workflowId}:${Date.now()}`,
      }),
    });

    if (!response.ok) {
      log.status = "error";
      log.error = `Failed to trigger workflow: HTTP ${response.status}`;
    } else {
      log.output = { triggeredWorkflowId: config.workflowId };
    }
  } catch (err) {
    log.status = "error";
    log.error = err instanceof Error ? err.message : "Unknown error";
  }

  return log;
}

// Stop Workflow
export function executeStopWorkflow(
  config: { reason?: string },
): { shouldStop: true; reason: string } {
  return {
    shouldStop: true,
    reason: config.reason || "stop_workflow action",
  };
}

// Go To (jump to another step)
export function executeGoTo(
  config: { targetStepId: string },
): { jumpTo: string } | null {
  if (!config.targetStepId) {
    return null;
  }
  return { jumpTo: config.targetStepId };
}

// Helper function
function getFieldValue(context: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let value: any = context;
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
}
