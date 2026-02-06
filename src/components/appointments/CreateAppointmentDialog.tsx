import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError } from "@/lib/errorUtils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

const createSchema = z.object({
  lead_name: z.string().min(1, "Name is required"),
  lead_email: z.string().email("Valid email required"),
  lead_phone: z.string().optional(),
  start_at_utc: z.date(),
  event_type_id: z.string().min(1, "Event type is required"),
  setter_id: z.string().nullable(),
  closer_id: z.string().nullable(),
  status: z.string().default("NEW"),
  appointment_notes: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("09:00");

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      lead_name: "",
      lead_email: "",
      lead_phone: "",
      start_at_utc: new Date(),
      event_type_id: "",
      setter_id: null,
      closer_id: null,
      status: "NEW",
      appointment_notes: "",
    },
  });

  const selectedDate = watch("start_at_utc");
  const selectedEventType = watch("event_type_id");
  const selectedEventTypeData = eventTypes.find((et) => et.id === selectedEventType);

  useEffect(() => {
    if (open) {
      loadTeamMembers();
      loadEventTypes();
      // Reset form when dialog opens
      reset({
        lead_name: "",
        lead_email: "",
        lead_phone: "",
        start_at_utc: new Date(),
        event_type_id: "",
        setter_id: null,
        closer_id: null,
        status: "NEW",
        appointment_notes: "",
      });
      setSelectedTime("09:00");
    }
  }, [open, teamId, reset]);

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select(`user_id, profiles!team_members_user_id_fkey(full_name)`)
      .eq("team_id", teamId)
      .eq("is_active", true);

    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const loadEventTypes = async () => {
    const { data, error } = await supabase
      .from("event_types")
      .select("id, name, duration_minutes, is_active")
      .eq("team_id", teamId)
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setEventTypes(data);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Combine selected date with selected time
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);
      setValue("start_at_utc", combinedDate);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const combinedDate = new Date(selectedDate);
      combinedDate.setHours(hours, minutes, 0, 0);
      setValue("start_at_utc", combinedDate);
    }
  };

  const onSubmit = async (data: CreateFormValues) => {
    setLoading(true);
    try {
      // Get event type details
      const eventType = eventTypes.find((et) => et.id === data.event_type_id);
      if (!eventType) {
        throw new Error("Event type not found");
      }

      // Determine assigned user (closer_id or setter_id)
      const assignedUserId = data.closer_id || data.setter_id;

      // Create appointment
      const appointmentData: any = {
        team_id: teamId,
        source: "manual",
        status: data.status,
        pipeline_stage: "booked",
        lead_name: data.lead_name,
        lead_email: data.lead_email,
        lead_phone: data.lead_phone || null,
        start_at_utc: data.start_at_utc.toISOString(),
        duration_minutes: eventType.duration_minutes || 30,
        event_type_id: data.event_type_id,
        appointment_type_id: data.event_type_id,
        event_type_name: eventType.name,
        setter_id: data.setter_id,
        closer_id: data.closer_id,
        assigned_user_id: assignedUserId,
        appointment_notes: data.appointment_notes || null,
      };

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await supabase.from("activity_logs").insert([{
        team_id: teamId,
        appointment_id: appointment.id,
        actor_name: "Admin",
        action_type: "Created",
        note: "Appointment created manually",
      }]);

      toast({
        title: "Appointment created",
        description: "Appointment has been created successfully",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error creating appointment",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate time options
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      timeOptions.push(`${hh}:${mm}`);
    }
  }

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment manually. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Event Type Selection */}
          <div>
            <Label htmlFor="event_type_id">Calendar / Event Type *</Label>
            <Select
              value={watch("event_type_id")}
              onValueChange={(val) => setValue("event_type_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select calendar" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.length === 0 ? (
                  <SelectItem value="" disabled>No active calendars found</SelectItem>
                ) : (
                  eventTypes.map((et) => (
                    <SelectItem key={et.id} value={et.id}>
                      {et.name} ({et.duration_minutes} min)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.event_type_id && (
              <p className="text-sm text-destructive mt-1">{errors.event_type_id.message}</p>
            )}
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead_name">Lead Name *</Label>
              <Input id="lead_name" {...register("lead_name")} />
              {errors.lead_name && (
                <p className="text-sm text-destructive">{errors.lead_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lead_email">Email *</Label>
              <Input id="lead_email" type="email" {...register("lead_email")} />
              {errors.lead_email && (
                <p className="text-sm text-destructive">{errors.lead_email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="lead_phone">Phone</Label>
            <Input id="lead_phone" {...register("lead_phone")} />
          </div>

          {/* Appointment Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time *</Label>
              <Select value={selectedTime} onValueChange={handleTimeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTime12(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEventTypeData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: {selectedEventTypeData.duration_minutes} minutes</span>
            </div>
          )}

          {/* Team Assignments */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setter_id">Setter</Label>
              <Select
                value={watch("setter_id") || "none"}
                onValueChange={(val) => setValue("setter_id", val === "none" ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles?.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="closer_id">Closer</Label>
              <Select
                value={watch("closer_id") || "none"}
                onValueChange={(val) => setValue("closer_id", val === "none" ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles?.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={watch("status")} onValueChange={(val) => setValue("status", val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="SHOWED">Showed</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
                <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="appointment_notes">Notes</Label>
            <Textarea
              id="appointment_notes"
              {...register("appointment_notes")}
              rows={3}
              placeholder="Additional notes about this appointment..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
