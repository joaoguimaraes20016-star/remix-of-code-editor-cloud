import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormatDateConfig {
  input: string;
  format: string;
  timezone: string;
  outputVariable: string;
}

interface FormatDateFormProps {
  config: FormatDateConfig;
  onChange: (config: FormatDateConfig) => void;
}

export function FormatDateForm({ config, onChange }: FormatDateFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="input">Input Date</Label>
        <Input
          id="input"
          placeholder="e.g., {{lead.created_at}}"
          value={config.input || ""}
          onChange={(e) => onChange({ ...config, input: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Output Format</Label>
        <Select
          value={config.format || "YYYY-MM-DD"}
          onValueChange={(v) => onChange({ ...config, format: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YYYY-MM-DD">2026-02-03</SelectItem>
            <SelectItem value="MM/DD/YYYY">02/03/2026</SelectItem>
            <SelectItem value="DD/MM/YYYY">03/02/2026</SelectItem>
            <SelectItem value="MMMM D, YYYY">February 3, 2026</SelectItem>
            <SelectItem value="relative">Relative (e.g., "2 days ago")</SelectItem>
            <SelectItem value="ISO">ISO 8601</SelectItem>
            <SelectItem value="unix">Unix Timestamp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          placeholder="e.g., America/New_York"
          value={config.timezone || "UTC"}
          onChange={(e) => onChange({ ...config, timezone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputVariable">Save As Variable</Label>
        <Input
          id="outputVariable"
          placeholder="e.g., formattedDate"
          value={config.outputVariable || "formattedDate"}
          onChange={(e) => onChange({ ...config, outputVariable: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Access via {"{{stepOutputs.variables.<name>}}"}
        </p>
      </div>
    </div>
  );
}
