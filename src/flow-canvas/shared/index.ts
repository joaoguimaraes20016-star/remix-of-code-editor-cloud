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
  extractIdentityFromAnswers, 
  createSubmitPayload,
  type ApplicationSubmitPayload,
  type ApplicationSubmitOptions,
  type UseApplicationSubmitReturn,
} from './hooks/useApplicationSubmit';

// Adapters (for legacy compatibility)
export { 
  captureNodeToApplicationStep,
  applicationFlowStepToApplicationStep,
  applicationStepToCaptureNode,
  funnelStepToApplicationSteps,
  getApplicationFlowConfig,
} from './adapters/legacyAdapters';
