import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';

// Form data collected during funnel execution
export interface FunnelFormData {
  [fieldId: string]: string | string[] | File | null;
}

// Quiz/option selections
export interface FunnelSelections {
  [blockId: string]: string | string[]; // Selected option IDs
}

// Accumulated data for final submission (local-first pattern)
export interface AccumulatedFunnelData {
  formData: FunnelFormData;
  selections: FunnelSelections;
  consent?: { agreed: boolean; privacyPolicyUrl?: string };
  visitedStepIds: string[];
  lastStepIndex: number;
}

// Validation state reported by form blocks
interface BlockValidationState {
  stepId: string;
  isValid: boolean;
  errors: string[];
}

interface FunnelRuntimeContextType {
  // Current state
  currentStepId: string;
  stepHistory: string[];
  formData: FunnelFormData;
  selections: FunnelSelections;
  isSubmitting: boolean;
  
  // Navigation
  goToStep: (stepId: string) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Form data collection
  setFormField: (fieldId: string, value: string | string[] | File | null) => void;
  setSelection: (blockId: string, optionId: string | string[]) => void;
  
  // Submission (fire-and-forget pattern, but returns Promise for .catch() chaining)
  submitForm: (consent?: { agreed: boolean; privacyPolicyUrl?: string }) => Promise<void>;
  
  // Accumulated data for final submission (local-first pattern)
  getAccumulatedData: () => AccumulatedFunnelData;
  setConsent: (consent: { agreed: boolean; privacyPolicyUrl?: string }) => void;
  
  // Step info
  getCurrentStep: () => FunnelStep | undefined;
  getStepIndex: () => number;
  totalSteps: number;
  
  // Popup state management
  activePopup: string | null;
  completedPopups: string[];
  openPopup: (blockId: string) => void;
  closePopup: () => void;
  markPopupCompleted: (blockId: string) => void;
  isPopupCompleted: (blockId: string) => boolean;
  
  // Validation state management
  setBlockValidation: (blockId: string, stepId: string, isValid: boolean, errors: string[]) => void;
  getStepValidation: () => { valid: boolean; errors: string[] };
}

const FunnelRuntimeContext = createContext<FunnelRuntimeContextType | null>(null);

interface FunnelRuntimeProviderProps {
  funnel: Funnel;
  initialStepId?: string;
  children: ReactNode;
  onStepChange?: (stepId: string, formData: FunnelFormData, selections: FunnelSelections) => void;
  onFormSubmit?: (
    data: FunnelFormData, 
    selections: FunnelSelections, 
    consent?: { agreed: boolean; privacyPolicyUrl?: string }
  ) => Promise<void>;
  onComplete?: (formData: FunnelFormData, selections: FunnelSelections) => void;
}

export function FunnelRuntimeProvider({ 
  funnel, 
  initialStepId,
  children,
  onStepChange,
  onFormSubmit,
  onComplete,
}: FunnelRuntimeProviderProps) {
  const firstStepId = funnel.steps[0]?.id || '';
  const [currentStepId, setCurrentStepId] = useState(initialStepId || firstStepId);
  const [stepHistory, setStepHistory] = useState<string[]>([initialStepId || firstStepId]);
  const [formData, setFormData] = useState<FunnelFormData>({});
  const [selections, setSelections] = useState<FunnelSelections>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use refs to avoid stale closures in callbacks
  const formDataRef = useRef<FunnelFormData>({});
  const selectionsRef = useRef<FunnelSelections>({});
  const currentStepIdRef = useRef<string>(initialStepId || firstStepId);
  
  // Accumulated data for local-first submission pattern
  // Tracks consent and visited steps for final submission or beforeunload
  const consentRef = useRef<{ agreed: boolean; privacyPolicyUrl?: string } | undefined>(undefined);
  const visitedStepIdsRef = useRef<Set<string>>(new Set([initialStepId || firstStepId]));
  
  // Sync refs with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  useEffect(() => {
    selectionsRef.current = selections;
  }, [selections]);
  
  useEffect(() => {
    currentStepIdRef.current = currentStepId;
  }, [currentStepId]);
  
  // Navigation guard: prevent concurrent navigation calls
  const isNavigatingRef = useRef(false);
  
  // Validation state ref - never triggers re-renders
  const blockValidationsRef = useRef<Map<string, BlockValidationState>>(new Map());
  
  // Debug: Log provider initialization
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[FunnelRuntimeProvider] Initialized', {
        funnelId: funnel.id || 'no-id',
        totalSteps: funnel.steps.length,
        firstStepId,
        currentStepId,
        hasOnFormSubmit: !!onFormSubmit,
        hasOnStepChange: !!onStepChange,
      });
    }
  }, []);
  
  // Popup state
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [completedPopups, setCompletedPopups] = useState<string[]>([]);

  const getCurrentStep = useCallback(() => {
    return funnel.steps.find(s => s.id === currentStepId);
  }, [funnel.steps, currentStepId]);

  const getStepIndex = useCallback(() => {
    return funnel.steps.findIndex(s => s.id === currentStepId);
  }, [funnel.steps, currentStepId]);

  const goToStep = useCallback((stepId: string) => {
    // Navigation guard: prevent concurrent calls
    if (isNavigatingRef.current) {
      if (import.meta.env.DEV) {
        console.log('[FunnelRuntimeContext] Navigation blocked - already navigating', {
          requestedStepId: stepId,
          currentStepId: currentStepIdRef.current,
        });
      }
      return;
    }
    
    const stepExists = funnel.steps.some(s => s.id === stepId);
    if (!stepExists) {
      if (import.meta.env.DEV) {
        console.warn(`[FunnelRuntimeContext] goToStep failed - step not found: ${stepId}`, {
          availableSteps: funnel.steps.map(s => ({ id: s.id, name: s.name })),
          currentStepId: currentStepIdRef.current,
        });
      }
      return;
    }
    
    // Set guard immediately
    isNavigatingRef.current = true;
    
    // Track visited step for accumulated data
    visitedStepIdsRef.current.add(stepId);
    
    // Use refs to get current state (avoids stale closures)
    const currentFormData = formDataRef.current;
    const currentSelections = selectionsRef.current;
    
    // Update state synchronously - React will batch these
    setCurrentStepId(stepId);
    setStepHistory(prev => [...prev, stepId]);
    
    // Call onStepChange with current ref values
    onStepChange?.(stepId, currentFormData, currentSelections);
    
    // Reset guard immediately after current task using queueMicrotask
    // queueMicrotask is faster than requestAnimationFrame (~0ms vs ~16ms)
    // This ensures consistent behavior with goToPrevStep
    queueMicrotask(() => {
      isNavigatingRef.current = false;
    });
  }, [funnel.steps, onStepChange]);

  const goToNextStep = useCallback(() => {
    // Navigation guard: prevent concurrent calls
    if (isNavigatingRef.current) {
      if (import.meta.env.DEV) {
        console.log('[FunnelRuntimeContext] goToNextStep blocked - already navigating', {
          currentStepId: currentStepIdRef.current,
        });
      }
      return;
    }
    
    const currentIndex = getStepIndex();
    const currentStep = getCurrentStep();
    
    // Check if there's a configured next step
    if (currentStep?.settings.nextStepId) {
      goToStep(currentStep.settings.nextStepId);
      return;
    }
    
    // Otherwise go to the next sequential step
    if (currentIndex < funnel.steps.length - 1) {
      const nextStepId = funnel.steps[currentIndex + 1].id;
      goToStep(nextStepId);
    } else {
      // On last step - call completion callback if provided
      if (onComplete) {
        try {
          // Use refs to get current state
          onComplete(formDataRef.current, selectionsRef.current);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[FunnelRuntimeContext] onComplete callback error:', error);
          }
        }
      }
    }
  }, [funnel.steps, getStepIndex, getCurrentStep, goToStep, onComplete]);

  const goToPrevStep = useCallback(() => {
    // Navigation guard: prevent concurrent calls
    if (isNavigatingRef.current) {
      if (import.meta.env.DEV) {
        console.log('[FunnelRuntimeContext] goToPrevStep blocked - already navigating');
      }
      return;
    }
    
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const prevStepId = newHistory[newHistory.length - 1];
      
      // Set guard immediately
      isNavigatingRef.current = true;
      
      // Use refs to get current state (avoids stale closures)
      const currentFormData = formDataRef.current;
      const currentSelections = selectionsRef.current;
      
      setStepHistory(newHistory);
      setCurrentStepId(prevStepId);
      onStepChange?.(prevStepId, currentFormData, currentSelections);
      
      // Reset guard immediately after current task using queueMicrotask
      // queueMicrotask is faster than requestAnimationFrame (~0ms vs ~16ms)
      queueMicrotask(() => {
        isNavigatingRef.current = false;
      });
    }
  }, [stepHistory, onStepChange]);

  const setFormField = useCallback((fieldId: string, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const setSelection = useCallback((blockId: string, optionId: string | string[]) => {
    setSelections(prev => ({ ...prev, [blockId]: optionId }));
  }, []);

  // Local-first: Get all accumulated data for final submission
  const getAccumulatedData = useCallback((): AccumulatedFunnelData => {
    const stepIndex = funnel.steps.findIndex(s => s.id === currentStepIdRef.current);
    return {
      formData: formDataRef.current,
      selections: selectionsRef.current,
      consent: consentRef.current,
      visitedStepIds: Array.from(visitedStepIdsRef.current),
      lastStepIndex: stepIndex >= 0 ? stepIndex : 0,
    };
  }, [funnel.steps]);

  // Local-first: Set consent data (stored locally until final submission)
  const setConsent = useCallback((consent: { agreed: boolean; privacyPolicyUrl?: string }) => {
    consentRef.current = consent;
  }, []);

  const submitForm = useCallback((consent?: { agreed: boolean; privacyPolicyUrl?: string }): Promise<void> => {
    // Fire-and-forget pattern: callers don't need to await, but can use .catch() for error handling
    // The underlying useUnifiedLeadSubmit hook handles deduplication at the API level
    
    // Removed setIsSubmitting state updates to eliminate re-renders during navigation
    // ButtonBlock already uses isNavigating state to disable buttons, so isSubmitting
    // state updates are unnecessary and cause cascading re-renders of all pre-rendered steps
    
    // Use refs to get current state (avoids stale closures)
    // Return the promise chain so callers can optionally chain .catch()
    return (onFormSubmit?.(formDataRef.current, selectionsRef.current, consent) ?? Promise.resolve())
      .catch((error) => {
        // Log errors (dev only - verbose logging blocks main thread in production)
        if (import.meta.env.DEV) {
          console.error('[FunnelRuntimeContext] submitForm error:', {
            error,
            currentStepId: currentStepIdRef.current,
            hasFormData: Object.keys(formDataRef.current).length > 0,
            hasSelections: Object.keys(selectionsRef.current).length > 0,
          });
        }
      });
  }, [onFormSubmit]);

  // Popup handlers
  const openPopup = useCallback((blockId: string) => {
    setActivePopup(blockId);
  }, []);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const markPopupCompleted = useCallback((blockId: string) => {
    setCompletedPopups(prev => {
      if (prev.includes(blockId)) return prev;
      return [...prev, blockId];
    });
    setActivePopup(null);
  }, []);

  const isPopupCompleted = useCallback((blockId: string) => {
    return completedPopups.includes(blockId);
  }, [completedPopups]);

  // Validation state management
  const setBlockValidation = useCallback((blockId: string, stepId: string, isValid: boolean, errors: string[]) => {
    blockValidationsRef.current.set(blockId, { stepId, isValid, errors });
  }, []);

  const getStepValidation = useCallback((): { valid: boolean; errors: string[] } => {
    const allErrors: string[] = [];
    for (const [, state] of blockValidationsRef.current) {
      if (state.stepId === currentStepIdRef.current && !state.isValid) {
        allErrors.push(...state.errors);
      }
    }
    return { valid: allErrors.length === 0, errors: allErrors };
  }, []);

  const canGoBack = stepHistory.length > 1;
  const canGoForward = getStepIndex() < funnel.steps.length - 1;
  const totalSteps = funnel.steps.length;

  // Memoize context value to prevent unnecessary re-renders of all consumers.
  // Without this, every parent re-render (e.g. from useUnifiedLeadSubmit's
  // isSubmitting state change) creates a new context object, causing every
  // block component in every pre-rendered step to re-render.
  const contextValue = useMemo<FunnelRuntimeContextType>(() => ({
    currentStepId,
    stepHistory,
    formData,
    selections,
    isSubmitting,
    goToStep,
    goToNextStep,
    goToPrevStep,
    canGoBack,
    canGoForward,
    setFormField,
    setSelection,
    submitForm,
    getAccumulatedData,
    setConsent,
    getCurrentStep,
    getStepIndex,
    totalSteps,
    // Popup state
    activePopup,
    completedPopups,
    openPopup,
    closePopup,
    markPopupCompleted,
    isPopupCompleted,
    // Validation state
    setBlockValidation,
    getStepValidation,
  }), [
    currentStepId,
    stepHistory,
    formData,
    selections,
    isSubmitting,
    goToStep,
    goToNextStep,
    goToPrevStep,
    canGoBack,
    canGoForward,
    setFormField,
    setSelection,
    submitForm,
    getAccumulatedData,
    setConsent,
    getCurrentStep,
    getStepIndex,
    totalSteps,
    activePopup,
    completedPopups,
    openPopup,
    closePopup,
    markPopupCompleted,
    isPopupCompleted,
    setBlockValidation,
    getStepValidation,
  ]);

  return (
    <FunnelRuntimeContext.Provider value={contextValue}>
      {children}
    </FunnelRuntimeContext.Provider>
  );
}

export function useFunnelRuntime() {
  const context = useContext(FunnelRuntimeContext);
  if (!context) {
    throw new Error('useFunnelRuntime must be used within a FunnelRuntimeProvider');
  }
  return context;
}

// Optional hook that returns null if outside provider (for editor/canvas use)
export function useFunnelRuntimeOptional() {
  return useContext(FunnelRuntimeContext);
}
