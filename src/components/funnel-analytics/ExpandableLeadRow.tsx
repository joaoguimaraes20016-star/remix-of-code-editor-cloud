import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, CheckCircle, Mail, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: { headline?: string; question?: string };
}

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  opt_in_status: boolean | null;
  calendly_booking_data: any;
  created_at: string;
  answers: Record<string, any>;
  last_step_index: number | null;
  funnel: { name: string; id: string } | null;
}

interface ExpandableLeadRowProps {
  lead: FunnelLead;
  steps?: FunnelStep[];
}

export function ExpandableLeadRow({ lead, steps = [] }: ExpandableLeadRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);
  const lastStepReached = lead.last_step_index ?? 0;
  const totalSteps = sortedSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round(((lastStepReached + 1) / totalSteps) * 100) : 0;

  // Parse answers to display
  const answerEntries = Object.entries(lead.answers || {}).filter(([key, value]) => {
    // Filter out internal keys
    if (key === 'opt_in' || key === 'privacy') return false;
    // Only show non-empty values
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <>
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors",
          isExpanded && "bg-muted/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{lead.name || '—'}</span>
          </div>
        </TableCell>
        <TableCell>{lead.email || '—'}</TableCell>
        <TableCell>{lead.phone || '—'}</TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {lead.funnel?.name || 'Unknown'}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge 
            variant="outline"
            className={cn(
              "text-xs",
              lead.calendly_booking_data 
                ? "border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                : lead.opt_in_status
                ? "border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-500/10"
                : ""
            )}
          >
            {lead.calendly_booking_data ? 'Booked' : lead.opt_in_status ? 'Opted In' : lead.status}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
        </TableCell>
      </TableRow>

      {/* Expanded details */}
      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={6} className="p-0">
            <div className="p-4 space-y-4 border-t border-b border-border/50">
              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">Progress:</span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    Step {lastStepReached + 1} of {totalSteps} ({progressPercent}%)
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{lead.name || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{lead.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{lead.phone || 'Not provided'}</span>
                </div>
              </div>

              {/* Opt-in & Booking status */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={cn("h-4 w-4", lead.opt_in_status ? "text-emerald-500" : "text-muted-foreground")} />
                  <span className="text-muted-foreground">Opt-in:</span>
                  <span className={cn("font-medium", lead.opt_in_status && "text-emerald-500")}>
                    {lead.opt_in_status ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className={cn("h-4 w-4", lead.calendly_booking_data ? "text-purple-500" : "text-muted-foreground")} />
                  <span className="text-muted-foreground">Booking:</span>
                  <span className={cn("font-medium", lead.calendly_booking_data && "text-purple-500")}>
                    {lead.calendly_booking_data 
                      ? format(new Date(lead.calendly_booking_data.event_start_time || lead.calendly_booking_data.booked_at), 'MMM d, yyyy h:mm a')
                      : 'Not booked'}
                  </span>
                </div>
              </div>

              {/* Answers */}
              {answerEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Answers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {answerEntries.map(([key, value]) => {
                      // Try to find the step this answer belongs to
                      const stepMatch = key.match(/question_(\d+)|choice_(\d+)/);
                      const stepIndex = stepMatch ? parseInt(stepMatch[1] || stepMatch[2]) : null;
                      const step = stepIndex !== null ? sortedSteps[stepIndex] : null;
                      
                      const question = step?.content?.headline || step?.content?.question || formatAnswerKey(key);
                      const answer = typeof value === 'object' ? JSON.stringify(value) : String(value);
                      
                      return (
                        <div key={key} className="bg-card border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">{stripHtml(question)}</p>
                          <p className="text-sm font-medium">{answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Drop-off indicator for incomplete leads */}
              {lead.status !== 'lead' && lead.status !== 'booked' && lastStepReached < totalSteps - 1 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 px-3 py-2 rounded-lg">
                  <span className="font-medium">Dropped off at:</span>
                  <span>{getStepLabel(sortedSteps[lastStepReached], lastStepReached)}</span>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function formatAnswerKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/question \d+/i, 'Question')
    .replace(/choice \d+/i, 'Choice')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

function getStepLabel(step: { step_type: string; content?: { headline?: string } } | undefined, index: number): string {
  if (!step) return `Step ${index + 1}`;
  
  const headline = step.content?.headline;
  if (headline) {
    const text = headline.replace(/<[^>]*>/g, '').trim();
    return text.length > 30 ? text.slice(0, 30) + '...' : text;
  }
  
  const typeLabels: Record<string, string> = {
    welcome: 'Welcome',
    text_question: 'Question',
    multi_choice: 'Multi-Choice',
    email_capture: 'Email Capture',
    phone_capture: 'Phone Capture',
    opt_in: 'Opt-In Form',
    video: 'Video',
    embed: 'Embed',
    thank_you: 'Thank You',
  };
  
  return typeLabels[step.step_type] || `Step ${index + 1}`;
}
