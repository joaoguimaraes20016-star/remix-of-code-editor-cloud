import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Clock, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTracker } from "@/components/appointments/ActivityTracker";
import { EODReportsHub } from "@/components/appointments/EODReportsHub";
import { AppointmentsBookedBreakdown } from "@/components/AppointmentsBookedBreakdown";

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Performance</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your team's activity and productivity
        </p>
      </div>

      {/* Task Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Overdue Tasks */}
        <Card className={taskSummary.overdue > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${taskSummary.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${taskSummary.overdue > 0 ? "text-destructive" : ""}`}>
              {taskSummary.overdue}
            </div>
            {taskSummary.overdue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                S: {taskSummary.overdueSetters} · C: {taskSummary.overdueClosers}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Due Today */}
        <Card className={taskSummary.dueToday > 0 ? "border-warning/50 bg-warning/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className={`h-4 w-4 ${taskSummary.dueToday > 0 ? "text-warning" : "text-muted-foreground"}`} />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${taskSummary.dueToday > 0 ? "text-warning" : ""}`}>
              {taskSummary.dueToday}
            </div>
            {taskSummary.dueToday > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                S: {taskSummary.dueTodaySetters} · C: {taskSummary.dueTodayClosers}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Upcoming (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {taskSummary.upcoming}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks scheduled this week
            </p>
          </CardContent>
        </Card>
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
