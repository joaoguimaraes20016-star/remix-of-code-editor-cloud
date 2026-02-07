// src/pages/Calendars.tsx
// Main calendars management page (Calendly/GHL style)
// First calendar: guided wizard. Additional calendars: simple dialog.

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ConnectionsSettings from "@/components/scheduling/ConnectionsSettings";
import AvailabilitySettings from "@/components/scheduling/AvailabilitySettings";
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
import CreateCalendarDialog from "@/components/scheduling/CalendarWizard";
import FirstCalendarWizard from "@/components/scheduling/FirstCalendarWizard";
import EmptyCalendarsState from "@/components/scheduling/EmptyCalendarsState";

export default function Calendars() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<EventType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam && ["calendars", "availability", "connections"].includes(tabParam)
      ? tabParam
      : "calendars";
  });

  const { data: calendars, isLoading } = useEventTypes(teamId);

  const hasCalendars = calendars && calendars.length > 0;

  // Fetch team booking slug
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
  }, [teamId]);

  const updateCalendar = useUpdateEventType(teamId);
  const deleteCalendar = useDeleteEventType(teamId);

  const handleCreate = () => {
    // First calendar -> wizard; additional calendars -> simple dialog
    if (hasCalendars) {
      setCreateOpen(true);
    } else {
      setWizardOpen(true);
    }
  };

  const handleEdit = (calendar: EventType) => {
    setEditingCalendar(calendar);
    setEditorOpen(true);
  };

  const handleCreated = () => {
    // Refresh booking slug in case it was auto-generated
    if (teamId) {
      supabase
        .from("teams")
        .select("booking_slug")
        .eq("id", teamId)
        .single()
        .then(({ data }) => {
          setBookingSlug(data?.booking_slug || null);
        });
    }
  };

  const handleToggleActive = async (calendar: EventType) => {
    if (!calendar.is_active && teamId) {
      // Auto-fix missing prerequisites silently

      // 1. Auto-generate booking slug if missing
      if (!bookingSlug) {
        try {
          const { data: teamData } = await supabase
            .from("teams")
            .select("name")
            .eq("id", teamId)
            .single();

          if (teamData?.name) {
            let newSlug = teamData.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            if (newSlug.length < 3) newSlug = `${newSlug}-team`;

            const { data: existing } = await supabase
              .from("teams")
              .select("id")
              .eq("booking_slug", newSlug)
              .neq("id", teamId)
              .maybeSingle();

            if (existing) {
              newSlug = `${newSlug}-${Math.random().toString(36).slice(2, 6)}`;
            }

            await supabase
              .from("teams")
              .update({ booking_slug: newSlug })
              .eq("id", teamId);

            setBookingSlug(newSlug);
          }
        } catch (error) {
          console.error("Error auto-generating booking slug:", error);
        }
      }

      // 2. Auto-assign current user as host if no hosts
      const hostIds = calendar.round_robin_members || [];
      if (hostIds.length === 0 && user?.id) {
        await supabase
          .from("event_types")
          .update({ round_robin_members: [user.id] })
          .eq("id", calendar.id);
      }

      // 3. Seed default availability if none exists
      const { data: avail } = await supabase
        .from("availability_schedules")
        .select("id")
        .eq("team_id", teamId)
        .is("user_id", null)
        .eq("is_available", true)
        .limit(1);

      if (!avail || avail.length === 0) {
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

        await supabase.from("availability_schedules").insert(
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
          <h1 className="text-2xl font-bold text-foreground">Scheduling</h1>
        </div>
        {activeTab === "calendars" && !wizardOpen && hasCalendars && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Calendar
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        if (tab === "calendars") {
          setSearchParams({});
        } else {
          setSearchParams({ tab });
        }
      }} className="w-full">
        <TabsList>
          <TabsTrigger value="calendars">Event</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        {/* Calendars Tab */}
        <TabsContent value="calendars" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : wizardOpen && !hasCalendars ? (
            <FirstCalendarWizard
              onComplete={() => {
                setWizardOpen(false);
                handleCreated();
              }}
              onCancel={() => setWizardOpen(false)}
            />
          ) : !hasCalendars ? (
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
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="mt-6">
          <AvailabilitySettings />
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="mt-6">
          <ConnectionsSettings />
        </TabsContent>
      </Tabs>

      {/* Create Calendar Dialog */}
      <CreateCalendarDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

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
