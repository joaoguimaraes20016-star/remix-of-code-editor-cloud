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

// Helper to extract identity by matching form data keys to field types in blocks
function extractIdentityFromFormBlocks(
  formData: Record<string, any>,
  steps: FunnelStep[]
): { name?: string; email?: string; phone?: string } {
  const identity: { name?: string; email?: string; phone?: string } = {};
  
  // Build a map of field ID -> field type by scanning all form blocks
  const fieldTypeMap: Record<string, string> = {};
  
  for (const step of steps) {
    for (const block of step.blocks || []) {
      if (block.type === 'form' && (block.content as any)?.fields) {
        for (const field of (block.content as any).fields) {
          if (field.id && field.type) {
            fieldTypeMap[field.id] = field.type;
          }
        }
      }
      // Also check EmailCaptureBlock and PhoneCaptureBlock
      if (block.type === 'email-capture') {
        // EmailCaptureBlock stores with key 'email'
        fieldTypeMap['email'] = 'email';
      }
      if (block.type === 'phone-capture') {
        // PhoneCaptureBlock stores with key 'phone'
        fieldTypeMap['phone'] = 'phone';
      }
    }
  }
  
  // Now match form data keys to field types
  for (const [fieldId, value] of Object.entries(formData)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    
    const fieldType = fieldTypeMap[fieldId];
    if (!fieldType) continue;
    
    if (fieldType === 'email' && !identity.email) {
      identity.email = value;
    } else if (fieldType === 'phone' && !identity.phone) {
      identity.phone = value;
    } else if (fieldType === 'text') {
      // For text fields, check if it looks like a name (no @ or numbers)
      const looksLikeName = !value.includes('@') && !/^\d+$/.test(value);
      if (looksLikeName && !identity.name) {
        identity.name = value;
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

  // Stable error handler - prevents useUnifiedLeadSubmit from recreating
  // doSubmit/submit on every render, which would cascade to handleFormSubmit
  // → onFormSubmit → submitForm → context value → all consumer re-renders
  const handleSubmitError = useCallback((error: any) => {
    if (import.meta.env.DEV) {
      console.error('[FunnelV3Renderer] Submission error callback:', error);
    }
    toast.error('Failed to submit form');
  }, []);

  // Use unified lead submission hook
  // Note: submit() is called on every step transition for real-time data capture
  // This ensures leads appear in analytics immediately and data isn't lost on abandonment
  const { submit } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    onError: handleSubmitError,
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
  
  // beforeunload handler removed: submit-as-you-go architecture means data is
  // already submitted on every step transition, so no need for last-ditch unload saves.
  
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
    // SUBMIT-AS-YOU-GO: Submit data on every step transition for real-time analytics.
    // Navigation is never blocked - submit is fire-and-forget.
    // This matches industry standard (Perspective, ClickFunnels).
    
    console.log('[FunnelV3Renderer] handleFormSubmit called', {
      dataKeys: Object.keys(data),
      dataValues: data,
      selectionsKeys: Object.keys(selections),
      currentStepId: currentStepIdRef.current || funnel.steps[0]?.id,
    });
    
    // Get current step info
    const currentStepId = currentStepIdRef.current || funnel.steps[0]?.id;
    if (!currentStepId) return;
    
    const stepIndex = funnel.steps.findIndex(s => s.id === currentStepId);
    const isLastStep = stepIndex === funnel.steps.length - 1;
    
    // Merge with accumulated data for complete lead profile
    const allData = { ...accumulatedFormDataRef.current, ...data };
    const allSelections = { ...accumulatedSelectionsRef.current, ...selections };
    
    // Accumulate for next step
    accumulatedFormDataRef.current = allData;
    accumulatedSelectionsRef.current = allSelections;
    
    // Track that we've "submitted" from this step (for handleStepChange to know)
    lastSubmitStepRef.current = currentStepId;
    
    // Extract identity using TWO methods:
    // 1. Semantic keys (for EmailCaptureBlock, PhoneCaptureBlock, etc.)
    const { identity: identityFromKeys } = extractIdentityFromAnswers(allData);
    
    // 2. Field type matching (for FormBlock with numeric IDs)
    const identityFromBlocks = extractIdentityFromFormBlocks(allData, funnel.steps);
    
    // Merge both sources (field types take precedence for FormBlock data)
    const identity = {
      name: identityFromBlocks.name || identityFromKeys.name,
      email: identityFromBlocks.email || identityFromKeys.email,
      phone: identityFromBlocks.phone || identityFromKeys.phone,
    };
    
    console.log('[FunnelV3Renderer] Submitting step data', {
      stepIndex,
      isLastStep,
      hasIdentity: !!(identity.name || identity.email || identity.phone),
      identityFromKeys: !!(identityFromKeys.name || identityFromKeys.email || identityFromKeys.phone),
      identityFromBlocks: !!(identityFromBlocks.name || identityFromBlocks.email || identityFromBlocks.phone),
      identity,
    });
    
    // Build payload for this step
    const payload = createUnifiedPayload({ ...allData, ...allSelections }, {
      funnelId,
      teamId,
      stepId: currentStepId,
      stepIntent: isLastStep ? 'complete' : 'navigate',
      lastStepIndex: stepIndex >= 0 ? stepIndex : 0,
    }, {
      consent: consent ? {
        agreed: consent.agreed,
        privacyPolicyUrl: consent.privacyPolicyUrl,
        timestamp: new Date().toISOString(),
      } : undefined,
    });
    
    // Override identity from form fields if present
    if (identity.name || identity.email || identity.phone) {
      payload.identity = identity;
    }
    
    // Submit (fire-and-forget, does NOT block navigation)
    submit(payload).then((result) => {
      if (isLastStep) {
        if (result.error) {
          if (import.meta.env.DEV) {
            console.error('[FunnelV3Renderer] Final submission failed', { error: result.error });
          }
          toast.error('Failed to submit form');
        } else {
          toast.success('Form submitted successfully!');
        }
      }
    }).catch((error) => {
      if (import.meta.env.DEV) {
        console.error('[FunnelV3Renderer] Step submission failed:', error);
      }
      if (isLastStep) {
        toast.error('Failed to submit form');
      }
    });
    
    // Mark final submission to prevent duplicate
    if (isLastStep) {
      hasSubmittedFinalRef.current = true;
    }
  }, [funnelId, teamId, submit, funnel.steps]);
  
  // Track step changes - fire recordEvent() for analytics (page views, time on step, etc.)
  // Form data submissions happen via handleFormSubmit on every step transition
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
      <FunnelProvider initialFunnel={funnel} runtimeMode>
        <FunnelV3ContentWrapper funnel={funnel} />
      </FunnelProvider>
    </FunnelRuntimeProvider>
  );
}
