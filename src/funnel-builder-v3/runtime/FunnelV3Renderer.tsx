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
  console.log('[FunnelV3Content] Component rendering', {
    funnelStepsCount: funnel.steps.length,
  });
  
  const runtime = useFunnelRuntime();
  console.log('[FunnelV3Content] Runtime context accessed', {
    hasRuntime: !!runtime,
    currentStepId: runtime?.currentStepId,
    totalSteps: runtime?.totalSteps,
  });
  
  const currentStep = runtime.getCurrentStep();
  console.log('[FunnelV3Content] Current step retrieved', {
    stepId: currentStep?.id,
    stepName: currentStep?.name,
    blocksCount: currentStep?.blocks?.length || 0,
  });

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
  console.log('[FunnelV3Renderer] Component initialized', {
    funnelId,
    teamId,
    documentVersion: document.version,
    pagesCount: document.pages?.length || 0,
  });
  
  // Convert document to Funnel format - memoized to prevent recalculation on every render
  const funnel = useMemo(() => {
    const converted = convertDocumentToFunnel(document);
    console.log('[FunnelV3Renderer] Funnel converted', {
      stepsCount: converted.steps.length,
      firstStepId: converted.steps[0]?.id,
    });
    return converted;
  }, [document]);

  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Use unified lead submission hook
  console.log('[FunnelV3Renderer] Initializing useUnifiedLeadSubmit', {
    funnelId,
    teamId,
    isValid: !!(funnelId && teamId),
  });
  
  const { submit, saveDraft, leadId } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    onLeadSaved: (id, mode) => {
      console.log(`[FunnelV3Renderer] Lead saved callback: ${id}, mode: ${mode}`);
      // Invalidate Performance tab query to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['funnel-leads', teamId] });
      console.log('[FunnelV3Renderer] Invalidated funnel-leads query cache');
    },
    onError: (error) => {
      console.error('[FunnelV3Renderer] Submission error callback:', error);
      toast.error('Failed to submit form');
    },
  });
  
  console.log('[FunnelV3Renderer] useUnifiedLeadSubmit initialized', {
    hasSubmit: !!submit,
    hasSaveDraft: !!saveDraft,
    currentLeadId: leadId,
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
    console.log('[FunnelV3Renderer] Tracking initial visitor view', {
      funnelId,
      teamId,
      stepId: initialStepId,
    });
    
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
      console.error('[FunnelV3Renderer] Failed to record step_viewed event:', error);
    });
    
    // Create funnel_leads entry immediately (no debounce)
    submit(payload).catch((error) => {
      console.error('[FunnelV3Renderer] Failed to track initial view:', error);
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
      console.log('[FunnelV3Renderer] ====== FORM SUBMISSION STARTED ======', {
        funnelId,
        teamId,
        hasData: Object.keys(data).length > 0,
        hasSelections: Object.keys(selections).length > 0,
        hasConsent: !!consent,
      });
      
      // Build answers object from form data and selections
      const answers: Record<string, any> = { ...data, ...selections };
      
      // Use ref value, but validate it exists
      const currentStepId = currentStepIdRef.current || funnel.steps[0]?.id;
      if (!currentStepId) {
        console.error('[FunnelV3Renderer] No current step ID available for form submission', {
          refValue: currentStepIdRef.current,
          firstStepId: funnel.steps[0]?.id,
        });
        return;
      }
      
      console.log('[FunnelV3Renderer] Current step ID resolved', {
        currentStepId,
        stepIndex: funnel.steps.findIndex(s => s.id === currentStepId),
        totalSteps: funnel.steps.length,
      });
      
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
        lastStepIndex: stepIndex, // Add step index for proper step tracking
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
      console.log('[FunnelV3Renderer] Calling submit() with payload', {
        funnelId: payload.source.funnelId,
        teamId: payload.source.teamId,
        stepId: payload.source.stepId,
        stepIntent: payload.source.stepIntent,
        hasIdentity: !!(payload.identity?.name || payload.identity?.email || payload.identity?.phone),
        answersCount: Object.keys(payload.answers).length,
      });
      
      const result = await submit(payload);
      
      console.log('[FunnelV3Renderer] Submit result received', {
        success: !result.error,
        leadId: result.leadId,
        error: result.error,
        stepIntent,
      });
      
      // Track this step as just submitted
      if (!result.error) {
        lastSubmitStepRef.current = currentStepId;
        console.log('[FunnelV3Renderer] Lead created/updated successfully', {
          leadId: result.leadId,
          stepId: currentStepId,
        });
      } else {
        console.error('[FunnelV3Renderer] Submission failed', {
          error: result.error,
          funnelId,
          teamId,
          stepId: currentStepId,
        });
      }
      
      // Only show success toast on final conversion step, not on intermediate steps or drafts
      if (!result.error && stepIntent === 'convert') {
        toast.success('Form submitted successfully!');
      }
    } catch (error) {
      console.error('[FunnelV3Renderer] Submission exception:', error);
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
      console.error('[FunnelV3Renderer] Failed to record step_viewed event:', error);
    });
    
    // Skip draft save if navigating away from just-submitted step
    if (lastSubmitStepRef.current === previousStepId) {
      lastSubmitStepRef.current = null;
      console.log('[FunnelV3Renderer] Skipping draft save - step was just submitted', {
        previousStepId,
        newStepId: stepId,
      });
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
        console.error('[FunnelV3Renderer] Failed to update step index:', error);
      });
      
      console.log('[FunnelV3Renderer] Updated step index without form data', {
        stepId,
        stepIndex,
      });
      return;
    }
    
    // Fire-and-forget: don't await, let it run in background
    (async () => {
      try {
      // Build answers from current state
      const answers: Record<string, any> = { ...formData, ...selections };
      
      // Extract identity from form fields
      const currentStep = funnel.steps.find(s => s.id === stepId);
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
      
      // Determine step intent based on position (stepIndex already calculated above)
      const isLastStep = stepIndex === funnel.steps.length - 1;
      const stepIntent: 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' | 'navigate' | 'info' = 
        isLastStep ? 'convert' : 'capture';
      
      // Create unified payload
      const payload = createUnifiedPayload(answers, {
        funnelId,
        teamId,
        stepId,
        stepIntent,
        lastStepIndex: stepIndex, // Add step index for proper step tracking
      });
      
      // Override identity if we extracted it from form fields
      if (identity.name || identity.email || identity.phone) {
        payload.identity = identity;
      }
      
        // Save as draft (no automations triggered, for drop-off tracking)
        console.log('[FunnelV3Renderer] Auto-saving draft on step change', {
          stepId,
          funnelId,
          teamId,
          hasData: true,
        });
        
        await saveDraft(payload);
        
        console.log('[FunnelV3Renderer] Draft save completed', {
          stepId,
        });
      } catch (error) {
        // Don't block navigation if draft save fails
        console.error('[FunnelV3Renderer] Draft save error:', error, {
          stepId,
          funnelId,
          teamId,
        });
      }
    })();
  }, [funnelId, teamId, saveDraft, funnel.steps, getOrCreateSessionId]);

  console.log('[FunnelV3Renderer] Rendering providers and content', {
    funnelStepsCount: funnel.steps.length,
  });

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
