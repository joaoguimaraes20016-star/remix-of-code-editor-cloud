// src/components/scheduling/EventTypesManager.tsx
// CRUD interface for booking event types

import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus, Clock, MapPin, Users, Copy, ExternalLink,
  MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useEventTypes,
  useCreateEventType,
  useUpdateEventType,
  useDeleteEventType,
  type EventType,
} from "@/hooks/useEventTypes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const LOCATION_TYPES = [
  { value: "zoom", label: "Zoom", icon: "video" },
  { value: "google_meet", label: "Google Meet", icon: "video" },
  { value: "phone", label: "Phone Call", icon: "phone" },
  { value: "in_person", label: "In Person", icon: "map" },
  { value: "custom", label: "Custom URL", icon: "link" },
];

const DEFAULT_EVENT_TYPE: Partial<EventType> = {
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

export default function EventTypesManager() {
  const { teamId } = useParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<Partial<EventType>>(DEFAULT_EVENT_TYPE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: eventTypes, isLoading } = useEventTypes(teamId);
  const createEventType = useCreateEventType(teamId);
  const updateEventType = useUpdateEventType(teamId);
  const deleteEventType = useDeleteEventType(teamId);

  const handleCreate = () => {
    setEditingType({ ...DEFAULT_EVENT_TYPE });
    setIsEditing(false);
    setEditorOpen(true);
  };

  const handleEdit = (et: EventType) => {
    setEditingType({ ...et });
    setIsEditing(true);
    setEditorOpen(true);
  };

  const handleSave = () => {
    if (!editingType.name || !teamId) return;

    if (isEditing && editingType.id) {
      updateEventType.mutate(editingType as EventType);
    } else {
      createEventType.mutate({ ...editingType, team_id: teamId } as any);
    }

    setEditorOpen(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteEventType.mutate(deletingId);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = (et: EventType) => {
    updateEventType.mutate({ id: et.id, is_active: !et.is_active });
  };

  const copyBookingLink = (et: EventType) => {
    const link = `${window.location.origin}/book/${teamId}/${et.slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Booking link copied to clipboard");
  };

  const updateField = (field: string, value: any) => {
    setEditingType((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === "name" && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setEditingType((prev) => ({ ...prev, slug }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Event Type
        </Button>
      </div>

      {/* Event Types List */}
      {!eventTypes || eventTypes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No event types yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first event type to start accepting bookings
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((et) => (
            <Card
              key={et.id}
              className={cn(
                "transition-all hover:shadow-md",
                !et.is_active && "opacity-60"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {/* Color indicator */}
                <div
                  className="w-1.5 h-14 rounded-full shrink-0"
                  style={{ backgroundColor: et.color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{et.name}</h3>
                    <Badge variant={et.is_active ? "default" : "secondary"} className="text-xs">
                      {et.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {et.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {LOCATION_TYPES.find((l) => l.value === et.location_type)?.label || et.location_type}
                    </span>
                    {et.round_robin_mode !== "none" && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {et.round_robin_members?.length || 0} members
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyBookingLink(et)}
                    title="Copy booking link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(et)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(et)}>
                        {et.is_active ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyBookingLink(et)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setDeletingId(et.id);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Type Editor Sheet */}
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit Event Type" : "New Event Type"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  value={editingType.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., 30-Minute Strategy Call"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">URL Slug</Label>
                <Input
                  value={editingType.slug || ""}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="30-minute-strategy-call"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  /book/{teamId}/{editingType.slug || "..."}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={editingType.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of this meeting type"
                  rows={2}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Scheduling</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Duration</Label>
                  <Select
                    value={String(editingType.duration_minutes || 30)}
                    onValueChange={(v) => updateField("duration_minutes", Number(v))}
                  >
                    <SelectTrigger>
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
                  <Label className="text-sm">Color</Label>
                  <Input
                    type="color"
                    value={editingType.color || "#3B82F6"}
                    onChange={(e) => updateField("color", e.target.value)}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Buffer Before (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingType.buffer_before_minutes || 0}
                    onChange={(e) => updateField("buffer_before_minutes", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Buffer After (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingType.buffer_after_minutes || 0}
                    onChange={(e) => updateField("buffer_after_minutes", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Min Notice (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingType.min_notice_hours || 1}
                    onChange={(e) => updateField("min_notice_hours", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Advance (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingType.max_advance_days || 60}
                    onChange={(e) => updateField("max_advance_days", Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Max Bookings Per Day</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingType.max_bookings_per_day || ""}
                  onChange={(e) =>
                    updateField("max_bookings_per_day", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Location</h4>

              <Select
                value={editingType.location_type || "zoom"}
                onValueChange={(v) => updateField("location_type", v)}
              >
                <SelectTrigger>
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

              {(editingType.location_type === "custom" ||
                editingType.location_type === "phone" ||
                editingType.location_type === "in_person") && (
                <Input
                  value={editingType.location_value || ""}
                  onChange={(e) => updateField("location_value", e.target.value)}
                  placeholder={
                    editingType.location_type === "phone"
                      ? "Phone number"
                      : editingType.location_type === "in_person"
                        ? "Address"
                        : "Meeting URL"
                  }
                />
              )}
            </div>

            {/* Confirmation Type */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Confirmation</h4>
              <Select
                value={editingType.confirmation_type || "automatic"}
                onValueChange={(v) => updateField("confirmation_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic (instant confirmation)</SelectItem>
                  <SelectItem value="manual">Manual (requires approval)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editingType.name}>
              {isEditing ? "Save Changes" : "Create Event Type"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event type. Existing bookings will not be affected.
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
    </div>
  );
}
