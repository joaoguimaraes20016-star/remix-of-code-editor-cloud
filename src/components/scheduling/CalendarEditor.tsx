// src/components/scheduling/CalendarEditor.tsx
// Simplified calendar editor with embedded availability (replaces EventTypesManager)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus, AlertCircle, Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const { user } = useAuth();
  const [editingCalendar, setEditingCalendar] = useState<Partial<EventType>>(
    calendar || DEFAULT_CALENDAR
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [memberAvailability, setMemberAvailability] = useState<Record<string, boolean>>({});
  const [memberGcalStatus, setMemberGcalStatus] = useState<Record<string, boolean>>({});
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState<boolean>(false);
  const [hasZoom, setHasZoom] = useState<boolean>(false);
  const isEditing = !!calendar;

  // Update editingCalendar when calendar prop changes
  React.useEffect(() => {
    if (calendar) {
      setEditingCalendar(calendar);
    } else {
      setEditingCalendar(DEFAULT_CALENDAR);
    }
  }, [calendar]);

  // Load team members and their availability status
  useEffect(() => {
    if (!teamId || !open) return;

    const loadTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select(`
            user_id,
            role,
            profiles!inner(full_name)
          `)
          .eq("team_id", teamId)
          .eq("is_active", true);

        if (error) throw error;

        const members = (data || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name || "Unknown",
          role: m.role,
        }));

        setTeamMembers(members);

        // Check team-wide availability (one check for all)
        const { data: teamAvail } = await supabase
          .from("availability_schedules" as any)
          .select("id")
          .eq("team_id", teamId)
          .is("user_id", null)
          .eq("is_available", true)
          .limit(1);
        
        const hasTeamAvailability = !!teamAvail && teamAvail.length > 0;

        // Check Google Calendar connection for each member (per-user for busy time blocking)
        const gcalMap: Record<string, boolean> = {};
        for (const member of members) {
          const { data: gcal } = await supabase
            .from("google_calendar_connections" as any)
            .select("id")
            .eq("team_id", teamId)
            .eq("user_id", member.id)
            .eq("sync_enabled", true)
            .limit(1);
          gcalMap[member.id] = !!gcal && gcal.length > 0;
        }
        
        // Set availability status for all members (same since it's team-wide)
        const availMap: Record<string, boolean> = {};
        members.forEach((m) => {
          availMap[m.id] = hasTeamAvailability;
        });
        setMemberAvailability(availMap);
        setMemberGcalStatus(gcalMap);

        // Check current user's connections
        if (user?.id) {
          const { data: gcal } = await supabase
            .from("google_calendar_connections" as any)
            .select("sync_enabled")
            .eq("team_id", teamId)
            .eq("user_id", user.id)
            .maybeSingle();
          setHasGoogleCalendar(!!gcal && !!gcal.sync_enabled);

          const { data: zoom } = await supabase
            .from("team_integrations")
            .select("is_connected")
            .eq("team_id", teamId)
            .eq("integration_type", "zoom")
            .maybeSingle();
          setHasZoom(!!zoom && !!zoom.is_connected);
        } else {
          setHasGoogleCalendar(false);
          setHasZoom(false);
        }
      } catch (err) {
        console.error("Failed to load team members:", err);
      }
    };

    loadTeamMembers();
  }, [teamId, open]);

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
      // Auto-assign current user as host if no members selected
      const calendarToCreate = { ...editingCalendar, team_id: teamId };
      if (
        user?.id &&
        (!calendarToCreate.round_robin_members || calendarToCreate.round_robin_members.length === 0)
      ) {
        calendarToCreate.round_robin_members = [user.id];
      }
      createCalendar.mutate(calendarToCreate as any);
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="hosts">Hosts</TabsTrigger>
              <TabsTrigger value="when">When</TabsTrigger>
              <TabsTrigger value="where">Where</TabsTrigger>
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

            {/* Hosts Tab */}
            <TabsContent value="hosts" className="space-y-4 mt-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Calendar Hosts</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Select which team members can receive bookings on this calendar.
                  At least one host is required for the booking page to show available slots.
                </p>
              </div>

              {/* Warning if no hosts */}
              {(editingCalendar.round_robin_members || []).length === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">No hosts assigned</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500">
                      Without hosts, this calendar won't show any available time slots on the public booking page.
                    </p>
                  </div>
                </div>
              )}

              {/* Team Members List */}
              <div className="space-y-2 border rounded-md p-3">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No team members found. Add members in Team Settings first.
                  </p>
                ) : (
                  teamMembers.map((member) => {
                    const isSelected = (
                      editingCalendar.round_robin_members || []
                    ).includes(member.id);
                    const hasAvail = memberAvailability[member.id];
                    const hasGcal = memberGcalStatus[member.id];
                    
                    // Badge shows Google Calendar status (availability is team-wide, shown separately)
                    let badgeVariant: "default" | "secondary" | "destructive" = "secondary";
                    let badgeText = "No Google Calendar";
                    let badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
                    
                    if (hasGcal) {
                      badgeVariant = "default";
                      badgeText = "Google Calendar Connected";
                      badgeClass = "bg-green-50 text-green-700 border-green-200";
                    }
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`host-${member.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const current = editingCalendar.round_robin_members || [];
                              if (checked) {
                                updateField("round_robin_members", [...current, member.id]);
                              } else {
                                updateField(
                                  "round_robin_members",
                                  current.filter((id) => id !== member.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`host-${member.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {member.name}
                            <span className="text-muted-foreground ml-1">({member.role})</span>
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                            {badgeText}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Assignment Mode */}
              {(editingCalendar.round_robin_members || []).length > 1 && (
                <div>
                  <Label className="text-sm font-medium">Assignment Mode</Label>
                  <Select
                    value={editingCalendar.round_robin_mode || "none"}
                    onValueChange={(v) => updateField("round_robin_mode", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Single Host (first selected)</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="availability_based">Availability Based</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingCalendar.round_robin_mode === "round_robin"
                      ? "Rotates bookings between hosts in order"
                      : editingCalendar.round_robin_mode === "availability_based"
                        ? "Assigns to the host with the fewest bookings that day"
                        : "All bookings go to the first selected host"}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {(editingCalendar.round_robin_members || []).length} host{(editingCalendar.round_robin_members || []).length !== 1 ? "s" : ""} selected
              </p>
            </TabsContent>

            {/* When Tab - Availability */}
            <TabsContent value="when" className="mt-6">
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>Team-Wide Availability:</strong> The availability hours you set here apply to all calendars and all hosts. Individual hosts can connect their Google Calendar to block their personal busy times.
                </p>
              </div>
              <AvailabilitySettings />
            </TabsContent>

            {/* Where Tab */}
            <TabsContent value="where" className="space-y-4 mt-6">
              {/* Prerequisites Warning */}
              {(!hasGoogleCalendar || (editingCalendar.location_type === "zoom" && !hasZoom)) && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-sm">
                    <strong>Recommended:</strong> Connect your integrations for the best experience.
                    {!hasGoogleCalendar && " Connect Google Calendar to block busy times. "}
                    {editingCalendar.location_type === "zoom" && !hasZoom && " Connect Zoom to generate meeting links automatically. "}
                    Go to the Connections tab to set these up.
                  </AlertDescription>
                </Alert>
              )}
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
