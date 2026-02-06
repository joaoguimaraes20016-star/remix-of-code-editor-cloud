// src/hooks/useAvailability.ts
// Hook for managing availability schedules and overrides

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AvailabilitySchedule {
  id: string;
  team_id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
}

export interface AvailabilityOverride {
  id: string;
  team_id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  reason: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_SCHEDULES: Omit<AvailabilitySchedule, "id" | "team_id" | "user_id">[] = [
  { day_of_week: 0, start_time: "09:00", end_time: "17:00", is_available: false, timezone: "America/New_York" },
  { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true, timezone: "America/New_York" },
  { day_of_week: 2, start_time: "09:00", end_time: "17:00", is_available: true, timezone: "America/New_York" },
  { day_of_week: 3, start_time: "09:00", end_time: "17:00", is_available: true, timezone: "America/New_York" },
  { day_of_week: 4, start_time: "09:00", end_time: "17:00", is_available: true, timezone: "America/New_York" },
  { day_of_week: 5, start_time: "09:00", end_time: "17:00", is_available: true, timezone: "America/New_York" },
  { day_of_week: 6, start_time: "09:00", end_time: "17:00", is_available: false, timezone: "America/New_York" },
];

export function useAvailabilitySchedules(teamId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["availability-schedules", teamId, user?.id],
    queryFn: async () => {
      if (!teamId || !user?.id) return [];

      const { data, error } = await supabase
        .from("availability_schedules")
        .select("*")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .order("day_of_week");

      if (error) throw error;

      // If no schedules exist, seed defaults
      if (!data || data.length === 0) {
        const defaults = DEFAULT_SCHEDULES.map((s) => ({
          ...s,
          team_id: teamId,
          user_id: user.id,
        }));

        const { data: seeded, error: seedError } = await supabase
          .from("availability_schedules")
          .insert(defaults)
          .select();

        if (seedError) throw seedError;
        return (seeded || []) as AvailabilitySchedule[];
      }

      return data as AvailabilitySchedule[];
    },
    enabled: !!teamId && !!user?.id,
  });
}

export function useUpdateAvailability(teamId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (schedule: Partial<AvailabilitySchedule> & { id: string }) => {
      const { id, ...updates } = schedule;
      const { error } = await supabase
        .from("availability_schedules")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-schedules", teamId, user?.id] });
    },
    onError: (err: any) => {
      toast.error("Failed to update availability: " + err.message);
    },
  });
}

export function useAvailabilityOverrides(teamId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["availability-overrides", teamId, user?.id],
    queryFn: async () => {
      if (!teamId || !user?.id) return [];

      const { data, error } = await supabase
        .from("availability_overrides")
        .select("*")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date");

      if (error) throw error;
      return (data || []) as AvailabilityOverride[];
    },
    enabled: !!teamId && !!user?.id,
  });
}

export function useCreateOverride(teamId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (override: Omit<AvailabilityOverride, "id">) => {
      const { data, error } = await supabase
        .from("availability_overrides")
        .upsert(override, { onConflict: "team_id,user_id,date" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides", teamId, user?.id] });
      toast.success("Date override saved");
    },
    onError: (err: any) => {
      toast.error("Failed to save override: " + err.message);
    },
  });
}

export function useDeleteOverride(teamId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (overrideId: string) => {
      const { error } = await supabase
        .from("availability_overrides")
        .delete()
        .eq("id", overrideId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides", teamId, user?.id] });
      toast.success("Date override removed");
    },
    onError: (err: any) => {
      toast.error("Failed to remove override: " + err.message);
    },
  });
}

export { DAY_NAMES };
