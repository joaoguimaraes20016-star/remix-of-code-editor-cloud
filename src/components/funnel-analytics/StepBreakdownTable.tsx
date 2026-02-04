import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: { headline?: string; question?: string };
}

interface FunnelLead {
  id: string;
  answers: Record<string, string>;
  last_step_index?: number | null;
  email?: string | null;
  phone?: string | null;
}

interface StepBreakdownTableProps {
  steps: FunnelStep[];
  leads: FunnelLead[];
  funnelName?: string;
}

function getStepLabel(step: FunnelStep, index: number): string {
  const headline = step.content?.headline || step.content?.question;
  if (headline) return headline;
  
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
    default:
      return `Step ${index + 1}`;
  }
}

export function StepBreakdownTable({ steps, leads, funnelName }: StepBreakdownTableProps) {
  const tableData = useMemo(() => {
    if (!steps.length || !leads.length) return [];

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
          const value = lead.answers[key];
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
              const val = lead.answers[key];
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
            const value = lead.answers[key];
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
      const conversionRate = totalStarted > 0 ? Math.round((step.views / totalStarted) * 100) : 0;
      
      return {
        ...step,
        dropOffRate,
        conversionRate,
      };
    });
  }, [steps, leads]);

  if (!tableData.length) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          {funnelName ? `No data available for ${funnelName}` : 'Select a funnel to view step breakdown'}
        </p>
      </div>
    );
  }

  // Find the step with highest drop-off
  const maxDropOff = Math.max(...tableData.map(d => d.dropOffRate));

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Breakdown by step</h3>
        {funnelName && (
          <p className="text-sm text-muted-foreground mt-1">{funnelName}</p>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Completed</TableHead>
            <TableHead className="text-right">Drop-off rate</TableHead>
            <TableHead className="text-right">Conversion %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row, i) => (
            <TableRow 
              key={i}
              className={row.dropOffRate === maxDropOff && row.dropOffRate > 0 ? 'bg-destructive/5' : ''}
            >
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right">{row.views}</TableCell>
              <TableCell className="text-right">{row.completed}</TableCell>
              <TableCell className="text-right">
                {row.dropOffRate > 0 ? (
                  <span className="text-destructive">-{row.dropOffRate}%</span>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </TableCell>
              <TableCell className="text-right">{row.conversionRate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
