import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunnelRenderer } from '@/components/funnel-public/FunnelRenderer';
import { FlowCanvasRenderer } from '@/flow-canvas/components/FlowCanvasRenderer';
import { editorDocumentToFlowCanvas } from '@/lib/funnel/dataConverter';

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: Record<string, any>;
}

interface FunnelSettings {
  logo_url?: string;
  primary_color: string;
  background_color: string;
  button_text: string;
  ghl_webhook_url?: string;
  privacy_policy_url?: string;
  show_progress_bar?: boolean;
}

interface Funnel {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  settings: FunnelSettings;
  published_document_snapshot?: Record<string, any> | null;
}

// Check if we're on a custom domain (not localhost or preview domains)
function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return !hostname.includes('localhost') && 
         !hostname.includes('.app') && 
         !hostname.includes('127.0.0.1');
}

export default function PublicFunnel() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [customDomainFunnel, setCustomDomainFunnel] = useState<Funnel | null>(null);
  const [customDomainSteps, setCustomDomainSteps] = useState<FunnelStep[] | null>(null);
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [customDomainError, setCustomDomainError] = useState<string | null>(null);
  
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');

  // Check for custom domain resolution
  useEffect(() => {
    if (isCustomDomain() && !slug) {
      // We're on a custom domain without a slug, resolve the domain
      setCustomDomainLoading(true);
      const hostname = window.location.hostname;
      
      supabase.functions.invoke('resolve-domain', {
        body: { domain: hostname },
      }).then(({ data, error }) => {
        setCustomDomainLoading(false);
        if (error || !data?.success) {
          setCustomDomainError(data?.error || 'Domain not configured');
          return;
        }
        
        setCustomDomainFunnel({
          id: data.funnel.id,
          team_id: data.funnel.team_id,
          name: data.funnel.name,
          slug: data.funnel.slug,
          settings: data.funnel.settings as FunnelSettings,
          published_document_snapshot: data.funnel.published_document_snapshot,
        });
        setCustomDomainSteps(data.steps);
      }).catch((err) => {
        setCustomDomainLoading(false);
        setCustomDomainError('Failed to resolve domain');
        console.error('Domain resolution error:', err);
      });
    }
  }, [slug]);

  // Slug-based funnel query (when we have a slug)
  const { data: funnel, isLoading: funnelLoading, error: funnelError } = useQuery({
    queryKey: ['public-funnel', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return { 
        ...data, 
        settings: data.settings as unknown as FunnelSettings,
        published_document_snapshot: data.published_document_snapshot as Record<string, any> | null,
      } as Funnel;
    },
    enabled: !!slug,
  });

  const { data: steps, isLoading: stepsLoading } = useQuery({
    queryKey: ['public-funnel-steps', funnel?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', funnel!.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FunnelStep[];
    },
    enabled: !!funnel?.id,
  });

  // Determine which funnel data to use
  const activeFunnel = customDomainFunnel || funnel;
  const activeSteps = customDomainSteps || steps;
  const isLoading = customDomainLoading || funnelLoading || stepsLoading;
  const hasError = customDomainError || funnelError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (hasError || !activeFunnel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Funnel Not Found</h1>
          <p className="text-white/60">
            {customDomainError || "This funnel doesn't exist or is not published"}
          </p>
        </div>
      </div>
    );
  }

  // Detect format: new EditorDocument (has pages) OR old FlowCanvas (has steps)
  const snapshot = activeFunnel?.published_document_snapshot;
  const isEditorDocumentFormat = snapshot?.version && snapshot?.pages?.length > 0;
  const isFlowCanvasFormat = snapshot?.steps?.length > 0;
  const isFlowCanvasFunnel = isEditorDocumentFormat || isFlowCanvasFormat;

  if (isFlowCanvasFunnel) {
    // Convert EditorDocument format to FlowCanvasPage if needed
    let flowCanvasPage = snapshot;
    
    if (isEditorDocumentFormat) {
      flowCanvasPage = editorDocumentToFlowCanvas(
        snapshot as any,
        activeFunnel.slug
      );
    }
    
    return (
      <FlowCanvasRenderer
        funnelId={activeFunnel.id}
        page={flowCanvasPage}
        settings={activeFunnel.settings}
      />
    );
  }

  // Legacy funnel - requires steps
  if (!activeSteps || activeSteps.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Funnel Empty</h1>
          <p className="text-white/60">This funnel has no steps configured</p>
        </div>
      </div>
    );
  }

  return (
    <FunnelRenderer
      funnel={activeFunnel}
      steps={activeSteps}
      utmSource={utmSource}
      utmMedium={utmMedium}
      utmCampaign={utmCampaign}
    />
  );
}
