import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunnelRenderer } from '@/components/funnel-public/FunnelRenderer';
import { FlowCanvasRenderer } from '@/flow-canvas/components/FlowCanvasRenderer';
import { EditorDocumentRenderer } from '@/flow-canvas/components/runtime/EditorDocumentRenderer';

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

// Check if funnel data was injected by serve-funnel (custom domain serving)
function getInjectedFunnelData(): { funnel: Funnel; domain: string; queryParams: Record<string, string> } | null {
  if (typeof window !== 'undefined' && (window as any).__INFOSTACK_FUNNEL__) {
    return (window as any).__INFOSTACK_FUNNEL__;
  }
  return null;
}

// Check if we're on a custom domain (not localhost or preview domains)
function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return !hostname.includes('localhost') && 
         !hostname.includes('.app') && 
         !hostname.includes('.lovable.') &&
         !hostname.includes('lovableproject.com') &&
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
  const debug = searchParams.get('debug') === '1';

  // Check for injected funnel data (served inline by serve-funnel)
  const injectedData = useMemo(() => getInjectedFunnelData(), []);

  // If we have injected data, use it immediately (custom domain inline serving)
  useEffect(() => {
    if (injectedData) {
      setCustomDomainFunnel(injectedData.funnel);
      // No steps for new format - they come from snapshot
      setCustomDomainSteps([]);
    }
  }, [injectedData]);

  // Fallback: Check for custom domain resolution via edge function
  useEffect(() => {
    // Skip if we already have injected data
    if (injectedData) return;
    
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
  }, [slug, injectedData]);

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
    enabled: !!slug && !injectedData,
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
    enabled: !!funnel?.id && !injectedData,
  });

  // Determine which funnel data to use
  const activeFunnel = customDomainFunnel || funnel;
  const activeSteps = customDomainSteps || steps;
  const isLoading = !injectedData && (customDomainLoading || funnelLoading || stepsLoading);
  const hasError = customDomainError || funnelError;

  // Detect format: new EditorDocument (has pages) OR old FlowCanvas (has steps)
  // NOTE: Must compute these before any early returns to keep hook order stable
  const snapshot = activeFunnel?.published_document_snapshot;
  const isEditorDocumentFormat =
    typeof (snapshot as any)?.version === 'number' &&
    Array.isArray((snapshot as any)?.pages) &&
    (snapshot as any).pages.length > 0;
  const isFlowCanvasFormat = Array.isArray((snapshot as any)?.steps) && (snapshot as any).steps.length > 0;

  // Debug: expose which runtime path was chosen
  // CRITICAL: This hook MUST be before any early returns to maintain consistent hook order
  useEffect(() => {
    if (!debug) return;

    const renderer = isEditorDocumentFormat
      ? 'EditorDocumentRenderer'
      : isFlowCanvasFormat
        ? 'FlowCanvasRenderer'
        : 'LegacyFunnelRenderer';

    console.info('[PublicFunnel] runtime selection', {
      hostname: window.location.hostname,
      slug,
      funnelId: activeFunnel?.id,
      injected: !!injectedData,
      snapshotKeys: snapshot ? Object.keys(snapshot) : [],
      snapshotVersion: (snapshot as any)?.version,
      pages: Array.isArray((snapshot as any)?.pages) ? (snapshot as any).pages.length : 0,
      steps: Array.isArray((snapshot as any)?.steps) ? (snapshot as any).steps.length : 0,
      renderer,
      shell: (window as any).__INFOSTACK_SHELL__,
    });

    document.documentElement.dataset.infostackRenderer = renderer;
    return () => {
      delete document.documentElement.dataset.infostackRenderer;
    };
  }, [debug, slug, activeFunnel?.id, injectedData, isEditorDocumentFormat, isFlowCanvasFormat, snapshot]);

  // Early returns AFTER all hooks
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

  // NEW: EditorDocument format - use WYSIWYG renderer (no lossy conversion)
  if (isEditorDocumentFormat) {
    // Extract webhook URLs from settings or funnel config
    const webhookUrls: string[] = [];
    if (activeFunnel.settings.ghl_webhook_url) {
      webhookUrls.push(activeFunnel.settings.ghl_webhook_url);
    }

    return (
      <EditorDocumentRenderer
        document={snapshot as any}
        settings={activeFunnel.settings}
        funnelId={activeFunnel.id}
        teamId={activeFunnel.team_id}
        funnelSlug={activeFunnel.slug}
        webhookUrls={webhookUrls}
      />
    );
  }

  // FlowCanvas format (legacy new builder) - use FlowCanvasRenderer
  if (isFlowCanvasFormat) {
    return (
      <FlowCanvasRenderer
        funnelId={activeFunnel.id}
        page={snapshot}
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
