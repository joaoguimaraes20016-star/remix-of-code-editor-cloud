import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityTracker } from "./ActivityTracker";
import { EODReportsHub } from "./EODReportsHub";
import { MonthlyCommissionReport } from "./MonthlyCommissionReport";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, AlertCircle, TrendingUp, DollarSign, Users, RefreshCw, ChevronDown, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppointmentsBookedBreakdown } from "@/components/AppointmentsBookedBreakdown";

interface AdminOverviewProps {
  teamId: string;
}

interface TaskSummary {
  overdue: number;
  dueToday: number;
  upcoming: number;
  overdueSetters: number;
  overdueClosers: number;
  dueTodaySetters: number;
  dueTodayClosers: number;
}

interface PerformanceMetrics {
  closeRate: number;
  showRate: number;
  totalRevenue: number;
  totalCommissions: number;
  activeDeals: number;
  totalMRR: number;
}

interface LeaderboardEntry {
  name: string;
  sales: number;
  revenue: number;
  commission: number;
}

export function AdminOverview({ teamId }: AdminOverviewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    overdueSetters: 0,
    overdueClosers: 0,
    dueTodaySetters: 0,
    dueTodayClosers: 0,
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    closeRate: 0,
    showRate: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    activeDeals: 0,
    totalMRR: 0,
  });
  const [topSetters, setTopSetters] = useState<LeaderboardEntry[]>([]);
  const [topClosers, setTopClosers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadOverviewData();

    const channel = supabase
      .channel(`admin-overview-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `team_id=eq.${teamId}` }, loadOverviewData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmation_tasks', filter: `team_id=eq.${teamId}` }, loadOverviewData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions', filter: `team_id=eq.${teamId}` }, loadOverviewData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    setCurrentUserName(data?.full_name || 'Admin');
  };

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTaskSummary(),
        loadPerformanceMetrics(),
        loadLeaderboards(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskSummary = async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Load confirmation tasks
    const { data: tasks } = await supabase
      .from('confirmation_tasks')
      .select('*, appointment:appointments(start_at_utc, setter_id, closer_id)')
      .eq('team_id', teamId)
      .eq('status', 'pending');

    // Load MRR tasks
    const { data: mrrTasks } = await supabase
      .from('mrr_follow_up_tasks')
      .select('due_date')
      .eq('team_id', teamId)
      .eq('status', 'due');

    let overdue = 0, dueToday = 0, upcoming = 0;
    let overdueSetters = 0, overdueClosers = 0, dueTodaySetters = 0, dueTodayClosers = 0;

    tasks?.forEach(task => {
      const aptTime = new Date(task.appointment?.start_at_utc);
      const isOverdue = aptTime < now;
      const isDueToday = aptTime >= today && aptTime < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const isUpcoming = aptTime >= new Date(today.getTime() + 24 * 60 * 60 * 1000) && aptTime <= sevenDaysFromNow;

      if (isOverdue) {
        overdue++;
        if (task.appointment?.setter_id) overdueSetters++;
        if (task.appointment?.closer_id) overdueClosers++;
      } else if (isDueToday) {
        dueToday++;
        if (task.appointment?.setter_id) dueTodaySetters++;
        if (task.appointment?.closer_id) dueTodayClosers++;
      } else if (isUpcoming) {
        upcoming++;
      }
    });

    mrrTasks?.forEach(task => {
      const dueDate = new Date(task.due_date);
      if (dueDate < today) overdue++;
      else if (dueDate.toDateString() === today.toDateString()) dueToday++;
      else if (dueDate <= sevenDaysFromNow) upcoming++;
    });

    setTaskSummary({ overdue, dueToday, upcoming, overdueSetters, overdueClosers, dueTodaySetters, dueTodayClosers });
  };

  const loadPerformanceMetrics = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('status, revenue, cc_collected')
      .eq('team_id', teamId)
      .gte('created_at', startOfMonth.toISOString());

    const { data: mrrSchedules } = await supabase
      .from('mrr_schedules')
      .select('mrr_amount')
      .eq('team_id', teamId)
      .eq('status', 'active');

    const total = appointments?.length || 0;
    const closed = appointments?.filter(a => a.status === 'CLOSED').length || 0;
    const showed = appointments?.filter(a => a.status !== 'NO_SHOW' && a.status !== 'CANCELLED').length || 0;
    const totalRevenue = appointments?.reduce((sum, a) => sum + (Number(a.cc_collected) || 0), 0) || 0;
    const totalCommissions = appointments?.reduce((sum, a) => {
      const revenue = Number(a.cc_collected) || 0;
      return sum + (revenue * 0.15); // Approximate 15% total commission
    }, 0) || 0;
    const activeDeals = appointments?.filter(a => a.status !== 'CLOSED' && a.status !== 'NO_SHOW' && a.status !== 'CANCELLED').length || 0;
    const totalMRR = mrrSchedules?.reduce((sum, s) => sum + (s.mrr_amount || 0), 0) || 0;

    setMetrics({
      closeRate: total > 0 ? (closed / total) * 100 : 0,
      showRate: total > 0 ? (showed / total) * 100 : 0,
      totalRevenue,
      totalCommissions,
      activeDeals,
      totalMRR,
    });
  };

  const loadLeaderboards = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: closedAppointments } = await supabase
      .from('appointments')
      .select('closer_id, closer_name, setter_id, setter_name, cc_collected')
      .eq('team_id', teamId)
      .eq('status', 'CLOSED')
      .gte('created_at', startOfMonth.toISOString());

    const setterMap = new Map<string, { name: string; sales: number; commission: number; revenue: number }>();
    const closerMap = new Map<string, { name: string; sales: number; commission: number; revenue: number }>();

    closedAppointments?.forEach(apt => {
      const revenue = Number(apt.cc_collected) || 0;
      
      if (apt.setter_id && apt.setter_name && revenue > 0) {
        const existing = setterMap.get(apt.setter_id) || { name: apt.setter_name, sales: 0, commission: 0, revenue: 0 };
        existing.sales++;
        existing.commission += revenue * 0.05; // 5% setter commission
        existing.revenue += revenue;
        setterMap.set(apt.setter_id, existing);
      }
      
      if (apt.closer_id && apt.closer_name && revenue > 0) {
        const existing = closerMap.get(apt.closer_id) || { name: apt.closer_name, sales: 0, commission: 0, revenue: 0 };
        existing.sales++;
        existing.commission += revenue * 0.10; // 10% closer commission
        existing.revenue += revenue;
        closerMap.set(apt.closer_id, existing);
      }
    });

    const setters = Array.from(setterMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 5);
    const closers = Array.from(closerMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    setTopSetters(setters);
    setTopClosers(closers);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Always Visible: Action Items */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={taskSummary.overdue > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className={`h-4 w-4 ${taskSummary.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{taskSummary.overdue}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Setters: {taskSummary.overdueSetters}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Closers: {taskSummary.overdueClosers}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className={taskSummary.dueToday > 0 ? "border-warning" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <CalendarClock className={`h-4 w-4 ${taskSummary.dueToday > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{taskSummary.dueToday}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Setters: {taskSummary.dueTodaySetters}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Closers: {taskSummary.dueTodayClosers}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (Next 7 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{taskSummary.upcoming}</div>
            <p className="text-xs text-muted-foreground mt-2">Tasks scheduled ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* EOD Reports - Always Visible */}
      <EODReportsHub teamId={teamId} />

      {/* Collapsible: Team Performance */}
      <Collapsible defaultOpen>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <ActivityTracker teamId={teamId} />
              <Separator />
              <div className="grid gap-6 md:grid-cols-2">
                <Leaderboard
                  title="Top Setters (This Month)"
                  entries={topSetters}
                  type="setter"
                />
                <Leaderboard
                  title="Top Closers (This Month)"
                  entries={topClosers}
                  type="closer"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Collapsible: Team Booking Metrics */}
      <Collapsible defaultOpen={false}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Team Booking Metrics
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <AppointmentsBookedBreakdown teamId={teamId} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Collapsible: Monthly Commissions (default collapsed) */}
      <Collapsible defaultOpen={false}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monthly Commission Report
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <MonthlyCommissionReport teamId={teamId} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
