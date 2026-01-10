import { useMemo, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Flow-canvas builder
import { EditorShell } from '@/flow-canvas/builder/components/EditorShell';
import type { Page as FlowCanvasPage, SelectionState } from '@/flow-canvas/types/infostack';

// Data conversion
import { 
  editorDocumentToFlowCanvas, 
  flowCanvasToEditorDocument 
} from '@/lib/funnel/dataConverter';
import type { EditorDocument } from '@/builder_v2/state/persistence';

// Flow-canvas builder styles (full builder theme)
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
  updated_at: string;
};

// Save status type
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

// Loading state
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--builder-bg))]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[hsl(var(--builder-accent))] border-t-transparent" />
        <p className="text-sm font-medium text-[hsl(var(--builder-text-muted))]">{message}</p>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[hsl(var(--builder-bg))]">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[hsl(var(--builder-text))]">{message}</h2>
        <button 
          onClick={onBack}
          className="mt-4 text-sm text-[hsl(var(--builder-accent))] hover:underline"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

export default function FunnelEditor() {
  const { teamId, funnelId } = useParams<{ teamId: string; funnelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Auto-save state
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const currentPageRef = useRef<FlowCanvasPage | null>(null);

  // Fetch funnel data from Supabase
  const { data: funnel, isLoading, error } = useQuery({
    queryKey: ['funnel-editor', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, team_id, name, slug, status, settings, builder_document, updated_at')
        .eq('id', funnelId)
        .single();
      if (error) throw error;
      return data as unknown as FunnelRow;
    },
    enabled: !!funnelId,
  });

  // Convert Supabase document to flow-canvas format
  const initialFlowCanvasPage = useMemo(() => {
    if (!funnel) return null;
    
    // Try to convert existing builder_document
    const converted = editorDocumentToFlowCanvas(
      funnel.builder_document, 
      funnel.slug
    );
    
    // Update page name from funnel
    converted.name = funnel.name;
    
    return converted;
  }, [funnel]);

  // Save mutation (silent - no toast on auto-save)
  const saveMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const document = flowCanvasToEditorDocument(page);
      const { error } = await supabase
        .from('funnels')
        .update({ 
          builder_document: document as unknown as Json, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      toast({ title: 'Error saving', variant: 'destructive' });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const document = flowCanvasToEditorDocument(page);
      const { error } = await supabase
        .from('funnels')
        .update({
          published_document_snapshot: { 
            ...document, 
            publishedAt: Date.now() 
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

  // Handle page changes from the editor with auto-save
  const handlePageChange = useCallback((updatedPage: FlowCanvasPage) => {
    // Store current page for publish
    currentPageRef.current = updatedPage;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Mark as pending
    setSaveStatus('pending');
    
    // Debounced auto-save after 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      saveMutation.mutate(updatedPage);
    }, 2000);
  }, [saveMutation]);

  // Handle selection changes
  const handleSelect = useCallback((selection: SelectionState) => {
    // Selection state is handled internally by EditorShell
  }, []);

  // Handle publish
  const handlePublish = useCallback((page: FlowCanvasPage) => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save first, then publish
    setSaveStatus('saving');
    saveMutation.mutate(page, {
      onSuccess: () => {
        publishMutation.mutate(page);
      },
    });
  }, [saveMutation, publishMutation]);

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading funnel..." />;
  }

  // Error state
  if (error || !funnel) {
    return (
      <ErrorState 
        message="Funnel not found" 
        onBack={() => navigate(teamId ? `/team/${teamId}/funnels` : '/')} 
      />
    );
  }

  // No page data yet
  if (!initialFlowCanvasPage) {
    return <LoadingState message="Preparing editor..." />;
  }

  return (
    <EditorShell
      initialState={initialFlowCanvasPage}
      onChange={handlePageChange}
      onSelect={handleSelect}
      onPublish={handlePublish}
      saveStatus={saveStatus}
      lastSavedAt={lastSavedAt}
    />
  );
}
