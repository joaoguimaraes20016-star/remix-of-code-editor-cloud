import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { AutomationTrigger, AutomationStep, ActionType } from "@/lib/automations/types";
import { TriggerInspector } from "./inspectors/TriggerInspector";
import { ActionInspector } from "./inspectors/ActionInspector";
import { ActionLibraryPanel } from "./ActionLibraryPanel";

// Actions that are fully implemented with UI + backend execution
// Based on actual case statements in automation-trigger/index.ts
const SUPPORTED_ACTIONS: ActionType[] = [
  // Messaging (all route through send_message backend)
  "send_message",
  "send_sms",
  "send_email",
  "send_whatsapp",
  "send_voicemail",
  "make_call",
  "notify_team",
  "send_review_request",
  "reply_in_comments",
  // Flow Control
  "time_delay",
  "wait_until",
  "business_hours",
  "condition",
  "split_test",
  "go_to",
  "set_variable",
  "run_workflow",
  "add_to_workflow",
  "remove_from_workflow",
  "remove_from_all_workflows",
  "stop_workflow",
  // CRM Actions
  "add_tag",
  "remove_tag",
  "add_task",
  "add_note",
  "assign_owner",
  "remove_owner",
  "create_contact",
  "find_contact",
  "update_contact",
  "delete_contact",
  "toggle_dnd",
  // Pipeline
  "update_stage",
  "create_deal",
  "update_deal",
  "close_deal",
  // Appointments
  "book_appointment",
  "update_appointment",
  "cancel_appointment",
  "log_call",
  // Payments
  "send_invoice",
  "charge_payment",
  "create_subscription",
  "cancel_subscription",
  // Data Transform
  "format_date",
  "format_number",
  "format_text",
  "math_operation",
  // Integrations
  "custom_webhook",
  "slack_message",
  "discord_message",
  "google_conversion",
  "tiktok_event",
  "meta_conversion",
  "google_sheets",
];

interface NodeInspectorProps {
  selectedNodeId: string | null;
  trigger: AutomationTrigger;
  step: AutomationStep | undefined;
  steps: AutomationStep[];
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
  steps,
  onTriggerChange,
  onStepUpdate,
  onStepDelete,
  onActionSelected,
  teamId,
}: NodeInspectorProps) {
  if (!selectedNodeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
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
          steps={steps}
          onUpdate={(updates) => onStepUpdate(step.id, updates)}
          teamId={teamId}
        />

        {/* Delete Button */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStepDelete(step.id)}
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Step
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground">Del</kbd>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
