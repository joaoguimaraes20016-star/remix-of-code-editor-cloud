import type { AutomationStep } from "@/lib/automations/types";
import { ACTION_META } from "@/lib/automations/types";
import { Settings2, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  // Messaging
  SendEmailForm,
  SendSmsForm,
  SendWhatsAppForm,
  SendVoicemailForm,
  MakeCallForm,
  SendReviewRequestForm,
  ReplyInCommentsForm,
  // Appointments
  BookAppointmentForm,
  UpdateAppointmentForm,
  CancelAppointmentForm,
  CreateBookingLinkForm,
  LogCallForm,
  // Payments
  SendInvoiceForm,
  ChargePaymentForm,
  CreateSubscriptionForm,
  CancelSubscriptionForm,
  // New CRM
  FindContactForm,
  DeleteContactForm,
  RemoveOwnerForm,
  ToggleDndForm,
  CopyContactForm,
  // Pipeline
  UpdateDealForm,
  FindOpportunityForm,
  RemoveOpportunityForm,
  // Flow Control & Variables
  SetVariableForm,
  AddToWorkflowForm,
  RemoveFromWorkflowForm,
  RemoveFromAllWorkflowsForm,
  GoalAchievedForm,
  // Data Transform
  FormatDateForm,
  FormatNumberForm,
  FormatTextForm,
  MathOperationForm,
} from "@/components/automations/builder/action-forms";

// Set of action types that have a dedicated form
const SUPPORTED_ACTION_TYPES = new Set([
  "send_message", "notify_team", "add_tag", "remove_tag", "create_contact",
  "update_contact", "add_task", "add_note", "assign_owner", "update_stage",
  "create_deal", "close_deal", "time_delay", "wait_until", "business_hours",
  "condition", "split_test", "go_to", "run_workflow", "stop_workflow",
  "custom_webhook", "slack_message", "discord_message", "google_conversion",
  "tiktok_event", "meta_conversion", "google_sheets", "enqueue_dialer",
  // Messaging
  "send_email", "send_sms", "send_whatsapp", "send_voicemail", "make_call",
  "send_review_request", "reply_in_comments",
  // CRM
  "find_contact", "delete_contact", "remove_owner", "toggle_dnd", "copy_contact",
  // Pipeline
  "update_deal", "find_opportunity", "remove_opportunity",
  // Flow Control & Variables
  "set_variable", "add_to_workflow", "remove_from_workflow", "remove_from_all_workflows",
  // Appointments
  "book_appointment", "update_appointment", "cancel_appointment",
  "create_booking_link", "log_call",
  // Payments
  "send_invoice", "charge_payment", "create_subscription", "cancel_subscription",
  // Data Transform
  "format_date", "format_number", "format_text", "math_operation",
]);

interface ActionInspectorProps {
  step: AutomationStep;
  steps: AutomationStep[];
  onUpdate: (updates: Partial<AutomationStep>) => void;
  teamId: string;
}

export function ActionInspector({ step, steps, onUpdate, teamId }: ActionInspectorProps) {
  const handleConfigChange = (config: Record<string, any>) => {
    if (step.type === 'condition') {
      // Map config fields to step-level properties for backend compatibility.
      // The backend reads step.conditions and step.conditionLogic (not step.config.*).
      onUpdate({
        conditions: config.conditions,
        conditionLogic: config.conditionLogic,
        config,
      });
    } else {
      onUpdate({ config });
    }
  };

  const formProps = { config: step.config as any, onChange: handleConfigChange };

  // Check if this action type has a form
  const hasForm = SUPPORTED_ACTION_TYPES.has(step.type);
  const meta = ACTION_META[step.type as keyof typeof ACTION_META];

  const isEnabled = step.enabled !== false;

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle - Like GHL's action enable toggle */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Power className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
          <Label htmlFor="step-enabled" className="text-sm font-medium cursor-pointer">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
        <Switch
          id="step-enabled"
          checked={isEnabled}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
        />
      </div>

      {!isEnabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This step is disabled and will be skipped during execution. Press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-background rounded border">D</kbd> to toggle.
          </p>
        </div>
      )}

      {/* Messaging */}
      {step.type === "send_message" && <SendMessageForm {...formProps} teamId={teamId} />}
      {step.type === "send_email" && <SendEmailForm {...formProps} />}
      {step.type === "send_sms" && <SendSmsForm {...formProps} />}
      {step.type === "send_whatsapp" && <SendWhatsAppForm {...formProps} />}
      {step.type === "send_voicemail" && <SendVoicemailForm {...formProps} />}
      {step.type === "make_call" && <MakeCallForm {...formProps} />}
      {step.type === "send_review_request" && <SendReviewRequestForm {...formProps} />}
      {step.type === "reply_in_comments" && <ReplyInCommentsForm {...formProps} />}
      {step.type === "notify_team" && <NotifyTeamForm {...formProps} />}
      
      {/* CRM Actions */}
      {step.type === "add_tag" && <AddTagForm {...formProps} />}
      {step.type === "remove_tag" && <RemoveTagForm {...formProps} />}
      {step.type === "create_contact" && <CreateContactForm {...formProps} />}
      {step.type === "update_contact" && <UpdateContactForm {...formProps} />}
      {step.type === "add_task" && <AddTaskForm {...formProps} />}
      {step.type === "add_note" && <AddNoteForm {...formProps} />}
      {step.type === "assign_owner" && <AssignOwnerForm {...formProps} teamId={teamId} />}
      {step.type === "find_contact" && <FindContactForm {...formProps} />}
      {step.type === "delete_contact" && <DeleteContactForm {...formProps} />}
      {step.type === "remove_owner" && <RemoveOwnerForm {...formProps} />}
      {step.type === "toggle_dnd" && <ToggleDndForm {...formProps} />}
      {step.type === "copy_contact" && <CopyContactForm {...formProps} />}
      
      {/* Pipeline Actions */}
      {step.type === "update_stage" && <UpdateStageForm {...formProps} teamId={teamId} />}
      {step.type === "create_deal" && <CreateDealForm {...formProps} />}
      {step.type === "update_deal" && <UpdateDealForm {...formProps} />}
      {step.type === "close_deal" && <CloseDealForm {...formProps} />}
      {step.type === "find_opportunity" && <FindOpportunityForm {...formProps} />}
      {step.type === "remove_opportunity" && <RemoveOpportunityForm {...formProps} />}
      
      {/* Appointments */}
      {step.type === "book_appointment" && <BookAppointmentForm {...formProps} />}
      {step.type === "update_appointment" && <UpdateAppointmentForm {...formProps} />}
      {step.type === "cancel_appointment" && <CancelAppointmentForm {...formProps} />}
      {step.type === "create_booking_link" && <CreateBookingLinkForm {...formProps} />}
      {step.type === "log_call" && <LogCallForm {...formProps} />}
      
      {/* Payments */}
      {step.type === "send_invoice" && <SendInvoiceForm {...formProps} />}
      {step.type === "charge_payment" && <ChargePaymentForm {...formProps} />}
      {step.type === "create_subscription" && <CreateSubscriptionForm {...formProps} />}
      {step.type === "cancel_subscription" && <CancelSubscriptionForm {...formProps} />}
      
      {/* Flow Control */}
      {step.type === "time_delay" && <TimeDelayForm {...formProps} />}
      {step.type === "wait_until" && <WaitUntilForm {...formProps} />}
      {step.type === "business_hours" && <BusinessHoursForm {...formProps} />}
      {step.type === "condition" && <ConditionForm {...formProps} />}
      {step.type === "split_test" && <SplitTestForm {...formProps} />}
      {step.type === "go_to" && (
        <GoToForm
          {...formProps}
          availableSteps={steps.map(s => ({ id: s.id, label: s.name || `Step ${s.order}` }))}
        />
      )}
      {step.type === "set_variable" && <SetVariableForm {...formProps} />}
      {step.type === "run_workflow" && <RunWorkflowForm {...formProps} teamId={teamId} />}
      {step.type === "add_to_workflow" && <AddToWorkflowForm {...formProps} />}
      {step.type === "remove_from_workflow" && <RemoveFromWorkflowForm {...formProps} />}
      {step.type === "remove_from_all_workflows" && <RemoveFromAllWorkflowsForm {...formProps} />}
      {step.type === "stop_workflow" && <StopWorkflowForm {...formProps} />}
      {step.type === "goal_achieved" && <GoalAchievedForm {...formProps} />}
      
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

      {/* Data Transform */}
      {step.type === "format_date" && <FormatDateForm {...formProps} />}
      {step.type === "format_number" && <FormatNumberForm {...formProps} />}
      {step.type === "format_text" && <FormatTextForm {...formProps} />}
      {step.type === "math_operation" && <MathOperationForm {...formProps} />}

      {/* Fallback for action types without a dedicated form */}
      {!hasForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted/50 p-3 mb-3">
            <Settings2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {meta?.label || step.type.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Configuration for this action is coming soon
          </p>
        </div>
      )}
    </div>
  );
}
