import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, Calendar, MessageCircle, Zap } from "lucide-react";

interface WaitUntilConfig {
  waitType: 'specific_date' | 'field_date' | 'event';
  specificDate?: string;
  specificTime?: string;
  dateField?: string;
  offsetDays?: number;
  offsetDirection?: 'before' | 'after';
  // Event-based waiting
  eventType?: string;
  timeoutHours?: number;
  timeoutAction?: 'continue' | 'stop' | 'branch';
}

interface WaitUntilFormProps {
  config: WaitUntilConfig;
  onChange: (config: WaitUntilConfig) => void;
}

const EVENT_OPTIONS = [
  { value: "customer_replied", label: "Customer Replied", icon: MessageCircle },
  { value: "email_opened", label: "Email Opened", icon: Zap },
  { value: "form_submitted", label: "Form Submitted", icon: Calendar },
  { value: "appointment_booked", label: "Appointment Booked", icon: Calendar },
  { value: "payment_received", label: "Payment Received", icon: Zap },
];

export function WaitUntilForm({ config, onChange }: WaitUntilFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait Until</Label>
        <RadioGroup
          value={config.waitType || 'specific_date'}
          onValueChange={(value) => onChange({ ...config, waitType: value as WaitUntilConfig['waitType'] })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific_date" id="specific_date" />
            <Label htmlFor="specific_date" className="font-normal cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Specific date & time
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="field_date" id="field_date" />
            <Label htmlFor="field_date" className="font-normal cursor-pointer flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Based on a date field
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="event" id="event" />
            <Label htmlFor="event" className="font-normal cursor-pointer flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              Wait for an event
            </Label>
          </div>
        </RadioGroup>
      </div>

      {config.waitType === 'specific_date' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="specificDate">Date</Label>
            <Input
              id="specificDate"
              type="date"
              value={config.specificDate || ""}
              onChange={(e) => onChange({ ...config, specificDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specificTime">Time</Label>
            <Input
              id="specificTime"
              type="time"
              value={config.specificTime || "09:00"}
              onChange={(e) => onChange({ ...config, specificTime: e.target.value })}
            />
          </div>
        </div>
      )}

      {config.waitType === 'field_date' && (
        <>
          <div className="space-y-2">
            <Label>Date Field</Label>
            <Select
              value={config.dateField || ""}
              onValueChange={(value) => onChange({ ...config, dateField: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment.start_at">Appointment Date</SelectItem>
                <SelectItem value="appointment.start_at_utc">Appointment Date (UTC)</SelectItem>
                <SelectItem value="lead.created_at">Lead Created Date</SelectItem>
                <SelectItem value="deal.close_date">Deal Close Date</SelectItem>
                <SelectItem value="contact.date_of_birth">Contact Birthday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="offsetDays">Offset (days)</Label>
              <Input
                id="offsetDays"
                type="number"
                min="0"
                placeholder="0"
                value={config.offsetDays || ""}
                onChange={(e) => onChange({ ...config, offsetDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={config.offsetDirection || "before"}
                onValueChange={(value) => onChange({ ...config, offsetDirection: value as 'before' | 'after' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {config.waitType === 'event' && (
        <>
          <div className="space-y-2">
            <Label>Wait for Event</Label>
            <Select
              value={config.eventType || ""}
              onValueChange={(value) => onChange({ ...config, eventType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event to wait for" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="timeoutHours">Timeout (hours)</Label>
              <Input
                id="timeoutHours"
                type="number"
                min="1"
                placeholder="24"
                value={config.timeoutHours || ""}
                onChange={(e) => onChange({ ...config, timeoutHours: parseInt(e.target.value) || 24 })}
              />
            </div>
            <div className="space-y-2">
              <Label>On Timeout</Label>
              <Select
                value={config.timeoutAction || "continue"}
                onValueChange={(value) => onChange({ ...config, timeoutAction: value as 'continue' | 'stop' | 'branch' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continue">Continue workflow</SelectItem>
                  <SelectItem value="stop">Stop workflow</SelectItem>
                  <SelectItem value="branch" disabled>
                    Branch (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300">
              The workflow will pause until the selected event occurs for this contact, 
              or until the timeout is reached. Timeout branching (like GoHighLevel) will allow 
              separate paths for "event received" vs "timed out" once canvas branching is supported.
            </p>
          </div>
        </>
      )}
    </div>
  );
}