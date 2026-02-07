import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Target } from "lucide-react";

interface GoalAchievedConfig {
  goalName: string;
  value?: number;
  stopWorkflow: boolean;
}

interface GoalAchievedFormProps {
  config: GoalAchievedConfig;
  onChange: (config: GoalAchievedConfig) => void;
}

export function GoalAchievedForm({ config, onChange }: GoalAchievedFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">
          Goal Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="goal-name"
            placeholder="e.g., Purchase Completed, Form Submitted"
            value={config.goalName || ""}
            onChange={(e) => onChange({ ...config, goalName: e.target.value })}
            className="pl-9"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The name of the goal to mark as achieved. This will be tracked in automation goals.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-value">Goal Value (Optional)</Label>
        <Input
          id="goal-value"
          type="number"
          placeholder="e.g., 100"
          value={config.value?.toString() || ""}
          onChange={(e) => {
            const value = e.target.value ? parseFloat(e.target.value) : undefined;
            onChange({ ...config, value });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Optional numeric value associated with this goal achievement (e.g., purchase amount).
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="stop-workflow" className="text-sm font-medium cursor-pointer">
            Stop Workflow When Goal Achieved
          </Label>
        </div>
        <Switch
          id="stop-workflow"
          checked={config.stopWorkflow ?? false}
          onCheckedChange={(checked) => onChange({ ...config, stopWorkflow: checked })}
        />
      </div>
      {config.stopWorkflow && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            When this goal is achieved, the contact will be automatically removed from this workflow.
          </p>
        </div>
      )}
    </div>
  );
}
