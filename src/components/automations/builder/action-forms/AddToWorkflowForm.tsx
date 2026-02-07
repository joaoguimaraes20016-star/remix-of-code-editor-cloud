import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddToWorkflowConfig {
  workflowId: string;
}

interface AddToWorkflowFormProps {
  config: AddToWorkflowConfig;
  onChange: (config: AddToWorkflowConfig) => void;
}

export function AddToWorkflowForm({ config, onChange }: AddToWorkflowFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workflowId">Workflow ID</Label>
        <Input
          id="workflowId"
          placeholder="Enter automation ID to enroll contact in"
          value={config.workflowId || ""}
          onChange={(e) => onChange({ ...config, workflowId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          The contact will be enrolled in the specified automation
        </p>
      </div>
    </div>
  );
}
