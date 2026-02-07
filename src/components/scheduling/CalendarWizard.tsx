// src/components/scheduling/CreateCalendarDialog.tsx
// Simple calendar creation dialog (Calendly/GHL style -- just the essentials)

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface CreateCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreateCalendarDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCalendarDialogProps) {
  const { teamId } = useParams();
  const { user } = useAuth();
  const createCalendar = useCreateEventType(teamId);

  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState("zoom");
  const [locationValue, setLocationValue] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setName("");
    setDuration(30);
    setLocationType("zoom");
    setLocationValue("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamId || !user?.id) return;

    setCreating(true);
    try {
      // Auto-generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Auto-generate booking slug if team doesn't have one
      const { data: teamData } = await supabase
        .from("teams" as any)
        .select("booking_slug, name")
        .eq("id", teamId)
        .single() as { data: any; error: any };

      if (!teamData?.booking_slug && teamData?.name) {
        let bookingSlug = teamData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (bookingSlug.length < 3) bookingSlug = `${bookingSlug}-team`;

        const { data: existing } = await supabase
          .from("teams" as any)
          .select("id")
          .eq("booking_slug", bookingSlug)
          .neq("id", teamId)
          .maybeSingle() as { data: any; error: any };

        if (existing) {
          bookingSlug = `${bookingSlug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        await supabase
          .from("teams" as any)
          .update({ booking_slug: bookingSlug })
          .eq("id", teamId);
      }

      // Seed team-wide availability defaults if none exist
      const { data: existingAvail } = await supabase
        .from("availability_schedules" as any)
        .select("id")
        .eq("team_id", teamId)
        .is("user_id", null)
        .limit(1);

      if (!existingAvail || existingAvail.length === 0) {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const defaultDays = [
          { day: 0, enabled: false },
          { day: 1, enabled: true },
          { day: 2, enabled: true },
          { day: 3, enabled: true },
          { day: 4, enabled: true },
          { day: 5, enabled: true },
          { day: 6, enabled: false },
        ];

        await supabase.from("availability_schedules" as any).insert(
          defaultDays.map((d) => ({
            team_id: teamId,
            user_id: null,
            day_of_week: d.day,
            start_time: "09:00",
            end_time: "17:00",
            is_available: d.enabled,
            timezone: userTimezone,
          }))
        );
      }

      // Create the calendar
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
          toast.success(`"${name.trim()}" created`);
          resetForm();
          onOpenChange(false);
          onCreated?.();
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

  const needsLocationValue =
    locationType === "custom" ||
    locationType === "phone" ||
    locationType === "in_person";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!creating) {
          onOpenChange(v);
          if (!v) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Calendar</DialogTitle>
          <DialogDescription>
            Create a booking calendar. You can customize availability, hosts, and
            advanced settings after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cal-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Discovery Call"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="cal-duration">Duration</Label>
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
            <Label htmlFor="cal-location">Location</Label>
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
              <Label htmlFor="cal-location-value">
                {locationType === "phone"
                  ? "Phone Number"
                  : locationType === "in_person"
                    ? "Address"
                    : "Meeting URL"}
              </Label>
              <Input
                id="cal-location-value"
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

          <div>
            <Label htmlFor="cal-desc">Description (optional)</Label>
            <Textarea
              id="cal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this meeting type"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Calendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
