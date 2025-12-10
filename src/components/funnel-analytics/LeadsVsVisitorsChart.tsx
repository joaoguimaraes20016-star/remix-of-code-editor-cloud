import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface LeadsVsVisitorsChartProps {
  leads: FunnelLead[];
  selectedFunnelId?: string;
}

export function LeadsVsVisitorsChart({ leads, selectedFunnelId }: LeadsVsVisitorsChartProps) {
  // Helper: A "real lead" has ALL THREE: name + phone + email
  const isRealLead = (lead: FunnelLead) => !!(lead.name && lead.phone && lead.email);

  const data = useMemo(() => {
    if (!leads.length) return [];

    // Get last 14 days
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // All funnel interactions for this day = total visitors
      const dayInteractions = leads.filter(l => {
        const date = new Date(l.created_at);
        return date >= dayStart && date < dayEnd;
      });

      // Real leads = have name + phone + email
      const realLeads = dayInteractions.filter(isRealLead).length;
      // Dropped off = started but didn't complete
      const droppedOff = dayInteractions.length - realLeads;
      // Total visitors = all funnel starts
      const totalVisitors = dayInteractions.length;

      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'EEEE, MMM d'),
        droppedOff,
        leads: realLeads,
        totalVisitors,
        // Conversion = leads / total visitors (all starts)
        conversion: totalVisitors > 0 ? Math.round((realLeads / totalVisitors) * 100) : 0,
      };
    });
  }, [leads]);

  // Summary stats - use total visitors (all funnel starts)
  const totalAllVisitors = data.reduce((sum, d) => sum + d.totalVisitors, 0);
  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0);
  const totalDroppedOff = data.reduce((sum, d) => sum + d.droppedOff, 0);
  // Conversion rate = leads / all visitors
  const overallConversion = totalAllVisitors > 0 
    ? Math.round((totalLeads / totalAllVisitors) * 100) 
    : 0;

  // Find biggest drop-off point
  const biggestDropOff = useMemo(() => {
    if (data.length < 2) return null;
    let maxDrop = 0;
    let dropDay = '';
    
    data.forEach((d) => {
      if (d.droppedOff > 0 && d.leads === 0) {
        if (d.droppedOff > maxDrop) {
          maxDrop = d.droppedOff;
          dropDay = d.fullDate;
        }
      }
    });
    
    return maxDrop > 0 ? { count: maxDrop, day: dropDay } : null;
  }, [data]);

  if (!leads.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No data yet. Start capturing leads to see analytics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-lg">Visitor to Lead Conversion</h3>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
        </div>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{totalAllVisitors} Total Visitors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
            <span className="text-muted-foreground">{totalDroppedOff} Dropped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span><strong>{totalLeads}</strong> Leads</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {overallConversion}% conversion
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card className="p-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
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
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium mb-2">{d.fullDate}</p>
                      <div className="space-y-1">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">{d.totalVisitors} visitors</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm bg-muted-foreground/30" />
                          <span className="text-muted-foreground">{d.droppedOff} dropped</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm bg-primary" />
                          <span className="font-medium">{d.leads} leads</span>
                        </p>
                        <p className="text-muted-foreground pt-1 border-t mt-1">
                          {d.conversion}% converted ({d.leads}/{d.totalVisitors})
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="droppedOff" 
                stackId="a"
                fill="hsl(var(--muted-foreground))"
                opacity={0.3}
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="leads" 
                stackId="a"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insight */}
      {biggestDropOff && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <span className="text-amber-500">Insight:</span>
          <span>
            {biggestDropOff.count} funnel starts dropped off without becoming leads on {biggestDropOff.day}
          </span>
        </div>
      )}
    </div>
  );
}
