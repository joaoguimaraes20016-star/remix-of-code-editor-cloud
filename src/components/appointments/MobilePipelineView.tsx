import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DealCard } from "./DealCard";

interface PipelineStage {
  id: string;
  stage_id: string;
  stage_label: string;
  stage_color: string;
  order_index: number;
  is_default: boolean;
}

interface Appointment {
  id: string;
  lead_name: string;
  lead_email: string;
  start_at_utc: string;
  cc_collected: number | null;
  mrr_amount: number | null;
  mrr_months: number | null;
  product_name: string | null;
  setter_name: string | null;
  setter_id: string | null;
  closer_id: string | null;
  closer_name: string | null;
  team_id: string;
  event_type_name: string | null;
  updated_at: string;
  pipeline_stage: string | null;
  status: string | null;
  reschedule_url: string | null;
  calendly_invitee_uri: string | null;
  original_appointment_id: string | null;
  rescheduled_to_appointment_id: string | null;
  reschedule_count: number;
  rebooking_type?: string | null;
}

interface MobilePipelineViewProps {
  teamId: string;
  stages: PipelineStage[];
  dealsByStage: Record<string, Appointment[]>;
  confirmationTasks: Map<string, any>;
  userRole: string;
  allowSetterPipelineUpdates: boolean;
  onCloseDeal: (appointment: Appointment) => void;
  onMoveTo: (appointmentId: string, stage: string) => void;
  onDelete: (appointmentId: string) => void;
  onUndo: (appointmentId: string) => void;
  onChangeStatus: (appointmentId: string, currentStatus: string | null, dealName: string) => void;
  onClearDealData: (appointmentId: string) => void;
}

export function MobilePipelineView({
  teamId,
  stages,
  dealsByStage,
  confirmationTasks,
  userRole,
  allowSetterPipelineUpdates,
  onCloseDeal,
  onMoveTo,
  onDelete,
  onUndo,
  onChangeStatus,
  onClearDealData,
}: MobilePipelineViewProps) {
  // Build ordered list of stages including "appointments_booked" first
  const orderedStages = [
    { id: 'appointments_booked', stage_id: 'appointments_booked', stage_label: 'Appointments Booked', stage_color: 'hsl(var(--primary))', order_index: -1, is_default: true },
    ...stages.filter(s => s.stage_id !== 'booked')
  ];

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const selectedStage = orderedStages[selectedStageIndex];
  const stageAppointments = dealsByStage[selectedStage.stage_id] || [];

  const goToPrevStage = () => {
    setSelectedStageIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextStage = () => {
    setSelectedStageIndex((prev) => Math.min(orderedStages.length - 1, prev + 1));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stage Selector with swipe navigation */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={goToPrevStage}
          disabled={selectedStageIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable stage tabs */}
        <ScrollArea className="flex-1">
          <div className="flex gap-1.5 pb-1">
            {orderedStages.map((stage, index) => {
              const count = dealsByStage[stage.stage_id]?.length || 0;
              const isSelected = index === selectedStageIndex;
              
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageIndex(index)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                  style={isSelected && stage.stage_id !== 'appointments_booked' ? {
                    backgroundColor: stage.stage_color,
                    color: 'white'
                  } : undefined}
                >
                  <span className="truncate max-w-[80px]">{stage.stage_label}</span>
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className={cn(
                      "h-5 min-w-[20px] px-1.5 text-[10px]",
                      isSelected && "bg-white/20 text-inherit border-0"
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={goToNextStage}
          disabled={selectedStageIndex === orderedStages.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stage Header */}
      <Card 
        className="mb-3 p-3 border-l-4"
        style={{ 
          borderLeftColor: selectedStage.stage_id === 'appointments_booked' 
            ? 'hsl(var(--primary))' 
            : selectedStage.stage_color,
          backgroundColor: selectedStage.stage_id === 'appointments_booked'
            ? 'hsl(var(--primary) / 0.1)'
            : `${selectedStage.stage_color}15`
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{selectedStage.stage_label}</h3>
          <Badge variant="secondary" className="text-xs">
            {stageAppointments.length} {stageAppointments.length === 1 ? 'deal' : 'deals'}
          </Badge>
        </div>
      </Card>

      {/* Appointments List */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-3 pb-4">
          {stageAppointments.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No deals in this stage
            </div>
          ) : (
            stageAppointments.map((appointment) => (
              <DealCard
                key={appointment.id}
                id={appointment.id}
                teamId={teamId}
                appointment={appointment}
                confirmationTask={confirmationTasks.get(appointment.id)}
                onCloseDeal={onCloseDeal}
                onMoveTo={onMoveTo}
                onDelete={onDelete}
                onUndo={onUndo}
                onChangeStatus={onChangeStatus}
                onClearDealData={onClearDealData}
                userRole={userRole}
                allowSetterPipelineUpdates={allowSetterPipelineUpdates}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick stage navigation dots */}
      <div className="flex justify-center gap-1.5 pt-2 pb-1">
        {orderedStages.map((stage, index) => (
          <button
            key={stage.id}
            onClick={() => setSelectedStageIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === selectedStageIndex
                ? "bg-primary w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to ${stage.stage_label}`}
          />
        ))}
      </div>
    </div>
  );
}
