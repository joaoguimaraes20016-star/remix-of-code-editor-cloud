import { useState } from "react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Clock,
  Tag,
  ClipboardList,
  UserCheck,
  ArrowRightLeft,
  Bell,
  Webhook,
  Trash2,
  ChevronDown,
} from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";
import {
  SendMessageForm,
  TimeDelayForm,
  AddTagForm,
  AddTaskForm,
  AssignOwnerForm,
  UpdateStageForm,
  NotifyTeamForm,
  WebhookForm,
} from "../builder/action-forms";

interface ActionNodeProps {
  step: AutomationStep;
  onUpdate: (updates: Partial<AutomationStep>) => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
  teamId: string;
}

interface ActionMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  getSummary: (config: Record<string, any>) => string;
}

const ACTION_META: Partial<Record<ActionType, ActionMeta>> = {
  send_message: {
    label: "Send Message",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    getSummary: (config) => {
      const channel = config?.channel || "sms";
      const template = config?.template || "";
      const preview = template.length > 30 ? template.substring(0, 30) + "..." : template;
      return `${channel.toUpperCase()}: "${preview || "No message"}"`;
    },
  },
  time_delay: {
    label: "Wait",
    icon: <Clock className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    getSummary: (config) => {
      const duration = config?.duration || 0;
      const unit = config?.unit || "minutes";
      if (!duration) return "Configure delay";
      return `${duration} ${duration === 1 ? unit.slice(0, -1) : unit}`;
    },
  },
  add_tag: {
    label: "Add Tag",
    icon: <Tag className="h-4 w-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    getSummary: (config) => config?.tag ? `"${config.tag}"` : "Select tag",
  },
  add_task: {
    label: "Create Task",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    getSummary: (config) => config?.title ? `"${config.title}"` : "Configure task",
  },
  assign_owner: {
    label: "Assign Owner",
    icon: <UserCheck className="h-4 w-4" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    getSummary: (config) => config?.ownerId ? "Owner assigned" : "Select owner",
  },
  update_stage: {
    label: "Update Stage",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    getSummary: (config) => config?.stageId ? "Stage set" : "Select stage",
  },
  notify_team: {
    label: "Notify Team",
    icon: <Bell className="h-4 w-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    getSummary: (config) => {
      const message = config?.message || "";
      return message.length > 30 ? message.substring(0, 30) + "..." : message || "Set notification";
    },
  },
  custom_webhook: {
    label: "Webhook",
    icon: <Webhook className="h-4 w-4" />,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    getSummary: (config) => {
      const url = config?.url || "";
      if (!url) return "Configure webhook";
      return url.length > 25 ? url.substring(0, 25) + "..." : url;
    },
  },
  enqueue_dialer: {
    label: "Power Dialer",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    getSummary: () => "Add to dialer queue",
  },
  condition: {
    label: "If / Else",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    getSummary: (config) => config?.conditions?.length ? `${config.conditions.length} condition(s)` : "Branch logic",
  },
};

export function ActionNode({
  step,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  teamId,
}: ActionNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const meta = ACTION_META[step.type] || ACTION_META.send_message;

  const handleConfigChange = (newConfig: Record<string, any>) => {
    onUpdate({ config: newConfig });
  };

  const renderForm = () => {
    const formProps = {
      config: step.config as any,
      onChange: handleConfigChange,
    };

    switch (step.type) {
      case "send_message":
        return <SendMessageForm {...formProps} />;
      case "time_delay":
        return <TimeDelayForm {...formProps} />;
      case "add_tag":
        return <AddTagForm {...formProps} />;
      case "add_task":
        return <AddTaskForm {...formProps} />;
      case "assign_owner":
        return <AssignOwnerForm {...formProps} teamId={teamId} />;
      case "update_stage":
        return <UpdateStageForm {...formProps} teamId={teamId} />;
      case "notify_team":
        return <NotifyTeamForm {...formProps} />;
      case "custom_webhook":
        return <WebhookForm {...formProps} />;
      default:
        return <p className="text-sm text-white/50">No configuration available.</p>;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          onClick={onSelect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative w-80 rounded-xl border transition-all duration-200",
            "bg-gradient-to-br from-[#1a1a2e] to-[#16162a]",
            isSelected
              ? "border-primary ring-2 ring-primary/30"
              : "border-white/10 hover:border-white/20"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <div className={cn("p-2 rounded-lg", meta.bgColor)}>
              <span className={meta.color}>{meta.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-white font-medium flex items-center gap-2">
                {meta.label}
                <ChevronDown className="h-4 w-4 text-white/40" />
              </div>
              <div className="text-sm text-white/50 truncate">
                {meta.getSummary(step.config)}
              </div>
            </div>
          </div>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-4 bg-[#1a1a2e] border-white/10"
        align="center"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={meta.color}>{meta.icon}</span>
              <span className="font-medium text-white">{meta.label}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Dark mode styled forms */}
          <div className="[&_label]:text-white/70 [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/30 [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/30 [&_button[role=combobox]]:bg-white/5 [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-white">
            {renderForm()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
