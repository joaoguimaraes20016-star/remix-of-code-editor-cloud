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
// Version history entry type
type VersionHistoryEntry = {
  snapshot: unknown;
  timestamp: number;
  name?: string;
};

type FunnelRow = {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
  builder_document: EditorDocument | null;
  version_history: VersionHistoryEntry[] | null;
  domain_id: string | null;
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
  
  // Auto-save state with debounced status updates to prevent flicker
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const currentPageRef = useRef<FlowCanvasPage | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Fetch funnel data from Supabase
  const { data: funnel, isLoading, error } = useQuery({
    queryKey: ['funnel-editor', funnelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, team_id, name, slug, status, settings, builder_document, version_history, domain_id, updated_at')
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

    // Merge persisted funnel-level settings (source of truth for theme/background)
    // into the flow-canvas page settings.
    converted.settings = {
      ...(converted.settings || {}),
      ...((funnel.settings as unknown as FlowCanvasPage['settings']) || {}),
    };

    // Update page name from funnel
    converted.name = funnel.name;

    return converted;
  }, [funnel]);

  // Save mutation (silent - no toast on auto-save)
  // Uses minimum display duration to prevent flicker
  const saveMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const document = flowCanvasToEditorDocument(page);
      const { error } = await supabase
        .from('funnels')
        .update({ 
          builder_document: document as unknown as Json, 
          // Also persist page.settings to the funnel.settings column (source of truth for theme/background)
          settings: (page.settings || {}) as unknown as Json,
          updated_at: new Date().toISOString() 
        })
        .eq('id', funnelId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear any pending status timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      lastSaveTimeRef.current = Date.now();
      
      // Keep "Saved" visible for minimum 1.5 seconds before returning to idle
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
    },
    onError: () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      setSaveStatus('error');
      toast({ title: 'Error saving', variant: 'destructive' });
    },
  });

  // Publish mutation - now stores version history
  const publishMutation = useMutation({
    mutationFn: async (page: FlowCanvasPage) => {
      const document = flowCanvasToEditorDocument(page);
      const publishedSnapshot = { 
        ...document, 
        publishedAt: Date.now() 
      };
      
      // First fetch current version_history
      const { data: currentFunnel } = await supabase
        .from('funnels')
        .select('version_history, published_document_snapshot')
        .eq('id', funnelId)
        .single();
      
      // Build new history entry (only if there's an existing published version)
      const existingHistory = (currentFunnel?.version_history as Array<{snapshot: unknown; timestamp: number; name?: string}>) || [];
      const newHistory = currentFunnel?.published_document_snapshot 
        ? [
            { 
              snapshot: currentFunnel.published_document_snapshot, 
              timestamp: (currentFunnel.published_document_snapshot as any)?.publishedAt || Date.now(),
              name: `Version ${existingHistory.length + 1}`
            },
            ...existingHistory
          ].slice(0, 20) // Keep max 20 versions
        : existingHistory;
      
      const { error } = await supabase
        .from('funnels')
        .update({
          published_document_snapshot: publishedSnapshot as unknown as Json,
          version_history: newHistory as unknown as Json,
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
  // Uses debouncing to prevent rapid status flicker
  const handlePageChange = useCallback((updatedPage: FlowCanvasPage) => {
    // Store current page for publish
    currentPageRef.current = updatedPage;
    
    // Clear existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Only show "pending" if we're not already in a saving/saved state
    // This prevents flicker when user edits during save
    if (saveStatus === 'idle' || saveStatus === 'error') {
      // Delay showing "pending" by 300ms to avoid flash for quick edits
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        // Only set pending if we haven't started saving yet
        if (!saveMutation.isPending) {
          setSaveStatus('pending');
        }
      }, 300);
    }
    
    // Debounced auto-save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      // Clear pending status timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      setSaveStatus('saving');
      saveMutation.mutate(updatedPage);
    }, 2000);
  }, [saveMutation, saveStatus]);

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

  // Handle version restore - must be before any early returns
  const handleRestoreVersion = useCallback(async (snapshot: unknown) => {
    if (!snapshot || !funnel?.slug) return;
    // Convert the snapshot back to flow-canvas format and update the page
    const restoredPage = editorDocumentToFlowCanvas(snapshot as EditorDocument, funnel.slug);
    if (restoredPage) {
      handlePageChange(restoredPage);
    }
  }, [funnel?.slug, handlePageChange]);

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
      versionHistory={funnel?.version_history || []}
      onRestoreVersion={handleRestoreVersion}
      funnelId={funnelId}
      teamId={teamId}
      currentDomainId={funnel?.domain_id || null}
      funnelStatus={funnel?.status || 'draft'}
      isPublishing={publishMutation.isPending}
    />
  );
}
