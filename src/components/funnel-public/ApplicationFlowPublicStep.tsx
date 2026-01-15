// ApplicationFlowPublicStep - Public runtime renderer for Application Engine blocks
// Uses the unified ApplicationStepRenderer for visual consistency

import React, { useState, useCallback, useMemo } from 'react';
import { ApplicationStepRenderer } from '@/flow-canvas/shared/components/ApplicationStepRenderer';
import { funnelStepToApplicationSteps, getApplicationFlowConfig } from '@/flow-canvas/shared/adapters/legacyAdapters';
import { useConsentRequired } from '@/flow-canvas/shared/hooks/useConsentRequired';
import type { ApplicationStep } from '@/flow-canvas/shared/types/applicationEngine';
import { cn } from '@/lib/utils';

interface ApplicationFlowPublicStepProps {
  content: Record<string, any>;
  settings: {
    primary_color?: string;
    button_text?: string;
    [key: string]: any;
  };
  onNext: (value?: any) => void;
  isActive: boolean;
  currentStep?: number;
  totalSteps?: number;
  // Consent props (passed through when identity is collected)
  termsUrl?: string;
  showConsentCheckbox?: boolean;
  consentChecked?: boolean;
  consentError?: string | null;
  onConsentChange?: (checked: boolean) => void;
}

export function ApplicationFlowPublicStep({
  content,
  settings,
  onNext,
  isActive,
  termsUrl,
  showConsentCheckbox,
  consentChecked,
  consentError,
  onConsentChange,
}: ApplicationFlowPublicStepProps) {
  // Convert funnel content to ApplicationSteps
  const steps = useMemo(() => {
    const funnelStep = {
      id: 'current',
      step_type: 'application_flow',
      content,
    };
    return funnelStepToApplicationSteps(funnelStep) || [];
  }, [content]);

  const config = useMemo(() => {
    const funnelStep = {
      id: 'current',
      step_type: 'application_flow',
      content,
    };
    return getApplicationFlowConfig(funnelStep) || { displayMode: 'one-at-a-time', showProgress: true };
  }, [content]);

  // Track current step index within the flow
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [internalConsent, setInternalConsent] = useState(consentChecked || false);

  // Check if any step requires consent
  const { requiresConsent, showConsentCheckbox: shouldShowConsent, consentMessage } = useConsentRequired({
    steps,
    privacyPolicyUrl: termsUrl,
  });

  const currentApplicationStep = steps[currentIndex];

  const handleValueChange = useCallback((stepId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }));
  }, []);

  const handleStepSubmit = useCallback(() => {
    const isLastStep = currentIndex >= steps.length - 1;
    
    if (isLastStep) {
      // Collect all answers and submit
      const finalPayload = {
        answers,
        currentStepAnswer: answers[currentApplicationStep?.id],
        consent: internalConsent,
      };
      onNext(finalPayload);
    } else {
      // Move to next step within the flow
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, steps.length, answers, currentApplicationStep?.id, internalConsent, onNext]);

  const handleConsentToggle = useCallback((checked: boolean) => {
    setInternalConsent(checked);
    onConsentChange?.(checked);
  }, [onConsentChange]);

  // Extract appearance from content
  const appearance = useMemo(() => ({
    primaryColor: settings.primary_color || content.buttonColor || '#000000',
    backgroundColor: content.background?.color || '#ffffff',
    textColor: content.textColor || '#000000',
    inputBackground: content.inputBackground || '#ffffff',
    inputBorderColor: content.inputBorderColor || '#e5e7eb',
    buttonStyle: content.buttonStyle || 'solid',
    borderRadius: content.borderRadius || 8,
  }), [settings, content]);

  if (!currentApplicationStep) {
    return null;
  }

  const isLastStep = currentIndex >= steps.length - 1;
  const showConsentOnThisStep = isLastStep && requiresConsent && (showConsentCheckbox ?? shouldShowConsent);

  return (
    <div className={cn(
      "w-full max-w-lg mx-auto",
      !isActive && "pointer-events-none opacity-50"
    )}>
      {/* Progress indicator */}
      {config.showProgress && steps.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentIndex + 1} of {steps.length}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Current step */}
      <ApplicationStepRenderer
        step={currentApplicationStep}
        value={answers[currentApplicationStep.id]}
        onChange={(value) => handleValueChange(currentApplicationStep.id, value)}
        onSubmit={handleStepSubmit}
        appearance={appearance}
        isPreview={false}
        showConsentCheckbox={showConsentOnThisStep}
        consentChecked={consentChecked ?? internalConsent}
        onConsentChange={handleConsentToggle}
        privacyPolicyUrl={termsUrl}
        consentError={consentError || undefined}
      />
    </div>
  );
}

export default ApplicationFlowPublicStep;
