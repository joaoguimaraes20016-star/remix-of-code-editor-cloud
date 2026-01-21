// supabase/functions/automation-trigger/types.ts

export type TriggerType =
  | "lead_created"
  | "lead_tag_added"
  | "lead_tag_removed"
  | "form_submitted"
  | "appointment_booked"
  | "appointment_rescheduled"
  | "appointment_canceled"
  | "appointment_no_show"
  | "appointment_completed"
  | "stage_changed"
  | "deal_created"
  | "deal_won"
  | "deal_lost"
  | "payment_received"
  | "payment_failed"
  | "webhook_received"
  | "manual_trigger"
  | "scheduled_trigger"
  | "time_delay";

export type ActionType =
  | "send_message"
  | "add_task"
  | "add_tag"
  | "remove_tag"
  | "add_note"
  | "create_contact"
  | "update_contact"
  | "create_deal"
  | "close_deal"
  | "notify_team"
  | "enqueue_dialer"
  | "time_delay"
  | "wait_until"
  | "business_hours"
  | "split_test"
  | "condition"
  | "go_to"
  | "run_workflow"
  | "stop_workflow"
  | "custom_webhook"
  | "assign_owner"
  | "update_stage";

export type CrmEntity = "lead" | "deal" | "appointment";

export interface AutomationCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "is_set" | "is_not_set";
  value?: string | number | string[];
}

export interface AutomationStep {
  id: string;
  order: number;
  type: ActionType;
  config: Record<string, any>;
  conditions?: AutomationCondition[];
  conditionLogic?: "AND" | "OR";
  // For condition (If/Else) steps
  trueBranchStepId?: string;
  falseBranchStepId?: string;
  // For split_test steps
  variants?: Array<{ id: string; percentage: number; nextStepId?: string }>;
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

export interface AutomationDefinition {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    type: TriggerType;
    config: Record<string, any>;
  };
  steps: AutomationStep[];
  triggerType?: TriggerType;
}

export interface AutomationContext {
  teamId: string;
  triggerType: TriggerType;
  now: string;
  lead?: Record<string, any> | null;
  appointment?: Record<string, any> | null;
  payment?: Record<string, any> | null;
  deal?: Record<string, any> | null;
  meta?: Record<string, any> | null;
}

export interface StepExecutionLog {
  stepId?: string;
  actionType?: ActionType;
  channel?: string;
  provider?: string;
  templateVariables?: Record<string, any>;
  status?: "success" | "error" | "skipped" | "pending";
  skipped?: boolean;
  skipReason?: string;
  entity?: CrmEntity;
  ownerId?: string;
  stageId?: string;
  error?: string;
  to?: string;
  messageId?: string;
  renderedBody?: string;
  output?: Record<string, any>;
  retryCount?: number;
  durationMs?: number;
}

export interface TriggerRequest {
  triggerType: TriggerType;
  teamId: string;
  eventPayload: Record<string, any>;
  eventId?: string;
}

export interface TriggerResponse {
  status: "ok" | "error";
  triggerType: TriggerType;
  automationsRun: string[];
  stepsExecuted: StepExecutionLog[];
  error?: string;
}
