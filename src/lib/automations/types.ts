// src/lib/automations/types.ts

// ============================================
// TRIGGER TYPES
// ============================================

export type TriggerType =
  // Lead triggers
  | 'lead_created'
  | 'lead_tag_added'
  | 'lead_tag_removed'
  | 'form_submitted'
  // Appointment triggers
  | 'appointment_booked'
  | 'appointment_rescheduled'
  | 'appointment_no_show'
  | 'appointment_completed'
  | 'appointment_canceled'
  // Pipeline/Stage triggers
  | 'stage_changed'
  | 'deal_created'
  | 'deal_won'
  | 'deal_lost'
  // Payment triggers
  | 'payment_received'
  | 'payment_failed'
  // Integration triggers
  | 'webhook_received'
  | 'manual_trigger'
  | 'scheduled_trigger'
  // Legacy
  | 'time_delay';

// ============================================
// ACTION TYPES
// ============================================

export type ActionType =
  // Messaging
  | 'send_message'        // SMS / Email / Voice / In-App
  | 'notify_team'         // Internal team notification
  // CRM Actions
  | 'add_tag'
  | 'remove_tag'
  | 'create_contact'
  | 'update_contact'
  | 'add_task'
  | 'add_note'
  | 'assign_owner'
  // Pipeline Actions
  | 'update_stage'
  | 'create_deal'
  | 'close_deal'
  // Flow Control
  | 'time_delay'
  | 'wait_until'          // Wait until specific date/time
  | 'business_hours'      // Wait for business hours
  | 'condition'           // If/Else branching
  | 'split_test'          // A/B/n split testing
  | 'go_to'               // Jump to another step
  | 'run_workflow'        // Trigger another automation
  | 'stop_workflow'       // Halt current execution
  // Integrations
  | 'custom_webhook'
  | 'enqueue_dialer';

// ============================================
// CONDITION SYSTEM
// ============================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_set'
  | 'is_not_set'
  | 'in'
  | 'not_in'
  | 'date_before'
  | 'date_after'
  | 'date_within_days'
  | 'date_past_days'
  | 'tag_present'
  | 'tag_absent';

export interface AutomationCondition {
  id?: string;
  field: string;
  operator: ConditionOperator | 'gt' | 'lt'; // Include legacy operators
  value: string | number | string[] | boolean | null;
}

export interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: (AutomationCondition | ConditionGroup)[];
}

// ============================================
// CONFIG TYPES
// ============================================

export type CrmEntity = 'lead' | 'deal' | 'contact';

export interface AssignOwnerConfig {
  entity: CrmEntity;
  ownerId: string;
}

export interface UpdateStageConfig {
  entity: CrmEntity;
  stageId: string;
}

export interface SendMessageConfig {
  channel: 'sms' | 'email' | 'voice' | 'in_app';
  template: string;
  subject?: string; // For email
  fromName?: string;
  voiceId?: string; // For ElevenLabs
  fallbackChannel?: 'sms' | 'email';
}

export interface TimeDelayConfig {
  delayType: 'minutes' | 'hours' | 'days';
  delayValue: number;
}

export interface WaitUntilConfig {
  dateField?: string; // Field to wait until
  specificDate?: string; // ISO date string
  time?: string; // HH:MM format
}

export interface SplitTestConfig {
  variants: {
    id: string;
    name: string;
    percentage: number;
    nextStepId?: string;
  }[];
}

export interface RunWorkflowConfig {
  workflowId: string;
  passContext: boolean;
}

export interface CreateContactConfig {
  fields: Record<string, string>; // Field mappings
  source?: string;
  tags?: string[];
}

export interface CreateDealConfig {
  name: string;
  value?: number;
  stageId?: string;
  ownerId?: string;
}

export interface CloseDealConfig {
  status: 'won' | 'lost';
  reason?: string;
}

export interface AddNoteConfig {
  entity: CrmEntity;
  content: string;
}

// ============================================
// TRIGGER CONFIG TYPES
// ============================================

export interface WebhookTriggerConfig {
  webhookId: string;
  webhookUrl?: string;
  secret?: string;
}

export interface ScheduledTriggerConfig {
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string; // HH:MM
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  cronExpression?: string; // For custom
  timezone?: string;
}

export interface FormSubmittedConfig {
  funnelId?: string;
  formId?: string;
}

export interface StageChangedConfig {
  fromStage?: string;
  toStage?: string;
  pipelineId?: string;
}

// ============================================
// RETRY & EXECUTION CONFIG
// ============================================

export interface StepRetryConfig {
  maxRetries: number;
  retryDelaySeconds: number;
  retryBackoffMultiplier: number;
  fallbackChannel?: 'email' | 'sms' | 'voice';
  onFinalFailure: 'continue' | 'stop' | 'notify_admin';
}

// ============================================
// CORE AUTOMATION STRUCTURES
// ============================================

export interface AutomationActionConfig {
  type: ActionType;
  params: Record<string, any>;
}

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

export interface AutomationStep {
  id: string;
  order: number;
  type: ActionType;
  config: Record<string, any>;
  conditions?: AutomationCondition[];
  conditionGroups?: ConditionGroup[];
  retryConfig?: StepRetryConfig;
  // For branching
  trueBranchStepId?: string;
  falseBranchStepId?: string;
  // For split testing
  variantStepIds?: Record<string, string>;
}

export interface AutomationDefinition {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  // Folder organization
  folderId?: string;
  // Metadata
  version?: number;
  lastRunAt?: string;
  runCount?: number;
  errorCount?: number;
  // Legacy fields for backwards compatibility
  triggerType?: TriggerType;
  triggerConfig?: Record<string, any>;
  conditions?: AutomationCondition[];
  actions?: AutomationActionConfig[];
}

// ============================================
// TRIGGER & ACTION METADATA
// ============================================

export interface TriggerMeta {
  type: TriggerType;
  label: string;
  description: string;
  icon: string;
  category: 'lead' | 'appointment' | 'pipeline' | 'payment' | 'integration';
  configFields?: string[];
}

export interface ActionMeta {
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  category: 'messaging' | 'crm' | 'pipeline' | 'flow' | 'integration';
}

// Trigger metadata registry
export const TRIGGER_META: Record<TriggerType, TriggerMeta> = {
  lead_created: { type: 'lead_created', label: 'Lead Created', description: 'When a new lead is added', icon: 'UserPlus', category: 'lead' },
  lead_tag_added: { type: 'lead_tag_added', label: 'Tag Added', description: 'When a tag is added to a lead', icon: 'Tag', category: 'lead' },
  lead_tag_removed: { type: 'lead_tag_removed', label: 'Tag Removed', description: 'When a tag is removed from a lead', icon: 'TagOff', category: 'lead' },
  form_submitted: { type: 'form_submitted', label: 'Form Submitted', description: 'When a form or funnel is completed', icon: 'FileText', category: 'lead' },
  appointment_booked: { type: 'appointment_booked', label: 'Appointment Booked', description: 'When an appointment is scheduled', icon: 'Calendar', category: 'appointment' },
  appointment_rescheduled: { type: 'appointment_rescheduled', label: 'Appointment Rescheduled', description: 'When an appointment is rescheduled', icon: 'CalendarClock', category: 'appointment' },
  appointment_no_show: { type: 'appointment_no_show', label: 'No Show', description: 'When lead misses appointment', icon: 'UserX', category: 'appointment' },
  appointment_completed: { type: 'appointment_completed', label: 'Appointment Completed', description: 'When an appointment is marked complete', icon: 'CalendarCheck', category: 'appointment' },
  appointment_canceled: { type: 'appointment_canceled', label: 'Appointment Canceled', description: 'When an appointment is canceled', icon: 'CalendarX', category: 'appointment' },
  stage_changed: { type: 'stage_changed', label: 'Stage Changed', description: 'When lead moves to a new pipeline stage', icon: 'ArrowRightLeft', category: 'pipeline' },
  deal_created: { type: 'deal_created', label: 'Deal Created', description: 'When a new deal is created', icon: 'Briefcase', category: 'pipeline' },
  deal_won: { type: 'deal_won', label: 'Deal Won', description: 'When a deal is marked as won', icon: 'Trophy', category: 'pipeline' },
  deal_lost: { type: 'deal_lost', label: 'Deal Lost', description: 'When a deal is marked as lost', icon: 'XCircle', category: 'pipeline' },
  payment_received: { type: 'payment_received', label: 'Payment Received', description: 'When a payment is successful', icon: 'DollarSign', category: 'payment' },
  payment_failed: { type: 'payment_failed', label: 'Payment Failed', description: 'When a payment fails', icon: 'AlertCircle', category: 'payment' },
  webhook_received: { type: 'webhook_received', label: 'Webhook Received', description: 'When an external webhook is received', icon: 'Webhook', category: 'integration' },
  manual_trigger: { type: 'manual_trigger', label: 'Manual Trigger', description: 'Triggered manually by user', icon: 'Play', category: 'integration' },
  scheduled_trigger: { type: 'scheduled_trigger', label: 'Scheduled', description: 'Runs on a schedule', icon: 'Clock', category: 'integration' },
  time_delay: { type: 'time_delay', label: 'Time Delay', description: 'Legacy time-based trigger', icon: 'Timer', category: 'integration' },
};

// Action metadata registry
export const ACTION_META: Record<ActionType, ActionMeta> = {
  send_message: { type: 'send_message', label: 'Send Message', description: 'SMS, Email, or Voice', icon: 'MessageSquare', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'messaging' },
  notify_team: { type: 'notify_team', label: 'Notify Team', description: 'Alert team members', icon: 'Bell', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'messaging' },
  add_tag: { type: 'add_tag', label: 'Add Tag', description: 'Tag for segmentation', icon: 'Tag', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'crm' },
  remove_tag: { type: 'remove_tag', label: 'Remove Tag', description: 'Remove a tag', icon: 'TagOff', color: 'text-red-400', bgColor: 'bg-red-500/20', category: 'crm' },
  create_contact: { type: 'create_contact', label: 'Create Contact', description: 'Add a new contact', icon: 'UserPlus', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'crm' },
  update_contact: { type: 'update_contact', label: 'Update Contact', description: 'Modify contact fields', icon: 'UserCog', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'crm' },
  add_task: { type: 'add_task', label: 'Create Task', description: 'Assign a follow-up task', icon: 'ClipboardList', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'crm' },
  add_note: { type: 'add_note', label: 'Add Note', description: 'Add a note to record', icon: 'StickyNote', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'crm' },
  assign_owner: { type: 'assign_owner', label: 'Assign Owner', description: 'Set lead or deal owner', icon: 'UserCheck', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', category: 'crm' },
  update_stage: { type: 'update_stage', label: 'Update Stage', description: 'Move in pipeline', icon: 'ArrowRightLeft', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'pipeline' },
  create_deal: { type: 'create_deal', label: 'Create Deal', description: 'Create a new deal', icon: 'Briefcase', color: 'text-violet-400', bgColor: 'bg-violet-500/20', category: 'pipeline' },
  close_deal: { type: 'close_deal', label: 'Close Deal', description: 'Mark deal as won/lost', icon: 'CheckCircle', color: 'text-green-400', bgColor: 'bg-green-500/20', category: 'pipeline' },
  time_delay: { type: 'time_delay', label: 'Wait', description: 'Pause before next step', icon: 'Clock', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  wait_until: { type: 'wait_until', label: 'Wait Until', description: 'Wait until date/time', icon: 'CalendarClock', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  business_hours: { type: 'business_hours', label: 'Business Hours', description: 'Wait for business hours', icon: 'Building2', color: 'text-teal-400', bgColor: 'bg-teal-500/20', category: 'flow' },
  condition: { type: 'condition', label: 'If / Else', description: 'Branch based on conditions', icon: 'GitBranch', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'flow' },
  split_test: { type: 'split_test', label: 'A/B Split', description: 'Random split testing', icon: 'Split', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'flow' },
  go_to: { type: 'go_to', label: 'Go To', description: 'Jump to another step', icon: 'CornerDownRight', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  run_workflow: { type: 'run_workflow', label: 'Run Workflow', description: 'Trigger another automation', icon: 'PlayCircle', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'flow' },
  stop_workflow: { type: 'stop_workflow', label: 'Stop', description: 'End this workflow', icon: 'StopCircle', color: 'text-red-500', bgColor: 'bg-red-500/20', category: 'flow' },
  custom_webhook: { type: 'custom_webhook', label: 'Webhook', description: 'Call external API', icon: 'Webhook', color: 'text-gray-400', bgColor: 'bg-gray-500/20', category: 'integration' },
  enqueue_dialer: { type: 'enqueue_dialer', label: 'Power Dialer', description: 'Add to dialer queue', icon: 'Phone', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'integration' },
};
