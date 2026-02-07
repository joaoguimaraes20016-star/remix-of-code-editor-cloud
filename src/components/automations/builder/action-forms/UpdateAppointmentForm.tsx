import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UpdateAppointmentConfig {
  status?: "confirmed" | "no_show" | "cancelled" | "completed";
  newTime?: string;
  notes?: string;
  notifyAttendee?: boolean;
}

interface UpdateAppointmentFormProps {
  config: UpdateAppointmentConfig;
  onChange: (config: UpdateAppointmentConfig) => void;
}

export function UpdateAppointmentForm({ config, onChange }: UpdateAppointmentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Update Status</Label>
        <Select
          value={config.status || ""}
          onValueChange={(value: UpdateAppointmentConfig["status"]) => onChange({ ...config, status: value })}
        >
          <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newTime">Reschedule To (optional)</Label>
        <Input
          id="newTime"
          type="datetime-local"
          value={config.newTime || ""}
          onChange={(e) => onChange({ ...config, newTime: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Leave blank to keep the current time</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Update Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about this update..."
          value={config.notes || ""}
          onChange={(e) => onChange({ ...config, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="notify-update" className="cursor-pointer">Notify Attendee</Label>
          <p className="text-xs text-muted-foreground">Send update notification to the contact</p>
        </div>
        <Switch
          id="notify-update"
          checked={config.notifyAttendee !== false}
          onCheckedChange={(checked) => onChange({ ...config, notifyAttendee: checked })}
        />
      </div>
    </div>
  );
}
