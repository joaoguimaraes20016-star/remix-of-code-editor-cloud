import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CornerDownRight } from "lucide-react";

interface GoToConfig {
  targetStepId: string;
}

interface GoToFormProps {
  config: GoToConfig;
  onChange: (config: GoToConfig) => void;
  availableSteps?: { id: string; label: string }[];
}

export function GoToForm({ config, onChange, availableSteps = [] }: GoToFormProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
        <div className="flex items-start gap-3">
          <CornerDownRight className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              Jump to another step in this workflow.
            </p>
            <p className="text-xs text-white/50 mt-1">
              Be careful to avoid infinite loops!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Jump To Step</Label>
        <Select
          value={config.targetStepId || ""}
          onValueChange={(value) => onChange({ targetStepId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a step" />
          </SelectTrigger>
          <SelectContent>
            {availableSteps.length > 0 ? (
              availableSteps.map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {step.label}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No other steps available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-xs text-yellow-400">
          ⚠️ Warning: Jumping backwards can create loops. Make sure to include conditions to prevent infinite execution.
        </p>
      </div>
    </div>
  );
}
