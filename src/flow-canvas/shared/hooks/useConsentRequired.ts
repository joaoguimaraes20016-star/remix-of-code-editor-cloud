// useConsentRequired - Universal consent detection
// Returns true if ANY step in the flow collects identity data

import { useMemo } from 'react';
import { 
  ApplicationStep, 
  ApplicationStepType,
  IDENTITY_STEP_TYPES,
  isIdentityStep 
} from '../types/applicationEngine';

interface UseConsentRequiredOptions {
  steps: ApplicationStep[];
  privacyPolicyUrl?: string;
}

interface UseConsentRequiredResult {
  requiresConsent: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasName: boolean;
  showConsentCheckbox: boolean;
  consentMessage: string;
}

/**
 * Determines if consent is required based on the steps in a flow.
 * Consent is required when any identity-collecting step exists.
 */
export function useConsentRequired({
  steps,
  privacyPolicyUrl,
}: UseConsentRequiredOptions): UseConsentRequiredResult {
  return useMemo(() => {
    const hasEmail = steps.some(s => 
      s.type === 'email' || 
      s.type === 'full-identity'
    );
    
    const hasPhone = steps.some(s => 
      s.type === 'phone' || 
      s.type === 'full-identity'
    );
    
    const hasName = steps.some(s => 
      s.type === 'name' || 
      s.type === 'full-identity'
    );

    const requiresConsent = steps.some(s => isIdentityStep(s.type));
    
    // Only show checkbox if we have a privacy policy URL and require consent
    const showConsentCheckbox = requiresConsent && !!privacyPolicyUrl;

    // Generate appropriate consent message
    let consentMessage = 'I agree to the Privacy Policy';
    if (hasEmail && hasPhone) {
      consentMessage = 'I agree to receive emails and SMS messages per the Privacy Policy';
    } else if (hasEmail) {
      consentMessage = 'I agree to receive emails per the Privacy Policy';
    } else if (hasPhone) {
      consentMessage = 'I agree to receive SMS messages per the Privacy Policy';
    }

    return {
      requiresConsent,
      hasEmail,
      hasPhone,
      hasName,
      showConsentCheckbox,
      consentMessage,
    };
  }, [steps, privacyPolicyUrl]);
}

/**
 * Checks if a single step type requires consent
 */
export function stepRequiresConsent(type: ApplicationStepType): boolean {
  return isIdentityStep(type);
}

/**
 * Checks if any of the provided step types require consent
 */
export function anyStepRequiresConsent(types: ApplicationStepType[]): boolean {
  return types.some(t => isIdentityStep(t));
}
