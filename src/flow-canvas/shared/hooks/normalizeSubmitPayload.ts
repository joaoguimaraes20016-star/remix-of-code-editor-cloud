/**
 * normalizeSubmitPayload.ts - Unified payload normalizer for all lead submissions
 * 
 * Consolidates the divergent schemas between useApplicationSubmit and useUnifiedLeadSubmit
 * to ensure consistent backend payloads regardless of submission source.
 */

import type { LeadIdentity, LeadConsent, LeadSource, LeadMetadata } from './useUnifiedLeadSubmit';

// Backend-normalized payload structure
export interface BackendSubmitPayload {
  // Core identifiers
  funnel_id: string;
  funnelId: string;
  team_id: string;
  teamId: string;
  lead_id?: string | null;
  
  // Answers with identity flattened in
  answers: Record<string, any>;
  
  // Explicit identity fields (top-level for backward compatibility)
  name?: string;
  email?: string;
  phone?: string;
  
  // UTM tracking
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  
  // Special data
  calendly_booking?: any;
  
  // Submission control
  submitMode: 'draft' | 'submit';
  clientRequestId: string;
  
  // Step tracking (normalized)
  step_id?: string;
  step_ids?: string[];
  step_type?: string;
  step_intent?: string;
  page_id?: string;
  last_step_index?: number;
  
  // Consent (normalized structure)
  consent?: {
    agreed: boolean;
    timestamp: string;
    email_consent?: boolean;
    sms_consent?: boolean;
    privacy_policy_url?: string;
  };
}

/**
 * Normalizes lead submission data to a consistent backend payload format.
 * Used by both useApplicationSubmit and useUnifiedLeadSubmit.
 */
export function normalizeToBackendPayload(
  answers: Record<string, any>,
  identity: LeadIdentity,
  consent: LeadConsent | undefined,
  source: LeadSource,
  metadata: LeadMetadata | undefined,
  options: {
    leadId?: string | null;
    submitMode: 'draft' | 'submit';
    clientRequestId: string;
  }
): BackendSubmitPayload {
  // Flatten identity into answers for backward compatibility
  const flattenedAnswers = {
    ...answers,
    ...(identity.name && { name: identity.name }),
    ...(identity.email && { email: identity.email }),
    ...(identity.phone && { phone: identity.phone }),
  };

  // Normalize consent to consistent structure
  const normalizedConsent = consent?.agreed ? {
    agreed: true,
    timestamp: consent.timestamp || new Date().toISOString(),
    email_consent: consent.email ?? false,
    sms_consent: consent.sms ?? false,
    privacy_policy_url: consent.privacyPolicyUrl,
  } : undefined;

  return {
    // Core identifiers (both formats for backward compatibility)
    funnel_id: source.funnelId,
    funnelId: source.funnelId,
    team_id: source.teamId,
    teamId: source.teamId,
    lead_id: options.leadId,
    
    // Answers with identity flattened in
    answers: flattenedAnswers,
    
    // Explicit identity fields
    name: identity.name,
    email: identity.email,
    phone: identity.phone,
    
    // UTM tracking
    utm_source: metadata?.utm_source,
    utm_medium: metadata?.utm_medium,
    utm_campaign: metadata?.utm_campaign,
    
    // Special data
    calendly_booking: metadata?.calendly_booking,
    
    // Submission control
    submitMode: options.submitMode,
    clientRequestId: options.clientRequestId,
    
    // Step tracking (normalized - use first stepId if array provided)
    step_id: source.stepId || source.stepIds?.[0],
    step_ids: source.stepIds,
    step_type: source.stepType,
    step_intent: source.stepIntent,
    page_id: source.pageId,
    last_step_index: source.lastStepIndex,
    
    // Consent
    consent: normalizedConsent,
  };
}

/**
 * URL sanitization helper for button navigation actions.
 * Validates URLs against an allowlist of safe schemes.
 */
export function sanitizeNavigationUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url, window.location.origin);
    const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
    
    if (!allowedSchemes.includes(parsed.protocol)) {
      console.warn(`[Security] Blocked navigation to disallowed scheme: ${parsed.protocol}`);
      return null;
    }
    
    return parsed.href;
  } catch {
    // Relative URL - allow paths and anchors
    if (url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    console.warn(`[Security] Blocked navigation to invalid URL: ${url}`);
    return null;
  }
}

/**
 * Phone formatting that supports international numbers.
 * Preserves international format (starting with +) without truncation.
 */
export function formatPhoneInternational(input: string): string {
  // Preserve international format - just clean non-digit except leading +
  if (input.startsWith('+')) {
    return '+' + input.slice(1).replace(/[^\d]/g, '');
  }
  
  // US formatting for domestic numbers
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  
  // Allow more than 10 digits (could be international without +)
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
