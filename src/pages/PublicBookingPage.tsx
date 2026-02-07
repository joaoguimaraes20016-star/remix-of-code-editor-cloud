// src/pages/PublicBookingPage.tsx
// Public booking page at /book/:teamSlug/:eventSlug
// No auth required — clean, minimal, mobile-first booking experience

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Clock, MapPin, Loader2, AlertCircle, CalendarX2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import BookingCalendar from "@/components/scheduling/BookingCalendar";
import TimeSlotPicker from "@/components/scheduling/TimeSlotPicker";
import BookingForm from "@/components/scheduling/BookingForm";
import BookingConfirmation from "@/components/scheduling/BookingConfirmation";
import type { TimeSlot, SlotsResponse, BookingConfirmation as BookingConfirmationType } from "@/hooks/useBookingSlots";

type BookingStep = "date" | "time" | "form" | "confirmed";

const LOCATION_LABELS: Record<string, string> = {
  zoom: "Zoom Meeting",
  google_meet: "Google Meet",
  phone: "Phone Call",
  in_person: "In Person",
  custom: "Online Meeting",
};

export default function PublicBookingPage() {
  const { teamSlug, eventSlug } = useParams();
  const [step, setStep] = useState<BookingStep>("date");
  const [eventType, setEventType] = useState<any>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationType | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [slotsDebugInfo, setSlotsDebugInfo] = useState<any>(null);

  const timezone = selectedTimezone;

  // Load event type on mount
  useEffect(() => {
    async function loadEventType() {
      try {
        setLoading(true);

        // Look up team by booking_slug or id
        let teamQuery = supabase.from("teams" as any).select("id, name, booking_slug");

        // Try booking_slug first, fall back to id
        const { data: teamBySlug } = await teamQuery.eq("booking_slug", teamSlug).single() as { data: any; error: any };

        let team = teamBySlug;
        if (!team) {
          const { data: teamById } = await supabase
            .from("teams" as any)
            .select("id, name, booking_slug")
            .eq("id", teamSlug)
            .single() as { data: any; error: any };
          team = teamById;
        }

        if (!team) {
          setError("Team not found");
          return;
        }

        setTeamName(team.name);

        // Look up event type
        const { data: et, error: etError } = await supabase
          .from("event_types" as any)
          .select("*")
          .eq("team_id", team.id)
          .eq("slug", eventSlug)
          .eq("is_active", true)
          .single();

        if (etError || !et) {
          setError("Event type not found or inactive");
          return;
        }

        setEventType(et);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEventType();
  }, [teamSlug, eventSlug]);

  // Fetch slots when date is selected
  useEffect(() => {
    if (!selectedDate || !eventType) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

        const url = `${supabaseUrl}/functions/v1/get-available-slots?event_type_id=${eventType.id}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`;

        const response = await fetch(url, {
          headers: { apikey: supabaseKey },
        });

        if (response.ok) {
          const data: SlotsResponse = await response.json();
          setSlots(data.slots || []);
          
          // Store debug info if no slots
          if ((data.slots || []).length === 0 && (data as any).debug) {
            // Debug info will be used in the UI below
          }
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
  }, [selectedDate, eventType, timezone]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("time");
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const handleBookingSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    intake_answers: Record<string, any>;
  }) => {
    if (!selectedSlot || !selectedDate || !eventType) return;

    setSubmitting(true);
    setBookingError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          event_type_id: eventType.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedSlot.time,
          timezone,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          intake_answers: Object.keys(formData.intake_answers).length > 0 ? formData.intake_answers : undefined,
        },
      });

      if (error) {
        // Log the full error structure for debugging
        console.error("[PublicBookingPage] Full error object:", {
          error,
          message: error.message,
          context: error.context,
          name: error.name,
          stack: error.stack,
        });

        // Try multiple ways to extract the actual error message
        let errorMsg = "Failed to create booking";
        let errorDetails = null;

        try {
          // Method 1: Check if error.context has a body property
          if (error.context?.body) {
            const body = typeof error.context.body === "string" 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            errorMsg = body?.error || body?.message || errorMsg;
            errorDetails = body?.details || body?.hint || body?.code || null;
          }
          
          // Method 2: Try to read from response if available
          if ((!errorMsg || errorMsg === "Failed to create booking") && error.context?.response) {
            try {
              // Clone the response to read it (responses can only be read once)
              const clonedResponse = error.context.response.clone();
              const body = await clonedResponse.json();
              errorMsg = body?.error || body?.message || errorMsg;
              errorDetails = body?.details || body?.hint || body?.code || null;
            } catch (readErr) {
              console.error("[PublicBookingPage] Failed to read response body:", readErr);
            }
          }

          // Method 3: Check error.message for useful info
          if ((!errorMsg || errorMsg === "Failed to create booking") && error.message) {
            // If message contains JSON-like structure, try to parse it
            if (error.message.includes("{") || error.message.includes("error")) {
              try {
                const parsed = JSON.parse(error.message);
                errorMsg = parsed.error || parsed.message || errorMsg;
                errorDetails = parsed.details || parsed.hint || parsed.code || null;
              } catch {
                // Not JSON, use as-is but check if it's more descriptive
                if (error.message !== "Edge Function returned a non-2xx status code") {
                  errorMsg = error.message;
                }
              }
            } else if (error.message !== "Edge Function returned a non-2xx status code") {
              errorMsg = error.message;
            }
          }
        } catch (parseErr) {
          console.error("[PublicBookingPage] Error parsing error response:", parseErr);
        }

        // Final fallback
        if (!errorMsg || errorMsg === "Failed to create booking") {
          errorMsg = error.message || "Failed to create booking. Please check the console for details.";
        }

        // Include details in the error message if available
        const fullErrorMsg = errorDetails ? `${errorMsg} (${errorDetails})` : errorMsg;
        throw new Error(fullErrorMsg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setConfirmation(data);
      setStep("confirmed");
    } catch (err: any) {
      console.error("[PublicBookingPage] Booking error:", err);
      const errorMessage = err.message || err.error || "Failed to book appointment. Please try again.";
      setBookingError(errorMessage);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === "form") setStep("time");
    else if (step === "time") setStep("date");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !eventType) {
    const errorTitle =
      error === "Team not found"
        ? "Page Not Found"
        : error === "Event type not found or inactive"
          ? "Booking Not Available"
          : "Booking Unavailable";

    const errorDescription =
      error === "Team not found"
        ? "This booking page doesn't exist. The link may be incorrect or the team may have changed their URL."
        : error === "Event type not found or inactive"
          ? "This calendar is currently inactive or has been removed. Please contact the team for an updated link."
          : error || "This event type is not available right now.";

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="text-center py-12 px-6">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <CalendarX2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{errorTitle}</h2>
            <p className="text-muted-foreground text-sm">{errorDescription}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-start justify-center p-4 pt-8 sm:pt-16">
      <Card className="max-w-lg w-full shadow-lg border-0 sm:border">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            {step !== "date" && step !== "confirmed" && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {teamName && (
              <p className="text-sm text-muted-foreground mb-1">{teamName}</p>
            )}
            <h1 className="text-xl font-bold text-foreground">{eventType.name}</h1>

            {eventType.description && (
              <p className="text-sm text-muted-foreground mt-1">{eventType.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {eventType.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {LOCATION_LABELS[eventType.location_type] || eventType.location_type}
              </span>
            </div>

            {/* Selected date/time summary */}
            {selectedDate && step !== "date" && step !== "confirmed" && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  {selectedSlot && ` at ${formatTime12(selectedSlot.time)}`}
                </p>
                <p className="text-xs text-muted-foreground">{timezone.replace(/_/g, " ")}</p>
              </div>
            )}
          </div>

          {/* Booking Error Alert */}
          {bookingError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {bookingError}
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {step === "date" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Select a Date</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="timezone-select" className="text-xs text-muted-foreground">
                    Timezone:
                  </Label>
                  <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                    <SelectTrigger id="timezone-select" className="h-8 w-[200px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <BookingCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                maxAdvanceDays={eventType.max_advance_days}
                accentColor={eventType.color}
              />
            </div>
          )}

          {step === "time" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Select a Time</h3>
              <TimeSlotPicker
                slots={slots}
                selectedTime={selectedSlot?.utc}
                onTimeSelect={handleTimeSelect}
                isLoading={slotsLoading}
                accentColor={eventType.color}
                debugInfo={slotsDebugInfo}
              />
            </div>
          )}

          {step === "form" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Your Details</h3>
              <BookingForm
                onSubmit={handleBookingSubmit}
                isSubmitting={submitting}
                questions={eventType.questions || []}
                accentColor={eventType.color}
              />
            </div>
          )}

          {step === "confirmed" && confirmation && (
            <BookingConfirmation
              eventTypeName={eventType.name}
              startTime={confirmation.appointment.start_at_utc}
              durationMinutes={confirmation.appointment.duration_minutes}
              hostName={confirmation.appointment.host_name}
              meetingLink={confirmation.appointment.meeting_link}
              rescheduleUrl={confirmation.appointment.reschedule_url}
              cancelUrl={confirmation.appointment.cancel_url}
              timezone={timezone}
              accentColor={eventType.color}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
