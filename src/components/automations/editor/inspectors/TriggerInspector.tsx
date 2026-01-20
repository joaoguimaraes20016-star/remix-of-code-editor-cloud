import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";

interface TriggerInspectorProps {
  trigger: AutomationTrigger;
  onChange: (trigger: AutomationTrigger) => void;
}

interface TriggerOption {
  value: TriggerType;
  label: string;
  category: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  // Lead triggers
  { value: "lead_created", label: "Lead Created", category: "Lead" },
  { value: "lead_tag_added", label: "Tag Added", category: "Lead" },
  { value: "lead_tag_removed", label: "Tag Removed", category: "Lead" },
  { value: "form_submitted", label: "Form Submitted", category: "Lead" },
  // Appointment triggers
  { value: "appointment_booked", label: "Appointment Booked", category: "Appointment" },
  { value: "appointment_rescheduled", label: "Appointment Rescheduled", category: "Appointment" },
  { value: "appointment_no_show", label: "No Show", category: "Appointment" },
  { value: "appointment_completed", label: "Appointment Completed", category: "Appointment" },
  { value: "appointment_canceled", label: "Appointment Canceled", category: "Appointment" },
  // Pipeline triggers
  { value: "stage_changed", label: "Stage Changed", category: "Pipeline" },
  { value: "deal_created", label: "Deal Created", category: "Pipeline" },
  { value: "deal_won", label: "Deal Won", category: "Pipeline" },
  { value: "deal_lost", label: "Deal Lost", category: "Pipeline" },
  // Payment triggers
  { value: "payment_received", label: "Payment Received", category: "Payment" },
  { value: "payment_failed", label: "Payment Failed", category: "Payment" },
  // Integration triggers
  { value: "webhook_received", label: "Webhook Received", category: "Integration" },
  { value: "manual_trigger", label: "Manual Trigger", category: "Integration" },
  { value: "scheduled_trigger", label: "Scheduled", category: "Integration" },
];

// Group options by category
const TRIGGER_CATEGORIES = TRIGGER_OPTIONS.reduce((acc, opt) => {
  if (!acc[opt.category]) acc[opt.category] = [];
  acc[opt.category].push(opt);
  return acc;
}, {} as Record<string, TriggerOption[]>);

export function TriggerInspector({ trigger, onChange }: TriggerInspectorProps) {
  const handleTypeChange = (type: TriggerType) => {
    onChange({ type, config: {} });
  };

  const handleConfigChange = (key: string, value: any) => {
    onChange({ ...trigger, config: { ...trigger.config, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/70">Trigger Type</Label>
        <Select value={trigger.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-80">
            {Object.entries(TRIGGER_CATEGORIES).map(([category, options]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-wide">
                  {category}
                </div>
                {options.map((opt) => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value} 
                    className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-white/10" />

      {/* Tag triggers */}
      {(trigger.type === "lead_tag_added" || trigger.type === "lead_tag_removed") && (
        <div className="space-y-2">
          <Label className="text-white/70">Tag Name</Label>
          <Input
            value={trigger.config?.tag || ""}
            onChange={(e) => handleConfigChange("tag", e.target.value)}
            placeholder="e.g., hot-lead"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      )}

      {/* Form submitted trigger */}
      {trigger.type === "form_submitted" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Funnel (Optional)</Label>
            <Input
              value={trigger.config?.funnelId || ""}
              onChange={(e) => handleConfigChange("funnelId", e.target.value)}
              placeholder="Any funnel"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <p className="text-xs text-white/40">Leave empty to trigger on any form submission</p>
          </div>
        </div>
      )}

      {/* Stage changed trigger */}
      {trigger.type === "stage_changed" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">From Stage (Optional)</Label>
            <Input
              value={trigger.config?.fromStage || ""}
              onChange={(e) => handleConfigChange("fromStage", e.target.value)}
              placeholder="Any stage"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">To Stage (Optional)</Label>
            <Input
              value={trigger.config?.toStage || ""}
              onChange={(e) => handleConfigChange("toStage", e.target.value)}
              placeholder="Any stage"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>
      )}

      {/* Webhook trigger */}
      {trigger.type === "webhook_received" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Webhook URL</Label>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <code className="text-xs text-primary break-all">
                {`https://your-project.supabase.co/functions/v1/webhook-trigger/${trigger.config?.webhookId || 'YOUR_WEBHOOK_ID'}`}
              </code>
            </div>
            <p className="text-xs text-white/40">Send POST requests to this URL to trigger this automation</p>
          </div>
        </div>
      )}

      {/* Scheduled trigger */}
      {trigger.type === "scheduled_trigger" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Schedule</Label>
            <Select 
              value={trigger.config?.schedule || "daily"} 
              onValueChange={(v) => handleConfigChange("schedule", v)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="daily" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">Daily</SelectItem>
                <SelectItem value="weekly" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Time</Label>
            <Input
              type="time"
              value={trigger.config?.time || "09:00"}
              onChange={(e) => handleConfigChange("time", e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          {trigger.config?.schedule === "weekly" && (
            <div className="space-y-2">
              <Label className="text-white/70">Day of Week</Label>
              <Select 
                value={String(trigger.config?.dayOfWeek || 1)} 
                onValueChange={(v) => handleConfigChange("dayOfWeek", parseInt(v))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="0" className="text-white hover:bg-white/10">Sunday</SelectItem>
                  <SelectItem value="1" className="text-white hover:bg-white/10">Monday</SelectItem>
                  <SelectItem value="2" className="text-white hover:bg-white/10">Tuesday</SelectItem>
                  <SelectItem value="3" className="text-white hover:bg-white/10">Wednesday</SelectItem>
                  <SelectItem value="4" className="text-white hover:bg-white/10">Thursday</SelectItem>
                  <SelectItem value="5" className="text-white hover:bg-white/10">Friday</SelectItem>
                  <SelectItem value="6" className="text-white hover:bg-white/10">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Payment triggers - show payment type filter */}
      {(trigger.type === "payment_received" || trigger.type === "payment_failed") && (
        <div className="space-y-2">
          <Label className="text-white/70">Payment Type (Optional)</Label>
          <Select 
            value={trigger.config?.paymentType || "any"} 
            onValueChange={(v) => handleConfigChange("paymentType", v === "any" ? undefined : v)}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Any payment" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="any" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">Any Payment</SelectItem>
              <SelectItem value="subscription" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">Subscription</SelectItem>
              <SelectItem value="one_time" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">One-Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
