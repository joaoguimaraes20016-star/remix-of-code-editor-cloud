import type { TriggerType, ActionType, AutomationStep } from "./types";

export interface SuggestedAction {
  type: ActionType;
  label: string;
  description: string;
  priority: number; // 1 = highest priority
}

// Context-aware suggestions based on trigger type
const TRIGGER_SUGGESTIONS: Partial<Record<TriggerType, SuggestedAction[]>> = {
  appointment_booked: [
    { type: "send_message", label: "Send Confirmation", description: "Confirm the booking via SMS", priority: 1 },
    { type: "time_delay", label: "Wait Before Reminder", description: "Add a delay before sending reminder", priority: 2 },
    { type: "add_tag", label: "Tag as Booked", description: "Track booked appointments", priority: 3 },
  ],
  appointment_no_show: [
    { type: "add_tag", label: "Tag as No-Show", description: "Mark the lead for follow-up", priority: 1 },
    { type: "time_delay", label: "Wait 1 Hour", description: "Give them time before reaching out", priority: 2 },
    { type: "send_message", label: "Re-engagement SMS", description: "Offer to reschedule", priority: 3 },
  ],
  appointment_completed: [
    { type: "notify_team", label: "Notify Team", description: "Alert closer about completion", priority: 1 },
    { type: "add_tag", label: "Mark Complete", description: "Tag for tracking", priority: 2 },
    { type: "update_stage", label: "Move to Next Stage", description: "Progress in pipeline", priority: 3 },
  ],
  appointment_rescheduled: [
    { type: "send_message", label: "Confirm New Time", description: "Send updated details", priority: 1 },
    { type: "notify_team", label: "Alert Team", description: "Inform assigned rep", priority: 2 },
  ],
  appointment_canceled: [
    { type: "add_tag", label: "Tag Canceled", description: "Track canceled appointments", priority: 1 },
    { type: "add_task", label: "Create Follow-Up Task", description: "Assign team member to reach out", priority: 2 },
    { type: "send_message", label: "Win-Back Message", description: "Try to re-engage", priority: 3 },
  ],
  form_submitted: [
    { type: "send_message", label: "Welcome Message", description: "Thank them for submitting", priority: 1 },
    { type: "add_tag", label: "Tag New Lead", description: "Categorize the lead", priority: 2 },
    { type: "notify_team", label: "Alert Team", description: "Notify about new submission", priority: 3 },
  ],
  lead_created: [
    { type: "send_message", label: "Welcome SMS", description: "First touch with the lead", priority: 1 },
    { type: "add_tag", label: "Add Source Tag", description: "Track lead origin", priority: 2 },
    { type: "add_task", label: "Assign Outreach", description: "Create task for team", priority: 3 },
  ],
  lead_tag_added: [
    { type: "condition", label: "Check Tag Value", description: "Branch based on which tag", priority: 1 },
    { type: "send_message", label: "Send Targeted Message", description: "Message based on tag", priority: 2 },
  ],
  lead_tag_removed: [
    { type: "condition", label: "Check Tag Value", description: "Branch based on which tag", priority: 1 },
    { type: "update_stage", label: "Update Pipeline", description: "Reflect status change", priority: 2 },
  ],
  stage_changed: [
    { type: "notify_team", label: "Notify Team", description: "Alert about stage change", priority: 1 },
    { type: "send_message", label: "Stage-Based Message", description: "Send relevant update", priority: 2 },
    { type: "add_task", label: "Create Next Task", description: "Assign follow-up action", priority: 3 },
  ],
  deal_created: [
    { type: "notify_team", label: "Alert Sales Team", description: "New deal notification", priority: 1 },
    { type: "add_tag", label: "Tag Opportunity", description: "Categorize the deal", priority: 2 },
  ],
  deal_won: [
    { type: "notify_team", label: "Celebrate!", description: "Let the team know", priority: 1 },
    { type: "send_message", label: "Thank Customer", description: "Welcome message", priority: 2 },
    { type: "add_tag", label: "Tag as Customer", description: "Update status", priority: 3 },
  ],
  deal_lost: [
    { type: "add_tag", label: "Tag Lost", description: "Track lost deals", priority: 1 },
    { type: "add_task", label: "Loss Review", description: "Analyze what happened", priority: 2 },
  ],
  payment_received: [
    { type: "send_message", label: "Payment Confirmation", description: "Thank for payment", priority: 1 },
    { type: "notify_team", label: "Alert Finance", description: "Payment received", priority: 2 },
  ],
  payment_failed: [
    { type: "send_message", label: "Payment Failed Notice", description: "Alert customer", priority: 1 },
    { type: "add_task", label: "Follow Up", description: "Resolve payment issue", priority: 2 },
  ],
  webhook_received: [
    { type: "condition", label: "Check Payload", description: "Branch based on data", priority: 1 },
    { type: "custom_webhook", label: "Forward Data", description: "Send to another service", priority: 2 },
  ],
  manual_trigger: [
    { type: "send_message", label: "Send Message", description: "Manual outreach", priority: 1 },
    { type: "add_tag", label: "Apply Tag", description: "Bulk tagging", priority: 2 },
  ],
  scheduled_trigger: [
    { type: "send_message", label: "Scheduled Message", description: "Timed outreach", priority: 1 },
    { type: "notify_team", label: "Daily Digest", description: "Team notification", priority: 2 },
  ],
  time_delay: [
    { type: "send_message", label: "Send Message", description: "Delayed outreach", priority: 1 },
  ],
};

// Suggestions based on last action in the workflow
const AFTER_ACTION_SUGGESTIONS: Partial<Record<ActionType, SuggestedAction[]>> = {
  send_message: [
    { type: "time_delay", label: "Wait for Response", description: "Give time before next action", priority: 1 },
    { type: "condition", label: "Check Response", description: "Branch based on reply", priority: 2 },
    { type: "add_tag", label: "Track Sent", description: "Tag for tracking", priority: 3 },
  ],
  time_delay: [
    { type: "send_message", label: "Send Follow-Up", description: "Next message in sequence", priority: 1 },
    { type: "condition", label: "Check Status", description: "Evaluate before continuing", priority: 2 },
    { type: "notify_team", label: "Alert Team", description: "Time-based notification", priority: 3 },
  ],
  add_tag: [
    { type: "send_message", label: "Send Message", description: "Tag-triggered message", priority: 1 },
    { type: "notify_team", label: "Notify Team", description: "Alert about tag", priority: 2 },
  ],
  condition: [
    { type: "send_message", label: "Send Message", description: "Conditional message", priority: 1 },
    { type: "add_tag", label: "Apply Tag", description: "Conditional tagging", priority: 2 },
    { type: "update_stage", label: "Update Stage", description: "Conditional pipeline", priority: 3 },
  ],
  notify_team: [
    { type: "add_task", label: "Create Task", description: "Assign follow-up", priority: 1 },
    { type: "time_delay", label: "Wait", description: "Delay next action", priority: 2 },
  ],
  add_task: [
    { type: "time_delay", label: "Wait for Completion", description: "Allow time for task", priority: 1 },
    { type: "notify_team", label: "Remind Team", description: "Task follow-up", priority: 2 },
  ],
  update_stage: [
    { type: "send_message", label: "Stage Update Message", description: "Inform about change", priority: 1 },
    { type: "notify_team", label: "Alert Team", description: "Stage notification", priority: 2 },
  ],
  assign_owner: [
    { type: "notify_team", label: "Notify New Owner", description: "Alert assigned person", priority: 1 },
    { type: "add_task", label: "Create Onboarding Task", description: "First action for owner", priority: 2 },
  ],
  custom_webhook: [
    { type: "time_delay", label: "Wait for Response", description: "Allow webhook processing", priority: 1 },
    { type: "condition", label: "Check Result", description: "Branch on webhook response", priority: 2 },
  ],
  // Default suggestions for less common actions
  remove_tag: [{ type: "send_message", label: "Send Message", description: "Next step", priority: 1 }],
  create_contact: [{ type: "add_tag", label: "Tag Contact", description: "Categorize", priority: 1 }],
  update_contact: [{ type: "notify_team", label: "Notify", description: "Alert team", priority: 1 }],
  add_note: [{ type: "add_task", label: "Create Task", description: "Follow up", priority: 1 }],
  create_deal: [{ type: "notify_team", label: "Alert Sales", description: "New opportunity", priority: 1 }],
  close_deal: [{ type: "send_message", label: "Thank Customer", description: "Closing message", priority: 1 }],
  wait_until: [{ type: "send_message", label: "Send Message", description: "Timed action", priority: 1 }],
  business_hours: [{ type: "send_message", label: "Send Message", description: "During hours", priority: 1 }],
  split_test: [{ type: "send_message", label: "Variant A", description: "Test message", priority: 1 }],
  go_to: [],
  run_workflow: [],
  stop_workflow: [],
  enqueue_dialer: [{ type: "add_tag", label: "Mark Queued", description: "Track status", priority: 1 }],
};

export function getSuggestionsForTrigger(triggerType: TriggerType): SuggestedAction[] {
  return TRIGGER_SUGGESTIONS[triggerType] || TRIGGER_SUGGESTIONS.manual_trigger;
}

export function getSuggestionsAfterAction(actionType: ActionType): SuggestedAction[] {
  return AFTER_ACTION_SUGGESTIONS[actionType] || [
    { type: "send_message", label: "Send Message", description: "Continue workflow", priority: 1 },
    { type: "time_delay", label: "Add Delay", description: "Wait before next step", priority: 2 },
  ];
}

export function getContextualSuggestions(
  triggerType: TriggerType,
  steps: AutomationStep[]
): SuggestedAction[] {
  if (steps.length === 0) {
    return getSuggestionsForTrigger(triggerType);
  }
  
  const lastStep = steps[steps.length - 1];
  return getSuggestionsAfterAction(lastStep.type);
}

export const QUICK_ACTIONS: SuggestedAction[] = [
  { type: "send_message", label: "Send Message", description: "SMS, email, or notification", priority: 1 },
  { type: "time_delay", label: "Wait / Delay", description: "Pause before next step", priority: 2 },
  { type: "condition", label: "If / Else", description: "Add branching logic", priority: 3 },
];
