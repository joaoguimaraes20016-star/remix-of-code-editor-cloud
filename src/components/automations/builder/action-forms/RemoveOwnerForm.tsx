import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RemoveOwnerConfig {
  entity: string;
}

interface RemoveOwnerFormProps {
  config: RemoveOwnerConfig;
  onChange: (config: RemoveOwnerConfig) => void;
}

export function RemoveOwnerForm({ config, onChange }: RemoveOwnerFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Entity Type</Label>
        <Select
          value={config.entity || "lead"}
          onValueChange={(v) => onChange({ ...config, entity: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Contact</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The owner will be unassigned from this entity
        </p>
      </div>
    </div>
  );
}
