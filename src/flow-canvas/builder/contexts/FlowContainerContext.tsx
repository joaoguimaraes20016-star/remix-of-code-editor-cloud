/**
 * FlowContainer Context
 * 
 * SINGLE SOURCE OF TRUTH for all step/flow progression in the builder.
 * 
 * This context ALONE may:
 * - Track current step index
 * - Decide when "Next Step" is allowed
 * - Decide when "Submit" fires
 * - Own step order
 * - Own form state submission
 * 
 * Buttons and blocks ONLY emit intent. They do NOT execute logic.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ============ INTENT TYPES ============
// Buttons emit these. FlowContainer decides what to do.

export type FlowIntent =
  | { type: 'next-step' }
  | { type: 'prev-step' }
  | { type: 'go-to-step'; stepId: string }
  | { type: 'submit'; values?: Record<string, unknown> }
  | { type: 'url'; url: string; openNewTab?: boolean }
  | { type: 'scroll'; selector: string }
  | { type: 'phone'; number: string }
  | { type: 'email'; address: string }
  | { type: 'download'; url: string };

// ============ STEP TYPE ============

export interface FlowStep {
  id: string;
  name?: string;
}

// ============ CONTEXT VALUE ============

interface FlowContainerContextValue {
  // Current state
  steps: FlowStep[];
  currentStepId: string | null;
  currentStepIndex: number;
  
  // Form values collected during flow
  formValues: Record<string, unknown>;
  
  // Computed properties
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
  
  // Intent handler - ONLY way to trigger progression
  emitIntent: (intent: FlowIntent) => void;
  
  // Direct step control (for builder step navigation, not buttons)
  setCurrentStepId: (stepId: string) => void;
  setSteps: (steps: FlowStep[]) => void;
  
  // Form value collection
  setFormValue: (key: string, value: unknown) => void;
  clearFormValues: () => void;
}

const FlowContainerContext = createContext<FlowContainerContextValue | null>(null);

// ============ PROVIDER PROPS ============

interface FlowContainerProviderProps {
  children: React.ReactNode;
  /** Initial steps in the flow */
  initialSteps?: FlowStep[];
  /** Initial step ID (defaults to first step) */
  initialStepId?: string;
  /** Called when submit intent is emitted */
  onSubmit?: (values: Record<string, unknown>) => void;
  /** Called when step changes */
  onStepChange?: (stepId: string, index: number) => void;
  /** Whether this is preview mode (enables progression) */
  isPreviewMode?: boolean;
}

// ============ PROVIDER ============

export function FlowContainerProvider({
  children,
  initialSteps = [],
  initialStepId,
  onSubmit,
  onStepChange,
  isPreviewMode = false,
}: FlowContainerProviderProps) {
  const [steps, setStepsState] = useState<FlowStep[]>(initialSteps);
  const [currentStepId, setCurrentStepIdState] = useState<string | null>(
    initialStepId || initialSteps[0]?.id || null
  );
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  
  // Derived state
  const currentStepIndex = useMemo(() => {
    if (!currentStepId) return 0;
    const index = steps.findIndex(s => s.id === currentStepId);
    return index >= 0 ? index : 0;
  }, [currentStepId, steps]);
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;
  
  // Set current step with callback
  const setCurrentStepId = useCallback((stepId: string) => {
    const stepExists = steps.some(s => s.id === stepId);
    if (stepExists) {
      setCurrentStepIdState(stepId);
      const index = steps.findIndex(s => s.id === stepId);
      onStepChange?.(stepId, index);
    }
  }, [steps, onStepChange]);
  
  // Set steps list
  const setSteps = useCallback((newSteps: FlowStep[]) => {
    setStepsState(newSteps);
    // If current step doesn't exist in new steps, reset to first
    if (currentStepId && !newSteps.some(s => s.id === currentStepId)) {
      const firstId = newSteps[0]?.id || null;
      setCurrentStepIdState(firstId);
      if (firstId) {
        onStepChange?.(firstId, 0);
      }
    }
  }, [currentStepId, onStepChange]);
  
  // Form value management
  const setFormValue = useCallback((key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFormValues = useCallback(() => {
    setFormValues({});
  }, []);
  
  // CRITICAL: Intent handler - ALL progression logic lives here
  // This is the SOLE AUTHORITY for step progression. No fallbacks exist.
  const emitIntent = useCallback((intent: FlowIntent) => {
    // Intent is ALWAYS processed - never silently dropped
    // In non-preview mode: external actions (url, scroll, etc.) still work
    // but step progression is blocked
    const canProgress = isPreviewMode;
    
    switch (intent.type) {
      case 'next-step': {
        // Step progression requires preview mode
        if (!canProgress) return;
        
        if (!isLastStep && steps.length > 0) {
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep) {
            setCurrentStepId(nextStep.id);
          }
        } else if (isLastStep) {
          // Last step - treat as submit
          onSubmit?.(formValues);
        }
        break;
      }
      
      case 'prev-step': {
        // Step progression requires preview mode
        if (!canProgress) return;
        
        if (!isFirstStep && steps.length > 0) {
          const prevStep = steps[currentStepIndex - 1];
          if (prevStep) {
            setCurrentStepId(prevStep.id);
          }
        }
        break;
      }
      
      case 'go-to-step': {
        // Step progression requires preview mode
        if (!canProgress) return;
        
        setCurrentStepId(intent.stepId);
        break;
      }
      
      case 'submit': {
        // Submit requires preview mode
        if (!canProgress) return;
        
        const allValues = { ...formValues, ...(intent.values || {}) };
        onSubmit?.(allValues);
        break;
      }
      
      // External actions work in both edit and preview mode
      case 'url': {
        if (intent.url) {
          if (intent.openNewTab) {
            window.open(intent.url, '_blank');
          } else {
            window.location.href = intent.url;
          }
        }
        break;
      }
      
      case 'scroll': {
        if (intent.selector) {
          document.querySelector(intent.selector)?.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      }
      
      case 'phone': {
        if (intent.number) {
          window.location.href = `tel:${intent.number}`;
        }
        break;
      }
      
      case 'email': {
        if (intent.address) {
          window.location.href = `mailto:${intent.address}`;
        }
        break;
      }
      
      case 'download': {
        if (intent.url) {
          window.open(intent.url, '_blank');
        }
        break;
      }
    }
  }, [isPreviewMode, isLastStep, isFirstStep, steps, currentStepIndex, formValues, setCurrentStepId, onSubmit]);
  
  // Memoized context value
  const value = useMemo<FlowContainerContextValue>(() => ({
    steps,
    currentStepId,
    currentStepIndex,
    formValues,
    isFirstStep,
    isLastStep,
    totalSteps,
    emitIntent,
    setCurrentStepId,
    setSteps,
    setFormValue,
    clearFormValues,
  }), [
    steps,
    currentStepId,
    currentStepIndex,
    formValues,
    isFirstStep,
    isLastStep,
    totalSteps,
    emitIntent,
    setCurrentStepId,
    setSteps,
    setFormValue,
    clearFormValues,
  ]);
  
  return (
    <FlowContainerContext.Provider value={value}>
      {children}
    </FlowContainerContext.Provider>
  );
}

// ============ HOOKS ============

/**
 * Access the FlowContainer context. Throws if not within a provider.
 */
export function useFlowContainer() {
  const ctx = useContext(FlowContainerContext);
  if (!ctx) {
    throw new Error('useFlowContainer must be used within a FlowContainerProvider');
  }
  return ctx;
}

/**
 * Safe version that returns null if not within a provider.
 * Use this in components that may or may not be within a flow.
 */
export function useFlowContainerSafe() {
  return useContext(FlowContainerContext);
}

// ============ UTILITY: Convert ButtonAction to FlowIntent ============

interface ButtonAction {
  type?: string;
  value?: string;
  openNewTab?: boolean;
}

/**
 * Convert a button's action props to a FlowIntent.
 * Buttons should call this and emit the result.
 */
export function buttonActionToIntent(action: ButtonAction | undefined): FlowIntent | null {
  if (!action || !action.type) {
    return { type: 'next-step' }; // Default action
  }
  
  switch (action.type) {
    case 'next-step':
      return { type: 'next-step' };
    case 'prev-step':
      return { type: 'prev-step' };
    case 'go-to-step':
      return action.value ? { type: 'go-to-step', stepId: action.value } : null;
    case 'submit':
      return { type: 'submit' };
    case 'url':
    case 'redirect':
      return action.value ? { type: 'url', url: action.value, openNewTab: action.openNewTab } : null;
    case 'scroll':
      return action.value ? { type: 'scroll', selector: action.value } : null;
    case 'phone':
      return action.value ? { type: 'phone', number: action.value } : null;
    case 'email':
      return action.value ? { type: 'email', address: action.value } : null;
    case 'download':
      return action.value ? { type: 'download', url: action.value } : null;
    default:
      return null;
  }
}
