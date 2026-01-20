import { useState } from "react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  Clock,
  Tag,
  ClipboardList,
  UserCheck,
  ArrowRightLeft,
  Bell,
  Webhook,
  GitBranch,
} from "lucide-react";
import type { ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface AddNodeButtonProps {
  onAdd: (type: ActionType) => void;
  className?: string;
  size?: "default" | "sm";
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: "action" | "control" | "integration";
}

const ACTION_OPTIONS: ActionOption[] = [
  // Actions
  {
    type: "send_message",
    label: "Send Message",
    description: "SMS, Email, or In-App",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-blue-400",
    category: "action",
  },
  {
    type: "add_tag",
    label: "Add Tag",
    description: "Tag the lead",
    icon: <Tag className="h-4 w-4" />,
    color: "text-green-400",
    category: "action",
  },
  {
    type: "add_task",
    label: "Create Task",
    description: "Assign a follow-up task",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "text-purple-400",
    category: "action",
  },
  {
    type: "assign_owner",
    label: "Assign Owner",
    description: "Set lead/deal owner",
    icon: <UserCheck className="h-4 w-4" />,
    color: "text-cyan-400",
    category: "action",
  },
  {
    type: "update_stage",
    label: "Update Stage",
    description: "Move in pipeline",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "text-indigo-400",
    category: "action",
  },
  {
    type: "notify_team",
    label: "Notify Team",
    description: "Send team notification",
    icon: <Bell className="h-4 w-4" />,
    color: "text-yellow-400",
    category: "action",
  },
  // Control
  {
    type: "time_delay",
    label: "Wait",
    description: "Pause before next step",
    icon: <Clock className="h-4 w-4" />,
    color: "text-orange-400",
    category: "control",
  },
  // Integrations
  {
    type: "custom_webhook",
    label: "Webhook",
    description: "Call external API",
    icon: <Webhook className="h-4 w-4" />,
    color: "text-gray-400",
    category: "integration",
  },
];

export function AddNodeButton({ onAdd, className, size = "default" }: AddNodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: ActionType) => {
    onAdd(type);
    setIsOpen(false);
  };

  const actionsByCategory = {
    action: ACTION_OPTIONS.filter((a) => a.category === "action"),
    control: ACTION_OPTIONS.filter((a) => a.category === "control"),
    integration: ACTION_OPTIONS.filter((a) => a.category === "integration"),
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center justify-center rounded-full transition-all",
            "bg-white/5 border border-dashed border-white/20 hover:border-primary hover:bg-primary/10",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            className
          )}
        >
          <Plus className={cn("text-white/60", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 bg-[#1a1a2e] border-white/10"
        align="center"
      >
        <div className="p-3 border-b border-white/10">
          <h4 className="text-sm font-medium text-white">Add Step</h4>
          <p className="text-xs text-white/50">Choose an action to add to your workflow</p>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto">
          {/* Actions */}
          <div className="mb-2">
            <div className="px-2 py-1 text-xs text-white/40 uppercase tracking-wide">Actions</div>
            {actionsByCategory.action.map((action) => (
              <button
                key={action.type}
                onClick={() => handleSelect(action.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className={cn("p-1.5 rounded-md bg-white/5", action.color)}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm text-white">{action.label}</div>
                  <div className="text-xs text-white/50">{action.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Control */}
          <div className="mb-2">
            <div className="px-2 py-1 text-xs text-white/40 uppercase tracking-wide">Control</div>
            {actionsByCategory.control.map((action) => (
              <button
                key={action.type}
                onClick={() => handleSelect(action.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className={cn("p-1.5 rounded-md bg-white/5", action.color)}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm text-white">{action.label}</div>
                  <div className="text-xs text-white/50">{action.description}</div>
                </div>
              </button>
            ))}

            {/* Condition (special) */}
            <button
              onClick={() => handleSelect("condition" as ActionType)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-white/5 text-amber-400">
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-sm text-white">If / Else</div>
                <div className="text-xs text-white/50">Branch based on conditions</div>
              </div>
            </button>
          </div>

          {/* Integrations */}
          <div>
            <div className="px-2 py-1 text-xs text-white/40 uppercase tracking-wide">Integrations</div>
            {actionsByCategory.integration.map((action) => (
              <button
                key={action.type}
                onClick={() => handleSelect(action.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className={cn("p-1.5 rounded-md bg-white/5", action.color)}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="text-sm text-white">{action.label}</div>
                  <div className="text-xs text-white/50">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
