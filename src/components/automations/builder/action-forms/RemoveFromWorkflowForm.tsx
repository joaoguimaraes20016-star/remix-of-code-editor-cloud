import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RemoveFromWorkflowConfig {
  workflowId: string;
}

interface RemoveFromWorkflowFormProps {
  config: RemoveFromWorkflowConfig;
  onChange: (config: RemoveFromWorkflowConfig) => void;
}

export function RemoveFromWorkflowForm({ config, onChange }: RemoveFromWorkflowFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workflowId">Workflow ID</Label>
        <Input
          id="workflowId"
          placeholder="Enter automation ID to remove contact from"
          value={config.workflowId || ""}
          onChange={(e) => onChange({ ...config, workflowId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          The contact's active enrollment will be exited and any pending scheduled jobs cancelled
        </p>
      </div>
    </div>
  );
}
