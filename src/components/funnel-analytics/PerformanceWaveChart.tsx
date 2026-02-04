import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface PerformanceWaveChartProps {
  leads: FunnelLead[];
}

export function PerformanceWaveChart({ leads }: PerformanceWaveChartProps) {
  const isLead = (lead: FunnelLead) => !!(lead.name && lead.phone && lead.email);

  const data = useMemo(() => {
    if (!leads.length) {
      // Return empty data structure for last 14 days
      const now = new Date();
      const days = eachDayOfInterval({
        start: subDays(now, 13),
        end: now,
      });
      return days.map(day => ({
        date: format(day, 'MMM d'),
        leads: 0,
      }));
    }

    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLeads = leads.filter(l => {
        const date = new Date(l.created_at);
        return date >= dayStart && date < dayEnd && isLead(l);
      });

      return {
        date: format(day, 'MMM d'),
        leads: dayLeads.length,
      };
    });
  }, [leads]);

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">Performance Trend</h3>
      
      {/* Area Chart with axes and labels */}
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="blueWaveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: 'leads', position: 'insideLeft', angle: -90, fill: 'hsl(var(--muted-foreground))', style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                    <p className="font-medium">{d.date}</p>
                    <p className="text-muted-foreground">Leads: {d.leads}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#blueWaveGradient)"
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
