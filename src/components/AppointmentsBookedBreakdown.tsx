import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, AlertTriangle, TrendingUp, Clock, FileText, AlertCircle, Trophy, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfDay, subHours, differenceInHours, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AccountabilityMetrics {
  staleLeads: number;
  missingNotes: number;
  overdueTasks: number;
  dueTodayTasks: number;
  hoursSinceLastActivity: number;
}

interface SetterPerformanceMetrics {
  showRate: number;
  confirmedCount: number;
  avgResponseTimeMinutes: number;
  actionsPerDay: number;
}

interface CloserPerformanceMetrics {
  closeRate: number;
  closedCount: number;
  avgResponseTimeMinutes: number;
  actionsPerDay: number;
}

interface SetterRanking {
  showRateRank: number;
  confirmedRank: number;
  responseTimeRank: number;
  activityRank: number;
}

interface CloserRanking {
  closeRateRank: number;
  closedRank: number;
  responseTimeRank: number;
  activityRank: number;
}

interface TeamMemberSetterData {
  id: string;
  name: string;
  performance: SetterPerformanceMetrics;
  accountability: AccountabilityMetrics;
  ranking: SetterRanking;
}

interface TeamMemberCloserData {
  id: string;
  name: string;
  performance: CloserPerformanceMetrics;
  accountability: AccountabilityMetrics;
  ranking: CloserRanking;
}

interface AppointmentsBookedBreakdownProps {
  teamId: string;
}

export function AppointmentsBookedBreakdown({ teamId }: AppointmentsBookedBreakdownProps) {
  const [setterData, setSetterData] = useState<TeamMemberSetterData[]>([]);
  const [closerData, setCloserData] = useState<TeamMemberCloserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnhancedPerformanceData();
  }, [teamId]);

  const loadEnhancedPerformanceData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(new Date());
      const fortyEightHoursAgo = subHours(new Date(), 48);
      const todayStart = startOfDay(new Date());

      // Fetch all data in parallel
      const [
        { data: appointments },
        { data: confirmedTasks },
        { data: allTasks },
        { data: activities }
      ] = await Promise.all([
        supabase.from('appointments').select('*').eq('team_id', teamId),
        supabase.from('confirmation_tasks').select('*').eq('team_id', teamId).eq('status', 'confirmed'),
        supabase.from('confirmation_tasks').select('*').eq('team_id', teamId),
        supabase.from('activity_logs').select('*').eq('team_id', teamId)
      ]);

      // Process setter data
      const setterMap = new Map<string, {
        name: string;
        appointments: any[];
        activities: any[];
        tasks: any[];
      }>();

      appointments?.forEach(apt => {
        if (apt.setter_id && apt.setter_name) {
          if (!setterMap.has(apt.setter_id)) {
            setterMap.set(apt.setter_id, {
              name: apt.setter_name,
              appointments: [],
              activities: [],
              tasks: []
            });
          }
          setterMap.get(apt.setter_id)!.appointments.push(apt);
        }
      });

      activities?.forEach(act => {
        if (act.actor_id && setterMap.has(act.actor_id)) {
          setterMap.get(act.actor_id)!.activities.push(act);
        }
      });

      allTasks?.forEach(task => {
        if (task.assigned_to && setterMap.has(task.assigned_to)) {
          setterMap.get(task.assigned_to)!.tasks.push(task);
        }
      });

      const settersArray: TeamMemberSetterData[] = [];
      
      for (const [id, data] of setterMap.entries()) {
        // Calculate performance metrics
        const monthAppointments = data.appointments.filter(a => 
          new Date(a.start_at_utc) >= monthStart
        );
        const confirmed = monthAppointments.filter(a => 
          confirmedTasks?.some(t => t.appointment_id === a.id)
        );
        const showed = confirmed.filter(a => 
          a.status !== 'NO_SHOW' && a.status !== 'CANCELLED'
        );
        const showRate = confirmed.length > 0 ? (showed.length / confirmed.length) * 100 : 0;

        // Calculate response time (first activity after appointment created)
        let totalResponseTime = 0;
        let responseCount = 0;
        data.appointments.forEach(apt => {
          const firstActivity = data.activities
            .filter(act => act.appointment_id === apt.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          
          if (firstActivity) {
            const responseTime = differenceInHours(
              new Date(firstActivity.created_at),
              new Date(apt.created_at)
            );
            totalResponseTime += responseTime * 60; // convert to minutes
            responseCount++;
          }
        });
        const avgResponseTimeMinutes = responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Calculate actions per day (last 30 days)
        const recentActivities = data.activities.filter(a => 
          new Date(a.created_at) >= monthStart
        );
        const actionsPerDay = recentActivities.length / 30;

        // Calculate accountability metrics
        const staleLeads = data.appointments.filter(apt => {
          const hasRecentActivity = data.activities.some(act => 
            act.appointment_id === apt.id && 
            new Date(act.created_at) >= fortyEightHoursAgo
          );
          return !hasRecentActivity && apt.status !== 'CLOSED' && apt.status !== 'CANCELLED';
        }).length;

        const missingNotes = data.appointments.filter(apt => 
          !apt.setter_notes && 
          apt.status !== 'CLOSED' && 
          apt.status !== 'CANCELLED'
        ).length;

        const overdueTasks = data.tasks.filter(t => 
          t.status === 'pending' && 
          (
            (t.follow_up_date && new Date(t.follow_up_date) < todayStart) ||
            (t.reschedule_date && new Date(t.reschedule_date) < todayStart)
          )
        ).length;

        const dueTodayTasks = data.tasks.filter(t => 
          t.status === 'pending' && 
          (
            (t.follow_up_date && new Date(t.follow_up_date).toDateString() === todayStart.toDateString()) ||
            (t.reschedule_date && new Date(t.reschedule_date).toDateString() === todayStart.toDateString())
          )
        ).length;

        const lastActivity = data.activities
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const hoursSinceLastActivity = lastActivity 
          ? differenceInHours(new Date(), new Date(lastActivity.created_at))
          : 999;

        settersArray.push({
          id,
          name: data.name,
          performance: {
            showRate,
            confirmedCount: confirmed.length,
            avgResponseTimeMinutes,
            actionsPerDay
          },
          accountability: {
            staleLeads,
            missingNotes,
            overdueTasks,
            dueTodayTasks,
            hoursSinceLastActivity
          },
          ranking: { showRateRank: 0, confirmedRank: 0, responseTimeRank: 0, activityRank: 0 }
        });
      }

      // Calculate setter rankings
      settersArray.sort((a, b) => b.performance.showRate - a.performance.showRate);
      settersArray.forEach((s, i) => s.ranking.showRateRank = i + 1);

      settersArray.sort((a, b) => b.performance.confirmedCount - a.performance.confirmedCount);
      settersArray.forEach((s, i) => s.ranking.confirmedRank = i + 1);

      settersArray.sort((a, b) => a.performance.avgResponseTimeMinutes - b.performance.avgResponseTimeMinutes);
      settersArray.forEach((s, i) => s.ranking.responseTimeRank = i + 1);

      settersArray.sort((a, b) => b.performance.actionsPerDay - a.performance.actionsPerDay);
      settersArray.forEach((s, i) => s.ranking.activityRank = i + 1);

      // Sort by overall performance (show rate + activity)
      settersArray.sort((a, b) => {
        const scoreA = a.performance.showRate + (a.performance.actionsPerDay * 10);
        const scoreB = b.performance.showRate + (b.performance.actionsPerDay * 10);
        return scoreB - scoreA;
      });

      // Process closer data
      const closerMap = new Map<string, {
        name: string;
        appointments: any[];
        activities: any[];
        tasks: any[];
      }>();

      appointments?.forEach(apt => {
        if (apt.closer_id && apt.closer_name) {
          if (!closerMap.has(apt.closer_id)) {
            closerMap.set(apt.closer_id, {
              name: apt.closer_name,
              appointments: [],
              activities: [],
              tasks: []
            });
          }
          closerMap.get(apt.closer_id)!.appointments.push(apt);
        }
      });

      activities?.forEach(act => {
        if (act.actor_id && closerMap.has(act.actor_id)) {
          closerMap.get(act.actor_id)!.activities.push(act);
        }
      });

      allTasks?.forEach(task => {
        if (task.assigned_to && closerMap.has(task.assigned_to)) {
          closerMap.get(task.assigned_to)!.tasks.push(task);
        }
      });

      const closersArray: TeamMemberCloserData[] = [];

      for (const [id, data] of closerMap.entries()) {
        const monthAppointments = data.appointments.filter(a => 
          new Date(a.start_at_utc) >= monthStart &&
          a.status !== 'NO_SHOW' && 
          a.status !== 'CANCELLED'
        );
        const closed = monthAppointments.filter(a => a.status === 'CLOSED');
        const closeRate = monthAppointments.length > 0 ? (closed.length / monthAppointments.length) * 100 : 0;

        // Calculate response time
        let totalResponseTime = 0;
        let responseCount = 0;
        data.appointments.forEach(apt => {
          const firstActivity = data.activities
            .filter(act => act.appointment_id === apt.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          
          if (firstActivity) {
            const responseTime = differenceInHours(
              new Date(firstActivity.created_at),
              new Date(apt.created_at)
            );
            totalResponseTime += responseTime * 60;
            responseCount++;
          }
        });
        const avgResponseTimeMinutes = responseCount > 0 ? totalResponseTime / responseCount : 0;

        const recentActivities = data.activities.filter(a => 
          new Date(a.created_at) >= monthStart
        );
        const actionsPerDay = recentActivities.length / 30;

        // Accountability metrics
        const staleLeads = data.appointments.filter(apt => {
          const hasRecentActivity = data.activities.some(act => 
            act.appointment_id === apt.id && 
            new Date(act.created_at) >= fortyEightHoursAgo
          );
          return !hasRecentActivity && apt.status !== 'CLOSED' && apt.status !== 'CANCELLED';
        }).length;

        const missingNotes = data.appointments.filter(apt => 
          !apt.setter_notes && 
          apt.status !== 'CLOSED' && 
          apt.status !== 'CANCELLED'
        ).length;

        const overdueTasks = data.tasks.filter(t => 
          t.status === 'pending' && 
          (
            (t.follow_up_date && new Date(t.follow_up_date) < todayStart) ||
            (t.reschedule_date && new Date(t.reschedule_date) < todayStart)
          )
        ).length;

        const dueTodayTasks = data.tasks.filter(t => 
          t.status === 'pending' && 
          (
            (t.follow_up_date && new Date(t.follow_up_date).toDateString() === todayStart.toDateString()) ||
            (t.reschedule_date && new Date(t.reschedule_date).toDateString() === todayStart.toDateString())
          )
        ).length;

        const lastActivity = data.activities
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        const hoursSinceLastActivity = lastActivity 
          ? differenceInHours(new Date(), new Date(lastActivity.created_at))
          : 999;

        closersArray.push({
          id,
          name: data.name,
          performance: {
            closeRate,
            closedCount: closed.length,
            avgResponseTimeMinutes,
            actionsPerDay
          },
          accountability: {
            staleLeads,
            missingNotes,
            overdueTasks,
            dueTodayTasks,
            hoursSinceLastActivity
          },
          ranking: { closeRateRank: 0, closedRank: 0, responseTimeRank: 0, activityRank: 0 }
        });
      }

      // Calculate closer rankings
      closersArray.sort((a, b) => b.performance.closeRate - a.performance.closeRate);
      closersArray.forEach((c, i) => c.ranking.closeRateRank = i + 1);

      closersArray.sort((a, b) => b.performance.closedCount - a.performance.closedCount);
      closersArray.forEach((c, i) => c.ranking.closedRank = i + 1);

      closersArray.sort((a, b) => a.performance.avgResponseTimeMinutes - b.performance.avgResponseTimeMinutes);
      closersArray.forEach((c, i) => c.ranking.responseTimeRank = i + 1);

      closersArray.sort((a, b) => b.performance.actionsPerDay - a.performance.actionsPerDay);
      closersArray.forEach((c, i) => c.ranking.activityRank = i + 1);

      // Sort by overall performance
      closersArray.sort((a, b) => {
        const scoreA = a.performance.closeRate + (a.performance.actionsPerDay * 10);
        const scoreB = b.performance.closeRate + (b.performance.actionsPerDay * 10);
        return scoreB - scoreA;
      });

      setSetterData(settersArray);
      setCloserData(closersArray);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForRate = (rate: number, thresholds: { green: number; yellow: number }) => {
    if (rate >= thresholds.green) return 'text-green-600 dark:text-green-400';
    if (rate >= thresholds.yellow) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getBackgroundForRate = (rate: number, thresholds: { green: number; yellow: number }) => {
    if (rate >= thresholds.green) return 'bg-green-500/10 border-green-500/20';
    if (rate >= thresholds.yellow) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const renderSetterCard = (member: TeamMemberSetterData) => {
    const hasIssues = member.accountability.overdueTasks > 0 || 
                      member.accountability.staleLeads > 4 || 
                      member.accountability.hoursSinceLastActivity > 72;

    return (
      <Card key={member.id} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">Setter</p>
          </div>
          {hasIssues && (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </h4>
            
            <Card className={`p-4 ${getBackgroundForRate(member.performance.showRate, { green: 70, yellow: 50 })}`}>
              <div className="text-xs text-muted-foreground mb-1">Show Rate</div>
              <div className={`text-2xl font-bold ${getColorForRate(member.performance.showRate, { green: 70, yellow: 50 })}`}>
                {member.performance.showRate.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {member.performance.confirmedCount} confirmed
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
              <div className="text-2xl font-bold">
                {member.performance.avgResponseTimeMinutes < 60 
                  ? `${Math.round(member.performance.avgResponseTimeMinutes)}m`
                  : `${(member.performance.avgResponseTimeMinutes / 60).toFixed(1)}h`
                }
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Activity</div>
              <div className="text-2xl font-bold">
                {member.performance.actionsPerDay.toFixed(1)}/day
              </div>
            </Card>
          </div>

          {/* Accountability Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Accountability
            </h4>

            {member.accountability.overdueTasks > 0 && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Overdue Tasks</div>
                  <Badge variant="destructive">{member.accountability.overdueTasks}</Badge>
                </div>
              </Card>
            )}

            {member.accountability.dueTodayTasks > 0 && (
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Due Today</div>
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    {member.accountability.dueTodayTasks}
                  </Badge>
                </div>
              </Card>
            )}

            {member.accountability.staleLeads > 0 && (
              <Card className={`p-4 ${member.accountability.staleLeads > 4 ? 'bg-destructive/10 border-destructive/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Stale Leads (48h)</div>
                  <Badge variant={member.accountability.staleLeads > 4 ? 'destructive' : 'outline'}>
                    {member.accountability.staleLeads}
                  </Badge>
                </div>
              </Card>
            )}

            {member.accountability.missingNotes > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Missing Notes
                  </div>
                  <Badge variant="outline">{member.accountability.missingNotes}</Badge>
                </div>
              </Card>
            )}

            <Card className={`p-4 ${member.accountability.hoursSinceLastActivity > 72 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Activity
                </div>
                <Badge variant={member.accountability.hoursSinceLastActivity > 72 ? 'destructive' : 'outline'}>
                  {member.accountability.hoursSinceLastActivity < 24 
                    ? `${member.accountability.hoursSinceLastActivity}h ago`
                    : `${Math.floor(member.accountability.hoursSinceLastActivity / 24)}d ago`
                  }
                </Badge>
              </div>
            </Card>
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rankings
            </h4>

            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Show Rate</span>
                  <Badge variant={member.ranking.showRateRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.showRateRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confirmed</span>
                  <Badge variant={member.ranking.confirmedRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.confirmedRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Response Time</span>
                  <Badge variant={member.ranking.responseTimeRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.responseTimeRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Activity
                  </span>
                  <Badge variant={member.ranking.activityRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.activityRank}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    );
  };

  const renderCloserCard = (member: TeamMemberCloserData) => {
    const hasIssues = member.accountability.overdueTasks > 0 || 
                      member.accountability.staleLeads > 4 || 
                      member.accountability.hoursSinceLastActivity > 72;

    return (
      <Card key={member.id} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{member.name}</h3>
            <p className="text-sm text-muted-foreground">Closer</p>
          </div>
          {hasIssues && (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </h4>
            
            <Card className={`p-4 ${getBackgroundForRate(member.performance.closeRate, { green: 30, yellow: 15 })}`}>
              <div className="text-xs text-muted-foreground mb-1">Close Rate</div>
              <div className={`text-2xl font-bold ${getColorForRate(member.performance.closeRate, { green: 30, yellow: 15 })}`}>
                {member.performance.closeRate.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {member.performance.closedCount} closed
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Avg Response</div>
              <div className="text-2xl font-bold">
                {member.performance.avgResponseTimeMinutes < 60 
                  ? `${Math.round(member.performance.avgResponseTimeMinutes)}m`
                  : `${(member.performance.avgResponseTimeMinutes / 60).toFixed(1)}h`
                }
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Activity</div>
              <div className="text-2xl font-bold">
                {member.performance.actionsPerDay.toFixed(1)}/day
              </div>
            </Card>
          </div>

          {/* Accountability Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Accountability
            </h4>

            {member.accountability.overdueTasks > 0 && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Overdue Tasks</div>
                  <Badge variant="destructive">{member.accountability.overdueTasks}</Badge>
                </div>
              </Card>
            )}

            {member.accountability.dueTodayTasks > 0 && (
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Due Today</div>
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    {member.accountability.dueTodayTasks}
                  </Badge>
                </div>
              </Card>
            )}

            {member.accountability.staleLeads > 0 && (
              <Card className={`p-4 ${member.accountability.staleLeads > 4 ? 'bg-destructive/10 border-destructive/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Stale Leads (48h)</div>
                  <Badge variant={member.accountability.staleLeads > 4 ? 'destructive' : 'outline'}>
                    {member.accountability.staleLeads}
                  </Badge>
                </div>
              </Card>
            )}

            {member.accountability.missingNotes > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Missing Notes
                  </div>
                  <Badge variant="outline">{member.accountability.missingNotes}</Badge>
                </div>
              </Card>
            )}

            <Card className={`p-4 ${member.accountability.hoursSinceLastActivity > 72 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Activity
                </div>
                <Badge variant={member.accountability.hoursSinceLastActivity > 72 ? 'destructive' : 'outline'}>
                  {member.accountability.hoursSinceLastActivity < 24 
                    ? `${member.accountability.hoursSinceLastActivity}h ago`
                    : `${Math.floor(member.accountability.hoursSinceLastActivity / 24)}d ago`
                  }
                </Badge>
              </div>
            </Card>
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rankings
            </h4>

            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Close Rate</span>
                  <Badge variant={member.ranking.closeRateRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.closeRateRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Deals Closed</span>
                  <Badge variant={member.ranking.closedRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.closedRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Response Time</span>
                  <Badge variant={member.ranking.responseTimeRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.responseTimeRank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Activity
                  </span>
                  <Badge variant={member.ranking.activityRank === 1 ? 'default' : 'outline'}>
                    #{member.ranking.activityRank}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="closers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="closers">Closers</TabsTrigger>
            <TabsTrigger value="setters">Setters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="closers" className="mt-4">
            {closerData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No closer data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {closerData.map(member => renderCloserCard(member))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="setters" className="mt-4">
            {setterData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No setter data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {setterData.map(member => renderSetterCard(member))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
