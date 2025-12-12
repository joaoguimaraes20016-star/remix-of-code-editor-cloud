// src/lib/workflows/sampleTemplates.ts
import type { WorkflowDefinition } from './types';

/**
 * Opinionated starter workflows you can show in the UI
 * when a new team/workspace joins.
 */

export const sampleWorkflows: WorkflowDefinition[] = [
  {
    id: 'lead-nurture-new-lead',
    teamId: 'TEMPLATE',
    name: 'New Lead – 2-Day Nurture',
    description: 'Sends a welcome SMS and a follow-up reminder for new leads.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'trigger-1',
        kind: 'trigger',
        label: 'New Lead Created',
        triggerType: 'lead_created',
      },
      {
        id: 'action-1',
        kind: 'action',
        label: 'Send welcome SMS',
        actionType: 'send_message',
        config: {
          channel: 'sms',
          template: "Hey {{lead.first_name}}, it's {{team.name}}. Got your info – reply YES to confirm.",
        },
      },
      {
        id: 'action-2',
        kind: 'action',
        label: 'Follow-up after 1 day',
        actionType: 'time_delay',
        config: {
          delayHours: 24,
        },
      },
      {
        id: 'action-3',
        kind: 'action',
        label: 'Second SMS',
        actionType: 'send_message',
        config: {
          channel: 'sms',
          template: "Still interested in working with us, {{lead.first_name}}?",
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'action-1' },
      { id: 'e2', fromNodeId: 'action-1', toNodeId: 'action-2' },
      { id: 'e3', fromNodeId: 'action-2', toNodeId: 'action-3' },
    ],
  },
];
