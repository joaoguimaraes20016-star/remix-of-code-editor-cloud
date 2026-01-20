// Application Engine - Unified Interactive System
// Export all shared types, components, and hooks

// Types
export * from './types/applicationEngine';

// Components
export { ApplicationStepRenderer } from './components/ApplicationStepRenderer';

// Hooks
export { useConsentRequired, stepRequiresConsent, anyStepRequiresConsent } from './hooks/useConsentRequired';
export { 
  useApplicationSubmit, 
  extractIdentityFromAnswers as extractIdentityFromAnswersLegacy, 
  createSubmitPayload as createSubmitPayloadLegacy,
  type ApplicationSubmitPayload,
  type ApplicationSubmitOptions,
  type UseApplicationSubmitReturn,
} from './hooks/useApplicationSubmit';

// Unified lead submission hook (preferred for all new code)
export {
  useUnifiedLeadSubmit,
  extractIdentityFromAnswers,
  createUnifiedPayload,
  type UnifiedSubmitPayload,
  type UnifiedLeadSubmitOptions,
  type UnifiedLeadSubmitReturn,
  type LeadIdentity,
  type LeadConsent,
  type LeadSource,
  type LeadMetadata,
} from './hooks/useUnifiedLeadSubmit';

// Adapters (for legacy compatibility)
export { 
  captureNodeToApplicationStep,
  applicationFlowStepToApplicationStep,
  applicationStepToCaptureNode,
  funnelStepToApplicationSteps,
  getApplicationFlowConfig,
} from './adapters/legacyAdapters';

// Inspector (unified editor panel)
export { ApplicationStepInspector } from '@/flow-canvas/builder/components/inspectors/ApplicationStepInspector';
