import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  GripVertical, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  MessageSquare, 
  Clock, 
  Tag, 
  ClipboardList, 
  UserCheck, 
  ArrowRightLeft,
  Bell,
  Webhook
} from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import {
  SendMessageForm,
  TimeDelayForm,
  AddTagForm,
  AddTaskForm,
  AssignOwnerForm,
  UpdateStageForm,
  NotifyTeamForm,
  WebhookForm,
} from "./action-forms";

interface StepCardProps {
  step: AutomationStep;
  onUpdate: (updates: Partial<AutomationStep>) => void;
  onDelete: () => void;
  teamId: string;
}

interface ActionMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  getSummary: (config: Record<string, any>) => string;
}

const ACTION_META: Record<ActionType, ActionMeta> = {
  send_message: {
    label: "Send Message",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "border-l-blue-500",
    getSummary: (config) => {
      const channel = config?.channel || "sms";
      const template = config?.template || "";
      const preview = template.length > 40 ? template.substring(0, 40) + "..." : template;
      return `${channel.toUpperCase()}: "${preview || "No message set"}"`;
    },
  },
  time_delay: {
    label: "Time Delay",
    icon: <Clock className="h-4 w-4" />,
    color: "border-l-orange-500",
    getSummary: (config) => {
      const duration = config?.duration || 0;
      const unit = config?.unit || "minutes";
      if (!duration) return "No delay set";
      return `Wait ${duration} ${duration === 1 ? unit.slice(0, -1) : unit}`;
    },
  },
  add_tag: {
    label: "Add Tag",
    icon: <Tag className="h-4 w-4" />,
    color: "border-l-green-500",
    getSummary: (config) => config?.tag ? `Tag: "${config.tag}"` : "No tag set",
  },
  add_task: {
    label: "Add Task",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "border-l-purple-500",
    getSummary: (config) => config?.title ? `"${config.title}"` : "No task set",
  },
  assign_owner: {
    label: "Assign Owner",
    icon: <UserCheck className="h-4 w-4" />,
    color: "border-l-cyan-500",
    getSummary: (config) => {
      const entity = config?.entity || "lead";
      return config?.ownerId ? `Assign ${entity}` : "No owner selected";
    },
  },
  update_stage: {
    label: "Update Stage",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "border-l-indigo-500",
    getSummary: (config) => {
      const entity = config?.entity || "lead";
      return config?.stageId ? `Move ${entity} to stage` : "No stage selected";
    },
  },
  notify_team: {
    label: "Notify Team",
    icon: <Bell className="h-4 w-4" />,
    color: "border-l-yellow-500",
    getSummary: (config) => {
      const message = config?.message || "";
      const preview = message.length > 40 ? message.substring(0, 40) + "..." : message;
      return preview || "No message set";
    },
  },
  custom_webhook: {
    label: "Webhook",
    icon: <Webhook className="h-4 w-4" />,
    color: "border-l-gray-500",
    getSummary: (config) => {
      const method = config?.method || "POST";
      const url = config?.url || "";
      if (!url) return "No URL set";
      const shortUrl = url.length > 30 ? url.substring(0, 30) + "..." : url;
      return `${method} → ${shortUrl}`;
    },
  },
  enqueue_dialer: {
    label: "Enqueue Dialer",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "border-l-red-500",
    getSummary: () => "Add to power dialer queue",
  },
  condition: {
    label: "If / Else",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "border-l-amber-500",
    getSummary: (config) => config?.conditions?.length ? `${config.conditions.length} condition(s)` : "No conditions set",
  },
};

export function StepCard({ step, onUpdate, onDelete, teamId }: StepCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const meta = ACTION_META[step.type] || ACTION_META.send_message;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleConfigChange = (newConfig: Record<string, any>) => {
    onUpdate({ config: newConfig });
  };

  const renderForm = () => {
    switch (step.type) {
      case "send_message":
        return (
          <SendMessageForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      case "time_delay":
        return (
          <TimeDelayForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      case "add_tag":
        return (
          <AddTagForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      case "add_task":
        return (
          <AddTaskForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      case "assign_owner":
        return (
          <AssignOwnerForm
            config={step.config as any}
            onChange={handleConfigChange}
            teamId={teamId}
          />
        );
      case "update_stage":
        return (
          <UpdateStageForm
            config={step.config as any}
            onChange={handleConfigChange}
            teamId={teamId}
          />
        );
      case "notify_team":
        return (
          <NotifyTeamForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      case "custom_webhook":
        return (
          <WebhookForm
            config={step.config as any}
            onChange={handleConfigChange}
          />
        );
      default:
        return (
          <p className="text-sm text-muted-foreground">
            Configuration for {step.type} is not yet available.
          </p>
        );
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-l-4 ${meta.color}`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                >
                  {meta.icon}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{meta.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {meta.getSummary(step.config)}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4">
              <div className="pl-7">{renderForm()}</div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
