import { useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Funnel } from '@/funnel-builder-v3/types/funnel';

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
}

export function useFunnelPersistence({ funnel, setFunnel }: UseFunnelPersistenceOptions) {
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  
  const funnelId = searchParams.get('funnelId');
  const teamId = searchParams.get('teamId');
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load funnel from database on mount
  useEffect(() => {
    if (!funnelId || !user) return;

    const loadFunnel = async () => {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('id, name, slug, builder_document, settings, status')
          .eq('id', funnelId)
          .single();

        if (error) {
          console.error('Failed to load funnel:', error);
          toast.error('Failed to load funnel');
          return;
        }

        if (data?.builder_document) {
          // Load the funnel from the stored builder_document
          const storedFunnel = data.builder_document as Funnel;
          setFunnel({
            ...storedFunnel,
            id: data.id,
            name: data.name || storedFunnel.name,
            slug: data.slug || storedFunnel.slug,
          });
          lastSavedRef.current = JSON.stringify(storedFunnel);
          toast.success('Funnel loaded');
        }
      } catch (e) {
        console.error('Error loading funnel:', e);
      }
    };

    loadFunnel();
  }, [funnelId, user, setFunnel]);

  // Auto-save with debounce
  const saveDraft = useCallback(async () => {
    if (!user || !teamId) {
      console.log('Cannot save: missing user or teamId');
      return false;
    }

    const funnelJson = JSON.stringify(funnel);
    
    // Skip if nothing changed
    if (funnelJson === lastSavedRef.current) {
      return true;
    }

    try {
      const saveData = {
        name: funnel.name || 'Untitled Funnel',
        slug: funnel.slug || `funnel-${Date.now().toString(36)}`,
        team_id: teamId,
        created_by: user.id,
        builder_document: funnel,
        settings: funnel.settings || {},
        status: 'draft',
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
      
      // Update URL with new funnel ID if this was a create
      if (!funnelId && result.data?.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('funnelId', result.data.id);
        window.history.replaceState({}, '', newUrl.toString());
      }

      return true;
    } catch (e) {
      console.error('Error saving funnel:', e);
      toast.error('Failed to save draft');
      return false;
    }
  }, [funnel, funnelId, teamId, user]);

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

    if (!funnelId) {
      // Save first to get an ID
      const saved = await saveDraft();
      if (!saved) return false;
    }

    const currentFunnelId = funnelId || searchParams.get('funnelId');
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

      toast.success('Funnel published!');
      return true;
    } catch (e) {
      console.error('Error publishing funnel:', e);
      toast.error('Failed to publish funnel');
      return false;
    }
  }, [session, funnelId, funnel, saveDraft, searchParams]);

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
    isAuthenticated: !!user,
  };
}
