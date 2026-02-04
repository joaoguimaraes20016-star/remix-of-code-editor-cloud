import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  opt_in: boolean;
  source: string | null;
  created_at: string;
}

interface ContactGrowthChartProps {
  contacts: Contact[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function ContactGrowthChart({ contacts }: ContactGrowthChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    // Always return data for the last 14 days, even if empty
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      if (!contacts.length) {
        return {
          date: format(day, 'MMM d'),
          fullDate: format(day, 'EEEE, MMM d'),
          total: 0,
          optedIn: 0,
        };
      }

      const dayContacts = contacts.filter(c => {
        const date = new Date(c.created_at);
        return date >= dayStart && date < dayEnd;
      });

      const total = dayContacts.length;
      const optedIn = dayContacts.filter(c => c.opt_in).length;

      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'EEEE, MMM d'),
        total,
        optedIn,
      };
    });
  }, [contacts]);

  // Summary stats (always calculate, even if 0)
  const totalContacts = contacts.length || 0;
  const totalOptedIn = contacts.filter(c => c.opt_in).length || 0;
  const optInRate = totalContacts > 0 ? Math.round((totalOptedIn / totalContacts) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold mb-1">Contact Acquisition</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total: <span className="font-medium text-foreground">{totalContacts}</span></span>
            <span>•</span>
            <span>Opt-in Rate: <span className="font-medium text-foreground">{optInRate}%</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-muted-foreground">Total Contacts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-muted-foreground">Opted In</span>
          </div>
        </div>
      </div>
      <div className="h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="optedInGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
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
              dataKey="total" 
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#totalGradient)"
              name="Total Contacts"
            />
            <Area 
              type="monotone"
              dataKey="optedIn" 
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#optedInGradient)"
              name="Opted In"
            />
          </AreaChart>
        </ResponsiveContainer>
        {totalContacts === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-sm font-medium text-muted-foreground mb-1">No data available</p>
            <p className="text-xs text-muted-foreground/70">Contacts will appear here when leads submit your funnels</p>
          </div>
        )}
      </div>
    </Card>
  );
}
