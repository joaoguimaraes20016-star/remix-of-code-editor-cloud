// supabase/functions/automation-trigger/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  TriggerType,
  ActionType,
  AutomationCondition,
  AutomationStep,
  AutomationDefinition,
  AutomationContext,
  StepExecutionLog,
  TriggerRequest,
  TriggerResponse,
} from "./types.ts";
import { logStepExecution, executeWithRetry } from "./step-logger.ts";
import { checkRateLimit, isWithinBusinessHours } from "./rate-limiter.ts";
import { executeSendMessage } from "./actions/send-message.ts";
import { executeTimeDelay, calculateWaitUntilTime } from "./actions/time-delay.ts";
import {
  executeAddTag,
  executeRemoveTag,
  executeCreateContact,
  executeUpdateContact,
  executeAddNote,
  executeAssignOwner,
  executeUpdateStage,
} from "./actions/crm-actions.ts";
import {
  executeAddTask,
  executeNotifyTeam,
  executeCustomWebhook,
  executeRunWorkflow,
  executeStopWorkflow,
  executeGoTo,
} from "./actions/workflow-actions.ts";
import { executeVoiceCall } from "./actions/voice-ai.ts";
import {
  checkAndCreateEnrollment,
  completeEnrollment,
  exitEnrollment,
  checkGoals,
} from "./enrollment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CrmEntity = "lead" | "deal" | "appointment";

// --- Supabase Client ---
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// --- Context Builder ---
function buildAutomationContext(triggerType: TriggerType, payload: Record<string, any>): AutomationContext {
  const { teamId } = payload;
  return {
    teamId,
    triggerType,
    now: new Date().toISOString(),
    lead: payload.lead ?? null,
    appointment: payload.appointment ?? null,
    payment: payload.payment ?? null,
    deal: payload.deal ?? null,
    meta: payload.meta ?? null,
  };
}

// --- Condition Evaluator ---
function getFieldValue(context: Record<string, any>, path: string): any {
  const keys = path.split(".");
  let value: any = context;
  for (const key of keys) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
}

function evaluateCondition(condition: AutomationCondition, context: Record<string, any>): boolean {
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
    default:
      return false;
  }
}

function evaluateConditions(
  conditions: AutomationCondition[] | undefined,
  context: Record<string, any>,
  logic: "AND" | "OR" = "AND",
): boolean {
  if (!conditions || conditions.length === 0) return true;
  if (logic === "AND") {
    return conditions.every((c) => evaluateCondition(c, context));
  }
  return conditions.some((c) => evaluateCondition(c, context));
}

// --- Get Automations from DB ONLY (no templates to prevent duplicates) ---
async function getAutomationsForTrigger(
  supabase: any,
  teamId: string,
  triggerType: TriggerType,
): Promise<AutomationDefinition[]> {
  try {
    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("team_id", teamId)
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (error) {
      console.error("[Automation Trigger] Error fetching automations:", error);
      return [];
    }

    if (data && data.length > 0) {
      console.log(`[Automation Trigger] Found ${data.length} DB automations for ${triggerType}`);
      return data.map((row: any) => {
        const definition = row.definition || {};
        return {
          id: row.id,
          teamId: row.team_id,
          name: row.name,
          description: row.description || "",
          isActive: row.is_active,
          trigger: definition.trigger || { type: row.trigger_type, config: {} },
          triggerType: row.trigger_type as TriggerType,
          steps: definition.steps || [],
        } as AutomationDefinition;
      });
    }

    console.log(`[Automation Trigger] No DB automations found for ${triggerType}`);
    return [];
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error fetching automations:", err);
    return [];
  }
}

/**
 * Per-automation idempotency check.
 * Composite key: teamId + triggerType + automationKey + eventId
 * This ensures each automation runs EXACTLY ONCE per event, even if trigger is called multiple times.
 */
async function hasAutomationAlreadyRunForEvent(
  supabase: any,
  teamId: string,
  triggerType: TriggerType,
  automationKey: string,
  eventId: string,
): Promise<{ alreadyRan: boolean; existingRunId?: string }> {
  try {
    // Query for existing run with matching automationKey AND eventId in context_snapshot
    const { data, error } = await supabase
      .from("automation_runs")
      .select("id")
      .eq("team_id", teamId)
      .eq("trigger_type", triggerType)
      .filter("context_snapshot->>eventId", "eq", eventId)
      .filter("context_snapshot->>automationKey", "eq", automationKey)
      .limit(1);

    if (error) {
      console.error("[Automation Trigger] Idempotency check failed:", error);
      return { alreadyRan: false }; // On error, allow run (fail open)
    }

    if (data && data.length > 0) {
      return { alreadyRan: true, existingRunId: data[0].id };
    }

    return { alreadyRan: false };
  } catch (err) {
    console.error("[Automation Trigger] Idempotency check exception:", err);
    return { alreadyRan: false };
  }
}

// --- Create Automation Run (returns run_id) ---
async function createAutomationRun(
  supabase: any,
  params: {
    automationId?: string | null;
    teamId: string;
    triggerType: TriggerType;
    context?: AutomationContext;
    eventId: string;
    automationKey: string;
  },
): Promise<string | null> {
  try {
    // Build context_snapshot with eventId and automationKey for idempotency
    const contextSnapshot = {
      ...(params.context ? JSON.parse(JSON.stringify(params.context)) : {}),
      eventId: params.eventId,
      automationKey: params.automationKey,
    };

    const { data, error } = await supabase
      .from("automation_runs")
      .insert([
        {
          automation_id: params.automationId ?? null,
          team_id: params.teamId,
          trigger_type: params.triggerType,
          status: "running",
          steps_executed: [],
          context_snapshot: contextSnapshot,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("[Automation Trigger] Error creating run:", error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error creating run:", err);
    return null;
  }
}

// --- Update Automation Run ---
async function updateAutomationRun(
  supabase: any,
  runId: string,
  params: {
    status: "success" | "error";
    errorMessage?: string;
    stepsExecuted: StepExecutionLog[];
  },
): Promise<void> {
  try {
    const { error } = await supabase
      .from("automation_runs")
      .update({
        status: params.status,
        error_message: params.errorMessage || null,
        steps_executed: JSON.parse(JSON.stringify(params.stepsExecuted)),
      })
      .eq("id", runId);

    if (error) {
      console.error("[Automation Trigger] Error updating run:", error);
    }
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error updating run:", err);
  }
}

// --- Log Message to message_logs ---
async function logMessage(
  supabase: any,
  params: {
    teamId: string;
    automationId: string;
    runId: string | null;
    channel: string;
    provider: string;
    toAddress: string;
    fromAddress?: string;
    template?: string;
    payload: Record<string, any>;
    status: "queued" | "sent" | "failed";
    errorMessage?: string;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("message_logs").insert([
      {
        team_id: params.teamId,
        automation_id: params.automationId,
        run_id: params.runId,
        channel: params.channel,
        provider: params.provider,
        to_address: params.toAddress,
        from_address: params.fromAddress || null,
        template: params.template || null,
        payload: params.payload,
        status: params.status,
        error_message: params.errorMessage || null,
      },
    ]);

    if (error) {
      console.error("[Automation Trigger] Error logging message:", error);
    }
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error logging message:", err);
  }
}

// --- Template Variable Extraction (for logging) ---
function extractTemplateVariables(template: string, context: AutomationContext): Record<string, any> {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  const variables: Record<string, any> = {};
  for (const match of matches) {
    const path = match.replace(/\{\{|\}\}/g, "").trim();
    variables[path] = getFieldValue(context, path);
  }
  return variables;
}

// --- Render Template ---
function renderTemplate(template: string, context: AutomationContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getFieldValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

// --- Run Automation with Branching Support ---
async function runAutomation(
  automation: AutomationDefinition,
  context: AutomationContext,
  supabase: any,
  runId: string | null,
): Promise<StepExecutionLog[]> {
  const logs: StepExecutionLog[] = [];
  const steps = automation.steps.sort((a, b) => a.order - b.order);
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const visitedSteps = new Set<string>();
  const maxSteps = 100; // Prevent infinite loops

  console.log(`[Automation] Running "${automation.name}" (${automation.id}) with ${steps.length} steps`);

  // Start with the first step
  let currentStepId: string | null = steps[0]?.id || null;

  while (currentStepId && logs.length < maxSteps) {
    // Prevent infinite loops
    if (visitedSteps.has(currentStepId)) {
      console.warn(`[Automation] Loop detected at step ${currentStepId}, breaking`);
      break;
    }
    visitedSteps.add(currentStepId);

    const step = stepMap.get(currentStepId);
    if (!step) {
      console.warn(`[Automation] Step ${currentStepId} not found`);
      break;
    }

    // Evaluate step conditions (NOT for condition nodes - those have their own logic)
    if (step.type !== "condition" && step.conditions && step.conditions.length > 0) {
      const conditionsMet = evaluateConditions(step.conditions, context, step.conditionLogic || "AND");
      if (!conditionsMet) {
        logs.push({
          stepId: step.id,
          actionType: step.type,
          skipped: true,
          skipReason: "conditions_not_met",
        });
        // Move to next step by order
        currentStepId = getNextStepByOrder(steps, step.order);
        continue;
      }
    }

    const startTime = Date.now();
    let log: StepExecutionLog = {
      stepId: step.id,
      actionType: step.type,
      skipped: false,
    };

    let nextStepId: string | null = null;
    let shouldStop = false;

    try {
      switch (step.type) {
        // === MESSAGING ACTIONS ===
        case "send_message": {
          // Check rate limit first
          const channel = step.config.channel || "sms";
          const rateCheck = await checkRateLimit(supabase, context.teamId, channel, automation.id);
          
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }

          const result = await executeSendMessage(step.config, context, supabase, runId, automation.id);
          log = { ...log, ...result };
          break;
        }

        case "enqueue_dialer": {
          // Use voice channel for dialer
          const rateCheck = await checkRateLimit(supabase, context.teamId, "voice", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          
          const dialerConfig = {
            ...step.config,
            channel: "voice" as const,
          };
          const result = await executeSendMessage(dialerConfig, context, supabase, runId, automation.id);
          log = { ...log, ...result, channel: "voice", provider: "power_dialer" };
          break;
        }

        // === TIME/DELAY ACTIONS ===
        case "time_delay": {
          const result = await executeTimeDelay(
            step.config,
            context,
            supabase,
            automation.id,
            runId,
            step.id,
            steps.filter((s) => s.order > step.order),
          );
          
          if (result.scheduled) {
            log.status = "success";
            log.output = { resumeAt: result.resumeAt, jobId: result.jobId };
            // Stop execution - remaining steps will run when scheduled job fires
            shouldStop = true;
          } else {
            log.status = "error";
            log.error = result.error;
          }
          break;
        }

        case "wait_until": {
          const resumeAt = calculateWaitUntilTime(step.config);
          const result = await executeTimeDelay(
            { duration: 0, unit: "minutes" },
            { ...context, meta: { ...context.meta, waitUntilTime: resumeAt.toISOString() } },
            supabase,
            automation.id,
            runId,
            step.id,
            steps.filter((s) => s.order > step.order),
          );
          
          if (result.scheduled) {
            log.status = "success";
            log.output = { resumeAt: resumeAt.toISOString() };
            shouldStop = true;
          }
          break;
        }

        case "business_hours": {
          const timezone = step.config.timezone || "America/New_York";
          const { withinHours, nextOpenTime } = await isWithinBusinessHours(supabase, context.teamId, timezone);
          
          if (!withinHours && nextOpenTime) {
            // Schedule to resume at next open time
            const result = await executeTimeDelay(
              { duration: 0, unit: "minutes" },
              context,
              supabase,
              automation.id,
              runId,
              step.id,
              steps.filter((s) => s.order > step.order),
            );
            log.status = "success";
            log.output = { withinHours, resumeAt: nextOpenTime };
            shouldStop = true;
          } else {
            log.status = "success";
            log.output = { withinHours };
          }
          break;
        }

        // === CRM ACTIONS ===
        case "add_tag": {
          const result = await executeAddTag(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "remove_tag": {
          const result = await executeRemoveTag(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "create_contact": {
          const result = await executeCreateContact(step.config, context, supabase);
          log = { ...log, ...result };
          // Update context with new contact if created
          if (result.output?.contactId) {
            context.lead = { ...context.lead, id: result.output.contactId };
          }
          break;
        }

        case "update_contact": {
          const result = await executeUpdateContact(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "add_note": {
          const result = await executeAddNote(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "assign_owner": {
          const result = await executeAssignOwner(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "update_stage": {
          const result = await executeUpdateStage(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        // === WORKFLOW ACTIONS ===
        case "add_task": {
          const result = await executeAddTask(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "notify_team": {
          const result = await executeNotifyTeam(step.config, context, supabase, automation.id, runId);
          log = { ...log, ...result };
          break;
        }

        case "custom_webhook": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "webhook", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const result = await executeCustomWebhook(step.config, context);
          log = { ...log, ...result };
          break;
        }

        case "run_workflow": {
          const result = await executeRunWorkflow(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "stop_workflow": {
          const result = executeStopWorkflow(step.config);
          log.status = "success";
          log.output = { reason: result.reason };
          shouldStop = true;
          break;
        }

        case "go_to": {
          const result = executeGoTo(step.config);
          if (result) {
            nextStepId = result.jumpTo;
            log.status = "success";
            log.output = { jumpTo: result.jumpTo };
          } else {
            log.skipped = true;
            log.skipReason = "no_target_step";
          }
          break;
        }

        // === FLOW CONTROL ===
        case "condition": {
          // Evaluate the conditions to determine which branch to take
          const conditions = step.conditions || [];
          const conditionsMet = evaluateConditions(conditions, context, step.conditionLogic || "AND");
          
          log.status = "success";
          log.output = { conditionsMet, evaluatedConditions: conditions.length };
          
          // Determine next step based on condition result
          if (conditionsMet && step.trueBranchStepId) {
            nextStepId = step.trueBranchStepId;
            log.output.branch = "true";
          } else if (!conditionsMet && step.falseBranchStepId) {
            nextStepId = step.falseBranchStepId;
            log.output.branch = "false";
          } else {
            // No branch configured, continue to next step by order
            log.output.branch = conditionsMet ? "true_no_branch" : "false_no_branch";
          }
          break;
        }

        case "split_test": {
          // A/B split testing - randomly select a variant based on percentages
          const variants = step.variants || step.config.variants || [];
          if (variants.length === 0) {
            log.skipped = true;
            log.skipReason = "no_variants_configured";
            break;
          }

          const random = Math.random() * 100;
          let cumulative = 0;
          let selectedVariant = variants[0];

          for (const variant of variants) {
            cumulative += variant.percentage;
            if (random <= cumulative) {
              selectedVariant = variant;
              break;
            }
          }

          log.status = "success";
          log.output = { selectedVariant: selectedVariant.id, random };

          if (selectedVariant.nextStepId) {
            nextStepId = selectedVariant.nextStepId;
          }
          break;
        }

        // === DEAL ACTIONS (stubs for now) ===
        case "create_deal":
        case "close_deal":
          log.status = "success";
          log.templateVariables = step.config;
          console.info(`[Automation] Stub action: ${step.type}`, step.config);
          break;

        default:
          console.warn(`[Automation] Unknown action type: ${step.type}`);
          log.skipped = true;
          log.skipReason = "unknown_action_type";
      }
    } catch (err) {
      log.status = "error";
      log.error = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Automation] Error executing step ${step.id}:`, err);
    }

    log.durationMs = Date.now() - startTime;
    logs.push(log);

    // Log step execution to database
    if (runId) {
      await logStepExecution(supabase, {
        runId,
        stepId: step.id,
        actionType: step.type,
        status: log.status === "error" ? "error" : log.skipped ? "skipped" : "success",
        inputSnapshot: step.config,
        outputSnapshot: log.output,
        errorMessage: log.error,
        skipReason: log.skipReason,
        durationMs: log.durationMs,
      });
    }

    // Check if we should stop
    if (shouldStop) {
      console.log(`[Automation] Stopping at step ${step.id}`);
      break;
    }

    // Determine next step
    if (nextStepId) {
      currentStepId = nextStepId;
    } else {
      currentStepId = getNextStepByOrder(steps, step.order);
    }
  }

  console.log(`[Automation] Completed "${automation.name}" with ${logs.length} steps executed`);
  return logs;
}

/**
 * Get the next step by order index
 */
function getNextStepByOrder(steps: AutomationStep[], currentOrder: number): string | null {
  const nextStep = steps.find((s) => s.order > currentOrder);
  return nextStep?.id || null;
}

// --- Main Handler ---
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const body: TriggerRequest = await req.json();

    const { triggerType, teamId, eventPayload, eventId } = body as any;
    console.log("[automation-trigger] incoming", {
      triggerType,
      teamId,
      eventId,
      leadId: (eventPayload as any)?.lead?.id,
    });

    if (!triggerType || !teamId) {
      return new Response(
        JSON.stringify({ status: "error", error: "Missing triggerType or teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Compute stable eventId from request or derive from lead/appointment
    // This is the canonical event identifier for idempotency
    const stableEventId: string =
      eventId ??
      (eventPayload as any)?.eventId ??
      (triggerType === "lead_created" && (eventPayload as any)?.lead?.id
        ? `lead_created:${(eventPayload as any).lead.id}`
        : `${triggerType}:${Date.now()}`);

    console.log(`[Automation Trigger] stableEventId=${stableEventId}`);

    // Build context
    const context = buildAutomationContext(triggerType, {
      teamId,
      ...eventPayload,
    });

    // Get matching automations from DB ONLY (no templates - prevents duplicates)
    const automations = await getAutomationsForTrigger(supabase, teamId, triggerType);

    if (automations.length === 0) {
      console.log(`[Automation Trigger] No matching automations, exiting`);
      return new Response(
        JSON.stringify({ status: "ok", automationsRun: [], stepsExecuted: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[Automation Trigger] Found ${automations.length} matching automations`);

    const automationsRun: string[] = [];
    const automationsSkipped: string[] = [];
    const allStepsExecuted: StepExecutionLog[] = [];

    // Run each automation with PER-AUTOMATION idempotency check and enrollment tracking
    for (const automation of automations) {
      // Generate automationKey: unique identifier for this automation
      // For DB automations, use the database ID
      const automationKey = `db:${automation.id}`;

      // PER-AUTOMATION IDEMPOTENCY CHECK
      // Prevents duplicate runs when trigger is called multiple times for same event
      // Composite key: teamId + triggerType + automationKey + eventId
      const { alreadyRan, existingRunId } = await hasAutomationAlreadyRunForEvent(
        supabase,
        teamId,
        triggerType,
        automationKey,
        stableEventId,
      );

      if (alreadyRan) {
        console.log(
          `[Automation Trigger] SKIPPED automation ${automation.id} - already ran for event ${stableEventId} (run ${existingRunId})`,
        );
        automationsSkipped.push(automation.id);
        continue;
      }

      // ENROLLMENT CHECK - Prevent duplicate enrollments
      const enrollmentCheck = await checkAndCreateEnrollment(
        supabase,
        automation.id,
        teamId,
        context,
      );

      if (!enrollmentCheck.shouldRun) {
        console.log(
          `[Automation Trigger] SKIPPED automation ${automation.id} - ${enrollmentCheck.reason}`,
        );
        automationsSkipped.push(automation.id);
        continue;
      }

      // Create automation run with eventId and automationKey stored in context_snapshot
      const runId = await createAutomationRun(supabase, {
        automationId: automation.id,
        teamId,
        triggerType,
        context,
        eventId: stableEventId,
        automationKey,
      });

      if (!runId) {
        console.error(`[Automation Trigger] Failed to create run for automation ${automation.id}`);
        continue;
      }

      automationsRun.push(automation.id);

      let status: "success" | "error" = "success";
      let errorMessage: string | undefined;
      let stepLogs: StepExecutionLog[] = [];
      let exitedByGoal = false;

      try {
        stepLogs = await runAutomation(automation, context, supabase, runId);
        allStepsExecuted.push(...stepLogs);
        
        // Check for goal completion after run
        const goalCheck = await checkGoals(supabase, automation.id, context);
        if (goalCheck.goalMet && goalCheck.goal?.exitOnGoal) {
          exitedByGoal = true;
          await exitEnrollment(
            supabase,
            automation.id,
            context.lead?.id || null,
            context.appointment?.id || null,
            `Goal met: ${goalCheck.goal.name}`,
          );
        }
      } catch (err) {
        status = "error";
        errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Automation Trigger] Error running automation ${automation.id}:`, err);
      }

      // Complete enrollment if not exited by goal
      if (!exitedByGoal && status === "success") {
        await completeEnrollment(
          supabase,
          automation.id,
          context.lead?.id || null,
          context.appointment?.id || null,
        );
      }

      // Update the automation run with final status and steps
      await updateAutomationRun(supabase, runId, {
        status,
        errorMessage,
        stepsExecuted: stepLogs,
      });
    }

    const response: TriggerResponse = {
      status: "ok",
      triggerType,
      automationsRun,
      stepsExecuted: allStepsExecuted,
    };

    console.log(`[Automation Trigger] Complete: ran=${automationsRun.length}, skipped=${automationsSkipped.length}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Automation Trigger] Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
