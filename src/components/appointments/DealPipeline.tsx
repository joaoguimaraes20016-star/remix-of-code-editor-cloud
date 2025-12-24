import { useState, useEffect, useMemo, useRef, MutableRefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUndoAction } from "@/hooks/useUndoAction";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DealCard } from "./DealCard";
import { PipelineStageManager } from "./PipelineStageManager";
import { AppointmentFilters } from "./AppointmentFilters";
import { MobilePipelineView } from "./MobilePipelineView";
import { DateRangeFilter, DateRangePreset } from "@/components/DateRangeFilter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Settings, ArrowUpDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DroppableStageColumn } from "./DroppableStageColumn";
import { RescheduleDialog } from "./RescheduleDialog";
import { RescheduleWithLinkDialog } from "./RescheduleWithLinkDialog";
import { FollowUpDialog } from "./FollowUpDialog";
import { ChangeStatusDialog } from "./ChangeStatusDialog";
import { DepositCollectedDialog } from "./DepositCollectedDialog";
import { PipelineMoveDialog } from "./PipelineMoveDialog";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { getUserFriendlyError } from "@/lib/errorUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getActionPipelineMappings } from "@/lib/actionPipelineMappings";
import { useSearchParams } from "react-router-dom";


interface Appointment {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string | null;
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
  created_at: string | null;
  pipeline_stage: string | null;
  status: string | null;
  reschedule_url: string | null;
  calendly_invitee_uri: string | null;
  original_appointment_id: string | null;
  rescheduled_to_appointment_id: string | null;
  reschedule_count: number;
  rebooking_type?: string | null;
  setter_notes?: string | null;
  closer_notes?: string | null;
  contact_id?: string | null;
}

interface OptInLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  contact_id: string | null;
  pipeline_stage?: string | null;
  answers?: Record<string, any> | null;
}

interface PipelineStageResolverContext {
  hasActiveAppointmentForContactId?: (contactId: string | null) => boolean;
}

function resolvePipelineStageForLead(
  lead: OptInLead,
  ctx?: PipelineStageResolverContext
): string {
  const explicitStage = (lead.pipeline_stage || "").trim();
  if (explicitStage) {
    return explicitStage;
  }

  const hasContactInfo = Boolean(
    (lead.email && lead.email.trim()) ||
    (lead.phone && lead.phone.trim()) ||
    (lead.name && lead.name.trim()) ||
    lead.contact_id
  );

  const hasActiveAppointment =
    !!lead.contact_id && ctx?.hasActiveAppointmentForContactId?.(lead.contact_id ?? null);

  if (hasContactInfo && !hasActiveAppointment) {
    return "opt_in";
  }

  return "unassigned";
}

interface DealPipelineProps {
  teamId: string;
  userRole: string;
  currentUserId: string;
  onCloseDeal: (
    appointment: Appointment,
    undoHandlers?: {
      trackAction: (action: { table: string; recordId: string; previousData: Record<string, any>; description: string }) => void;
      showUndoToast: (description: string) => void;
    }
  ) => void;
  viewFilter?: 'all' | string; // 'all' or specific closer_id
}

interface PipelineStage {
  id: string;
  stage_id: string;
  stage_label: string;
  stage_color: string;
  order_index: number;
  is_default: boolean;
}

interface OptInLeadCardProps {
  id: string;
  lead: OptInLead;
  refMap: MutableRefObject<Record<string, HTMLDivElement | null>>;
  isFocused: boolean;
  teamId: string;
  userRole: string;
  allowSetterPipelineUpdates: boolean;
}

type PipelineCard =
  | { kind: "appointment"; appointment: Appointment }
  | { kind: "lead"; lead: OptInLead };

function OptInLeadCard({ id, lead, refMap, isFocused, teamId, userRole, allowSetterPipelineUpdates }: OptInLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const baseAppointment: Appointment = {
    id: lead.id,
    lead_name: lead.name || lead.email || "Unnamed lead",
    lead_email: lead.email || "",
    lead_phone: lead.phone || null,
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
    created_at: lead.created_at || null,
    pipeline_stage: lead.pipeline_stage ?? "opt_in",
    status: null,
    reschedule_url: null,
    calendly_invitee_uri: null,
    original_appointment_id: null,
    rescheduled_to_appointment_id: null,
    reschedule_count: 0,
    rebooking_type: null,
    setter_notes: null,
    closer_notes: null,
  };

  const adaptedAppointment = {
    ...baseAppointment,
    ...(lead.answers ? { answers: lead.answers } : {}),
  } as Appointment;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        refMap.current[lead.id] = el;
      }}
      style={style}
      className={cn(isFocused ? "ring-2 ring-primary rounded-md" : "")}
      {...attributes}
      {...listeners}
    >
      <DealCard
        id={id}
        teamId={teamId}
        appointment={adaptedAppointment}
        onCloseDeal={() => {}}
        onMoveTo={() => {}}
        userRole={userRole}
        allowSetterPipelineUpdates={allowSetterPipelineUpdates}
        mode="lead"
      />
    </div>
  );
}

export function DealPipeline({ teamId, userRole, currentUserId, onCloseDeal, viewFilter = 'all' }: DealPipelineProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [optInLeads, setOptInLeads] = useState<OptInLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<{ from: Date | null; to: Date | null; preset: DateRangePreset }>({ from: null, to: null, preset: "alltime" });
  const [sortBy, setSortBy] = useState<"closest" | "furthest">("closest");
  const [managerOpen, setManagerOpen] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; appointmentId: string; stageId: string; dealName: string } | null>(null);
  const [rescheduleLinkDialog, setRescheduleLinkDialog] = useState<{ open: boolean; appointmentId: string; rescheduleUrl: string; dealName: string } | null>(null);
  const [followUpDialog, setFollowUpDialog] = useState<{ open: boolean; appointmentId: string; stageId: string; dealName: string; stage: "cancelled" | "no_show" } | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; appointmentId: string; dealName: string; currentStatus: string | null } | null>(null);
  const [depositDialog, setDepositDialog] = useState<{ open: boolean; appointmentId: string; stageId: string; dealName: string } | null>(null);
  const [pipelineMoveDialog, setPipelineMoveDialog] = useState<{ open: boolean; appointmentId: string; stageId: string; dealName: string; fromStage: string; toStage: string } | null>(null);
  const [confirmationTasks, setConfirmationTasks] = useState<Map<string, any>>(new Map());
  const [allowSetterPipelineUpdates, setAllowSetterPipelineUpdates] = useState(false);
  const [searchParams] = useSearchParams();
  const [focusedLeadId, setFocusedLeadId] = useState<string | null>(null);
  const [focusedAppointmentId, setFocusedAppointmentId] = useState<string | null>(null);
  const optInLeadRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const appointmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusConfigRef = useRef<{
    targetType: "appointment" | "lead" | null;
    targetId: string | null;
    focusContactId: string | null;
  } | null>(null);
  const focusAppliedRef = useRef(false);
  const focusAttemptStartedRef = useRef(false);
  const optInLeadListRef = useRef<OptInLead[]>([]);
  
  const { trackAction, showUndoToast } = useUndoAction(() => {
    // Refresh appointments after undo
    loadDeals();
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // require small intentional movement before dragging to avoid accidental drags
      activationConstraint: { distance: 8 },
    })
  );

  const loadStages = async () => {
    try {
      // Load stages and team settings in parallel
      const [stagesResult, teamSettingsResult] = await Promise.all([
        supabase
          .from("team_pipeline_stages")
          .select("*")
          .eq("team_id", teamId)
          .order("order_index"),
        supabase
          .from("teams")
          .select("allow_setter_pipeline_updates")
          .eq("id", teamId)
          .single()
      ]);

      if (stagesResult.error) throw stagesResult.error;
      setStages(stagesResult.data || []);
      
      if (teamSettingsResult.data) {
        setAllowSetterPipelineUpdates(teamSettingsResult.data.allow_setter_pipeline_updates ?? false);
      }
    } catch (error) {
      console.error("Error loading stages:", error);
      toast.error("Failed to load stages");
    }
  };

  const loadDeals = async () => {
    try {
      // Only load appointments from the last 90 days for better performance
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      let query = supabase
        .from("appointments")
        .select("id, lead_name, lead_email, lead_phone, start_at_utc, cc_collected, mrr_amount, mrr_months, product_name, setter_name, setter_id, closer_id, closer_name, team_id, event_type_name, updated_at, created_at, pipeline_stage, status, reschedule_url, calendly_invitee_uri, original_appointment_id, rescheduled_to_appointment_id, reschedule_count, rebooking_type, setter_notes, closer_notes, contact_id")
        .eq("team_id", teamId)
        .gte('created_at', ninetyDaysAgo.toISOString()) // Only load last 90 days
        .limit(500); // Hard limit for safety

      // Apply view filter
      if (viewFilter === 'all') {
        // Show all deals (no filtering) - for admins viewing main pipeline
      } else if (viewFilter === 'mine') {
        // Special case for "mine" - filter by current user
        query = query.eq('closer_id', currentUserId);
      } else if (viewFilter && viewFilter !== 'all') {
        // Filter by specific closer_id
        query = query.eq('closer_id', viewFilter);
      } else if (userRole === 'closer' && currentUserId) {
        // Default: closers see only their own deals
        query = query.eq('closer_id', currentUserId);
      }

      const { data, error } = await query.order("updated_at", { ascending: false });

      const appointmentsData = (data || []) as any[];

      // Use the appointment rows as-is; keep cc_collected from DB for display
      setAppointments(appointmentsData as unknown as Appointment[]);

      // Load confirmation tasks for all appointments
      if (data && data.length > 0) {
        const appointmentIds = (data as any[]).map((a) => (a as any).id);
        const { data: tasks } = await supabase
          .from('confirmation_tasks')
          .select('*')
          .in('appointment_id', appointmentIds);
        
        const tasksMap = new Map();
        tasks?.forEach(task => {
          tasksMap.set(task.appointment_id, task);
        });
        setConfirmationTasks(tasksMap);
      }

      // Auto-backfill missing reschedule URLs in background
      if (data && data.length > 0) {
        const missingUrls = (data as any[]).filter((apt: any) => !apt.reschedule_url && apt.calendly_invitee_uri);
        if (missingUrls.length > 0) {
          supabase.functions.invoke('backfill-reschedule-urls', {
            body: { teamId }
          }).then(({ data: result, error: backfillError }) => {
            if (!backfillError && result?.updated > 0) {
              loadDeals();
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const loadOptInLeads = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from("funnel_leads")
        .select("id, name, email, phone, created_at, contact_id, pipeline_stage, answers")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (leadsError) throw leadsError;

      const leads = (leadsData || []) as any[];

      setOptInLeads(
        leads.map((l) => ({
          id: String(l.id),
          name: (l.name as string | null) ?? null,
          email: (l.email as string | null) ?? null,
          phone: (l.phone as string | null) ?? null,
          created_at: (l.created_at as string | null) ?? null,
          contact_id: l.contact_id ? String(l.contact_id) : null,
          pipeline_stage: (l as any).pipeline_stage ?? null,
          answers: (l as any).answers ?? null,
        }))
      );
    } catch (error) {
      console.error("[DealPipeline] Error loading opt-in leads:", error);
    }
  };

  useEffect(() => {
    loadStages();
    loadDeals();
    loadOptInLeads();

    const appointmentsChannel = supabase
      .channel(`deal-changes-${teamId}-${viewFilter}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadDeals();
          loadOptInLeads();
        }
      )
      .subscribe();

    const stagesChannel = supabase
      .channel(`stage-changes-${teamId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_pipeline_stages",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadStages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [teamId, viewFilter, userRole, currentUserId]);

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

      // Date filter - filter by appointment start_at_utc
      let matchesDate = true;
      if (dateFilter.from || dateFilter.to) {
        const appointmentDate = parseISO(appointment.start_at_utc);
        if (dateFilter.from && dateFilter.to) {
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(dateFilter.from),
            end: endOfDay(dateFilter.to),
          });
        } else if (dateFilter.from) {
          matchesDate = appointmentDate >= startOfDay(dateFilter.from);
        } else if (dateFilter.to) {
          matchesDate = appointmentDate <= endOfDay(dateFilter.to);
        }
      }

      return matchesSearch && matchesEventType && matchesDate;
    });
  }, [appointments, searchQuery, eventTypeFilter, dateFilter]);

  const filteredOptInLeads = useMemo(() => {
    return optInLeads.filter((lead) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = (lead.name || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();
      const phone = (lead.phone || "").toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [optInLeads, searchQuery]);

  const stagesWithOptIn = useMemo(() => {
    const byId = new Map(stages.map((stage) => [stage.stage_id, stage] as const));
    const augmented: PipelineStage[] = [...stages];

    // Inject missing core stages with stable ordering: opt_in < booked < rest
    if (!byId.has("opt_in")) {
      augmented.push({
        id: "opt_in",
        stage_id: "opt_in",
        stage_label: "Opt-Ins",
        stage_color: "hsl(var(--warning))",
        order_index: -2,
        is_default: false,
      });
    }

    if (!byId.has("booked")) {
      augmented.push({
        id: "booked",
        stage_id: "booked",
        stage_label: "Booked",
        stage_color: "hsl(var(--primary))",
        order_index: -1,
        is_default: false,
      });
    }

    return augmented.sort((a, b) => a.order_index - b.order_index);
  }, [stages]);

  const normalizeEmail = (value: string | null | undefined) =>
    (value || "").trim().toLowerCase();
  const normalizePhone = (value: string | null | undefined) =>
    (value || "").replace(/\D/g, "");

  // Keep latest opt-in leads in a ref for focus helper
  useEffect(() => {
    optInLeadListRef.current = optInLeads;
  }, [optInLeads]);

  const cardsByStage = useMemo(() => {
    const grouped: Record<string, PipelineCard[]> = {};

    stagesWithOptIn.forEach((stage) => {
      grouped[stage.stage_id] = [];
    });

    const activeAppointmentContactIds = new Set<string>();
    (filteredAppointments as any[]).forEach((apt: any) => {
      const cid = apt.contact_id ? String(apt.contact_id) : null;
      if (!cid) return;
      const status = (apt.status || "").toUpperCase();
      if (status === "CANCELLED" || status === "CANCELED" || status === "NO_SHOW") return;
      activeAppointmentContactIds.add(cid);
    });

    const resolverContext: PipelineStageResolverContext = {
      hasActiveAppointmentForContactId: (contactId: string | null) => {
        if (!contactId) return false;
        return activeAppointmentContactIds.has(String(contactId));
      },
    };

    filteredAppointments.forEach((apt) => {
      const stageId = apt.pipeline_stage || "booked";
      if (!grouped[stageId]) {
        grouped[stageId] = [];
      }
      grouped[stageId].push({ kind: "appointment", appointment: apt });
    });

    filteredOptInLeads.forEach((lead) => {
      const stageId = resolvePipelineStageForLead(lead, resolverContext);
      if (!stageId || stageId === "unassigned") return;
      if (!grouped[stageId]) {
        grouped[stageId] = [];
      }
      grouped[stageId].push({ kind: "lead", lead });
    });

    Object.keys(grouped).forEach((stageId) => {
      grouped[stageId].sort((a, b) => {
        const aTime =
          a.kind === "appointment"
            ? new Date(a.appointment.start_at_utc).getTime()
            : new Date(a.lead.created_at || 0).getTime();
        const bTime =
          b.kind === "appointment"
            ? new Date(b.appointment.start_at_utc).getTime()
            : new Date(b.lead.created_at || 0).getTime();
        return sortBy === "closest" ? aTime - bTime : bTime - aTime;
      });
    });

    return grouped;
  }, [filteredAppointments, filteredOptInLeads, stagesWithOptIn, sortBy]);

  // Dev-only duplicate detection: warn when same appointment appears in multiple stage buckets
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') return;
      const counts: Record<string, string[]> = {};
      Object.keys(cardsByStage).forEach((stageKey) => {
        (cardsByStage[stageKey] || []).forEach((card) => {
          if (card.kind !== 'appointment') return;
          const apt = card.appointment;
          counts[apt.id] = counts[apt.id] || [];
          counts[apt.id].push(stageKey);
        });
      });
      const duplicates = Object.entries(counts).filter(([, stages]) => stages.length > 1);
      if (duplicates.length > 0) {
        console.warn('[DealPipeline] Duplicate appointment ids found in multiple buckets:', duplicates.slice(0, 10));
      }
    } catch (err) {
      // ignore
    }
  }, [cardsByStage]);

  // Robust focusing helper with retries for appointments and opt-in leads
  useEffect(() => {
    // Reset focus state when search params change
    focusConfigRef.current = null;
    focusAppliedRef.current = false;
    focusAttemptStartedRef.current = false;

    const focus = searchParams.get("focus");
    const appointmentId = searchParams.get("appointment_id");
    const leadId = searchParams.get("lead_id");
    const focusContactId = searchParams.get("focusContactId");

    let targetType: "appointment" | "lead" | null = null;
    let targetId: string | null = null;
    let contactIdForLead: string | null = null;

    if (appointmentId) {
      targetType = "appointment";
      targetId = appointmentId;
    } else if (leadId) {
      targetType = "lead";
      targetId = leadId;
    } else if (focusContactId) {
      targetType = "lead";
      contactIdForLead = focusContactId;
    }

    if (!targetType) return;

    focusConfigRef.current = {
      targetType,
      targetId,
      focusContactId: contactIdForLead,
    };
    focusAttemptStartedRef.current = true;

    let attempts = 0;
    const maxAttempts = 60;
    const delayMs = 250;

    const attemptFocus = () => {
      const config = focusConfigRef.current;
      if (!config || focusAppliedRef.current) return;

      attempts += 1;

      let { targetType, targetId, focusContactId } = config;

      // Resolve lead id from contact_id if needed
      if (targetType === "lead" && !targetId && focusContactId) {
        const match = optInLeadListRef.current.find(
          (l) => l.contact_id && String(l.contact_id) === focusContactId
        );
        if (match) {
          targetId = match.id;
          focusConfigRef.current = { ...config, targetId };
        }
      }

      let el: HTMLDivElement | null = null;
      if (targetType === "appointment" && targetId) {
        el = appointmentRefs.current[targetId] || null;
      } else if (targetType === "lead" && targetId) {
        el = optInLeadRefs.current[targetId] || null;
      }

      const hasRef = !!el;

      if (el && targetId) {
        focusAppliedRef.current = true;
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        if (targetType === "appointment") {
          setFocusedAppointmentId(targetId);
        } else {
          setFocusedLeadId(targetId);
        }

        setTimeout(() => {
          if (targetType === "appointment") {
            setFocusedAppointmentId((current) =>
              current === targetId ? null : current
            );
          } else {
            setFocusedLeadId((current) =>
              current === targetId ? null : current
            );
          }
        }, 2000);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(attemptFocus, delayMs);
      }
    };

    setTimeout(attemptFocus, delayMs);
  }, [searchParams]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // no-op in production; dev drag-over logging removed
  };

  const stripPrefix = (nsId: string | null | undefined) => {
    if (!nsId) return nsId;
    const parts = nsId.split(":");
    return parts.length > 1 ? parts.slice(1).join(":") : nsId;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if setter is allowed to move deals in pipeline
    if (userRole === 'setter' && !allowSetterPipelineUpdates) {
      toast.error("Setters are not allowed to move leads in the pipeline. Contact your admin to enable this feature.");
      return;
    }

    const appointmentIdNs = active.id as string;
    const isLeadCard = appointmentIdNs.startsWith("lead:");
    const overIdNs = over.id as string;
    const appointmentId = stripPrefix(appointmentIdNs);
    const overId = stripPrefix(overIdNs);
    
    // Check if we dropped over a stage or over another card
    const targetStage = stagesWithOptIn.find(s => s.stage_id === overIdNs || s.stage_id === overId);
    const targetCard = appointments.find(a => a.id === overId);
    
    // Determine the new stage
    let newStage: string | null = null;
    
    if (targetStage) {
      newStage = targetStage.stage_id;
    } else if (targetCard) {
      newStage = targetCard.pipeline_stage || 'booked';
    }
    
    // Validate newStage is a known valid stage
    const validStageIds = stagesWithOptIn.map(s => s.stage_id);
    if (!newStage) {
      return;
    }

    if (!isLeadCard && (!validStageIds.includes(newStage) || newStage === 'opt_in')) {
      // Invalid stage for appointments or attempting to drop into opt_in
      return;
    }

    // Handle dragging of opt-in lead cards
    if (isLeadCard) {
      const leadId = stripPrefix(appointmentIdNs);
      const lead = optInLeads.find((l) => l.id === leadId);
      if (!lead || !newStage) {
        return;
      }

      try {
        await supabase
          .from('funnel_leads')
          .update({ pipeline_stage: (newStage === 'opt_in' ? 'opt_in' : newStage) } as any)
          .eq('id', lead.id)
          .eq('team_id', teamId);

        setOptInLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, pipeline_stage: newStage } : l))
        );
      } catch (error) {
        console.error('[Inbound] Error moving lead to stage:', error);
        toast.error('Failed to move lead');
      }

      return;
    }

    // Find the appointment being dragged
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    // Check if dropping in the same stage - if so, do nothing
    const currentStage = appointment.pipeline_stage || 'booked';
    if (currentStage === newStage) {
      // Same stage - no action needed, no toast
      return;
    }

    // Check if moving to won/closed stage - open close deal dialog
    const targetStageData = stages.find(s => s.stage_id === newStage);
    const isClosedStage = targetStageData && 
      (targetStageData.stage_id === 'won' || 
       targetStageData.stage_label.toLowerCase().includes('won') || 
       targetStageData.stage_label.toLowerCase().includes('closed') || 
       targetStageData.stage_label.toLowerCase().includes('close'));

    if (isClosedStage) {
      // Validate closer is assigned before moving to won
      if (!appointment.closer_id) {
        toast.error("Please assign a closer before closing this deal");
        return;
      }
      
      // Optimistically update UI immediately for snappier feel
      setAppointments((prev) => prev.map((app) => (app.id === appointmentId ? { ...app, pipeline_stage: newStage } : app)));

      // Move to closed stage
      await performStageMove(appointmentId, newStage, appointment);
      
      // Open close deal dialog
      onCloseDeal({ ...appointment, pipeline_stage: newStage }, { trackAction, showUndoToast });
      return;
    }

    // Check if moving to rescheduled
    if (newStage === "rescheduled") {
      // If reschedule URL is available, open the link dialog
      if (appointment.reschedule_url) {
        setRescheduleLinkDialog({
          open: true,
          appointmentId,
          rescheduleUrl: appointment.reschedule_url,
          dealName: appointment.lead_name
        });
        return;
      }
      
      // Check if we can fetch the reschedule URL
      if (!appointment.calendly_invitee_uri) {
        toast.error("This appointment was imported before reschedule links were tracked. Please re-import appointments from Calendly in Team Settings.", { duration: 5000 });
        return;
      }

      // Fetch reschedule URL from Calendly on-demand
      toast.loading("Fetching reschedule link...", { id: 'fetch-reschedule' });
      try {
        // Get team's Calendly access token
        const { data: teamData } = await supabase
          .from('teams')
          .select('calendly_access_token')
          .eq('id', teamId)
          .single();

        if (!teamData?.calendly_access_token) {
          toast.error("Calendly not configured for this team", { id: 'fetch-reschedule' });
          return;
        }

        // Fetch invitee details from Calendly
        const response = await fetch(appointment.calendly_invitee_uri, {
          headers: {
            'Authorization': `Bearer ${teamData.calendly_access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from Calendly');
        }

        const data = await response.json();
        const rescheduleUrl = data.resource?.reschedule_url;

        if (!rescheduleUrl) {
          toast.error("No reschedule link available for this appointment", { id: 'fetch-reschedule' });
          return;
        }

        // Update appointment with fetched URL
        await supabase
          .from('appointments')
          .update({ reschedule_url: rescheduleUrl })
          .eq('id', appointmentId);

        toast.success("Reschedule link fetched!", { id: 'fetch-reschedule' });

        // Open dialog with fetched URL
        setRescheduleLinkDialog({
          open: true,
          appointmentId,
          rescheduleUrl,
          dealName: appointment.lead_name
        });
      } catch (error) {
        console.error("Error fetching reschedule URL:", error);
        toast.error("Failed to fetch reschedule link from Calendly", { id: 'fetch-reschedule' });
      }
      return;
    }

    if (newStage === "canceled" || newStage === "no_show") {
      setFollowUpDialog({ 
        open: true, 
        appointmentId, 
        stageId: newStage,
        dealName: appointment.lead_name,
        stage: newStage === "canceled" ? "cancelled" : "no_show"
      });
      return;
    }

    // Check if moving to deposit stage
    if (newStage === "deposit" || targetStageData?.stage_label.toLowerCase().includes("deposit")) {
      // Validate closer is assigned before moving to deposit
      if (!appointment.closer_id) {
        toast.error("Please assign a closer before moving to Deposit Collected stage");
        return;
      }
      
      setDepositDialog({
        open: true,
        appointmentId,
        stageId: newStage,
        dealName: appointment.lead_name
      });
      return;
    }

    // For all other stage moves, show the pipeline move dialog for closer notes
    const fromStageData = stages.find(s => s.stage_id === appointment.pipeline_stage);
    const toStageData = stages.find(s => s.stage_id === newStage);
    
    setPipelineMoveDialog({
      open: true,
      appointmentId,
      stageId: newStage,
      dealName: appointment.lead_name,
      fromStage: fromStageData?.stage_label || appointment.pipeline_stage || 'Unknown',
      toStage: toStageData?.stage_label || newStage
    });
  };

  const handlePipelineMoveConfirm = async (closerNotes: string) => {
    if (!pipelineMoveDialog) return;
    
    const appointment = appointments.find((a) => a.id === pipelineMoveDialog.appointmentId);
    if (!appointment) return;
    
    const { appointmentId, stageId: newStage } = pipelineMoveDialog;
    
    // Close dialog first
    setPipelineMoveDialog(null);

    // Optimistically update UI
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, pipeline_stage: newStage } : app
      )
    );

    try {
      // Track the action for undo - capture all relevant fields
      trackAction({
        table: "appointments",
        recordId: appointmentId,
        previousData: { 
          pipeline_stage: appointment.pipeline_stage,
          status: appointment.status,
          cc_collected: appointment.cc_collected,
          mrr_amount: appointment.mrr_amount,
          mrr_months: appointment.mrr_months,
          product_name: appointment.product_name,
          closer_notes: appointment.closer_notes,
        },
        description: `Moved ${appointment.lead_name} to ${newStage}`,
      });

      // Build update data
      const updateData: any = { pipeline_stage: newStage };
      
      // Append closer notes if provided
      if (closerNotes.trim()) {
        const timestamp = format(new Date(), "MMM d, h:mm a");
        const existingNotes = appointment.closer_notes || "";
        updateData.closer_notes = existingNotes 
          ? `${existingNotes}\n\n[${timestamp}] ${closerNotes.trim()}`
          : `[${timestamp}] ${closerNotes.trim()}`;
      }

      // Update the appointment
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      // Log activity for pipeline stage change
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id || '')
        .maybeSingle();
      
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        appointment_id: appointmentId,
        actor_id: user?.id,
        actor_name: profile?.full_name || 'Unknown',
        action_type: 'Stage Changed',
        note: `Moved from ${appointment.pipeline_stage || 'unknown'} to ${newStage}${closerNotes.trim() ? ' - Note: ' + closerNotes.trim() : ''}`
      });

      showUndoToast(`Moved ${appointment.lead_name} to ${newStage}`);
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast.error("Failed to move deal");
        // rollback optimistic change
        await loadDeals();
    }
  };

  const performStageMove = async (
    appointmentId: string, 
    newStageId: string, 
    appointment: Appointment,
    additionalData?: { rescheduleDate?: Date; followUpDate?: Date; followUpReason?: string }
  ) => {
    try {
      const updateData: any = { pipeline_stage: newStageId };

      // optimistic UI update for immediate feedback
      setAppointments((prev) => prev.map((app) => (app.id === appointmentId ? { ...app, pipeline_stage: newStageId } : app)));
      
      // Add retarget_date for rescheduled
      if (newStageId === "rescheduled" && additionalData?.rescheduleDate) {
        updateData.retarget_date = format(additionalData.rescheduleDate, "yyyy-MM-dd");
        updateData.retarget_reason = "Rescheduled by user";
      }

      // Add retarget_date for follow-ups (no-show/cancelled)
      if (additionalData?.followUpDate && additionalData?.followUpReason) {
        updateData.retarget_date = format(additionalData.followUpDate, "yyyy-MM-dd");
        updateData.retarget_reason = additionalData.followUpReason;
      }

      const { error } = await supabase.from("appointments").update(updateData).eq("id", appointmentId);

      if (error) {
        console.error('[STAGE-MOVE] ❌ Error updating appointment:', error);
        // rollback by reloading
        await loadDeals();
        throw error;
      }

      // Log activity for pipeline stage change
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id || '')
        .maybeSingle();
      
      await supabase.from('activity_logs').insert({
        team_id: appointment.team_id,
        appointment_id: appointmentId,
        actor_id: user?.id,
        actor_name: profile?.full_name || 'Unknown',
        action_type: 'Stage Changed',
        note: `Moved from ${appointment.pipeline_stage || 'unknown'} to ${newStageId}`
      });

      // Create follow-up or reschedule task if needed
      if (additionalData?.rescheduleDate) {
        const { error: rpcError } = await supabase.rpc("create_task_with_assignment", {
          p_team_id: appointment.team_id,
          p_appointment_id: appointmentId,
          p_task_type: "reschedule",
          p_follow_up_date: null,
          p_follow_up_reason: null,
          p_reschedule_date: format(additionalData.rescheduleDate, "yyyy-MM-dd"),
        });
        if (rpcError) {
          console.error("[STAGE-MOVE] ❌ Error creating reschedule task:", rpcError);
          throw rpcError;
        }
      } else if (additionalData?.followUpDate && additionalData?.followUpReason) {
        const { error: rpcError } = await supabase.rpc("create_task_with_assignment", {
          p_team_id: appointment.team_id,
          p_appointment_id: appointmentId,
          p_task_type: "follow_up",
          p_follow_up_date: format(additionalData.followUpDate, "yyyy-MM-dd"),
          p_follow_up_reason: additionalData.followUpReason,
          p_reschedule_date: null,
        });

        if (rpcError) {
          console.error("[STAGE-MOVE] ❌ Error creating follow-up task:", rpcError);
          console.error("[STAGE-MOVE] RPC error details:", JSON.stringify(rpcError, null, 2));
          throw rpcError;
        }
      }

      toast.success("Deal moved successfully");
      await loadDeals();
    } catch (error: any) {
      console.error("[STAGE-MOVE] ❌ Fatal error in performStageMove:", error);
      console.error("[STAGE-MOVE] Error stack:", error.stack);
      // Show clear permission-specific message when applicable
      const msg = (error && (error.message || String(error))).toLowerCase();
      if (msg.includes('permission') || msg.includes('not authorized') || msg.includes('forbidden')) {
        toast.error('Permission denied. You do not have rights to move this deal.');
      } else {
        toast.error(getUserFriendlyError(error));
      }
    }
  };

  const handleRescheduleConfirm = async (rescheduleDate: Date) => {
    if (!rescheduleDialog) return;
    
    const appointment = appointments.find((a) => a.id === rescheduleDialog.appointmentId);
    
    if (appointment) {
      await performStageMove(
        rescheduleDialog.appointmentId,
        rescheduleDialog.stageId,
        appointment,
        { rescheduleDate }
      );
    }
    
    setRescheduleDialog(null);
  };

  const handleRescheduleLinkConfirm = async (reason: string, notes?: string) => {
    if (!rescheduleLinkDialog) return;
    
    const appointment = appointments.find((a) => a.id === rescheduleLinkDialog.appointmentId);
    if (!appointment) return;

    try {
      // Update appointment with rescheduled stage and retarget reason
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          pipeline_stage: "rescheduled",
          retarget_reason: reason
        })
        .eq("id", rescheduleLinkDialog.appointmentId);

      if (updateError) throw updateError;

      // Find existing task for this appointment if any
      const { data: existingTask } = await supabase
        .from("confirmation_tasks")
        .select("id")
        .eq("appointment_id", rescheduleLinkDialog.appointmentId)
        .eq("status", "pending")
        .maybeSingle();

      // Update existing task or create new one
      if (existingTask) {
        await supabase
          .from("confirmation_tasks")
          .update({
            status: "awaiting_reschedule",
            reschedule_reason: reason,
            reschedule_notes: notes || null
          })
          .eq("id", existingTask.id);
      } else {
        await supabase.rpc("create_task_with_assignment", {
          p_team_id: appointment.team_id,
          p_appointment_id: rescheduleLinkDialog.appointmentId,
          p_task_type: "reschedule",
          p_follow_up_date: null,
          p_follow_up_reason: null,
          p_reschedule_date: null
        });
      }

      // Log the activity
      await supabase
        .from("activity_logs")
        .insert({
          team_id: appointment.team_id,
          appointment_id: rescheduleLinkDialog.appointmentId,
          actor_name: "User",
          action_type: "Reschedule Requested",
          note: `${reason}${notes ? ` - ${notes}` : ''}`
        });

      await loadDeals();
    } catch (error) {
      console.error("Error handling reschedule:", error);
      throw error;
    }
  };

  const handleFollowUpConfirm = async (followUpDate: Date, reason: string) => {
    if (!followUpDialog) {
      console.error('[FOLLOW-UP] ❌ No dialog state!');
      return;
    }
    
    const appointment = appointments.find((a) => a.id === followUpDialog.appointmentId);
    
    if (appointment) {
      await performStageMove(
        followUpDialog.appointmentId,
        followUpDialog.stageId,
        appointment,
        { followUpDate, followUpReason: reason }
      );
    } else {
      console.error('[FOLLOW-UP] ❌ Appointment not found!');
    }
    
    setFollowUpDialog(null);
  };

  const handleDepositConfirm = async (depositAmount: number, notes: string, followUpDate: Date) => {
    if (!depositDialog) return;
    
    const appointment = appointments.find((a) => a.id === depositDialog.appointmentId);
    
    if (appointment) {
      try {
        // Update appointment with deposit amount and move to deposit stage
        const { data, error } = await supabase
          .from("appointments")
          .update({ 
            pipeline_stage: depositDialog.stageId,
            cc_collected: depositAmount,
            setter_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq("id", depositDialog.appointmentId)
          .select();

        // Log the deposit activity
        await supabase.from("activity_logs").insert({
          team_id: appointment.team_id,
          appointment_id: depositDialog.appointmentId,
          actor_id: user?.id || null,
          actor_name: user?.user_metadata?.full_name || appointment.closer_name || 'User',
          action_type: 'Deposit Collected',
          note: `$${depositAmount} deposit collected`
        });

        // Record payment (additive logging - failure doesn't break main flow)
        const { recordPayment } = await import('@/lib/payments');
        await recordPayment({
          teamId: appointment.team_id,
          appointmentId: depositDialog.appointmentId,
          amount: depositAmount,
          paymentMethod: 'credit_card',
          type: 'deposit',
          metadata: { notes, followUpDate: followUpDate.toISOString() }
        });

        if (error) {
          console.error("❌ Deposit update error:", error);
          throw error;
        }
        // Create follow-up task
        const { error: taskError } = await supabase.rpc("create_task_with_assignment", {
          p_team_id: appointment.team_id,
          p_appointment_id: depositDialog.appointmentId,
          p_task_type: "follow_up",
          p_follow_up_date: format(followUpDate, "yyyy-MM-dd"),
          p_follow_up_reason: `Deposit collected: $${depositAmount}. ${notes}`,
          p_reschedule_date: null
        });

        if (taskError) {
          console.error("⚠️ Task creation error:", taskError);
        }

        toast.success(`Deposit of $${depositAmount} recorded`);
        await loadDeals();
      } catch (error: any) {
        console.error("💥 Error recording deposit:", error);
        toast.error(getUserFriendlyError(error));
      }
    }
    
    setDepositDialog(null);
  };

  const handleMoveTo = async (appointmentId: string, stage: string) => {
    // Check if setter is allowed to move deals in pipeline
    if (userRole === 'setter' && !allowSetterPipelineUpdates) {
      toast.error("Setters are not allowed to move leads in the pipeline. Contact your admin to enable this feature.");
      return;
    }

    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    // Check if moving to won/closed stage - open close deal dialog
    const targetStageData = stages.find(s => s.stage_id === stage);
    const isClosedStage = targetStageData && 
      (targetStageData.stage_id === 'won' || 
       targetStageData.stage_label.toLowerCase().includes('won') || 
       targetStageData.stage_label.toLowerCase().includes('closed') || 
       targetStageData.stage_label.toLowerCase().includes('close'));

    if (isClosedStage) {
      // Move to closed stage and open the close deal dialog
      await performStageMove(appointmentId, stage, appointment);
      
      // Open the close deal dialog to finalize details
      onCloseDeal({ ...appointment, pipeline_stage: stage }, { trackAction, showUndoToast });
      return;
    }

    // Check if moving to stages that require additional info
    if (stage === "rescheduled") {
      // If reschedule URL is available, open the link dialog
      if (appointment.reschedule_url) {
        setRescheduleLinkDialog({ 
          open: true, 
          appointmentId, 
          rescheduleUrl: appointment.reschedule_url,
          dealName: appointment.lead_name 
        });
        return;
      }
      
      // Check if we can fetch the reschedule URL
      if (!appointment.calendly_invitee_uri) {
        toast.error("This appointment was imported before reschedule links were tracked. Please re-import appointments from Calendly in Team Settings.", { duration: 5000 });
        return;
      }

      // Fetch reschedule URL from Calendly on-demand
      toast.loading("Fetching reschedule link...", { id: 'fetch-reschedule' });
      try {
        // Get team's Calendly access token
        const { data: teamData } = await supabase
          .from('teams')
          .select('calendly_access_token')
          .eq('id', teamId)
          .single();

        if (!teamData?.calendly_access_token) {
          toast.error("Calendly not configured for this team", { id: 'fetch-reschedule' });
          return;
        }

        // Fetch invitee details from Calendly
        const response = await fetch(appointment.calendly_invitee_uri, {
          headers: {
            'Authorization': `Bearer ${teamData.calendly_access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from Calendly');
        }

        const data = await response.json();
        const rescheduleUrl = data.resource?.reschedule_url;

        if (!rescheduleUrl) {
          toast.error("No reschedule link available for this appointment", { id: 'fetch-reschedule' });
          return;
        }

        // Update appointment with fetched URL
        await supabase
          .from('appointments')
          .update({ reschedule_url: rescheduleUrl })
          .eq('id', appointmentId);

        toast.success("Reschedule link fetched!", { id: 'fetch-reschedule' });

        // Open dialog with fetched URL
        setRescheduleLinkDialog({ 
          open: true, 
          appointmentId, 
          rescheduleUrl,
          dealName: appointment.lead_name 
        });
      } catch (error) {
        console.error("Error fetching reschedule URL:", error);
        toast.error("Failed to fetch reschedule link from Calendly", { id: 'fetch-reschedule' });
      }
      return;
    }

    if (stage === "canceled" || stage === "no_show") {
      setFollowUpDialog({ 
        open: true, 
        appointmentId, 
        stageId: stage,
        dealName: appointment.lead_name,
        stage: stage === "canceled" ? "cancelled" : "no_show"
      });
      return;
    }

    // Normal move without dialog
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, pipeline_stage: stage } : app
      )
    );

    try {
      // Track the action for undo - capture all relevant fields
      trackAction({
        table: "appointments",
        recordId: appointmentId,
        previousData: { 
          pipeline_stage: appointment.pipeline_stage,
          status: appointment.status,
          cc_collected: appointment.cc_collected,
          mrr_amount: appointment.mrr_amount,
          mrr_months: appointment.mrr_months,
          product_name: appointment.product_name,
        },
        description: `Moved ${appointment.lead_name} to ${stage}`,
      });

      const { error } = await supabase
        .from("appointments")
        .update({ 
          pipeline_stage: stage,
          updated_at: new Date().toISOString()
        })
        .eq("id", appointmentId);

      if (error) throw error;
      showUndoToast(`Moved ${appointment.lead_name} to ${stage}`);
    } catch (error) {
      console.error("Error updating deal stage:", error);
      toast.error("Failed to move deal");
      loadDeals();
    }
  };

  const handleCloseDeal = (appointment: Appointment) => {
    onCloseDeal(appointment, { trackAction, showUndoToast });
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      
      toast.success('Deal deleted successfully');
      loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const handleUndo = async (appointmentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    // Check if deal is in deposit or closed stage - if so, clear all closed details
    const currentStage = appointment.pipeline_stage?.toLowerCase() || '';
    const isDepositOrClosed = 
      currentStage === 'deposit' || 
      currentStage === 'won' || 
      currentStage.includes('deposit') ||
      currentStage.includes('closed') ||
      currentStage.includes('won');

    if (isDepositOrClosed) {
      if (!confirm(`Reset ${appointment.lead_name} back to a fresh booked appointment? This will clear all deposit/sale details.`)) {
        return;
      }

      try {
        // Delete related financial records
        // Delete MRR commissions by prospect name (appointment_id might not be set)
        await supabase
          .from('mrr_commissions')
          .delete()
          .match({
            team_id: appointment.team_id,
            prospect_name: appointment.lead_name
          });

        // Delete MRR schedules
        const { data: mrrSchedules } = await supabase
          .from('mrr_schedules')
          .select('id')
          .match({
            team_id: appointment.team_id,
            client_name: appointment.lead_name
          });

        if (mrrSchedules && mrrSchedules.length > 0) {
          const scheduleIds = mrrSchedules.map(s => s.id);
          
          // Delete MRR follow-up tasks linked to these schedules
          await supabase
            .from('mrr_follow_up_tasks')
            .delete()
            .in('mrr_schedule_id', scheduleIds);

          // Delete the MRR schedules
          await supabase
            .from('mrr_schedules')
            .delete()
            .in('id', scheduleIds);
        }

        // Delete sales records for this customer
        await supabase
          .from('sales')
          .delete()
          .match({ 
            team_id: appointment.team_id,
            customer_name: appointment.lead_name
          });

        // Reset appointment to fresh booked state - clear ALL closed deal data
        const { error } = await supabase
          .from('appointments')
          .update({ 
            pipeline_stage: 'booked',
            status: 'NEW',
            cc_collected: 0,
            mrr_amount: 0,
            mrr_months: 0,
            revenue: 0,
            product_name: null,
            retarget_date: null,
            retarget_reason: null
          })
          .eq('id', appointmentId);

        if (error) throw error;

        // Log the reset action
        await supabase
          .from("activity_logs")
          .insert({
            team_id: appointment.team_id,
            appointment_id: appointmentId,
            actor_name: "User",
            action_type: "Reset",
            note: `Reset to fresh booked appointment from ${appointment.pipeline_stage}`
          });

      toast.success(`${appointment.lead_name} reset to booked appointment`);
        // Force refresh with a small delay to ensure DB propagation
        setTimeout(() => loadDeals(), 100);
      } catch (error) {
        console.error('Error resetting deal:', error);
        toast.error('Failed to reset deal');
      }
      return;
    }

    // Normal undo logic for other stages - move back to booked
    if (!confirm(`Undo this action and move ${appointment.lead_name} back to Booked?`)) {
      return;
    }

    try {
      // Move back to booked and clear deposit/revenue data
      const { error } = await supabase
        .from('appointments')
        .update({ 
          pipeline_stage: 'booked',
          cc_collected: 0,
          retarget_date: null,
          retarget_reason: null
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Log the undo action
      await supabase
        .from("activity_logs")
        .insert({
          team_id: appointment.team_id,
          appointment_id: appointmentId,
          actor_name: "User",
          action_type: "Undone",
          note: `Moved back to Booked from ${appointment.pipeline_stage}`
        });
      
      toast.success('Action undone - moved back to Booked');
      // Force refresh with a small delay to ensure DB propagation
      setTimeout(() => loadDeals(), 100);
    } catch (error) {
      console.error('Error undoing action:', error);
      toast.error('Failed to undo action');
    }
  };

  const handleChangeStatus = (appointmentId: string, currentStatus: string | null, dealName: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    setStatusDialog({
      open: true,
      appointmentId,
      dealName,
      currentStatus
    });
  };

  const handleClearDealData = async (appointmentId: string) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    if (!confirm(`Clear all deal data for ${appointment.lead_name}? This will remove CC, MRR, and product information.`)) {
      return;
    }

    try {
      // Delete related financial records
      await supabase
        .from('mrr_commissions')
        .delete()
        .eq('appointment_id', appointmentId);

      // Delete MRR schedules and related tasks
      const { data: mrrSchedules } = await supabase
        .from('mrr_schedules')
        .select('id')
        .eq('appointment_id', appointmentId);

      if (mrrSchedules && mrrSchedules.length > 0) {
        const scheduleIds = mrrSchedules.map(s => s.id);
        
        await supabase
          .from('mrr_follow_up_tasks')
          .delete()
          .in('mrr_schedule_id', scheduleIds);

        await supabase
          .from('mrr_schedules')
          .delete()
          .in('id', scheduleIds);
      }

      // Clear revenue fields from appointment
      const { error } = await supabase
        .from('appointments')
        .update({ 
          cc_collected: 0,
          mrr_amount: 0,
          mrr_months: 0,
          revenue: 0,
          product_name: null,
          closer_id: null,
          closer_name: null
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success(`Deal data cleared for ${appointment.lead_name}`);
      loadDeals();
    } catch (error) {
      console.error('Error clearing deal data:', error);
      toast.error('Failed to clear deal data');
    }
  };

  const handleStatusConfirm = async (newStatus: string) => {
    if (!statusDialog) return;

    const appointment = appointments.find((a) => a.id === statusDialog.appointmentId);
    if (!appointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus as any })
        .eq('id', statusDialog.appointmentId);

      if (error) throw error;

      // Cleanup confirmation tasks for terminal statuses
      const terminalStatuses = ['RESCHEDULED', 'CANCELLED', 'CLOSED', 'NO_SHOW'];
      if (terminalStatuses.includes(newStatus)) {
        await supabase.rpc('cleanup_confirmation_tasks', {
          p_appointment_id: statusDialog.appointmentId,
          p_reason: `Status changed to ${newStatus}`
        });
      }

      // Create reschedule task if status changed to RESCHEDULED
      if (newStatus === "RESCHEDULED") {
        await supabase.rpc("create_task_with_assignment", {
          p_team_id: appointment.team_id,
          p_appointment_id: statusDialog.appointmentId,
          p_task_type: "reschedule",
          p_follow_up_date: null,
          p_follow_up_reason: null,
          p_reschedule_date: null
        });
      }

      // Log the status change
      await supabase
        .from("activity_logs")
        .insert({
          team_id: appointment.team_id,
          appointment_id: statusDialog.appointmentId,
          actor_name: "User",
          action_type: "Status Changed",
          note: `Changed status to ${newStatus}`
        });
      
      toast.success(`Status changed to ${newStatus}`);
      setStatusDialog(null);
      loadDeals();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to change status');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-card via-card/95 to-secondary/30 border border-primary/20 rounded-xl p-5 shadow-md backdrop-blur-sm">
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <AppointmentFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                eventTypeFilter={eventTypeFilter}
                onEventTypeFilterChange={setEventTypeFilter}
                eventTypes={eventTypes}
                teamId={teamId}
                onClearFilters={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setEventTypeFilter("all");
                  setDateFilter({ from: null, to: null, preset: "alltime" });
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <DateRangeFilter onRangeChange={setDateFilter} />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={sortBy} onValueChange={(value: "closest" | "furthest") => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="closest">Closest First</SelectItem>
                    <SelectItem value="furthest">Furthest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setManagerOpen(true)} 
          variant="outline" 
          className="whitespace-nowrap border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Pipeline
        </Button>
      </div>

      {/* Mobile View */}
      {isMobile ? (
        <MobilePipelineView
          teamId={teamId}
          stages={stagesWithOptIn}
          cardsByStage={cardsByStage}
          confirmationTasks={confirmationTasks}
          userRole={userRole}
          allowSetterPipelineUpdates={allowSetterPipelineUpdates}
          onCloseDeal={handleCloseDeal}
          onMoveTo={handleMoveTo}
          onDelete={handleDelete}
          onUndo={handleUndo}
          onChangeStatus={handleChangeStatus}
          onClearDealData={handleClearDealData}
        />
      ) : (
        /* Desktop View - Horizontal Scroll Pipeline */
        <ScrollArea className="w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4">
              {stagesWithOptIn.map((stage) => {
                const stageCards = cardsByStage[stage.stage_id] || [];
                const isOptInStage = stage.stage_id === 'opt_in';
                const isBookedStage = stage.stage_id === 'booked';

                const emptyMessage = isOptInStage
                  ? "No Opt-Ins yet — leads appear here when they submit info but haven’t booked."
                  : "No deals";

                return (
                  <DroppableStageColumn key={stage.id} id={stage.stage_id}>
                    <Card className="h-full" style={{ minWidth: '340px' }}>
                      <div
                        className="p-4 border-b"
                        style={{
                          backgroundColor: `${stage.stage_color}15`,
                          borderBottomColor: stage.stage_color,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{stage.stage_label}</h3>
                            {isOptInStage && (
                              <span className="text-xs text-muted-foreground">
                                Opted in — no appointment yet
                              </span>
                            )}
                            {isBookedStage && (
                              <span className="text-xs text-muted-foreground block">
                                <span className="text-primary font-medium">
                                  {(() => {
                                    const now = new Date();
                                    const todayStart = startOfDay(now);
                                    const todayEnd = endOfDay(now);
                                    return appointments.filter(apt => {
                                      if (!apt.created_at) return false;
                                      const createdAt = new Date(apt.created_at);
                                      return isWithinInterval(createdAt, { start: todayStart, end: todayEnd });
                                    }).length;
                                  })()}
                                </span>{' '}
                                booked today
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {stageCards.length}
                          </Badge>
                        </div>
                      </div>

                      <ScrollArea className="p-3" style={{ height: 'calc(100vh - 400px)' }}>
                        <SortableContext
                          items={stageCards.map((card) =>
                            card.kind === 'lead'
                              ? `lead:${card.lead.id}`
                              : `apt:${card.appointment.id}`
                          )}
                          strategy={verticalListSortingStrategy}
                          id={stage.stage_id}
                        >
                          <div className="space-y-3 min-h-[200px]">
                            {stageCards.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                {emptyMessage}
                              </p>
                            ) : (
                              stageCards.map((card) => {
                                if (card.kind === 'lead') {
                                  const lead = card.lead;
                                  return (
                                    <OptInLeadCard
                                      key={lead.id}
                                      id={`lead:${lead.id}`}
                                      lead={lead}
                                      refMap={optInLeadRefs}
                                      isFocused={focusedLeadId === lead.id}
                                      teamId={teamId}
                                      userRole={userRole}
                                      allowSetterPipelineUpdates={allowSetterPipelineUpdates}
                                    />
                                  );
                                }

                                const appointment = card.appointment;
                                return (
                                  <div
                                    key={`apt:${appointment.id}`}
                                    ref={(el) => {
                                      appointmentRefs.current[appointment.id] = el;
                                    }}
                                    className={cn(
                                      focusedAppointmentId === appointment.id
                                        ? "ring-2 ring-primary rounded-md"
                                        : ""
                                    )}
                                  >
                                    <DealCard
                                      id={`apt:${appointment.id}`}
                                      teamId={teamId}
                                      appointment={appointment}
                                      confirmationTask={confirmationTasks.get(appointment.id)}
                                      onCloseDeal={handleCloseDeal}
                                      onMoveTo={handleMoveTo}
                                      onDelete={handleDelete}
                                      onUndo={handleUndo}
                                      onChangeStatus={handleChangeStatus}
                                      onClearDealData={handleClearDealData}
                                      userRole={userRole}
                                      allowSetterPipelineUpdates={allowSetterPipelineUpdates}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </SortableContext>
                      </ScrollArea>
                    </Card>
                  </DroppableStageColumn>
                );
              })}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeId && (() => {
                const activeAppointment = appointments.find(a => a.id === stripPrefix(activeId));
                return activeAppointment ? (
                  <div className="opacity-95 cursor-grabbing bg-card p-3 rounded-md shadow-lg" style={{ minWidth: '340px' }}>
                    <div className="font-medium truncate">{activeAppointment.lead_name}</div>
                    <div className="text-xs text-muted-foreground">{activeAppointment.lead_email}</div>
                    <div className="mt-2 text-sm font-semibold">{(Number(activeAppointment.cc_collected || 0) > 0) ? `$${Number(activeAppointment.cc_collected).toLocaleString()}` : activeAppointment.mrr_amount ? `$${activeAppointment.mrr_amount}/mo` : ''}</div>
                  </div>
                ) : null;
              })()}
            </DragOverlay>
          </DndContext>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <PipelineStageManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        teamId={teamId}
        onStagesUpdated={() => {
          loadStages();
          loadDeals();
        }}
      />

      {rescheduleDialog && (
        <RescheduleDialog
          open={rescheduleDialog.open}
          onOpenChange={(open) => !open && setRescheduleDialog(null)}
          onConfirm={handleRescheduleConfirm}
          dealName={rescheduleDialog.dealName}
        />
      )}

      {rescheduleLinkDialog && (
        <RescheduleWithLinkDialog
          open={rescheduleLinkDialog.open}
          onOpenChange={(open) => !open && setRescheduleLinkDialog(null)}
          onConfirm={handleRescheduleLinkConfirm}
          appointmentName={rescheduleLinkDialog.dealName}
          appointmentId={rescheduleLinkDialog.appointmentId}
          rescheduleUrl={rescheduleLinkDialog.rescheduleUrl}
        />
      )}

      {followUpDialog && (
        <FollowUpDialog
          open={followUpDialog.open}
          onOpenChange={(open) => !open && setFollowUpDialog(null)}
          onConfirm={handleFollowUpConfirm}
          dealName={followUpDialog.dealName}
          stage={followUpDialog.stage}
          teamId={teamId}
          onSkip={async () => {
            // Move without creating follow-up task
            const { error } = await supabase
              .from('appointments')
              .update({ 
                pipeline_stage: followUpDialog.stageId,
              })
              .eq('id', followUpDialog.appointmentId);

            if (error) {
              toast.error('Failed to move deal');
              return;
            }

            toast.success('Deal moved successfully');
            setFollowUpDialog(null);
          }}
        />
      )}

      {statusDialog && (
        <ChangeStatusDialog
          open={statusDialog.open}
          onOpenChange={(open) => !open && setStatusDialog(null)}
          onConfirm={handleStatusConfirm}
          dealName={statusDialog.dealName}
          currentStatus={statusDialog.currentStatus}
        />
      )}

      {depositDialog && (
        <DepositCollectedDialog
          open={depositDialog.open}
          onOpenChange={(open) => !open && setDepositDialog(null)}
          onConfirm={handleDepositConfirm}
          dealName={depositDialog.dealName}
        />
      )}

      {pipelineMoveDialog && (
        <PipelineMoveDialog
          open={pipelineMoveDialog.open}
          onOpenChange={(open) => !open && setPipelineMoveDialog(null)}
          leadName={pipelineMoveDialog.dealName}
          fromStage={pipelineMoveDialog.fromStage}
          toStage={pipelineMoveDialog.toStage}
          onConfirm={handlePipelineMoveConfirm}
        />
      )}
    </div>
  );
}
