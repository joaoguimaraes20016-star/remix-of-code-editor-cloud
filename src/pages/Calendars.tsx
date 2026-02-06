// src/pages/Calendars.tsx
// Main calendars management page (GoHighLevel style)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Circle, Link2, Calendar, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
  useUpdateEventType,
  useDeleteEventType,
  type EventType,
} from "@/hooks/useEventTypes";
import CalendarCard from "@/components/scheduling/CalendarCard";
import CalendarEditor from "@/components/scheduling/CalendarEditor";
import CalendarWizard from "@/components/scheduling/CalendarWizard";
import EmptyCalendarsState from "@/components/scheduling/EmptyCalendarsState";

export default function Calendars() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<EventType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [hasAvailability, setHasAvailability] = useState<boolean | null>(null);

  const { data: calendars, isLoading } = useEventTypes(teamId);

  // Fetch team booking slug and availability status
  useEffect(() => {
    if (!teamId) return;
    supabase
      .from("teams")
      .select("booking_slug")
      .eq("id", teamId)
      .single()
      .then(({ data }) => {
        setBookingSlug(data?.booking_slug || null);
      });

    if (user?.id) {
      supabase
        .from("availability_schedules")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("is_available", true)
        .limit(1)
        .then(({ data }) => {
          setHasAvailability(!!data && data.length > 0);
        });
    }
  }, [teamId, user?.id]);

  const hasCalendars = calendars && calendars.length > 0;
  const hasActiveCalendar = calendars?.some((c) => c.is_active) ?? false;
  const setupComplete = !!bookingSlug && hasCalendars && hasActiveCalendar && hasAvailability;
  const updateCalendar = useUpdateEventType(teamId);
  const deleteCalendar = useDeleteEventType(teamId);

  const handleCreate = () => {
    // If no calendars exist, show wizard; otherwise show editor
    if (!calendars || calendars.length === 0) {
      setWizardOpen(true);
    } else {
      setEditingCalendar(null);
      setEditorOpen(true);
    }
  };

  const handleEdit = (calendar: EventType) => {
    setEditingCalendar(calendar);
    setEditorOpen(true);
  };

  const handleWizardComplete = () => {
    // Wizard creates the calendar via the hook
    setWizardOpen(false);
    // The hook will refetch automatically
  };

  const handleToggleActive = async (calendar: EventType) => {
    // If activating, validate prerequisites
    if (!calendar.is_active) {
      // Check booking slug
      if (!bookingSlug) {
        toast.error(
          "Set your team's Booking URL first in Team Settings → Booking URL tab before activating a calendar.",
          { duration: 5000 }
        );
        return;
      }

      // Check that calendar has hosts assigned
      const hostIds = calendar.round_robin_members || [];
      if (hostIds.length === 0) {
        // Check if there's at least a team owner/admin as fallback
        if (teamId) {
          const { data: admins } = await supabase
            .from("team_members")
            .select("user_id")
            .eq("team_id", teamId)
            .in("role", ["owner", "admin"])
            .limit(1);

          if (!admins || admins.length === 0) {
            toast.error(
              "No hosts assigned to this calendar. Edit the calendar and add at least one host in the Hosts tab.",
              { duration: 5000 }
            );
            return;
          }
          // Use admin as implicit host for availability check
          hostIds.push(admins[0].user_id);
        }
      }

      // Check that at least one host has availability configured
      if (teamId && hostIds.length > 0) {
        // Get host names for better error messages
        const { data: hostProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", hostIds);

        const { data: avail } = await supabase
          .from("availability_schedules")
          .select("id, user_id")
          .eq("team_id", teamId)
          .in("user_id", hostIds)
          .eq("is_available", true);

        if (!avail || avail.length === 0) {
          const hostNames = (hostProfiles || [])
            .map((p) => p.full_name || "Unknown")
            .join(", ");
          toast.error(
            `None of the hosts (${hostNames}) have availability hours configured. Edit the calendar and configure availability in the When tab.`,
            { duration: 6000 }
          );
          return;
        }

        // Check which hosts don't have availability (for warning)
        const hostsWithAvail = new Set(avail.map((a) => a.user_id));
        const hostsWithoutAvail = hostIds.filter((id) => !hostsWithAvail.has(id));
        if (hostsWithoutAvail.length > 0 && hostsWithoutAvail.length < hostIds.length) {
          const missingNames = (hostProfiles || [])
            .filter((p) => hostsWithoutAvail.includes(p.id))
            .map((p) => p.full_name || "Unknown")
            .join(", ");
          toast.warning(
            `Some hosts (${missingNames}) don't have availability configured. They won't receive bookings until availability is set.`,
            { duration: 5000 }
          );
        }
      }
    }

    updateCalendar.mutate({ id: calendar.id, is_active: !calendar.is_active });
  };

  const handleDelete = (calendarId: string) => {
    setDeletingId(calendarId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteCalendar.mutate(deletingId);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendars</h1>
          <p className="text-muted-foreground">
            Manage your booking calendars
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Calendar
        </Button>
      </div>

      {/* Setup Checklist - shows when setup is incomplete */}
      {!isLoading && !setupComplete && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-foreground">Setup Checklist</h3>
            <div className="space-y-2">
              <ChecklistItem
                done={!!bookingSlug}
                label="Set your booking URL"
                action={
                  !bookingSlug ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate(`/team/${teamId}/settings`)}
                    >
                      Team Settings → Booking URL
                    </Button>
                  ) : undefined
                }
              />
              <ChecklistItem
                done={!!hasCalendars}
                label="Create your first calendar"
                action={
                  !hasCalendars ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={handleCreate}
                    >
                      Create now
                    </Button>
                  ) : undefined
                }
              />
              <ChecklistItem
                done={hasAvailability === true}
                label="Configure availability hours"
              />
              <ChecklistItem
                done={hasActiveCalendar}
                label="Activate a calendar"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : !calendars || calendars.length === 0 ? (
        <EmptyCalendarsState onCreateClick={handleCreate} />
      ) : (
        <div className="space-y-3">
          {calendars.map((calendar) => (
            <CalendarCard
              key={calendar.id}
              calendar={calendar}
              teamId={teamId || ""}
              bookingSlug={bookingSlug}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Calendar Editor */}
      <CalendarEditor
        calendar={editingCalendar}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingCalendar(null);
        }}
        onDelete={handleDelete}
      />

      {/* Wizard (for first-time users) */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <CalendarWizard
              onComplete={handleWizardComplete}
              onCancel={() => setWizardOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
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
              onClick={confirmDelete}
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

function ChecklistItem({
  done,
  label,
  action,
}: {
  done: boolean;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
        {label}
      </span>
      {!done && action && <span className="ml-auto">{action}</span>}
    </div>
  );
}
