import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SetterEODReport } from "./SetterEODReport";
import { CloserEODReport } from "./CloserEODReport";
import { CalendarIcon, ChevronDown, Activity, AlertCircle, CheckCircle, Phone, DollarSign, TrendingUp } from "lucide-react";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TeamMemberStats {
  id: string;
  name: string;
  officialRole: string;
  actualRoles: ('setter' | 'closer')[];
  activityStatus: { color: string; text: string };
  lastActive: Date | null;
  softwareActionCount: number;
  booked?: number;
  confirmed?: number;
  closed?: number;
  pipelineMoves?: number;
  overdue: number;
}

interface EODReportsHubProps {
  teamId: string;
}

export function EODReportsHub({ teamId }: EODReportsHubProps) {
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<Date>(new Date());

  const getCurrentDate = () => {
    if (selectedTab === 'today') return new Date();
    if (selectedTab === 'yesterday') return subDays(new Date(), 1);
    return customDate;
  };

  useEffect(() => {
    loadTeamStats();

    const channel = supabase
      .channel(`eod-reports-${teamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, loadTeamStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmation_tasks' }, loadTeamStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, loadTeamStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, selectedTab, customDate]);

  const loadTeamStats = async () => {
    try {
      setLoading(true);
      const date = getCurrentDate();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active team members
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (!members) return;

      const userIds = members.map(m => m.user_id);
      
      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (!profiles) return;

      // Load all data for all members at once
      const [appointments, tasks, activityLogs, overdueTasks] = await Promise.all([
        supabase.from('appointments').select('*').eq('team_id', teamId).gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString()),
        supabase.from('confirmation_tasks').select('*').eq('team_id', teamId).in('status', ['completed']).gte('completed_at', startOfDay.toISOString()).lte('completed_at', endOfDay.toISOString()),
        supabase.from('activity_logs').select('*').eq('team_id', teamId).gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString()),
        supabase.from('confirmation_tasks').select('*, appointment:appointments(*)').eq('team_id', teamId).eq('status', 'pending').lt('created_at', today.toISOString())
      ]);

      // Build stats for each member
      const stats: TeamMemberStats[] = await Promise.all(profiles.map(async (profile) => {
        const officialRole = members.find(m => m.user_id === profile.id)?.role || 'member';
        
        // Determine actual roles based on activity
        const actualRoles: ('setter' | 'closer')[] = [];
        const hasSetterActivity = appointments.data?.some(a => a.setter_id === profile.id);
        const hasCloserActivity = appointments.data?.some(a => a.closer_id === profile.id);
        
        if (hasSetterActivity || officialRole === 'setter') actualRoles.push('setter');
        if (hasCloserActivity || officialRole === 'closer' || officialRole === 'offer_owner') actualRoles.push('closer');
        
        // If admin and no clear activity, show both
        if (officialRole === 'admin' && actualRoles.length === 0) {
          actualRoles.push('setter', 'closer');
        }

        // Calculate stats based on actual roles
        const userAppointments = appointments.data?.filter(a => a.setter_id === profile.id || a.closer_id === profile.id) || [];
        const booked = appointments.data?.filter(a => a.setter_id === profile.id).length || 0;
        const confirmed = tasks.data?.filter(t => t.assigned_to === profile.id).length || 0;
        const closed = appointments.data?.filter(a => a.closer_id === profile.id && a.status === 'CLOSED').length || 0;
        
        const userActivityLogs = activityLogs.data?.filter(a => a.actor_id === profile.id) || [];
        const pipelineMoves = userActivityLogs.filter(a => ['Stage Changed', 'Note Added', 'Rescheduled'].includes(a.action_type)).length;
        
        // Overdue tasks
        const overdue = overdueTasks.data?.filter(t => t.assigned_to === profile.id).length || 0;

        // Last activity
        const lastActivityLog = userActivityLogs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const lastActive = lastActivityLog ? new Date(lastActivityLog.created_at) : null;

        // Activity status
        const activityStatus = getActivityStatus(lastActive);

        // Software action count
        const softwareActionCount = userActivityLogs.length + booked + confirmed + closed;

        return {
          id: profile.id,
          name: profile.full_name || 'Unknown',
          officialRole,
          actualRoles,
          activityStatus,
          lastActive,
          softwareActionCount,
          booked,
          confirmed,
          closed,
          pipelineMoves,
          overdue
        };
      }));

      // Sort by overdue count (highest first), then by activity
      stats.sort((a, b) => {
        if (b.overdue !== a.overdue) return b.overdue - a.overdue;
        return b.softwareActionCount - a.softwareActionCount;
      });

      setTeamStats(stats);
    } catch (error) {
      console.error('Error loading team stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityStatus = (lastActive: Date | null) => {
    if (!lastActive) return { color: 'bg-muted', text: 'No Activity' };
    const hoursSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 2) return { color: 'bg-success', text: 'Active' };
    if (hoursSince < 4) return { color: 'bg-warning', text: 'Idle' };
    return { color: 'bg-muted', text: 'Inactive' };
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'setter') return 'default';
    if (role === 'closer' || role === 'offer_owner') return 'secondary';
    if (role === 'admin') return 'outline';
    return 'outline';
  };

  const renderMemberCard = (member: TeamMemberStats) => {
    const isExpanded = expandedMember === member.id;
    const displayRole = member.actualRoles.length > 1 ? 'Setter & Closer' : 
                       member.actualRoles[0] === 'setter' ? 'Setter' : 
                       member.actualRoles[0] === 'closer' ? 'Closer' : 
                       member.officialRole;

    return (
      <Collapsible
        key={member.id}
        open={isExpanded}
        onOpenChange={() => setExpandedMember(isExpanded ? null : member.id)}
      >
        <Card className={cn(
          "transition-all hover:shadow-md cursor-pointer",
          member.overdue > 0 && "border-destructive/40"
        )}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <Badge variant={getRoleBadgeVariant(member.officialRole)} className="text-xs">
                      {displayRole}
                    </Badge>
                  </div>
                  
                  {/* Quick Metrics */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    {member.actualRoles.includes('setter') && (
                      <>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{member.booked} booked</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{member.confirmed} confirmed</span>
                        </div>
                      </>
                    )}
                    {member.actualRoles.includes('closer') && (
                      <>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{member.closed} closed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{member.pipelineMoves} moves</span>
                        </div>
                      </>
                    )}
                    {member.overdue > 0 && (
                      <div className="flex items-center gap-1 text-destructive font-semibold">
                        <AlertCircle className="h-3 w-3" />
                        <span>{member.overdue} OVERDUE</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Status */}
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant={
                      member.activityStatus.color === 'bg-success' ? 'default' : 
                      member.activityStatus.color === 'bg-warning' ? 'secondary' : 
                      'outline'
                    } className="text-xs">
                      {member.activityStatus.text}
                    </Badge>
                    <span className="text-muted-foreground">
                      <Activity className="h-3 w-3 inline mr-1" />
                      {member.softwareActionCount} actions today
                    </span>
                    {member.lastActive && (
                      <span className="text-muted-foreground">
                        • Last active {formatDistanceToNow(member.lastActive, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform ml-2",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {member.actualRoles.includes('setter') && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Setter Activity
                  </h4>
                  <SetterEODReport
                    teamId={teamId}
                    userId={member.id}
                    userName={member.name}
                    date={getCurrentDate()}
                  />
                </div>
              )}
              {member.actualRoles.includes('closer') && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Closer Activity
                  </h4>
                  <CloserEODReport
                    teamId={teamId}
                    userId={member.id}
                    userName={member.name}
                    date={getCurrentDate()}
                  />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          EOD Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="today">TODAY</TabsTrigger>
            <TabsTrigger value="yesterday">YESTERDAY</TabsTrigger>
            <TabsTrigger value="custom">CUSTOM DATE</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {teamStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No team members found</p>
            ) : (
              teamStats.map(member => renderMemberCard(member))
            )}
          </TabsContent>

          <TabsContent value="yesterday" className="space-y-3">
            {teamStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No team members found</p>
            ) : (
              teamStats.map(member => renderMemberCard(member))
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(customDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={(date) => date && setCustomDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="space-y-3">
              {teamStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No team members found</p>
              ) : (
                teamStats.map(member => renderMemberCard(member))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
