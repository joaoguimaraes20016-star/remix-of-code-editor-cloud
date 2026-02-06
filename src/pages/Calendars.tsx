// src/pages/Calendars.tsx
// Main calendars management page (GoHighLevel style)

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<EventType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: calendars, isLoading } = useEventTypes(teamId);
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

  const handleToggleActive = (calendar: EventType) => {
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
