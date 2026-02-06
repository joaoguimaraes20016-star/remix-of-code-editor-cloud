// src/hooks/useBookingSlots.ts
// Hook for fetching available booking slots and creating bookings

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimeSlot {
  time: string; // HH:mm in requester's timezone
  utc: string;  // ISO 8601 UTC
  available: boolean;
}

export interface SlotsResponse {
  date: string;
  timezone: string;
  slots: TimeSlot[];
  event_type: {
    id: string;
    name: string;
    slug: string;
    description: string;
    duration_minutes: number;
    location_type: string;
    color: string;
  };
  reason?: string;
}

export interface BookingConfirmation {
  success: boolean;
  appointment: {
    id: string;
    start_at_utc: string;
    duration_minutes: number;
    event_type_name: string;
    meeting_link: string | null;
    reschedule_url: string;
    cancel_url: string;
    booking_token: string;
    host_name: string | null;
    host_email: string | null;
  };
}

export function useAvailableSlots(eventTypeId?: string, date?: string, timezone?: string) {
  return useQuery({
    queryKey: ["available-slots", eventTypeId, date, timezone],
    queryFn: async (): Promise<SlotsResponse> => {
      const { data, error } = await supabase.functions.invoke("get-available-slots", {
        method: "GET",
        body: null,
        headers: {},
      });

      // The function expects GET params but supabase.functions.invoke doesn't support GET params well
      // Use a direct fetch instead
      const url = `${(supabase as any).supabaseUrl}/functions/v1/get-available-slots?event_type_id=${eventTypeId}&date=${date}&timezone=${encodeURIComponent(timezone || "America/New_York")}`;

      const response = await fetch(url, {
        headers: {
          apikey: (supabase as any).supabaseKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch available slots");
      }

      return response.json();
    },
    enabled: !!eventTypeId && !!date,
    staleTime: 30000, // 30s cache to avoid hammering the API
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (booking: {
      event_type_id: string;
      date: string;
      time: string;
      timezone: string;
      name: string;
      email: string;
      phone?: string;
      intake_answers?: Record<string, any>;
      funnel_lead_id?: string;
    }): Promise<BookingConfirmation> => {
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: booking,
      });

      if (error) throw error;
      return data;
    },
    onError: (err: any) => {
      toast.error("Failed to create booking: " + err.message);
    },
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: async (bookingToken: string) => {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { booking_token: bookingToken },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to cancel booking: " + err.message);
    },
  });
}

export function useRescheduleBooking() {
  return useMutation({
    mutationFn: async (params: {
      booking_token: string;
      new_date: string;
      new_time: string;
      timezone: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("reschedule-booking", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Booking rescheduled successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to reschedule booking: " + err.message);
    },
  });
}
