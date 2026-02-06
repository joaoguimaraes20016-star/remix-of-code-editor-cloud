// src/components/scheduling/CalendarEditor.tsx
// Simplified calendar editor with embedded availability (replaces EventTypesManager)

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  useCreateEventType,
  useUpdateEventType,
  type EventType,
} from "@/hooks/useEventTypes";
import AvailabilitySettings from "@/components/scheduling/AvailabilitySettings";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const LOCATION_TYPES = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
  { value: "custom", label: "Custom URL" },
];

const DEFAULT_CALENDAR: Partial<EventType> = {
  name: "",
  slug: "",
  description: "",
  duration_minutes: 30,
  buffer_before_minutes: 0,
  buffer_after_minutes: 5,
  max_bookings_per_day: null,
  min_notice_hours: 1,
  max_advance_days: 60,
  color: "#3B82F6",
  location_type: "zoom",
  location_value: "",
  confirmation_type: "automatic",
  is_active: true,
  round_robin_mode: "none",
  round_robin_members: [],
  questions: [],
  reminder_config: [
    { type: "email", template: "24h_before", offset_hours: 24 },
    { type: "email", template: "1h_before", offset_hours: 1 },
  ],
};

interface CalendarEditorProps {
  calendar?: EventType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (calendarId: string) => void;
}

export default function CalendarEditor({
  calendar,
  open,
  onOpenChange,
  onDelete,
}: CalendarEditorProps) {
  const { teamId } = useParams();
  const [editingCalendar, setEditingCalendar] = useState<Partial<EventType>>(
    calendar || DEFAULT_CALENDAR
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isEditing = !!calendar;

  // Update editingCalendar when calendar prop changes
  React.useEffect(() => {
    if (calendar) {
      setEditingCalendar(calendar);
    } else {
      setEditingCalendar(DEFAULT_CALENDAR);
    }
  }, [calendar]);

  const createCalendar = useCreateEventType(teamId);
  const updateCalendar = useUpdateEventType(teamId);

  const updateField = (field: string, value: any) => {
    setEditingCalendar((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === "name" && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setEditingCalendar((prev) => ({ ...prev, slug }));
    }
  };

  const handleSave = () => {
    if (!editingCalendar.name || !teamId) return;

    if (isEditing && editingCalendar.id) {
      updateCalendar.mutate(editingCalendar as EventType);
    } else {
      createCalendar.mutate({ ...editingCalendar, team_id: teamId } as any);
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (calendar?.id && onDelete) {
      onDelete(calendar.id);
      setDeleteConfirmOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Calendar Settings" : "New Calendar"}
            </SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Manage your calendar settings and availability"
                : "Create a new booking calendar"}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="basics" className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="when">When</TabsTrigger>
              <TabsTrigger value="where">Where</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics" className="space-y-4 mt-6">
              <div>
                <Label className="text-sm font-medium">Calendar Name</Label>
                <Input
                  value={editingCalendar.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., Discovery Call, Demo, Support Session"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">URL Slug</Label>
                <Input
                  value={editingCalendar.slug || ""}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="discovery-call"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  /book/{teamId}/{editingCalendar.slug || "..."}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={editingCalendar.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of what this meeting is about"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <Select
                  value={String(editingCalendar.duration_minutes || 30)}
                  onValueChange={(v) => updateField("duration_minutes", Number(v))}
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
                <Label className="text-sm font-medium">Color</Label>
                <Input
                  type="color"
                  value={editingCalendar.color || "#3B82F6"}
                  onChange={(e) => updateField("color", e.target.value)}
                  className="h-10 p-1 mt-1 w-32"
                />
              </div>
            </TabsContent>

            {/* When Tab - Availability */}
            <TabsContent value="when" className="mt-6">
              <AvailabilitySettings />
            </TabsContent>

            {/* Where Tab */}
            <TabsContent value="where" className="space-y-4 mt-6">
              <div>
                <Label className="text-sm font-medium">Meeting Location</Label>
                <Select
                  value={editingCalendar.location_type || "zoom"}
                  onValueChange={(v) => updateField("location_type", v)}
                >
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

              {(editingCalendar.location_type === "custom" ||
                editingCalendar.location_type === "phone" ||
                editingCalendar.location_type === "in_person") && (
                <div>
                  <Label className="text-sm font-medium">
                    {editingCalendar.location_type === "phone"
                      ? "Phone Number"
                      : editingCalendar.location_type === "in_person"
                        ? "Address"
                        : "Meeting URL"}
                  </Label>
                  <Input
                    value={editingCalendar.location_value || ""}
                    onChange={(e) => updateField("location_value", e.target.value)}
                    placeholder={
                      editingCalendar.location_type === "phone"
                        ? "+1 (555) 000-0000"
                        : editingCalendar.location_type === "in_person"
                          ? "123 Main St, City, State"
                          : "https://..."
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={
                      editingCalendar.reminder_config?.some(
                        (r: any) => r.template === "24h_before"
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const config = [...(editingCalendar.reminder_config || [])];
                      if (checked) {
                        config.push({
                          type: "email",
                          template: "24h_before",
                          offset_hours: 24,
                        });
                      } else {
                        const idx = config.findIndex((r: any) => r.template === "24h_before");
                        if (idx >= 0) config.splice(idx, 1);
                      }
                      updateField("reminder_config", config);
                    }}
                  />
                  <Label className="text-sm">Email 24 hours before</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={
                      editingCalendar.reminder_config?.some(
                        (r: any) => r.template === "1h_before"
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const config = [...(editingCalendar.reminder_config || [])];
                      if (checked) {
                        config.push({
                          type: "email",
                          template: "1h_before",
                          offset_hours: 1,
                        });
                      } else {
                        const idx = config.findIndex((r: any) => r.template === "1h_before");
                        if (idx >= 0) config.splice(idx, 1);
                      }
                      updateField("reminder_config", config);
                    }}
                  />
                  <Label className="text-sm">Email 1 hour before</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={
                      editingCalendar.reminder_config?.some(
                        (r: any) => r.template === "15m_before"
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const config = [...(editingCalendar.reminder_config || [])];
                      if (checked) {
                        config.push({
                          type: "sms",
                          template: "15m_before",
                          offset_hours: 0.25,
                        });
                      } else {
                        const idx = config.findIndex((r: any) => r.template === "15m_before");
                        if (idx >= 0) config.splice(idx, 1);
                      }
                      updateField("reminder_config", config);
                    }}
                  />
                  <Label className="text-sm">SMS 15 minutes before</Label>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Buffer Before (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingCalendar.buffer_before_minutes || 0}
                    onChange={(e) =>
                      updateField("buffer_before_minutes", Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Buffer After (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingCalendar.buffer_after_minutes || 0}
                    onChange={(e) =>
                      updateField("buffer_after_minutes", Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Min Notice (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingCalendar.min_notice_hours || 1}
                    onChange={(e) =>
                      updateField("min_notice_hours", Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Advance (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingCalendar.max_advance_days || 60}
                    onChange={(e) =>
                      updateField("max_advance_days", Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Max Bookings Per Day</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingCalendar.max_bookings_per_day || ""}
                  onChange={(e) =>
                    updateField(
                      "max_bookings_per_day",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Confirmation Type</Label>
                <Select
                  value={editingCalendar.confirmation_type || "automatic"}
                  onValueChange={(v) => updateField("confirmation_type", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">
                      Automatic (instant confirmation)
                    </SelectItem>
                    <SelectItem value="manual">Manual (requires approval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <SheetFooter className="mt-6">
            {isEditing && onDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editingCalendar.name}>
              {isEditing ? "Save Changes" : "Create Calendar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this calendar. Existing bookings will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
