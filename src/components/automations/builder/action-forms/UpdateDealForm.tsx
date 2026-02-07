import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UpdateDealConfig {
  field: string;
  value: string;
}

interface UpdateDealFormProps {
  config: UpdateDealConfig;
  onChange: (config: UpdateDealConfig) => void;
}

export function UpdateDealForm({ config, onChange }: UpdateDealFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Field to Update</Label>
        <Select
          value={config.field || ""}
          onValueChange={(v) => onChange({ ...config, field: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a field..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="pipeline_stage">Pipeline Stage</SelectItem>
            <SelectItem value="deal_value">Deal Value</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="appointment_notes">Appointment Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">New Value</Label>
        <Input
          id="value"
          placeholder="e.g., {{lead.name}} - Deal"
          value={config.value || ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Supports template variables like {"{{lead.name}}"}
        </p>
      </div>
    </div>
  );
}
