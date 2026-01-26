import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTeamLabels } from "@/contexts/TeamLabelsContext";

interface ActivityTrackerProps {
  teamId: string;
}

interface TeamMemberActivity {
  userId: string;
  name: string;
  role: 'setter' | 'closer';
  lastActivity: Date | null;
  activityCount: number;
  confirmations?: number;
  appointmentsClaimed?: number;
  pipelineMovements?: number;
  dealsClosed?: number;
  depositsCollected?: number;
}

export function ActivityTracker({ teamId }: ActivityTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [setterActivity, setSetterActivity] = useState<TeamMemberActivity[]>([]);
  const [closerActivity, setCloserActivity] = useState<TeamMemberActivity[]>([]);
  const { getRoleLabel } = useTeamLabels();

  useEffect(() => {
    loadActivity();

    const channel = supabase
      .channel(`activity-tracker-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `team_id=eq.${teamId}` }, loadActivity)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Load team members
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role, profiles(full_name)')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .in('role', ['setter', 'closer']);

      // Load activity logs for the last 24 hours
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('actor_id, actor_name, action_type, created_at')
        .eq('team_id', teamId)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .not('actor_id', 'is', null)
        .order('created_at', { ascending: false });

      const setterActivities: TeamMemberActivity[] = [];
      const closerActivities: TeamMemberActivity[] = [];

      members?.forEach(member => {
        const userLogs = logs?.filter(log => log.actor_id === member.user_id) || [];
        
        const activity: TeamMemberActivity = {
          userId: member.user_id,
          name: (member.profiles as any)?.full_name || 'Unknown',
          role: member.role as 'setter' | 'closer',
          lastActivity: userLogs.length > 0 ? new Date(userLogs[0].created_at) : null,
          activityCount: userLogs.length,
        };

        if (member.role === 'setter') {
          activity.confirmations = userLogs.filter(l => l.action_type === 'Confirmed' || l.action_type === 'Task Completed').length;
          activity.appointmentsClaimed = userLogs.filter(l => l.action_type === 'Claimed' || l.action_type === 'Assigned').length;
          setterActivities.push(activity);
        } else if (member.role === 'closer') {
          activity.pipelineMovements = userLogs.filter(l => l.action_type === 'Stage Changed').length;
          activity.dealsClosed = userLogs.filter(l => l.action_type === 'Closed Deal').length;
          activity.depositsCollected = userLogs.filter(l => l.action_type === 'Deposit Collected').length;
          closerActivities.push(activity);
        }
      });

      // Sort by activity (most active first)
      setterActivities.sort((a, b) => b.activityCount - a.activityCount);
      closerActivities.sort((a, b) => b.activityCount - a.activityCount);

      setSetterActivity(setterActivities);
      setCloserActivity(closerActivities);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (lastActivity: Date | null) => {
    if (!lastActivity) return { status: 'inactive', color: 'text-destructive', icon: '🔴', label: 'Inactive' };
    
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActivity < 2) return { status: 'active', color: 'text-success', icon: '🟢', label: 'Active' };
    if (hoursSinceActivity < 4) return { status: 'idle', color: 'text-warning', icon: '🟡', label: 'Idle' };
    return { status: 'inactive', color: 'text-destructive', icon: '🔴', label: 'Inactive' };
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Setters Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {getRoleLabel('setter', true)} Activity Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {setterActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active {getRoleLabel('setter', true).toLowerCase()} found</p>
            ) : (
              setterActivity.map(setter => {
                const status = getActivityStatus(setter.lastActivity);
                return (
                  <div key={setter.userId} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{status.icon}</span>
                        <span className="font-medium">{setter.name}</span>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {setter.lastActivity ? (
                          <span>Last: {formatDistanceToNow(setter.lastActivity, { addSuffix: true })}</span>
                        ) : (
                          <span>No activity today</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary">{setter.confirmations || 0} confirmations</Badge>
                        <Badge variant="secondary">{setter.appointmentsClaimed || 0} claimed</Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Closers Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {getRoleLabel('closer', true)} Activity Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {closerActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active {getRoleLabel('closer', true).toLowerCase()} found</p>
            ) : (
              closerActivity.map(closer => {
                const status = getActivityStatus(closer.lastActivity);
                return (
                  <div key={closer.userId} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{status.icon}</span>
                        <span className="font-medium">{closer.name}</span>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {closer.lastActivity ? (
                          <span>Last: {formatDistanceToNow(closer.lastActivity, { addSuffix: true })}</span>
                        ) : (
                          <span>No activity today</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary">{closer.pipelineMovements || 0} stage changes</Badge>
                        <Badge variant="secondary">{closer.dealsClosed || 0} closed</Badge>
                        <Badge variant="secondary">{closer.depositsCollected || 0} deposits</Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
