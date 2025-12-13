// src/lib/funnel/types.ts
// Canonical types for the Funnel System

export type StepIntent = 'capture' | 'collect' | 'schedule' | 'complete';

export type StepType = 
  | 'welcome'
  | 'text_question'
  | 'multi_choice'
  | 'email_capture'
  | 'phone_capture'
  | 'video'
  | 'thank_you'
  | 'opt_in'
  | 'embed';

export type LeadStatus = 'visitor' | 'partial' | 'lead' | 'booked';

export interface StepCapabilities {
  canCreateLead: boolean;        // Can create/update lead record
  canFinalizeLead: boolean;      // Is a capture authority (triggers workflows)
  canEmitEvents: boolean;        // Can fire pixel events
  canSchedule: boolean;          // Can trigger schedule events
}

export interface StepFieldSchema {
  required: string[];            // e.g., ['email'] for email_capture
  optional: string[];            // e.g., ['phone', 'name']
  extracted: string[];           // Fields to flatten to lead columns
}

export interface StepValidation {
  requiresInput: boolean;        // Must have user input to proceed
  inputValidator?: (value: any) => boolean;
}

export interface StepBuilderConfig {
  intentLocked: boolean;         // Can user change intent?
  allowedIntents: StepIntent[];  // Which intents are valid
  defaultIntent: StepIntent;     // Default intent for this step type
}

export interface StepDefinition {
  type: StepType;
  label: string;
  description: string;
  capabilities: StepCapabilities;
  fields: StepFieldSchema;
  validation: StepValidation;
  builder: StepBuilderConfig;
}

// Event payload shape for automation triggers
export interface FunnelEventPayload {
  eventId: string;
  teamId: string;
  funnelId: string;
  leadId: string;
  stepId: string;
  stepType: StepType;
  stepIntent: StepIntent;
  timestamp: string;
  lead: Record<string, any>;
}

// Lead state progression
export const LEAD_STATE_ORDER: LeadStatus[] = ['visitor', 'partial', 'lead', 'booked'];

export function getLeadStateLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    visitor: 'Visitor',
    partial: 'Partial',
    lead: 'Lead',
    booked: 'Booked',
  };
  return labels[status] || status;
}

export function getLeadStateBadgeColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    visitor: 'bg-muted text-muted-foreground',
    partial: 'bg-yellow-500/10 text-yellow-600',
    lead: 'bg-emerald-500/10 text-emerald-600',
    booked: 'bg-blue-500/10 text-blue-600',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}
