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
    
    // FIXED: Always show checkbox when identity is collected (with or without privacy URL)
    // This ensures GDPR/CCPA compliance - consent must be captured when collecting personal data
    const showConsentCheckbox = requiresConsent;

    // Generate appropriate consent message based on data collected
    let consentMessage: string;
    if (privacyPolicyUrl) {
      // Has privacy policy - reference it
      if (hasEmail && hasPhone) {
        consentMessage = 'I agree to receive emails and SMS messages per the Privacy Policy';
      } else if (hasEmail) {
        consentMessage = 'I agree to receive emails per the Privacy Policy';
      } else if (hasPhone) {
        consentMessage = 'I agree to receive SMS messages per the Privacy Policy';
      } else {
        consentMessage = 'I agree to the Privacy Policy';
      }
    } else {
      // No privacy policy URL - use fallback consent message
      if (hasEmail && hasPhone) {
        consentMessage = 'I consent to having my information stored and to receiving emails and SMS messages';
      } else if (hasEmail) {
        consentMessage = 'I consent to having my information stored and to receiving emails';
      } else if (hasPhone) {
        consentMessage = 'I consent to having my information stored and to receiving SMS messages';
      } else {
        consentMessage = 'I consent to having my information stored and processed';
      }
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
