// supabase/functions/automation-test/index.ts
// Dry-run automation testing edge function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestRequest {
  automationId: string;
  teamId: string;
  mockContact?: Record<string, any>;
  mockAppointment?: Record<string, any>;
  dryRun?: boolean;
}

interface AutomationStep {
  id: string;
  order: number;
  type: string;
  config: Record<string, any>;
  conditions?: AutomationCondition[];
  conditionLogic?: "AND" | "OR";
  trueBranchStepId?: string;
  falseBranchStepId?: string;
}

interface AutomationCondition {
  field: string;
  operator: string;
  value?: any;
}

interface StepTraceResult {
  stepId: string;
  stepType: string;
  stepOrder: number;
  status: "success" | "skipped" | "error" | "would_execute";
  skipReason?: string;
  errorMessage?: string;
  conditionsEvaluated?: {
    field: string;
    operator: string;
    expected: any;
    actual: any;
    result: boolean;
  }[];
  resolvedConfig?: Record<string, any>;
  templatePreview?: string;
  durationMs?: number;
  branchTaken?: "true" | "false" | null;
}

interface TestResponse {
  success: boolean;
  automationName: string;
  triggerType: string;
  triggerMatched: boolean;
  stepsTrace: StepTraceResult[];
  contextSnapshot: Record<string, any>;
  totalDurationMs: number;
  error?: string;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Simple template renderer for preview
function renderTemplate(template: string, context: Record<string, any>): string {
  if (!template) return "";
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const cleanPath = path.trim().split("|")[0].trim();
    const value = getFieldValue(context, cleanPath);
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function getFieldValue(obj: Record<string, any>, path: string): any {
  // Handle aliases
  const aliasMap: Record<string, string> = {
    "lead.name": "contact.full_name",
    "lead.first_name": "contact.first_name",
    "lead.email": "contact.email",
    "lead.phone": "contact.phone",
  };
  
  const resolvedPath = aliasMap[path] || path;
  const parts = resolvedPath.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

// Condition evaluator
function evaluateCondition(
  condition: { field: string; operator: string; value?: any },
  context: Record<string, any>
): { result: boolean; actual: any } {
  const actual = getFieldValue(context, condition.field);
  const expected = condition.value;
  
  let result = false;
  
  switch (condition.operator) {
    case "equals":
      result = actual === expected;
      break;
    case "not_equals":
      result = actual !== expected;
      break;
    case "contains":
      result = typeof actual === "string" && actual.toLowerCase().includes(String(expected).toLowerCase());
      break;
    case "is_set":
    case "exists":
      result = actual !== null && actual !== undefined && actual !== "";
      break;
    case "is_not_set":
    case "is_empty":
      result = actual === null || actual === undefined || actual === "";
      break;
    case "gt":
    case "greater_than":
      result = Number(actual) > Number(expected);
      break;
    case "lt":
    case "less_than":
      result = Number(actual) < Number(expected);
      break;
    case "contains_any":
      result = Array.isArray(actual) && Array.isArray(expected) && expected.some((e: any) => actual.includes(e));
      break;
    default:
      result = false;
  }
  
  return { result, actual };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body: TestRequest = await req.json();
    const { automationId, teamId, mockContact, mockAppointment, dryRun = true } = body;
    
    if (!automationId || !teamId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing automationId or teamId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Fetch the automation
    const { data: automation, error: automationError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .single();
    
    if (automationError || !automation) {
      return new Response(
        JSON.stringify({ success: false, error: "Automation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const definition = automation.definition as Record<string, any> || {};
    const steps: AutomationStep[] = ((definition.steps || []) as AutomationStep[])
      .sort((a, b) => a.order - b.order);
    
    // Build mock context
    const context: Record<string, any> = {
      teamId,
      triggerType: automation.trigger_type,
      now: new Date().toISOString(),
      contact: mockContact || {
        id: "test-contact-id",
        full_name: "John Doe",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+14045551234",
        tags: ["test", "demo"],
        timezone: "America/New_York",
        created_at: new Date().toISOString(),
      },
      appointment: mockAppointment || {
        id: "test-appointment-id",
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 30,
        status: "booked",
        meeting_link: "https://zoom.us/j/123456789",
        cancellation_link: "https://calendly.com/cancel/abc123",
        reschedule_link: "https://calendly.com/reschedule/abc123",
        event_type_name: "Discovery Call",
        assigned_user: {
          name: "Sales Rep",
          email: "sales@company.com",
        },
      },
      // Aliases for backward compatibility
      lead: mockContact || {
        name: "John Doe",
        first_name: "John",
        email: "john.doe@example.com",
        phone: "+14045551234",
      },
    };
    
    // Evaluate trigger match (simplified - in real execution this happens at event time)
    const triggerMatched = true; // In test mode, we assume trigger matched
    
    // Trace each step
    const stepsTrace: StepTraceResult[] = [];
    const stepMap = new Map<string, AutomationStep>(steps.map((s) => [s.id, s]));
    let currentStepId: string | null = steps[0]?.id || null;
    const visitedSteps = new Set<string>();
    const maxSteps = 50;
    
    while (currentStepId && stepsTrace.length < maxSteps) {
      if (visitedSteps.has(currentStepId)) {
        break; // Prevent infinite loops
      }
      visitedSteps.add(currentStepId);
      
      const step = stepMap.get(currentStepId);
      if (!step) break;
      
      const stepStartTime = Date.now();
      const trace: StepTraceResult = {
        stepId: step.id,
        stepType: step.type,
        stepOrder: step.order,
        status: "would_execute",
        branchTaken: null,
      };
      
      // Evaluate step conditions
      if (step.conditions && step.conditions.length > 0) {
        trace.conditionsEvaluated = step.conditions.map((cond) => {
          const { result, actual } = evaluateCondition(cond, context);
          return {
            field: cond.field,
            operator: cond.operator,
            expected: cond.value,
            actual,
            result,
          };
        });
        
        const evaluatedConditions = trace.conditionsEvaluated;
        if (evaluatedConditions) {
          const conditionLogic = step.conditionLogic || "AND";
          const allPassed = conditionLogic === "OR"
            ? evaluatedConditions.some((c) => c.result)
            : evaluatedConditions.every((c) => c.result);
          if (!allPassed) {
            trace.status = "skipped";
            trace.skipReason = "conditions_not_met";
          }
        }
      }
      
      // Handle different action types for preview
      if (trace.status !== "skipped") {
        switch (step.type) {
          case "send_message":
          case "send_sms":
          case "send_email": {
            const template = step.config?.template || step.config?.text || step.config?.body || "";
            trace.templatePreview = renderTemplate(template, context);
            trace.resolvedConfig = {
              channel: step.config?.channel || "sms",
              to: context.contact?.phone || context.contact?.email,
              subject: step.config?.subject ? renderTemplate(step.config.subject, context) : undefined,
              body: trace.templatePreview,
            };
            break;
          }
          
          case "time_delay": {
            trace.resolvedConfig = {
              delayValue: step.config?.delayValue || step.config?.duration || 5,
              delayType: step.config?.delayType || step.config?.unit || "minutes",
              wouldResumeAt: new Date(
                Date.now() + 
                (step.config?.delayValue || 5) * 
                (step.config?.delayType === "hours" ? 3600000 : 
                 step.config?.delayType === "days" ? 86400000 : 60000)
              ).toISOString(),
            };
            break;
          }
          
          case "add_tag": {
            trace.resolvedConfig = {
              tag: step.config?.tag,
              currentTags: context.contact?.tags || [],
              newTags: [...(context.contact?.tags || []), step.config?.tag],
            };
            break;
          }
          
          case "condition": {
            // For condition nodes, evaluate which branch to take
            // Read from step-level properties (not config) to match production behavior
            const stepConditions = (step.conditions || step.config?.conditions || []) as AutomationCondition[];
            const conditionLogic = step.conditionLogic || step.config?.conditionLogic || "AND";
            const conditionsPassed = conditionLogic === "OR"
              ? stepConditions.some((cond) => {
                  const { result } = evaluateCondition(cond, context);
                  return result;
                })
              : stepConditions.every((cond) => {
                  const { result } = evaluateCondition(cond, context);
                  return result;
                });
            
            trace.branchTaken = conditionsPassed ? "true" : "false";
            trace.resolvedConfig = {
              conditionResult: conditionsPassed,
              trueBranchStepId: step.trueBranchStepId,
              falseBranchStepId: step.falseBranchStepId,
            };
            
            // Set next step based on condition
            if (conditionsPassed && step.trueBranchStepId) {
              currentStepId = step.trueBranchStepId;
            } else if (!conditionsPassed && step.falseBranchStepId) {
              currentStepId = step.falseBranchStepId;
            } else {
              currentStepId = getNextStepByOrder(steps, step.order);
            }
            
            trace.durationMs = Date.now() - stepStartTime;
            stepsTrace.push(trace);
            continue; // Skip default next step logic
          }
          
          case "add_task": {
            trace.resolvedConfig = {
              title: renderTemplate(step.config?.title || "", context),
              assignTo: step.config?.assignTo,
              dueAt: step.config?.dueAt,
            };
            break;
          }
          
          case "update_stage": {
            trace.resolvedConfig = {
              entity: step.config?.entity,
              stageId: step.config?.stageId,
            };
            break;
          }
          
          case "custom_webhook": {
            trace.resolvedConfig = {
              url: step.config?.url,
              method: step.config?.method || "POST",
              payload: step.config?.payload ? renderTemplate(step.config.payload, context) : "{}",
            };
            break;
          }
          
          default:
            trace.resolvedConfig = { ...step.config };
        }
      }
      
      trace.durationMs = Date.now() - stepStartTime;
      stepsTrace.push(trace);
      
      // Move to next step
      currentStepId = getNextStepByOrder(steps, step.order);
    }
    
    const response: TestResponse = {
      success: true,
      automationName: automation.name,
      triggerType: automation.trigger_type,
      triggerMatched,
      stepsTrace,
      contextSnapshot: context,
      totalDurationMs: Date.now() - startTime,
    };
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[automation-test] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        totalDurationMs: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getNextStepByOrder(steps: AutomationStep[], currentOrder: number): string | null {
  const nextStep = steps.find((s) => s.order === currentOrder + 1);
  return nextStep?.id || null;
}
