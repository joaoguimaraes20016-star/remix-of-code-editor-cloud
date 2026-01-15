// useButtonContext - Smart button action detection based on placement
// Auto-detects sensible defaults so users don't have to think

import { useMemo } from 'react';
import type { ButtonActionType } from '../components/modals/ButtonActionModal';

export interface ButtonContext {
  // Where is this button?
  isInsideApplicationFlow: boolean;
  isLastStepOfFlow: boolean;
  isInsideSection: boolean;
  isInsideCaptureBlock: boolean;
  // What step position?
  stepIndex?: number;
  totalSteps?: number;
  // Parent element info
  parentBlockType?: string;
  parentSectionType?: string;
}

export interface ButtonContextResult {
  recommendedAction: ButtonActionType;
  recommendedLabel: string;
  context: ButtonContext;
  allRecommendations: Array<{
    action: ButtonActionType;
    label: string;
    reason: string;
    isRecommended: boolean;
  }>;
}

/**
 * Analyzes button placement and returns smart action recommendations.
 * Eliminates the need for users to manually configure button behavior.
 */
export function useButtonContext(context: Partial<ButtonContext>): ButtonContextResult {
  return useMemo(() => {
    const fullContext: ButtonContext = {
      isInsideApplicationFlow: context.isInsideApplicationFlow ?? false,
      isLastStepOfFlow: context.isLastStepOfFlow ?? false,
      isInsideSection: context.isInsideSection ?? true,
      isInsideCaptureBlock: context.isInsideCaptureBlock ?? false,
      stepIndex: context.stepIndex,
      totalSteps: context.totalSteps,
      parentBlockType: context.parentBlockType,
      parentSectionType: context.parentSectionType,
    };

    const recommendations: Array<{
      action: ButtonActionType;
      label: string;
      reason: string;
      isRecommended: boolean;
    }> = [];

    // Determine recommended action based on context
    let recommendedAction: ButtonActionType = 'next-step';
    let recommendedLabel = 'Continue';

    // Priority 1: Inside Application Flow
    if (fullContext.isInsideApplicationFlow) {
      if (fullContext.isLastStepOfFlow) {
        // Last step of flow → Submit
        recommendedAction = 'submit';
        recommendedLabel = 'Submit';
        recommendations.push({
          action: 'submit',
          label: 'Submit',
          reason: 'This is the last step - submit the form',
          isRecommended: true,
        });
        recommendations.push({
          action: 'next-step',
          label: 'Continue',
          reason: 'Advance to next section after flow',
          isRecommended: false,
        });
      } else {
        // Middle of flow → Next step within flow
        recommendedAction = 'next-step';
        recommendedLabel = 'Continue';
        recommendations.push({
          action: 'next-step',
          label: 'Continue',
          reason: `Go to step ${(fullContext.stepIndex || 0) + 2} of ${fullContext.totalSteps}`,
          isRecommended: true,
        });
        recommendations.push({
          action: 'submit',
          label: 'Submit Early',
          reason: 'Submit form before completing all steps',
          isRecommended: false,
        });
      }
    }
    // Priority 2: Inside a capture/identity block
    else if (fullContext.isInsideCaptureBlock) {
      recommendedAction = 'submit';
      recommendedLabel = 'Submit';
      recommendations.push({
        action: 'submit',
        label: 'Submit',
        reason: 'Submit the captured information',
        isRecommended: true,
      });
      recommendations.push({
        action: 'next-step',
        label: 'Continue',
        reason: 'Save and continue to next step',
        isRecommended: false,
      });
    }
    // Priority 3: Regular section content
    else if (fullContext.isInsideSection) {
      recommendedAction = 'next-step';
      recommendedLabel = 'Continue';
      recommendations.push({
        action: 'next-step',
        label: 'Continue',
        reason: 'Go to the next step',
        isRecommended: true,
      });
      recommendations.push({
        action: 'scroll',
        label: 'Scroll Down',
        reason: 'Scroll to the next section on page',
        isRecommended: false,
      });
    }
    // Default fallback
    else {
      recommendations.push({
        action: 'next-step',
        label: 'Continue',
        reason: 'Default action - advance the funnel',
        isRecommended: true,
      });
    }

    // Always add URL option as non-recommended
    recommendations.push({
      action: 'url',
      label: 'Open URL',
      reason: 'Navigate to an external link',
      isRecommended: false,
    });

    return {
      recommendedAction,
      recommendedLabel,
      context: fullContext,
      allRecommendations: recommendations,
    };
  }, [
    context.isInsideApplicationFlow,
    context.isLastStepOfFlow,
    context.isInsideSection,
    context.isInsideCaptureBlock,
    context.stepIndex,
    context.totalSteps,
    context.parentBlockType,
    context.parentSectionType,
  ]);
}

/**
 * Determines button context from a block's position in the document tree.
 * Call this when you have access to the full document structure.
 */
export function detectButtonContext(
  blockId: string,
  parentBlockType?: string,
  parentStepIndex?: number,
  parentTotalSteps?: number
): Partial<ButtonContext> {
  const isApplicationFlow = parentBlockType === 'application-flow' || parentBlockType === 'application_flow';
  const isCaptureBlock = ['opt_in', 'email_capture', 'phone_capture', 'contact_capture', 'full-identity'].includes(parentBlockType || '');
  
  return {
    isInsideApplicationFlow: isApplicationFlow,
    isLastStepOfFlow: isApplicationFlow && parentStepIndex !== undefined && parentTotalSteps !== undefined 
      ? parentStepIndex >= parentTotalSteps - 1 
      : false,
    isInsideCaptureBlock: isCaptureBlock,
    isInsideSection: !isApplicationFlow,
    stepIndex: parentStepIndex,
    totalSteps: parentTotalSteps,
    parentBlockType,
  };
}
