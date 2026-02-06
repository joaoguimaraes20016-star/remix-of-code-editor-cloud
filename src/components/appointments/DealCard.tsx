import { useState, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditAppointmentDialog } from "./EditAppointmentDialog";
import { RescheduleHistory } from "./RescheduleHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { GripVertical, MoreVertical, Calendar, MessageSquare, Undo2, History, ArrowRight, AlertTriangle, RefreshCw, Video, ExternalLink, Copy, Check } from "lucide-react";
import { CollapsibleNotes } from "./CollapsibleNotes";
import { differenceInDays, format, parseISO } from "date-fns";
import { formatDateTimeWithTimezone } from "@/lib/utils";
import { DealAvatar } from "./DealAvatar";
import { ActivityTimeline } from "./ActivityTimeline";

// Helper to filter and clean answers for display
function getDisplayableAnswers(answers: Record<string, any>): Array<[string, string]> {
  if (!answers || typeof answers !== 'object') return [];
  
  const identityKeys = ['name', 'email', 'phone', 'phoneCountryCode'];
  const systemKeys = ['opt_in', 'privacy', 'legal', 'consent', 'undefined'];
  
  return Object.entries(answers)
    .filter(([key, value]) => {
      // Filter out null/undefined values
      if (!value) return false;
      
      // Filter out identity fields (already shown in contact header)
      if (identityKeys.includes(key)) return false;
      
      // Filter out system fields
      if (systemKeys.includes(key)) return false;
      
      // Filter out UUIDs (block IDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(key)) return false;
      
      // Filter out pure numeric keys (form field IDs)
      if (/^\d+$/.test(key)) return false;
      
      return true;
    })
    .map(([key, value]) => {
      // Convert complex objects to readable strings
      let displayValue: string;
      if (typeof value === 'object') {
        // Try to extract meaningful data from objects
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else {
          displayValue = JSON.stringify(value);
        }
      } else {
        displayValue = String(value);
      }
      
      return [key, displayValue];
    });
}

export interface DealCardProps {
  id: string;
  teamId: string;
  appointment: {
    id: string;
    lead_name: string;
    lead_email: string;
    start_at_utc: string;
    cc_collected: number | null;
    mrr_amount: number | null;
    setter_name: string | null;
    closer_name: string | null;
    updated_at: string;
    pipeline_stage: string | null;
    status: string | null;
    original_appointment_id: string | null;
    rescheduled_to_appointment_id: string | null;
    reschedule_count: number;
    rebooking_type?: string | null;
    retarget_date?: string | null;
    closer_id?: string | null;
    setter_notes?: string | null;
    closer_notes?: string | null;
    meeting_link?: string | null;
  };
  confirmationTask?: {
    completed_confirmations: number;
    required_confirmations: number;
    status: string;
  } | null;
  onCloseDeal: (appointment: any) => void;
  onMoveTo: (id: string, stage: string) => void;
  onDelete?: (id: string) => void;
  onUndo?: (id: string) => void;
  onChangeStatus?: (id: string, currentStatus: string | null, dealName: string) => void;
  onClearDealData?: (id: string) => void;
  userRole?: string;
  allowSetterPipelineUpdates?: boolean;
  mode?: "appointment" | "lead";
}

// Meeting Link Dropdown Component
function MeetingLinkDropdown({ meetingLink }: { meetingLink: string }) {
  const [copied, setCopied] = useState(false);
  
  const getMeetingType = () => {
    if (meetingLink.includes('zoom')) return 'Zoom';
    if (meetingLink.includes('meet.google')) return 'Meet';
    if (meetingLink.includes('teams')) return 'Teams';
    return 'Join';
  };

  const getMeetingColor = () => {
    if (meetingLink.includes('zoom')) return 'from-blue-500 to-blue-600';
    if (meetingLink.includes('meet.google')) return 'from-green-500 to-green-600';
    if (meetingLink.includes('teams')) return 'from-purple-500 to-purple-600';
    return 'from-primary to-primary/80';
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(meetingLink, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gradient-to-r ${getMeetingColor()} text-white text-[10px] sm:text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200`}>
          <Video className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{getMeetingType()}</span>
          <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-75" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-50 bg-popover border shadow-lg">
        <DropdownMenuItem onClick={handleJoin} className="cursor-pointer">
          <Video className="h-4 w-4 mr-2" />
          Join Meeting
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DealCardComponent({ id, teamId, appointment, confirmationTask, onCloseDeal, onMoveTo, onDelete, onUndo, onChangeStatus, onClearDealData, userRole, allowSetterPipelineUpdates, mode = "appointment" }: DealCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRescheduleHistory, setShowRescheduleHistory] = useState(false);

  // Use stored original_closer_name from appointment record
  const originalCloserName = (appointment as any).original_closer_name;
  const hasCloserReassignment = originalCloserName && appointment.closer_name && originalCloserName !== appointment.closer_name;
  
  // Determine if the user can drag this card
  const canDrag = !(userRole === 'setter' && !allowSetterPipelineUpdates);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canDrag });

  const canDelete = userRole === 'admin' || userRole === 'offer_owner';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dealValue = (appointment.cc_collected || 0) + (appointment.mrr_amount || 0) * 12;
  const daysInStage = differenceInDays(new Date(), new Date(appointment.updated_at));
  
  const getDaysColor = (days: number) => {
    if (days < 7) return "text-success";
    if (days < 14) return "text-chart-2";
    return "text-destructive";
  };

  // Show revenue clearly (use canonical cc_collected only)
  const depositAmount = Number(appointment.cc_collected ?? 0);
  const hasRevenue = mode === "appointment" && (depositAmount > 0 || (appointment.mrr_amount || 0) > 0);
  const rawAnswers = (appointment as any)?.answers ?? {};
  const isLead = mode === "lead";
  const isNoShow = appointment.pipeline_stage === 'no_show';
  const isCancelled = appointment.pipeline_stage === 'cancelled';
  const isConfirmed = appointment.status === 'CONFIRMED' && !isNoShow && !isCancelled;
  const isRescheduled = appointment.status === 'RESCHEDULED' || appointment.pipeline_stage === 'rescheduled';
  const isClosed = appointment.pipeline_stage === 'won' || appointment.pipeline_stage?.toLowerCase().includes('closed');
  const hasRebookingType = appointment.rebooking_type && ['rebooking', 'reschedule', 'returning_client', 'win_back'].includes(appointment.rebooking_type);
  const showUndoButton = (isClosed || hasRevenue) && onUndo;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="group relative bg-card p-3 sm:p-4 hover:shadow-md hover:border-primary/40 transition-all duration-200 border border-border/50 overflow-hidden select-none"
      >
        <div className="relative z-10">
          {canDrag && (
            <div className="opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0 transition-opacity">
              <div
                className="p-1 rounded-md hover:bg-muted/50 cursor-grab"
                {...attributes}
                {...listeners}
                aria-label="Drag handle"
                title="Drag"
              >
                <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
            </div>
          )}
          
          {hasRevenue && (
            <div className="flex-1 space-y-1 sm:space-y-2">
              {depositAmount > 0 && (
                <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-3 bg-success/10 border border-success/30 rounded-md sm:rounded-lg backdrop-blur-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[10px] text-success font-bold uppercase tracking-wider">Cash</span>
                    <span className="text-sm sm:text-2xl font-black text-success tabular-nums">
                      ${depositAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {appointment.mrr_amount && appointment.mrr_amount > 0 && (
                <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-3 bg-primary/10 border border-primary/30 rounded-md sm:rounded-lg backdrop-blur-sm">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[10px] text-primary font-bold uppercase tracking-wider">MRR</span>
                    <span className="text-sm sm:text-2xl font-black text-primary tabular-nums">
                      ${appointment.mrr_amount.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-0.5">
            {showUndoButton && (
                <Button 
                variant="outline" 
                size="sm"
                className="h-5 sm:h-7 px-1 sm:px-2 gap-0.5 bg-warning/10 hover:bg-warning/20 border-warning/30"
                onClick={() => onUndo!(appointment.id)}
              >
                <Undo2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-[9px] sm:text-xs font-medium hidden sm:inline">Undo</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 sm:h-7 sm:w-7"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-7 sm:w-7 flex-shrink-0">
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {mode === "appointment" && (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      Edit Appointment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCloseDeal(appointment)}>
                      Close Deal
                    </DropdownMenuItem>
                    {canDrag && (
                      <DropdownMenuItem onClick={() => onMoveTo(appointment.id, 'lost')}>
                        Mark as Lost
                      </DropdownMenuItem>
                    )}
                    {onChangeStatus && (
                      <DropdownMenuItem onClick={() => onChangeStatus(appointment.id, appointment.status, appointment.lead_name)}>
                        Change Status
                      </DropdownMenuItem>
                    )}
                    {hasRevenue && onClearDealData && (
                      <DropdownMenuItem onClick={() => onClearDealData(appointment.id)}>
                        Clear Deal Data
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {canDelete && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(appointment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Deal
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-3 flex-wrap">
          {/* Confirmation / Status Badges */}
          {mode === "appointment" && confirmationTask && (
            confirmationTask.completed_confirmations >= confirmationTask.required_confirmations ? (
              <Badge variant="confirmed" className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
                <span className="flex items-center gap-0.5">
                  ✓ <span className="hidden sm:inline">Confirmed</span><span className="sm:hidden">Conf</span>
                </span>
              </Badge>
            ) : confirmationTask.completed_confirmations > 0 ? (
              <Badge variant="confirmed" className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
                <span className="flex items-center gap-0.5">
                  {confirmationTask.completed_confirmations}/{confirmationTask.required_confirmations}
                </span>
              </Badge>
            ) : (
              <Badge variant="pending" className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
                <span className="flex items-center gap-0.5">
                  Pending
                </span>
              </Badge>
            )
          )}

          {/* Lead status badges (Opt-In / Awaiting scheduling) */}
          {isLead && (
            <>
              <Badge className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
                <span className="flex items-center gap-0.5">
                  Opt-In
                </span>
              </Badge>
              <Badge variant="pending" className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
                <span className="flex items-center gap-0.5">
                  Awaiting scheduling
                </span>
              </Badge>
            </>
          )}

          {mode === "appointment" && isNoShow && (
            <Badge className="bg-gradient-to-r from-red-600 to-rose-600 shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                ✗ No Show
              </span>
            </Badge>
          )}
          {mode === "appointment" && isCancelled && (
            <Badge className="bg-gradient-to-r from-gray-600 to-slate-600 shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                ✗ Cancelled
              </span>
            </Badge>
          )}
          {mode === "appointment" && isConfirmed && !confirmationTask && (
            <Badge className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                ✓ Confirmed
              </span>
            </Badge>
          )}
          {mode === "appointment" && isRescheduled && !appointment.original_appointment_id && !appointment.rescheduled_to_appointment_id && (
            <Badge className="shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Rescheduled</span><span className="sm:hidden">Resch</span>
              </span>
            </Badge>
          )}
          {/* Closer Reassignment Warning */}
          {mode === "appointment" && hasCloserReassignment && (
            <Badge className="border-warning bg-warning/10 text-warning-foreground shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Reassigned</span>
              </span>
            </Badge>
          )}
          {/* Rebooking Type Badges */}
          {mode === "appointment" && appointment.rebooking_type === 'rebooking' && (
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Rebook
              </span>
            </Badge>
          )}
          {mode === "appointment" && appointment.rebooking_type === 'reschedule' && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Double Book</span><span className="sm:hidden">Dbl</span>
              </span>
            </Badge>
          )}
          {mode === "appointment" && appointment.rebooking_type === 'returning_client' && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                <span className="hidden sm:inline">Returning</span><span className="sm:hidden">Return</span>
              </span>
            </Badge>
          )}
          {mode === "appointment" && appointment.rebooking_type === 'win_back' && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm text-[9px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 pointer-events-none">
              <span className="flex items-center gap-0.5">
                Win-Back
              </span>
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 sm:space-y-2.5">
          <div>
            <h4 className="font-medium text-[11px] sm:text-base mb-0 sm:mb-1 truncate">{appointment.lead_name}</h4>
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{appointment.lead_email}</p>
          </div>

          {/* Answers Section */}
          {(() => {
            const displayableAnswers = getDisplayableAnswers(rawAnswers || {});
            return displayableAnswers.length > 0 && (
              <div className="pt-2 border-t space-y-1">
                <p className="text-[9px] sm:text-xs font-medium text-muted-foreground">Responses:</p>
                {displayableAnswers.slice(0, 3).map(([question, answer], idx) => (
                  <div key={idx} className="text-[9px] sm:text-xs">
                    <span className="text-muted-foreground truncate block sm:inline">{question}:</span>{' '}
                    <span className="font-medium truncate block sm:inline">{answer}</span>
                  </div>
                ))}
                {displayableAnswers.length > 3 && (
                  <p className="text-[9px] sm:text-xs text-muted-foreground italic">
                    +{displayableAnswers.length - 3} more
                  </p>
                )}
              </div>
            );
          })()}

          {/* Reschedule Badges */}
          {mode === "appointment" && (appointment.original_appointment_id || appointment.rescheduled_to_appointment_id) && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Double Book badge (reschedule type) */}
              {appointment.rebooking_type === 'reschedule' && appointment.original_appointment_id && (
                <Badge 
                  className="bg-amber-500 text-white border-0 cursor-pointer hover:bg-amber-600 flex items-center gap-0.5 text-[9px] sm:text-xs px-1.5 sm:px-2 py-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRescheduleHistory(true);
                  }}
                >
                  <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Double Book</span><span className="sm:hidden">Dbl</span>
                  <ArrowRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5" />
                </Badge>
              )}
              {/* Rebook badge (rebooking type) */}
              {appointment.rebooking_type === 'rebooking' && appointment.original_appointment_id && (
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-purple-400/20 border-purple-400/50 text-purple-500 dark:text-purple-300 flex items-center gap-0.5 text-[9px] sm:text-xs px-1.5 sm:px-2 py-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRescheduleHistory(true);
                  }}
                >
                  <RefreshCw className="h-2 w-2 sm:h-3 sm:w-3" />
                  Rebook
                  <ArrowRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5" />
                </Badge>
              )}
              {/* Generic rebooked lead badge */}
              {appointment.original_appointment_id && !appointment.rebooking_type && (
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-purple-400/20 border-purple-400/50 text-purple-500 dark:text-purple-300 flex items-center gap-0.5 text-[9px] sm:text-xs px-1.5 sm:px-2 py-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRescheduleHistory(true);
                  }}
                >
                  <History className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Rebooked</span><span className="sm:hidden">Reb</span>
                  {appointment.reschedule_count > 0 && (
                    <span className="px-0.5 sm:px-1 bg-purple-400/40 rounded-full text-[8px] sm:text-[10px] font-bold">
                      {appointment.reschedule_count}x
                    </span>
                  )}
                  <ArrowRight className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                </Badge>
              )}
              {/* Double Book badge on ORIGINAL appointment */}
              {appointment.rescheduled_to_appointment_id && (
                <Badge 
                  className="bg-amber-500 text-white border-0 cursor-pointer hover:bg-amber-600 flex items-center gap-0.5 text-[9px] sm:text-xs px-1.5 sm:px-2 py-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRescheduleHistory(true);
                  }}
                >
                  <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Double Book</span><span className="sm:hidden">Dbl</span>
                  <ArrowRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5" />
                </Badge>
              )}
            </div>
          )}

          {/* Team Members - Compact on mobile (show for both appointments and leads, with placeholders when missing) */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {appointment.setter_name ? (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-md sm:rounded-lg border border-primary/20 flex-1 min-w-0">
                <DealAvatar name={appointment.setter_name} className="h-4 w-4 sm:h-7 sm:w-7 ring-1 sm:ring-2 ring-primary/30" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[10px] text-primary/70 font-semibold uppercase tracking-wider">Setter</span>
                  <span className="text-[9px] sm:text-xs font-medium truncate">{appointment.setter_name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 bg-muted/30 rounded-md sm:rounded-lg border border-muted flex-1 min-w-0">
                <DealAvatar name="?" className="h-4 w-4 sm:h-7 sm:w-7 ring-1 sm:ring-2 ring-muted" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Setter</span>
                  <span className="text-[9px] sm:text-xs text-muted-foreground italic">—</span>
                </div>
              </div>
            )}
            
            {appointment.closer_name ? (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-accent/10 to-accent/5 rounded-md sm:rounded-lg border border-accent/20 flex-1 min-w-0">
                <DealAvatar name={appointment.closer_name} className="h-4 w-4 sm:h-7 sm:w-7 ring-1 sm:ring-2 ring-accent/30" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[10px] text-accent/70 font-semibold uppercase tracking-wider">Closer</span>
                  <span className="text-[9px] sm:text-xs font-medium truncate">{appointment.closer_name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 bg-muted/30 rounded-md sm:rounded-lg border border-muted flex-1 min-w-0">
                <DealAvatar name="?" className="h-4 w-4 sm:h-7 sm:w-7 ring-1 sm:ring-2 ring-muted" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Closer</span>
                  <span className="text-[9px] sm:text-xs text-muted-foreground italic">—</span>
                </div>
              </div>
            )}
          </div>

          {/* Setter & Closer Notes - Collapsible (renders for leads too; notes components handle empty states) */}
          <>
            <CollapsibleNotes 
              title="Setter Notes" 
              notes={appointment.setter_notes} 
              variant="setter" 
            />
            <CollapsibleNotes 
              title="Closer Notes" 
              notes={appointment.closer_notes} 
              variant="closer" 
            />
          </>

          {/* Double Book Warning (reschedule type) */}
          {mode === "appointment" && appointment.rebooking_type === 'reschedule' && appointment.original_appointment_id && (
            <div className="text-[9px] sm:text-xs p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border-l-2 sm:border-l-4 bg-amber-500/10 border-amber-400 dark:bg-amber-500/15">
              <strong className="text-amber-700 dark:text-amber-300">DBL BOOK</strong>
              <span className="text-foreground/70 hidden sm:inline"> — Confirm which date is correct!</span>
            </div>
          )}

          {/* Rebook Warning */}
          {mode === "appointment" && appointment.rebooking_type === 'rebooking' && appointment.original_appointment_id && (
            <div className="text-[9px] sm:text-xs p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border-l-2 sm:border-l-4 bg-purple-500/10 border-purple-400 dark:bg-purple-500/15">
              <strong className="text-purple-700 dark:text-purple-300">REBOOK</strong>
              <span className="text-foreground/70 hidden sm:inline"> — Previously booked lead</span>
            </div>
          )}

          {/* Generic rebooked lead */}
          {mode === "appointment" && appointment.original_appointment_id && !appointment.rebooking_type && (
            <div className="text-[9px] sm:text-xs p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border-l-2 sm:border-l-4 bg-purple-500/10 border-purple-400 dark:bg-purple-500/15">
              <strong className="text-purple-700 dark:text-purple-300">REBOOKED</strong>
              <span className="text-foreground/70 hidden sm:inline"> — Has previous booking</span>
            </div>
          )}

          {/* Original appointment with new booking */}
          {mode === "appointment" && appointment.rescheduled_to_appointment_id && (
            <div className="text-[9px] sm:text-xs p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border-l-2 sm:border-l-4 bg-amber-500/10 border-amber-400 dark:bg-amber-500/15">
              <strong className="text-amber-700 dark:text-amber-300">DBL BOOK</strong>
              <span className="text-foreground/70 hidden sm:inline"> — New appointment exists</span>
            </div>
          )}

          <div className="flex flex-col gap-0 sm:gap-1 text-[9px] sm:text-xs pt-1 sm:pt-2 border-t border-primary/10">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-2 w-2 sm:h-3 sm:w-3" />
              <span className="font-medium">
                {mode === "appointment"
                  ? formatDateTimeWithTimezone(appointment.start_at_utc, "MMM d 'at' h:mm a")
                  : "Not booked yet"}
              </span>
            </div>
            {mode === "appointment" ? (
              appointment.meeting_link && (
                <MeetingLinkDropdown meetingLink={appointment.meeting_link} />
              )
            ) : (
              <span className="text-muted-foreground">
                Awaiting scheduling
              </span>
            )}
            <div className={`flex items-center gap-1 font-bold ${mode === "appointment" ? getDaysColor(daysInStage) : "text-muted-foreground"}`}>
              <div className="h-1 w-1 sm:h-2 sm:w-2 rounded-full bg-current animate-pulse" />
              {mode === "appointment" ? `${daysInStage}d in stage` : "New lead"}
            </div>
          </div>
        </div>
      </Card>
      
      {mode === "appointment" && showTimeline && (
        <ActivityTimeline 
          appointmentId={appointment.id}
          teamId={teamId}
          onClose={() => setShowTimeline(false)}
        />
      )}
      
      {mode === "appointment" && showEditDialog && (
        <EditAppointmentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          appointment={appointment}
          teamId={teamId}
        />
      )}

      {mode === "appointment" && showRescheduleHistory && (
        <RescheduleHistory
          open={showRescheduleHistory}
          onOpenChange={setShowRescheduleHistory}
          appointmentId={appointment.id}
        />
      )}
    </>
  );
}
export const DealCard = memo(DealCardComponent);
