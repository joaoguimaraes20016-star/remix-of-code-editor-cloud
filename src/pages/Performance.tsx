import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Clock, Calendar, Users, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTracker } from "@/components/appointments/ActivityTracker";
import { EODReportsHub } from "@/components/appointments/EODReportsHub";
import { AppointmentsBookedBreakdown } from "@/components/AppointmentsBookedBreakdown";
import { useTeamLabels } from "@/contexts/TeamLabelsContext";

interface TaskSummary {
  overdue: number;
  dueToday: number;
  upcoming: number;
  overdueSetters: number;
  overdueClosers: number;
  dueTodaySetters: number;
  dueTodayClosers: number;
}

export default function Performance() {
  const { teamId } = useParams();
  const { labels } = useTeamLabels();
  const [loading, setLoading] = useState(true);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    overdueSetters: 0,
    overdueClosers: 0,
    dueTodaySetters: 0,
    dueTodayClosers: 0,
  });

  useEffect(() => {
    if (!teamId) return;

    loadTaskSummary();

    // Real-time subscription
    const channel = supabase
      .channel(`performance-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmation_tasks', filter: `team_id=eq.${teamId}` }, loadTaskSummary)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `team_id=eq.${teamId}` }, loadTaskSummary)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadTaskSummary = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);

      // Load confirmation tasks with assigned user's role
      const { data: tasks } = await supabase
        .from('confirmation_tasks')
        .select('*, assigned_to, due_at, appointment:appointments!inner(start_at_utc, team_id)')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .gte('appointment.start_at_utc', now.toISOString())
        .eq('appointment.team_id', teamId);

      // Get team members with roles
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', teamId);

      const memberRoles = new Map(teamMembers?.map(m => [m.user_id, m.role]) || []);

      // Load MRR tasks
      const { data: mrrTasks } = await supabase
        .from('mrr_follow_up_tasks')
        .select('due_date')
        .eq('team_id', teamId)
        .eq('status', 'due');

      let overdue = 0, dueToday = 0, upcoming = 0;
      let overdueSetters = 0, overdueClosers = 0, dueTodaySetters = 0, dueTodayClosers = 0;

      tasks?.forEach(task => {
        const dueAt = new Date(task.due_at);
        const isOverdue = dueAt < now;
        const isDueToday = dueAt >= today && dueAt < tomorrow;
        const isUpcoming = dueAt >= tomorrow && dueAt <= sevenDaysFromNow;

        const assigneeRole = task.assigned_to ? memberRoles.get(task.assigned_to) : null;
        const isSetter = assigneeRole === 'setter';
        const isCloser = assigneeRole === 'closer';

        if (isOverdue) {
          overdue++;
          if (isSetter) overdueSetters++;
          if (isCloser) overdueClosers++;
        } else if (isDueToday) {
          dueToday++;
          if (isSetter) dueTodaySetters++;
          if (isCloser) dueTodayClosers++;
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
    } catch (error) {
      console.error("Failed to load task summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Gradient Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-indigo-700/10 border border-violet-500/20 p-6">
        {/* Background decorations */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-purple-500/5" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-violet-500" />
              Team Performance
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor your team's activity and productivity
            </p>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">LIVE</span>
          </div>
        </div>
      </div>

      {/* Task Summary Gradient Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overdue Tasks - Red/Orange Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 p-5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          {/* Glossy glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          {/* Background decorations */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90 drop-shadow-sm">Overdue Tasks</span>
              <div className="p-2 rounded-lg bg-white/25 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <AlertCircle className="h-4 w-4 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{taskSummary.overdue}</div>
            {taskSummary.overdue > 0 && (
              <p className="text-sm text-white/80 mt-1">
                {labels.role_1_short}: {taskSummary.overdueSetters} · {labels.role_2_short}: {taskSummary.overdueClosers}
              </p>
            )}
            {taskSummary.overdue === 0 && (
              <p className="text-sm text-white/80 mt-1">All caught up!</p>
            )}
          </div>
        </div>

        {/* Due Today - Amber/Yellow Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 p-5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          {/* Glossy glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          {/* Background decorations */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90 drop-shadow-sm">Due Today</span>
              <div className="p-2 rounded-lg bg-white/25 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <Clock className="h-4 w-4 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{taskSummary.dueToday}</div>
            {taskSummary.dueToday > 0 && (
              <p className="text-sm text-white/80 mt-1">
                {labels.role_1_short}: {taskSummary.dueTodaySetters} · {labels.role_2_short}: {taskSummary.dueTodayClosers}
              </p>
            )}
            {taskSummary.dueToday === 0 && (
              <p className="text-sm text-white/80 mt-1">Nothing due today</p>
            )}
          </div>
        </div>

        {/* Upcoming - Green/Teal Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          {/* Glossy glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          {/* Background decorations */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/90 drop-shadow-sm">Upcoming (7 days)</span>
              <div className="p-2 rounded-lg bg-white/25 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <Calendar className="h-4 w-4 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{taskSummary.upcoming}</div>
            <p className="text-sm text-white/80 mt-1">Tasks scheduled this week</p>
          </div>
        </div>
      </div>

      {/* EOD Reports */}
      {teamId && <EODReportsHub teamId={teamId} />}

      {/* Team Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {teamId && <ActivityTracker teamId={teamId} />}
        </CardContent>
      </Card>

      {/* Appointments Booked Breakdown */}
      {teamId && <AppointmentsBookedBreakdown teamId={teamId} />}
    </div>
  );
}
