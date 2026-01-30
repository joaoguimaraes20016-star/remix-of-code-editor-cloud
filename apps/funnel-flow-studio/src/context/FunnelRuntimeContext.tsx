import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Funnel, FunnelStep } from '@/types/funnel';

// Form data collected during funnel execution
export interface FunnelFormData {
  [fieldId: string]: string | string[] | File | null;
}

// Quiz/option selections
export interface FunnelSelections {
  [blockId: string]: string | string[]; // Selected option IDs
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
  
  // Submission
  submitForm: () => Promise<void>;
  
  // Step info
  getCurrentStep: () => FunnelStep | undefined;
  getStepIndex: () => number;
  totalSteps: number;
}

const FunnelRuntimeContext = createContext<FunnelRuntimeContextType | null>(null);

interface FunnelRuntimeProviderProps {
  funnel: Funnel;
  initialStepId?: string;
  children: ReactNode;
  onStepChange?: (stepId: string) => void;
  onFormSubmit?: (data: FunnelFormData, selections: FunnelSelections) => Promise<void>;
}

export function FunnelRuntimeProvider({ 
  funnel, 
  initialStepId,
  children,
  onStepChange,
  onFormSubmit,
}: FunnelRuntimeProviderProps) {
  const firstStepId = funnel.steps[0]?.id || '';
  const [currentStepId, setCurrentStepId] = useState(initialStepId || firstStepId);
  const [stepHistory, setStepHistory] = useState<string[]>([initialStepId || firstStepId]);
  const [formData, setFormData] = useState<FunnelFormData>({});
  const [selections, setSelections] = useState<FunnelSelections>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentStep = useCallback(() => {
    return funnel.steps.find(s => s.id === currentStepId);
  }, [funnel.steps, currentStepId]);

  const getStepIndex = useCallback(() => {
    return funnel.steps.findIndex(s => s.id === currentStepId);
  }, [funnel.steps, currentStepId]);

  const goToStep = useCallback((stepId: string) => {
    const stepExists = funnel.steps.some(s => s.id === stepId);
    if (!stepExists) return;
    
    setCurrentStepId(stepId);
    setStepHistory(prev => [...prev, stepId]);
    onStepChange?.(stepId);
  }, [funnel.steps, onStepChange]);

  const goToNextStep = useCallback(() => {
    const currentIndex = getStepIndex();
    const currentStep = getCurrentStep();
    
    // Check if there's a configured next step
    if (currentStep?.settings.nextStepId) {
      goToStep(currentStep.settings.nextStepId);
      return;
    }
    
    // Otherwise go to the next sequential step
    if (currentIndex < funnel.steps.length - 1) {
      goToStep(funnel.steps[currentIndex + 1].id);
    }
  }, [funnel.steps, getStepIndex, getCurrentStep, goToStep]);

  const goToPrevStep = useCallback(() => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const prevStepId = newHistory[newHistory.length - 1];
      setStepHistory(newHistory);
      setCurrentStepId(prevStepId);
      onStepChange?.(prevStepId);
    }
  }, [stepHistory, onStepChange]);

  const setFormField = useCallback((fieldId: string, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const setSelection = useCallback((blockId: string, optionId: string | string[]) => {
    setSelections(prev => ({ ...prev, [blockId]: optionId }));
  }, []);

  const submitForm = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onFormSubmit?.(formData, selections);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selections, isSubmitting, onFormSubmit]);

  const canGoBack = stepHistory.length > 1;
  const canGoForward = getStepIndex() < funnel.steps.length - 1;

  return (
    <FunnelRuntimeContext.Provider value={{
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
      getCurrentStep,
      getStepIndex,
      totalSteps: funnel.steps.length,
    }}>
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
