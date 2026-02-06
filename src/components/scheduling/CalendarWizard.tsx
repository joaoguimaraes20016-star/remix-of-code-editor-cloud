// src/components/scheduling/CalendarWizard.tsx
// First-time setup wizard for creating a calendar

import { useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCreateEventType } from "@/hooks/useEventTypes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EventType } from "@/hooks/useEventTypes";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const LOCATION_TYPES = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
  { value: "custom", label: "Custom URL" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { enabled: false, start: "09:00", end: "17:00" }, // Sunday
  { enabled: true, start: "09:00", end: "17:00" },  // Monday
  { enabled: true, start: "09:00", end: "17:00" },  // Tuesday
  { enabled: true, start: "09:00", end: "17:00" },  // Wednesday
  { enabled: true, start: "09:00", end: "17:00" },  // Thursday
  { enabled: true, start: "09:00", end: "17:00" },  // Friday
  { enabled: false, start: "09:00", end: "17:00" }, // Saturday
];

interface CalendarWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function CalendarWizard({ onComplete, onCancel }: CalendarWizardProps) {
  const { teamId } = useParams();
  const { user } = useAuth();
  const createCalendar = useCreateEventType(teamId);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("zoom");
  const [locationValue, setLocationValue] = useState("");
  const [availability, setAvailability] = useState<DayAvailability[]>(() =>
    DEFAULT_AVAILABILITY.map((d) => ({ ...d }))
  );
  const [creating, setCreating] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateDay = (index: number, updates: Partial<DayAvailability>) => {
    setAvailability((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - create calendar and seed availability
      if (!name || !teamId || !user?.id) return;

      setCreating(true);
      try {
        const calendar: Partial<EventType> = {
          name,
          slug: name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          description: description || undefined,
          duration_minutes: duration,
          location_type: locationType,
          location_value: locationValue || undefined,
          is_active: true,
          reminder_config: [
            { type: "email", template: "24h_before", offset_hours: 24 },
            { type: "email", template: "1h_before", offset_hours: 1 },
          ],
        };

        // Create the calendar
        createCalendar.mutate({ ...calendar, team_id: teamId } as any, {
          onSuccess: async () => {
            // Seed availability schedules
            try {
              const schedules = availability.map((day, index) => ({
                team_id: teamId,
                user_id: user.id,
                day_of_week: index,
                start_time: day.start,
                end_time: day.end,
                is_available: day.enabled,
                timezone: userTimezone,
              }));

              // Check if user already has availability
              const { data: existing } = await supabase
                .from("availability_schedules")
                .select("id")
                .eq("team_id", teamId)
                .eq("user_id", user.id)
                .limit(1);

              if (!existing || existing.length === 0) {
                const { error: seedError } = await supabase
                  .from("availability_schedules")
                  .insert(schedules);

                if (seedError) {
                  console.error("Failed to seed availability:", seedError);
                  toast.error("Calendar created but availability setup failed. You can configure it later.");
                }
              }
            } catch (err) {
              console.error("Error seeding availability:", err);
            }

            onComplete();
          },
          onError: (err: any) => {
            toast.error("Failed to create calendar: " + err.message);
            setCreating(false);
          },
        });
      } catch (err: any) {
        toast.error("Failed to create calendar: " + err.message);
        setCreating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return true; // Availability can be set later
    if (step === 3) return true; // Location is optional
    return false;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Name & Duration */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What type of meeting is this?
              </h2>
              <p className="text-muted-foreground">
                Give your calendar a name that describes the meeting type.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="calendar-name" className="text-sm font-medium">
                  Calendar Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="calendar-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Discovery Call, Demo, Support Session"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is what people will see when booking.
                </p>
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duration
                </Label>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => setDuration(Number(v))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this meeting is about"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Availability */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                When are you available?
              </h2>
              <p className="text-muted-foreground">
                Set your weekly hours. You can always change these later.
              </p>
            </div>

            <div className="space-y-2">
              {availability.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(checked) => updateDay(index, { enabled: checked })}
                  />
                  <span className="w-24 text-sm font-medium">{DAY_NAMES[index]}</span>
                  {day.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Select value={day.start} onValueChange={(v) => updateDay(index, { start: v })}>
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatTime12(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">to</span>
                      <Select value={day.end} onValueChange={(v) => updateDay(index, { end: v })}>
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatTime12(t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unavailable</span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Timezone: {userTimezone.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Where will this meeting happen?
              </h2>
              <p className="text-muted-foreground">
                Choose how attendees will join the meeting.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="location-type" className="text-sm font-medium">
                  Meeting Location
                </Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>
                        {lt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(locationType === "custom" ||
                locationType === "phone" ||
                locationType === "in_person") && (
                <div>
                  <Label htmlFor="location-value" className="text-sm font-medium">
                    {locationType === "phone"
                      ? "Phone Number"
                      : locationType === "in_person"
                        ? "Address"
                        : "Meeting URL"}
                  </Label>
                  <Input
                    id="location-value"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder={
                      locationType === "phone"
                        ? "+1 (555) 000-0000"
                        : locationType === "in_person"
                          ? "123 Main St, City, State"
                          : "https://..."
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            {step === 1 ? "Cancel" : <ChevronLeft className="h-4 w-4 mr-1" />}
            {step === 1 ? "" : "Back"}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || creating}>
            {step === totalSteps ? (
              creating ? (
                <>Creating...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create Calendar
                </>
              )
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
