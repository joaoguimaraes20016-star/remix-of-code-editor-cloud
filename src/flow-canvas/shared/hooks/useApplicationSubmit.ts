// useApplicationSubmit - Unified submission pipeline for Application Engine
// Handles all submissions regardless of context (inline, flow modal, public runtime)

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Unified payload structure for all Application Engine submissions
export interface ApplicationSubmitPayload {
  answers: Record<string, any>;
  identity: {
    name?: string;
    email?: string;
    phone?: string;
  };
  consent: {
    email?: boolean;
    sms?: boolean;
    timestamp?: string;
  };
  source: {
    funnelId: string;
    teamId: string;
    pageId?: string;
    stepIds: string[];
  };
  metadata?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    calendly_booking?: any;
  };
}

export interface ApplicationSubmitOptions {
  funnelId: string;
  teamId: string;
  leadId?: string | null;
  mode?: 'draft' | 'submit';
  onSuccess?: (leadId: string, data: any) => void;
  onError?: (error: any) => void;
}

export interface UseApplicationSubmitReturn {
  submit: (payload: ApplicationSubmitPayload) => Promise<{ leadId?: string; error?: any }>;
  saveDraft: (payload: ApplicationSubmitPayload) => Promise<{ leadId?: string; error?: any }>;
  isSubmitting: boolean;
  lastSubmitError: string | null;
}

/**
 * Unified submission hook for all Application Engine content.
 * Works for inline blocks, flow modals, and public runtime.
 */
export function useApplicationSubmit(options: ApplicationSubmitOptions): UseApplicationSubmitReturn {
  const { funnelId, teamId, leadId: initialLeadId, onSuccess, onError } = options;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitError, setLastSubmitError] = useState<string | null>(null);
  const pendingSubmitRef = useRef(false);
  const leadIdRef = useRef<string | null>(initialLeadId || null);

  const doSubmit = useCallback(async (
    payload: ApplicationSubmitPayload,
    mode: 'draft' | 'submit'
  ): Promise<{ leadId?: string; error?: any }> => {
    // Prevent duplicate submissions
    if (pendingSubmitRef.current) {
      console.log('[useApplicationSubmit] Ignoring duplicate - submission in progress');
      return { error: 'Submission already in progress' };
    }

    pendingSubmitRef.current = true;
    setIsSubmitting(true);
    setLastSubmitError(null);

    // Generate stable client request ID for submit mode (idempotency)
    let clientRequestId: string;
    if (mode === 'submit') {
      const key = `appSubmit:${funnelId}:${payload.source.stepIds.join(',')}`;
      const existing = sessionStorage.getItem(key);
      clientRequestId = existing || crypto.randomUUID();
      if (!existing) sessionStorage.setItem(key, clientRequestId);
    } else {
      clientRequestId = crypto.randomUUID();
    }

    // Flatten identity into answers for backward compatibility
    const flattenedAnswers = {
      ...payload.answers,
      ...(payload.identity.name && { name: payload.identity.name }),
      ...(payload.identity.email && { email: payload.identity.email }),
      ...(payload.identity.phone && { phone: payload.identity.phone }),
    };

    try {
      console.log(`[useApplicationSubmit] mode=${mode}, funnelId=${funnelId}, clientRequestId=${clientRequestId}`);

      const { data, error } = await supabase.functions.invoke('submit-funnel-lead', {
        body: {
          funnel_id: funnelId,
          funnelId: funnelId,
          team_id: teamId,
          teamId: teamId,
          lead_id: leadIdRef.current,
          answers: flattenedAnswers,
          utm_source: payload.metadata?.utm_source,
          utm_medium: payload.metadata?.utm_medium,
          utm_campaign: payload.metadata?.utm_campaign,
          calendly_booking: payload.metadata?.calendly_booking,
          submitMode: mode,
          clientRequestId,
          // Include consent data
          consent: payload.consent.email || payload.consent.sms ? {
            agreed: true,
            timestamp: payload.consent.timestamp || new Date().toISOString(),
            email_consent: payload.consent.email,
            sms_consent: payload.consent.sms,
          } : undefined,
          // Include step tracking
          step_ids: payload.source.stepIds,
          page_id: payload.source.pageId,
        },
      });

      if (error) {
        console.error('[useApplicationSubmit] Submission error:', error);
        setLastSubmitError(error.message || 'Submission failed');
        onError?.(error);
        return { error };
      }

      // Extract lead ID from response (handle various response shapes)
      const returnedLeadId = data?.lead_id || data?.lead?.id || data?.leadId || data?.id;
      
      if (returnedLeadId) {
        leadIdRef.current = returnedLeadId;
        console.log(`[useApplicationSubmit] Success: leadId=${returnedLeadId}, mode=${mode}`);
        onSuccess?.(returnedLeadId, data);
      }

      return { leadId: returnedLeadId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useApplicationSubmit] Exception:', err);
      setLastSubmitError(errorMessage);
      onError?.(err);
      return { error: err };
    } finally {
      pendingSubmitRef.current = false;
      setIsSubmitting(false);
    }
  }, [funnelId, teamId, onSuccess, onError]);

  const submit = useCallback(
    (payload: ApplicationSubmitPayload) => doSubmit(payload, 'submit'),
    [doSubmit]
  );

  const saveDraft = useCallback(
    (payload: ApplicationSubmitPayload) => doSubmit(payload, 'draft'),
    [doSubmit]
  );

  return {
    submit,
    saveDraft,
    isSubmitting,
    lastSubmitError,
  };
}

// ============ HELPER: Extract identity from answers ============

/**
 * Extracts identity fields from a mixed answers object.
 * Useful when converting legacy answer formats.
 */
export function extractIdentityFromAnswers(answers: Record<string, any>): {
  identity: { name?: string; email?: string; phone?: string };
  otherAnswers: Record<string, any>;
} {
  const { name, email, phone, ...otherAnswers } = answers;
  
  return {
    identity: {
      name: typeof name === 'string' ? name : undefined,
      email: typeof email === 'string' ? email : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
    },
    otherAnswers,
  };
}

/**
 * Creates a complete ApplicationSubmitPayload from basic inputs.
 * Handles extraction and formatting.
 */
export function createSubmitPayload(
  answers: Record<string, any>,
  source: { funnelId: string; teamId: string; pageId?: string; stepIds: string[] },
  options?: {
    consent?: { email?: boolean; sms?: boolean };
    metadata?: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
  }
): ApplicationSubmitPayload {
  const { identity, otherAnswers } = extractIdentityFromAnswers(answers);
  
  return {
    answers: otherAnswers,
    identity,
    consent: {
      email: options?.consent?.email,
      sms: options?.consent?.sms,
      timestamp: options?.consent?.email || options?.consent?.sms 
        ? new Date().toISOString() 
        : undefined,
    },
    source,
    metadata: options?.metadata,
  };
}
