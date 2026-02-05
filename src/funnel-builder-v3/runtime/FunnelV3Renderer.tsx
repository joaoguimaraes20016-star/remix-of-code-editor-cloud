import React, { useCallback, useRef, useMemo, memo, useEffect } from 'react';
import { FunnelRuntimeProvider, FunnelFormData, FunnelSelections, useFunnelRuntime } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { FunnelProvider } from '@/funnel-builder-v3/context/FunnelContext';
import { BlockRenderer } from '@/funnel-builder-v3/editor/blocks/BlockRenderer';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUnifiedLeadSubmit, createUnifiedPayload, extractIdentityFromAnswers } from '@/flow-canvas/shared/hooks/useUnifiedLeadSubmit';
import { recordEvent } from '@/lib/events/recordEvent';
import { supabase } from '@/integrations/supabase/client';

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

// Memoized step component - only re-renders when isActive changes
// This prevents cascade re-renders of all steps when only one step's visibility changes
const MemoizedStep = memo(function MemoizedStep({ 
  step, 
  isActive 
}: { 
  step: FunnelStep; 
  isActive: boolean;
}) {
  const stepBgColor = step.settings?.backgroundColor;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when step becomes active
  useEffect(() => {
    if (isActive && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        "min-h-screen w-full",
        isActive
          ? "relative opacity-100 pointer-events-auto z-10"
          : "absolute inset-0 opacity-0 pointer-events-none z-0"
      )}
      style={{ backgroundColor: stepBgColor || undefined, touchAction: 'manipulation' }}
    >
      {/* Native overflow-y-auto is GPU-accelerated and zero-overhead vs Radix ScrollArea */}
      <div 
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto"
      >
        <div 
          className="min-h-screen py-8 px-4 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
          style={{ backgroundColor: stepBgColor || undefined }}
        >
          {step.blocks.map((block) => (
            <div key={block.id} className="mb-4">
              <BlockRenderer block={block} stepId={step.id} isPreview={true} isStepActive={isActive} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Wrapper component that uses runtime context - extracts only currentStepId
// This prevents FunnelV3Content from re-rendering on every context update
function FunnelV3ContentWrapper({ funnel }: { funnel: Funnel }) {
  const runtime = useFunnelRuntime();
  return <FunnelV3Content funnel={funnel} currentStepId={runtime.currentStepId} />;
}

// Memoized content component - Pre-renders ALL steps for instant transitions
// CRITICAL FIX: Now properly memoized - only re-renders when currentStepId changes
// Previous issue: useFunnelRuntime() inside memo caused re-renders on every context update
const FunnelV3Content = memo(function FunnelV3Content({ 
  funnel, 
  currentStepId 
}: { 
  funnel: Funnel; 
  currentStepId: string;
}) {
  if (!funnel.steps || funnel.steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No steps available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      {funnel.steps.map((step) => (
        <MemoizedStep 
          key={step.id} 
          step={step} 
          isActive={step.id === currentStepId}
        />
      ))}
    </div>
  );
});


export function FunnelV3Renderer({ document, settings, funnelId, teamId }: FunnelV3RendererProps) {
  // Convert document to Funnel format - memoized to prevent recalculation on every render
  const funnel = useMemo(() => {
    return convertDocumentToFunnel(document);
  }, [document]);

  // Use unified lead submission hook
  // Note: Only submit() is used - saveDraft() removed for local-first architecture
  // Final submission happens on last step or via beforeunload
  const { submit } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
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
  // Track if final submission has happened (to prevent duplicate beforeunload submission)
  const hasSubmittedFinalRef = useRef(false);
  // Track accumulated data for beforeunload submission
  const accumulatedFormDataRef = useRef<FunnelFormData>({});
  const accumulatedSelectionsRef = useRef<FunnelSelections>({});
  
  // Sync ref with initial step ID
  useEffect(() => {
    if (funnel.steps[0]?.id) {
      currentStepIdRef.current = funnel.steps[0].id;
    }
  }, [funnel.steps]);
  
  // Warmup Edge Functions on funnel load to prevent cold start delay on first button click
  useEffect(() => {
    if (!funnelId || !teamId) return;
    
    // Fire-and-forget warmup call to pre-initialize Edge Functions
    // This prevents the 2-4 second cold start penalty on first button click
    supabase.functions.invoke('submit-funnel-lead', {
      body: { warmup: true, funnel_id: funnelId, team_id: teamId },
    }).catch(() => {
      // Silently ignore warmup errors - this is just optimization
    });
  }, [funnelId, teamId]);
  
  // BEFOREUNLOAD HANDLER: Submit accumulated data when user leaves (drop-off tracking)
  // Uses navigator.sendBeacon() for reliable submission even during page unload
  useEffect(() => {
    if (!funnelId || !teamId) return;
    
    const handleBeforeUnload = () => {
      // Skip if we've already submitted final data
      if (hasSubmittedFinalRef.current) {
        return;
      }
      
      // Skip if no data has been accumulated
      const hasFormData = Object.keys(accumulatedFormDataRef.current).length > 0;
      const hasSelections = Object.keys(accumulatedSelectionsRef.current).length > 0;
      if (!hasFormData && !hasSelections) {
        return;
      }
      
      // Build payload for drop-off submission
      const answers = { ...accumulatedFormDataRef.current, ...accumulatedSelectionsRef.current };
      const stepIndex = funnel.steps.findIndex(s => s.id === currentStepIdRef.current);
      
      // Extract identity from accumulated data
      const { identity } = extractIdentityFromAnswers(answers);
      
      const payload = {
        funnel_id: funnelId,
        funnelId: funnelId,
        team_id: teamId,
        teamId: teamId,
        answers,
        name: identity.name,
        email: identity.email,
        phone: identity.phone,
        submitMode: 'draft',
        step_id: currentStepIdRef.current,
        step_intent: 'navigate',
        last_step_index: stepIndex >= 0 ? stepIndex : 0,
      };
      
      // Use sendBeacon for reliable submission during page unload
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqfyevdblvgxaycdvfxe.supabase.co';
      const url = `${supabaseUrl}/functions/v1/submit-funnel-lead`;
      
      try {
        navigator.sendBeacon(url, JSON.stringify(payload));
        if (import.meta.env.DEV) {
          console.log('[FunnelV3Renderer] beforeunload - sent drop-off data via sendBeacon', {
            stepIndex,
            hasFormData,
            hasSelections,
          });
        }
      } catch (error) {
        // Silent fail - best effort
        if (import.meta.env.DEV) {
          console.error('[FunnelV3Renderer] beforeunload sendBeacon failed:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [funnelId, teamId, funnel.steps]);
  
  // Helper to get or create session ID
  // CRITICAL: Must be defined BEFORE useEffect that uses it (fixes build error)
  const getOrCreateSessionId = useCallback(() => {
    const storageKey = `funnel_session_${funnelId}`;
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  }, [funnelId]);
  
  // Track initial funnel view (create visitor entry)
  const hasTrackedViewRef = useRef(false);
  
  useEffect(() => {
    // Only track once per session, and only if we have valid IDs
    if (hasTrackedViewRef.current || !funnelId || !teamId) return;
    hasTrackedViewRef.current = true;
    
    // Track initial step view (fire-and-forget)
    const initialStepId = funnel.steps[0]?.id;
    if (!initialStepId) return;
    
    // Track initial step view event via recordEvent only
    // NOTE: We intentionally do NOT call submit() here anymore.
    // Calling submit() on page load held a "submit lock" (pendingSubmitRef) that blocked
    // the user's first button click for 2-3 seconds while the Edge Function processed.
    // The first actual button click will create the funnel_leads entry with real data.
    // recordEvent() is sufficient for initial step view analytics.
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
      // Log errors (dev only - verbose logging blocks main thread in production)
      if (import.meta.env.DEV) {
        console.error('[FunnelV3Renderer] Failed to record step_viewed event:', {
          error,
          funnelId,
          teamId,
          stepId: initialStepId,
          sessionId: getOrCreateSessionId(),
        });
      }
    });
  }, [funnelId, teamId, funnel.steps, getOrCreateSessionId]);
  
  const handleFormSubmit = useCallback(async (
    data: FunnelFormData, 
    selections: FunnelSelections,
    consent?: { agreed: boolean; privacyPolicyUrl?: string }
  ) => {
    // LOCAL-FIRST ARCHITECTURE: Navigation happens instantly, data accumulates locally.
    // We only submit to the server on the FINAL step (or when user leaves via beforeunload).
    // This eliminates all API-related delays during intermediate step navigation.
    
    // Accumulate data in refs for beforeunload handler
    accumulatedFormDataRef.current = { ...accumulatedFormDataRef.current, ...data };
    accumulatedSelectionsRef.current = { ...accumulatedSelectionsRef.current, ...selections };
    
    // Use ref value, but validate it exists
    const currentStepId = currentStepIdRef.current || funnel.steps[0]?.id;
    if (!currentStepId) {
      return;
    }
    
    // Determine if this is the final step
    const stepIndex = funnel.steps.findIndex(s => s.id === currentStepId);
    const isLastStep = stepIndex === funnel.steps.length - 1;
    
    // Track that we've "submitted" from this step (for handleStepChange to know)
    lastSubmitStepRef.current = currentStepId;
    
    // On intermediate steps: data is already accumulated in FunnelRuntimeContext
    // Just return immediately - no API calls, no delays
    if (!isLastStep) {
      return;
    }
    
    // Mark that we've submitted final data (prevent duplicate beforeunload submission)
    hasSubmittedFinalRef.current = true;
    
    // FINAL STEP: Submit all accumulated data to the server
    if (import.meta.env.DEV) {
      console.log('[FunnelV3Renderer] Final step - submitting all accumulated data', {
        stepId: currentStepId,
        stepIndex,
      });
    }
    
    try {
      // Build answers object from form data and selections
      const answers: Record<string, any> = { ...data, ...selections };
      
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
      
      // Create unified payload for final submission
      const payload = createUnifiedPayload(answers, {
        funnelId,
        teamId,
        stepId: currentStepId,
        stepIntent: 'convert',
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
      
      // Submit through unified pipeline (fire-and-forget for instant UX)
      submit(payload).then((result) => {
        if (result.error) {
          if (import.meta.env.DEV) {
            console.error('[FunnelV3Renderer] Final submission failed', {
              error: result.error,
              funnelId,
              teamId,
              stepId: currentStepId,
            });
          }
          toast.error('Failed to submit form');
        } else {
          toast.success('Form submitted successfully!');
        }
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('[FunnelV3Renderer] Final submission exception:', error);
        }
        toast.error('Failed to submit form');
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[FunnelV3Renderer] Submission exception:', {
          error,
          funnelId,
          teamId,
          stepId: currentStepIdRef.current,
        });
      }
      toast.error('Failed to submit form');
    }
  }, [funnelId, teamId, submit, funnel.steps]);
  
  // Track step changes - LOCAL-FIRST: Only fire lightweight recordEvent() for analytics
  // No API calls to saveDraft() - data is accumulated locally and submitted on final step or beforeunload
  const handleStepChange = useCallback((
    stepId: string,
    formData: FunnelFormData,
    selections: FunnelSelections
  ) => {
    const previousStepId = currentStepIdRef.current;
    // Update ref immediately to keep it in sync
    currentStepIdRef.current = stepId;
    
    // Clear the submit flag if navigating away from submitted step
    if (lastSubmitStepRef.current === previousStepId) {
      lastSubmitStepRef.current = null;
    }
    
    if (import.meta.env.DEV) {
      console.log('[FunnelV3Renderer] Step change - local navigation only, no API call', {
        from: previousStepId,
        to: stepId,
      });
    }
    
    // CRITICAL FIX: Defer recordEvent() to next animation frame
    // This ensures navigation completes FIRST, then analytics fire after React finishes rendering
    // Without this, the synchronous call to recordEvent() blocks the main thread
    requestAnimationFrame(() => {
      const stepIndex = funnel.steps.findIndex(s => s.id === stepId);
      const currentStep = funnel.steps.find(s => s.id === stepId);
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
        // Silent fail - analytics are best-effort
        if (import.meta.env.DEV) {
          console.error('[FunnelV3Renderer] Failed to record step_viewed event:', error);
        }
      });
    });
  }, [funnelId, funnel.steps, getOrCreateSessionId]);


  return (
    <FunnelRuntimeProvider 
      funnel={funnel}
      onFormSubmit={handleFormSubmit}
      onStepChange={handleStepChange}
    >
      <FunnelProvider initialFunnel={funnel}>
        <FunnelV3ContentWrapper funnel={funnel} />
      </FunnelProvider>
    </FunnelRuntimeProvider>
  );
}
