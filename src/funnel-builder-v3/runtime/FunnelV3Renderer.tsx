import React, { useCallback, useRef } from 'react';
import { FunnelRuntimeProvider, FunnelFormData, FunnelSelections, useFunnelRuntime } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { FunnelProvider } from '@/funnel-builder-v3/context/FunnelContext';
import { BlockRenderer } from '@/funnel-builder-v3/editor/blocks/BlockRenderer';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useUnifiedLeadSubmit, createUnifiedPayload, extractIdentityFromAnswers } from '@/flow-canvas/shared/hooks/useUnifiedLeadSubmit';

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

// Inner component that uses runtime context
function FunnelV3Content({ funnel }: { funnel: Funnel }) {
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
}


export function FunnelV3Renderer({ document, settings, funnelId, teamId }: FunnelV3RendererProps) {
  // Convert document to Funnel format
  const funnel = convertDocumentToFunnel(document);

  // Use unified lead submission hook
  const { submit, saveDraft, leadId } = useUnifiedLeadSubmit({
    funnelId,
    teamId,
    onLeadSaved: (id, mode) => {
      console.log(`[FunnelV3Renderer] Lead saved: ${id}, mode: ${mode}`);
    },
    onError: (error) => {
      console.error('[FunnelV3Renderer] Submission error:', error);
      toast.error('Failed to submit form');
    },
  });

  // Handle form submission using unified pipeline
  // We'll use a ref to track current step ID since we can't access runtime here
  const currentStepIdRef = useRef<string | undefined>(funnel.steps[0]?.id);
  
  const handleFormSubmit = useCallback(async (
    data: FunnelFormData, 
    selections: FunnelSelections,
    consent?: { agreed: boolean; privacyPolicyUrl?: string }
  ) => {
    try {
      // Build answers object from form data and selections
      const answers: Record<string, any> = { ...data, ...selections };
      
      // Extract identity from form fields (check current step first, then all steps)
      const currentStep = funnel.steps.find(s => s.id === currentStepIdRef.current);
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
      const currentStepId = currentStepIdRef.current;
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
  const handleStepChange = useCallback(async (
    stepId: string,
    formData: FunnelFormData,
    selections: FunnelSelections
  ) => {
    currentStepIdRef.current = stepId;
    
    // Auto-save current data as draft for drop-off tracking
    // Only save if there's actual data to save
    const hasData = Object.keys(formData).length > 0 || Object.keys(selections).length > 0;
    if (!hasData) return;
    
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
      
      // Determine step intent based on position
      const stepIndex = funnel.steps.findIndex(s => s.id === stepId);
      const isLastStep = stepIndex === funnel.steps.length - 1;
      const stepIntent: 'capture' | 'qualify' | 'schedule' | 'convert' | 'complete' | 'navigate' | 'info' = 
        isLastStep ? 'convert' : 'capture';
      
      // Create unified payload
      const payload = createUnifiedPayload(answers, {
        funnelId,
        teamId,
        stepId,
        stepIntent,
      });
      
      // Override identity if we extracted it from form fields
      if (identity.name || identity.email || identity.phone) {
        payload.identity = identity;
      }
      
      // Save as draft (no automations triggered, for drop-off tracking)
      await saveDraft(payload);
    } catch (error) {
      // Don't block navigation if draft save fails
      console.error('[FunnelV3Renderer] Draft save error:', error);
    }
  }, [funnelId, teamId, saveDraft, funnel.steps]);

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
