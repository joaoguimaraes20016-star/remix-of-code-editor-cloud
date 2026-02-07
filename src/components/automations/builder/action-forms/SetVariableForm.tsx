import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SetVariableConfig {
  name: string;
  value: string;
}

interface SetVariableFormProps {
  config: SetVariableConfig;
  onChange: (config: SetVariableConfig) => void;
}

export function SetVariableForm({ config, onChange }: SetVariableFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="varName">Variable Name</Label>
        <Input
          id="varName"
          placeholder="e.g., myCustomValue"
          value={config.name || ""}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Access later via {"{{stepOutputs.variables.myCustomValue}}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="varValue">Value</Label>
        <Input
          id="varValue"
          placeholder="e.g., {{lead.email}}"
          value={config.value || ""}
          onChange={(e) => onChange({ ...config, value: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Supports template variables and static text
        </p>
      </div>
    </div>
  );
}
