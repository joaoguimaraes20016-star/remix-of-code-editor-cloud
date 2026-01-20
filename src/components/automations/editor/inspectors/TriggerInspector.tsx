import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";

interface TriggerInspectorProps {
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
}

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: "lead_created", label: "Lead Created" },
  { value: "lead_tag_added", label: "Lead Tag Added" },
  { value: "appointment_booked", label: "Appointment Booked" },
  { value: "appointment_rescheduled", label: "Appointment Rescheduled" },
  { value: "appointment_no_show", label: "Appointment No Show" },
  { value: "appointment_completed", label: "Appointment Completed" },
  { value: "payment_received", label: "Payment Received" },
  { value: "time_delay", label: "Time Delay" },
];

export function TriggerInspector({ trigger, onChange }: TriggerInspectorProps) {
  const handleTypeChange = (type: TriggerType) => {
    onChange({ type, config: {} });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/70">Trigger Type</Label>
        <Select value={trigger.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10">
            {TRIGGER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {trigger.type === "lead_tag_added" && (
        <div className="space-y-2">
          <Label className="text-white/70">Tag Name</Label>
          <Input
            value={trigger.config?.tag || ""}
            onChange={(e) => onChange({ ...trigger, config: { ...trigger.config, tag: e.target.value } })}
            placeholder="e.g., hot-lead"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      )}
    </div>
  );
}
