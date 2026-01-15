// Application Engine - Unified Interactive System
// Export all shared types, components, and hooks

// Types
export * from './types/applicationEngine';

// Components
export { ApplicationStepRenderer } from './components/ApplicationStepRenderer';

// Hooks
export { useConsentRequired, stepRequiresConsent, anyStepRequiresConsent } from './hooks/useConsentRequired';

// Adapters (for legacy compatibility)
export { 
  captureNodeToApplicationStep,
  applicationFlowStepToApplicationStep,
  applicationStepToCaptureNode,
} from './adapters/legacyAdapters';
