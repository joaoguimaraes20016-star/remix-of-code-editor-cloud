// CaptureNodeRenderer - Routes CaptureNode to unified ApplicationStepRenderer
// This is a thin adapter layer that converts CaptureNode → ApplicationStep

import React from 'react';
import { CaptureNode, CaptureFlowAnswers } from '@/flow-canvas/types/captureFlow';
import { 
  ApplicationStepRenderer,
  captureNodeToApplicationStep,
  ApplicationAnswerValue,
  ApplicationEngineAppearance,
} from '@/flow-canvas/shared';

export interface CaptureNodeRendererProps {
  node: CaptureNode;
  value: CaptureFlowAnswers[string];
  onChange: (value: CaptureFlowAnswers[string]) => void;
  onSubmit: () => void;
  validationError?: string;
  isPreview?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  appearance?: ApplicationEngineAppearance;
  // Consent props
  showConsentCheckbox?: boolean;
  consentChecked?: boolean;
  onConsentChange?: (checked: boolean) => void;
  consentMessage?: string;
  privacyPolicyUrl?: string;
  consentError?: string;
}

export const CaptureNodeRenderer: React.FC<CaptureNodeRendererProps> = ({
  node,
  value,
  onChange,
  onSubmit,
  validationError,
  isPreview = false,
  isSelected = false,
  onSelect,
  appearance,
  showConsentCheckbox,
  consentChecked,
  onConsentChange,
  consentMessage,
  privacyPolicyUrl,
  consentError,
}) => {
  // Convert CaptureNode to unified ApplicationStep
  const applicationStep = captureNodeToApplicationStep(node);

  return (
    <ApplicationStepRenderer
      step={applicationStep}
      value={value as ApplicationAnswerValue}
      onChange={(newValue) => onChange(newValue as CaptureFlowAnswers[string])}
      onSubmit={onSubmit}
      validationError={validationError}
      appearance={appearance}
      isPreview={isPreview}
      isSelected={isSelected}
      onSelect={onSelect}
      showConsentCheckbox={showConsentCheckbox}
      consentChecked={consentChecked}
      onConsentChange={onConsentChange}
      consentMessage={consentMessage}
      privacyPolicyUrl={privacyPolicyUrl}
      consentError={consentError}
    />
  );
};

export default CaptureNodeRenderer;
