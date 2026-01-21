import { motion } from "framer-motion";
import { 
  MessageSquare, Clock, Tag, ClipboardList, UserCheck, ArrowRightLeft, 
  Bell, Webhook, Check, AlertCircle, GitBranch, UserPlus, UserCog, StickyNote,
  Briefcase, CheckCircle, CalendarClock, Building2, Split, CornerDownRight,
  PlayCircle, StopCircle, Phone
} from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ActionNodeCardProps {
  step: AutomationStep;
  stepNumber: number;
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

// Check if step is properly configured
function isStepConfigured(step: AutomationStep): boolean {
  switch (step.type) {
    case 'send_message':
      return !!(step.config?.template && step.config?.channel);
    case 'time_delay':
      return !!(step.config?.delayValue && step.config?.delayType);
    case 'add_tag':
    case 'remove_tag':
      return !!step.config?.tag;
    case 'add_task':
      return !!step.config?.title;
    case 'notify_team':
      return !!step.config?.message;
    case 'condition':
      return (step.conditions?.length || 0) > 0 || (step.conditionGroups?.length || 0) > 0;
    case 'custom_webhook':
      return !!step.config?.url;
    default:
      return true;
  }
}

// Get a preview text based on the step configuration
function getStepPreview(step: AutomationStep): string {
  switch (step.type) {
    case 'send_message':
      if (step.config?.template) {
        const template = step.config.template;
        return template.length > 40 ? `"${template.substring(0, 40)}..."` : `"${template}"`;
      }
      return step.config?.channel ? `via ${step.config.channel.toUpperCase()}` : 'Click to configure';
    case 'time_delay':
      if (step.config?.delayValue && step.config?.delayType) {
        return `Wait ${step.config.delayValue} ${step.config.delayType}`;
      }
      return 'Set delay duration';
    case 'add_tag':
      return step.config?.tag ? `"${step.config.tag}"` : 'Choose a tag';
    case 'remove_tag':
      return step.config?.tag ? `Remove "${step.config.tag}"` : 'Choose a tag';
    case 'add_task':
      return step.config?.title ? `"${step.config.title}"` : 'Set task details';
    case 'notify_team':
      return step.config?.message ? `"${step.config.message.substring(0, 30)}..."` : 'Set notification';
    case 'condition':
      const count = step.conditions?.length || step.conditionGroups?.length || 0;
      return count > 0 ? `${count} condition${count !== 1 ? 's' : ''}` : 'Add conditions';
    case 'custom_webhook':
      return step.config?.url ? step.config.url.substring(0, 30) + '...' : 'Configure webhook';
    default:
      return 'Click to configure';
  }
}

export function ActionNodeCard({ step, stepNumber, isSelected, onSelect }: ActionNodeCardProps) {
  const display = ACTION_DISPLAY[step.type] || ACTION_DISPLAY.send_message;
  const preview = getStepPreview(step);
  const isConfigured = isStepConfigured(step);

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-80 rounded-2xl border transition-all shadow-lg",
        "bg-gradient-to-br from-[#1e1e2e] to-[#16162a]",
        isSelected 
          ? "border-primary ring-2 ring-primary/30 shadow-primary/20" 
          : "border-white/10 hover:border-white/25 hover:shadow-xl"
      )}
    >
      {/* Step Number Badge */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium text-white/70">
        {stepNumber}
      </div>

      {/* Status Indicator */}
      <div className={cn(
        "absolute -right-1 -top-1 w-5 h-5 rounded-full flex items-center justify-center",
        isConfigured ? "bg-green-500/20" : "bg-yellow-500/20"
      )}>
        {isConfigured ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <AlertCircle className="h-3 w-3 text-yellow-400" />
        )}
      </div>

      <div className="flex items-start gap-4 p-5">
        {/* Icon */}
        <div className={cn("p-3 rounded-xl", display.bgColor)}>
          <span className={display.color}>{display.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-white font-medium mb-1">{display.label}</div>
          <div className="text-sm text-white/50 truncate">{preview}</div>
        </div>
      </div>
    </motion.button>
  );
}
