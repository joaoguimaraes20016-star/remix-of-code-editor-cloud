import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DealCard } from "./DealCard";
import { AppointmentFilters } from "./AppointmentFilters";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  lead_name: string;
  lead_email: string;
  start_at_utc: string;
  cc_collected: number | null;
  mrr_amount: number | null;
  setter_name: string | null;
  event_type_name: string | null;
  updated_at: string;
  pipeline_stage: string | null;
  closer_id: string | null;
}

interface DealPipelineProps {
  teamId: string;
  onCloseDeal: (appointment: Appointment) => void;
}

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-blue-100 text-blue-900 dark:bg-blue-900/20" },
  { id: "contacted", label: "Contacted", color: "bg-purple-100 text-purple-900 dark:bg-purple-900/20" },
  { id: "qualified", label: "Qualified", color: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/20" },
  { id: "proposal", label: "Proposal", color: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-100 text-orange-900 dark:bg-orange-900/20" },
  { id: "won", label: "Won", color: "bg-green-100 text-green-900 dark:bg-green-900/20" },
  { id: "lost", label: "Lost", color: "bg-red-100 text-red-900 dark:bg-red-900/20" },
];

export function DealPipeline({ teamId, onCloseDeal }: DealPipelineProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadDeals();

    const channel = supabase
      .channel('pipeline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("team_id", teamId)
        .not("closer_id", "is", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error loading deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = useMemo(() => {
    const types = new Set(
      appointments
        .map((a) => a.event_type_name)
        .filter((type): type is string => type !== null)
    );
    return Array.from(types);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        !searchQuery ||
        appointment.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.lead_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEventType =
        eventTypeFilter === "all" || appointment.event_type_name === eventTypeFilter;

      return matchesSearch && matchesEventType;
    });
  }, [appointments, searchQuery, eventTypeFilter]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    PIPELINE_STAGES.forEach((stage) => {
      grouped[stage.id] = filteredAppointments.filter(
        (app) => (app.pipeline_stage || "new") === stage.id
      );
    });
    return grouped;
  }, [filteredAppointments]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const appointmentId = active.id as string;
    const newStage = over.id as string;

    // Optimistic update
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, pipeline_stage: newStage } : app
      )
    );

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ pipeline_stage: newStage })
        .eq("id", appointmentId);

      if (error) throw error;
      toast.success("Deal moved successfully");
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast.error("Failed to move deal");
      loadDeals(); // Revert on error
    }
  };

  const handleMoveTo = async (appointmentId: string, stage: string) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, pipeline_stage: stage } : app
      )
    );

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ pipeline_stage: stage })
        .eq("id", appointmentId);

      if (error) throw error;
      toast.success(`Deal moved to ${stage}`);
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast.error("Failed to move deal");
      loadDeals();
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {PIPELINE_STAGES.map((stage) => (
          <Skeleton key={stage.id} className="h-96" />
        ))}
      </div>
    );
  }

  const activeAppointment = appointments.find((app) => app.id === activeId);

  return (
    <div>
      <AppointmentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        eventTypeFilter={eventTypeFilter}
        onEventTypeFilterChange={setEventTypeFilter}
        eventTypes={eventTypes}
        onClearFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setEventTypeFilter("all");
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {PIPELINE_STAGES.map((stage) => {
            const deals = dealsByStage[stage.id] || [];
            const totalValue = deals.reduce(
              (sum, deal) =>
                sum + (deal.cc_collected || 0) + (deal.mrr_amount || 0) * 12,
              0
            );

            return (
              <Card key={stage.id} className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-sm mb-1">{stage.label}</h3>
                  <div className="text-xs text-muted-foreground">
                    {deals.length} deal{deals.length !== 1 ? 's' : ''}
                  </div>
                  {totalValue > 0 && (
                    <div className="text-xs font-medium mt-1">
                      ${totalValue.toLocaleString()}
                    </div>
                  )}
                </div>

                <SortableContext
                  items={deals.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                  id={stage.id}
                >
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    {deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        id={deal.id}
                        appointment={deal}
                        onCloseDeal={onCloseDeal}
                        onMoveTo={handleMoveTo}
                      />
                    ))}
                  </ScrollArea>
                </SortableContext>
              </Card>
            );
          })}
        </div>

        <DragOverlay>
          {activeId && activeAppointment ? (
            <Card className="p-3 rotate-3 opacity-90">
              <div className="font-medium text-sm">{activeAppointment.lead_name}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
