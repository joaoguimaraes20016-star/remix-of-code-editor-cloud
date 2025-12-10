import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { Users, UserCheck, Calendar, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  calendly_booking_data: any;
  created_at: string;
}

interface LeadsVsVisitorsChartProps {
  leads: FunnelLead[];
  selectedFunnelId?: string;
}

export function LeadsVsVisitorsChart({ leads, selectedFunnelId }: LeadsVsVisitorsChartProps) {
  // Definitions:
  // - Visitor: Anyone who started the funnel (all entries)
  // - Lead: Has name + phone + email (complete contact info)
  // - Booked: Lead who also has calendly_booking_data (scheduled a call)
  
  const isLead = (lead: FunnelLead) => !!(lead.name && lead.phone && lead.email);
  const isBooked = (lead: FunnelLead) => isLead(lead) && !!lead.calendly_booking_data;

  const data = useMemo(() => {
    if (!leads.length) return [];

    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEntries = leads.filter(l => {
        const date = new Date(l.created_at);
        return date >= dayStart && date < dayEnd;
      });

      const visitors = dayEntries.length;
      const leadsCount = dayEntries.filter(isLead).length;
      const booked = dayEntries.filter(isBooked).length;

      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'EEEE, MMM d'),
        visitors,
        leads: leadsCount,
        booked,
      };
    });
  }, [leads]);

  // Summary stats
  const totalVisitors = leads.length;
  const totalLeads = leads.filter(isLead).length;
  const totalBooked = leads.filter(isBooked).length;
  
  // Conversion rates
  const leadRate = totalVisitors > 0 ? Math.round((totalLeads / totalVisitors) * 100) : 0;
  const bookingRate = totalLeads > 0 ? Math.round((totalBooked / totalLeads) * 100) : 0;
  const overallConversion = totalVisitors > 0 ? Math.round((totalBooked / totalVisitors) * 100) : 0;

  // Week over week comparison
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  
  const thisWeekVisitors = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
  const lastWeekVisitors = leads.filter(l => {
    const d = new Date(l.created_at);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;
  
  const thisWeekLeads = leads.filter(l => new Date(l.created_at) >= weekAgo && isLead(l)).length;
  const lastWeekLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d >= twoWeeksAgo && d < weekAgo && isLead(l);
  }).length;
  
  const thisWeekBooked = leads.filter(l => new Date(l.created_at) >= weekAgo && isBooked(l)).length;
  const lastWeekBooked = leads.filter(l => {
    const d = new Date(l.created_at);
    return d >= twoWeeksAgo && d < weekAgo && isBooked(l);
  }).length;

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const visitorChange = calcChange(thisWeekVisitors, lastWeekVisitors);
  const leadChange = calcChange(thisWeekLeads, lastWeekLeads);
  const bookedChange = calcChange(thisWeekBooked, lastWeekBooked);

  if (!leads.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No data yet. Start capturing leads to see analytics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Visitors"
          value={totalVisitors}
          change={visitorChange}
          icon={Users}
          color="gray"
        />
        <MetricCard
          label="Leads"
          value={totalLeads}
          change={leadChange}
          icon={UserCheck}
          color="blue"
          subtext={`${leadRate}% of visitors`}
        />
        <MetricCard
          label="Calls Booked"
          value={totalBooked}
          change={bookedChange}
          icon={Calendar}
          color="green"
          subtext={`${bookingRate}% of leads`}
        />
      </div>

      {/* Funnel Visualization */}
      <Card className="p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Conversion Funnel</h3>
        <div className="flex items-center justify-between">
          <FunnelStage 
            label="Visitors" 
            count={totalVisitors} 
            percentage={100} 
            color="bg-muted-foreground/20"
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 mx-2" />
          <FunnelStage 
            label="Leads" 
            count={totalLeads} 
            percentage={leadRate} 
            color="bg-blue-500/20"
            textColor="text-blue-600"
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 mx-2" />
          <FunnelStage 
            label="Booked" 
            count={totalBooked} 
            percentage={overallConversion} 
            color="bg-emerald-500/20"
            textColor="text-emerald-600"
          />
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Last 14 Days</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Leads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Booked</span>
            </div>
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone"
                dataKey="visitors" 
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                fill="url(#visitorGradient)"
              />
              <Area 
                type="monotone"
                dataKey="leads" 
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#leadGradient)"
              />
              <Area 
                type="monotone"
                dataKey="booked" 
                stroke="#10b981"
                strokeWidth={1.5}
                fill="url(#bookedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  color,
  subtext 
}: { 
  label: string; 
  value: number; 
  change: number;
  icon: any;
  color: 'gray' | 'blue' | 'green';
  subtext?: string;
}) {
  const colorClasses = {
    gray: 'bg-muted/50 text-muted-foreground',
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-emerald-500/10 text-emerald-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        {change !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            change > 0 ? "text-emerald-600" : "text-red-500"
          )}>
            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>}
      </div>
    </Card>
  );
}

function FunnelStage({ 
  label, 
  count, 
  percentage,
  color,
  textColor = "text-foreground"
}: { 
  label: string; 
  count: number; 
  percentage: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div className="flex-1 text-center">
      <div className={cn("rounded-lg py-4 px-3", color)}>
        <p className={cn("text-xl font-bold", textColor)}>{count.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
      <p className={cn("text-xs font-medium mt-2", textColor)}>{percentage}%</p>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  
  return (
    <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium mb-2">{d.fullDate}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">Visitors</span>
          </div>
          <span className="font-medium">{d.visitors}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Leads</span>
          </div>
          <span className="font-medium">{d.leads}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Booked</span>
          </div>
          <span className="font-medium">{d.booked}</span>
        </div>
      </div>
    </div>
  );
}
