// src/lib/automations/variableSchema.ts
// GHL-grade variable schema for template pickers

export interface VariableDefinition {
  key: string;
  label: string;
  description?: string;
  type: "string" | "number" | "date" | "boolean" | "array" | "object";
}

export interface VariableGroup {
  id: string;
  label: string;
  icon?: string;
  variables: VariableDefinition[];
}

// --- Contact/Lead Variables ---
const CONTACT_VARIABLES: VariableDefinition[] = [
  { key: "contact.id", label: "Contact ID", type: "string" },
  { key: "contact.full_name", label: "Full Name", type: "string", description: "First + Last name combined" },
  { key: "contact.first_name", label: "First Name", type: "string" },
  { key: "contact.last_name", label: "Last Name", type: "string" },
  { key: "contact.email", label: "Email", type: "string" },
  { key: "contact.phone", label: "Phone (E.164)", type: "string", description: "Normalized format: +14045551212" },
  { key: "contact.phone_raw", label: "Phone (Raw)", type: "string", description: "Original format: (404) 555-1212" },
  { key: "contact.company_name", label: "Company Name", type: "string" },
  { key: "contact.website", label: "Website", type: "string" },
  { key: "contact.source", label: "Source", type: "string", description: "Lead source (facebook, manual, import, etc.)" },
  { key: "contact.contact_type", label: "Contact Type", type: "string", description: "lead, customer, vendor" },
  { key: "contact.timezone", label: "Timezone", type: "string", description: "IANA timezone (e.g., America/New_York)" },
  { key: "contact.date_of_birth", label: "Date of Birth", type: "date" },
  { key: "contact.signature", label: "Signature", type: "string" },
  { key: "contact.calendar_link", label: "Calendar Link", type: "string", description: "Personal booking link" },
  { key: "contact.twilio_phone", label: "Twilio Phone", type: "string", description: "Assigned outbound number" },
  { key: "contact.address_1", label: "Street Address", type: "string" },
  { key: "contact.address_2", label: "Address Line 2", type: "string" },
  { key: "contact.city", label: "City", type: "string" },
  { key: "contact.state", label: "State", type: "string" },
  { key: "contact.postal_code", label: "ZIP/Postal Code", type: "string" },
  { key: "contact.country", label: "Country", type: "string" },
  { key: "contact.tags", label: "Tags", type: "array", description: "Comma-separated tag list" },
  { key: "contact.engagement_score", label: "Engagement Score", type: "number" },
  { key: "contact.dnd_sms", label: "DND SMS", type: "boolean" },
  { key: "contact.dnd_email", label: "DND Email", type: "boolean" },
  { key: "contact.dnd_voice", label: "DND Voice", type: "boolean" },
  { key: "contact.created_at", label: "Created At", type: "date" },
  { key: "contact.updated_at", label: "Updated At", type: "date" },
  { key: "contact.last_activity_at", label: "Last Activity", type: "date" },
];

// --- Appointment Variables ---
const APPOINTMENT_VARIABLES: VariableDefinition[] = [
  { key: "appointment.id", label: "Appointment ID", type: "string" },
  { key: "appointment.start_datetime", label: "Start Date/Time", type: "date", description: "Full timestamp" },
  { key: "appointment.start_date", label: "Start Date", type: "date", description: "Date only (YYYY-MM-DD)" },
  { key: "appointment.start_time", label: "Start Time", type: "string", description: "Time only (h:mm A)" },
  { key: "appointment.end_datetime", label: "End Date/Time", type: "date" },
  { key: "appointment.end_date", label: "End Date", type: "date" },
  { key: "appointment.end_time", label: "End Time", type: "string" },
  { key: "appointment.day_of_week", label: "Day of Week", type: "string", description: "Monday, Tuesday, etc." },
  { key: "appointment.month", label: "Month Number", type: "number", description: "1-12" },
  { key: "appointment.name_of_month", label: "Month Name", type: "string", description: "January, February, etc." },
  { key: "appointment.timezone", label: "Timezone", type: "string" },
  { key: "appointment.duration_minutes", label: "Duration (Minutes)", type: "number" },
  { key: "appointment.meeting_location", label: "Meeting Location", type: "string", description: "Zoom, Google Meet, address, etc." },
  { key: "appointment.meeting_link", label: "Meeting Link", type: "string" },
  { key: "appointment.notes", label: "Notes", type: "string" },
  { key: "appointment.cancellation_link", label: "Cancellation Link", type: "string" },
  { key: "appointment.reschedule_link", label: "Reschedule Link", type: "string" },
  { key: "appointment.cancellation_reason", label: "Cancellation Reason", type: "string" },
  { key: "appointment.add_to_google_calendar", label: "Add to Google Calendar", type: "string" },
  { key: "appointment.add_to_ical_outlook", label: "Add to iCal/Outlook", type: "string" },
  { key: "appointment.status", label: "Status", type: "string", description: "booked, confirmed, cancelled, etc." },
  { key: "appointment.event_type_name", label: "Event Type", type: "string" },
  { key: "appointment.recurring", label: "Is Recurring", type: "boolean" },
  { key: "appointment.assigned_user.name", label: "Assigned User Name", type: "string" },
  { key: "appointment.assigned_user.email", label: "Assigned User Email", type: "string" },
];

// --- Team/Role Variables ---
const TEAM_VARIABLES: VariableDefinition[] = [
  { key: "team.id", label: "Team ID", type: "string" },
  { key: "team.name", label: "Team Name", type: "string" },
  { key: "setter.id", label: "Setter ID", type: "string" },
  { key: "setter.name", label: "Setter Name", type: "string" },
  { key: "setter.email", label: "Setter Email", type: "string" },
  { key: "closer.id", label: "Closer ID", type: "string" },
  { key: "closer.name", label: "Closer Name", type: "string" },
  { key: "closer.email", label: "Closer Email", type: "string" },
  { key: "owner.id", label: "Owner ID", type: "string", description: "Assigned contact owner" },
  { key: "owner.name", label: "Owner Name", type: "string" },
  { key: "owner.email", label: "Owner Email", type: "string" },
];

// --- System/Other Variables ---
const SYSTEM_VARIABLES: VariableDefinition[] = [
  { key: "system.current_date", label: "Current Date", type: "date", description: "Today's date (YYYY-MM-DD)" },
  { key: "system.current_time", label: "Current Time", type: "string", description: "Current time (HH:MM:SS)" },
  { key: "system.now", label: "Current Timestamp", type: "date", description: "Full ISO timestamp" },
  { key: "system.timezone", label: "System Timezone", type: "string" },
];

// --- Payment/Deal Variables ---
const PAYMENT_VARIABLES: VariableDefinition[] = [
  { key: "payment.id", label: "Payment ID", type: "string" },
  { key: "payment.amount", label: "Amount", type: "number" },
  { key: "payment.currency", label: "Currency", type: "string" },
  { key: "payment.status", label: "Status", type: "string" },
  { key: "payment.method", label: "Payment Method", type: "string" },
  { key: "deal.id", label: "Deal ID", type: "string" },
  { key: "deal.name", label: "Deal Name", type: "string" },
  { key: "deal.value", label: "Deal Value", type: "number" },
  { key: "deal.stage", label: "Pipeline Stage", type: "string" },
  { key: "deal.probability", label: "Win Probability", type: "number" },
];

// --- All Variable Groups ---
export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    id: "contact",
    label: "Contact / Lead",
    icon: "User",
    variables: CONTACT_VARIABLES,
  },
  {
    id: "appointment",
    label: "Appointment",
    icon: "Calendar",
    variables: APPOINTMENT_VARIABLES,
  },
  {
    id: "team",
    label: "Team & Roles",
    icon: "Users",
    variables: TEAM_VARIABLES,
  },
  {
    id: "payment",
    label: "Payment & Deal",
    icon: "DollarSign",
    variables: PAYMENT_VARIABLES,
  },
  {
    id: "system",
    label: "System",
    icon: "Settings",
    variables: SYSTEM_VARIABLES,
  },
];

// --- Get all variables as flat array ---
export function getAllVariables(): VariableDefinition[] {
  return VARIABLE_GROUPS.flatMap((g) => g.variables);
}

// --- Get variable by key ---
export function getVariableByKey(key: string): VariableDefinition | undefined {
  return getAllVariables().find((v) => v.key === key);
}

// --- Condition Operators by Type ---
export interface OperatorDefinition {
  value: string;
  label: string;
  description?: string;
  requiresValue: boolean;
  valueType?: "string" | "number" | "date" | "array" | "boolean";
}

export const STRING_OPERATORS: OperatorDefinition[] = [
  { value: "equals", label: "Equals", requiresValue: true },
  { value: "not_equals", label: "Does not equal", requiresValue: true },
  { value: "contains", label: "Contains", requiresValue: true },
  { value: "not_contains", label: "Does not contain", requiresValue: true },
  { value: "starts_with", label: "Starts with", requiresValue: true },
  { value: "ends_with", label: "Ends with", requiresValue: true },
  { value: "regex", label: "Matches regex", requiresValue: true },
  { value: "is_set", label: "Is set (not empty)", requiresValue: false },
  { value: "is_not_set", label: "Is not set (empty)", requiresValue: false },
];

export const NUMBER_OPERATORS: OperatorDefinition[] = [
  { value: "equals", label: "Equals", requiresValue: true, valueType: "number" },
  { value: "not_equals", label: "Does not equal", requiresValue: true, valueType: "number" },
  { value: "greater_than", label: "Greater than", requiresValue: true, valueType: "number" },
  { value: "greater_or_equal", label: "Greater or equal", requiresValue: true, valueType: "number" },
  { value: "less_than", label: "Less than", requiresValue: true, valueType: "number" },
  { value: "less_or_equal", label: "Less or equal", requiresValue: true, valueType: "number" },
  { value: "between", label: "Between", requiresValue: true, valueType: "array" },
  { value: "is_set", label: "Is set", requiresValue: false },
  { value: "is_not_set", label: "Is not set", requiresValue: false },
];

export const DATE_OPERATORS: OperatorDefinition[] = [
  { value: "equals", label: "Equals", requiresValue: true, valueType: "date" },
  { value: "before", label: "Before", requiresValue: true, valueType: "date" },
  { value: "after", label: "After", requiresValue: true, valueType: "date" },
  { value: "within_last_minutes", label: "Within last X minutes", requiresValue: true, valueType: "number" },
  { value: "within_last_hours", label: "Within last X hours", requiresValue: true, valueType: "number" },
  { value: "within_last_days", label: "Within last X days", requiresValue: true, valueType: "number" },
  { value: "after_now_minutes", label: "More than X minutes from now", requiresValue: true, valueType: "number" },
  { value: "day_of_week_is", label: "Day of week is", requiresValue: true, valueType: "string" },
  { value: "month_is", label: "Month is", requiresValue: true, valueType: "number" },
  { value: "is_set", label: "Is set", requiresValue: false },
  { value: "is_not_set", label: "Is not set", requiresValue: false },
];

export const BOOLEAN_OPERATORS: OperatorDefinition[] = [
  { value: "is_true", label: "Is true", requiresValue: false },
  { value: "is_false", label: "Is false", requiresValue: false },
];

export const ARRAY_OPERATORS: OperatorDefinition[] = [
  { value: "contains", label: "Contains", requiresValue: true },
  { value: "not_contains", label: "Does not contain", requiresValue: true },
  { value: "contains_any", label: "Contains any of", requiresValue: true, valueType: "array" },
  { value: "contains_all", label: "Contains all of", requiresValue: true, valueType: "array" },
  { value: "is_empty", label: "Is empty", requiresValue: false },
  { value: "is_not_empty", label: "Is not empty", requiresValue: false },
];

// --- Get operators for a variable type ---
export function getOperatorsForType(type: VariableDefinition["type"]): OperatorDefinition[] {
  switch (type) {
    case "string":
      return STRING_OPERATORS;
    case "number":
      return NUMBER_OPERATORS;
    case "date":
      return DATE_OPERATORS;
    case "boolean":
      return BOOLEAN_OPERATORS;
    case "array":
      return ARRAY_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

// --- Field options for condition builder (flat list) ---
export const CONDITION_FIELD_OPTIONS = getAllVariables().map((v) => ({
  value: v.key,
  label: v.label,
  group: VARIABLE_GROUPS.find((g) => g.variables.includes(v))?.label || "Other",
  type: v.type,
}));
