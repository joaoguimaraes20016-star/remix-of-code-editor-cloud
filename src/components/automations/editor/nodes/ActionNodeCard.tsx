import { motion } from "framer-motion";
import { 
  MessageSquare, Clock, Tag, ClipboardList, UserCheck, ArrowRightLeft, 
  Bell, Webhook, ChevronRight, GitBranch, UserPlus, UserCog, StickyNote,
  Briefcase, CheckCircle, CalendarClock, Building2, Split, CornerDownRight,
  PlayCircle, StopCircle, Phone
} from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ActionNodeCardProps {
  step: AutomationStep;
  isSelected: boolean;
  onSelect: () => void;
}

interface ActionDisplay {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ACTION_DISPLAY: Record<ActionType, ActionDisplay> = {
  // Messaging
  send_message: { 
    label: "Send Message", 
    icon: <MessageSquare className="h-4 w-4" />, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20" 
  },
  notify_team: { 
    label: "Notify Team", 
    icon: <Bell className="h-4 w-4" />, 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-500/20" 
  },
  // CRM Actions
  add_tag: { 
    label: "Add Tag", 
    icon: <Tag className="h-4 w-4" />, 
    color: "text-green-400", 
    bgColor: "bg-green-500/20" 
  },
  remove_tag: { 
    label: "Remove Tag", 
    icon: <Tag className="h-4 w-4" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  create_contact: { 
    label: "Create Contact", 
    icon: <UserPlus className="h-4 w-4" />, 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/20" 
  },
  update_contact: { 
    label: "Update Contact", 
    icon: <UserCog className="h-4 w-4" />, 
    color: "text-sky-400", 
    bgColor: "bg-sky-500/20" 
  },
  add_task: { 
    label: "Create Task", 
    icon: <ClipboardList className="h-4 w-4" />, 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/20" 
  },
  add_note: { 
    label: "Add Note", 
    icon: <StickyNote className="h-4 w-4" />, 
    color: "text-amber-400", 
    bgColor: "bg-amber-500/20" 
  },
  assign_owner: { 
    label: "Assign Owner", 
    icon: <UserCheck className="h-4 w-4" />, 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/20" 
  },
  // Pipeline Actions
  update_stage: { 
    label: "Update Stage", 
    icon: <ArrowRightLeft className="h-4 w-4" />, 
    color: "text-indigo-400", 
    bgColor: "bg-indigo-500/20" 
  },
  create_deal: { 
    label: "Create Deal", 
    icon: <Briefcase className="h-4 w-4" />, 
    color: "text-violet-400", 
    bgColor: "bg-violet-500/20" 
  },
  close_deal: { 
    label: "Close Deal", 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: "text-rose-400", 
    bgColor: "bg-rose-500/20" 
  },
  // Flow Control
  time_delay: { 
    label: "Wait", 
    icon: <Clock className="h-4 w-4" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  wait_until: { 
    label: "Wait Until", 
    icon: <CalendarClock className="h-4 w-4" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  business_hours: { 
    label: "Business Hours", 
    icon: <Building2 className="h-4 w-4" />, 
    color: "text-teal-400", 
    bgColor: "bg-teal-500/20" 
  },
  condition: { 
    label: "If / Else", 
    icon: <GitBranch className="h-4 w-4" />, 
    color: "text-amber-400", 
    bgColor: "bg-amber-500/20" 
  },
  split_test: { 
    label: "A/B Split", 
    icon: <Split className="h-4 w-4" />, 
    color: "text-pink-400", 
    bgColor: "bg-pink-500/20" 
  },
  go_to: { 
    label: "Go To", 
    icon: <CornerDownRight className="h-4 w-4" />, 
    color: "text-slate-400", 
    bgColor: "bg-slate-500/20" 
  },
  run_workflow: { 
    label: "Run Workflow", 
    icon: <PlayCircle className="h-4 w-4" />, 
    color: "text-fuchsia-400", 
    bgColor: "bg-fuchsia-500/20" 
  },
  stop_workflow: { 
    label: "Stop", 
    icon: <StopCircle className="h-4 w-4" />, 
    color: "text-red-500", 
    bgColor: "bg-red-500/20" 
  },
  // Integrations
  custom_webhook: { 
    label: "Webhook", 
    icon: <Webhook className="h-4 w-4" />, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20" 
  },
  enqueue_dialer: { 
    label: "Power Dialer", 
    icon: <Phone className="h-4 w-4" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
};

// Get a preview text based on the step configuration
function getStepPreview(step: AutomationStep): string {
  switch (step.type) {
    case 'send_message':
      return step.config?.channel 
        ? `via ${step.config.channel.toUpperCase()}` 
        : 'Click to configure';
    case 'time_delay':
      if (step.config?.delayValue && step.config?.delayType) {
        return `Wait ${step.config.delayValue} ${step.config.delayType}`;
      }
      return 'Click to configure';
    case 'add_tag':
    case 'remove_tag':
      return step.config?.tag || 'Click to configure';
    case 'condition':
      const count = step.conditions?.length || step.conditionGroups?.length || 0;
      return count > 0 ? `${count} condition${count !== 1 ? 's' : ''}` : 'Click to configure';
    default:
      return 'Click to configure';
  }
}

export function ActionNodeCard({ step, isSelected, onSelect }: ActionNodeCardProps) {
  const display = ACTION_DISPLAY[step.type] || ACTION_DISPLAY.send_message;
  const preview = getStepPreview(step);

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-72 rounded-xl border transition-all",
        "bg-gradient-to-br from-[#1a1a2e] to-[#16162a]",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className={cn("p-2 rounded-lg", display.bgColor)}>
          <span className={display.color}>{display.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium">{display.label}</div>
          <div className="text-xs text-white/50 truncate">{preview}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </div>
    </motion.button>
  );
}
