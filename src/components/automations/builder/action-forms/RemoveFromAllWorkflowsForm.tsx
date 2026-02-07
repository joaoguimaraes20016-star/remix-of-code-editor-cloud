import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface RemoveFromAllWorkflowsConfig {
  excludeCurrentWorkflow: boolean;
}

interface RemoveFromAllWorkflowsFormProps {
  config: RemoveFromAllWorkflowsConfig;
  onChange: (config: RemoveFromAllWorkflowsConfig) => void;
}

export function RemoveFromAllWorkflowsForm({ config, onChange }: RemoveFromAllWorkflowsFormProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-foreground font-medium mb-1">Remove from All Workflows</p>
        <p className="text-xs text-muted-foreground">
          This action will immediately exit the contact from all active workflow enrollments and cancel any pending scheduled jobs across all automations.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="excludeCurrent" className="text-sm font-medium">
            Exclude current workflow
          </Label>
          <p className="text-xs text-muted-foreground">
            Keep this workflow running while stopping all others
          </p>
        </div>
        <Switch
          id="excludeCurrent"
          checked={config.excludeCurrentWorkflow !== false}
          onCheckedChange={(checked) =>
            onChange({ ...config, excludeCurrentWorkflow: checked })
          }
        />
      </div>
    </div>
  );
}
