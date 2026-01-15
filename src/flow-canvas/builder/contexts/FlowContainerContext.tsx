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
 * - OWN AND EVALUATE RULES
 * 
 * Buttons and blocks ONLY emit intent. They do NOT execute logic.
 * Components RENDER. FlowContainer DECIDES. Rules EVALUATE.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Rule, RuleEvaluationResult, VisibilityState, ValidationState, ProgressionState } from '../engine/rules';
import { evaluateRules, evaluateEmptyRules } from '../engine/ruleEvaluator';

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

// ============ INTENT RESULT ============
// Result of emitting an intent - never silent

export interface IntentResult {
  /** Whether the intent was executed */
  executed: boolean;
  /** Reason if blocked */
  blockedReason?: string;
  /** The intent that was processed */
  intent: FlowIntent;
}

// ============ STEP TYPE ============

export interface FlowStep {
  id: string;
  name?: string;
}

// ============ CONTEXT VALUE ============

/**
 * Progression capability state - what actions are currently allowed
 * UI reads this to reflect disabled/enabled state (read-only)
 */
export interface CanProgressState {
  /** Whether next-step is allowed */
  next: boolean;
  /** Whether prev-step is allowed */
  prev: boolean;
  /** Whether submit is allowed */
  submit: boolean;
  /** Map of stepId -> whether go-to-step is allowed */
  goToStep: Record<string, boolean>;
}

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
  
  // ====== RULE ENGINE STATE (READ-ONLY FOR UI) ======
  /** Current rules being evaluated */
  rules: Rule[];
  /** Full evaluation result */
  evaluation: RuleEvaluationResult;
  
  /** 
   * Derived: What progression actions are allowed
   * UI MUST read this to reflect disabled state
   * UI MUST NOT recompute this
   */
  canProgress: CanProgressState;
  
  /** Derived: Why progression is blocked (for debugging, not displayed yet) */
  blockedReason: string | undefined;
  
  /** 
   * Derived: Which steps are visible (step IDs only)
   * UI MUST render ONLY these steps
   * UI MUST NOT filter steps locally
   */
  visibleSteps: string[];
  
  /** 
   * Derived: Validation errors by field
   * UI MAY read to show error states
   * UI MUST NOT validate inputs
   */
  validationErrors: Record<string, string[]>;
  
  /** Derived: Is form valid? */
  isValid: boolean;
  
  /** Last intent result (for debugging/feedback) */
  lastIntentResult: IntentResult | null;
  
  // Intent handler - ONLY way to trigger progression
  emitIntent: (intent: FlowIntent) => IntentResult;
  
  // Direct step control (for builder step navigation, not buttons)
  setCurrentStepId: (stepId: string) => void;
  setSteps: (steps: FlowStep[]) => void;
  
  // Rule management
  setRules: (rules: Rule[]) => void;
  
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
  /** Initial rules (defaults to empty - all allowed) */
  initialRules?: Rule[];
  /** Called when submit intent is emitted */
  onSubmit?: (values: Record<string, unknown>) => void;
  /** Called when step changes */
  onStepChange?: (stepId: string, index: number) => void;
  /** Whether this is preview mode (enables progression) */
  isPreviewMode?: boolean;
  /** Called when intent is rejected (for debugging/logging) */
  onIntentRejected?: (intent: FlowIntent, reason: string) => void;
}

// ============ PROVIDER ============

export function FlowContainerProvider({
  children,
  initialSteps = [],
  initialStepId,
  initialRules = [],
  onSubmit,
  onStepChange,
  isPreviewMode = false,
  onIntentRejected,
}: FlowContainerProviderProps) {
  const [steps, setStepsState] = useState<FlowStep[]>(initialSteps);
  const [currentStepId, setCurrentStepIdState] = useState<string | null>(
    initialStepId || initialSteps[0]?.id || null
  );
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [rules, setRulesState] = useState<Rule[]>(initialRules);
  const [lastIntentResult, setLastIntentResult] = useState<IntentResult | null>(null);
  
  // Derived state
  const currentStepIndex = useMemo(() => {
    if (!currentStepId) return 0;
    const index = steps.findIndex(s => s.id === currentStepId);
    return index >= 0 ? index : 0;
  }, [currentStepId, steps]);
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;
  
  // ====== RULE EVALUATION ======
  // Re-evaluate rules whenever form values, rules, or steps change
  const evaluation = useMemo<RuleEvaluationResult>(() => {
    if (rules.length === 0) {
      // No rules = default permissive behavior (backward compatibility)
      return evaluateEmptyRules();
    }
    
    return evaluateRules(rules, {
      values: formValues,
      allStepIds: steps.map(s => s.id),
      allElementIds: [], // TODO: pass element IDs when available
    });
  }, [rules, formValues, steps]);
  
  // Derived visibility state
  const visibleSteps = useMemo(() => {
    return steps
      .filter(s => evaluation.visibility.steps[s.id] !== false) // undefined = visible
      .map(s => s.id);
  }, [steps, evaluation.visibility.steps]);
  
  // Derived validation state
  const validationErrors = useMemo(() => {
    const errors: Record<string, string[]> = {};
    for (const [key, fieldErrors] of Object.entries(evaluation.validation.errors)) {
      errors[key] = fieldErrors.map(e => e.message);
    }
    return errors;
  }, [evaluation.validation.errors]);
  
  const isValid = evaluation.validation.isValid;
  
  // Derived progression state - UI reads this to reflect disabled state
  // This is a READ-ONLY value. UI MUST NOT recompute this.
  const canProgress: CanProgressState = useMemo(() => ({
    next: evaluation.progression.canGoNext,
    prev: evaluation.progression.canGoPrev,
    submit: evaluation.progression.canSubmit,
    goToStep: evaluation.progression.canGoToStep,
  }), [evaluation.progression]);
  
  // Blocked reason for debugging (not displayed yet - Phase 6)
  const blockedReason = evaluation.progression.nextBlockedReason;
  
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
  
  // Set rules
  const setRules = useCallback((newRules: Rule[]) => {
    setRulesState(newRules);
  }, []);
  
  // Form value management
  const setFormValue = useCallback((key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFormValues = useCallback(() => {
    setFormValues({});
  }, []);
  
  // CRITICAL: Intent handler - ALL progression logic lives here
  // This is the SOLE AUTHORITY for step progression. No fallbacks exist.
  // NEVER returns void - always returns IntentResult
  const emitIntent = useCallback((intent: FlowIntent): IntentResult => {
    const createResult = (executed: boolean, blockedReason?: string): IntentResult => {
      const result: IntentResult = { executed, blockedReason, intent };
      setLastIntentResult(result);
      if (!executed && blockedReason) {
        onIntentRejected?.(intent, blockedReason);
      }
      return result;
    };
    
    // In non-preview mode: external actions still work, step progression blocked
    const modeCanProgress = isPreviewMode;
    
    switch (intent.type) {
      case 'next-step': {
        // Check mode
        if (!modeCanProgress) {
          return createResult(false, 'Edit mode - progression disabled');
        }
        
        // Check rule-based progression
        if (!evaluation.progression.canGoNext) {
          return createResult(false, evaluation.progression.nextBlockedReason || 'Progression blocked by rule');
        }
        
        // Check validation
        if (!evaluation.validation.isValid) {
          return createResult(false, 'Please fix validation errors');
        }
        
        // Execute
        if (!isLastStep && steps.length > 0) {
          const nextStep = steps[currentStepIndex + 1];
          if (nextStep) {
            setCurrentStepId(nextStep.id);
            return createResult(true);
          }
        } else if (isLastStep) {
          // Last step - treat as submit
          onSubmit?.(formValues);
          return createResult(true);
        }
        
        return createResult(false, 'No next step available');
      }
      
      case 'prev-step': {
        if (!modeCanProgress) {
          return createResult(false, 'Edit mode - progression disabled');
        }
        
        if (!evaluation.progression.canGoPrev) {
          return createResult(false, evaluation.progression.prevBlockedReason || 'Cannot go back');
        }
        
        if (!isFirstStep && steps.length > 0) {
          const prevStep = steps[currentStepIndex - 1];
          if (prevStep) {
            setCurrentStepId(prevStep.id);
            return createResult(true);
          }
        }
        
        return createResult(false, 'No previous step available');
      }
      
      case 'go-to-step': {
        if (!modeCanProgress) {
          return createResult(false, 'Edit mode - progression disabled');
        }
        
        // Check if go-to-step is allowed for this target
        if (evaluation.progression.canGoToStep[intent.stepId] === false) {
          return createResult(false, `Cannot navigate to step ${intent.stepId}`);
        }
        
        // Check if step is visible
        if (!visibleSteps.includes(intent.stepId)) {
          return createResult(false, 'Target step is not visible');
        }
        
        setCurrentStepId(intent.stepId);
        return createResult(true);
      }
      
      case 'submit': {
        if (!modeCanProgress) {
          return createResult(false, 'Edit mode - submit disabled');
        }
        
        if (!evaluation.progression.canSubmit) {
          return createResult(false, evaluation.progression.submitBlockedReason || 'Submit not allowed');
        }
        
        if (!evaluation.validation.isValid) {
          return createResult(false, 'Please fix validation errors before submitting');
        }
        
        const allValues = { ...formValues, ...(intent.values || {}) };
        onSubmit?.(allValues);
        return createResult(true);
      }
      
      // External actions work in both edit and preview mode
      case 'url': {
        if (intent.url) {
          if (intent.openNewTab) {
            window.open(intent.url, '_blank');
          } else {
            window.location.href = intent.url;
          }
          return createResult(true);
        }
        return createResult(false, 'No URL provided');
      }
      
      case 'scroll': {
        if (intent.selector) {
          document.querySelector(intent.selector)?.scrollIntoView({ behavior: 'smooth' });
          return createResult(true);
        }
        return createResult(false, 'No selector provided');
      }
      
      case 'phone': {
        if (intent.number) {
          window.location.href = `tel:${intent.number}`;
          return createResult(true);
        }
        return createResult(false, 'No phone number provided');
      }
      
      case 'email': {
        if (intent.address) {
          window.location.href = `mailto:${intent.address}`;
          return createResult(true);
        }
        return createResult(false, 'No email address provided');
      }
      
      case 'download': {
        if (intent.url) {
          window.open(intent.url, '_blank');
          return createResult(true);
        }
        return createResult(false, 'No download URL provided');
      }
      
      default:
        return createResult(false, 'Unknown intent type');
    }
  }, [
    isPreviewMode,
    evaluation,
    isLastStep,
    isFirstStep,
    steps,
    currentStepIndex,
    formValues,
    visibleSteps,
    setCurrentStepId,
    onSubmit,
    onIntentRejected,
  ]);
  
  // Memoized context value
  const value = useMemo<FlowContainerContextValue>(() => ({
    // State
    steps,
    currentStepId,
    currentStepIndex,
    formValues,
    isFirstStep,
    isLastStep,
    totalSteps,
    
    // Rule engine state
    rules,
    evaluation,
    canProgress,
    blockedReason,
    visibleSteps,
    validationErrors,
    isValid,
    lastIntentResult,
    
    // Actions
    emitIntent,
    setCurrentStepId,
    setSteps,
    setRules,
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
    rules,
    evaluation,
    canProgress,
    blockedReason,
    visibleSteps,
    validationErrors,
    isValid,
    lastIntentResult,
    emitIntent,
    setCurrentStepId,
    setSteps,
    setRules,
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
