/**
 * FunnelRuntimeContext - Manages form state and submission for published funnels
 * 
 * This context bridges the gap between static rendered components and
 * interactive runtime behavior on published pages.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunnelRuntimeState {
  /** Current form values keyed by fieldKey */
  formData: Record<string, string>;
  /** Current step/page index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Submission status */
  isSubmitting: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether form was successfully submitted */
  isComplete: boolean;
  /** Consent checkbox state */
  hasConsent: boolean;
}

interface FunnelRuntimeActions {
  /** Update a form field value */
  updateField: (fieldKey: string, value: string) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Go to specific step */
  goToStep: (step: number) => void;
  /** Submit the form */
  submitForm: () => Promise<void>;
  /** Handle button click based on action type */
  handleButtonClick: (action: string, linkUrl?: string) => void;
  /** Toggle consent checkbox */
  toggleConsent: () => void;
  /** Reset the form */
  reset: () => void;
}

interface FunnelRuntimeConfig {
  funnelId: string;
  teamId: string;
  funnelSlug: string;
  webhookUrls?: string[];
  redirectUrl?: string;
}

interface FunnelRuntimeContextValue {
  state: FunnelRuntimeState;
  actions: FunnelRuntimeActions;
  config: FunnelRuntimeConfig;
}

const FunnelRuntimeContext = createContext<FunnelRuntimeContextValue | null>(null);

interface FunnelRuntimeProviderProps {
  children: React.ReactNode;
  config: FunnelRuntimeConfig;
  totalSteps?: number;
  onComplete?: (formData: Record<string, string>) => void;
}

export function FunnelRuntimeProvider({ 
  children, 
  config,
  totalSteps = 1,
  onComplete,
}: FunnelRuntimeProviderProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  const updateField = useCallback((fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    setError(null);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, [totalSteps]);

  const toggleConsent = useCallback(() => {
    setHasConsent(prev => !prev);
  }, []);

  const submitForm = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Extract known fields from formData
      const email = formData.email || formData.Email || null;
      const name = formData.name || formData.Name || formData.fullName || null;
      const phone = formData.phone || formData.Phone || formData.phoneNumber || null;

      // Get UTM params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');

      // Submit to funnel_leads
      const { data: lead, error: insertError } = await supabase
        .from('funnel_leads')
        .insert({
          funnel_id: config.funnelId,
          team_id: config.teamId,
          email,
          name,
          phone,
          answers: formData,
          status: 'complete',
          opt_in_status: hasConsent,
          opt_in_timestamp: hasConsent ? new Date().toISOString() : null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger webhooks if configured
      if (config.webhookUrls?.length) {
        for (const webhookUrl of config.webhookUrls) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lead_id: lead.id,
                funnel_id: config.funnelId,
                email,
                name,
                phone,
                answers: formData,
                submitted_at: new Date().toISOString(),
              }),
            });
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
          }
        }
      }

      setIsComplete(true);
      onComplete?.(formData);

      // Redirect if configured
      if (config.redirectUrl) {
        window.location.href = config.redirectUrl;
      }

    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, config, hasConsent, onComplete]);

  const handleButtonClick = useCallback((action: string, linkUrl?: string) => {
    switch (action) {
      case 'next':
        if (currentStep < totalSteps - 1) {
          nextStep();
        } else {
          submitForm();
        }
        break;
      case 'submit':
        submitForm();
        break;
      case 'link':
        if (linkUrl) {
          window.open(linkUrl, '_blank');
        }
        break;
      case 'prev':
        prevStep();
        break;
      default:
        // Default to next/submit
        if (currentStep < totalSteps - 1) {
          nextStep();
        } else {
          submitForm();
        }
    }
  }, [currentStep, totalSteps, nextStep, prevStep, submitForm]);

  const reset = useCallback(() => {
    setFormData({});
    setCurrentStep(0);
    setIsSubmitting(false);
    setError(null);
    setIsComplete(false);
    setHasConsent(false);
  }, []);

  const state: FunnelRuntimeState = useMemo(() => ({
    formData,
    currentStep,
    totalSteps,
    isSubmitting,
    error,
    isComplete,
    hasConsent,
  }), [formData, currentStep, totalSteps, isSubmitting, error, isComplete, hasConsent]);

  const actions: FunnelRuntimeActions = useMemo(() => ({
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    handleButtonClick,
    toggleConsent,
    reset,
  }), [updateField, nextStep, prevStep, goToStep, submitForm, handleButtonClick, toggleConsent, reset]);

  const value = useMemo(() => ({
    state,
    actions,
    config,
  }), [state, actions, config]);

  return (
    <FunnelRuntimeContext.Provider value={value}>
      {children}
    </FunnelRuntimeContext.Provider>
  );
}

export function useFunnelRuntime() {
  const context = useContext(FunnelRuntimeContext);
  if (!context) {
    throw new Error('useFunnelRuntime must be used within FunnelRuntimeProvider');
  }
  return context;
}

export function useFunnelRuntimeOptional() {
  return useContext(FunnelRuntimeContext);
}

export { FunnelRuntimeContext };
