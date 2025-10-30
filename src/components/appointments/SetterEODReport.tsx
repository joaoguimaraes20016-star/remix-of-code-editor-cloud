import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle, AlertCircle, Clock, Phone, TrendingUp, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SetterEODReportProps {
  teamId: string;
  userId: string;
  userName: string;
  date: Date;
}

export function SetterEODReport({ teamId, userId, userName, date }: SetterEODReportProps) {
  const [loading, setLoading] = useState(true);
  const [appointmentsBooked, setAppointmentsBooked] = useState<any[]>([]);
  const [confirmations, setConfirmations] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`setter-eod-${userId}-${date.getTime()}`)
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

      // Load appointments booked today
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('setter_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      // Load confirmations completed today
      const { data: tasks } = await supabase
        .from('confirmation_tasks')
        .select('*, appointment:appointments(*)')
        .eq('assigned_to', userId)
        .eq('status', 'completed')
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString());

      // Load overdue tasks
      const { data: overdue } = await supabase
        .from('confirmation_tasks')
        .select('*, appointment:appointments(*)')
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .lt('appointment.start_at_utc', new Date().toISOString());

      // Load last activity
      const { data: activity } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setAppointmentsBooked(appts || []);
      setConfirmations(tasks || []);
      setOverdueTasks(overdue || []);
      setLastActivity(activity ? new Date(activity.created_at) : null);
    } catch (error) {
      console.error('Error loading setter EOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = () => {
    if (!lastActivity) return { color: 'bg-muted', text: 'No Activity', icon: '⚪' };
    const hoursSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 2) return { color: 'bg-success', text: 'Active', icon: '🟢' };
    if (hoursSince < 4) return { color: 'bg-warning', text: 'Idle', icon: '🟡' };
    return { color: 'bg-destructive', text: 'Inactive', icon: '🔴' };
  };

  const exportToCSV = () => {
    const data = [
      ['Setter EOD Report', userName, format(date, 'MMM dd, yyyy')],
      [],
      ['Appointments Booked'],
      ['Lead Name', 'Email', 'Time', 'Event Type', 'Status'],
      ...appointmentsBooked.map(apt => [
        apt.lead_name,
        apt.lead_email,
        format(new Date(apt.start_at_utc), 'h:mm a'),
        apt.event_type_name || '',
        apt.status
      ]),
      [],
      ['Confirmations Completed'],
      ['Lead Name', 'Confirmation Time'],
      ...confirmations.map(task => [
        task.appointment?.lead_name || '',
        format(new Date(task.completed_at), 'h:mm a')
      ])
    ];

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName}_EOD_${format(date, 'yyyy-MM-dd')}.csv`;
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
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <Phone className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-primary">{appointmentsBooked.length}</p>
                <p className="text-sm text-muted-foreground">Booked</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
                <p className="text-3xl font-bold text-success">{confirmations.length}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn("border-destructive/20", overdueTasks.length > 0 ? "bg-destructive/5" : "bg-muted/20")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className={cn("h-5 w-5 mx-auto mb-2", overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground")} />
                <p className={cn("text-3xl font-bold", overdueTasks.length > 0 ? "text-destructive" : "text-muted-foreground")}>{overdueTasks.length}</p>
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
              {appointmentsBooked.length === 0 && confirmations.length === 0 && overdueTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity for this date</p>
              ) : (
                <>
                  {appointmentsBooked.map(apt => (
                    <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="text-xs text-muted-foreground min-w-[80px]">
                        {format(new Date(apt.start_at_utc), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="font-medium">Booked Appointment</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {apt.lead_name} • {apt.lead_email}
                        </p>
                        {apt.event_type_name && (
                          <Badge variant="secondary" className="mt-1">{apt.event_type_name}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {confirmations.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="text-xs text-muted-foreground min-w-[80px]">
                        {format(new Date(task.completed_at), 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="font-medium">Confirmed Appointment</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.appointment?.lead_name}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {overdueTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-destructive bg-destructive/5">
                      <div className="text-xs text-destructive min-w-[80px]">
                        Overdue
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="font-medium text-destructive">Needs Confirmation</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.appointment?.lead_name}
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          Overdue by {formatDistanceToNow(new Date(task.appointment?.start_at_utc))}
                        </p>
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
