import type { AutomationStep } from "@/lib/automations/types";
import {
  SendMessageForm,
  TimeDelayForm,
  AddTagForm,
  RemoveTagForm,
  AddTaskForm,
  AddNoteForm,
  AssignOwnerForm,
  UpdateStageForm,
  NotifyTeamForm,
  WebhookForm,
  SlackMessageForm,
  DiscordMessageForm,
  GoogleAdsConversionForm,
  TikTokEventForm,
  MetaConversionForm,
  CreateContactForm,
  UpdateContactForm,
  CreateDealForm,
  CloseDealForm,
  WaitUntilForm,
  BusinessHoursForm,
  ConditionForm,
  SplitTestForm,
  GoToForm,
  RunWorkflowForm,
  StopWorkflowForm,
  GoogleSheetsForm,
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
    <div className="space-y-4">
      {/* Messaging */}
      {step.type === "send_message" && <SendMessageForm {...formProps} teamId={teamId} />}
      {step.type === "notify_team" && <NotifyTeamForm {...formProps} />}
      
      {/* CRM Actions */}
      {step.type === "add_tag" && <AddTagForm {...formProps} />}
      {step.type === "remove_tag" && <RemoveTagForm {...formProps} />}
      {step.type === "create_contact" && <CreateContactForm {...formProps} />}
      {step.type === "update_contact" && <UpdateContactForm {...formProps} />}
      {step.type === "add_task" && <AddTaskForm {...formProps} />}
      {step.type === "add_note" && <AddNoteForm {...formProps} />}
      {step.type === "assign_owner" && <AssignOwnerForm {...formProps} teamId={teamId} />}
      
      {/* Pipeline Actions */}
      {step.type === "update_stage" && <UpdateStageForm {...formProps} teamId={teamId} />}
      {step.type === "create_deal" && <CreateDealForm {...formProps} />}
      {step.type === "close_deal" && <CloseDealForm {...formProps} />}
      
      {/* Flow Control */}
      {step.type === "time_delay" && <TimeDelayForm {...formProps} />}
      {step.type === "wait_until" && <WaitUntilForm {...formProps} />}
      {step.type === "business_hours" && <BusinessHoursForm {...formProps} />}
      {step.type === "condition" && <ConditionForm {...formProps} />}
      {step.type === "split_test" && <SplitTestForm {...formProps} />}
      {step.type === "go_to" && <GoToForm {...formProps} />}
      {step.type === "run_workflow" && <RunWorkflowForm {...formProps} teamId={teamId} />}
      {step.type === "stop_workflow" && <StopWorkflowForm {...formProps} />}
      
      {/* Integrations */}
      {step.type === "custom_webhook" && <WebhookForm {...formProps} />}
      {step.type === "slack_message" && <SlackMessageForm {...formProps} />}
      {step.type === "discord_message" && <DiscordMessageForm {...formProps} />}
      {step.type === "google_conversion" && <GoogleAdsConversionForm {...formProps} />}
      {step.type === "tiktok_event" && <TikTokEventForm {...formProps} />}
      {step.type === "meta_conversion" && <MetaConversionForm {...formProps} />}
      {step.type === "google_sheets" && <GoogleSheetsForm {...formProps} />}
      {step.type === "enqueue_dialer" && (
        <p className="text-muted-foreground text-sm">Power dialer configuration coming soon</p>
      )}
    </div>
  );
}
