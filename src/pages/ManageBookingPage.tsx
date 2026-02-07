// src/pages/ManageBookingPage.tsx
// Self-service reschedule/cancel page at /booking/:token/manage
// No auth required — validated by booking_token

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar, Clock, User, MapPin, RefreshCw, X, Loader2, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import BookingCalendar from "@/components/scheduling/BookingCalendar";
import TimeSlotPicker from "@/components/scheduling/TimeSlotPicker";
import type { TimeSlot, SlotsResponse } from "@/hooks/useBookingSlots";

type ManageStep = "view" | "reschedule-date" | "reschedule-time" | "cancelled" | "rescheduled";

export default function ManageBookingPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ManageStep>("view");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Reschedule state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Load appointment by token
  useEffect(() => {
    async function load() {
      try {
        const { data, error: fetchError } = await supabase
          .from("appointments")
          .select("*")
          .eq("booking_token" as any, token)
          .single();

        if (fetchError || !data) {
          setError("Booking not found. It may have been cancelled or the link is invalid.");
          return;
        }

        setAppointment(data);

        if (data.status === "CANCELLED") {
          setStep("cancelled");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  // Fetch slots when date selected for reschedule
  useEffect(() => {
    if (!selectedDate || !appointment?.appointment_type_id) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const url = `${supabaseUrl}/functions/v1/get-available-slots?event_type_id=${appointment.appointment_type_id}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`;

        const response = await fetch(url, {
          headers: { apikey: supabaseKey },
        });

        if (response.ok) {
          const data: SlotsResponse = await response.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, appointment]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-booking", {
        body: { booking_token: token },
      });
      if (error) throw error;
      setStep("cancelled");
    } catch (err: any) {
      console.error("[ManageBookingPage] Cancel error:", err);
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
    }
  };

  const handleReschedule = async (slot: TimeSlot) => {
    if (!selectedDate) return;
    setRescheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke("reschedule-booking", {
        body: {
          booking_token: token,
          new_date: format(selectedDate, "yyyy-MM-dd"),
          new_time: slot.time,
          timezone,
        },
      });
      if (error) throw error;

      // Update appointment with new data
      setAppointment((prev: any) => ({
        ...prev,
        start_at_utc: data.appointment.start_at_utc,
        booking_token: data.appointment.booking_token,
      }));
      setStep("rescheduled");
    } catch (err: any) {
      console.error("[ManageBookingPage] Reschedule error:", err);
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-bold text-foreground mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(appointment.start_at_utc);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-start justify-center p-4 pt-8 sm:pt-16">
      <Card className="max-w-lg w-full shadow-lg border-0 sm:border">
        <CardContent className="p-6 sm:p-8">
          {/* Cancelled State */}
          {step === "cancelled" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Booking Cancelled</h2>
              <p className="text-muted-foreground">
                Your appointment has been cancelled.
              </p>
            </div>
          )}

          {/* Rescheduled State */}
          {step === "rescheduled" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Rescheduled!</h2>
              <p className="text-muted-foreground">
                Your appointment has been rescheduled. A confirmation email has been sent.
              </p>
            </div>
          )}

          {/* View State — show appointment details */}
          {step === "view" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {appointment.event_type_name || "Appointment"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your upcoming appointment
                </p>
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{dateFormatter.format(startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {timeFormatter.format(startDate)} ({appointment.duration_minutes || 30} min)
                  </span>
                </div>
                {appointment.closer_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.closer_name}</span>
                  </div>
                )}
                {appointment.meeting_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => window.open(appointment.meeting_link, "_blank")}
                  >
                    Join Meeting
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("reschedule-date")}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCancelDialogOpen(true)}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              </div>
            </div>
          )}

          {/* Reschedule — Date Selection */}
          {step === "reschedule-date" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setStep("view")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &larr; Back
                </button>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Select a New Date</h3>
              <BookingCalendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setStep("reschedule-time");
                }}
              />
            </div>
          )}

          {/* Reschedule — Time Selection */}
          {step === "reschedule-time" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setStep("reschedule-date")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &larr; Back
                </button>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Select a New Time
              </h3>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              )}
              <TimeSlotPicker
                slots={slots}
                onTimeSelect={(slot) => handleReschedule(slot)}
                isLoading={slotsLoading || rescheduling}
              />
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this appointment? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
