import React, { useCallback, useRef, useMemo, memo, useEffect } from 'react';
import { FunnelRuntimeProvider, FunnelFormData, FunnelSelections, useFunnelRuntime } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { FunnelProvider } from '@/funnel-builder-v3/context/FunnelContext';
import { BlockRenderer } from '@/funnel-builder-v3/editor/blocks/BlockRenderer';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useUnifiedLeadSubmit, createUnifiedPayload, extractIdentityFromAnswers } from '@/flow-canvas/shared/hooks/useUnifiedLeadSubmit';
import { recordEvent } from '@/lib/events/recordEvent';

interface FunnelV3RendererProps {
  document: {
    version: number;
    pages: Array<{
      id: string;
      name: string;
      type: string;
      slug: string;
      order_index: number;
      blocks: any[];
      settings: any;
    }>;
    settings: any;
    name: string;
    countryCodes?: any[];
    defaultCountryId?: string;
  };
  settings: any;
  funnelId: string;
  teamId: string;
}

// Convert runtime document format to Funnel type
function convertDocumentToFunnel(document: FunnelV3RendererProps['document']): Funnel {
  return {
    id: '', // Not needed for runtime
    name: document.name,
    steps: document.pages.map((page) => ({
      id: page.id,
      name: page.name,
      type: page.type as any,
      slug: page.slug,
      blocks: page.blocks,
      settings: page.settings || {},
    })),
    settings: document.settings || {},
    countryCodes: document.countryCodes || [],
    defaultCountryId: document.defaultCountryId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Helper function to extract identity from form fields based on field type and label
function extractIdentityFromFormData(
  formData: FunnelFormData,
  blocks: any[]
): { name?: string; email?: string; phone?: string } {
  const identity: { name?: string; email?: string; phone?: string } = {};
  
  // Find form blocks and extract identity from their fields
  for (const block of blocks) {
    if (block.type === 'form' && block.content?.fields) {
      for (const field of block.content.fields) {
        const value = formData[field.id];
        if (typeof value !== 'string' || !value.trim()) continue;
        
        const fieldType = field.type?.toLowerCase() || '';
        const fieldLabel = (field.label || '').toLowerCase();
        
        if (fieldType === 'email' || fieldLabel.includes('email')) {
          identity.email = value;
        } else if (fieldType === 'phone' || fieldLabel.includes('phone')) {
          identity.phone = value;
        } else if (fieldType === 'text' && (fieldLabel.includes('name') || fieldLabel.includes('full name'))) {
          identity.name = value;
        }
      }
    }
  }
  
  return identity;
}

// Inner component that uses runtime context - memoized to prevent unnecessary re-renders
const FunnelV3Content = memo(function FunnelV3Content({ funnel }: { funnel: Funnel }) {
  const runtime = useFunnelRuntime();
  const currentStep = runtime.getCurrentStep();

  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No steps available</p>
      </div>
    );
  }

  // Get step background color
  const stepBgColor = currentStep.settings?.backgroundColor;

  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: stepBgColor || undefined }}
    >
      <ScrollArea className="h-screen">
        <div 
          className="min-h-screen py-8 px-4 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
          style={{ backgroundColor: stepBgColor || undefined }}
        >
          {currentStep.blocks.map((block) => (
            <div key={block.id} className="mb-4">
              <BlockRenderer block={block} stepId={currentStep.id} isPreview={true} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});


export function FunnelV3Renderer({ document, settings, funnelId, teamId }: FunnelV3RendererProps) {
  // Convert document to Funnel format - memoized to prevent recalculation on every render
  const funnel = useMemo(() => {
    return convertDocumentToFunnel(document);
  }, [document]);

  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Use unified lead submission hook
  const { submit, saveDraft, leadId } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    onLeadSaved: (id, mode) => {
      // Invalidate Performance tab query to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['funnel-leads', teamId] });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('[FunnelV3Renderer] Submission error callback:', error);
      }
      toast.error('Failed to submit form');
    },
  });

  // Handle form submission using unified pipeline
  // We'll use a ref to track current step ID since we can't access runtime here
  const currentStepIdRef = useRef<string | undefined>(funnel.steps[0]?.id);
  // Track last submit step to prevent duplicate draft saves
  const lastSubmitStepRef = useRef<string | null>(null);
  
  // Sync ref with initial step ID
  useEffect(() => {
    if (funnel.steps[0]?.id) {
      currentStepIdRef.current = funnel.steps[0].id;
    }
  }, [funnel.steps]);
  
  // Track initial funnel view (create visitor entry)
  const hasTrackedViewRef = useRef(false);
  
  useEffect(() => {
    // Only track once per session, and only if we have valid IDs
    if (hasTrackedViewRef.current || !funnelId || !teamId) return;
    hasTrackedViewRef.current = true;
    
    // Create initial visitor entry (fire-and-forget)
    const initialStepId = funnel.steps[0]?.id;
    if (!initialStepId) return;
    
    const payload = createUnifiedPayload({}, {
      funnelId,
      teamId,
      stepId: initialStepId,
      stepIntent: 'navigate', // Just viewing, not submitting
      lastStepIndex: 0,
    });
    
    // Use submit() instead of saveDraft() to ensure immediate tracking without debounce
    // Note: submit() uses submitMode: 'submit' which may trigger automations, but automations
    // typically require contact info to be useful, so this should be safe for initial visitor tracking
    
    // Track initial step view event
    const sessionId = getOrCreateSessionId();
    recordEvent({
      funnel_id: funnelId,
      step_id: initialStepId,
      event_type: 'step_viewed',
      session_id: sessionId,
      dedupe_key: `step_viewed:${funnelId}:${initialStepId}:${sessionId}`,
      payload: {
        stepIndex: 0,
        stepName: funnel.steps[0]?.name,
      },
    }).catch((error) => {
      // Always log errors (not just in DEV) for production debugging
      console.error('[FunnelV3Renderer] Failed to record step_viewed event:', {
        error,
        funnelId,
        teamId,
        stepId: initialStepId,
        sessionId: getOrCreateSessionId(),
      });
    });
    
    // Create funnel_leads entry immediately (no debounce)
    submit(payload).catch((error) => {
      // Always log errors (not just in DEV) for production debugging
      console.error('[FunnelV3Renderer] Failed to track initial view:', {
        error,
        funnelId,
        teamId,
        stepId: initialStepId,
      });
    });
  }, [funnelId, teamId, funnel.steps, submit]);
  
  // Helper to get or create session ID
  const getOrCreateSessionId = useCallback(() => {
    const storageKey = `funnel_session_${funnelId}`;
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  }, [funnelId]);
  
  const handleFormSubmit = useCallback(async (
    data: FunnelFormData, 
    selections: FunnelSelections,
    consent?: { agreed: boolean; privacyPolicyUrl?: string }
  ) => {
    try {
      // Build answers object from form data and selections
      const answers: Record<string, any> = { ...data, ...selections };
      
      // Use ref value, but validate it exists
      const currentStepId = currentStepIdRef.current || funnel.steps[0]?.id;
      if (!currentStepId) {
        return;
      }
      
      // Extract identity from form fields (check current step first, then all steps)
      const currentStep = funnel.steps.find(s => s.id === currentStepId);
      let identityFromFields: { name?: string; email?: string; phone?: string } = {};
      
      if (currentStep) {
        identityFromFields = extractIdentityFromFormData(data, currentStep.blocks || []);
      }
      
      // Fallback: check all steps if not found in current step
      if (!identityFromFields.name && !identityFromFields.email && !identityFromFields.phone) {
        for (const step of funnel.steps) {
          const extracted = extractIdentityFromFormData(data, step.blocks || []);
          if (extracted.name) identityFromFields.name = extracted.name;
          if (extracted.email) identityFromFields.email = extracted.email;
          if (extracted.phone) identityFromFields.phone = extracted.phone;
        }
      }
      
      // Also use extractIdentityFromAnswers as fallback
      const { identity: identityFromAnswers } = extractIdentityFromAnswers(answers);
      
      // Merge identity sources (form fields take precedence)
      const identity = {
        name: identityFromFields.name || identityFromAnswers.name,
        email: identityFromFields.email || identityFromAnswers.email,
        phone: identityFromFields.phone || identityFromAnswers.phone,
      };
      
      // Determine step intent based on position
      const stepIndex = funnel.steps.findIndex(s => s.id === currentStepId);
      const isLastStep = stepIndex === funnel.steps.length - 1;
      const stepIntent: 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' | 'navigate' | 'info' = 
        isLastStep ? 'convert' : 'capture';
      
      // Create unified payload
      const payload = createUnifiedPayload(answers, {
        funnelId,
        teamId,
        stepId: currentStepId,
        stepIntent,
        lastStepIndex: stepIndex,
      }, {
        consent: consent ? {
          agreed: consent.agreed,
          privacyPolicyUrl: consent.privacyPolicyUrl,
          timestamp: new Date().toISOString(),
        } : undefined,
      });
      
      // Override identity if we extracted it from form fields
      if (identity.name || identity.email || identity.phone) {
        payload.identity = identity;
      }
      
      // Submit through unified pipeline
      const result = await submit(payload);
      
      // Track this step as just submitted
      if (!result.error) {
        lastSubmitStepRef.current = currentStepId;
      } else {
        // Always log errors (not just in DEV) for production debugging
        console.error('[FunnelV3Renderer] Submission failed', {
          error: result.error,
          funnelId,
          teamId,
          stepId: currentStepId,
          stepIntent,
          hasIdentity: !!(identity.name || identity.email || identity.phone),
        });
        toast.error('Failed to submit form');
      }
      
      // Only show success toast on final conversion step, not on intermediate steps or drafts
      if (!result.error && stepIntent === 'convert') {
        toast.success('Form submitted successfully!');
      }
    } catch (error) {
      // Always log errors (not just in DEV) for production debugging
      console.error('[FunnelV3Renderer] Submission exception:', {
        error,
        funnelId,
        teamId,
        stepId: currentStepIdRef.current,
      });
      toast.error('Failed to submit form');
    }
  }, [funnelId, teamId, submit, funnel.steps]);
  
  // Track step changes and auto-save draft for drop-off tracking
  // Make this truly fire-and-forget (no await) to prevent blocking navigation
  const handleStepChange = useCallback((
    stepId: string,
    formData: FunnelFormData,
    selections: FunnelSelections
  ) => {
    const previousStepId = currentStepIdRef.current;
    // Update ref immediately to keep it in sync
    currentStepIdRef.current = stepId;
    
    // Defer ALL heavy work to next microtask to prevent blocking navigation
    // This ensures the UI updates instantly while background work happens after
    queueMicrotask(() => {
      // Calculate step index for tracking
      const stepIndex = funnel.steps.findIndex(s => s.id === stepId);
      const currentStep = funnel.steps.find(s => s.id === stepId);
      
      // Track step view event (always track, even if no data)
      const sessionId = getOrCreateSessionId();
      recordEvent({
        funnel_id: funnelId,
        step_id: stepId,
        event_type: 'step_viewed',
        session_id: sessionId,
        dedupe_key: `step_viewed:${funnelId}:${stepId}:${sessionId}:${Date.now()}`,
        payload: {
          stepIndex,
          stepName: currentStep?.name,
          previousStepId,
        },
      }).catch((error) => {
        // Always log errors (not just in DEV) for production debugging
        console.error('[FunnelV3Renderer] Failed to record step_viewed event:', {
          error,
          funnelId,
          teamId,
          stepId,
          sessionId: getOrCreateSessionId(),
        });
      });
      
      // Skip draft save if navigating away from just-submitted step
      if (lastSubmitStepRef.current === previousStepId) {
        lastSubmitStepRef.current = null;
        return; // Skip draft save, data was just submitted
      }
      
      // Always update last_step_index, even if no form data
      // This ensures drop-off tracking works for pure visitors
      const hasData = Object.keys(formData).length > 0 || Object.keys(selections).length > 0;
      if (!hasData) {
        // Even without form data, update last_step_index for drop-off tracking
        const emptyPayload = createUnifiedPayload({}, {
          funnelId,
          teamId,
          stepId,
          stepIntent: 'navigate',
          lastStepIndex: stepIndex,
        });
        
        // Update lead with new step index (fire-and-forget)
        saveDraft(emptyPayload).catch((error) => {
          if (import.meta.env.DEV) {
            console.error('[FunnelV3Renderer] Failed to update step index:', error);
          }
        });
        return;
      }
      
      // Fire-and-forget: build payload and save draft
      (async () => {
        try {
          // Build answers from current state
          const answers: Record<string, any> = { ...formData, ...selections };
          
          // Extract identity from form fields
          let identityFromFields: { name?: string; email?: string; phone?: string } = {};
          
          if (currentStep) {
            identityFromFields = extractIdentityFromFormData(formData, currentStep.blocks || []);
          }
          
          // Fallback: check all steps if not found in current step
          if (!identityFromFields.name && !identityFromFields.email && !identityFromFields.phone) {
            for (const step of funnel.steps) {
              const extracted = extractIdentityFromFormData(formData, step.blocks || []);
              if (extracted.name) identityFromFields.name = extracted.name;
              if (extracted.email) identityFromFields.email = extracted.email;
              if (extracted.phone) identityFromFields.phone = extracted.phone;
            }
          }
          
          // Also use extractIdentityFromAnswers as fallback
          const { identity: identityFromAnswers } = extractIdentityFromAnswers(answers);
          
          // Merge identity sources (form fields take precedence)
          const identity = {
            name: identityFromFields.name || identityFromAnswers.name,
            email: identityFromFields.email || identityFromAnswers.email,
            phone: identityFromFields.phone || identityFromAnswers.phone,
          };
          
          // Determine step intent based on position
          const isLastStep = stepIndex === funnel.steps.length - 1;
          const stepIntent: 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' | 'navigate' | 'info' = 
            isLastStep ? 'convert' : 'capture';
          
          // Create unified payload
          const payload = createUnifiedPayload(answers, {
            funnelId,
            teamId,
            stepId,
            stepIntent,
            lastStepIndex: stepIndex,
          });
          
          // Override identity if we extracted it from form fields
          if (identity.name || identity.email || identity.phone) {
            payload.identity = identity;
          }
          
          await saveDraft(payload);
        } catch (error) {
          // Don't block navigation if draft save fails, but always log errors
          console.error('[FunnelV3Renderer] Draft save error:', {
            error,
            funnelId,
            teamId,
            stepId,
            stepIndex,
            hasIdentity: !!(identity.name || identity.email || identity.phone),
          });
        }
      })();
    });
  }, [funnelId, teamId, saveDraft, funnel.steps, getOrCreateSessionId]);


  return (
    <FunnelRuntimeProvider 
      funnel={funnel}
      onFormSubmit={handleFormSubmit}
      onStepChange={handleStepChange}
    >
      <FunnelProvider initialFunnel={funnel}>
        <FunnelV3Content funnel={funnel} />
      </FunnelProvider>
    </FunnelRuntimeProvider>
  );
}
