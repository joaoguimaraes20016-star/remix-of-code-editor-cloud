import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StopCircle } from "lucide-react";

interface StopWorkflowConfig {
  reason?: string;
}

interface StopWorkflowFormProps {
  config: StopWorkflowConfig;
  onChange: (config: StopWorkflowConfig) => void;
}

export function StopWorkflowForm({ config, onChange }: StopWorkflowFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-start gap-3">
          <StopCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              This action will immediately stop the workflow.
            </p>
            <p className="text-xs text-white/50 mt-1">
              No further steps will be executed after this point.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Stop Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Why is the workflow being stopped? (for logging purposes)"
          value={config.reason || ""}
          onChange={(e) => onChange({ reason: e.target.value })}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          This will be logged in the automation run history
        </p>
      </div>
    </div>
  );
}
