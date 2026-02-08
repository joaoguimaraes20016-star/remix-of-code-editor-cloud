// supabase/functions/automation-trigger/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  TriggerType,
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
import { RETRY_POLICIES } from "./retry-policy.ts";
import { executeSendMessage } from "./actions/send-message.ts";
import { executeTimeDelay, executeWaitUntil } from "./actions/time-delay.ts";
import {
  executeAddTag,
  executeRemoveTag,
  executeCreateContact,
  executeUpdateContact,
  executeAddNote,
  executeAssignOwner,
  executeUpdateStage,
  executeCreateDeal,
  executeCloseDeal,
  executeFindContact,
  executeDeleteContact,
  executeRemoveOwner,
  executeToggleDnd,
  executeUpdateDeal,
  executeFindOpportunity,
  executeRemoveOpportunity,
  executeCopyContact,
  executeAiIntent,
  executeAiDecision,
  executeAiTranslate,
  executeAiSummarize,
  executeAiMessage,
  executeAddFollowers,
  executeRemoveFollowers,
  executeAddToAudience,
  executeRemoveFromAudience,
} from "./actions/crm-actions.ts";
import {
  executeSetVariable,
  executeAddToWorkflow,
  executeRemoveFromWorkflow,
  executeRemoveFromAllWorkflows,
} from "./actions/variable-actions.ts";
import {
  executeFormatDate,
  executeFormatNumber,
  executeFormatText,
  executeMathOperation,
} from "./actions/data-transform.ts";
import {
  executeAddTask,
  executeNotifyTeam,
  executeCustomWebhook,
  executeRunWorkflow,
  executeStopWorkflow,
  executeGoTo,
} from "./actions/workflow-actions.ts";
import { executeSlackMessage } from "./actions/slack-message.ts";
import { executeDiscordMessage } from "./actions/discord-message.ts";
import { executeGoogleAdsConversion } from "./actions/google-ads-conversion.ts";
import { executeTikTokEvent } from "./actions/tiktok-event.ts";
import { executeMetaConversion } from "./actions/meta-conversion.ts";
import { executeGoogleSheets } from "./actions/google-sheets.ts";
import {
  executeSendInvoice,
  executeChargePayment,
  executeCreateSubscription,
  executeCancelSubscription,
} from "./actions/stripe-actions.ts";
import {
  executeBookAppointment,
  executeUpdateAppointment,
  executeCancelAppointment,
  executeCreateBookingLink,
  executeLogCall,
} from "./actions/appointment-actions.ts";
import {
  executeSendVoicemail,
  executeMakeCall,
} from "./actions/voice-actions.ts";
import {
  executeSendReviewRequest,
  executeReplyInComments,
} from "./actions/marketing-actions.ts";
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

// --- Supabase Client ---
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// --- Context Builder ---
// ARCHITECTURE NOTE: Deals and appointments share the `appointments` database table.
// `context.deal` and `context.appointment` are separate views of the same underlying row,
// differentiated by type/status fields. When refreshing context after mutations (assign_owner,
// update_stage, close_deal, update_deal), both are queried from `appointments` table.
// `context.lead` maps to the `contacts` table and is always a separate entity.
// Normalize appointment/deal fields to consistent snake_case
// Handles both old camelCase triggers and new snake_case triggers
function normalizeAppointmentFields(appt: Record<string, any> | null): Record<string, any> | null {
  if (!appt) return null;
  return {
    ...appt,
    // Ensure snake_case versions exist (prefer existing snake_case, fallback to camelCase)
    start_at_utc: appt.start_at_utc ?? appt.startAt ?? null,
    event_type_name: appt.event_type_name ?? appt.eventTypeName ?? null,
    pipeline_stage: appt.pipeline_stage ?? appt.pipelineStage ?? null,
    closer_id: appt.closer_id ?? appt.closerId ?? null,
    closer_name: appt.closer_name ?? appt.closerName ?? null,
    setter_id: appt.setter_id ?? appt.setterId ?? null,
    setter_name: appt.setter_name ?? appt.setterName ?? null,
    duration_minutes: appt.duration_minutes ?? appt.durationMinutes ?? null,
    meeting_link: appt.meeting_link ?? appt.meetingLink ?? null,
    appointment_notes: appt.appointment_notes ?? appt.appointmentNotes ?? appt.notes ?? null,
    // Keep camelCase aliases for backward compatibility with existing templates
    startAt: appt.startAt ?? appt.start_at_utc ?? null,
    eventTypeName: appt.eventTypeName ?? appt.event_type_name ?? null,
    pipelineStage: appt.pipelineStage ?? appt.pipeline_stage ?? null,
    closerId: appt.closerId ?? appt.closer_id ?? null,
    closerName: appt.closerName ?? appt.closer_name ?? null,
    setterId: appt.setterId ?? appt.setter_id ?? null,
    setterName: appt.setterName ?? appt.setter_name ?? null,
  };
}

function buildAutomationContext(triggerType: TriggerType, payload: Record<string, any>, automationId?: string): AutomationContext {
  const { teamId } = payload;

  // Normalize appointment and deal fields for consistent access
  const appointment = normalizeAppointmentFields(payload.appointment ?? null);
  const deal = normalizeAppointmentFields(payload.deal ?? null);

  return {
    teamId,
    triggerType,
    now: new Date().toISOString(),
    lead: payload.lead ?? null,
    appointment,
    payment: payload.payment ?? null,
    deal,
    meta: payload.meta ?? null,
    stepOutputs: payload.stepOutputs ?? undefined,
    automationId,
    depth: payload.depth ?? 0,
    addedTags: payload.addedTags ?? payload.meta?.addedTags ?? [],
    removedTags: payload.removedTags ?? payload.meta?.removedTags ?? [],
    previousStage: payload.previousStage ?? payload.meta?.previousStage,
    newStage: payload.newStage ?? payload.meta?.newStage,
  };
}

// --- Import Enhanced Template Engine ---
import { 
  getFieldValue as getFieldValueEnhanced,
} from "./template-engine.ts";

// --- Condition Evaluator (GHL-grade operators) ---
function getFieldValue(context: Record<string, any>, path: string): any {
  return getFieldValueEnhanced(context, path);
}

function evaluateCondition(condition: AutomationCondition, context: Record<string, any>): boolean {
  const actual = getFieldValue(context, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    // === STRING OPERATORS ===
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "contains":
      if (typeof actual === "string") {
        return actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;
    case "not_contains":
      if (typeof actual === "string") {
        return !actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      return true;
    case "starts_with":
      return typeof actual === "string" && actual.toLowerCase().startsWith(String(expected).toLowerCase());
    case "ends_with":
      return typeof actual === "string" && actual.toLowerCase().endsWith(String(expected).toLowerCase());
    case "regex":
      try {
        return typeof actual === "string" && new RegExp(String(expected)).test(actual);
      } catch {
        return false;
      }

    // === NUMBER OPERATORS ===
    case "gt":
    case "greater_than":
      return Number(actual) > Number(expected);
    case "gte":
    case "greater_or_equal":
      return Number(actual) >= Number(expected);
    case "lt":
    case "less_than":
      return Number(actual) < Number(expected);
    case "lte":
    case "less_or_equal":
      return Number(actual) <= Number(expected);
    case "between":
      if (Array.isArray(expected) && expected.length === 2) {
        const num = Number(actual);
        return num >= Number(expected[0]) && num <= Number(expected[1]);
      }
      return false;

    // === DATE OPERATORS ===
    case "before":
      return new Date(actual) < new Date(String(expected));
    case "after":
      return new Date(actual) > new Date(String(expected));
    case "within_last_minutes": {
      const minAgo = new Date(Date.now() - Number(expected) * 60 * 1000);
      return new Date(actual) >= minAgo;
    }
    case "within_last_hours": {
      const hoursAgo = new Date(Date.now() - Number(expected) * 60 * 60 * 1000);
      return new Date(actual) >= hoursAgo;
    }
    case "within_last_days": {
      const daysAgo = new Date(Date.now() - Number(expected) * 24 * 60 * 60 * 1000);
      return new Date(actual) >= daysAgo;
    }
    case "after_now_minutes": {
      const futureTime = new Date(Date.now() + Number(expected) * 60 * 1000);
      return new Date(actual) > futureTime;
    }
    case "day_of_week_is": {
      const date = new Date(actual);
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      return dayNames[date.getDay()] === String(expected).toLowerCase();
    }
    case "month_is": {
      const date = new Date(actual);
      return (date.getMonth() + 1) === Number(expected);
    }
    case "date_before":
      return new Date(actual) < new Date(String(expected));
    case "date_after":
      return new Date(actual) > new Date(String(expected));
    case "date_within_days": {
      const daysAgo = new Date(Date.now() - Number(expected) * 24 * 60 * 60 * 1000);
      const dateValue = new Date(actual);
      return dateValue >= daysAgo && dateValue <= new Date();
    }
    case "date_past_days": {
      const daysAgo = new Date(Date.now() - Number(expected) * 24 * 60 * 60 * 1000);
      return new Date(actual) < daysAgo;
    }

    // === BOOLEAN OPERATORS ===
    case "is_true":
      return actual === true || actual === "true" || actual === 1;
    case "is_false":
      return actual === false || actual === "false" || actual === 0;

    // === ARRAY OPERATORS ===
    case "contains_any":
      return Array.isArray(actual) && Array.isArray(expected) && expected.some((e: any) => actual.includes(e));
    case "contains_all":
      return Array.isArray(actual) && Array.isArray(expected) && expected.every((e: any) => actual.includes(e));
    case "not_contains_any":
      return Array.isArray(actual) && Array.isArray(expected) && !expected.some((e: any) => actual.includes(e));
    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual);

    // === EXISTENCE OPERATORS ===
    case "is_set":
    case "exists":
      return actual !== null && actual !== undefined && actual !== "";
    case "is_not_set":
    case "is_empty":
      return actual === null || actual === undefined || actual === "";
    case "is_not_empty":
      if (Array.isArray(actual)) return actual.length > 0;
      return actual !== null && actual !== undefined && actual !== "";

    // === LEGACY OPERATORS ===
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "tag_present":
      // Alias for contains - check if tag array contains the expected value
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      if (typeof actual === "string") {
        return actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      return false;
    case "tag_absent":
      // Alias for not_contains - check if tag array does not contain the expected value
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      if (typeof actual === "string") {
        return !actual.toLowerCase().includes(String(expected).toLowerCase());
      }
      return true;

    default:
      console.warn(`[Automation] Unknown operator: ${condition.operator}`);
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

// --- Trigger Constraint Matching ---
// Checks if the event payload matches the trigger's configured constraints
// Returns { matches: boolean, reasons: string[] } for debugging
interface ConstraintCheckResult {
  matches: boolean;
  reasons: string[];
}

function matchesTriggerConstraints(
  triggerConfig: Record<string, any> | undefined,
  triggerType: TriggerType,
  context: AutomationContext,
): ConstraintCheckResult {
  const reasons: string[] = [];
  const config = triggerConfig || {};
  
  // No constraints = always matches
  if (Object.keys(config).length === 0) {
    return { matches: true, reasons: [] };
  }

  // --- APPOINTMENT TRIGGER CONSTRAINTS ---
  if (triggerType.startsWith("appointment_")) {
    const appointment = context.appointment;
    
    // Calendar ID constraint
    if (config.calendarId && config.calendarId.trim()) {
      const calendarMatch = appointment?.calendar_id === config.calendarId;
      if (!calendarMatch) {
        reasons.push(`calendar_id mismatch: expected "${config.calendarId}", got "${appointment?.calendar_id}"`);
      }
    }
    
    // Event Type Name constraint (case-insensitive partial match)
    if (config.eventTypeName && config.eventTypeName.trim()) {
      const eventName = (appointment?.event_type_name || "").toLowerCase();
      const configName = config.eventTypeName.toLowerCase();
      const eventMatch = eventName.includes(configName);
      if (!eventMatch) {
        reasons.push(`event_type_name mismatch: expected "${config.eventTypeName}", got "${appointment?.event_type_name}"`);
      }
    }
    
    // Closer ID constraint
    if (config.closerId && config.closerId.trim()) {
      const closerMatch = appointment?.closer_id === config.closerId;
      if (!closerMatch) {
        reasons.push(`closer_id mismatch: expected "${config.closerId}", got "${appointment?.closer_id}"`);
      }
    }
    
    // Appointment Type ID constraint
    if (config.appointmentTypeId && config.appointmentTypeId.trim()) {
      const typeMatch = appointment?.appointment_type_id === config.appointmentTypeId;
      if (!typeMatch) {
        reasons.push(`appointment_type_id mismatch: expected "${config.appointmentTypeId}", got "${appointment?.appointment_type_id}"`);
      }
    }
  }

  // --- TAG TRIGGER CONSTRAINTS ---
  if (triggerType === "lead_tag_added" || triggerType === "lead_tag_removed") {
    if (config.tag && config.tag.trim()) {
      // Check if the configured tag is in the addedTags/removedTags arrays from the payload
      // The SQL trigger sends addedTags/removedTags as arrays, and also includes meta.tag for single-tag events
      const eventTag = context.meta?.tag || context.meta?.tagName;
      const addedTags = (context.addedTags as string[]) || [];
      const removedTags = (context.removedTags as string[]) || [];
      
      // Check if config.tag matches the single tag in meta (if present) OR is in the arrays
      const configTagLower = config.tag.toLowerCase().trim();
      const tagMatch = 
        (eventTag && eventTag.toLowerCase() === configTagLower) ||
        addedTags.some(tag => tag.toLowerCase() === configTagLower) ||
        removedTags.some(tag => tag.toLowerCase() === configTagLower);
      
      if (!tagMatch) {
        reasons.push(`tag mismatch: expected "${config.tag}", got tags: [${addedTags.concat(removedTags).join(", ")}]`);
      }
    }
  }

  // --- FORM TRIGGER CONSTRAINTS ---
  if (triggerType === "form_submitted" || triggerType === "survey_submitted" || triggerType === "quiz_submitted") {
    if (config.funnelId && config.funnelId.trim()) {
      const funnelMatch = context.meta?.funnelId === config.funnelId || 
                          context.meta?.funnel_id === config.funnelId;
      if (!funnelMatch) {
        reasons.push(`funnel_id mismatch: expected "${config.funnelId}", got "${context.meta?.funnelId || context.meta?.funnel_id}"`);
      }
    }
    
    if (config.formId && config.formId.trim()) {
      const formMatch = context.meta?.formId === config.formId ||
                        context.meta?.form_id === config.formId;
      if (!formMatch) {
        reasons.push(`form_id mismatch: expected "${config.formId}", got "${context.meta?.formId || context.meta?.form_id}"`);
      }
    }
  }

  // --- PIPELINE/STAGE TRIGGER CONSTRAINTS ---
  if (triggerType === "stage_changed") {
    if (config.pipelineId && config.pipelineId.trim()) {
      const pipelineMatch = context.deal?.pipeline_id === config.pipelineId ||
                            context.meta?.pipelineId === config.pipelineId;
      if (!pipelineMatch) {
        reasons.push(`pipeline_id mismatch: expected "${config.pipelineId}", got "${context.deal?.pipeline_id || context.meta?.pipelineId}"`);
      }
    }
    
    if (config.fromStage && config.fromStage.trim()) {
      // Check meta.fromStage/meta.from_stage first, then fall back to top-level previousStage
      const fromMatch = 
        context.meta?.fromStage === config.fromStage ||
        context.meta?.from_stage === config.fromStage ||
        (context.previousStage as string) === config.fromStage;
      if (!fromMatch) {
        reasons.push(`from_stage mismatch: expected "${config.fromStage}", got "${context.meta?.fromStage || context.meta?.from_stage || context.previousStage}"`);
      }
    }
    
    if (config.toStage && config.toStage.trim()) {
      // Check meta.toStage/meta.to_stage first, then fall back to top-level newStage
      const toMatch = 
        context.meta?.toStage === config.toStage ||
        context.meta?.to_stage === config.toStage ||
        (context.newStage as string) === config.toStage;
      if (!toMatch) {
        reasons.push(`to_stage mismatch: expected "${config.toStage}", got "${context.meta?.toStage || context.meta?.to_stage || context.newStage}"`);
      }
    }
  }

  // --- PAYMENT TRIGGER CONSTRAINTS ---
  if (triggerType === "payment_received" || triggerType === "payment_failed") {
    if (config.paymentType && config.paymentType !== "any") {
      const paymentMatch = context.payment?.payment_type === config.paymentType ||
                           context.meta?.paymentType === config.paymentType;
      if (!paymentMatch) {
        reasons.push(`payment_type mismatch: expected "${config.paymentType}", got "${context.payment?.payment_type || context.meta?.paymentType}"`);
      }
    }
    
    if (config.productId && config.productId.trim()) {
      const productMatch = context.payment?.product_id === config.productId ||
                           context.meta?.productId === config.productId;
      if (!productMatch) {
        reasons.push(`product_id mismatch: expected "${config.productId}", got "${context.payment?.product_id || context.meta?.productId}"`);
      }
    }
  }

  // --- MESSAGING TRIGGER CONSTRAINTS ---
  if (triggerType === "customer_replied" || triggerType === "messaging_error") {
    if (config.channel && config.channel !== "any") {
      const channelMatch = context.meta?.channel === config.channel;
      if (!channelMatch) {
        reasons.push(`channel mismatch: expected "${config.channel}", got "${context.meta?.channel}"`);
      }
    }
  }

  return {
    matches: reasons.length === 0,
    reasons,
  };
}

// --- Get Automations from DB using Published Versions ---
async function getAutomationsForTrigger(
  supabase: any,
  teamId: string,
  triggerType: TriggerType,
): Promise<AutomationDefinition[]> {
  try {
    // First, get active automations with their current_version_id
    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select(`
        id,
        team_id,
        name,
        description,
        is_active,
        trigger_type,
        current_version_id,
        definition
      `)
      .eq("team_id", teamId)
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (automationsError) {
      console.error("[Automation Trigger] Error fetching automations:", automationsError);
      return [];
    }

    if (!automations || automations.length === 0) {
      console.log(`[Automation Trigger] No DB automations found for ${triggerType}`);
      return [];
    }

    console.log(`[Automation Trigger] Found ${automations.length} DB automations for ${triggerType}`);
    
    // For each automation, get the published version if it exists
    const results: AutomationDefinition[] = [];
    
    for (const row of automations) {
      let definitionToUse = row.definition || {};
      
      // If there's a published version, use that instead
      if (row.current_version_id) {
        const { data: version, error: versionError } = await supabase
          .from("workflow_versions")
          .select("definition_json")
          .eq("id", row.current_version_id)
          .eq("is_active", true)
          .single();
        
        if (!versionError && version?.definition_json) {
          console.log(`[Automation Trigger] Using published version for "${row.name}"`);
          definitionToUse = version.definition_json;
        } else {
          console.log(`[Automation Trigger] Falling back to draft definition for "${row.name}"`);
        }
      } else {
        console.log(`[Automation Trigger] No published version for "${row.name}", using draft`);
      }
      
      results.push({
        id: row.id,
        teamId: row.team_id,
        name: row.name,
        description: row.description || "",
        isActive: row.is_active,
        trigger: definitionToUse.trigger || { type: row.trigger_type, config: {} },
        triggerType: row.trigger_type as TriggerType,
        steps: definitionToUse.steps || [],
      } as AutomationDefinition);
    }
    
    return results;
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error fetching automations:", err);
    return [];
  }
}

/**
 * Fetch a single automation by ID for targeted execution (e.g. manual trigger "Run Now").
 * Retrieves the published version if available, otherwise falls back to draft definition.
 */
async function getSpecificAutomation(
  supabase: any,
  automationId: string,
): Promise<AutomationDefinition[]> {
  try {
    const { data: row, error } = await supabase
      .from("automations")
      .select(`
        id,
        team_id,
        name,
        description,
        is_active,
        trigger_type,
        current_version_id,
        definition
      `)
      .eq("id", automationId)
      .single();

    if (error || !row) {
      console.error("[Automation Trigger] Error fetching specific automation:", error);
      return [];
    }

    let definitionToUse = row.definition || {};

    // If there's a published version, use that instead
    if (row.current_version_id) {
      const { data: version, error: versionError } = await supabase
        .from("workflow_versions")
        .select("definition_json")
        .eq("id", row.current_version_id)
        .eq("is_active", true)
        .single();

      if (!versionError && version?.definition_json) {
        console.log(`[Automation Trigger] Using published version for targeted run of "${row.name}"`);
        definitionToUse = version.definition_json;
      } else {
        console.log(`[Automation Trigger] Falling back to draft for targeted run of "${row.name}"`);
      }
    }

    console.log(`[Automation Trigger] Targeted execution: automation "${row.name}" (${automationId})`);

    return [{
      id: row.id,
      teamId: row.team_id,
      name: row.name,
      description: row.description || "",
      isActive: row.is_active,
      trigger: definitionToUse.trigger || { type: row.trigger_type, config: {} },
      triggerType: row.trigger_type as TriggerType,
      steps: definitionToUse.steps || [],
    } as AutomationDefinition];
  } catch (err) {
    console.error("[Automation Trigger] Unexpected error fetching specific automation:", err);
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
): Promise<{ alreadyRan: boolean; existingRunId?: string; error?: string }> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Query for existing run with matching automationKey AND eventId in context_snapshot
      const { data, error } = await supabase
        .from("automation_runs")
        .select("id")
        .eq("team_id", teamId)
        .eq("trigger_type", triggerType)
        .filter("context_snapshot->>'eventId'", "eq", eventId)
        .filter("context_snapshot->>'automationKey'", "eq", automationKey)
        .limit(1);

      if (error) {
        console.error(`[Automation Trigger] Idempotency check failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        // Retry with exponential backoff: 100ms, 200ms, 400ms
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        // Final attempt failed — fail CLOSED to prevent duplicates
        return { alreadyRan: true, error: "Idempotency check failed after retries" };
      }

      if (data && data.length > 0) {
        return { alreadyRan: true, existingRunId: data[0].id };
      }

      return { alreadyRan: false };
    } catch (err) {
      console.error(`[Automation Trigger] Idempotency check exception (attempt ${attempt + 1}/${MAX_RETRIES}):`, err);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      // Final attempt failed — fail CLOSED on exception as well
      return { alreadyRan: true, error: "Idempotency check exception after retries" };
    }
  }

  // Should never reach here, but fail closed as safety net
  return { alreadyRan: true, error: "Idempotency check exhausted retries" };
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

    // Use upsert with ignoreDuplicates to handle the unique constraint on
    // (team_id, trigger_type, automationKey, eventId). If a duplicate exists,
    // the insert is silently skipped, preventing race condition duplicates.
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
      // Check if this is a unique constraint violation (duplicate run)
      if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
        console.log(`[Automation Trigger] Duplicate run prevented by DB constraint for event ${params.eventId}`);
        return null; // Return null to signal duplicate, caller should skip
      }
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

// --- Run Automation with Branching Support ---
async function runAutomation(
  automation: AutomationDefinition,
  context: AutomationContext,
  supabase: any,
  runId: string,
  eventPayload?: Record<string, any>,
): Promise<StepExecutionLog[]> {
  const logs: StepExecutionLog[] = [];
  const steps = automation.steps.sort((a, b) => a.order - b.order);
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const visitedSteps = new Set<string>();
  const triggeredGoalIds = new Set<string>(); // Prevent goal redirect infinite loops
  const maxSteps = 100; // Prevent infinite loops
  const goalRedirectCounts = new Map<string, number>(); // Per-goal redirect counters
  const MAX_GOAL_REDIRECTS = 5; // Max redirects per individual goal

  // Abort controller for cancelling in-flight retries when automation is deactivated
  const abortController = new AbortController();

  // Check if this is a scheduled resume (from process-scheduled-jobs)
  const isScheduledResume = eventPayload?.isScheduledResume === true;
  const resumeFromStep = eventPayload?.resumeFromStep as string | undefined;

  // Log if resuming from scheduled job
  // Note: Context is already restored via buildAutomationContext since process-scheduled-jobs
  // spreads context_snapshot directly into eventPayload (not nested)
  if (isScheduledResume) {
    console.log(`[Automation] Resuming from scheduled job, step: ${resumeFromStep}`);

    // Refresh entity data from database (may have changed during delay/wait)
    if (context.lead?.id) {
      const { data: freshLead } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", context.lead.id)
        .maybeSingle();
      if (freshLead) {
        console.log(`[Automation] Refreshed lead context for ${context.lead.id}`);
        context.lead = freshLead;
      }
    }
    if (context.appointment?.id || context.deal?.id) {
      const apptId = context.appointment?.id || context.deal?.id;
      const { data: freshAppt } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", apptId)
        .maybeSingle();
      if (freshAppt) {
        console.log(`[Automation] Refreshed appointment context for ${apptId}`);
        context.appointment = freshAppt;
        context.deal = freshAppt;
      }
    }
  }

  console.log(`[Automation] Running "${automation.name}" (${automation.id}) with ${steps.length} steps`);

  // Start from resume step (scheduled resume) or first step
  let currentStepId: string | null = resumeFromStep || steps[0]?.id || null;

  while (currentStepId && logs.length < maxSteps) {
    // Check if automation was deactivated (abort in-flight retries)
    if (abortController.signal.aborted) {
      console.log(`[Automation] Workflow ${automation.id} aborted, stopping execution`);
      break;
    }

    // Check automation status periodically (every step) to detect deactivation
    try {
      const { data: automationStatus } = await supabase
        .from("automations")
        .select("is_active")
        .eq("id", automation.id)
        .maybeSingle();

      if (automationStatus && !automationStatus.is_active) {
        console.log(`[Automation] Workflow ${automation.id} deactivated mid-execution, aborting`);
        abortController.abort();
        break;
      }
    } catch {
      // If status check fails, continue execution (fail-open)
    }

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

    // Skip disabled steps (like GHL's enable/disable toggle)
    if (step.enabled === false) {
      console.log(`[Automation] Skipping disabled step ${step.id} (${step.type})`);
      logs.push({
        stepId: step.id,
        actionType: step.type,
        status: "skipped",
        skipReason: "step_disabled",
        timestamp: new Date().toISOString(),
      });
      // Move to next step in order
      const currentIndex = steps.findIndex((s) => s.id === currentStepId);
      currentStepId = currentIndex < steps.length - 1 ? steps[currentIndex + 1].id : null;
      continue;
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
        case "send_message":
        case "send_sms": {
          // Check rate limit first
          const smsChannel = step.config.channel || "sms";
          const smsRateCheck = await checkRateLimit(supabase, context.teamId, smsChannel, automation.id);
          
          if (!smsRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = smsRateCheck.reason || "rate_limit_exceeded";
            break;
          }

          const smsConfig = { ...step.config, channel: step.config.channel || "sms" };
          const { log: smsRetryLog } = await executeWithRetry(
            supabase, runId, step.id, step.type as any, step.config,
            () => executeSendMessage(smsConfig, context, supabase, runId, automation.id),
            RETRY_POLICIES.send_sms,
            abortController.signal,
          );
          log = { ...log, ...smsRetryLog };
          break;
        }

        case "send_email": {
          const emailRateCheck = await checkRateLimit(supabase, context.teamId, "email", automation.id);
          
          if (!emailRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = emailRateCheck.reason || "rate_limit_exceeded";
            break;
          }

          const emailConfig = { ...step.config, channel: "email" as const };
          const { log: emailRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "send_email", step.config,
            () => executeSendMessage(emailConfig, context, supabase, runId, automation.id),
            RETRY_POLICIES.send_email,
            abortController.signal,
          );
          log = { ...log, ...emailRetryLog };
          break;
        }

        case "send_whatsapp": {
          const waRateCheck = await checkRateLimit(supabase, context.teamId, "whatsapp", automation.id);
          
          if (!waRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = waRateCheck.reason || "rate_limit_exceeded";
            break;
          }

          const waConfig = { ...step.config, channel: "whatsapp" as const };
          const { log: waRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "send_whatsapp", step.config,
            () => executeSendMessage(waConfig, context, supabase, runId, automation.id),
            RETRY_POLICIES.send_whatsapp,
            abortController.signal,
          );
          log = { ...log, ...waRetryLog };
          break;
        }

        case "enqueue_dialer": {
          // Use voice channel for dialer
          const dialerRateCheck = await checkRateLimit(supabase, context.teamId, "voice", automation.id);
          if (!dialerRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = dialerRateCheck.reason || "rate_limit_exceeded";
            break;
          }
          
          const dialerConfig = {
            ...step.config,
            channel: "voice" as const,
          };
          const { log: dialerRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "enqueue_dialer" as any, step.config,
            () => executeSendMessage(dialerConfig, context, supabase, runId, automation.id),
            RETRY_POLICIES.make_call,
            abortController.signal,
          );
          log = { ...log, ...dialerRetryLog, channel: "voice", provider: "power_dialer" };
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
          // Use executeWaitUntil for full support of before_appointment mode and other wait types
          const result = await executeWaitUntil(
            step.config as any,
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
            shouldStop = true;
          } else if (result.error) {
            log.status = "error";
            log.error = result.error;
          } else {
            // Already past the wait time, continue immediately
            log.status = "success";
            log.output = { resumeAt: result.resumeAt, immediate: true };
          }
          break;
        }

        case "business_hours": {
          const timezone = (step.config.timezone as string) || "America/New_York";
          const { withinHours, nextOpenTime } = await isWithinBusinessHours(supabase, context.teamId, timezone);
          
          if (!withinHours && nextOpenTime) {
            // Schedule to resume at next business hours open time
            // Uses nextOpenTime from the DB-aware rate-limiter (team_business_hours table)
            try {
              const { data: scheduledJob, error: scheduleError } = await supabase
                .from("scheduled_automation_jobs")
                .insert([{
                  team_id: context.teamId,
                  automation_id: automation.id,
                  run_id: runId,
                  step_id: step.id,
                  resume_at: nextOpenTime,
                  status: "pending",
                  context_snapshot: {
                    ...context,
                    remainingSteps: steps.filter((s) => s.order > step.order).map((s) => s.id),
                  },
                }])
                .select("id")
                .single();

              log.status = "success";
              log.output = {
                withinHours,
                resumeAt: nextOpenTime,
                scheduled: !scheduleError,
                jobId: scheduledJob?.id,
              };
            } catch (schedErr) {
              log.status = "error";
              log.error = schedErr instanceof Error ? schedErr.message : "Failed to schedule business hours resume";
              log.output = { withinHours, resumeAt: nextOpenTime };
            }
            shouldStop = true;
          } else {
            // Within business hours or no next open time — continue immediately
            log.status = "success";
            log.output = { withinHours };
          }
          break;
        }

        // === CRM ACTIONS ===
        case "add_tag": {
          const result = await executeAddTag(step.config, context, supabase);
          log = { ...log, ...result };
          // Refresh lead context with updated tags so downstream steps see the change
          if (result.status === "success" && context.lead?.id) {
            const { data: refreshedLead, error: refreshError } = await supabase
              .from("contacts")
              .select("*")
              .eq("id", context.lead.id)
              .maybeSingle();
            if (refreshError) {
              console.warn("[Automation] Context refresh failed after add_tag:", refreshError);
            }
            if (refreshedLead) {
              context.lead = refreshedLead;
            } else if (!refreshError) {
              console.warn("[Automation] Contact deleted during workflow (add_tag), continuing with stale data");
            }
          }
          break;
        }

        case "remove_tag": {
          const result = await executeRemoveTag(step.config, context, supabase);
          log = { ...log, ...result };
          // Refresh lead context with updated tags so downstream steps see the change
          if (result.status === "success" && context.lead?.id) {
            const { data: refreshedLead, error: refreshError } = await supabase
              .from("contacts")
              .select("*")
              .eq("id", context.lead.id)
              .maybeSingle();
            if (refreshError) {
              console.warn("[Automation] Context refresh failed after remove_tag:", refreshError);
            }
            if (refreshedLead) {
              context.lead = refreshedLead;
            } else if (!refreshError) {
              console.warn("[Automation] Contact deleted during workflow (remove_tag), continuing with stale data");
            }
          }
          break;
        }

        case "create_contact": {
          const result = await executeCreateContact(step.config, context, supabase);
          log = { ...log, ...result };
          // Fetch full contact data so downstream steps have complete context
          // (tags, custom_fields, name, etc.) instead of just the ID
          if (result.status === "success" && result.output?.contactId) {
            const { data: fullContact, error: fetchError } = await supabase
              .from("contacts")
              .select("*")
              .eq("id", result.output.contactId)
              .maybeSingle();
            if (fetchError) {
              console.warn("[Automation] Failed to fetch created contact for context refresh:", fetchError);
            }
            if (fullContact) {
              context.lead = fullContact;
            } else {
              context.lead = { ...context.lead, id: result.output.contactId };
            }
          }
          break;
        }

        case "update_contact": {
          const result = await executeUpdateContact(step.config, context, supabase);
          log = { ...log, ...result };

          // Refresh context after update so downstream steps use fresh data
          if (result.status === "success" && context.lead?.id) {
            const { data: updatedLead, error: refreshError } = await supabase
              .from("contacts")
              .select("*")
              .eq("id", context.lead.id)
              .maybeSingle();
            if (refreshError) {
              console.warn("[Automation] Context refresh failed after update_contact:", refreshError);
            }
            if (updatedLead) {
              context.lead = updatedLead;
            } else if (!refreshError) {
              console.warn("[Automation] Contact deleted during workflow (update_contact), continuing with stale data");
            }
          }
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

          // Refresh context after owner assignment so downstream steps use fresh data
          if (result.status === "success") {
            const entity = (step.config.entity as string) || "lead";
            if (entity === "lead" && context.lead?.id) {
              const { data: updatedLead, error: refreshError } = await supabase
                .from("contacts")
                .select("*")
                .eq("id", context.lead.id)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after assign_owner (lead):", refreshError);
              }
              if (updatedLead) {
                context.lead = updatedLead;
              } else if (!refreshError) {
                console.warn("[Automation] Contact deleted during workflow (assign_owner), continuing with stale data");
              }
            } else if ((entity === "deal" || entity === "appointment") && (context.deal?.id || context.appointment?.id)) {
              // NOTE: Deals and appointments share the `appointments` table in this schema.
              // context.deal and context.appointment are separate views of the same underlying row,
              // differentiated by type/status fields. Both are refreshed from the same table.
              const dealId = context.deal?.id || context.appointment?.id;
              const { data: updatedDeal, error: refreshError } = await supabase
                .from("appointments")
                .select("*")
                .eq("id", dealId)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after assign_owner (deal):", refreshError);
              }
              if (updatedDeal) {
                if (context.deal) context.deal = updatedDeal;
                if (context.appointment) context.appointment = updatedDeal;
              } else if (!refreshError) {
                console.warn("[Automation] Deal/appointment deleted during workflow (assign_owner), continuing with stale data");
              }
            }
          }
          break;
        }

        case "update_stage": {
          const result = await executeUpdateStage(step.config, context, supabase);
          log = { ...log, ...result };

          // Refresh context after stage update so downstream steps use fresh data
          if (result.status === "success") {
            const entity = (step.config.entity as string) || "lead";
            if (entity === "lead" && context.lead?.id) {
              const { data: updatedLead, error: refreshError } = await supabase
                .from("contacts")
                .select("*")
                .eq("id", context.lead.id)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after update_stage (lead):", refreshError);
              }
              if (updatedLead) {
                context.lead = updatedLead;
              } else if (!refreshError) {
                console.warn("[Automation] Contact deleted during workflow (update_stage), continuing with stale data");
              }
            } else if ((entity === "deal" || entity === "appointment") && (context.deal?.id || context.appointment?.id)) {
              // NOTE: Deals share the `appointments` table — see assign_owner case above.
              const dealId = context.deal?.id || context.appointment?.id;
              const { data: updatedDeal, error: refreshError } = await supabase
                .from("appointments")
                .select("*")
                .eq("id", dealId)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after update_stage (deal):", refreshError);
              }
              if (updatedDeal) {
                if (context.deal) context.deal = updatedDeal;
                if (context.appointment) context.appointment = updatedDeal;
              } else if (!refreshError) {
                console.warn("[Automation] Deal/appointment deleted during workflow (update_stage), continuing with stale data");
              }
            }
          }
          break;
        }

        // === WORKFLOW ACTIONS ===
        case "add_task": {
          const result = await executeAddTask(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "notify_team": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "notification", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
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
          const { log: webhookRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "custom_webhook", step.config,
            () => executeCustomWebhook(step.config, context),
            RETRY_POLICIES.custom_webhook,
            abortController.signal,
          );
          log = { ...log, ...webhookRetryLog };
          break;
        }

        case "slack_message": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "slack", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: slackRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "slack_message", step.config,
            () => executeSlackMessage(step.config, context, supabase),
            RETRY_POLICIES.slack_message,
            abortController.signal,
          );
          log = { ...log, ...slackRetryLog };
          break;
        }

        case "discord_message": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "discord", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: discordRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "discord_message", step.config,
            () => executeDiscordMessage(step.config, context, supabase),
            RETRY_POLICIES.discord_message,
            abortController.signal,
          );
          log = { ...log, ...discordRetryLog };
          break;
        }

        case "google_conversion": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "google_ads", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: gadsRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "google_conversion", step.config,
            () => executeGoogleAdsConversion(step.config, context, supabase),
            RETRY_POLICIES.google_conversion,
            abortController.signal,
          );
          log = { ...log, ...gadsRetryLog };
          break;
        }

        case "tiktok_event": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "tiktok", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: tiktokRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "tiktok_event", step.config,
            () => executeTikTokEvent(step.config, context, supabase),
            RETRY_POLICIES.tiktok_event,
            abortController.signal,
          );
          log = { ...log, ...tiktokRetryLog };
          break;
        }

        case "meta_conversion": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "meta", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: metaRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "meta_conversion", step.config,
            () => executeMetaConversion(step.config, context, supabase),
            RETRY_POLICIES.meta_conversion,
            abortController.signal,
          );
          log = { ...log, ...metaRetryLog };
          break;
        }

        case "google_sheets": {
          const rateCheck = await checkRateLimit(supabase, context.teamId, "google_sheets", automation.id);
          if (!rateCheck.allowed) {
            log.skipped = true;
            log.skipReason = rateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: gsheetsRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "google_sheets", step.config,
            () => executeGoogleSheets(step.config as any, context, supabase),
            RETRY_POLICIES.google_sheets,
            abortController.signal,
          );
          log = { ...log, ...gsheetsRetryLog };
          break;
        }

        case "run_workflow": {
          // Check recursion depth to prevent infinite loops
          const currentDepth = context.depth ?? 0;
          const maxDepth = 5;
          
          if (currentDepth >= maxDepth) {
            log.status = "skipped";
            log.skipReason = `recursion_depth_exceeded:${currentDepth}>=${maxDepth}`;
            log.error = `Maximum recursion depth (${maxDepth}) exceeded. This workflow would trigger another workflow, creating a potential infinite loop.`;
            break;
          }
          
          // Pass incremented depth to the nested workflow
          const nestedContext = { ...context, depth: currentDepth + 1 };
          const result = await executeRunWorkflow(step.config, nestedContext, supabase);
          log = { ...log, ...result };
          break;
        }

        case "goal_achieved": {
          // Mark a goal/conversion as achieved for analytics and tracking.
          // Logs the goal event in activity_logs and can optionally stop the workflow.
          const goalName = (step.config?.goalName as string) || (step.config?.name as string) || "Unnamed Goal";
          const goalValue = step.config?.goalValue ?? step.config?.value ?? null;
          const stopOnGoal = step.config?.stopWorkflow ?? step.config?.stopOnGoal ?? step.config?.exitOnGoal ?? false;

          try {
            const leadId = context.lead?.id || null;
            const teamId = context.teamId;
            const appointmentId = context.appointment?.id || context.deal?.id || null;

            // Log goal achievement in activity_logs
            // Schema requires: team_id, action_type, actor_name, appointment_id
            // Optional: note, actor_id
            if (appointmentId) {
              const { error: logError } = await supabase.from("activity_logs").insert({
                team_id: teamId,
                appointment_id: appointmentId,
                action_type: "goal_achieved",
                actor_name: "Automation",
                note: `Goal achieved: ${goalName}${goalValue != null ? ` (value: ${goalValue})` : ""}`,
              });

              if (logError) {
                console.warn("[Automation] Failed to log goal achievement to activity_logs:", logError);
                // Don't fail the step — goal tracking in step output still works
              }
            } else {
              console.log(`[Automation] Goal "${goalName}" achieved but no appointment_id — skipping activity_log (no FK target)`);
            }

            log.status = "success";
            log.output = {
              goalName,
              goalValue,
              contactId: leadId,
              achievedAt: new Date().toISOString(),
            };

            // Optionally stop the workflow after goal is achieved
            if (stopOnGoal) {
              shouldStop = true;
              log.output.stoppedWorkflow = true;
            }
          } catch (goalError) {
            console.error("[Automation] Error recording goal:", goalError);
            log.status = "error";
            log.error = goalError instanceof Error ? goalError.message : "Failed to record goal";
          }
          break;
        }

        case "stop_workflow": {
          const result = executeStopWorkflow(step.config, context);
          log.status = "success";
          log.output = { reason: result.reason };
          shouldStop = true;
          break;
        }

        case "go_to": {
          const result = executeGoTo(step.config);
          if (result) {
            // Validate that the target step exists before jumping
            const targetExists = automation.steps.some((s: any) => s.id === result.jumpTo);
            if (!targetExists) {
              log.status = "error";
              log.error = `go_to target step "${result.jumpTo}" not found in automation`;
              console.warn(`[Automation] go_to target step "${result.jumpTo}" does not exist`);
            } else {
              nextStepId = result.jumpTo;
              log.status = "success";
              log.output = { jumpTo: result.jumpTo };
            }
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

        // === DEAL ACTIONS ===
        // Architecture note: Deals and appointments share the `appointments` table.
        // context.deal and context.appointment may reference the same row.
        // When refreshing deal context after mutations, we query `appointments`.
        case "create_deal": {
          const result = await executeCreateDeal(step.config, context, supabase);
          log = { ...log, ...result };
          // Fetch full deal/appointment data so downstream steps have complete context
          if (result.status === "success" && result.output?.dealId) {
            const { data: fullDeal, error: fetchError } = await supabase
              .from("appointments")
              .select("*")
              .eq("id", result.output.dealId)
              .maybeSingle();
            if (fetchError) {
              console.warn("[Automation] Failed to fetch created deal for context refresh:", fetchError);
            }
            if (fullDeal) {
              context.deal = fullDeal;
              context.appointment = fullDeal;
            } else {
              context.deal = { id: result.output.dealId, ...result.output };
            }
          }
          break;
        }

        case "close_deal": {
          const result = await executeCloseDeal(step.config, context, supabase);
          log = { ...log, ...result };

          // Refresh deal/appointment context after closing
          // NOTE: Deals share the `appointments` table — see assign_owner case.
          if (result.status === "success") {
            const dealId = context.deal?.id || context.appointment?.id;
            if (dealId) {
              const { data: updatedDeal, error: refreshError } = await supabase
                .from("appointments")
                .select("*")
                .eq("id", dealId)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after close_deal:", refreshError);
              }
              if (updatedDeal) {
                if (context.deal) context.deal = updatedDeal;
                if (context.appointment) context.appointment = updatedDeal;
              } else if (!refreshError) {
                console.warn("[Automation] Deal deleted during workflow (close_deal), continuing with stale data");
              }
            }
          }
          break;
        }

        // === STRIPE PAYMENT ACTIONS ===
        case "send_invoice": {
          const { log: invoiceRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "send_invoice", step.config,
            () => executeSendInvoice(step.config, context, supabase),
            RETRY_POLICIES.send_invoice,
            abortController.signal,
          );
          log = { ...log, ...invoiceRetryLog };
          break;
        }

        case "charge_payment": {
          const { log: paymentRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "charge_payment", step.config,
            () => executeChargePayment(step.config, context, supabase),
            RETRY_POLICIES.charge_payment,
            abortController.signal,
          );
          log = { ...log, ...paymentRetryLog };
          break;
        }

        case "create_subscription": {
          const { log: subRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "create_subscription", step.config,
            () => executeCreateSubscription(step.config, context, supabase),
            RETRY_POLICIES.create_subscription,
            abortController.signal,
          );
          log = { ...log, ...subRetryLog };
          break;
        }

        case "cancel_subscription": {
          const { log: cancelSubRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "cancel_subscription", step.config,
            () => executeCancelSubscription(step.config, context, supabase),
            RETRY_POLICIES.cancel_subscription,
            abortController.signal,
          );
          log = { ...log, ...cancelSubRetryLog };
          break;
        }

        // === VOICE ACTIONS ===
        case "send_voicemail": {
          const vmRateCheck = await checkRateLimit(supabase, context.teamId, "voice", automation.id);
          if (!vmRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = vmRateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: vmRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "send_voicemail", step.config,
            () => executeSendVoicemail(step.config, context, supabase),
            RETRY_POLICIES.send_voicemail,
            abortController.signal,
          );
          log = { ...log, ...vmRetryLog };
          break;
        }

        case "make_call": {
          const callRateCheck = await checkRateLimit(supabase, context.teamId, "voice", automation.id);
          if (!callRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = callRateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: callRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "make_call", step.config,
            () => executeMakeCall(step.config, context, supabase),
            RETRY_POLICIES.make_call,
            abortController.signal,
          );
          log = { ...log, ...callRetryLog };
          break;
        }

        // === APPOINTMENT ACTIONS ===
        case "book_appointment": {
          const bookResult = await executeBookAppointment(step.config, context, supabase);
          log = { ...log, ...bookResult };
          // Fetch full appointment data so downstream steps have complete context
          if (bookResult.status === "success" && bookResult.output?.appointmentId) {
            const { data: fullAppointment, error: fetchError } = await supabase
              .from("appointments")
              .select("*")
              .eq("id", bookResult.output.appointmentId)
              .maybeSingle();
            if (fetchError) {
              console.warn("[Automation] Failed to fetch created appointment for context refresh:", fetchError);
            }
            if (fullAppointment) {
              context.appointment = fullAppointment;
              context.deal = fullAppointment;
            } else {
              context.appointment = { id: bookResult.output.appointmentId, ...bookResult.output };
            }
          }
          break;
        }

        case "update_appointment": {
          const updateApptResult = await executeUpdateAppointment(step.config, context, supabase);
          log = { ...log, ...updateApptResult };

          // Refresh context after update so downstream steps use fresh data
          if (updateApptResult.status === "success" && context.appointment?.id) {
            const { data: updatedAppointment, error: refreshError } = await supabase
              .from("appointments")
              .select("*")
              .eq("id", context.appointment.id)
              .maybeSingle();
            if (refreshError) {
              console.warn("[Automation] Context refresh failed after update_appointment:", refreshError);
            }
            if (updatedAppointment) {
              context.appointment = updatedAppointment;
            } else if (!refreshError) {
              console.warn("[Automation] Appointment deleted during workflow (update_appointment), continuing with stale data");
            }
          }
          break;
        }

        case "cancel_appointment": {
          const cancelApptResult = await executeCancelAppointment(step.config, context, supabase);
          log = { ...log, ...cancelApptResult };
          break;
        }

        case "create_booking_link": {
          const linkResult = await executeCreateBookingLink(step.config, context, supabase);
          log = { ...log, ...linkResult };
          break;
        }

        case "log_call": {
          const logCallResult = await executeLogCall(step.config, context, supabase);
          log = { ...log, ...logCallResult };
          break;
        }

        // === MARKETING ACTIONS ===
        case "send_review_request": {
          const reviewRateCheck = await checkRateLimit(supabase, context.teamId, "sms", automation.id);
          if (!reviewRateCheck.allowed) {
            log.skipped = true;
            log.skipReason = reviewRateCheck.reason || "rate_limit_exceeded";
            break;
          }
          const { log: reviewRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "send_review_request" as any, step.config,
            () => executeSendReviewRequest(step.config, context, supabase, runId || undefined, automation.id),
            RETRY_POLICIES.send_review_request,
            abortController.signal,
          );
          log = { ...log, ...reviewRetryLog };
          break;
        }

        case "reply_in_comments": {
          const { log: replyRetryLog } = await executeWithRetry(
            supabase, runId, step.id, "reply_in_comments" as any, step.config,
            () => executeReplyInComments(step.config, context, supabase),
            RETRY_POLICIES.reply_in_comments,
            abortController.signal,
          );
          log = { ...log, ...replyRetryLog };
          break;
        }

        // === CRM LOOKUP & MANAGEMENT ACTIONS ===
        case "find_contact": {
          const result = await executeFindContact(step.config, context, supabase);
          log = { ...log, ...result };
          // Only update the trigger contact if the config explicitly opts in.
          // GHL requires a "Update trigger contact" flag — without it, downstream
          // steps would silently operate on the wrong contact.
          if (result.output?.found && result.output?.contact && step.config.updateTriggerContact) {
            context.lead = result.output.contact;
          }
          break;
        }

        case "delete_contact": {
          const result = await executeDeleteContact(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "remove_owner": {
          const result = await executeRemoveOwner(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "toggle_dnd": {
          const result = await executeToggleDnd(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "update_deal": {
          const result = await executeUpdateDeal(step.config, context, supabase);
          log = { ...log, ...result };
          // Refresh deal context after update
          // NOTE: Deals share the `appointments` table — see assign_owner case.
          if (result.status === "success") {
            const dealId = context.deal?.id || context.appointment?.id;
            if (dealId) {
              const { data: updatedDeal, error: refreshError } = await supabase
                .from("appointments")
                .select("*")
                .eq("id", dealId)
                .maybeSingle();
              if (refreshError) {
                console.warn("[Automation] Context refresh failed after update_deal:", refreshError);
              }
              if (updatedDeal) {
                if (context.deal) context.deal = updatedDeal;
                if (context.appointment) context.appointment = updatedDeal;
              } else if (!refreshError) {
                console.warn("[Automation] Deal deleted during workflow (update_deal), continuing with stale data");
              }
            }
          }
          break;
        }

        // === VARIABLE & WORKFLOW MANAGEMENT ACTIONS ===
        case "set_variable": {
          const result = await executeSetVariable(step.config, context);
          log = { ...log, ...result };
          // Store in a unified "variables" namespace so downstream steps can use
          // {{stepOutputs.variables.myVarName}} for clean named access
          if (result.output?.name && result.status === "success") {
            context.stepOutputs = context.stepOutputs || {};
            context.stepOutputs["variables"] = context.stepOutputs["variables"] || {};
            context.stepOutputs["variables"][result.output.name] = result.output.value;
          }
          break;
        }

        case "add_to_workflow": {
          const result = await executeAddToWorkflow(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "remove_from_workflow": {
          const result = await executeRemoveFromWorkflow(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        case "remove_from_all_workflows": {
          const result = await executeRemoveFromAllWorkflows(step.config, context, supabase, automation.id);
          log = { ...log, ...result };
          break;
        }

        // === DATA TRANSFORM ACTIONS ===
        case "format_date": {
          const result = await executeFormatDate(step.config, context);
          log = { ...log, ...result };
          if (result.output?.variableName && result.status === "success") {
            context.stepOutputs = context.stepOutputs || {};
            context.stepOutputs["variables"] = context.stepOutputs["variables"] || {};
            context.stepOutputs["variables"][result.output.variableName] = result.output.formatted;
          }
          break;
        }

        case "format_number": {
          const result = await executeFormatNumber(step.config, context);
          log = { ...log, ...result };
          if (result.output?.variableName && result.status === "success") {
            context.stepOutputs = context.stepOutputs || {};
            context.stepOutputs["variables"] = context.stepOutputs["variables"] || {};
            context.stepOutputs["variables"][result.output.variableName] = result.output.formatted;
          }
          break;
        }

        case "format_text": {
          const result = await executeFormatText(step.config, context);
          log = { ...log, ...result };
          if (result.output?.variableName && result.status === "success") {
            context.stepOutputs = context.stepOutputs || {};
            context.stepOutputs["variables"] = context.stepOutputs["variables"] || {};
            context.stepOutputs["variables"][result.output.variableName] = result.output.result;
          }
          break;
        }

        case "math_operation": {
          const result = await executeMathOperation(step.config, context);
          log = { ...log, ...result };
          if (result.output?.variableName && result.status === "success") {
            context.stepOutputs = context.stepOutputs || {};
            context.stepOutputs["variables"] = context.stepOutputs["variables"] || {};
            context.stepOutputs["variables"][result.output.variableName] = result.output.result;
          }
          break;
        }

        // === OPPORTUNITY ACTIONS ===
        case "find_opportunity": {
          const result = await executeFindOpportunity(step.config, context, supabase);
          log = { ...log, ...result };
          // Update context with found deal for downstream steps
          if (result.output?.found && result.output?.deal) {
            context.deal = result.output.deal;
            context.appointment = result.output.deal;
          }
          break;
        }

        case "remove_opportunity": {
          const result = await executeRemoveOpportunity(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        // === COPY CONTACT ===
        case "copy_contact": {
          const result = await executeCopyContact(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        // === FOLLOWER ACTIONS (infrastructure pending) ===
        case "add_followers": {
          const result = await executeAddFollowers(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "remove_followers": {
          const result = await executeRemoveFollowers(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        // === AI ACTIONS (require OpenAI API key) ===
        case "ai_intent": {
          const result = await executeAiIntent(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "ai_decision": {
          const result = await executeAiDecision(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "ai_translate": {
          const result = await executeAiTranslate(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "ai_summarize": {
          const result = await executeAiSummarize(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "ai_message": {
          const result = await executeAiMessage(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

        // === AUDIENCE ACTIONS (require Facebook Marketing API) ===
        case "add_to_audience": {
          const result = await executeAddToAudience(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }
        case "remove_from_audience": {
          const result = await executeRemoveFromAudience(step.config, context, supabase);
          log = { ...log, ...result };
          break;
        }

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

    // Store step outputs in context for downstream template access
    // Enables: {{stepOutputs.step_id.fieldName}} in templates
    if (log.output && typeof log.output === "object") {
      context.stepOutputs = context.stepOutputs || {};
      context.stepOutputs[step.id] = log.output;
    }

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

    // Real-time goal checking between steps
    // GHL checks goals after each step, not just at the end.
    // Track which goals have already fired to prevent infinite redirect loops
    // when goToStepId is used (the goal condition may remain true after jumping).
    if (!triggeredGoalIds.has("*")) {
      const midRunGoalCheck = await checkGoals(supabase, automation.id, context);
      if (midRunGoalCheck.goalMet && midRunGoalCheck.goal && !triggeredGoalIds.has(midRunGoalCheck.goal.id)) {
        console.log(`[Automation] Goal "${midRunGoalCheck.goal.name}" met after step ${step.id}`);
        triggeredGoalIds.add(midRunGoalCheck.goal.id);

        if (midRunGoalCheck.goal.goToStepId) {
          // Check per-goal redirect counter to prevent infinite loops
          const goalId = midRunGoalCheck.goal.id;
          const currentGoalRedirects = (goalRedirectCounts.get(goalId) || 0) + 1;
          goalRedirectCounts.set(goalId, currentGoalRedirects);

          if (currentGoalRedirects > MAX_GOAL_REDIRECTS) {
            console.warn(`[Automation] Max redirects (${MAX_GOAL_REDIRECTS}) reached for goal "${midRunGoalCheck.goal.name}", stopping automation`);
            triggeredGoalIds.add("*");
            logs.push({
              stepId: "goal_redirect_limit",
              actionType: "goal_achieved",
              status: "error",
              error: `Maximum redirects (${MAX_GOAL_REDIRECTS}) exceeded for goal "${midRunGoalCheck.goal.name}"`,
              output: { goalId, goalName: midRunGoalCheck.goal.name, redirectCount: currentGoalRedirects },
            });
            break;
          }
          // Jump to the specified step instead of exiting.
          // Allow the target step to execute even if it was already visited,
          // since goal redirects are intentional jumps (not accidental loops).
          console.log(`[Automation] Goal "${midRunGoalCheck.goal.name}" redirecting to step ${midRunGoalCheck.goal.goToStepId} (redirect ${currentGoalRedirects}/${MAX_GOAL_REDIRECTS})`);
          visitedSteps.delete(midRunGoalCheck.goal.goToStepId);
          nextStepId = midRunGoalCheck.goal.goToStepId;
        } else if (midRunGoalCheck.goal.exitOnGoal) {
          // Exit the automation and handle enrollment exit here
          // so the post-run check doesn't double-fire
          console.log(`[Automation] Goal exit triggered, stopping automation`);
          triggeredGoalIds.add("*"); // Mark all goals as handled
          await exitEnrollment(
            supabase,
            automation.id,
            context.lead?.id || null,
            context.appointment?.id || null,
            `Goal met mid-run: ${midRunGoalCheck.goal.name}`,
          );
          logs.push({
            stepId: "goal_exit",
            actionType: "goal_achieved",
            status: "success",
            output: {
              goalId: midRunGoalCheck.goal.id,
              goalName: midRunGoalCheck.goal.name,
              exitedMidRun: true,
            },
          });
          break;
        }
      }
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

    const { triggerType, teamId, eventPayload, eventId, automationId } = body as any;
    console.log("[automation-trigger] incoming", {
      triggerType,
      teamId,
      eventId,
      automationId: automationId || null,
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
    // When automationId is provided (e.g. manual trigger "Run Now"), target only that automation
    const automations = automationId
      ? await getSpecificAutomation(supabase, automationId)
      : await getAutomationsForTrigger(supabase, teamId, triggerType);

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
      const idempotencyResult = await hasAutomationAlreadyRunForEvent(
        supabase,
        teamId,
        triggerType,
        automationKey,
        stableEventId,
      );

      if (idempotencyResult.alreadyRan) {
        if (idempotencyResult.error) {
          // Fail-closed: idempotency check itself failed (DB issue), blocking to prevent duplicates
          console.error(
            `[Automation Trigger] BLOCKED automation ${automation.id} - idempotency check failed: ${idempotencyResult.error}`,
          );
        } else {
          console.log(
            `[Automation Trigger] SKIPPED automation ${automation.id} - already ran for event ${stableEventId} (run ${idempotencyResult.existingRunId})`,
          );
        }
        automationsSkipped.push(automation.id);
        continue;
      }

      // TRIGGER CONSTRAINT CHECK
      // Validates that the event payload matches the trigger's configured constraints
      // (e.g., calendar_id, event_type, tag name, funnel_id, etc.)
      const constraintCheck = matchesTriggerConstraints(
        automation.trigger?.config,
        triggerType,
        context,
      );

      if (!constraintCheck.matches) {
        console.log(
          `[Automation Trigger] SKIPPED automation "${automation.name}" - trigger constraints not met:`,
          constraintCheck.reasons,
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

      // Inject automationId into context for conversion tracking actions
      const contextWithAutomationId = { ...context, automationId: automation.id };

      try {
        stepLogs = await runAutomation(automation, contextWithAutomationId, supabase, runId, eventPayload as Record<string, any>);
        allStepsExecuted.push(...stepLogs);
        
        // Check if a mid-run goal exit already handled enrollment
        const midRunGoalExit = stepLogs.some(
          (l) => l.actionType === "goal_achieved" && l.output?.exitedMidRun === true,
        );

        if (midRunGoalExit) {
          // Mid-run goal check already called exitEnrollment, skip post-run check
          exitedByGoal = true;
        } else {
          // Check for goal completion after run (handles goals met on the final step)
          const goalCheck = await checkGoals(supabase, automation.id, contextWithAutomationId);
          if (goalCheck.goalMet && goalCheck.goal?.exitOnGoal) {
            exitedByGoal = true;
            await exitEnrollment(
              supabase,
              automation.id,
              contextWithAutomationId.lead?.id || null,
              contextWithAutomationId.appointment?.id || null,
              `Goal met: ${goalCheck.goal.name}`,
            );
          }
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
          contextWithAutomationId.lead?.id || null,
          contextWithAutomationId.appointment?.id || null,
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
