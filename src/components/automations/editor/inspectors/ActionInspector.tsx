import type { AutomationStep } from "@/lib/automations/types";
import {
  SendMessageForm,
  TimeDelayForm,
  AddTagForm,
  AddTaskForm,
  AssignOwnerForm,
  UpdateStageForm,
  NotifyTeamForm,
  WebhookForm,
} from "@/components/automations/builder/action-forms";

interface ActionInspectorProps {
  step: AutomationStep;
  onUpdate: (updates: Partial<AutomationStep>) => void;
  teamId: string;
}

export function ActionInspector({ step, onUpdate, teamId }: ActionInspectorProps) {
  const handleConfigChange = (config: Record<string, any>) => {
    onUpdate({ config });
  };

  const formProps = { config: step.config as any, onChange: handleConfigChange };

  return (
    <div className="[&_label]:text-white/70 [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/30 [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/30 [&_button[role=combobox]]:bg-white/5 [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-white">
      {step.type === "send_message" && <SendMessageForm {...formProps} />}
      {step.type === "time_delay" && <TimeDelayForm {...formProps} />}
      {step.type === "add_tag" && <AddTagForm {...formProps} />}
      {step.type === "add_task" && <AddTaskForm {...formProps} />}
      {step.type === "assign_owner" && <AssignOwnerForm {...formProps} teamId={teamId} />}
      {step.type === "update_stage" && <UpdateStageForm {...formProps} teamId={teamId} />}
      {step.type === "notify_team" && <NotifyTeamForm {...formProps} />}
      {step.type === "custom_webhook" && <WebhookForm {...formProps} />}
      {step.type === "condition" && <p className="text-white/50 text-sm">Condition configuration coming soon</p>}
    </div>
  );
}
