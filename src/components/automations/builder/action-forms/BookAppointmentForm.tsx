import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface BookAppointmentConfig {
  calendarId?: string;
  eventTypeId?: string;
  date?: string;
  time?: string;
  timezone?: string;
  duration?: number;
  notes?: string;
  notifyAttendee?: boolean;
}

interface BookAppointmentFormProps {
  config: BookAppointmentConfig;
  onChange: (config: BookAppointmentConfig) => void;
}

export function BookAppointmentForm({ config, onChange }: BookAppointmentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="calendarId">Calendar</Label>
        <Input
          id="calendarId"
          placeholder="Enter calendar ID or name"
          value={config.calendarId || ""}
          onChange={(e) => onChange({ ...config, calendarId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Select which calendar to book on</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventTypeId">Event Type ID</Label>
        <Input
          id="eventTypeId"
          placeholder="Enter event type ID"
          value={config.eventTypeId || ""}
          onChange={(e) => onChange({ ...config, eventTypeId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">The event type to book (from your calendar settings)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={config.date || ""}
            onChange={(e) => onChange({ ...config, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={config.time || ""}
            onChange={(e) => onChange({ ...config, time: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duration (minutes)</Label>
        <Select
          value={String(config.duration || 30)}
          onValueChange={(value) => onChange({ ...config, duration: Number(value) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          value={config.timezone || "America/New_York"}
          onValueChange={(value) => onChange({ ...config, timezone: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
            <SelectItem value="America/Chicago">Central (CT)</SelectItem>
            <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Europe/London">London (GMT)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes for the appointment..."
          value={config.notes || ""}
          onChange={(e) => onChange({ ...config, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="notify-toggle" className="cursor-pointer">Notify Attendee</Label>
          <p className="text-xs text-muted-foreground">Send confirmation to the contact</p>
        </div>
        <Switch
          id="notify-toggle"
          checked={config.notifyAttendee !== false}
          onCheckedChange={(checked) => onChange({ ...config, notifyAttendee: checked })}
        />
      </div>
    </div>
  );
}
