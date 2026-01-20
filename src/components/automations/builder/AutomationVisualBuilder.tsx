import { useCallback } from "react";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TriggerSelector } from "./TriggerSelector";
import { StepsList } from "./StepsList";
import { AddStepButton } from "./AddStepButton";
import { ArrowDown } from "lucide-react";

interface AutomationVisualBuilderProps {
  teamId: string;
  value: AutomationDefinition;
  onChange: (definition: AutomationDefinition) => void;
}

export function AutomationVisualBuilder({
  teamId,
  value,
  onChange,
}: AutomationVisualBuilderProps) {
  const handleTriggerChange = useCallback(
    (trigger: AutomationTrigger) => {
      onChange({
        ...value,
        trigger,
      });
    },
    [value, onChange]
  );

  const handleStepsReorder = useCallback(
    (steps: AutomationStep[]) => {
      onChange({
        ...value,
        steps,
      });
    },
    [value, onChange]
  );

  const handleStepUpdate = useCallback(
    (stepId: string, updates: Partial<AutomationStep>) => {
      const updatedSteps = value.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      );
      onChange({
        ...value,
        steps: updatedSteps,
      });
    },
    [value, onChange]
  );

  const handleStepDelete = useCallback(
    (stepId: string) => {
      const updatedSteps = value.steps
        .filter((step) => step.id !== stepId)
        .map((step, idx) => ({ ...step, order: idx + 1 }));
      onChange({
        ...value,
        steps: updatedSteps,
      });
    },
    [value, onChange]
  );

  const handleAddStep = useCallback(
    (type: ActionType) => {
      const newStep: AutomationStep = {
        id: `step-${Date.now()}`,
        order: value.steps.length + 1,
        type,
        config: getDefaultConfigForType(type),
      };
      onChange({
        ...value,
        steps: [...value.steps, newStep],
      });
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Trigger Section */}
      <TriggerSelector
        trigger={value.trigger}
        onTriggerChange={handleTriggerChange}
      />

      {/* Flow Arrow */}
      {value.steps.length > 0 && (
        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Steps Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>THEN DO THIS</span>
          {value.steps.length > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {value.steps.length} step{value.steps.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <StepsList
          steps={value.steps}
          onReorder={handleStepsReorder}
          onStepUpdate={handleStepUpdate}
          onStepDelete={handleStepDelete}
          teamId={teamId}
        />

        <AddStepButton onAddStep={handleAddStep} />
      </div>
    </div>
  );
}

function getDefaultConfigForType(type: ActionType): Record<string, any> {
  switch (type) {
    case "send_message":
      return { channel: "sms", template: "" };
    case "time_delay":
      return { duration: 5, unit: "minutes" };
    case "add_tag":
      return { tag: "" };
    case "add_task":
      return { title: "", assignTo: "setter" };
    case "assign_owner":
      return { entity: "lead", ownerId: "" };
    case "update_stage":
      return { entity: "lead", stageId: "" };
    case "notify_team":
      return { message: "", notifyAdmin: true };
    case "custom_webhook":
      return { url: "", method: "POST", payload: "" };
    case "enqueue_dialer":
      return {};
    default:
      return {};
  }
}
