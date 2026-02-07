// src/hooks/useAvailability.ts
// Hook for managing availability schedules and overrides

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface AvailabilitySchedule {
  id: string;
  team_id: string;
  user_id: string | null; // Null for team-wide schedules
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
}

export interface AvailabilityOverride {
  id: string;
  team_id: string;
  user_id: string | null; // Null for team-wide overrides
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

// Helper to check if user is admin/owner
async function isTeamAdmin(teamId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();
  
  return data?.role === "owner" || data?.role === "admin";
}

export function useAvailabilitySchedules(teamId?: string, teamWide: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["availability-schedules", teamId, teamWide ? "team" : user?.id],
    queryFn: async () => {
      if (!teamId) return [];
      
      // Check if user is admin for team-wide schedules
      if (teamWide && user?.id) {
        const isAdmin = await isTeamAdmin(teamId, user.id);
        if (!isAdmin) {
          // Non-admins can view but not manage team-wide schedules
          const { data, error } = await supabase
            .from("availability_schedules" as any)
            .select("*")
            .eq("team_id", teamId)
            .is("user_id", null)
            .order("day_of_week");
          
          if (error) throw error;
          return (data || []) as unknown as AvailabilitySchedule[];
        }
      }

      // Query team-wide schedules (user_id IS NULL)
      const { data, error } = await supabase
        .from("availability_schedules" as any)
        .select("*")
        .eq("team_id", teamId)
        .is("user_id", null)
        .order("day_of_week");

      if (error) throw error;

      // If no team-wide schedules exist and user is admin, seed defaults
      if ((!data || data.length === 0) && teamWide && user?.id) {
        const isAdmin = await isTeamAdmin(teamId, user.id);
        if (isAdmin) {
          const defaults = DEFAULT_SCHEDULES.map((s) => ({
            ...s,
            team_id: teamId,
            user_id: null, // Team-wide
          }));

          const { data: seeded, error: seedError } = await supabase
            .from("availability_schedules" as any)
            .insert(defaults)
            .select();

          if (seedError) throw seedError;
          return (seeded || []) as unknown as AvailabilitySchedule[];
        }
      }

      return (data || []) as unknown as AvailabilitySchedule[];
    },
    enabled: !!teamId,
  });
}

export function useUpdateAvailability(teamId?: string, teamWide: boolean = true) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (schedule: Partial<AvailabilitySchedule> & { id: string }) => {
      const { id, ...updates } = schedule;
      
      // Ensure user_id is null for team-wide schedules
      if (teamWide) {
        updates.user_id = null;
      }
      
      const { error } = await supabase
        .from("availability_schedules" as any)
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-schedules", teamId] });
    },
    onError: (err: any) => {
      toast.error("Failed to update availability: " + err.message);
    },
  });
}

export function useAvailabilityOverrides(teamId?: string, teamWide: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["availability-overrides", teamId, teamWide ? "team" : user?.id],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("availability_overrides" as any)
        .select("*")
        .eq("team_id", teamId)
        .is("user_id", teamWide ? null : undefined)
        .eq("user_id", teamWide ? undefined : user?.id || "")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date");

      if (error) throw error;
      return (data || []) as unknown as AvailabilityOverride[];
    },
    enabled: !!teamId && (teamWide || !!user?.id),
  });
}

export function useCreateOverride(teamId?: string, teamWide: boolean = true) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (override: Omit<AvailabilityOverride, "id">) => {
      // Ensure user_id is null for team-wide overrides
      const overrideData = teamWide 
        ? { ...override, user_id: null }
        : override;
      
      const conflictColumns = teamWide 
        ? "team_id,date" 
        : "team_id,user_id,date";
      
      const { data, error } = await supabase
        .from("availability_overrides" as any)
        .upsert(overrideData, { onConflict: conflictColumns })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-overrides", teamId] });
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
        .from("availability_overrides" as any)
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
