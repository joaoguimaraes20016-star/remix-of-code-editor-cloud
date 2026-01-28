/**
 * Funnel Builder v3 - Preview Runtime Hook
 * 
 * Manages preview mode state: screen navigation, form data collection,
 * and action handling for the interactive preview.
 */

import { useState, useCallback, useMemo } from 'react';
import { Funnel, Screen, Block, ButtonAction } from '../types/funnel';

export interface FormData {
  [fieldKey: string]: string | string[];
}

export interface PreviewRuntimeState {
  currentScreenIndex: number;
  formData: FormData;
  selectedChoices: Record<string, string[]>; // blockId -> selected option ids
  submissionStatus: 'idle' | 'submitting' | 'success' | 'error';
  validationErrors: Record<string, string>; // fieldKey -> error message
}

export interface PreviewRuntimeActions {
  // Navigation
  goToScreen: (index: number) => void;
  goToNextScreen: () => void;
  goToPreviousScreen: () => void;
  goToScreenById: (screenId: string) => void;
  
  // Form handling
  updateField: (fieldKey: string, value: string) => void;
  updateChoice: (blockId: string, optionId: string, multiSelect: boolean) => void;
  
  // Actions
  executeButtonAction: (action: ButtonAction) => void;
  submitForm: () => Promise<void>;
  
  // Reset
  resetRuntime: () => void;
}

export interface UsePreviewRuntimeReturn extends PreviewRuntimeState, PreviewRuntimeActions {
  currentScreen: Screen | null;
  isFirstScreen: boolean;
  isLastScreen: boolean;
  progress: number; // 0-100
}

const initialState: PreviewRuntimeState = {
  currentScreenIndex: 0,
  formData: {},
  selectedChoices: {},
  submissionStatus: 'idle',
  validationErrors: {},
};

export function usePreviewRuntime(funnel: Funnel): UsePreviewRuntimeReturn {
  const [state, setState] = useState<PreviewRuntimeState>(initialState);

  const screens = funnel.screens;
  const currentScreen = screens[state.currentScreenIndex] || null;
  const isFirstScreen = state.currentScreenIndex === 0;
  const isLastScreen = state.currentScreenIndex === screens.length - 1;
  const progress = screens.length > 1 
    ? Math.round((state.currentScreenIndex / (screens.length - 1)) * 100)
    : 100;

  // Navigation
  const goToScreen = useCallback((index: number) => {
    if (index >= 0 && index < screens.length) {
      setState(prev => ({ ...prev, currentScreenIndex: index, validationErrors: {} }));
    }
  }, [screens.length]);

  const goToNextScreen = useCallback(() => {
    setState(prev => {
      const nextIndex = Math.min(prev.currentScreenIndex + 1, screens.length - 1);
      return { ...prev, currentScreenIndex: nextIndex, validationErrors: {} };
    });
  }, [screens.length]);

  const goToPreviousScreen = useCallback(() => {
    setState(prev => {
      const prevIndex = Math.max(prev.currentScreenIndex - 1, 0);
      return { ...prev, currentScreenIndex: prevIndex, validationErrors: {} };
    });
  }, []);

  const goToScreenById = useCallback((screenId: string) => {
    const index = screens.findIndex(s => s.id === screenId);
    if (index !== -1) {
      setState(prev => ({ ...prev, currentScreenIndex: index, validationErrors: {} }));
    }
  }, [screens]);

  // Form handling
  const updateField = useCallback((fieldKey: string, value: string) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [fieldKey]: value },
      validationErrors: { ...prev.validationErrors, [fieldKey]: '' },
    }));
  }, []);

  const updateChoice = useCallback((blockId: string, optionId: string, multiSelect: boolean) => {
    setState(prev => {
      const currentChoices = prev.selectedChoices[blockId] || [];
      let newChoices: string[];

      if (multiSelect) {
        // Toggle option in multi-select
        if (currentChoices.includes(optionId)) {
          newChoices = currentChoices.filter(id => id !== optionId);
        } else {
          newChoices = [...currentChoices, optionId];
        }
      } else {
        // Single select - replace
        newChoices = [optionId];
      }

      return {
        ...prev,
        selectedChoices: { ...prev.selectedChoices, [blockId]: newChoices },
      };
    });
  }, []);

  // Validate required fields on current screen
  const validateCurrentScreen = useCallback((): boolean => {
    if (!currentScreen) return true;

    const errors: Record<string, string> = {};
    
    currentScreen.blocks.forEach(block => {
      if (block.type === 'input' && block.props.required) {
        const fieldKey = block.props.fieldKey || block.id;
        const value = state.formData[fieldKey];
        
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[fieldKey] = 'This field is required';
        }
        
        // Email validation
        if (block.props.inputType === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            errors[fieldKey] = 'Please enter a valid email';
          }
        }
      }
    });

    setState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [currentScreen, state.formData]);

  // Execute button action
  const executeButtonAction = useCallback((action: ButtonAction) => {
    switch (action.type) {
      case 'next-screen':
        if (validateCurrentScreen()) {
          goToNextScreen();
        }
        break;
      case 'previous-screen':
        goToPreviousScreen();
        break;
      case 'go-to-screen':
        if (validateCurrentScreen()) {
          goToScreenById(action.screenId);
        }
        break;
      case 'submit':
        // Submit is handled separately
        break;
      case 'url':
        if (action.openInNewTab) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = action.url;
        }
        break;
    }
  }, [validateCurrentScreen, goToNextScreen, goToPreviousScreen, goToScreenById]);

  // Submit form
  const submitForm = useCallback(async () => {
    if (!validateCurrentScreen()) return;

    setState(prev => ({ ...prev, submissionStatus: 'submitting' }));

    try {
      // Simulate API call - in real implementation, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Form submitted:', {
        formData: state.formData,
        choices: state.selectedChoices,
      });

      setState(prev => ({ ...prev, submissionStatus: 'success' }));
      
      // Auto-advance to next screen (usually thank you page)
      if (!isLastScreen) {
        goToNextScreen();
      }
    } catch (error) {
      console.error('Submission error:', error);
      setState(prev => ({ ...prev, submissionStatus: 'error' }));
    }
  }, [validateCurrentScreen, state.formData, state.selectedChoices, isLastScreen, goToNextScreen]);

  // Reset runtime
  const resetRuntime = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    // State
    ...state,
    currentScreen,
    isFirstScreen,
    isLastScreen,
    progress,
    
    // Navigation
    goToScreen,
    goToNextScreen,
    goToPreviousScreen,
    goToScreenById,
    
    // Form handling
    updateField,
    updateChoice,
    
    // Actions
    executeButtonAction,
    submitForm,
    resetRuntime,
  };
}
