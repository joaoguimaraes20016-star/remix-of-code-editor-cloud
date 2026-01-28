/**
 * FunnelEditor Page
 * 
 * Uses feature flag (?builder=v3) to toggle between old and new builder.
 * Default: v3 (new Perspective-style builder)
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// V3 Builder (new - default)
import { Editor } from '@/funnel-builder-v3/components/Editor';
import { 
  Funnel, 
  createDefaultFunnel 
} from '@/funnel-builder-v3/types/funnel';
import { 
  dbRowToFunnel, 
  v3FunnelToEditorDocument,
  v3FunnelToFlowCanvas,
} from '@/funnel-builder-v3/utils/dataConverter';

// Legacy builder (for backward compatibility)
import { EditorShell as LegacyEditorShell } from '@/flow-canvas/builder/components/EditorShell';
import type { Page as FlowCanvasPage, SelectionState } from '@/flow-canvas/types/infostack';
import { 
  editorDocumentToFlowCanvas, 
  flowCanvasToEditorDocument 
} from '@/lib/funnel/dataConverter';
import type { EditorDocument } from '@/builder_v2/state/persistence';
import '@/flow-canvas/index.css';

// Types
type FunnelRow = {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
  builder_document: EditorDocument | null;
  published_document_snapshot: FlowCanvasPage | null;
  version_history: Array<{ snapshot: unknown; timestamp: number; name?: string }> | null;
  domain_id: string | null;
  updated_at: string;
};

// Loading state
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold">{message}</h2>
        <button 
          onClick={onBack}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

export default function FunnelEditor() {
  const { teamId, funnelId } = useParams<{ teamId: string; funnelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Feature flag: ?builder=legacy to use old builder
  const useLegacyBuilder = searchParams.get('builder') === 'legacy';

  // Fetch funnel data
  const { data: funnel, isLoading, error } = useQuery({
    queryKey: ['funnel-editor', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, team_id, name, slug, status, settings, builder_document, published_document_snapshot, version_history, domain_id, updated_at')
        .eq('id', funnelId)
        .single();
      if (error) throw error;
      return data as unknown as FunnelRow;
    },
    enabled: !!funnelId,
  });

  // Loading
  if (isLoading) {
    return <LoadingState message="Loading funnel..." />;
  }

  // Error
  if (error || !funnel) {
    return (
      <ErrorState 
        message="Funnel not found" 
        onBack={() => navigate(teamId ? `/team/${teamId}/funnels` : '/')} 
      />
    );
  }

  // Route to appropriate builder
  if (useLegacyBuilder) {
    return (
      <LegacyFunnelEditor
        funnel={funnel}
        funnelId={funnelId!}
        teamId={teamId}
        queryClient={queryClient}
        navigate={navigate}
      />
    );
  }

  return (
    <V3FunnelEditor
      funnel={funnel}
      funnelId={funnelId!}
      teamId={teamId}
      queryClient={queryClient}
      navigate={navigate}
    />
  );
}

// =============================================================================
// V3 BUILDER (NEW - DEFAULT)
// =============================================================================

interface V3EditorProps {
  funnel: FunnelRow;
  funnelId: string;
  teamId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
  navigate: ReturnType<typeof useNavigate>;
}

function V3FunnelEditor({ funnel, funnelId, teamId, queryClient, navigate }: V3EditorProps) {
  // Convert DB data to v3 Funnel format
  const initialFunnel = useMemo(() => {
    return dbRowToFunnel({
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      status: funnel.status,
      settings: funnel.settings,
      builder_document: funnel.builder_document,
      published_document_snapshot: funnel.published_document_snapshot,
    });
  }, [funnel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedFunnel: Funnel) => {
      const document = v3FunnelToEditorDocument(updatedFunnel);
      const { error } = await supabase
        .from('funnels')
        .update({
          builder_document: document as unknown as Json,
          settings: {
            ...funnel.settings,
            primaryColor: updatedFunnel.settings.primaryColor,
            fontFamily: updatedFunnel.settings.fontFamily,
          } as unknown as Json,
          name: updatedFunnel.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onError: () => {
      toast({ title: 'Error saving', variant: 'destructive' });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (updatedFunnel: Funnel) => {
      const flowCanvasSnapshot = v3FunnelToFlowCanvas(updatedFunnel);
      const document = v3FunnelToEditorDocument(updatedFunnel);
      
      const { error } = await supabase
        .from('funnels')
        .update({
          builder_document: document as unknown as Json,
          published_document_snapshot: {
            ...flowCanvasSnapshot,
            publishedAt: Date.now(),
          } as unknown as Json,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-editor', funnelId] });
      toast({ title: 'Published!' });
    },
    onError: () => {
      toast({ title: 'Error publishing', variant: 'destructive' });
    },
  });

  const handleSave = useCallback(async (updatedFunnel: Funnel) => {
    await saveMutation.mutateAsync(updatedFunnel);
  }, [saveMutation]);

  const handlePublish = useCallback(() => {
    // Get latest funnel state from the Editor
    // For now, just publish what we have
    publishMutation.mutate(initialFunnel);
  }, [publishMutation, initialFunnel]);

  const handleBack = useCallback(() => {
    navigate(teamId ? `/team/${teamId}/funnels` : '/');
  }, [navigate, teamId]);

  return (
    <Editor
      initialFunnel={initialFunnel}
      onSave={handleSave}
      onPublish={handlePublish}
      onBack={handleBack}
    />
  );
}

// =============================================================================
// LEGACY BUILDER (BACKWARD COMPATIBILITY)
// =============================================================================

interface LegacyEditorProps {
  funnel: FunnelRow;
  funnelId: string;
  teamId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
  navigate: ReturnType<typeof useNavigate>;
}

function LegacyFunnelEditor({ funnel, funnelId, teamId, queryClient, navigate }: LegacyEditorProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Convert to flow-canvas format
  const initialFlowCanvasPage = useMemo(() => {
    const converted = editorDocumentToFlowCanvas(funnel.builder_document, funnel.slug);
    converted.settings = {
      ...(converted.settings || {}),
      ...((funnel.settings as unknown as FlowCanvasPage['settings']) || {}),
    };
    converted.name = funnel.name;
    return converted;
  }, [funnel]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const document = flowCanvasToEditorDocument(page);
      const { error } = await supabase
        .from('funnels')
        .update({
          builder_document: document as unknown as Json,
          settings: (page.settings || {}) as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
    },
    onError: () => {
      setSaveStatus('error');
      toast({ title: 'Error saving', variant: 'destructive' });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const flowCanvasSnapshot = { ...page, publishedAt: Date.now(), settings: page.settings || {} };
      const { error } = await supabase
        .from('funnels')
        .update({
          published_document_snapshot: flowCanvasSnapshot as unknown as Json,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel-editor', funnelId] });
      toast({ title: 'Published!' });
    },
    onError: () => {
      toast({ title: 'Error publishing', variant: 'destructive' });
    },
  });

  const handlePageChange = useCallback((updatedPage: FlowCanvasPage) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (saveStatus === 'idle' || saveStatus === 'error') {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        if (!saveMutation.isPending) setSaveStatus('pending');
      }, 300);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      setSaveStatus('saving');
      saveMutation.mutate(updatedPage);
    }, 2000);
  }, [saveMutation, saveStatus]);

  const handleSelect = useCallback((selection: SelectionState) => {}, []);

  const handlePublish = useCallback((page: FlowCanvasPage) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveMutation.mutate(page, {
      onSuccess: () => publishMutation.mutate(page),
      onError: () => publishMutation.mutate(page),
    });
  }, [saveMutation, publishMutation]);

  const handleRestoreVersion = useCallback(async (snapshot: unknown) => {
    if (!snapshot) return;
    const restoredPage = editorDocumentToFlowCanvas(snapshot as EditorDocument, funnel.slug);
    if (restoredPage) handlePageChange(restoredPage);
  }, [funnel.slug, handlePageChange]);

  return (
    <LegacyEditorShell
      initialState={initialFlowCanvasPage}
      onChange={handlePageChange}
      onSelect={handleSelect}
      onPublish={handlePublish}
      saveStatus={saveStatus}
      lastSavedAt={lastSavedAt}
      versionHistory={funnel.version_history || []}
      onRestoreVersion={handleRestoreVersion}
      funnelId={funnelId}
      teamId={teamId}
      currentDomainId={funnel.domain_id || null}
      funnelStatus={funnel.status || 'draft'}
      isPublishing={publishMutation.isPending}
    />
  );
}
