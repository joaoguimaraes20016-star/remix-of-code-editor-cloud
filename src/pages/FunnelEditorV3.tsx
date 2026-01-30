import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FunnelProvider, useFunnel, createEmptyFunnel } from '@/funnel-builder-v3';
import type { Funnel } from '@/funnel-builder-v3/types/funnel';

import { FunnelEditor } from '@/funnel-builder-v3/editor/FunnelEditor';

export default function FunnelEditorV3() {
  const { teamId, funnelId } = useParams<{ teamId: string; funnelId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [initialFunnel, setInitialFunnel] = useState<Funnel | null>(null);
  const funnelRef = useRef<Funnel | null>(null);

  // Fetch funnel from Supabase
  const { data: dbFunnel, isLoading, error } = useQuery({
    queryKey: ['funnel-v3', funnelId],
    queryFn: async () => {
      if (!funnelId || funnelId === 'new') return null;
      
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', funnelId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!funnelId && funnelId !== 'new',
  });

  // Convert DB format to editor format
  useEffect(() => {
    if (funnelId === 'new' || !funnelId) {
      // New funnel
      const empty = createEmptyFunnel();
      setInitialFunnel(empty);
    } else if (dbFunnel) {
      // Load from builder_document if it exists and is v3 format
      const doc = dbFunnel.builder_document as any;
      if (doc && doc.steps && Array.isArray(doc.steps)) {
        setInitialFunnel(doc as Funnel);
      } else {
        // Legacy or empty - create new with funnel metadata
        const empty = createEmptyFunnel();
        setInitialFunnel({
          ...empty,
          id: dbFunnel.id,
          name: dbFunnel.name,
        });
      }
    }
  }, [dbFunnel, funnelId]);

  // Track current funnel state
  const handleFunnelChange = useCallback((funnel: Funnel) => {
    funnelRef.current = funnel;
  }, []);

  // Save draft mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!funnelRef.current || !teamId || !user) throw new Error('Missing data');
      
      const funnel = funnelRef.current;
      const isNew = funnelId === 'new' || !funnelId;
      
      const payload = {
        name: funnel.name,
        slug: funnel.name.toLowerCase().replace(/\s+/g, '-'),
        builder_document: funnel as any,
        settings: funnel.settings as any,
        status: 'draft',
        team_id: teamId,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('funnels')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('funnels')
          .update(payload)
          .eq('id', funnelId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success('Draft saved');
      queryClient.invalidateQueries({ queryKey: ['funnel-v3', data.id] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
    onError: (err: any) => {
      toast.error('Failed to save: ' + err.message);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!funnelRef.current || !teamId) throw new Error('Missing data');
      
      // First save, then publish
      await saveMutation.mutateAsync();
      
      const funnel = funnelRef.current;
      const { error } = await supabase
        .from('funnels')
        .update({
          status: 'published',
          published_document_snapshot: funnel as any,
        })
        .eq('id', funnelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Funnel published!');
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
    onError: (err: any) => {
      toast.error('Failed to publish: ' + err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load funnel</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!initialFunnel) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FunnelProvider initialFunnel={initialFunnel} onFunnelChange={handleFunnelChange}>
      <FunnelEditor />
    </FunnelProvider>
  );
}
