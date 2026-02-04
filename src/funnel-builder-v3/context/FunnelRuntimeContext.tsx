import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';

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
  submitForm: (consent?: { agreed: boolean; privacyPolicyUrl?: string }) => Promise<void>;
  
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
    const stepExists = funnel.steps.some(s => s.id === stepId);
    if (!stepExists) {
      console.warn(`[FunnelRuntimeContext] goToStep failed - step not found: ${stepId}`, {
        availableSteps: funnel.steps.map(s => ({ id: s.id, name: s.name })),
        currentStepId,
      });
      return;
    }
    
    console.log(`[FunnelRuntimeContext] Navigating to step: ${stepId}`, {
      currentStepId,
      stepName: funnel.steps.find(s => s.id === stepId)?.name,
    });
    
    // Capture current state before navigation
    const currentFormData = formData;
    const currentSelections = selections;
    
    setCurrentStepId(stepId);
    setStepHistory(prev => [...prev, stepId]);
    onStepChange?.(stepId, currentFormData, currentSelections);
  }, [funnel.steps, formData, selections, onStepChange, currentStepId]);

  const goToNextStep = useCallback(() => {
    const currentIndex = getStepIndex();
    const currentStep = getCurrentStep();
    
    console.log(`[FunnelRuntimeContext] goToNextStep called`, {
      currentIndex,
      totalSteps: funnel.steps.length,
      currentStepId,
      currentStepName: currentStep?.name,
      configuredNextStepId: currentStep?.settings.nextStepId,
    });
    
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
      console.log(`[FunnelRuntimeContext] goToNextStep called on last step - calling onComplete`, {
        currentIndex,
        totalSteps: funnel.steps.length,
        currentStepId,
      });
      if (onComplete) {
        try {
          onComplete(formData, selections);
        } catch (error) {
          console.error('[FunnelRuntimeContext] onComplete callback error:', error);
        }
      }
    }
  }, [funnel.steps, getStepIndex, getCurrentStep, goToStep, currentStepId, formData, selections, onComplete]);

  const goToPrevStep = useCallback(() => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const prevStepId = newHistory[newHistory.length - 1];
      
      // Capture current state before navigation
      const currentFormData = formData;
      const currentSelections = selections;
      
      setStepHistory(newHistory);
      setCurrentStepId(prevStepId);
      onStepChange?.(prevStepId, currentFormData, currentSelections);
    }
  }, [stepHistory, formData, selections, onStepChange]);

  const setFormField = useCallback((fieldId: string, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const setSelection = useCallback((blockId: string, optionId: string | string[]) => {
    setSelections(prev => ({ ...prev, [blockId]: optionId }));
  }, []);

  const submitForm = useCallback(async (consent?: { agreed: boolean; privacyPolicyUrl?: string }) => {
    // Don't block for fire-and-forget pattern - allow multiple submissions to queue
    // The underlying useUnifiedLeadSubmit hook handles deduplication at the API level
    setIsSubmitting(true);
    
    try {
      await onFormSubmit?.(formData, selections, consent);
    } catch (error) {
      // Log error but don't throw - fire-and-forget pattern
      console.error('[FunnelRuntimeContext] submitForm error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selections, onFormSubmit]);

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
      // Popup state
      activePopup,
      completedPopups,
      openPopup,
      closePopup,
      markPopupCompleted,
      isPopupCompleted,
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
