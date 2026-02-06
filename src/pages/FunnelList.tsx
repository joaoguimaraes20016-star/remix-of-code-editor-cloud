import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, ExternalLink, Edit, Trash2, Copy, Users, Search, 
  LayoutGrid, List, Link2, MoreHorizontal, Star, BarChart3,
  MessageSquare, Calendar, Download, TrendingUp, TrendingDown,
  Phone, Mail, CheckCircle, ArrowLeft, Globe, Settings,
  ChevronRight, Archive, FolderInput, Loader2, RefreshCw
} from 'lucide-react';
import { DomainsSection } from '@/components/funnel-builder/DomainsSection';
import { FunnelSettingsDialog } from '@/components/funnel-builder/FunnelSettingsDialog';
import { toast } from '@/hooks/use-toast';
import { CreateFunnelDialog } from '@/components/funnel-builder/CreateFunnelDialog';
import { useTeamRole } from '@/hooks/useTeamRole';
import { format, formatDistanceToNow, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateCSV, downloadCSV, FUNNEL_LEAD_COLUMNS, CONTACT_COLUMNS } from '@/lib/csvExport';
import { FunnelDropOffChart } from '@/components/funnel-analytics/FunnelDropOffChart';
import { LeadsVsVisitorsChart } from '@/components/funnel-analytics/LeadsVsVisitorsChart';
import { ContactDetailDrawer } from '@/components/funnel-analytics/ContactDetailDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  settings: {
    logo_url?: string;
    primary_color: string;
    background_color: string;
    button_text: string;
  };
  created_at: string;
  updated_at: string;
  lead_count?: number;
  published_document_snapshot?: Record<string, any> | null;
  builder_document?: Record<string, any> | null;
}

interface FunnelLead {
  id: string;
  funnel_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  opt_in_status: boolean | null;
  calendly_booking_data: any;
  created_at: string;
  answers: Record<string, any>;
  last_step_index: number | null;
  funnel: { name: string; id: string } | null;
}

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: { headline?: string; question?: string };
  funnel_id: string;
  name?: string;
}

// Analytics step interface for hybrid step extraction
interface AnalyticsStep {
  id: string;
  order_index: number;
  step_type: string;
  name: string;
  funnel_id: string;
}

// Extract steps from funnel snapshot (supports V3, FlowCanvas, and old formats)
function extractStepsFromFunnel(funnel: Funnel): AnalyticsStep[] {
  const snapshot = funnel.published_document_snapshot;
  
  if (!snapshot) return [];
  
  // V3 format (pages with blocks)
  if (typeof snapshot.version === 'number' && snapshot.version === 3 && Array.isArray(snapshot.pages)) {
    return snapshot.pages.map((page: any, idx: number) => ({
      id: page.id || `page-${idx}`,
      order_index: idx,
      step_type: 'page',
      name: page.name || `Page ${idx + 1}`,
      funnel_id: funnel.id,
    }));
  }
  
  // FlowCanvas format (steps with blocks)
  if (Array.isArray(snapshot.steps)) {
    return snapshot.steps.map((step: any, idx: number) => ({
      id: step.id || `step-${idx}`,
      order_index: idx,
      step_type: step.type || 'step',
      name: step.name || `Step ${idx + 1}`,
      funnel_id: funnel.id,
    }));
  }
  
  return []; // No snapshot = no steps
}

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  opt_in: boolean;
  source: string | null;
  calendly_booked_at: string | null;
  custom_fields: Record<string, any> | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

type TabType = 'funnels' | 'performance' | 'contacts' | 'domains';
type ViewMode = 'grid' | 'list';

export default function FunnelList() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useTeamRole(teamId);
  
  const [activeTab, setActiveTab] = useState<TabType>('funnels');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [funnelToDelete, setFunnelToDelete] = useState<Funnel | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [settingsFunnel, setSettingsFunnel] = useState<Funnel | null>(null);
  const [renameFunnel, setRenameFunnel] = useState<Funnel | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // === DIAGNOSTIC: Log tab state, teamId, and auth ===
  useEffect(() => {
    const runDiagnostic = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[DIAG] FunnelList mounted:', {
        teamId,
        activeTab,
        authUserId: session?.user?.id ?? 'NOT_AUTHENTICATED',
        authEmail: session?.user?.email ?? 'N/A',
      });

      // Quick check: can we read team_members for this team?
      if (teamId && session?.user?.id) {
        const { data: membership, error: membershipError } = await supabase
          .from('team_members')
          .select('id, role')
          .eq('team_id', teamId)
          .eq('user_id', session.user.id)
          .maybeSingle();
        console.log('[DIAG] Team membership check:', { membership, membershipError });

        // Quick check: count funnel_leads for this team
        const { count: leadCount, error: leadCountError } = await supabase
          .from('funnel_leads')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', teamId);
        console.log('[DIAG] funnel_leads count:', { leadCount, leadCountError });

        // Quick check: count contacts for this team
        const { count: contactCount, error: contactCountError } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', teamId);
        console.log('[DIAG] contacts count:', { contactCount, contactCountError });

        // Quick check: can_access_workspace via RPC (if it exists)
        const { data: canAccess, error: canAccessError } = await supabase
          .rpc('can_access_workspace', { _user_id: session.user.id, _team_id: teamId });
        console.log('[DIAG] can_access_workspace:', { canAccess, canAccessError });
      }
    };
    runDiagnostic();
  }, [teamId, activeTab]);

  // Fetch funnels with lead counts - optimized to avoid N+1 queries
  const { data: funnels, isLoading: funnelsLoading } = useQuery({
    queryKey: ['funnels', teamId],
    queryFn: async () => {
      // Fetch funnels with published_document_snapshot for V3 step extraction
      const { data: funnelsData, error: funnelsError } = await supabase
        .from('funnels')
        .select('id, team_id, name, slug, status, settings, domain_id, created_at, updated_at, created_by, published_document_snapshot, builder_document')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false });

      if (funnelsError) throw funnelsError;
      if (!funnelsData || funnelsData.length === 0) return [];

      // Fetch all lead counts in a single query grouped by funnel_id
      const funnelIds = funnelsData.map(f => f.id);
      const { data: leadCountsData, error: countsError } = await supabase
        .from('funnel_leads')
        .select('funnel_id')
        .in('funnel_id', funnelIds);

      if (countsError) throw countsError;

      // Aggregate counts by funnel_id
      const countsMap = new Map<string, number>();
      (leadCountsData || []).forEach(lead => {
        const funnelId = lead.funnel_id;
        countsMap.set(funnelId, (countsMap.get(funnelId) || 0) + 1);
      });

      // Combine funnels with their lead counts
      return funnelsData.map(funnel => ({
        ...funnel,
        settings: funnel.settings as unknown as Funnel['settings'],
        lead_count: countsMap.get(funnel.id) || 0,
      })) as Funnel[];
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent unnecessary refetches
  });

  // Fetch leads for performance and contacts - lazy loaded only when Performance tab is active
  const {
    data: leads,
    isLoading: leadsIsLoading,
    error: leadsError,
    isFetching: leadsIsFetching,
    refetch: refetchLeads,
    dataUpdatedAt: leadsUpdatedAt,
  } = useQuery({
    queryKey: ['funnel-leads', teamId],
    queryFn: async () => {
      console.log('[Performance] Fetching leads for teamId:', teamId);
      const { data, error } = await supabase
        .from('funnel_leads')
        .select('*, funnel:funnels(name, id)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      console.log('[Performance] Result:', {
        teamId,
        count: data?.length ?? 0,
        error: error ? { message: error.message, code: (error as any).code, details: (error as any).details, hint: (error as any).hint } : null,
        sample: data?.[0],
      });

      if (error) throw error;
      return data as FunnelLead[];
    },
    enabled: !!teamId && activeTab === 'performance', // Only load when Performance tab is active
    staleTime: 0, // Always consider data stale to allow polling
    refetchInterval: 5000, // Auto-refresh every 5 seconds when tab is active
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  // Extract steps from funnel snapshots (supports V3, FlowCanvas, and old formats)
  // For old funnels without snapshots, fall back to funnel_steps table
  const { data: oldSteps } = useQuery({
    queryKey: ['funnel-steps', teamId],
    queryFn: async () => {
      if (!funnels?.length) return [];
      
      const funnelIds = funnels.map(f => f.id);
      const { data, error } = await supabase
        .from('funnel_steps')
        .select('*')
        .in('funnel_id', funnelIds)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FunnelStep[];
    },
    enabled: !!funnels?.length && activeTab === 'performance', // Only load when Performance tab is active
  });

  // Compute steps from snapshots (V3/FlowCanvas) and merge with old steps
  const allSteps = useMemo(() => {
    if (!funnels?.length) return [];
    
    const snapshotSteps = funnels.flatMap(f => extractStepsFromFunnel(f));
    const oldStepsData = oldSteps || [];
    
    // Merge: snapshot steps take precedence, old steps fill gaps
    const stepsMap = new Map<string, AnalyticsStep>();
    
    // Add snapshot steps first
    snapshotSteps.forEach(step => {
      stepsMap.set(`${step.funnel_id}-${step.order_index}`, step);
    });
    
    // Add old steps for funnels without snapshots
    oldStepsData.forEach(step => {
      const key = `${step.funnel_id}-${step.order_index}`;
      if (!stepsMap.has(key)) {
        stepsMap.set(key, {
          id: step.id,
          order_index: step.order_index,
          step_type: step.step_type,
          name: step.content?.headline || step.content?.question || `Step ${step.order_index + 1}`,
          funnel_id: step.funnel_id,
        });
      }
    });
    
    return Array.from(stepsMap.values()).sort((a, b) => {
      if (a.funnel_id !== b.funnel_id) return a.funnel_id.localeCompare(b.funnel_id);
      return a.order_index - b.order_index;
    });
  }, [funnels, oldSteps]);

  // Fetch contacts - lazy loaded only when Contacts tab is active
  const {
    data: contacts,
    isLoading: contactsLoading,
    isFetching: contactsFetching,
    error: contactsError,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['contacts', teamId, selectedFunnelId],
    queryFn: async () => {
      console.log('[Contacts] teamId:', teamId, 'selectedFunnelId:', selectedFunnelId);

      // Filter by funnel if specific funnel is selected
      if (selectedFunnelId && selectedFunnelId !== 'all') {
        // Get funnel_lead_ids for the selected funnel
        const { data: funnelLeadIds } = await supabase
          .from('funnel_leads')
          .select('id')
          .eq('funnel_id', selectedFunnelId);
        
        if (!funnelLeadIds || funnelLeadIds.length === 0) {
          console.log('[Contacts] No leads for funnel:', selectedFunnelId);
          return [];
        }

        const ids = funnelLeadIds.map(fl => fl.id);
        const { data, error } = await supabase
          .from('contacts')
          .select(`
  id,
  team_id,
  name,
  email,
  phone,
  opt_in,
  source,
  calendly_booked_at,
  custom_fields,
  tags,
  funnel_lead_id,
  created_at,
  updated_at
`)
          .eq('team_id', teamId)
          .in('funnel_lead_id', ids)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Contact[];
      }

      // Show all contacts when "All Funnels" is selected
      const { data, error } = await supabase
        .from('contacts')
        .select(`
  id,
  team_id,
  name,
  email,
  phone,
  opt_in,
  source,
  calendly_booked_at,
  custom_fields,
  tags,
  funnel_lead_id,
  created_at,
  updated_at
`)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      console.log('[Contacts] query:', {
        select:
          'id, team_id, display_name, name:display_name, primary_email_normalized, email:primary_email_normalized, primary_phone_normalized, phone:primary_phone_normalized, opt_in, source, calendly_booked_at, custom_fields, tags, created_at, updated_at',
        order: 'created_at.desc',
      });

      console.log('[Contacts] result:', {
        teamId,
        count: data?.length ?? 0,
        error,
        errorJson: error
          ? {
              message: error.message,
              details: (error as any).details,
              hint: (error as any).hint,
              code: (error as any).code,
              status: (error as any).status,
            }
          : null,
        sample: data?.[0],
      });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!teamId && activeTab === 'contacts', // Only load when Contacts tab is active
    staleTime: 0, // Always consider data stale to allow polling
    refetchInterval: 5000, // Auto-refresh every 5 seconds when tab is active
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });


 const deleteMutation = useMutation({
  mutationFn: async (funnelId: string) => {
      const { data, error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId)
        .eq('team_id', teamId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Delete blocked by RLS or insufficient permissions');
      }

      return funnelId;
  },

  onMutate: async (funnelId: string) => {
    await queryClient.cancelQueries({
      queryKey: ['funnels', teamId],
    });

    const previousFunnels = queryClient.getQueryData<any[]>([
      'funnels',
      teamId,
    ]);

    queryClient.setQueryData<any[]>(
      ['funnels', teamId],
      (old) => old?.filter((f) => f.id !== funnelId) ?? []
    );

    return { previousFunnels };
  },

  onError: (_error, _funnelId, context) => {
    if (context?.previousFunnels) {
      queryClient.setQueryData(
        ['funnels', teamId],
        context.previousFunnels
      );
    }

    toast({
      title: 'Failed to delete funnel',
      variant: 'destructive',
    });
  },

  onSettled: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['funnels', teamId],
      exact: true,
    });
  },

  onSuccess: () => {
    toast({ title: 'Funnel deleted' });
    setFunnelToDelete(null);
  },
});


  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('team_id', teamId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Delete blocked by RLS or insufficient permissions');
      }

      return contactId;
    },

    onMutate: async (contactId: string) => {
      await queryClient.cancelQueries({
        queryKey: ['contacts', teamId, selectedFunnelId],
      });

      const previousContacts = queryClient.getQueryData<Contact[]>([
        'contacts',
        teamId,
        selectedFunnelId,
      ]);

      queryClient.setQueryData<Contact[]>(
        ['contacts', teamId, selectedFunnelId],
        (old) => old?.filter((c) => c.id !== contactId) ?? []
      );

      return { previousContacts };
    },

    onError: (_error, _contactId, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(
          ['contacts', teamId, selectedFunnelId],
          context.previousContacts
        );
      }

      toast({
        title: 'Failed to delete contact',
        variant: 'destructive',
      });
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['contacts', teamId, selectedFunnelId],
      });
    },

    onSuccess: () => {
      toast({ title: 'Contact deleted' });
      setContactToDelete(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('funnels')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['funnels', teamId],
        exact: true,
      });

      await queryClient.refetchQueries({
        queryKey: ['funnels', teamId],
        exact: true,
      });
      toast({ title: 'Funnel renamed' });
      setRenameFunnel(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to rename', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (funnel: Funnel) => {
      // Create new funnel
      const newSlug = `${funnel.slug}-copy-${Date.now().toString(36)}`;
      const { data: newFunnel, error: funnelError } = await supabase
        .from('funnels')
        .insert({
          name: `${funnel.name} (Copy)`,
          slug: newSlug,
          team_id: teamId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          settings: funnel.settings,
          status: 'draft',
          // Copy V3 documents if they exist
          builder_document: funnel.builder_document || null,
          published_document_snapshot: funnel.published_document_snapshot || null,
        })
        .select()
        .single();

      if (funnelError) throw funnelError;

      // Only copy funnel_steps for old funnels without snapshots
      // V3 funnels store everything in builder_document/published_document_snapshot
      if (!funnel.published_document_snapshot && !funnel.builder_document) {
        const { data: steps } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnel.id)
          .order('order_index');

        if (steps?.length) {
          const { error: stepsError } = await supabase
            .from('funnel_steps')
            .insert(
              steps.map(step => ({
                funnel_id: newFunnel.id,
                step_type: step.step_type,
                order_index: step.order_index,
                content: step.content,
              }))
            );
          if (stepsError) throw stepsError;
        }
      }

      return newFunnel;
    },
    onSuccess: async (newFunnel) => {
      await queryClient.invalidateQueries({
        queryKey: ['funnels', teamId],
        exact: true,
      });

      await queryClient.refetchQueries({
        queryKey: ['funnels', teamId],
        exact: true,
      });
      toast({ title: 'Funnel duplicated' });
      navigate(`/team/${teamId}/funnels/${newFunnel.id}/edit`);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to duplicate', description: error.message, variant: 'destructive' });
    },
  });

  const copyFunnelUrl = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'URL copied to clipboard' });
  };

  // Helper: A "contact" has ANY contact field: name OR phone OR email
  const isContact = (lead: FunnelLead) => !!(lead.name || lead.phone || lead.email);
  
  // Calculate performance stats with real percentage changes
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const twoDaysAgo = startOfDay(subDays(now, 2));
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  const monthAgo = subDays(now, 30);
  const twoMonthsAgo = subDays(now, 60);

  // Filter to contacts (anyone with ANY contact field)
  const contactLeads = leads?.filter(isContact) || [];
  
  // Current period - CONTACTS (called "Leads" in Performance tab)
  const todayLeads = contactLeads.filter(l => new Date(l.created_at) >= todayStart).length;
  const weekLeads = contactLeads.filter(l => new Date(l.created_at) >= weekAgo).length;
  const monthLeads = contactLeads.filter(l => new Date(l.created_at) >= monthAgo).length;
  const totalLeads = contactLeads.length;

  // Visitors (started but no contact info)
  const totalVisitors = (leads?.length || 0) - contactLeads.length;
  const todayVisitors = (leads?.filter(l => new Date(l.created_at) >= todayStart).length || 0) - todayLeads;
  const weekVisitors = (leads?.filter(l => new Date(l.created_at) >= weekAgo).length || 0) - weekLeads;

  // Previous period leads for comparison (contacts)
  const yesterdayLeads = contactLeads.filter(l => {
    const date = new Date(l.created_at);
    return date >= twoDaysAgo && date < yesterdayStart;
  }).length;
  
  const previousWeekLeads = contactLeads.filter(l => {
    const date = new Date(l.created_at);
    return date >= twoWeeksAgo && date < weekAgo;
  }).length;
  
  const previousMonthLeads = contactLeads.filter(l => {
    const date = new Date(l.created_at);
    return date >= twoMonthsAgo && date < monthAgo;
  }).length;

  // Calculate percentage changes
  const calcPercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const todayChange = calcPercentChange(todayLeads, yesterdayLeads);
  const weekChange = calcPercentChange(weekLeads, previousWeekLeads);
  const monthChange = calcPercentChange(monthLeads, previousMonthLeads);
  
  // Conversion rate: contacts / total visitors
  const conversionRate = leads?.length ? Math.round((contactLeads.length / leads.length) * 100) : 0;

  const optedInContacts = contacts?.filter(c => c.opt_in).length || 0;
  const bookedContacts = contacts?.filter(c => c.calendly_booked_at).length || 0;

  // Contact time-based metrics
  const todayContacts = contacts?.filter(c => new Date(c.created_at) >= todayStart).length || 0;
  const yesterdayContacts = contacts?.filter(c => {
    const date = new Date(c.created_at);
    return date >= twoDaysAgo && date < yesterdayStart;
  }).length || 0;

  const weekContacts = contacts?.filter(c => new Date(c.created_at) >= weekAgo).length || 0;
  const previousWeekContacts = contacts?.filter(c => {
    const date = new Date(c.created_at);
    return date >= twoWeeksAgo && date < weekAgo;
  }).length || 0;

  const monthContacts = contacts?.filter(c => new Date(c.created_at) >= monthAgo).length || 0;
  const previousMonthContacts = contacts?.filter(c => {
    const date = new Date(c.created_at);
    return date >= twoMonthsAgo && date < monthAgo;
  }).length || 0;

  const optInRate = contacts?.length ? Math.round((optedInContacts / contacts.length) * 100) : 0;

  // Percentage changes for contacts
  const todayContactsChange = yesterdayContacts > 0 
    ? Math.round(((todayContacts - yesterdayContacts) / yesterdayContacts) * 100) 
    : todayContacts > 0 ? 100 : 0;

  const weekContactsChange = previousWeekContacts > 0
    ? Math.round(((weekContacts - previousWeekContacts) / previousWeekContacts) * 100)
    : weekContacts > 0 ? 100 : 0;

  const monthContactsChange = previousMonthContacts > 0
    ? Math.round(((monthContacts - previousMonthContacts) / previousMonthContacts) * 100)
    : monthContacts > 0 ? 100 : 0;

  const leadsLastUpdatedLabel = leadsUpdatedAt
    ? formatDistanceToNow(new Date(leadsUpdatedAt), { addSuffix: true })
    : null;

  // Filter funnels by search and role (non-admins only see published)
  const filteredFunnels = funnels?.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const canSee = isAdmin || f.status === 'published';
    return matchesSearch && canSee;
  });

  // Export functions
  const exportLeads = () => {
    if (!leads?.length) return;
    const csv = generateCSV(leads, FUNNEL_LEAD_COLUMNS);
    downloadCSV(csv, `funnel-leads-${format(now, 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Leads exported' });
  };

  const exportContacts = () => {
    if (!contacts?.length) return;
    const csv = generateCSV(contacts, CONTACT_COLUMNS);
    downloadCSV(csv, `contacts-${format(now, 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Contacts exported' });
  };

  const handleViewInPipeline = async (contact: Contact) => {
    if (!teamId) return;

    const anyContact = contact as any;
    const funnelLead = anyContact.funnel_lead as { id?: string; contact_id?: string } | undefined;
    const leadId = funnelLead?.id ?? null;
    const pipelineContactId = funnelLead?.contact_id ?? null;

    try {
      let appointmentId: string | null = null;

      if (pipelineContactId) {
        // Use any type to avoid deep type instantiation issues
        const { data: byContact, error: byContactError } = await (supabase as any)
          .from('appointments')
          .select('id')
          .eq('team_id', teamId)
          .eq('contact_id', pipelineContactId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!byContactError && byContact && byContact.length > 0) {
          appointmentId = byContact[0].id as string;
        }
      }

      if (!appointmentId && (contact.email || contact.phone)) {
        const orConditions: string[] = [];
        if (contact.email) {
          orConditions.push(`lead_email.eq.${contact.email}`);
        }
        if (contact.phone) {
          orConditions.push(`lead_phone.eq.${contact.phone}`);
        }

        if (orConditions.length > 0) {
          const { data: byIdentity, error: byIdentityError } = await supabase
            .from('appointments')
            .select('id')
            .eq('team_id', teamId)
            .or(orConditions.join(','))
            .order('created_at', { ascending: false })
            .limit(1);

          if (!byIdentityError && byIdentity && byIdentity.length > 0) {
            appointmentId = byIdentity[0].id as string;
          }
        }
      }

      if (appointmentId) {
        const focusContact = pipelineContactId || contact.id;
        navigate(
          `/team/${teamId}/crm?tab=pipeline&teamId=${teamId}&focusContactId=${focusContact}&focus=appointment&appointment_id=${appointmentId}`
        );
        return;
      }

      if (leadId) {
        navigate(
          `/team/${teamId}/crm?tab=pipeline&teamId=${teamId}&focusContactId=${contact.id}&focus=lead&lead_id=${leadId}`
        );
      } else {
        navigate(
          `/team/${teamId}/crm?tab=pipeline&teamId=${teamId}&focusContactId=${contact.id}`
        );
      }
    } catch (error) {
      console.error('[FunnelList] Error resolving pipeline view for contact:', error);
      if (leadId) {
        navigate(
          `/team/${teamId}/crm?tab=pipeline&teamId=${teamId}&focusContactId=${contact.id}&focus=lead&lead_id=${leadId}`
        );
      } else {
        navigate(
          `/team/${teamId}/crm?tab=pipeline&teamId=${teamId}&focusContactId=${contact.id}`
        );
      }
    }
  };

  // Tabs - only admins see domains
  const tabs = [
    { id: 'funnels' as const, label: 'Funnels', icon: LayoutGrid, adminOnly: false },
    { id: 'performance' as const, label: 'Performance', icon: BarChart3, adminOnly: false },
    { id: 'contacts' as const, label: 'Contacts', icon: Users, adminOnly: false },
    { id: 'domains' as const, label: 'Domains', icon: Globe, adminOnly: true },
  ].filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            {/* Back Button */}
            <button
              onClick={() => navigate(`/team/${teamId}`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Team Hub</span>
            </button>
            
            {/* Tabs */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Spacer for balance */}
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Funnels Tab */}
        {activeTab === 'funnels' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">All Funnels</h1>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search funnels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-l-lg transition-colors",
                      viewMode === 'list' ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-r-lg transition-colors",
                      viewMode === 'grid' ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
                
                {isAdmin && (
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    New Funnel
                  </Button>
                )}
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFunnels?.map((funnel) => (
                  <div
                    key={funnel.id}
                    className={cn(
                      "group bg-card border rounded-xl overflow-hidden transition-all",
                      isAdmin ? "hover:shadow-lg cursor-pointer" : ""
                    )}
                    onClick={() => isAdmin && navigate(`/team/${teamId}/funnels/${funnel.id}/edit`)}
                  >
                    {/* Thumbnail */}
                    <div 
                      className="aspect-video flex items-center justify-center relative"
                      style={{ backgroundColor: funnel.settings.background_color || '#1a1a2e' }}
                    >
                      {funnel.settings.logo_url ? (
                        <img 
                          src={funnel.settings.logo_url} 
                          alt={funnel.name}
                          className="max-w-[60%] max-h-[60%] object-contain"
                        />
                      ) : (
                        <span className="text-white/50 text-lg font-bold">{funnel.name.charAt(0)}</span>
                      )}
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1 truncate">{funnel.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Last edited {formatDistanceToNow(new Date(funnel.updated_at), { addSuffix: true })}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyFunnelUrl(funnel.slug); }}
                            className="p-1.5 rounded-md border hover:bg-muted transition-colors"
                          >
                            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              funnel.status === 'published' 
                                ? "border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" 
                                : "border-muted"
                            )}
                          >
                            {funnel.status === 'published' ? 'Live' : 'Draft'}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-500/10">
                            {funnel.lead_count} {funnel.lead_count === 1 ? 'Contact' : 'Contacts'}
                          </Badge>
                        </div>
                        
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="p-1 rounded hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/team/${teamId}/funnels/${funnel.id}/edit`);
                              }}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Funnel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFunnelId(funnel.id);
                                setActiveTab('contacts');
                              }}>
                                <Users className="h-4 w-4 mr-2" /> Contacts
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFunnelId(funnel.id);
                                setActiveTab('performance');
                              }}>
                                <BarChart3 className="h-4 w-4 mr-2" /> Metrics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSettingsFunnel(funnel);
                              }}>
                                <Settings className="h-4 w-4 mr-2" /> Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setRenameFunnel(funnel);
                                setRenameValue(funnel.name);
                              }}>
                                <Edit className="h-4 w-4 mr-2" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                duplicateMutation.mutate(funnel);
                              }}>
                                <Copy className="h-4 w-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <FolderInput className="h-4 w-4 mr-2" /> Move to
                                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFunnelToDelete(funnel);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-card border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Name</TableHead>
                      <TableHead>Favorite</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead className="w-[200px]">Progress</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFunnels?.map((funnel) => (
                      <TableRow 
                        key={funnel.id} 
                        className={cn(
                          "hover:bg-muted/50",
                          isAdmin ? "cursor-pointer" : ""
                        )}
                        onClick={() => isAdmin && navigate(`/team/${teamId}/funnels/${funnel.id}/edit`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                              style={{ backgroundColor: funnel.settings.background_color || '#1a1a2e' }}
                            >
                              {funnel.settings.logo_url ? (
                                <img src={funnel.settings.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white/50 text-sm font-bold">{funnel.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{funnel.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Last updated {formatDistanceToNow(new Date(funnel.updated_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isAdmin && (
                            <button className="text-amber-400 hover:text-amber-500">
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                funnel.status === 'published' 
                                  ? "border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" 
                                  : "border-muted"
                              )}
                            >
                              {funnel.status === 'published' ? 'Live' : 'Draft'}
                            </Badge>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyFunnelUrl(funnel.slug); }}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {funnel.lead_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (funnel.lead_count || 0) * 5)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/team/${teamId}/funnels/${funnel.id}/edit`);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit Funnel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFunnelId(funnel.id);
                                  setActiveTab('contacts');
                                }}>
                                  <Users className="h-4 w-4 mr-2" /> Contacts
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFunnelId(funnel.id);
                                  setActiveTab('performance');
                                }}>
                                  <BarChart3 className="h-4 w-4 mr-2" /> Metrics
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSettingsFunnel(funnel);
                                }}>
                                  <Settings className="h-4 w-4 mr-2" /> Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameFunnel(funnel);
                                  setRenameValue(funnel.name);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateMutation.mutate(funnel);
                                }}>
                                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFunnelToDelete(funnel);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredFunnels?.length === 0 && !funnelsLoading && (
              <div className="text-center py-16 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No funnels yet</h3>
                <p className="mb-4">Create your first funnel to start capturing leads</p>
                {isAdmin && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Funnel
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">Performance</h1>
              <div className="flex items-center gap-3">
                <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Funnels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funnels</SelectItem>
                    {funnels?.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id}>{funnel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => refetchLeads()}
                  disabled={leadsIsFetching}
                >
                  {leadsIsFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
                {isAdmin && (
                  <Button variant="outline" onClick={exportLeads} disabled={!leads?.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Leads
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {leadsIsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {leadsError && (
              <div className="text-center py-12 text-destructive">
                <p className="font-medium mb-2">Failed to load performance data</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {leadsError instanceof Error ? leadsError.message : 'An unknown error occurred'}
                </p>
                <Button variant="outline" onClick={() => refetchLeads()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Content - only show when not loading and no error */}
            {!leadsIsLoading && !leadsError && (
              <>
            {/* Clean Compact Stats - Conversion Focus */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Today */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Today</div>
                <div className="text-3xl font-bold">{todayLeads} Leads</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {yesterdayLeads > 0 ? (
                    <span className={todayChange >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      • {todayChange >= 0 ? '+' : ''}{todayChange}% vs. yesterday
                    </span>
                  ) : (
                    '• 0% vs. yesterday'
                  )}
                </div>
              </div>

              {/* Last 7 days */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Last 7 days</div>
                <div className="text-3xl font-bold">{weekLeads} Leads</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {previousWeekLeads > 0 ? (
                    <span className={weekChange >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      • {weekChange >= 0 ? '+' : ''}{weekChange}% vs. 7 days ago
                    </span>
                  ) : (
                    '• 0% vs. 7 days ago'
                  )}
                </div>
              </div>

              {/* Last 30 days */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Last 30 days</div>
                <div className="text-3xl font-bold">{monthLeads} Leads</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {previousMonthLeads > 0 ? (
                    <span className={monthChange >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      • {monthChange >= 0 ? '+' : ''}{monthChange}% vs. 30 days ago
                    </span>
                  ) : (
                    '• 0% vs. 30 days ago'
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Total</div>
                <div className="text-3xl font-bold">{totalLeads} Leads</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {conversionRate.toFixed(2)}% of all visitors
                </div>
              </div>
            </div>

            {/* Leads vs. Visitors Chart */}
            <div className="mb-8">
              <LeadsVsVisitorsChart 
                leads={selectedFunnelId === 'all' 
                  ? (leads || [])
                  : (leads || []).filter(l => (l.funnel?.id || l.funnel_id) === selectedFunnelId)
                }
                selectedFunnelId={selectedFunnelId}
                steps={selectedFunnelId !== 'all' && allSteps 
                  ? allSteps.filter(s => s.funnel_id === selectedFunnelId)
                  : undefined
                }
                funnelName={selectedFunnelId !== 'all' 
                  ? funnels?.find(f => f.id === selectedFunnelId)?.name
                  : undefined
                }
              />
            </div>
              </>
            )}

          </>
        )}


        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <>
            {console.log('[Contacts] render:', {
              teamId,
              isLoading: contactsLoading,
              isFetching: contactsFetching,
              error: contactsError,
              rows: contacts?.length ?? 0,
            })}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => refetchContacts()}
                  disabled={contactsFetching}
                >
                  {contactsFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
                {isAdmin && (
                  <Button variant="outline" onClick={exportContacts} disabled={!contacts?.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to CRM
                  </Button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {contactsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {contactsError && (
              <div className="text-center py-12 text-destructive">
                <p className="font-medium mb-2">Failed to load contacts</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {contactsError instanceof Error ? contactsError.message : 'An unknown error occurred'}
                </p>
                <Button variant="outline" onClick={() => refetchContacts()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Content - only show when not loading and no error */}
            {!contactsLoading && !contactsError && (
              <>
            {/* Contact Stats - Compact n8n-style */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Today */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Today</div>
                <div className="text-3xl font-bold">{todayContacts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {todayContactsChange > 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.abs(todayContactsChange)}% vs. yesterday
                    </span>
                  ) : todayContactsChange < 0 ? (
                    <span className="text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {Math.abs(todayContactsChange)}% vs. yesterday
                    </span>
                  ) : (
                    '• 0% vs. yesterday'
                  )}
                </div>
              </div>

              {/* Last 7 Days */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Last 7 Days</div>
                <div className="text-3xl font-bold">{weekContacts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {weekContactsChange > 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.abs(weekContactsChange)}% vs. previous week
                    </span>
                  ) : weekContactsChange < 0 ? (
                    <span className="text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {Math.abs(weekContactsChange)}% vs. previous week
                    </span>
                  ) : (
                    '• 0% vs. previous week'
                  )}
                </div>
              </div>

              {/* Last 30 Days */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Last 30 Days</div>
                <div className="text-3xl font-bold">{monthContacts}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {monthContactsChange > 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.abs(monthContactsChange)}% vs. previous month
                    </span>
                  ) : monthContactsChange < 0 ? (
                    <span className="text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {Math.abs(monthContactsChange)}% vs. previous month
                    </span>
                  ) : (
                    '• 0% vs. previous month'
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="bg-card border rounded-lg p-5">
                <div className="text-sm text-muted-foreground mb-1">Total</div>
                <div className="text-3xl font-bold">{contacts?.length || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  all-time total
                </div>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Funnel</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts && contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No contacts found</p>
                        <p className="text-sm mt-1">Contacts will appear here when leads submit your funnels</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts?.map((contact) => {
                      // Extract funnel name from source
                      const funnelName = contact.source?.replace('Funnel: ', '') || 'Direct';
                      const isFromFunnel = contact.source?.startsWith('Funnel: ');
                      const initials = contact.name?.charAt(0)?.toUpperCase() || contact.email?.charAt(0)?.toUpperCase() || '?';
                      const displayName = contact.name || contact.email || contact.phone || '—';
                      
                      return (
                        <TableRow 
                          key={contact.id}
                          className="h-12 cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <TableCell className="py-2 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary flex-shrink-0">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">
                                  {contact.name || contact.email || contact.phone || '—'}
                                </span>
                                {(contact.email || contact.phone) && contact.name && (
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    {contact.email && (
                                      <span className="text-xs text-muted-foreground truncate">{contact.email}</span>
                                    )}
                                    {contact.phone && (
                                      <span className="text-xs text-muted-foreground truncate">{contact.phone}</span>
                                    )}
                                  </div>
                                )}
                                {!contact.name && contact.email && contact.phone && (
                                  <span className="text-xs text-muted-foreground truncate">{contact.phone}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {isFromFunnel ? (
                              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/50">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                {funnelName}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Direct
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContactToDelete(contact);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                    </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
              </>
            )}
          </>
        )}

        {/* Contact Detail Drawer */}
        <ContactDetailDrawer 
          contact={selectedContact}
          open={!!selectedContact}
          onOpenChange={(open) => !open && setSelectedContact(null)}
          teamId={teamId}
        />

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <DomainsSection teamId={teamId!} />
        )}

      </div>

      <CreateFunnelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        teamId={teamId!}
        onSuccess={(funnelId) => {
          setShowCreateDialog(false);
          navigate(`/team/${teamId}/funnels/${funnelId}/edit`);
        }}
      />

      <AlertDialog open={!!funnelToDelete} onOpenChange={() => setFunnelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Funnel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{funnelToDelete?.name}"? This will also delete all leads captured by this funnel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => funnelToDelete && deleteMutation.mutate(funnelToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contact Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contactToDelete?.name || contactToDelete?.email || 'this contact'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && deleteContactMutation.mutate(contactToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameFunnel} onOpenChange={() => setRenameFunnel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Funnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="funnel-name">Name</Label>
              <Input
                id="funnel-name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="My Funnel"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim() && renameFunnel) {
                    renameMutation.mutate({ id: renameFunnel.id, name: renameValue.trim() });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFunnel(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => renameFunnel && renameMutation.mutate({ id: renameFunnel.id, name: renameValue.trim() })}
              disabled={!renameValue.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      {settingsFunnel && (
        <FunnelSettingsDialog
          open={!!settingsFunnel}
          onOpenChange={() => setSettingsFunnel(null)}
          funnel={settingsFunnel as any}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['funnels', teamId] });
            setSettingsFunnel(null);
          }}
        />
      )}
    </div>
  );
}
