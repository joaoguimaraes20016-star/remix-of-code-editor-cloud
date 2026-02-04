import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Users, UserCheck, TrendingUp, TrendingDown, ArrowRight, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  calendly_booking_data: any;
  created_at: string;
  answers?: Record<string, string>;
  last_step_index?: number | null;
}

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content?: { headline?: string; question?: string };
  name?: string; // V3 format uses name field
}

interface LeadsVsVisitorsChartProps {
  leads: FunnelLead[];
  selectedFunnelId?: string;
  steps?: FunnelStep[];
  funnelName?: string;
}

export function LeadsVsVisitorsChart({ leads, selectedFunnelId, steps, funnelName }: LeadsVsVisitorsChartProps) {
  // Definitions:
  // - Visitor: Anyone who started the funnel (all entries)
  // - Lead/Contact: Has ANY contact field (name OR phone OR email)
  
  const isLead = (lead: FunnelLead) => !!(lead.name || lead.phone || lead.email);
  const isBooked = (lead: FunnelLead) => isLead(lead) && !!lead.calendly_booking_data;

  const data = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    // Always return data for the last 14 days, even if empty
    return days.map(day => {
      if (!leads.length) {
        return {
          date: format(day, 'MMM d'),
          fullDate: format(day, 'EEEE, MMM d'),
          visitors: 0,
          leads: 0,
        };
      }

      // Use isSameDay for timezone-safe date comparison
      // This compares dates only (year, month, day) regardless of timezone
      const dayEntries = leads.filter(l => {
        const leadDate = new Date(l.created_at);
        return isSameDay(leadDate, day);
      });

      const visitors = dayEntries.length;
      const leadsCount = dayEntries.filter(isLead).length;
      const booked = dayEntries.filter(isBooked).length;

      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'EEEE, MMM d'),
        visitors,
        leads: leadsCount,
      };
    });
  }, [leads]);

  // Summary stats (always calculate, even if 0)
  const totalVisitors = leads.length || 0;
  const totalLeads = leads.filter(isLead).length || 0;
  const totalBooked = leads.filter(isBooked).length || 0;
  
  // Conversion rates
  const leadRate = totalVisitors > 0 ? Math.round((totalLeads / totalVisitors) * 100) : 0;
  const bookingRate = totalLeads > 0 ? Math.round((totalBooked / totalLeads) * 100) : 0;
  const overallConversion = totalVisitors > 0 ? Math.round((totalBooked / totalVisitors) * 100) : 0;

  // Week over week comparison - use startOfDay for consistent day boundaries
  const now = new Date();
  const weekAgo = startOfDay(subDays(now, 7));
  const twoWeeksAgo = startOfDay(subDays(now, 14));
  
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

  // Calculate drop-off rate
  const dropOffRate = totalVisitors > 0 ? Math.round(((totalVisitors - totalLeads) / totalVisitors) * 100) : 0;

  // Toggle state for step analysis
  const [showStepAnalysis, setShowStepAnalysis] = useState(false);

  return (
    <div className="space-y-4">
      {/* Chart - Emphasized */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold mb-1">Leads vs. Visitors</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Conversion: <span className="font-medium text-foreground">{leadRate}%</span></span>
              <span>•</span>
              <span>Drop-off: <span className="font-medium text-destructive">{dropOffRate}%</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground">Visitors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Leads</span>
              </div>
            </div>
            {selectedFunnelId !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStepAnalysis(!showStepAnalysis)}
                disabled={!steps || steps.length === 0}
              >
                {showStepAnalysis ? 'Hide' : 'Show'} Drop-off Analysis
                <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showStepAnalysis && "rotate-180")} />
              </Button>
            )}
          </div>
        </div>
        <div className="h-[350px] relative">
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
                strokeWidth={2}
                fill="url(#leadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
          {totalVisitors === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm font-medium text-muted-foreground mb-1">No data available</p>
              <p className="text-xs text-muted-foreground/70">Adjust the filter or get visitors to your funnels</p>
            </div>
          )}
        </div>

        {/* Step-by-Step Drop-off Analysis - Collapsible */}
        {showStepAnalysis && selectedFunnelId !== 'all' && (
          steps && steps.length > 0 ? (
            <div className="mt-6 pt-6 border-t">
              <StepByStepAnalysis steps={steps} leads={leads || []} funnelName={funnelName} />
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No steps found for this funnel. Add steps to see drop-off analysis.
                </p>
              </div>
            </div>
          )
        )}
      </Card>
    </div>
  );
}

// Helper function to get step label (supports both old and V3 formats)
function getStepLabel(step: FunnelStep, index: number): string {
  // V3 format: use name field if available
  if (step.name) return step.name;
  
  // Old format: use content headline/question
  const headline = step.content?.headline || step.content?.question;
  if (headline) return headline;
  
  // Fallback to step_type-based labels
  switch (step.step_type) {
    case 'welcome':
      return 'Welcome';
    case 'multi_choice':
      return `Question ${index + 1}`;
    case 'text_question':
      return `Question ${index + 1}`;
    case 'email_capture':
      return 'Email Capture';
    case 'phone_capture':
      return 'Phone Capture';
    case 'opt_in':
      return 'Opt-in';
    case 'thank_you':
      return 'Thank You';
    case 'page':
      return `Page ${index + 1}`;
    case 'step':
      return `Step ${index + 1}`;
    default:
      return `Step ${index + 1}`;
  }
}

// Step-by-Step Analysis Component
function StepByStepAnalysis({ steps, leads, funnelName }: { steps: FunnelStep[]; leads: FunnelLead[]; funnelName?: string }) {
  const stepData = useMemo(() => {
    if (!steps?.length || !leads?.length) return [];

    // Sort ALL steps by order_index
    const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

    // Track question index separately for answer key mapping
    let questionIndex = 0;
    
    // Build the answer key for each step
    const getAnswerKeysForStep = (step: FunnelStep, qIdx: number): string[] => {
      const idx = qIdx + 1; // 1-based index
      switch (step.step_type) {
        case 'multi_choice':
          return [`choice_${idx}`, `choice_${step.order_index + 1}`];
        case 'text_question':
          return [`question_${idx}`, `question_${step.order_index + 1}`];
        case 'email_capture':
          return ['email'];
        case 'phone_capture':
          return ['phone'];
        case 'opt_in':
          return ['opt_in', 'name'];
        default:
          return [];
      }
    };

    // Count leads that reached each step
    const stepCounts = sortedSteps.map((step, displayIndex) => {
      const isQuestionStep = ['multi_choice', 'text_question', 'email_capture', 'phone_capture', 'opt_in'].includes(step.step_type);
      const currentQuestionIndex = isQuestionStep ? questionIndex : -1;
      
      if (isQuestionStep) {
        questionIndex++;
      }
      
      const answerKeys = isQuestionStep ? getAnswerKeysForStep(step, currentQuestionIndex) : [];
      
      const views = leads.filter(lead => {
        // First step (Welcome) - all leads who started count
        if (step.order_index === 0) {
          return true;
        }
        
        // Method 1: Check if lead reached this step index or beyond via last_step_index
        const reachedByIndex = lead.last_step_index !== undefined && 
                               lead.last_step_index !== null &&
                               lead.last_step_index >= step.order_index;
        
        // Method 2: For question steps, check if answer exists
        const hasAnswer = isQuestionStep && lead.answers && answerKeys.some(key => {
          const value = lead.answers?.[key];
          return value !== undefined && value !== null && value !== '';
        });
        
        // Method 3: Check if they have ANY answers for later steps (means they passed this one)
        const hasLaterAnswers = lead.answers && Object.keys(lead.answers).length > 0 && 
          sortedSteps.slice(displayIndex + 1).some(laterStep => {
            const laterIsQuestion = ['multi_choice', 'text_question', 'email_capture', 'phone_capture', 'opt_in'].includes(laterStep.step_type);
            if (!laterIsQuestion) return false;
            
            // Check common answer keys
            const laterKeys = ['email', 'phone', 'name', 'opt_in'];
            for (let i = 1; i <= 10; i++) {
              laterKeys.push(`choice_${i}`, `question_${i}`);
            }
            return laterKeys.some(key => {
              const val = lead.answers?.[key];
              return val !== undefined && val !== null && val !== '';
            });
          });
        
        // Method 4: If lead has email/phone, they passed earlier steps
        const hasContactInfo = !!(lead.email || lead.phone);
        const isEarlyStep = step.order_index < sortedSteps.length - 2; // Not one of the last 2 steps
        
        return reachedByIndex || hasAnswer || hasLaterAnswers || (hasContactInfo && isEarlyStep);
      }).length;

      // Completed = leads that reached this step AND have answers/contact info
      const completed = leads.filter(lead => {
        if (step.order_index === 0) return true;
        
        if (isQuestionStep && lead.answers) {
          return answerKeys.some(key => {
            const value = lead.answers?.[key];
            return value !== undefined && value !== null && value !== '';
          });
        }
        
        // For non-question steps, check if they reached here
        const reachedByIndex = lead.last_step_index !== undefined && 
                               lead.last_step_index !== null &&
                               lead.last_step_index >= step.order_index;
        return reachedByIndex;
      }).length;

      return {
        name: getStepLabel(step, displayIndex),
        stepType: step.step_type,
        orderIndex: step.order_index,
        views,
        completed,
      };
    });

    // Calculate drop-off and conversion rates
    const totalStarted = leads.length;
    
    return stepCounts.map((step, i) => {
      const prevViews = i === 0 ? totalStarted : stepCounts[i - 1].views;
      const dropOffRate = prevViews > 0 ? Math.round(((prevViews - step.views) / prevViews) * 100) : 0;
      const retentionRate = totalStarted > 0 ? Math.round((step.views / totalStarted) * 100) : 0;
      
      return {
        ...step,
        dropOffRate,
        retentionRate,
      };
    });
  }, [steps, leads]);

  if (!stepData.length) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold mb-1">Step-by-Step Funnel Analysis</h3>
          {funnelName && (
            <p className="text-sm text-muted-foreground">{funnelName}</p>
          )}
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            {funnelName ? `No step data available for ${funnelName}` : 'No step data available'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {steps.length} steps, {leads.length} leads
          </p>
        </div>
      </Card>
    );
  }

  const totalStarted = leads.length;
  const maxDropOff = Math.max(...stepData.map(d => d.dropOffRate));

  return (
    <div className="space-y-6">
      {/* Visual Funnel Flow - Where Drop-offs Happen */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-1">Where Drop-offs Are Happening</h3>
          {funnelName && (
            <p className="text-sm text-muted-foreground">{funnelName}</p>
          )}
          {maxDropOff > 0 && (
            <p className="text-xs text-destructive mt-1 font-medium">
              Highest drop-off: {maxDropOff}% at {stepData.find(s => s.dropOffRate === maxDropOff)?.name || 'a step'}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          {stepData.map((step, i) => {
            const prevViews = i === 0 ? totalStarted : stepData[i - 1].views;
            const isHighestDropOff = step.dropOffRate === maxDropOff && step.dropOffRate > 0;
            
            return (
              <div key={i} className="space-y-2">
                {/* Step Row */}
                <div className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-muted-foreground">
                    {i === 0 ? 'Started' : step.name}
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative h-8 bg-muted rounded-md overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-md transition-all",
                            step.retentionRate >= 80 ? "bg-emerald-500/20" :
                            step.retentionRate >= 50 ? "bg-yellow-500/20" :
                            "bg-red-500/20"
                          )}
                          style={{ width: `${step.retentionRate}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                          <span className="text-foreground">{step.views.toLocaleString()}</span>
                          <span className="text-muted-foreground">{step.retentionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Drop-off Indicator - Highlighted */}
                {i < stepData.length - 1 && (
                  <div className="flex items-center gap-4 pl-28">
                    <div className={cn(
                      "flex items-center gap-2 text-xs px-2 py-1 rounded",
                      isHighestDropOff ? "bg-destructive/10" : step.dropOffRate > 0 ? "bg-muted/50" : ""
                    )}>
                      {step.dropOffRate > 0 && (
                        <AlertTriangle className={cn(
                          "h-3.5 w-3.5",
                          isHighestDropOff ? "text-destructive" : "text-muted-foreground"
                        )} />
                      )}
                      <span className={cn(
                        "font-medium",
                        isHighestDropOff ? "text-destructive font-semibold" : 
                        step.dropOffRate > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.dropOffRate > 0 ? (
                          <>
                            <span className="font-bold">{step.dropOffRate}%</span> drop-off
                            {isHighestDropOff && <span className="ml-1">⚠️ Highest</span>}
                          </>
                        ) : (
                          'No drop-off'
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Breakdown Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Detailed Breakdown</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Drop-off rate</TableHead>
              <TableHead className="text-right">Retention %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stepData.map((row, i) => (
              <TableRow 
                key={i}
                className={row.dropOffRate === maxDropOff && row.dropOffRate > 0 ? 'bg-destructive/5' : ''}
              >
                <TableCell className="font-medium">
                  {i === 0 ? 'Started' : row.name}
                </TableCell>
                <TableCell className="text-right">{row.views.toLocaleString()}</TableCell>
                <TableCell className="text-right">{row.completed.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {row.dropOffRate > 0 ? (
                    <span className="text-destructive">-{row.dropOffRate}%</span>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{row.retentionRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  subtext,
  compact = false
}: { 
  label: string; 
  value: number | string; 
  change?: number;
  icon: any;
  color: 'gray' | 'blue' | 'cyan';
  subtext?: string;
  compact?: boolean;
}) {
  const colorClasses = {
    gray: 'bg-muted/50 text-muted-foreground',
    blue: 'bg-blue-500/10 text-blue-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
  };

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className={cn("p-1.5 rounded-md", colorClasses[color])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          {change !== undefined && change !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              change > 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">{typeof value === 'string' ? value : value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtext}</p>}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        {change !== undefined && change !== 0 && (
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
        <p className="text-2xl font-bold text-foreground">{typeof value === 'string' ? value : value.toLocaleString()}</p>
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
      </div>
    </div>
  );
}
