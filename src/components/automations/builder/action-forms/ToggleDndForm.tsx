import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ToggleDndConfig {
  enable: boolean;
  channels: string[];
}

interface ToggleDndFormProps {
  config: ToggleDndConfig;
  onChange: (config: ToggleDndConfig) => void;
}

export function ToggleDndForm({ config, onChange }: ToggleDndFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable DND</Label>
          <p className="text-xs text-muted-foreground">Turn Do Not Disturb on or off</p>
        </div>
        <Switch
          checked={config.enable !== false}
          onCheckedChange={(v) => onChange({ ...config, enable: v })}
        />
      </div>

      <div className="space-y-2">
        <Label>Channels</Label>
        <Select
          value={(config.channels || ["all"])[0]}
          onValueChange={(v) => onChange({ ...config, channels: [v] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="sms">SMS Only</SelectItem>
            <SelectItem value="email">Email Only</SelectItem>
            <SelectItem value="phone">Phone Only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Which communication channels to apply DND to
        </p>
      </div>
    </div>
  );
}
