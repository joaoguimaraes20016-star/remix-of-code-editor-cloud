import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2 } from "lucide-react";

interface BusinessHoursConfig {
  useTeamHours: boolean;
  timezone?: string;
}

interface BusinessHoursFormProps {
  config: BusinessHoursConfig;
  onChange: (config: BusinessHoursConfig) => void;
}

export function BusinessHoursForm({ config, onChange }: BusinessHoursFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-teal-400 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              This step will pause the workflow until the next business hours window.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure your team's business hours in Settings → Business Hours
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Use Team Business Hours</Label>
          <p className="text-xs text-muted-foreground">
            Use the hours configured in team settings
          </p>
        </div>
        <Switch
          checked={config.useTeamHours ?? true}
          onCheckedChange={(checked) => onChange({ ...config, useTeamHours: checked })}
        />
      </div>

      <div className="p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          Default business hours: Mon-Fri, 9:00 AM - 5:00 PM (Team Timezone)
        </p>
      </div>
    </div>
  );
}
