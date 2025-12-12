// src/lib/automations/contextBuilder.ts
import type { TriggerType } from './types';

export interface AutomationContextBase {
  teamId: string;
  triggerType: TriggerType;
  now: string; // ISO timestamp of evaluation
}

/**
 * Extend this type as you add more entities (pipeline, custom objects, etc.)
 */
export interface AutomationContext extends AutomationContextBase {
  lead?: Record<string, any> | null;
  appointment?: Record<string, any> | null;
  payment?: Record<string, any> | null;
  deal?: Record<string, any> | null;
  meta?: Record<string, any> | null;
}

/**
 * Normalizes raw event payloads into a consistent context object
 * that can be used by:
 *  - conditions.ts
 *  - templateUtils.ts
 *  - actions.ts
 */
export function buildAutomationContext(
  triggerType: TriggerType,
  payload: Record<string, any>,
): AutomationContext {
  const { teamId } = payload;

  return {
    teamId,
    triggerType,
    now: new Date().toISOString(),
    lead: payload.lead ?? null,
    appointment: payload.appointment ?? null,
    payment: payload.payment ?? null,
    deal: payload.deal ?? null,
    meta: payload.meta ?? null,
  };
}
