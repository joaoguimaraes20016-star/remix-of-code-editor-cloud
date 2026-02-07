// src/lib/automations/types.ts

// ============================================
// TRIGGER TYPES
// ============================================

export type TriggerType =
  // Contact triggers
  | 'lead_created'
  | 'lead_tag_added'
  | 'lead_tag_removed'
  | 'contact_changed'
  | 'contact_dnd'
  | 'birthday_reminder'
  | 'custom_date_reminder'
  | 'note_added'
  // Form/Funnel triggers
  | 'form_submitted'
  | 'survey_submitted'
  | 'quiz_submitted'
  | 'funnel_page_view'
  | 'trigger_link_clicked'
  // Appointment triggers
  | 'appointment_booked'
  | 'appointment_rescheduled'
  | 'appointment_no_show'
  | 'appointment_completed'
  | 'appointment_canceled'
  // Task triggers
  | 'task_added'
  | 'task_reminder'
  | 'task_completed'
  // Pipeline/Stage triggers
  | 'stage_changed'
  | 'deal_created'
  | 'deal_won'
  | 'deal_lost'
  | 'opportunity_changed'
  | 'stale_opportunity'
  // Payment triggers
  | 'payment_received'
  | 'payment_failed'
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'refund_issued'
  | 'order_submitted'
  // Messaging triggers
  | 'customer_replied'
  | 'email_opened'
  | 'email_bounced'
  | 'messaging_error'
  // Review triggers
  | 'new_review_received'
  // Integration triggers
  | 'webhook_received'
  | 'manual_trigger'
  | 'scheduled_trigger'
  | 'facebook_lead_form'
  | 'tiktok_form_submitted'
  | 'google_lead_form'
  | 'typeform_response'
  | 'fathom_summary_received'
  // Legacy
  | 'time_delay';

// ============================================
// ACTION TYPES
// ============================================

export type ActionType =
  // Communication
  | 'send_message'        // SMS / Email / Voice / In-App
  | 'send_email'          // Explicit email
  | 'send_sms'            // Explicit SMS
  | 'send_whatsapp'       // WhatsApp message
  | 'send_voicemail'      // Voicemail drop
  | 'make_call'           // Outbound call
  | 'notify_team'         // Internal team notification
  | 'send_review_request' // Reputation management
  | 'reply_in_comments'   // Social reply
  // CRM Actions
  | 'create_contact'
  | 'find_contact'
  | 'update_contact'
  | 'delete_contact'
  | 'add_tag'
  | 'remove_tag'
  | 'add_task'
  | 'add_note'
  | 'assign_owner'
  | 'remove_owner'
  | 'toggle_dnd'
  | 'copy_contact'
  | 'add_followers'
  | 'remove_followers'
  // Appointment Actions
  | 'book_appointment'
  | 'update_appointment'
  | 'cancel_appointment'
  | 'create_booking_link'
  | 'log_call'
  // Pipeline Actions
  | 'update_stage'
  | 'create_deal'
  | 'update_deal'
  | 'close_deal'
  | 'find_opportunity'
  // Payment Actions
  | 'send_invoice'
  | 'charge_payment'
  | 'create_subscription'
  | 'cancel_subscription'
  // Flow Control
  | 'time_delay'
  | 'wait_until'          // Wait until specific date/time
  | 'business_hours'      // Wait for business hours
  | 'condition'           // If/Else branching
  | 'split_test'          // A/B/n split testing
  | 'go_to'               // Jump to another step
  | 'run_workflow'        // Trigger another automation
  | 'stop_workflow'       // Halt current execution
  | 'goal_achieved'       // Conversion tracking
  | 'set_variable'        // Custom value management
  | 'add_to_workflow'     // Add to another workflow
  | 'remove_from_workflow'
  // Data Transformation
  | 'format_date'
  | 'format_number'
  | 'format_text'
  | 'math_operation'
  // AI Actions
  | 'ai_intent'           // Intent detection
  | 'ai_decision'         // Smart branching
  | 'ai_translate'        // Translation
  | 'ai_summarize'        // Summarization
  | 'ai_message'          // AI-generated message
  // Marketing
  | 'meta_conversion'     // Facebook CAPI
  | 'google_conversion'   // Google Ads offline conversion
  | 'add_to_audience'     // Add to custom audience
  | 'remove_from_audience'
  // Integrations
  | 'custom_webhook'
  | 'google_sheets'
  | 'slack_message'
  | 'discord_message'
  | 'tiktok_event'         // TikTok Events API
  | 'enqueue_dialer';

// ============================================
// CONDITION SYSTEM
// ============================================

export type ConditionOperator =
  // String operators
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  // Number operators
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'between'
  // Date operators
  | 'before'
  | 'after'
  | 'within_last_minutes'
  | 'within_last_hours'
  | 'within_last_days'
  | 'after_now_minutes'
  | 'day_of_week_is'
  | 'month_is'
  | 'date_before'
  | 'date_after'
  | 'date_within_days'
  | 'date_past_days'
  // Boolean operators
  | 'is_true'
  | 'is_false'
  // Array operators
  | 'in'
  | 'not_in'
  | 'contains_any'
  | 'contains_all'
  | 'not_contains_any'
  // Existence operators
  | 'is_set'
  | 'is_not_set'
  | 'exists'
  | 'is_empty'
  | 'is_not_empty'
  // Tag operators (legacy)
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
  channel: 'sms' | 'email' | 'voice' | 'in_app' | 'whatsapp';
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

// New config types
export interface FindContactConfig {
  searchField: 'email' | 'phone' | 'custom_field';
  searchValue: string;
  notFoundBehavior: 'continue' | 'stop' | 'create';
}

export interface BookAppointmentConfig {
  calendarId: string;
  appointmentTypeId: string;
  assignToOwner: boolean;
  sendConfirmation: boolean;
}

export interface SendInvoiceConfig {
  amount: number;
  currency: string;
  dueInDays: number;
  lineItems: { description: string; amount: number }[];
  sendVia: 'email' | 'sms' | 'both';
}

export interface ChargePaymentConfig {
  amount: number;
  currency: string;
  description: string;
}

export interface GoalAchievedConfig {
  goalName: string;
  value?: number;
  stopWorkflow: boolean;
}

export interface MathOperationConfig {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'percentage';
  operand1: string;
  operand2: string;
  resultField: string;
}

export interface AIDecisionConfig {
  prompt: string;
  options: { label: string; nextStepId: string }[];
  fallbackStepId: string;
}

export interface SetVariableConfig {
  variableName: string;
  value: string;
  type: 'string' | 'number' | 'date' | 'boolean';
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

export interface ContactChangedConfig {
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface DateReminderConfig {
  field?: string;
  daysBefore?: number;
  daysAfter?: number;
  time?: string;
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

export type TriggerCategory = 
  | 'contact' 
  | 'form' 
  | 'appointment' 
  | 'task' 
  | 'pipeline' 
  | 'payment' 
  | 'messaging' 
  | 'integration';

export type ActionCategory = 
  | 'messaging' 
  | 'crm' 
  | 'appointment' 
  | 'pipeline' 
  | 'payment' 
  | 'flow' 
  | 'data' 
  | 'ai' 
  | 'marketing' 
  | 'integration';

export interface TriggerMeta {
  type: TriggerType;
  label: string;
  description: string;
  icon: string;
  category: TriggerCategory;
  configFields?: string[];
}

export interface ActionMeta {
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  category: ActionCategory;
}

// Trigger metadata registry
export const TRIGGER_META: Record<TriggerType, TriggerMeta> = {
  // Contact triggers
  lead_created: { type: 'lead_created', label: 'Contact Created', description: 'When a new contact is added', icon: 'UserPlus', category: 'contact' },
  lead_tag_added: { type: 'lead_tag_added', label: 'Contact Tag Added', description: 'When a tag is added', icon: 'Tag', category: 'contact' },
  lead_tag_removed: { type: 'lead_tag_removed', label: 'Contact Tag Removed', description: 'When a tag is removed', icon: 'TagOff', category: 'contact' },
  contact_changed: { type: 'contact_changed', label: 'Contact Changed', description: 'When a contact field is updated', icon: 'UserCog', category: 'contact' },
  contact_dnd: { type: 'contact_dnd', label: 'Contact DND', description: 'When DND status changes', icon: 'BellOff', category: 'contact' },
  birthday_reminder: { type: 'birthday_reminder', label: 'Birthday Reminder', description: 'Annual birthday trigger', icon: 'Cake', category: 'contact' },
  custom_date_reminder: { type: 'custom_date_reminder', label: 'Custom Date Reminder', description: 'Trigger on custom date field', icon: 'CalendarDays', category: 'contact' },
  note_added: { type: 'note_added', label: 'Note Added', description: 'When a note is added to contact', icon: 'StickyNote', category: 'contact' },
  
  // Form triggers
  form_submitted: { type: 'form_submitted', label: 'Form Submitted', description: 'When a form is completed', icon: 'FileText', category: 'form' },
  survey_submitted: { type: 'survey_submitted', label: 'Survey Submitted', description: 'When a survey is completed', icon: 'ClipboardCheck', category: 'form' },
  quiz_submitted: { type: 'quiz_submitted', label: 'Quiz Submitted', description: 'When a quiz is completed', icon: 'HelpCircle', category: 'form' },
  funnel_page_view: { type: 'funnel_page_view', label: 'Page Viewed', description: 'When a funnel page is viewed', icon: 'Eye', category: 'form' },
  trigger_link_clicked: { type: 'trigger_link_clicked', label: 'Trigger Link Clicked', description: 'When a tracked link is clicked', icon: 'MousePointerClick', category: 'form' },
  
  // Appointment triggers
  appointment_booked: { type: 'appointment_booked', label: 'Appointment Booked', description: 'When an appointment is scheduled', icon: 'Calendar', category: 'appointment' },
  appointment_rescheduled: { type: 'appointment_rescheduled', label: 'Appointment Rescheduled', description: 'When an appointment is rescheduled', icon: 'CalendarClock', category: 'appointment' },
  appointment_no_show: { type: 'appointment_no_show', label: 'No Show', description: 'When lead misses appointment', icon: 'UserX', category: 'appointment' },
  appointment_completed: { type: 'appointment_completed', label: 'Appointment Completed', description: 'When appointment is marked complete', icon: 'CalendarCheck', category: 'appointment' },
  appointment_canceled: { type: 'appointment_canceled', label: 'Appointment Canceled', description: 'When appointment is canceled', icon: 'CalendarX', category: 'appointment' },
  
  // Task triggers
  task_added: { type: 'task_added', label: 'Task Added', description: 'When a task is created', icon: 'ListPlus', category: 'task' },
  task_reminder: { type: 'task_reminder', label: 'Task Reminder', description: 'Task due date reminder', icon: 'Bell', category: 'task' },
  task_completed: { type: 'task_completed', label: 'Task Completed', description: 'When a task is completed', icon: 'CheckSquare', category: 'task' },
  
  // Pipeline triggers
  stage_changed: { type: 'stage_changed', label: 'Pipeline Stage Changed', description: 'When stage changes', icon: 'ArrowRightLeft', category: 'pipeline' },
  deal_created: { type: 'deal_created', label: 'Opportunity Created', description: 'When a deal is created', icon: 'Briefcase', category: 'pipeline' },
  deal_won: { type: 'deal_won', label: 'Deal Won', description: 'When a deal is marked as won', icon: 'Trophy', category: 'pipeline' },
  deal_lost: { type: 'deal_lost', label: 'Deal Lost', description: 'When a deal is marked as lost', icon: 'XCircle', category: 'pipeline' },
  opportunity_changed: { type: 'opportunity_changed', label: 'Opportunity Changed', description: 'When opportunity details change', icon: 'RefreshCw', category: 'pipeline' },
  stale_opportunity: { type: 'stale_opportunity', label: 'Stale Opportunity', description: 'When opportunity has no activity', icon: 'Clock', category: 'pipeline' },
  
  // Payment triggers
  payment_received: { type: 'payment_received', label: 'Payment Received', description: 'When payment is successful', icon: 'DollarSign', category: 'payment' },
  payment_failed: { type: 'payment_failed', label: 'Payment Failed', description: 'When payment fails', icon: 'AlertCircle', category: 'payment' },
  invoice_created: { type: 'invoice_created', label: 'Invoice Created', description: 'When invoice is created', icon: 'FileText', category: 'payment' },
  invoice_sent: { type: 'invoice_sent', label: 'Invoice Sent', description: 'When invoice is sent', icon: 'Send', category: 'payment' },
  invoice_paid: { type: 'invoice_paid', label: 'Invoice Paid', description: 'When invoice is paid', icon: 'CheckCircle', category: 'payment' },
  invoice_overdue: { type: 'invoice_overdue', label: 'Invoice Overdue', description: 'When invoice becomes overdue', icon: 'AlertTriangle', category: 'payment' },
  subscription_created: { type: 'subscription_created', label: 'Subscription Created', description: 'When subscription starts', icon: 'Repeat', category: 'payment' },
  subscription_cancelled: { type: 'subscription_cancelled', label: 'Subscription Cancelled', description: 'When subscription is cancelled', icon: 'XCircle', category: 'payment' },
  subscription_renewed: { type: 'subscription_renewed', label: 'Subscription Renewed', description: 'When subscription renews', icon: 'RefreshCw', category: 'payment' },
  refund_issued: { type: 'refund_issued', label: 'Refund Issued', description: 'When a refund is processed', icon: 'RotateCcw', category: 'payment' },
  order_submitted: { type: 'order_submitted', label: 'Order Submitted', description: 'When order is placed', icon: 'ShoppingCart', category: 'payment' },
  
  // Messaging triggers
  customer_replied: { type: 'customer_replied', label: 'Customer Replied', description: 'When customer sends a message', icon: 'MessageCircle', category: 'messaging' },
  email_opened: { type: 'email_opened', label: 'Email Opened', description: 'When email is opened', icon: 'MailOpen', category: 'messaging' },
  email_bounced: { type: 'email_bounced', label: 'Email Bounced', description: 'When email bounces', icon: 'MailX', category: 'messaging' },
  messaging_error: { type: 'messaging_error', label: 'Messaging Error', description: 'When message delivery fails', icon: 'AlertOctagon', category: 'messaging' },
  new_review_received: { type: 'new_review_received', label: 'New Review Received', description: 'When a review is received', icon: 'Star', category: 'messaging' },
  
  // Integration triggers
  webhook_received: { type: 'webhook_received', label: 'Inbound Webhook', description: 'When external webhook is received', icon: 'Webhook', category: 'integration' },
  manual_trigger: { type: 'manual_trigger', label: 'Manual Trigger', description: 'Triggered manually by user', icon: 'Play', category: 'integration' },
  scheduled_trigger: { type: 'scheduled_trigger', label: 'Scheduled', description: 'Runs on a schedule', icon: 'Clock', category: 'integration' },
  facebook_lead_form: { type: 'facebook_lead_form', label: 'Facebook Lead Form', description: 'When FB lead form is submitted', icon: 'Facebook', category: 'integration' },
  tiktok_form_submitted: { type: 'tiktok_form_submitted', label: 'TikTok Form', description: 'When TikTok form is submitted', icon: 'Music', category: 'integration' },
  google_lead_form: { type: 'google_lead_form', label: 'Google Lead Form', description: 'When Google lead form is submitted', icon: 'Search', category: 'integration' },
  typeform_response: { type: 'typeform_response', label: 'Typeform Response', description: 'When a Typeform is submitted', icon: 'FileText', category: 'integration' },
  fathom_summary_received: { type: 'fathom_summary_received', label: 'Fathom Summary', description: 'When a call summary is received', icon: 'Mic', category: 'integration' },
  time_delay: { type: 'time_delay', label: 'Time Delay', description: 'Legacy time-based trigger', icon: 'Timer', category: 'integration' },
};

// Action metadata registry
export const ACTION_META: Record<ActionType, ActionMeta> = {
  // Communication
  send_message: { type: 'send_message', label: 'Send Message', description: 'SMS, Email, or Voice', icon: 'MessageSquare', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'messaging' },
  send_email: { type: 'send_email', label: 'Send Email', description: 'Send an email', icon: 'Mail', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'messaging' },
  send_sms: { type: 'send_sms', label: 'Send SMS', description: 'Send a text message', icon: 'MessageSquare', color: 'text-green-400', bgColor: 'bg-green-500/20', category: 'messaging' },
  send_whatsapp: { type: 'send_whatsapp', label: 'Send WhatsApp', description: 'Send WhatsApp message', icon: 'MessageCircle', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'messaging' },
  send_voicemail: { type: 'send_voicemail', label: 'Send Voicemail', description: 'Drop a voicemail', icon: 'Voicemail', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'messaging' },
  make_call: { type: 'make_call', label: 'Make Call', description: 'Initiate outbound call', icon: 'Phone', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'messaging' },
  notify_team: { type: 'notify_team', label: 'Notify Team', description: 'Alert team members', icon: 'Bell', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', category: 'messaging' },
  send_review_request: { type: 'send_review_request', label: 'Request Review', description: 'Ask for a review', icon: 'Star', color: 'text-amber-400', bgColor: 'bg-amber-500/20', category: 'messaging' },
  reply_in_comments: { type: 'reply_in_comments', label: 'Reply in Comments', description: 'Reply to social comments', icon: 'MessageCircle', color: 'text-pink-400', bgColor: 'bg-pink-500/20', category: 'messaging' },
  
  // CRM Actions
  create_contact: { type: 'create_contact', label: 'Create Contact', description: 'Add a new contact', icon: 'UserPlus', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'crm' },
  find_contact: { type: 'find_contact', label: 'Find Contact', description: 'Lookup contact by field', icon: 'Search', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'crm' },
  update_contact: { type: 'update_contact', label: 'Update Contact', description: 'Modify contact fields', icon: 'UserCog', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'crm' },
  delete_contact: { type: 'delete_contact', label: 'Delete Contact', description: 'Remove contact permanently', icon: 'UserMinus', color: 'text-red-400', bgColor: 'bg-red-500/20', category: 'crm' },
  add_tag: { type: 'add_tag', label: 'Add Tag', description: 'Tag for segmentation', icon: 'Tag', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'crm' },
  remove_tag: { type: 'remove_tag', label: 'Remove Tag', description: 'Remove a tag', icon: 'TagOff', color: 'text-red-400', bgColor: 'bg-red-500/20', category: 'crm' },
  add_task: { type: 'add_task', label: 'Create Task', description: 'Assign a follow-up task', icon: 'ClipboardList', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'crm' },
  add_note: { type: 'add_note', label: 'Add Note', description: 'Add a note to record', icon: 'StickyNote', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'crm' },
  assign_owner: { type: 'assign_owner', label: 'Assign Owner', description: 'Set lead or deal owner', icon: 'UserCheck', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', category: 'crm' },
  remove_owner: { type: 'remove_owner', label: 'Remove Owner', description: 'Unassign owner', icon: 'UserX', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'crm' },
  toggle_dnd: { type: 'toggle_dnd', label: 'Toggle DND', description: 'Enable/disable DND', icon: 'BellOff', color: 'text-orange-400', bgColor: 'bg-orange-500/20', category: 'crm' },
  copy_contact: { type: 'copy_contact', label: 'Copy Contact', description: 'Duplicate contact', icon: 'Copy', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'crm' },
  add_followers: { type: 'add_followers', label: 'Add Followers', description: 'Add team followers', icon: 'Users', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', category: 'crm' },
  remove_followers: { type: 'remove_followers', label: 'Remove Followers', description: 'Remove team followers', icon: 'UserMinus', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'crm' },
  
  // Appointment Actions
  book_appointment: { type: 'book_appointment', label: 'Book Appointment', description: 'Schedule an appointment', icon: 'CalendarPlus', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'appointment' },
  update_appointment: { type: 'update_appointment', label: 'Update Appointment', description: 'Modify appointment', icon: 'CalendarCog', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'appointment' },
  cancel_appointment: { type: 'cancel_appointment', label: 'Cancel Appointment', description: 'Cancel an appointment', icon: 'CalendarX', color: 'text-red-400', bgColor: 'bg-red-500/20', category: 'appointment' },
  create_booking_link: { type: 'create_booking_link', label: 'Create Booking Link', description: 'Generate booking URL', icon: 'Link', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'appointment' },
  log_call: { type: 'log_call', label: 'Log Call', description: 'Record call details', icon: 'PhoneCall', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'appointment' },
  
  // Pipeline Actions
  update_stage: { type: 'update_stage', label: 'Update Stage', description: 'Move in pipeline', icon: 'ArrowRightLeft', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'pipeline' },
  create_deal: { type: 'create_deal', label: 'Create Opportunity', description: 'Create a new deal', icon: 'Briefcase', color: 'text-violet-400', bgColor: 'bg-violet-500/20', category: 'pipeline' },
  update_deal: { type: 'update_deal', label: 'Update Opportunity', description: 'Modify deal details', icon: 'Edit', color: 'text-sky-400', bgColor: 'bg-sky-500/20', category: 'pipeline' },
  close_deal: { type: 'close_deal', label: 'Close Deal', description: 'Mark deal as won/lost', icon: 'CheckCircle', color: 'text-green-400', bgColor: 'bg-green-500/20', category: 'pipeline' },
  find_opportunity: { type: 'find_opportunity', label: 'Find Opportunity', description: 'Lookup opportunity', icon: 'Search', color: 'text-violet-400', bgColor: 'bg-violet-500/20', category: 'pipeline' },
  
  // Payment Actions
  send_invoice: { type: 'send_invoice', label: 'Send Invoice', description: 'Create and send invoice', icon: 'Receipt', color: 'text-green-400', bgColor: 'bg-green-500/20', category: 'payment' },
  charge_payment: { type: 'charge_payment', label: 'Charge Payment', description: 'One-time charge', icon: 'CreditCard', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', category: 'payment' },
  create_subscription: { type: 'create_subscription', label: 'Create Subscription', description: 'Start recurring billing', icon: 'Repeat', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'payment' },
  cancel_subscription: { type: 'cancel_subscription', label: 'Cancel Subscription', description: 'Stop recurring billing', icon: 'XCircle', color: 'text-red-400', bgColor: 'bg-red-500/20', category: 'payment' },
  
  // Flow Control
  time_delay: { type: 'time_delay', label: 'Wait', description: 'Pause before next step', icon: 'Clock', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  wait_until: { type: 'wait_until', label: 'Wait Until', description: 'Wait until date/time', icon: 'CalendarClock', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  business_hours: { type: 'business_hours', label: 'Business Hours', description: 'Wait for business hours', icon: 'Building2', color: 'text-teal-400', bgColor: 'bg-teal-500/20', category: 'flow' },
  condition: { type: 'condition', label: 'If / Else', description: 'Branch based on conditions', icon: 'GitBranch', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'flow' },
  split_test: { type: 'split_test', label: 'A/B Split', description: 'Random split testing', icon: 'Split', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'flow' },
  go_to: { type: 'go_to', label: 'Go To', description: 'Jump to another step', icon: 'CornerDownRight', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  run_workflow: { type: 'run_workflow', label: 'Run Workflow', description: 'Trigger another automation', icon: 'PlayCircle', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'flow' },
  stop_workflow: { type: 'stop_workflow', label: 'Stop', description: 'End this workflow', icon: 'StopCircle', color: 'text-red-500', bgColor: 'bg-red-500/20', category: 'flow' },
  goal_achieved: { type: 'goal_achieved', label: 'Goal Event', description: 'Mark goal as achieved', icon: 'Target', color: 'text-green-400', bgColor: 'bg-green-500/20', category: 'flow' },
  set_variable: { type: 'set_variable', label: 'Set Variable', description: 'Set custom value', icon: 'Variable', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'flow' },
  add_to_workflow: { type: 'add_to_workflow', label: 'Add to Workflow', description: 'Add to another workflow', icon: 'ListPlus', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'flow' },
  remove_from_workflow: { type: 'remove_from_workflow', label: 'Remove from Workflow', description: 'Remove from workflow', icon: 'ListMinus', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'flow' },
  
  // Data Transformation
  format_date: { type: 'format_date', label: 'Format Date', description: 'Convert date format', icon: 'Calendar', color: 'text-amber-400', bgColor: 'bg-amber-500/20', category: 'data' },
  format_number: { type: 'format_number', label: 'Format Number', description: 'Format number values', icon: 'Hash', color: 'text-amber-400', bgColor: 'bg-amber-500/20', category: 'data' },
  format_text: { type: 'format_text', label: 'Format Text', description: 'Transform text', icon: 'Type', color: 'text-amber-400', bgColor: 'bg-amber-500/20', category: 'data' },
  math_operation: { type: 'math_operation', label: 'Math Operation', description: 'Perform calculations', icon: 'Calculator', color: 'text-amber-400', bgColor: 'bg-amber-500/20', category: 'data' },
  
  // AI Actions
  ai_intent: { type: 'ai_intent', label: 'AI Intent Detection', description: 'Detect user intent', icon: 'Brain', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'ai' },
  ai_decision: { type: 'ai_decision', label: 'AI Decision Maker', description: 'Smart branching', icon: 'Sparkles', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'ai' },
  ai_translate: { type: 'ai_translate', label: 'AI Translate', description: 'Translate content', icon: 'Languages', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'ai' },
  ai_summarize: { type: 'ai_summarize', label: 'AI Summarize', description: 'Summarize content', icon: 'FileText', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'ai' },
  ai_message: { type: 'ai_message', label: 'AI Message', description: 'Generate AI response', icon: 'MessageSquarePlus', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'ai' },
  
  // Marketing
  meta_conversion: { type: 'meta_conversion', label: 'Meta Conversion', description: 'Send to Facebook CAPI', icon: 'Facebook', color: 'text-blue-500', bgColor: 'bg-blue-500/20', category: 'marketing' },
  google_conversion: { type: 'google_conversion', label: 'Google Conversion', description: 'Upload offline conversion to Google Ads', icon: 'BarChart', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', category: 'marketing' },
  add_to_audience: { type: 'add_to_audience', label: 'Add to Audience', description: 'Add to custom audience', icon: 'Users', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'marketing' },
  remove_from_audience: { type: 'remove_from_audience', label: 'Remove from Audience', description: 'Remove from audience', icon: 'UserMinus', color: 'text-slate-400', bgColor: 'bg-slate-500/20', category: 'marketing' },
  
  // Integrations
  custom_webhook: { type: 'custom_webhook', label: 'Webhook', description: 'Call external API', icon: 'Webhook', color: 'text-gray-400', bgColor: 'bg-gray-500/20', category: 'integration' },
  google_sheets: { type: 'google_sheets', label: 'Google Sheets', description: 'Add row to sheet', icon: 'Table', color: 'text-green-500', bgColor: 'bg-green-500/20', category: 'integration' },
  slack_message: { type: 'slack_message', label: 'Slack Message', description: 'Send to Slack', icon: 'Hash', color: 'text-purple-400', bgColor: 'bg-purple-500/20', category: 'integration' },
  discord_message: { type: 'discord_message', label: 'Discord Message', description: 'Send to Discord', icon: 'MessageCircle', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', category: 'integration' },
  tiktok_event: { type: 'tiktok_event', label: 'TikTok Event', description: 'Send conversion event', icon: 'Music', color: 'text-pink-400', bgColor: 'bg-pink-500/20', category: 'integration' },
  enqueue_dialer: { type: 'enqueue_dialer', label: 'Power Dialer', description: 'Add to dialer queue', icon: 'Phone', color: 'text-blue-400', bgColor: 'bg-blue-500/20', category: 'integration' },
};
