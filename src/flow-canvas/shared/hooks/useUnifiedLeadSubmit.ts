/**
 * useUnifiedLeadSubmit - Single unified hook for ALL lead submissions
 * 
 * This hook provides a consistent API for lead submission across all contexts:
 * - FunnelRenderer (legacy step-based funnels)
 * - FlowCanvasRenderer (Typeform-style flows)
 * - CanvasRenderer (interactive blocks anywhere)
 * 
 * All submissions go through the same pipeline:
 * 1. submit() → Creates/updates lead, triggers automations
 * 2. saveDraft() → Creates/updates lead, NO automations (for drop-off tracking)
 */

import { useCallback, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============ TYPES ============

export interface LeadIdentity {
  name?: string;
  email?: string;
  phone?: string;
}

export interface LeadConsent {
  agreed?: boolean;
  email?: boolean;
  sms?: boolean;
  timestamp?: string;
  privacyPolicyUrl?: string;
}

export interface LeadSource {
  funnelId: string;
  teamId: string;
  stepId?: string;
  stepIds?: string[];
  stepType?: string;
  stepIntent?: 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' | 'navigate' | 'info';
  pageId?: string;
  lastStepIndex?: number;
}

export interface LeadMetadata {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  calendly_booking?: any;
}

export interface UnifiedSubmitPayload {
  answers: Record<string, any>;
  identity?: LeadIdentity;
  consent?: LeadConsent;
  source: LeadSource;
  metadata?: LeadMetadata;
}

export interface UnifiedLeadSubmitOptions {
  funnelId: string;
  teamId: string;
  /** Initial lead ID if updating an existing lead */
  initialLeadId?: string | null;
  /** UTM parameters from URL */
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** Callback when lead is successfully created/updated */
  onLeadSaved?: (leadId: string, mode: 'draft' | 'submit') => void;
  /** Callback when submission fails */
  onError?: (error: any) => void;
}

export interface UnifiedLeadSubmitReturn {
  /** Submit lead (triggers automations) */
  submit: (payload: UnifiedSubmitPayload) => Promise<{ leadId?: string; error?: any }>;
  /** Save draft (no automations, for drop-off tracking) */
  saveDraft: (payload: UnifiedSubmitPayload) => Promise<{ leadId?: string; error?: any }>;
  /** Current lead ID (updated after each save) */
  leadId: string | null;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Last error message */
  lastError: string | null;
  /** Clear the last error */
  clearError: () => void;
}

// ============ HELPER: Extract identity from answers ============

export function extractIdentityFromAnswers(answers: Record<string, any>): {
  identity: LeadIdentity;
  otherAnswers: Record<string, any>;
} {
  // Common identity field aliases
  const nameKeys = ['name', 'full_name', 'fullName', 'contact_name', 'contactName', 'firstName', 'first_name'];
  const emailKeys = ['email', 'email_address', 'emailAddress', 'contact_email', 'contactEmail'];
  const phoneKeys = ['phone', 'phone_number', 'phoneNumber', 'contact_phone', 'contactPhone', 'mobile'];
  
  let name: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  const otherAnswers: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(answers)) {
    const keyLower = key.toLowerCase();
    
    if (!name && nameKeys.some(k => keyLower === k.toLowerCase()) && typeof value === 'string') {
      name = value;
    } else if (!email && emailKeys.some(k => keyLower === k.toLowerCase()) && typeof value === 'string') {
      email = value;
    } else if (!phone && phoneKeys.some(k => keyLower === k.toLowerCase()) && typeof value === 'string') {
      phone = value;
    } else {
      otherAnswers[key] = value;
    }
  }
  
  // Also check nested opt_in objects
  if (answers.opt_in?.value && typeof answers.opt_in.value === 'object') {
    const optIn = answers.opt_in.value;
    if (!name && optIn.name) name = optIn.name;
    if (!email && optIn.email) email = optIn.email;
    if (!phone && optIn.phone) phone = optIn.phone;
  }
  
  return {
    identity: { name, email, phone },
    otherAnswers,
  };
}

// ============ HELPER: Create submit payload ============

export function createUnifiedPayload(
  answers: Record<string, any>,
  source: LeadSource,
  options?: {
    consent?: LeadConsent;
    metadata?: LeadMetadata;
  }
): UnifiedSubmitPayload {
  const { identity, otherAnswers } = extractIdentityFromAnswers(answers);
  
  return {
    answers: otherAnswers,
    identity,
    consent: options?.consent,
    source,
    metadata: options?.metadata,
  };
}

// ============ MAIN HOOK ============

export function useUnifiedLeadSubmit(options: UnifiedLeadSubmitOptions): UnifiedLeadSubmitReturn {
  const {
    funnelId,
    teamId,
    initialLeadId,
    utmSource,
    utmMedium,
    utmCampaign,
    onLeadSaved,
    onError,
  } = options;

  const [leadId, setLeadId] = useState<string | null>(initialLeadId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Prevent duplicate submissions
  const pendingRef = useRef(false);
  // Track lead ID in ref for stable access in callbacks
  const leadIdRef = useRef<string | null>(initialLeadId || null);
  // Track last submit time to skip draft saves immediately after submit
  const lastSubmitTimeRef = useRef<number>(0);
  // Track pending draft save timeout for debouncing
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to ref
  const updateLeadId = useCallback((id: string | null) => {
    leadIdRef.current = id;
    setLeadId(id);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Core submission logic
  const doSubmit = useCallback(async (
    payload: UnifiedSubmitPayload,
    mode: 'draft' | 'submit'
  ): Promise<{ leadId?: string; error?: any }> => {
    // Prevent duplicate submissions
    if (pendingRef.current) {
      console.log('[useUnifiedLeadSubmit] Ignoring duplicate - submission in progress');
      return { error: 'Submission already in progress' };
    }

    pendingRef.current = true;
    setIsSubmitting(true);
    setLastError(null);

    // Generate stable client request ID for submit mode (idempotency)
    let clientRequestId: string;
    if (mode === 'submit') {
      const stepKey = payload.source.stepId || payload.source.stepIds?.join(',') || 'unknown';
      const key = `submitReq:${funnelId}:${stepKey}`;
      const existing = sessionStorage.getItem(key);
      clientRequestId = existing || crypto.randomUUID();
      if (!existing) sessionStorage.setItem(key, clientRequestId);
    } else {
      clientRequestId = crypto.randomUUID();
    }

    // Flatten identity into answers for backward compatibility
    const flattenedAnswers = {
      ...payload.answers,
      ...(payload.identity?.name && { name: payload.identity.name }),
      ...(payload.identity?.email && { email: payload.identity.email }),
      ...(payload.identity?.phone && { phone: payload.identity.phone }),
    };

    try {
      console.log(`[useUnifiedLeadSubmit] ====== SUBMISSION STARTED ======`, {
        mode,
        funnelId,
        teamId,
        leadId: leadIdRef.current,
        hasIdentity: !!(payload.identity?.name || payload.identity?.email || payload.identity?.phone),
        answersCount: Object.keys(payload.answers).length,
        stepId: payload.source.stepId,
        stepIntent: payload.source.stepIntent,
      });

      const { data, error } = await supabase.functions.invoke('submit-funnel-lead', {
        body: {
          // Required identifiers (both formats for compatibility)
          funnel_id: funnelId,
          funnelId: funnelId,
          team_id: teamId,
          teamId: teamId,
          lead_id: leadIdRef.current,
          
          // Answers with identity flattened in
          answers: flattenedAnswers,
          
          // Explicit identity fields
          name: payload.identity?.name,
          email: payload.identity?.email,
          phone: payload.identity?.phone,
          
          // UTM tracking
          utm_source: payload.metadata?.utm_source ?? utmSource,
          utm_medium: payload.metadata?.utm_medium ?? utmMedium,
          utm_campaign: payload.metadata?.utm_campaign ?? utmCampaign,
          
          // Calendly booking data
          calendly_booking: payload.metadata?.calendly_booking,
          
          // Submission control
          submitMode: mode,
          clientRequestId,
          
          // Step tracking
          step_id: payload.source.stepId,
          step_ids: payload.source.stepIds,
          step_type: payload.source.stepType,
          step_intent: payload.source.stepIntent,
          page_id: payload.source.pageId,
          last_step_index: payload.source.lastStepIndex,
          
          // Consent data
          consent: payload.consent?.agreed ? {
            agreed: true,
            timestamp: payload.consent.timestamp || new Date().toISOString(),
            email_consent: payload.consent.email,
            sms_consent: payload.consent.sms,
            privacy_policy_url: payload.consent.privacyPolicyUrl,
          } : undefined,
        },
      });

      if (error) {
        console.error('[useUnifiedLeadSubmit] ====== SUBMISSION ERROR ======', {
          error,
          mode,
          funnelId,
          teamId,
          leadId: leadIdRef.current,
          stepId: payload.source.stepId,
        });
        setLastError(error.message || 'Submission failed');
        onError?.(error);
        return { error };
      }

      // Extract lead ID from response (handle various response shapes)
      const returnedLeadId = data?.lead_id || data?.lead?.id || data?.leadId || data?.id;
      
      console.log('[useUnifiedLeadSubmit] ====== SUBMISSION RESPONSE ======', {
        success: !!returnedLeadId,
        returnedLeadId,
        mode,
        funnelId,
        teamId,
        responseData: data,
      });
      
      if (returnedLeadId) {
        updateLeadId(returnedLeadId);
        console.log(`[useUnifiedLeadSubmit] Success: leadId=${returnedLeadId}, mode=${mode}`);
        onLeadSaved?.(returnedLeadId, mode);
      } else {
        console.warn('[useUnifiedLeadSubmit] No lead ID in response', {
          data,
          mode,
          funnelId,
          teamId,
        });
      }

      // Track submit time for draft save prevention
      if (mode === 'submit') {
        lastSubmitTimeRef.current = Date.now();
      }

      return { leadId: returnedLeadId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useUnifiedLeadSubmit] Exception:', err);
      setLastError(errorMessage);
      onError?.(err);
      return { error: err };
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  }, [funnelId, teamId, utmSource, utmMedium, utmCampaign, onLeadSaved, onError, updateLeadId]);

  const submit = useCallback(
    (payload: UnifiedSubmitPayload) => doSubmit(payload, 'submit'),
    [doSubmit]
  );

  const saveDraft = useCallback(
    (payload: UnifiedSubmitPayload) => {
      // Skip if we just did a full submit (within 1 second)
      if (Date.now() - lastSubmitTimeRef.current < 1000) {
        console.log('[useUnifiedLeadSubmit] Skipping draft save - just submitted');
        return Promise.resolve({});
      }
      
      // Cancel any pending draft save
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
        draftTimeoutRef.current = null;
      }
      
      // Debounce: wait 500ms before saving
      return new Promise<{ leadId?: string; error?: any }>((resolve) => {
        draftTimeoutRef.current = setTimeout(() => {
          draftTimeoutRef.current = null;
          doSubmit(payload, 'draft').then(resolve);
        }, 500);
      });
    },
    [doSubmit]
  );

  return useMemo(() => ({
    submit,
    saveDraft,
    leadId,
    isSubmitting,
    lastError,
    clearError,
  }), [submit, saveDraft, leadId, isSubmitting, lastError, clearError]);
}

export default useUnifiedLeadSubmit;
