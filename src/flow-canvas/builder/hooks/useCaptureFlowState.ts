/**
 * useCaptureFlowState Hook
 * Manages runtime state for a CaptureFlow instance (answers, validation, navigation)
 * This is used when RENDERING a CaptureFlow, not when editing it.
 */

import { useState, useCallback, useMemo } from 'react';
import type { 
  CaptureFlow, 
  CaptureNode, 
  CaptureFlowAnswers, 
  CaptureFlowState,
  CaptureNodeValidation,
} from '../../types/captureFlow';

// ============ VALIDATION HELPERS ============

function validateEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function validatePhone(value: string): boolean {
  // Basic phone validation - at least 10 digits
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10;
}

function validateNode(
  node: CaptureNode, 
  value: string | string[] | number | boolean | null
): string | null {
  const validation = node.validation;
  const settings = node.settings;
  
  // Check required
  if (validation?.required || settings?.placeholder === undefined) {
    const isEmpty = value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0);
    
    if (isEmpty && validation?.required) {
      return validation.customMessage || 'This field is required';
    }
  }
  
  // Type-specific validation
  if (node.type === 'email' && typeof value === 'string' && value) {
    if (!validateEmail(value)) {
      return 'Please enter a valid email address';
    }
  }
  
  if (node.type === 'phone' && typeof value === 'string' && value) {
    if (!validatePhone(value)) {
      return 'Please enter a valid phone number';
    }
  }
  
  // String length validation
  if (typeof value === 'string' && validation) {
    if (validation.minLength && value.length < validation.minLength) {
      return `Must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Must be no more than ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return validation.customMessage || 'Invalid format';
      }
    }
  }
  
  return null;
}

// ============ HOOK ============

interface UseCaptureFlowStateOptions {
  captureFlow: CaptureFlow;
  onComplete?: (answers: CaptureFlowAnswers) => void;
  onNodeChange?: (nodeId: string) => void;
}

interface UseCaptureFlowStateReturn {
  // State
  state: CaptureFlowState;
  currentNode: CaptureNode | null;
  currentNodeIndex: number;
  totalNodes: number;
  progress: number; // 0-100
  
  // Actions
  setAnswer: (fieldKey: string, value: CaptureFlowAnswers[string]) => void;
  validateCurrentNode: () => boolean;
  validateAll: () => boolean;
  
  // Navigation
  goToNode: (nodeId: string) => boolean;
  advance: () => boolean;
  goBack: () => boolean;
  canGoBack: boolean;
  canAdvance: boolean;
  
  // Submit
  submit: () => Promise<boolean>;
  
  // Reset
  reset: () => void;
}

export function useCaptureFlowState({
  captureFlow,
  onComplete,
  onNodeChange,
}: UseCaptureFlowStateOptions): UseCaptureFlowStateReturn {
  const [state, setState] = useState<CaptureFlowState>(() => ({
    currentNodeId: captureFlow.nodes[0]?.id || null,
    answers: {},
    validationErrors: {},
    isSubmitting: false,
    isComplete: false,
  }));
  
  // Derived values
  const currentNodeIndex = useMemo(() => {
    if (!state.currentNodeId) return -1;
    return captureFlow.nodes.findIndex(n => n.id === state.currentNodeId);
  }, [captureFlow.nodes, state.currentNodeId]);
  
  const currentNode = useMemo(() => {
    if (currentNodeIndex === -1) return null;
    return captureFlow.nodes[currentNodeIndex];
  }, [captureFlow.nodes, currentNodeIndex]);
  
  const totalNodes = captureFlow.nodes.length;
  
  const progress = useMemo(() => {
    if (totalNodes === 0) return 0;
    if (state.isComplete) return 100;
    return Math.round((currentNodeIndex / totalNodes) * 100);
  }, [currentNodeIndex, totalNodes, state.isComplete]);
  
  const canGoBack = currentNodeIndex > 0;
  const canAdvance = currentNodeIndex < totalNodes - 1;
  
  // Set answer for a field
  const setAnswer = useCallback((fieldKey: string, value: CaptureFlowAnswers[string]) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [fieldKey]: value,
      },
      // Clear validation error when user types
      validationErrors: {
        ...prev.validationErrors,
        [fieldKey]: undefined as any,
      },
    }));
  }, []);
  
  // Validate current node
  const validateCurrentNode = useCallback((): boolean => {
    if (!currentNode) return true;
    
    const value = state.answers[currentNode.fieldKey];
    const error = validateNode(currentNode, value);
    
    if (error) {
      setState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [currentNode.fieldKey]: error,
        },
      }));
      return false;
    }
    
    return true;
  }, [currentNode, state.answers]);
  
  // Validate all nodes
  const validateAll = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    for (const node of captureFlow.nodes) {
      const value = state.answers[node.fieldKey];
      const error = validateNode(node, value);
      
      if (error) {
        errors[node.fieldKey] = error;
        isValid = false;
      }
    }
    
    setState(prev => ({
      ...prev,
      validationErrors: errors,
    }));
    
    return isValid;
  }, [captureFlow.nodes, state.answers]);
  
  // Go to specific node
  const goToNode = useCallback((nodeId: string): boolean => {
    const nodeIndex = captureFlow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return false;
    
    setState(prev => ({
      ...prev,
      currentNodeId: nodeId,
    }));
    
    onNodeChange?.(nodeId);
    return true;
  }, [captureFlow.nodes, onNodeChange]);
  
  // Advance to next node
  const advance = useCallback((): boolean => {
    if (!validateCurrentNode()) return false;
    if (!currentNode) return false;
    
    const navigation = currentNode.navigation;
    
    // Handle conditional navigation
    if (navigation.action === 'conditional' && navigation.conditionalRoutes) {
      const answer = state.answers[currentNode.fieldKey];
      const route = navigation.conditionalRoutes.find(r => {
        if (Array.isArray(answer)) {
          return answer.includes(r.choiceId);
        }
        return answer === r.choiceId;
      });
      
      if (route?.targetNodeId) {
        return goToNode(route.targetNodeId);
      }
    }
    
    // Handle go-to-node
    if (navigation.action === 'go-to-node' && navigation.targetNodeId) {
      return goToNode(navigation.targetNodeId);
    }
    
    // Handle submit
    if (navigation.action === 'submit') {
      submit();
      return true;
    }
    
    // Default: go to next node
    if (currentNodeIndex < totalNodes - 1) {
      const nextNode = captureFlow.nodes[currentNodeIndex + 1];
      return goToNode(nextNode.id);
    }
    
    // No more nodes, submit
    submit();
    return true;
  }, [currentNode, currentNodeIndex, totalNodes, captureFlow.nodes, state.answers, validateCurrentNode, goToNode]);
  
  // Go back to previous node
  const goBack = useCallback((): boolean => {
    if (!canGoBack) return false;
    
    const prevNode = captureFlow.nodes[currentNodeIndex - 1];
    return goToNode(prevNode.id);
  }, [canGoBack, captureFlow.nodes, currentNodeIndex, goToNode]);
  
  // Submit the flow
  const submit = useCallback(async (): Promise<boolean> => {
    if (!validateAll()) return false;
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Simulate async submission
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isComplete: true,
      }));
      
      onComplete?.(state.answers);
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      return false;
    }
  }, [validateAll, state.answers, onComplete]);
  
  // Reset state
  const reset = useCallback(() => {
    setState({
      currentNodeId: captureFlow.nodes[0]?.id || null,
      answers: {},
      validationErrors: {},
      isSubmitting: false,
      isComplete: false,
    });
  }, [captureFlow.nodes]);
  
  return {
    state,
    currentNode,
    currentNodeIndex,
    totalNodes,
    progress,
    setAnswer,
    validateCurrentNode,
    validateAll,
    goToNode,
    advance,
    goBack,
    canGoBack,
    canAdvance,
    submit,
    reset,
  };
}
