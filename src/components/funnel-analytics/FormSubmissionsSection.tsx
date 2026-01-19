/**
 * FormSubmissionsSection - Displays all funnel form submissions
 * 
 * Shows funnel_leads data with expandable answer rows, filters, and export.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Search, Download, ChevronDown, ChevronRight, Eye, 
  Mail, Phone, User, Calendar, CheckCircle, XCircle,
  Filter, RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { generateCSV, downloadCSV, FUNNEL_LEAD_COLUMNS } from '@/lib/csvExport';
import { cn } from '@/lib/utils';
import { SubmissionDetailDrawer } from './SubmissionDetailDrawer';

interface Funnel {
  id: string;
  name: string;
}

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  opt_in_status: boolean | null;
  answers: Record<string, any>;
  created_at: string;
  last_step_index: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  funnel: { id: string; name: string } | null;
}

interface FormSubmissionsSectionProps {
  teamId: string;
  funnels: Funnel[];
}

export function FormSubmissionsSection({ teamId, funnels }: FormSubmissionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<FunnelLead | null>(null);

  // Fetch all submissions
  const { data: submissions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['funnel-submissions', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_leads')
        .select('*, funnel:funnels(id, name)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FunnelLead[];
    },
    enabled: !!teamId,
  });

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    
    return submissions.filter(sub => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        sub.name?.toLowerCase().includes(searchLower) ||
        sub.email?.toLowerCase().includes(searchLower) ||
        sub.phone?.includes(searchQuery);

      // Funnel filter
      const matchesFunnel = selectedFunnelId === 'all' || sub.funnel?.id === selectedFunnelId;

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === 'complete') {
        matchesStatus = !!(sub.name && sub.email);
      } else if (selectedStatus === 'partial') {
        matchesStatus = !sub.name || !sub.email;
      } else if (selectedStatus === 'opted_in') {
        matchesStatus = sub.opt_in_status === true;
      }

      return matchesSearch && matchesFunnel && matchesStatus;
    });
  }, [submissions, searchQuery, selectedFunnelId, selectedStatus]);

  // Stats
  const stats = useMemo(() => {
    if (!submissions) return { total: 0, complete: 0, partial: 0, optedIn: 0 };
    
    const complete = submissions.filter(s => s.name && s.email).length;
    const optedIn = submissions.filter(s => s.opt_in_status).length;
    
    return {
      total: submissions.length,
      complete,
      partial: submissions.length - complete,
      optedIn,
    };
  }, [submissions]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportSubmissions = () => {
    if (!filteredSubmissions.length) return;
    
    const csv = generateCSV(filteredSubmissions, FUNNEL_LEAD_COLUMNS);
    downloadCSV(csv, `submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({ title: 'Submissions exported' });
  };

  const getStatusBadge = (submission: FunnelLead) => {
    const isComplete = submission.name && submission.email;
    
    if (isComplete) {
      return (
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-500/10">
        Partial
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Complete</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.complete}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Partial</p>
          <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Opted In</p>
          <p className="text-2xl font-bold text-blue-600">{stats.optedIn}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Funnels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funnels</SelectItem>
            {funnels.map(funnel => (
              <SelectItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="opted_in">Opted In</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>

        <Button variant="outline" onClick={exportSubmissions} disabled={!filteredSubmissions.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Funnel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opt-In</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading submissions...
                </TableCell>
              </TableRow>
            ) : filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <Collapsible key={submission.id} asChild open={expandedRows.has(submission.id)}>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild onClick={() => toggleRow(submission.id)}>
                          <button className="p-1">
                            {expandedRows.has(submission.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {submission.name && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{submission.name}</span>
                            </div>
                          )}
                          {submission.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {submission.email}
                            </div>
                          )}
                          {submission.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {submission.phone}
                            </div>
                          )}
                          {!submission.name && !submission.email && (
                            <span className="text-muted-foreground italic">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.funnel?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission)}</TableCell>
                      <TableCell>
                        {submission.opt_in_status ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(submission.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Form Answers</h4>
                            {Object.keys(submission.answers || {}).length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(submission.answers).map(([key, value]) => (
                                  <div key={key} className="bg-background rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm font-medium mt-1">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No additional answers</p>
                            )}
                            
                            {/* UTM Data */}
                            {(submission.utm_source || submission.utm_medium || submission.utm_campaign) && (
                              <div className="pt-3 border-t">
                                <h4 className="text-sm font-medium mb-2">UTM Tracking</h4>
                                <div className="flex gap-4 text-sm">
                                  {submission.utm_source && (
                                    <span className="text-muted-foreground">
                                      Source: <span className="text-foreground">{submission.utm_source}</span>
                                    </span>
                                  )}
                                  {submission.utm_medium && (
                                    <span className="text-muted-foreground">
                                      Medium: <span className="text-foreground">{submission.utm_medium}</span>
                                    </span>
                                  )}
                                  {submission.utm_campaign && (
                                    <span className="text-muted-foreground">
                                      Campaign: <span className="text-foreground">{submission.utm_campaign}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Drawer */}
      <SubmissionDetailDrawer
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}
