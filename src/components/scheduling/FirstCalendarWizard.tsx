// src/components/scheduling/FirstCalendarWizard.tsx
// Guided wizard for creating the very first calendar (first-time setup only)
// 3 steps: Name & Duration -> Location -> Availability
// All infrastructure (booking slug, defaults) handled silently in the background.

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
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
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
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
  { enabled: false, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: false, start: "09:00", end: "17:00" },
];

interface FirstCalendarWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function FirstCalendarWizard({ onComplete, onCancel }: FirstCalendarWizardProps) {
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

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    // Final step -- create everything
    if (!name.trim() || !teamId || !user?.id) return;

    setCreating(true);
    try {
      // 1. Auto-generate booking slug if missing
      const { data: teamData } = await supabase
        .from("teams")
        .select("booking_slug, name")
        .eq("id", teamId)
        .single();

      if (!teamData?.booking_slug && teamData?.name) {
        let bookingSlug = teamData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (bookingSlug.length < 3) bookingSlug = `${bookingSlug}-team`;

        const { data: existing } = await supabase
          .from("teams")
          .select("id")
          .eq("booking_slug", bookingSlug)
          .neq("id", teamId)
          .maybeSingle();

        if (existing) {
          bookingSlug = `${bookingSlug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        await supabase
          .from("teams")
          .update({ booking_slug: bookingSlug })
          .eq("id", teamId);
      }

      // 2. Seed team-wide availability from the wizard
      const { data: existingAvail } = await supabase
        .from("availability_schedules")
        .select("id")
        .eq("team_id", teamId)
        .is("user_id", null)
        .limit(1);

      if (!existingAvail || existingAvail.length === 0) {
        await supabase.from("availability_schedules").insert(
          availability.map((day, index) => ({
            team_id: teamId,
            user_id: null,
            day_of_week: index,
            start_time: day.start,
            end_time: day.end,
            is_available: day.enabled,
            timezone: userTimezone,
          }))
        );
      }

      // 3. Create the calendar
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const calendar: Partial<EventType> = {
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        duration_minutes: duration,
        location_type: locationType,
        location_value: locationValue.trim() || undefined,
        is_active: true,
        availability_mode: "team_wide",
        round_robin_members: [user.id],
      };

      createCalendar.mutate({ ...calendar, team_id: teamId } as any, {
        onSuccess: () => {
          toast.success(`"${name.trim()}" created -- you're all set!`);
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
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const needsLocationValue =
    locationType === "custom" ||
    locationType === "phone" ||
    locationType === "in_person";

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Progress */}
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
              <h2 className="text-2xl font-bold text-foreground mb-1">
                What type of meeting is this?
              </h2>
              <p className="text-muted-foreground text-sm">
                Name your calendar and set how long meetings will be.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="wiz-name">
                  Calendar Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="wiz-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Discovery Call, Demo, Consultation"
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label>Duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
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
                <Label htmlFor="wiz-desc">Description (optional)</Label>
                <Textarea
                  id="wiz-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this meeting is about"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Where will this meeting happen?
              </h2>
              <p className="text-muted-foreground text-sm">
                Choose how attendees will join the meeting.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Meeting Location</Label>
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

              {needsLocationValue && (
                <div>
                  <Label htmlFor="wiz-loc-val">
                    {locationType === "phone"
                      ? "Phone Number"
                      : locationType === "in_person"
                        ? "Address"
                        : "Meeting URL"}
                  </Label>
                  <Input
                    id="wiz-loc-val"
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

        {/* Step 3: Availability */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Set your available hours
              </h2>
              <p className="text-muted-foreground text-sm">
                When can people book? You can always change this later.
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

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleBack}>
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || creating}>
            {step === totalSteps ? (
              creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
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
