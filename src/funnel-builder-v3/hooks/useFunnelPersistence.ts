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
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch funnel metadata (status, domain_id)
  const { data: funnelMeta } = useQuery({
    queryKey: ['funnel-meta', funnelId],
    queryFn: async () => {
      if (!funnelId) return null;
      const { data, error } = await supabase
        .from('funnels')
        .select('status, domain_id, slug')
        .eq('id', funnelId)
        .single();
      if (error) return null;
      return data as { 
        status: string; 
        domain_id: string | null; 
        slug: string;
      };
    },
    enabled: !!funnelId,
    staleTime: 30000, // 30 seconds - reduce refetch frequency to prevent data loss
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
      
      // Invalidate and immediately refetch to ensure fresh data
      await queryClient.invalidateQueries({ 
        queryKey: ['funnel-meta', funnelId],
        refetchType: 'active' // Force immediate refetch for active queries
      });
      
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
      // Preserve existing status if funnel is already published
      // Fetch fresh status from database if query data is unavailable or might be stale
      let currentStatus = funnelMeta?.status;
      
      // If query data is missing and we have a funnelId, fetch fresh status
      if (!currentStatus && funnelId) {
        try {
          const { data } = await supabase
            .from('funnels')
            .select('status')
            .eq('id', funnelId)
            .single();
          currentStatus = data?.status || 'draft';
        } catch (fetchError) {
          console.warn('[useFunnelPersistence] Failed to fetch fresh status, using default:', fetchError);
          currentStatus = 'draft';
        }
      }
      
      const preserveStatus = (currentStatus === 'published') ? 'published' : 'draft';

      const saveData = {
        name: funnel.name || 'Untitled Funnel',
        slug: funnel.name?.toLowerCase().replace(/\s+/g, '-') || `funnel-${Date.now().toString(36)}`,
        team_id: teamId,
        created_by: user.id,
        builder_document: JSON.parse(JSON.stringify(funnel)) as Json,
        settings: (funnel.settings || {}) as Json,
        status: preserveStatus as 'draft' | 'published',
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
  }, [funnel, funnelId, teamId, user, navigate, funnelMeta]);

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

    // Set publishing flag to prevent auto-save race condition
    setIsPublishing(true);

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
      // Ensure name is not empty
      const funnelName = funnel.name?.trim() || 'Untitled Funnel';
      
      // Validate funnel has steps
      if (!funnel.steps || funnel.steps.length === 0) {
        toast.error('Cannot publish: Funnel has no steps');
        return false;
      }

      // Transform funnel into runtime-compatible format
      // V3 format uses 'pages' array (similar to EditorDocument) but with version 3
      const runtimeDocument = {
        version: 3, // Mark as v3 format
        pages: funnel.steps.map((step, index) => ({
          id: step.id,
          name: step.name || `Step ${index + 1}`,
          type: step.type || 'capture',
          slug: step.slug || `step-${index + 1}`,
          order_index: index,
          blocks: step.blocks || [],
          settings: step.settings || {},
        })),
        settings: funnel.settings || {},
        name: funnelName,
        countryCodes: funnel.countryCodes || [],
        defaultCountryId: funnel.defaultCountryId,
      };

      // Prepare request body
      // V3 format: Send empty steps array since funnel_steps table is not used
      // All data is stored in published_document_snapshot (via settings/runtimeDocument)
      const requestBody = {
        funnel_id: currentFunnelId,
        name: funnelName,
        steps: [], // Empty for V3 - funnel_steps table not used
        builder_document: funnel, // Keep original for editing (used for builder_document field)
        settings: runtimeDocument, // Use runtime format for published_document_snapshot
      };

      // Validate request body can be serialized (catch circular references)
      let serializedBody: string;
      try {
        serializedBody = JSON.stringify(requestBody);
      } catch (serializationError) {
        console.error('Failed to serialize request body:', serializationError);
        toast.error('Failed to publish: Invalid funnel data structure');
        return false;
      }

      // Check payload size (Supabase edge functions have ~6MB limit)
      const payloadSizeMB = new Blob([serializedBody]).size / (1024 * 1024);
      console.log('Publishing funnel:', {
        funnelId: currentFunnelId,
        name: funnelName,
        stepsCount: funnel.steps.length,
        runtimeDocumentVersion: runtimeDocument.version,
        runtimeDocumentPagesCount: runtimeDocument.pages.length,
        payloadSizeMB: payloadSizeMB.toFixed(2),
      });

      if (payloadSizeMB > 5) {
        console.warn('Large payload detected:', payloadSizeMB.toFixed(2), 'MB');
        toast.error(`Payload too large (${payloadSizeMB.toFixed(2)}MB). Please reduce funnel size.`);
        return false;
      }

      const response = await supabase.functions.invoke('publish-funnel', {
        body: requestBody,
      });

      // Check for errors - Supabase edge functions can return errors in different ways
      // First check if there's an error object
      if (response.error) {
        console.error('Publish error details:', {
          error: response.error,
          data: response.data,
          funnelId: currentFunnelId,
          funnelName: funnelName,
          stepsCount: funnel.steps.length,
        });
        
        // Try to extract error message from response
        let errorMessage = 'Unknown error';
        if (response.data?.error) {
          errorMessage = typeof response.data.error === 'string' 
            ? response.data.error 
            : response.data.error.message || JSON.stringify(response.data.error);
          // Include details if available
          if (response.data.details) {
            errorMessage += ` (${response.data.details})`;
          }
        } else if (response.error?.message) {
          errorMessage = response.error.message;
        } else if (typeof response.error === 'string') {
          errorMessage = response.error;
        }
        
        // Check for specific error codes
        if (response.error?.code === 220 || response.data?.code === 220) {
          errorMessage = 'Payload too large. Please reduce the funnel size or remove large images/media.';
        }
        
        console.error('Extracted error message:', errorMessage);
        toast.error(`Failed to publish: ${errorMessage}`);
        return false;
      }

      // Check response data for errors (edge function might return error in data field)
      if (response.data && typeof response.data === 'object') {
        if ('error' in response.data) {
          console.error('Publish error in response data:', response.data);
          const errorMsg = typeof response.data.error === 'string' 
            ? response.data.error 
            : JSON.stringify(response.data.error);
          toast.error(`Failed to publish: ${errorMsg}`);
          return false;
        }
        
        // Check if response is successful
        if ('ok' in response.data && response.data.ok === true) {
          console.log('Publish successful:', response.data);
        }
      }

      // If we get here and there's no success indicator, something might be wrong
      if (!response.data || (typeof response.data === 'object' && !('ok' in response.data))) {
        console.warn('Unexpected response format:', response);
      }

      // Optimistically update the cache immediately with published status
      // This ensures the UI updates instantly and persists
      queryClient.setQueryData(['funnel-meta', currentFunnelId], (old: any) => {
        // Preserve existing data and update status
        return old ? {
          ...old,
          status: 'published',
        } : {
          domain_id: funnelMeta?.domain_id || null,
          status: 'published',
          slug: funnelMeta?.slug || '',
        };
      });

      // CRITICAL: Invalidate and refetch immediately to prevent race condition
      // This ensures auto-save reads fresh 'published' status instead of stale 'draft'
      await queryClient.invalidateQueries({ 
        queryKey: ['funnel-meta', currentFunnelId],
        refetchType: 'active' // Force immediate refetch for active queries
      });
      
      // Clear publishing flag after a short delay to ensure query has refetched
      setTimeout(() => {
        setIsPublishing(false);
      }, 500);
      
      return true;
    } catch (e) {
      console.error('Error publishing funnel:', e);
      toast.error('Failed to publish funnel');
      setIsPublishing(false); // Clear flag on error
      return false;
    }
  }, [session, funnelId, funnel, saveDraft, queryClient, funnelMeta]);

  // Wire up auto-save when funnel changes
  useEffect(() => {
    if (funnel && funnelId) {
      debouncedSave();
    }
  }, [funnel, debouncedSave, funnelId]);

  // Add beforeunload handler to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentJson = JSON.stringify(funnel);
      if (currentJson !== lastSavedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [funnel]);

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
    slug: funnelMeta?.slug || funnel.name?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
  };
}
