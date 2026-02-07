// supabase/functions/automation-trigger/types.ts

export type TriggerType =
  // Contact triggers
  | "lead_created"
  | "lead_tag_added"
  | "lead_tag_removed"
  | "contact_changed"
  | "contact_dnd"
  | "birthday_reminder"
  | "custom_date_reminder"
  | "note_added"
  | "note_changed"
  // Form/Funnel triggers
  | "form_submitted"
  | "survey_submitted"
  | "quiz_submitted"
  | "funnel_page_view"
  | "trigger_link_clicked"
  // Appointment triggers
  | "appointment_booked"
  | "appointment_rescheduled"
  | "appointment_canceled"
  | "appointment_no_show"
  | "appointment_completed"
  // Task triggers
  | "task_added"
  | "task_reminder"
  | "task_completed"
  // Pipeline triggers
  | "stage_changed"
  | "deal_created"
  | "deal_won"
  | "deal_lost"
  | "opportunity_changed"
  | "stale_opportunity"
  // Payment triggers
  | "payment_received"
  | "payment_failed"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "subscription_created"
  | "subscription_cancelled"
  | "subscription_renewed"
  | "refund_issued"
  | "order_submitted"
  // Messaging triggers
  | "customer_replied"
  | "email_opened"
  | "email_bounced"
  | "messaging_error"
  | "call_status"
  | "new_review_received"
  // Integration triggers
  | "webhook_received"
  | "manual_trigger"
  | "scheduled_trigger"
  | "facebook_lead_form"
  | "tiktok_form_submitted"
  | "google_lead_form"
  | "time_delay";

export type ActionType =
  // Communication
  | "send_message"
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "send_voicemail"
  | "make_call"
  | "notify_team"
  | "send_review_request"
  | "reply_in_comments"
  // CRM Actions
  | "create_contact"
  | "find_contact"
  | "update_contact"
  | "delete_contact"
  | "add_tag"
  | "remove_tag"
  | "add_task"
  | "add_note"
  | "assign_owner"
  | "remove_owner"
  | "toggle_dnd"
  | "copy_contact"
  | "add_followers"
  | "remove_followers"
  // Appointment Actions
  | "book_appointment"
  | "update_appointment"
  | "cancel_appointment"
  | "create_booking_link"
  | "log_call"
  // Pipeline Actions
  | "update_stage"
  | "create_deal"
  | "update_deal"
  | "close_deal"
  | "find_opportunity"
  // Payment Actions
  | "send_invoice"
  | "charge_payment"
  | "create_subscription"
  | "cancel_subscription"
  // Flow Control
  | "time_delay"
  | "wait_until"
  | "business_hours"
  | "condition"
  | "split_test"
  | "go_to"
  | "run_workflow"
  | "stop_workflow"
  | "goal_achieved"
  | "set_variable"
  | "add_to_workflow"
  | "remove_from_workflow"
  | "remove_from_all_workflows"
  // Data Transform
  | "format_date"
  | "format_number"
  | "format_text"
  | "math_operation"
  // AI Actions
  | "ai_intent"
  | "ai_decision"
  | "ai_translate"
  | "ai_summarize"
  | "ai_message"
  // Marketing
  | "meta_conversion"
  | "google_conversion"
  | "add_to_audience"
  | "remove_from_audience"
  // Integrations
  | "custom_webhook"
  | "google_sheets"
  | "slack_message"
  | "discord_message"
  | "tiktok_event"
  | "enqueue_dialer";

export type CrmEntity = "lead" | "deal" | "appointment";

export type ConditionOperator =
  // String operators
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "regex"
  // Number operators
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "greater_than"
  | "greater_or_equal"
  | "less_than"
  | "less_or_equal"
  | "between"
  // Date operators
  | "before"
  | "after"
  | "within_last_minutes"
  | "within_last_hours"
  | "within_last_days"
  | "after_now_minutes"
  | "day_of_week_is"
  | "month_is"
  // Boolean operators
  | "is_true"
  | "is_false"
  // Array operators
  | "in"
  | "contains_any"
  | "contains_all"
  | "not_contains_any"
  // Existence operators
  | "is_set"
  | "is_not_set"
  | "exists"
  | "is_empty"
  | "is_not_empty";

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value?: string | number | string[] | boolean;
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

/**
 * Runtime context passed through all steps of an automation.
 * 
 * NOTE on deal vs appointment:
 * Both `deal` and `appointment` reference the same `appointments` table in the database.
 * Pipeline opportunities ("deals") are stored as appointment records differentiated by
 * type/status fields. When both are set, they typically point to the same row.
 * `lead` references the `contacts` table.
 */
export interface AutomationContext {
  teamId: string;
  triggerType: TriggerType;
  now: string;
  /** Contact from `contacts` table */
  lead?: Record<string, any> | null;
  /** Appointment/deal from `appointments` table */
  appointment?: Record<string, any> | null;
  /** Payment context (from Stripe events) */
  payment?: Record<string, any> | null;
  /** Deal view of `appointments` table row — may reference same row as appointment */
  deal?: Record<string, any> | null;
  /** Extra metadata from trigger payload */
  meta?: Record<string, any> | null;
  /** Outputs from completed steps, keyed by step ID. Also contains a "variables" sub-key for set_variable actions. */
  stepOutputs?: Record<string, any>;
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
