// src/hooks/useEventTypes.ts
// Hook for managing event types (booking templates)

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventType {
  id: string;
  team_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  max_bookings_per_day: number | null;
  min_notice_hours: number;
  max_advance_days: number;
  color: string;
  location_type: string;
  location_value: string | null;
  confirmation_type: string;
  is_active: boolean;
  round_robin_mode: string;
  round_robin_members: string[];
  last_assigned_index: number;
  questions: IntakeQuestion[];
  availability_mode?: string;
  google_calendar_mode?: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

export function useEventTypes(teamId?: string) {
  return useQuery({
    queryKey: ["event-types", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("event_types" as any)
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as EventType[];
    },
    enabled: !!teamId,
  });
}

export function useCreateEventType(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventType: Partial<EventType> & { name: string; team_id: string }) => {
      // Auto-generate slug from name if not provided
      if (!eventType.slug) {
        eventType.slug = eventType.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }

      const { data, error } = await supabase
        .from("event_types" as any)
        .insert(eventType)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types", teamId] });
      toast.success("Event type created");
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate key")) {
        toast.error("An event type with that slug already exists");
      } else {
        toast.error("Failed to create event type: " + err.message);
      }
    },
  });
}

export function useUpdateEventType(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventType: Partial<EventType> & { id: string }) => {
      const { id, ...updates } = eventType;
      const { data, error } = await supabase
        .from("event_types" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types", teamId] });
      toast.success("Event type updated");
    },
    onError: (err: any) => {
      toast.error("Failed to update event type: " + err.message);
    },
  });
}

export function useDeleteEventType(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventTypeId: string) => {
      const { error } = await supabase
        .from("event_types" as any)
        .delete()
        .eq("id", eventTypeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-types", teamId] });
      toast.success("Event type deleted");
    },
    onError: (err: any) => {
      toast.error("Failed to delete event type: " + err.message);
    },
  });
}
