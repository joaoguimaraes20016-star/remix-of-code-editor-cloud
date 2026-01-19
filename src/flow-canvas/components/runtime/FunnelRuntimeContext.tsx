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
  /** Field-level validation errors */
  fieldErrors: Record<string, string>;
}

interface FunnelRuntimeActions {
  /** Update a form field value */
  updateField: (fieldKey: string, value: string) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Go to specific step */
  goToStep: (stepOrId: number | string) => void;
  /** Submit the form */
  submitForm: () => Promise<void>;
  /** Handle button click based on action type */
  handleButtonClick: (action: string, value?: string, openNewTab?: boolean) => void;
  /** Toggle consent checkbox */
  toggleConsent: () => void;
  /** Reset the form */
  reset: () => void;
  /** Validate a specific field */
  validateField: (fieldKey: string, value: string, rules?: { required?: boolean; type?: 'email' | 'phone' }) => string | null;
  /** Clear field error */
  clearFieldError: (fieldKey: string) => void;
}

interface PageInfo {
  id: string;
  type?: string;
}

interface FunnelRuntimeConfig {
  funnelId: string;
  teamId: string;
  funnelSlug: string;
  webhookUrls?: string[];
  redirectUrl?: string;
  /** Page info for multi-page navigation (id → index resolution) */
  pages?: PageInfo[];
  /** Required fields that must be filled before submission */
  requiredFields?: string[];
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((fieldKey: string, value: string, rules?: { required?: boolean; type?: 'email' | 'phone' }): string | null => {
    if (rules?.required && !value?.trim()) {
      return 'This field is required';
    }
    if (rules?.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email';
      }
    }
    if (rules?.type === 'phone' && value) {
      const phoneRegex = /^[\d\s\-+()]{7,}$/;
      if (!phoneRegex.test(value)) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  }, []);

  const clearFieldError = useCallback((fieldKey: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const updateField = useCallback((fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    setError(null);
    // Clear error when user starts typing
    clearFieldError(fieldKey);
  }, [clearFieldError]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((stepOrId: number | string) => {
    if (typeof stepOrId === 'number') {
      setCurrentStep(Math.max(0, Math.min(stepOrId, totalSteps - 1)));
    } else {
      // Resolve page ID to index
      const pages = config.pages || [];
      const index = pages.findIndex(p => p.id === stepOrId);
      if (index !== -1) {
        setCurrentStep(index);
      } else {
        // Try parsing as number
        const parsed = parseInt(stepOrId, 10);
        if (!isNaN(parsed)) {
          setCurrentStep(Math.max(0, Math.min(parsed, totalSteps - 1)));
        }
      }
    }
  }, [totalSteps, config.pages]);

  const toggleConsent = useCallback(() => {
    setHasConsent(prev => !prev);
  }, []);

  const submitForm = useCallback(async () => {
    // Phase 3: Pre-submission validation for required fields
    const requiredFields = config.requiredFields || [];
    const validationErrors: Record<string, string> = {};
    
    for (const field of requiredFields) {
      const value = formData[field] || '';
      if (!value.trim()) {
        validationErrors[field] = 'This field is required';
      }
    }
    
    // Also validate email format if email field is required
    if (formData.email || formData.Email) {
      const emailValue = formData.email || formData.Email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        validationErrors['email'] = 'Please enter a valid email';
      }
    }
    
    // Block submission if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...validationErrors }));
      setError('Please fill in all required fields');
      return;
    }
    
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

  const handleButtonClick = useCallback((action: string, value?: string, openNewTab?: boolean) => {
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
      case 'prev':
        prevStep();
        break;
      case 'link':
      case 'url':
        if (value) {
          if (openNewTab) {
            window.open(value, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = value;
          }
        }
        break;
      case 'goToStep':
      case 'go-to-step':
        // value can be page ID or step index
        if (value) {
          goToStep(value);
        }
        break;
      case 'phone':
        if (value) {
          window.location.href = `tel:${value.replace(/\D/g, '')}`;
        }
        break;
      case 'email':
        if (value) {
          window.location.href = `mailto:${value}`;
        }
        break;
      case 'scroll':
        if (value) {
          const target = document.getElementById(value) || document.querySelector(value);
          target?.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'download':
        if (value) {
          const link = document.createElement('a');
          link.href = value;
          link.download = '';
          link.click();
        }
        break;
      default:
        // Default to next/submit
        if (currentStep < totalSteps - 1) {
          nextStep();
        } else {
          submitForm();
        }
    }
  }, [currentStep, totalSteps, nextStep, prevStep, goToStep, submitForm]);

  const reset = useCallback(() => {
    setFormData({});
    setCurrentStep(0);
    setIsSubmitting(false);
    setError(null);
    setIsComplete(false);
    setHasConsent(false);
    setFieldErrors({});
  }, []);

  const state: FunnelRuntimeState = useMemo(() => ({
    formData,
    currentStep,
    totalSteps,
    isSubmitting,
    error,
    isComplete,
    hasConsent,
    fieldErrors,
  }), [formData, currentStep, totalSteps, isSubmitting, error, isComplete, hasConsent, fieldErrors]);

  const actions: FunnelRuntimeActions = useMemo(() => ({
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    handleButtonClick,
    toggleConsent,
    reset,
    validateField,
    clearFieldError,
  }), [updateField, nextStep, prevStep, goToStep, submitForm, handleButtonClick, toggleConsent, reset, validateField, clearFieldError]);

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
