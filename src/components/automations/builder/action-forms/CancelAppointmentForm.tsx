import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface CancelAppointmentConfig {
  reason?: string;
  notifyAttendee?: boolean;
  allowReschedule?: boolean;
}

interface CancelAppointmentFormProps {
  config: CancelAppointmentConfig;
  onChange: (config: CancelAppointmentConfig) => void;
}

export function CancelAppointmentForm({ config, onChange }: CancelAppointmentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">Cancellation Reason (optional)</Label>
        <Textarea
          id="reason"
          placeholder="e.g., Contact requested cancellation, no response..."
          value={config.reason || ""}
          onChange={(e) => onChange({ ...config, reason: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="notify-cancel" className="cursor-pointer">Notify Attendee</Label>
          <p className="text-xs text-muted-foreground">Send cancellation notice to the contact</p>
        </div>
        <Switch
          id="notify-cancel"
          checked={config.notifyAttendee !== false}
          onCheckedChange={(checked) => onChange({ ...config, notifyAttendee: checked })}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 p-3">
        <div>
          <Label htmlFor="reschedule-toggle" className="cursor-pointer">Allow Reschedule</Label>
          <p className="text-xs text-muted-foreground">Include reschedule link in cancellation notice</p>
        </div>
        <Switch
          id="reschedule-toggle"
          checked={config.allowReschedule || false}
          onCheckedChange={(checked) => onChange({ ...config, allowReschedule: checked })}
        />
      </div>
    </div>
  );
}
