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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCreateEventType } from "@/hooks/useEventTypes";
import type { EventType } from "@/hooks/useEventTypes";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const LOCATION_TYPES = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
  { value: "custom", label: "Custom URL" },
];

interface CalendarWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function CalendarWizard({ onComplete, onCancel }: CalendarWizardProps) {
  const { teamId } = useParams();
  const createCalendar = useCreateEventType(teamId);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("zoom");
  const [locationValue, setLocationValue] = useState("");

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - create calendar
      if (!name || !teamId) return;
      
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
      
      createCalendar.mutate({ ...calendar, team_id: teamId } as any, {
        onSuccess: () => {
          onComplete();
        },
      });
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
                You can set your weekly hours and specific date overrides in the calendar settings
                after creation. For now, we'll use default business hours (Mon-Fri, 9am-5pm).
              </p>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Default Hours</span>
                    <span className="text-muted-foreground">Mon-Fri, 9:00 AM - 5:00 PM</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can customize this in the calendar settings after creation.
                  </p>
                </div>
              </CardContent>
            </Card>
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
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === totalSteps ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Create Calendar
              </>
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
