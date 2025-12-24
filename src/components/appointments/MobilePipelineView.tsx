import { useState } from "react";
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

type PipelineCard =
  | { kind: "appointment"; appointment: Appointment }
  | { kind: "lead"; lead: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      created_at: string | null;
      contact_id: string | null;
      pipeline_stage?: string | null;
      answers?: Record<string, any> | null;
    } };

interface MobilePipelineViewProps {
  teamId: string;
  stages: PipelineStage[];
  cardsByStage: Record<string, PipelineCard[]>;
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
  cardsByStage,
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
  const orderedStages = stages;

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const selectedStage = orderedStages[selectedStageIndex];
  const stageCards = cardsByStage[selectedStage.stage_id] || [];

  const goToPrevStage = () => {
    setSelectedStageIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextStage = () => {
    setSelectedStageIndex((prev) => Math.min(orderedStages.length - 1, prev + 1));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stage Selector - compact app-like tabs */}
      <div className="flex items-center gap-1 mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={goToPrevStage}
          disabled={selectedStageIndex === 0}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {/* Scrollable stage pills */}
        <ScrollArea className="flex-1">
          <div className="flex gap-1 pb-0.5">
            {orderedStages.map((stage, index) => {
              const count = cardsByStage[stage.stage_id]?.length || 0;
              const isSelected = index === selectedStageIndex;
              
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageIndex(index)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  style={isSelected ? {
                    backgroundColor: stage.stage_color,
                    color: 'white'
                  } : undefined}
                >
                  <span className="truncate max-w-[60px]">{stage.stage_label}</span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    isSelected ? "opacity-80" : "opacity-60"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={goToNextStage}
          disabled={selectedStageIndex === orderedStages.length - 1}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Stage Header - minimal */}
      <div
        className="mb-2 px-2 py-1.5 rounded-lg border-l-2"
        style={{
          borderLeftColor: selectedStage.stage_color,
          backgroundColor: `${selectedStage.stage_color}10`,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[11px]">{selectedStage.stage_label}</span>
          <span className="text-[10px] text-muted-foreground">
            {stageCards.length} {stageCards.length === 1 ? 'deal' : 'deals'}
          </span>
        </div>
      </div>

      {/* Appointments List */}
      <ScrollArea className="flex-1 -mx-0.5 px-0.5">
        <div className="space-y-2 pb-3">
          {stageCards.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-[11px] text-muted-foreground">
              No deals in this stage
            </div>
          ) : (
            stageCards.map((card) => {
              if (card.kind === "lead") {
                const lead = card.lead;
                const baseAppointment: Appointment = {
                  id: lead.id,
                  lead_name: lead.name || lead.email || "Unnamed lead",
                  lead_email: lead.email || "",
                  start_at_utc: lead.created_at || new Date().toISOString(),
                  cc_collected: null,
                  mrr_amount: null,
                  mrr_months: null,
                  product_name: null,
                  setter_name: null,
                  setter_id: null,
                  closer_id: null,
                  closer_name: null,
                  team_id: teamId,
                  event_type_name: null,
                  updated_at: lead.created_at || new Date().toISOString(),
                  pipeline_stage: lead.pipeline_stage ?? "opt_in",
                  status: null,
                  reschedule_url: null,
                  calendly_invitee_uri: null,
                  original_appointment_id: null,
                  rescheduled_to_appointment_id: null,
                  reschedule_count: 0,
                  rebooking_type: null,
                };

                const adaptedAppointment = {
                  ...baseAppointment,
                  ...(lead.answers ? { answers: lead.answers } : {}),
                } as Appointment & Record<string, any>;

                return (
                  <DealCard
                    key={`lead:${lead.id}`}
                    id={`lead:${lead.id}`}
                    teamId={teamId}
                    appointment={adaptedAppointment}
                    onCloseDeal={() => {}}
                    onMoveTo={() => {}}
                    onDelete={() => {}}
                    onUndo={() => {}}
                    onChangeStatus={() => {}}
                    onClearDealData={() => {}}
                    userRole={userRole}
                    allowSetterPipelineUpdates={allowSetterPipelineUpdates}
                    mode="lead"
                  />
                );
              }

              const appointment = card.appointment;
              return (
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
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Quick stage navigation dots - smaller */}
      <div className="flex justify-center gap-1 pt-1.5 pb-0.5">
        {orderedStages.map((stage, index) => (
          <button
            key={stage.id}
            onClick={() => setSelectedStageIndex(index)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              index === selectedStageIndex
                ? "bg-primary w-3"
                : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
            )}
            aria-label={`Go to ${stage.stage_label}`}
          />
        ))}
      </div>
    </div>
  );
}
