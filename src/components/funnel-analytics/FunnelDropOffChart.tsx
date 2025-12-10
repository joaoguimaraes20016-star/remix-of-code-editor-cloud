import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingDown, Users } from 'lucide-react';

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: { headline?: string };
}

interface FunnelLead {
  id: string;
  last_step_index: number | null;
  status: string;
}

interface FunnelDropOffChartProps {
  steps: FunnelStep[];
  leads: FunnelLead[];
  funnelName: string;
}

export function FunnelDropOffChart({ steps, leads, funnelName }: FunnelDropOffChartProps) {
  const data = useMemo(() => {
    if (!steps.length || !leads.length) return [];

    const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);
    
    // Count how many leads reached each step (at least)
    const stepCounts = sortedSteps.map((step, index) => {
      const count = leads.filter(lead => 
        (lead.last_step_index ?? 0) >= index
      ).length;
      
      return {
        name: getStepLabel(step, index),
        stepType: step.step_type,
        count,
        index,
      };
    });

    // Calculate drop-off rates
    return stepCounts.map((step, i) => {
      const prevCount = i === 0 ? leads.length : stepCounts[i - 1].count;
      const dropOff = prevCount > 0 ? Math.round(((prevCount - step.count) / prevCount) * 100) : 0;
      
      return {
        ...step,
        dropOff,
        fill: getStepColor(step.stepType),
      };
    });
  }, [steps, leads]);

  const totalStarted = leads.length;
  const totalCompleted = data.length > 0 ? data[data.length - 1]?.count || 0 : 0;
  const overallConversion = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  // Find the biggest drop-off
  const biggestDropOff = data.reduce((max, step) => 
    step.dropOff > max.dropOff ? step : max
  , { name: '', dropOff: 0 });

  if (!data.length) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">No data available yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="text-2xl font-bold">{totalStarted}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{totalCompleted} <span className="text-sm font-normal text-muted-foreground">({overallConversion}%)</span></p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Biggest Drop-off</p>
              <p className="text-lg font-bold truncate">
                {biggestDropOff.name} <span className="text-red-500">(-{biggestDropOff.dropOff}%)</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Drop-off by Step</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 120, right: 40 }}>
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-muted-foreground">Users: {d.count}</p>
                      <p className="text-sm text-red-500">Drop-off: {d.dropOff}%</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Step-by-step breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Step-by-Step Breakdown</h3>
        <div className="space-y-3">
          {data.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" 
                style={{ backgroundColor: step.fill + '20', color: step.fill }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{step.name}</span>
                  <span className="text-sm text-muted-foreground">{step.count} users</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${totalStarted > 0 ? (step.count / totalStarted) * 100 : 0}%`,
                      backgroundColor: step.fill 
                    }}
                  />
                </div>
              </div>
              {step.dropOff > 0 && (
                <span className="text-xs text-red-500 font-medium">-{step.dropOff}%</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function getStepLabel(step: FunnelStep, index: number): string {
  const headline = step.content?.headline;
  if (headline) {
    // Strip HTML and truncate
    const text = headline.replace(/<[^>]*>/g, '').trim();
    return text.length > 20 ? text.slice(0, 20) + '...' : text;
  }
  
  const typeLabels: Record<string, string> = {
    welcome: 'Welcome',
    text_question: 'Question',
    multi_choice: 'Multi-Choice',
    email_capture: 'Email',
    phone_capture: 'Phone',
    opt_in: 'Opt-In',
    video: 'Video',
    embed: 'Embed',
    thank_you: 'Thank You',
  };
  
  return typeLabels[step.step_type] || `Step ${index + 1}`;
}

function getStepColor(stepType: string): string {
  const colors: Record<string, string> = {
    welcome: '#3b82f6',
    text_question: '#8b5cf6',
    multi_choice: '#a855f7',
    email_capture: '#06b6d4',
    phone_capture: '#14b8a6',
    opt_in: '#22c55e',
    video: '#f59e0b',
    embed: '#f97316',
    thank_you: '#10b981',
  };
  return colors[stepType] || '#6b7280';
}
