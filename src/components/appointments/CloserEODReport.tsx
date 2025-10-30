import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, AlertCircle, Clock, ArrowRight, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CloserEODReportProps {
  teamId: string;
  userId: string;
  userName: string;
  date: Date;
}

export function CloserEODReport({ teamId, userId, userName, date }: CloserEODReportProps) {
  const [loading, setLoading] = useState(true);
  const [dealsClosed, setDealsClosed] = useState<any[]>([]);
  const [depositsCollected, setDepositsCollected] = useState<any[]>([]);
  const [pipelineActivity, setPipelineActivity] = useState<any[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<any[]>([]);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`closer-eod-${userId}-${date.getTime()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `team_id=eq.${teamId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmation_tasks', filter: `team_id=eq.${teamId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `team_id=eq.${teamId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, userId, date]);

  const loadData = async () => {
    try {
      setLoading(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Load deals closed today
      const { data: closed } = await supabase
        .from('appointments')
        .select('*')
        .eq('closer_id', userId)
        .eq('status', 'CLOSED')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      // Load deposits collected today
      const { data: deposits } = await supabase
        .from('activity_logs')
        .select('*, appointment:appointments(*)')
        .eq('actor_id', userId)
        .eq('action_type', 'Deposit Collected')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Load pipeline activity
      const { data: pipeline } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('actor_id', userId)
        .in('action_type', ['Stage Changed', 'Note Added', 'Rescheduled'])
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      // Load overdue follow-ups
      const { data: overdue } = await supabase
        .from('confirmation_tasks')
        .select('*, appointment:appointments(*)')
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .eq('task_type', 'follow_up')
        .lt('follow_up_date', today.toISOString());

      // Load last activity
      const { data: activity } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setDealsClosed(closed || []);
      setDepositsCollected(deposits || []);
      setPipelineActivity(pipeline || []);
      setOverdueFollowUps(overdue || []);
      setLastActivity(activity ? new Date(activity.created_at) : null);
    } catch (error) {
      console.error('Error loading closer EOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = dealsClosed.reduce((sum, d) => sum + (Number(d.cc_collected) || 0), 0);
  const totalCommission = totalRevenue * 0.10; // Approximate 10% commission

  const getActivityStatus = () => {
    if (!lastActivity) return { color: 'bg-muted', text: 'No Activity', icon: '⚪' };
    const hoursSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 2) return { color: 'bg-success', text: 'Active', icon: '🟢' };
    if (hoursSince < 4) return { color: 'bg-warning', text: 'Idle', icon: '🟡' };
    return { color: 'bg-destructive', text: 'Inactive', icon: '🔴' };
  };

  const exportToCSV = () => {
    const data = [
      ['Closer EOD Report', userName, format(date, 'MMM dd, yyyy')],
      [],
      ['Deals Closed'],
      ['Lead Name', 'Amount', 'Product', 'Commission'],
      ...dealsClosed.map(deal => [
        deal.lead_name,
        `$${Number(deal.cc_collected).toLocaleString()}`,
        deal.product_name || '',
        `$${(Number(deal.cc_collected) * 0.10).toFixed(2)}`
      ]),
      [],
      ['Summary'],
      ['Total Revenue', `$${totalRevenue.toLocaleString()}`],
      ['Total Commission', `$${totalCommission.toFixed(2)}`],
      ['Deals Closed', dealsClosed.length.toString()],
      ['Pipeline Moves', pipelineActivity.length.toString()]
    ];

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName}_Closer_EOD_${format(date, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const activityStatus = getActivityStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">{userName}</CardTitle>
            <p className="text-sm text-muted-foreground">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={activityStatus.color === 'bg-success' ? 'default' : activityStatus.color === 'bg-warning' ? 'secondary' : 'outline'}>
              {activityStatus.icon} {activityStatus.text}
            </Badge>
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-5 w-5 text-success mx-auto mb-2" />
                <p className="text-3xl font-bold text-success">{dealsClosed.length}</p>
                <p className="text-sm text-muted-foreground">Closed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-primary">{pipelineActivity.length}</p>
                <p className="text-sm text-muted-foreground">Moves</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xl font-bold text-accent">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn("border-destructive/20", overdueFollowUps.length > 0 ? "bg-destructive/5" : "bg-muted/20")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className={cn("h-5 w-5 mx-auto mb-2", overdueFollowUps.length > 0 ? "text-destructive" : "text-muted-foreground")} />
                <p className={cn("text-3xl font-bold", overdueFollowUps.length > 0 ? "text-destructive" : "text-muted-foreground")}>{overdueFollowUps.length}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dealsClosed.length === 0 && pipelineActivity.length === 0 && overdueFollowUps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity for this date</p>
              ) : (
                <>
                  {dealsClosed.map(deal => (
                    <div key={deal.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-success/20 bg-success/5">
                      <div className="text-xs text-muted-foreground min-w-[80px]">
                        {format(new Date(deal.updated_at), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="font-medium text-success">Deal Closed</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {deal.lead_name} • ${Number(deal.cc_collected).toLocaleString()}
                        </p>
                        {deal.product_name && (
                          <Badge variant="secondary" className="mt-1">{deal.product_name}</Badge>
                        )}
                        <p className="text-xs text-success mt-1">
                          Commission: ${(Number(deal.cc_collected) * 0.10).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {pipelineActivity.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="text-xs text-muted-foreground min-w-[80px]">
                        {format(new Date(activity.created_at), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">{activity.action_type}</span>
                        </div>
                        {activity.note && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {overdueFollowUps.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-destructive bg-destructive/5">
                      <div className="text-xs text-destructive min-w-[80px]">
                        Overdue
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="font-medium text-destructive">Follow-up Needed</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.appointment?.lead_name}
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          Overdue since {format(new Date(task.follow_up_date), 'MMM dd')}
                        </p>
                        {task.follow_up_reason && (
                          <p className="text-xs text-muted-foreground mt-1">{task.follow_up_reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
