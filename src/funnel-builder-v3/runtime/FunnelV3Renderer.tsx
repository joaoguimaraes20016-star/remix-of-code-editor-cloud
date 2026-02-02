import React, { useCallback } from 'react';
import { FunnelRuntimeProvider, FunnelFormData, FunnelSelections } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { BlockRenderer } from '@/funnel-builder-v3/editor/blocks/BlockRenderer';
import { Funnel, FunnelStep } from '@/funnel-builder-v3/types/funnel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
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
          className="min-h-screen py-8 px-4 max-w-md mx-auto"
          style={{ backgroundColor: stepBgColor || undefined }}
        >
          {currentStep.blocks.map((block) => (
            <div key={block.id} className="mb-4">
              <BlockRenderer block={block} stepId={currentStep.id} isPreview={false} />
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

  // Handle form submission with webhook support
  const handleFormSubmit = useCallback(async (data: FunnelFormData, selections: FunnelSelections) => {
    try {
      // Collect all form data
      const submissionData = {
        funnelId,
        teamId,
        formData: data,
        selections,
        timestamp: new Date().toISOString(),
      };

      // Send to webhook if configured
      const webhookUrl = settings?.webhookUrl || document.settings?.webhookUrl;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData),
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't fail the submission if webhook fails
        }
      }

      // Store submission in database
      const { error: dbError } = await supabase
        .from('funnel_submissions')
        .insert({
          funnel_id: funnelId,
          team_id: teamId,
          data: submissionData,
          created_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      toast.success('Form submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit form');
    }
  }, [funnelId, teamId, settings, document.settings]);

  return (
    <FunnelRuntimeProvider 
      funnel={funnel}
      onFormSubmit={handleFormSubmit}
    >
      <FunnelV3Content funnel={funnel} />
    </FunnelRuntimeProvider>
  );
}
