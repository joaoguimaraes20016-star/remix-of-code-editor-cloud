import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { AutomationTrigger, AutomationStep, ActionType } from "@/lib/automations/types";
import { TriggerInspector } from "./inspectors/TriggerInspector";
import { ActionInspector } from "./inspectors/ActionInspector";
import { ActionLibraryPanel } from "./ActionLibraryPanel";

// Actions that are fully implemented with UI + backend execution
const SUPPORTED_ACTIONS: ActionType[] = [
  // Messaging (all route through send_message backend)
  "send_message",
  "send_sms",
  "send_email",
  "send_whatsapp",
  "make_call",
  "enqueue_dialer",
  "notify_team",
  // Flow Control
  "time_delay",
  "wait_until",
  "business_hours",
  "condition",
  "split_test",
  "go_to",
  "run_workflow",
  "stop_workflow",
  // CRM Actions
  "add_tag",
  "remove_tag",
  "add_task",
  "add_note",
  "assign_owner",
  "create_contact",
  "update_contact",
  // Pipeline
  "update_stage",
  "create_deal",
  "close_deal",
  // Integrations
  "custom_webhook",
  "slack_message",
];

interface NodeInspectorProps {
  selectedNodeId: string | null;
  trigger: AutomationTrigger;
  step: AutomationStep | undefined;
  onTriggerChange: (trigger: AutomationTrigger) => void;
  onStepUpdate: (stepId: string, updates: Partial<AutomationStep>) => void;
  onStepDelete: (stepId: string) => void;
  onActionSelected?: (type: ActionType) => void;
  teamId: string;
}

export function NodeInspector({
  selectedNodeId,
  trigger,
  step,
  onTriggerChange,
  onStepUpdate,
  onStepDelete,
  onActionSelected,
  teamId,
}: NodeInspectorProps) {
  if (!selectedNodeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm">
        <p>Select a node to edit</p>
      </div>
    );
  }

  // Check if in "add step" mode
  if (selectedNodeId.startsWith("add-step")) {
    return (
      <ActionLibraryPanel
        onSelect={(type) => onActionSelected?.(type)}
        supportedActions={SUPPORTED_ACTIONS}
      />
    );
  }

  if (selectedNodeId === "trigger") {
    return (
      <TriggerInspector
        trigger={trigger}
        onChange={onTriggerChange}
      />
    );
  }

  if (step) {
    return (
      <div className="space-y-4">
        <ActionInspector
          step={step}
          onUpdate={(updates) => onStepUpdate(step.id, updates)}
          teamId={teamId}
        />

        {/* Delete Button */}
        <div className="pt-4 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepDelete(step.id)}
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Step
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
