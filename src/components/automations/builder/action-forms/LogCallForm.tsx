import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogCallConfig {
  outcome: "answered" | "no_answer" | "busy" | "voicemail" | "left_message";
  duration?: number;
  notes?: string;
  direction?: "inbound" | "outbound";
}

interface LogCallFormProps {
  config: LogCallConfig;
  onChange: (config: LogCallConfig) => void;
}

export function LogCallForm({ config, onChange }: LogCallFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Call Direction</Label>
        <Select
          value={config.direction || "outbound"}
          onValueChange={(value: "inbound" | "outbound") => onChange({ ...config, direction: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Call Outcome</Label>
        <Select
          value={config.outcome || "answered"}
          onValueChange={(value: LogCallConfig["outcome"]) => onChange({ ...config, outcome: value })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="no_answer">No Answer</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="left_message">Left Message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="e.g., 120"
          value={config.duration || ""}
          onChange={(e) => onChange({ ...config, duration: Number(e.target.value) || undefined })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Call Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Notes about the call..."
          value={config.notes || ""}
          onChange={(e) => onChange({ ...config, notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
