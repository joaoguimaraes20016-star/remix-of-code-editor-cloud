import { useCallback, useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Funnel } from '@/funnel-builder-v3/types/funnel';
import type { Json } from '@/integrations/supabase/types';

interface UseFunnelPersistenceOptions {
  funnel: Funnel;
  setFunnel: (funnel: Funnel) => void;
}

interface FunnelRecord {
  id: string;
  name: string;
  slug: string;
  team_id: string;
  created_by: string;
  builder_document: any;
  settings: any;
  status: string;
  updated_at: string;
  domain_id: string | null;
  published_at: string | null;
}

export function useFunnelPersistence({ funnel, setFunnel }: UseFunnelPersistenceOptions) {
  const { teamId: teamIdParam, funnelId: funnelIdParam } = useParams<{ teamId?: string; funnelId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  
  const teamId = teamIdParam ?? null;
  const funnelId = funnelIdParam && funnelIdParam !== 'new' ? funnelIdParam : null;
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Fetch funnel metadata (status, domain_id, published_at)
  const { data: funnelMeta } = useQuery({
    queryKey: ['funnel-meta', funnelId],
    queryFn: async () => {
      if (!funnelId) return null;
      const { data, error } = await supabase
        .from('funnels')
        .select('status, domain_id, published_at, slug')
        .eq('id', funnelId)
        .single();
      if (error) return null;
      return data as { status: string; domain_id: string | null; published_at: string | null; slug: string };
    },
    enabled: !!funnelId,
    staleTime: 10000,
  });

  // Link domain to funnel
  const linkDomain = useCallback(async (domainId: string | null): Promise<boolean> => {
    if (!funnelId) {
      toast.error('No funnel ID available');
      return false;
    }
    try {
      const { error } = await supabase
        .from('funnels')
        .update({ domain_id: domainId })
        .eq('id', funnelId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['funnel-meta', funnelId] });
      toast.success(domainId ? 'Domain linked!' : 'Domain unlinked');
      return true;
    } catch (e) {
      console.error('Error linking domain:', e);
      toast.error('Failed to link domain');
      return false;
    }
  }, [funnelId, queryClient]);

  // NOTE: Loading is handled by FunnelEditorV3 (parent component).
  // This hook only handles save/publish to avoid duplicate loads and infinite loops.

  // Auto-save with debounce - returns funnel id on success (for publish flow)
  const saveDraft = useCallback(async (): Promise<string | false> => {
    if (!user || !teamId) {
      console.log('Cannot save: missing user or teamId');
      return false;
    }

    const funnelJson = JSON.stringify(funnel);
    
    // Skip if nothing changed
    if (funnelJson === lastSavedRef.current) {
      return funnelId || (funnel as any).id || false;
    }

    try {
      const saveData = {
        name: funnel.name || 'Untitled Funnel',
        slug: funnel.name?.toLowerCase().replace(/\s+/g, '-') || `funnel-${Date.now().toString(36)}`,
        team_id: teamId,
        created_by: user.id,
        builder_document: JSON.parse(JSON.stringify(funnel)) as Json,
        settings: (funnel.settings || {}) as Json,
        status: 'draft' as const,
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (funnelId) {
        // Update existing funnel
        result = await supabase
          .from('funnels')
          .update(saveData)
          .eq('id', funnelId)
          .select()
          .single();
      } else {
        // Create new funnel
        result = await supabase
          .from('funnels')
          .insert(saveData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Failed to save funnel:', result.error);
        toast.error('Failed to save draft');
        return false;
      }

      lastSavedRef.current = funnelJson;
      const savedFunnelId = result.data?.id;

      // Update URL with new funnel ID if this was a create (main app uses path params)
      if (!funnelId && savedFunnelId && teamId) {
        navigate(`/team/${teamId}/funnels/${savedFunnelId}/edit`, { replace: true });
      }

      return (savedFunnelId ?? funnelId) ?? true;
    } catch (e) {
      console.error('Error saving funnel:', e);
      toast.error('Failed to save draft');
      return false;
    }
  }, [funnel, funnelId, teamId, user, navigate]);

  // Debounced auto-save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000); // 2 second debounce
  }, [saveDraft]);

  // Publish funnel
  const publish = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Not authenticated');
      return false;
    }

    let currentFunnelId = funnelId;
    if (!currentFunnelId) {
      const saved = await saveDraft();
      currentFunnelId = typeof saved === 'string' ? saved : null;
      if (!currentFunnelId) return false;
    }
    if (!currentFunnelId) {
      toast.error('No funnel ID available');
      return false;
    }

    try {
      const response = await supabase.functions.invoke('publish-funnel', {
        body: {
          funnel_id: currentFunnelId,
          name: funnel.name,
          steps: funnel.steps.map((step, index) => ({
            order_index: index,
            step_type: step.type,
            content: step,
          })),
          builder_document: funnel,
          settings: funnel.settings || {},
        },
      });

      if (response.error) {
        console.error('Publish error:', response.error);
        toast.error('Failed to publish funnel');
        return false;
      }

      // Invalidate to refresh status
      queryClient.invalidateQueries({ queryKey: ['funnel-meta', currentFunnelId] });
      return true;
    } catch (e) {
      console.error('Error publishing funnel:', e);
      toast.error('Failed to publish funnel');
      return false;
    }
  }, [session, funnelId, funnel, saveDraft]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    funnelId,
    teamId,
    saveDraft,
    debouncedSave,
    publish,
    linkDomain,
    isAuthenticated: !!user,
    funnelStatus: funnelMeta?.status || 'draft',
    currentDomainId: funnelMeta?.domain_id || null,
    lastPublishedAt: funnelMeta?.published_at || null,
    slug: funnelMeta?.slug || funnel.name?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
  };
}
