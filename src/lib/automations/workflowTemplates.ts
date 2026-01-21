import type { AutomationDefinition, TriggerType, ActionType } from "./types";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "appointment" | "lead" | "recovery" | "engagement";
  stepCount: number;
  estimatedSetupTime: string;
  trigger: TriggerType;
  steps: Array<{
    type: ActionType;
    config: Record<string, any>;
  }>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "appointment-confirmation",
    name: "Booking Confirmation",
    description: "Send instant confirmation when appointment is booked",
    category: "appointment",
    stepCount: 2,
    estimatedSetupTime: "2 min",
    trigger: "appointment_booked",
    steps: [
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Hi {{lead.first_name}}, your appointment is confirmed for {{appointment.date}} at {{appointment.time}}. Reply CONFIRM to confirm.",
        },
      },
      {
        type: "add_tag",
        config: { tag: "appointment-confirmed" },
      },
    ],
  },
  {
    id: "24h-reminder",
    name: "24-Hour Reminder",
    description: "Remind leads 24 hours before their appointment",
    category: "appointment",
    stepCount: 3,
    estimatedSetupTime: "3 min",
    trigger: "appointment_booked",
    steps: [
      {
        type: "time_delay",
        config: { delayValue: 24, delayType: "hours", relativeTo: "appointment_start", direction: "before" },
      },
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Reminder: Your appointment is tomorrow at {{appointment.time}}. See you then!",
        },
      },
      {
        type: "notify_team",
        config: { message: "Appointment reminder sent to {{lead.name}}" },
      },
    ],
  },
  {
    id: "no-show-followup",
    name: "No-Show Follow-Up",
    description: "Automatically reach out after a no-show",
    category: "recovery",
    stepCount: 4,
    estimatedSetupTime: "5 min",
    trigger: "appointment_no_show",
    steps: [
      {
        type: "add_tag",
        config: { tag: "no-show" },
      },
      {
        type: "time_delay",
        config: { delayValue: 1, delayType: "hours" },
      },
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Hi {{lead.first_name}}, we missed you today! Would you like to reschedule? Reply YES and we'll find a new time.",
        },
      },
      {
        type: "add_task",
        config: { title: "Follow up with no-show: {{lead.name}}", assignTo: "setter" },
      },
    ],
  },
  {
    id: "new-lead-welcome",
    name: "New Lead Welcome",
    description: "Welcome new leads with an instant message",
    category: "lead",
    stepCount: 3,
    estimatedSetupTime: "3 min",
    trigger: "form_submitted",
    steps: [
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Hey {{lead.first_name}}! Thanks for reaching out. We'll be in touch soon!",
        },
      },
      {
        type: "add_tag",
        config: { tag: "new-lead" },
      },
      {
        type: "notify_team",
        config: { message: "New lead: {{lead.name}} - {{lead.email}}" },
      },
    ],
  },
  {
    id: "lead-nurture",
    name: "Lead Nurture Sequence",
    description: "Multi-day follow-up sequence for new leads",
    category: "lead",
    stepCount: 5,
    estimatedSetupTime: "8 min",
    trigger: "lead_created",
    steps: [
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Hi {{lead.first_name}}, thanks for your interest! How can we help you today?",
        },
      },
      {
        type: "time_delay",
        config: { delayValue: 1, delayType: "days" },
      },
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Just following up - did you have any questions we can help with?",
        },
      },
      {
        type: "time_delay",
        config: { delayValue: 2, delayType: "days" },
      },
      {
        type: "add_task",
        config: { title: "Call lead: {{lead.name}}", assignTo: "setter" },
      },
    ],
  },
  {
    id: "deal-won-celebration",
    name: "Deal Won Celebration",
    description: "Notify team and thank customer when deal is closed",
    category: "engagement",
    stepCount: 3,
    estimatedSetupTime: "2 min",
    trigger: "deal_won",
    steps: [
      {
        type: "notify_team",
        config: { message: "🎉 Deal won! {{lead.name}} - {{deal.value}}" },
      },
      {
        type: "send_message",
        config: {
          channel: "sms",
          template: "Welcome to the family, {{lead.first_name}}! We're excited to work with you.",
        },
      },
      {
        type: "add_tag",
        config: { tag: "customer" },
      },
    ],
  },
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: WorkflowTemplate["category"]): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

export function createDefinitionFromTemplate(
  template: WorkflowTemplate,
  teamId: string
): AutomationDefinition {
  return {
    id: crypto.randomUUID(),
    teamId,
    name: template.name,
    description: template.description,
    isActive: true,
    trigger: {
      type: template.trigger,
      config: {},
    },
    steps: template.steps.map((step, index) => ({
      id: `step-${Date.now()}-${index}`,
      order: index + 1,
      type: step.type,
      config: step.config,
    })),
  };
}
