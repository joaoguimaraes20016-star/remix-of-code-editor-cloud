import type { FunnelEventType } from "@/lib/events/types";

export interface ElementDefinition {
  step_type: string;
  viewEvent?: FunnelEventType;
  completeEvent?: FunnelEventType;
  // helper to build a reasonable dedupe key for this element (optional)
  buildDedupeKey?: (funnelId: string, stepId: string, extra?: Record<string, any>) => string;
}

export const elementDefinitions: Record<string, ElementDefinition> = {
  welcome: {
    step_type: "welcome",
    viewEvent: "step_viewed",
  },
  text_question: {
    step_type: "text_question",
    viewEvent: "step_viewed",
    completeEvent: "step_completed",
    buildDedupeKey: (funnelId, stepId) => `step:${funnelId}:${stepId}`,
  },
  multi_choice: {
    step_type: "multi_choice",
    viewEvent: "step_viewed",
    completeEvent: "step_completed",
    buildDedupeKey: (funnelId, stepId) => `step:${funnelId}:${stepId}`,
  },
  email_capture: {
    step_type: "email_capture",
    viewEvent: "step_viewed",
    completeEvent: "lead_submitted",
    buildDedupeKey: (funnelId, stepId, extra) => extra?.email ? `lead:${extra.email}` : `step:${funnelId}:${stepId}`,
  },
  phone_capture: {
    step_type: "phone_capture",
    viewEvent: "step_viewed",
    completeEvent: "lead_submitted",
    buildDedupeKey: (funnelId, stepId, extra) => extra?.phone ? `lead:${extra.phone}` : `step:${funnelId}:${stepId}`,
  },
  opt_in: {
    step_type: "opt_in",
    viewEvent: "step_viewed",
    completeEvent: "lead_submitted",
    buildDedupeKey: (funnelId, stepId, extra) => extra?.email ? `lead:${extra.email}` : `step:${funnelId}:${stepId}`,
  },
  video: {
    step_type: "video",
    viewEvent: "step_viewed",
    completeEvent: "step_completed",
  },
  embed: {
    step_type: "embed",
    viewEvent: "step_viewed",
    completeEvent: "schedule",
  },
  thank_you: {
    step_type: "thank_you",
    viewEvent: "step_viewed",
  },
};

export default elementDefinitions;
