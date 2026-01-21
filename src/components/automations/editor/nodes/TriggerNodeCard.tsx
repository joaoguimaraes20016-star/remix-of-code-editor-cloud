import { motion } from "framer-motion";
import { 
  Zap, Check, AlertCircle, UserPlus, Tag, Calendar, CalendarClock, 
  UserX, CalendarCheck, CalendarX, ArrowRightLeft, Briefcase, 
  Trophy, XCircle, DollarSign, Webhook, Play, 
  Clock, Timer, FileText, X
} from "lucide-react";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TriggerNodeCardProps {
  trigger: AutomationTrigger;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

interface TriggerDisplay {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TRIGGER_DISPLAY: Record<TriggerType, TriggerDisplay> = {
  lead_created: { 
    label: "Lead Created", 
    icon: <UserPlus className="h-5 w-5" />, 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/20" 
  },
  lead_tag_added: { 
    label: "Tag Added", 
    icon: <Tag className="h-5 w-5" />, 
    color: "text-green-400", 
    bgColor: "bg-green-500/20" 
  },
  lead_tag_removed: { 
    label: "Tag Removed", 
    icon: <Tag className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  form_submitted: { 
    label: "Form Submitted", 
    icon: <FileText className="h-5 w-5" />, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20" 
  },
  appointment_booked: { 
    label: "Appointment Booked", 
    icon: <Calendar className="h-5 w-5" />, 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/20" 
  },
  appointment_rescheduled: { 
    label: "Rescheduled", 
    icon: <CalendarClock className="h-5 w-5" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  appointment_no_show: { 
    label: "No Show", 
    icon: <UserX className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  appointment_completed: { 
    label: "Completed", 
    icon: <CalendarCheck className="h-5 w-5" />, 
    color: "text-green-400", 
    bgColor: "bg-green-500/20" 
  },
  appointment_canceled: { 
    label: "Canceled", 
    icon: <CalendarX className="h-5 w-5" />, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20" 
  },
  stage_changed: { 
    label: "Stage Changed", 
    icon: <ArrowRightLeft className="h-5 w-5" />, 
    color: "text-indigo-400", 
    bgColor: "bg-indigo-500/20" 
  },
  deal_created: { 
    label: "Deal Created", 
    icon: <Briefcase className="h-5 w-5" />, 
    color: "text-violet-400", 
    bgColor: "bg-violet-500/20" 
  },
  deal_won: { 
    label: "Deal Won", 
    icon: <Trophy className="h-5 w-5" />, 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-500/20" 
  },
  deal_lost: { 
    label: "Deal Lost", 
    icon: <XCircle className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  payment_received: { 
    label: "Payment Received", 
    icon: <DollarSign className="h-5 w-5" />, 
    color: "text-green-400", 
    bgColor: "bg-green-500/20" 
  },
  payment_failed: { 
    label: "Payment Failed", 
    icon: <AlertCircle className="h-5 w-5" />, 
    color: "text-red-400", 
    bgColor: "bg-red-500/20" 
  },
  webhook_received: { 
    label: "Webhook Received", 
    icon: <Webhook className="h-5 w-5" />, 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/20" 
  },
  manual_trigger: { 
    label: "Manual Trigger", 
    icon: <Play className="h-5 w-5" />, 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20" 
  },
  scheduled_trigger: { 
    label: "Scheduled", 
    icon: <Clock className="h-5 w-5" />, 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20" 
  },
  time_delay: { 
    label: "Time Delay", 
    icon: <Timer className="h-5 w-5" />, 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20" 
  },
};

// Check if trigger has required configuration
function isTriggerConfigured(trigger: AutomationTrigger): boolean {
  // Most triggers work without additional config
  // Specific triggers that need config:
  switch (trigger.type) {
    case 'webhook_received':
      return !!trigger.config?.webhookId;
    case 'scheduled_trigger':
      return !!trigger.config?.schedule;
    case 'lead_tag_added':
    case 'lead_tag_removed':
      return !!trigger.config?.tagName;
    default:
      return true;
  }
}

export function TriggerNodeCard({ trigger, isSelected, onSelect, onDelete }: TriggerNodeCardProps) {
  const display = TRIGGER_DISPLAY[trigger.type] || {
    label: trigger.type,
    icon: <Zap className="h-5 w-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  };

  const isConfigured = isTriggerConfigured(trigger);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative w-96 rounded-2xl border-2 transition-all shadow-lg group",
        "bg-sidebar",
        isSelected 
          ? "border-primary shadow-primary/20" 
          : "border-sidebar-border hover:border-primary/50 hover:shadow-xl"
      )}
    >
      {/* Delete Button */}
      {onDelete && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -left-2 -top-2 w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
        >
          <X className="h-4 w-4 text-white" />
        </motion.button>
      )}

      {/* Status Indicator */}
      <div className={cn(
        "absolute -right-1.5 -top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-sidebar",
        isConfigured ? "bg-green-500" : "bg-yellow-500"
      )}>
        {isConfigured ? (
          <Check className="h-3.5 w-3.5 text-white" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      <button
        onClick={onSelect}
        className="w-full flex items-center gap-5 p-6"
      >
        {/* Icon */}
        <div className={cn("p-4 rounded-xl", display.bgColor)}>
          <span className={display.color}>{display.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <div className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">
            When this happens
          </div>
          <div className="text-white font-semibold text-lg">
            {display.label}
          </div>
        </div>

        {/* Trigger Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-primary/15 text-sm font-medium text-primary">
          Trigger
        </div>
      </button>
    </motion.div>
  );
}
