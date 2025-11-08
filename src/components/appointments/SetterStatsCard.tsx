import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Target, PhoneCall } from 'lucide-react';
import { startOfMonth, startOfWeek } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface SetterStatsCardProps {
  teamId: string;
  userId: string;
}

interface Stats {
  today: {
    booked: number;
    confirmed: number;
    confirmationCalls: number;
    qualityScore: number;
  };
  thisWeek: {
    booked: number;
    confirmed: number;
    confirmationCalls: number;
    qualityScore: number;
  };
  thisMonth: {
    booked: number;
    confirmed: number;
    confirmationCalls: number;
    qualityScore: number;
  };
}

export function SetterStatsCard({ teamId, userId }: SetterStatsCardProps) {
  const [stats, setStats] = useState<Stats>({
    today: { booked: 0, confirmed: 0, confirmationCalls: 0, qualityScore: 0 },
    thisWeek: { booked: 0, confirmed: 0, confirmationCalls: 0, qualityScore: 0 },
    thisMonth: { booked: 0, confirmed: 0, confirmationCalls: 0, qualityScore: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [teamId, userId]);

  const loadStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const weekStart = startOfWeek(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      // Load appointments booked by this setter
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, start_at_utc')
        .eq('team_id', teamId)
        .eq('setter_id', userId)
        .gte('start_at_utc', monthStart);

      if (error) throw error;

      // Load confirmation tasks for these appointments
      const appointmentIds = appointments?.map(a => a.id) || [];
      const { data: confirmationTasks } = await supabase
        .from('confirmation_tasks')
        .select('appointment_id, status, confirmation_attempts, created_at')
        .eq('team_id', teamId)
        .in('appointment_id', appointmentIds);

      // Calculate stats for each period
      const todayData = appointments?.filter(a => a.start_at_utc >= todayStart) || [];
      const weekData = appointments?.filter(a => a.start_at_utc >= weekStart) || [];
      const monthData = appointments || [];

      const calcStats = (data: typeof appointments) => {
        const bookedCount = data?.length || 0;
        const aptIds = data?.map(a => a.id) || [];
        
        const confirmedCount = confirmationTasks?.filter(
          t => aptIds.includes(t.appointment_id) && t.status === 'confirmed'
        ).length || 0;

        const totalCalls = confirmationTasks?.filter(
          t => aptIds.includes(t.appointment_id)
        ).reduce((sum, t) => {
          const attempts = t.confirmation_attempts as any[];
          return sum + (Array.isArray(attempts) ? attempts.length : 0);
        }, 0) || 0;

        // Quality Score: % of appointments that didn't need confirmation calls
        // Higher score = better quality appointments that showed up without babysitting
        const qualityScore = bookedCount > 0 
          ? ((bookedCount - confirmedCount) / bookedCount) * 100 
          : 0;

        return {
          booked: bookedCount,
          confirmed: confirmedCount,
          confirmationCalls: totalCalls,
          qualityScore: Math.max(0, qualityScore) // Can't be negative
        };
      };

      setStats({
        today: calcStats(todayData),
        thisWeek: calcStats(weekData),
        thisMonth: calcStats(monthData)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading stats...
        </CardContent>
      </Card>
    );
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.today.booked} booked</div>
          <div className="flex items-center gap-2 mt-2">
            <PhoneCall className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {stats.today.confirmationCalls} confirmation calls
            </p>
          </div>
          <Badge className={`mt-2 text-xs ${getQualityColor(stats.today.qualityScore)}`}>
            {stats.today.qualityScore.toFixed(0)}% Quality Score
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeek.booked} booked</div>
          <div className="flex items-center gap-2 mt-2">
            <PhoneCall className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {stats.thisWeek.confirmationCalls} confirmation calls
            </p>
          </div>
          <Badge className={`mt-2 text-xs ${getQualityColor(stats.thisWeek.qualityScore)}`}>
            {stats.thisWeek.qualityScore.toFixed(0)}% Quality Score
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisMonth.booked} booked</div>
          <div className="flex items-center gap-2 mt-2">
            <PhoneCall className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {stats.thisMonth.confirmationCalls} confirmation calls
            </p>
          </div>
          <Badge className={`mt-2 text-xs ${getQualityColor(stats.thisMonth.qualityScore)}`}>
            {stats.thisMonth.qualityScore.toFixed(0)}% Quality Score
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
