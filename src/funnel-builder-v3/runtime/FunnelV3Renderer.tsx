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
        "min-h-screen w-full transition-opacity duration-300 ease-out",
        isActive
          ? "relative opacity-100 pointer-events-auto z-10"
          : "absolute inset-0 opacity-0 pointer-events-none z-0"
      )}
      style={{ backgroundColor: stepBgColor || undefined }}
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

// Inner component that uses runtime context - memoized to prevent unnecessary re-renders
// Pre-renders ALL steps for instant transitions (CSS toggle instead of React mount/unmount)
const FunnelV3Content = memo(function FunnelV3Content({ funnel }: { funnel: Funnel }) {
  const runtime = useFunnelRuntime();
  const currentStepId = runtime.currentStepId;

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
  // Note: No onLeadSaved callback - published funnels don't have Performance tab
  // Query invalidation removed to eliminate unnecessary re-renders
  const { submit, saveDraft, leadId } = useUnifiedLeadSubmit({
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
    const submitStartTime = performance.now();
    try {
      // IMMEDIATELY yield to let navigation happen first
      // This ensures button clicks feel instant while submission happens in background
      await new Promise<void>(resolve => queueMicrotask(() => resolve()));
      
      const yieldTime = performance.now() - submitStartTime;
      if (import.meta.env.DEV) {
        console.log(`[FunnelV3Renderer] handleFormSubmit yielded in ${yieldTime.toFixed(2)}ms`);
      }
      
      // Now do the heavy work (no longer blocking navigation)
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
      
      // Set flag BEFORE submit so handleStepChange sees it and skips redundant saveDraft
      // This prevents the race condition where handleStepChange runs before submit completes
      lastSubmitStepRef.current = currentStepId;
      
      // Submit through unified pipeline
      const result = await submit(payload);
      
      // Clear flag if submit failed so subsequent attempts work correctly
      if (result.error) {
        lastSubmitStepRef.current = null;
        // Log errors (dev only - verbose logging blocks main thread in production)
        if (import.meta.env.DEV) {
          console.error('[FunnelV3Renderer] Submission failed', {
            error: result.error,
            funnelId,
            teamId,
            stepId: currentStepId,
            stepIntent,
            hasIdentity: !!(identity.name || identity.email || identity.phone),
          });
        }
        toast.error('Failed to submit form');
      }
      
      // Only show success toast on final conversion step, not on intermediate steps or drafts
      if (!result.error && stepIntent === 'convert') {
        toast.success('Form submitted successfully!');
      }
    } catch (error) {
      // Log errors (dev only - verbose logging blocks main thread in production)
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
  
  // Track step changes and auto-save draft for drop-off tracking
  // Make this truly fire-and-forget (no await) to prevent blocking navigation
  const handleStepChange = useCallback((
    stepId: string,
    formData: FunnelFormData,
    selections: FunnelSelections
  ) => {
    const stepChangeStartTime = performance.now();
    const previousStepId = currentStepIdRef.current;
    // Update ref immediately to keep it in sync
    currentStepIdRef.current = stepId;
    
    if (import.meta.env.DEV) {
      console.log('[FunnelV3Renderer] Step change initiated', {
        from: previousStepId,
        to: stepId,
      });
    }
    
    // Defer ALL heavy work to next microtask to prevent blocking navigation
    // This ensures the UI updates instantly while background work happens after
    queueMicrotask(() => {
      const deferTime = performance.now() - stepChangeStartTime;
      if (import.meta.env.DEV) {
        console.log(`[FunnelV3Renderer] handleStepChange deferred work started after ${deferTime.toFixed(2)}ms`);
      }
      // Calculate step index for tracking
      const stepIndex = funnel.steps.findIndex(s => s.id === stepId);
      const currentStep = funnel.steps.find(s => s.id === stepId);
      
      // Skip draft save if navigating away from just-submitted step
      if (lastSubmitStepRef.current === previousStepId) {
        lastSubmitStepRef.current = null;
        // Still record step view event even if skipping draft save
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
          if (import.meta.env.DEV) {
            console.error('[FunnelV3Renderer] Failed to record step_viewed event:', {
              error,
              funnelId,
              teamId,
              stepId,
              sessionId: getOrCreateSessionId(),
            });
          }
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
        // Skip separate recordEvent call - step view is tracked via lead update
        saveDraft(emptyPayload).catch((error) => {
          if (import.meta.env.DEV) {
            console.error('[FunnelV3Renderer] Failed to update step index:', error);
          }
        });
        return;
      }
      
      // Skip separate recordEvent() call when saveDraft() will be called
      // The step view is already tracked via the lead's last_step_index update
      // This reduces API calls from 2 to 1 per step change
      
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
          // Silent fail - draft saves are best-effort and shouldn't block navigation
          // Logging removed to eliminate main thread blocking
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
