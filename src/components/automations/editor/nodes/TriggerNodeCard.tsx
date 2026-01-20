import { motion } from "framer-motion";
import { 
  Zap, ChevronRight, UserPlus, Tag, Calendar, CalendarClock, 
  UserX, CalendarCheck, CalendarX, ArrowRightLeft, Briefcase, 
  Trophy, XCircle, DollarSign, AlertCircle, Webhook, Play, 
  Clock, Timer, FileText
} from "lucide-react";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TriggerNodeCardProps {
  trigger: AutomationTrigger;
  isSelected: boolean;
  onSelect: () => void;
}

interface TriggerDisplay {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TRIGGER_DISPLAY: Record<TriggerType, TriggerDisplay> = {
  // Lead triggers
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
  // Appointment triggers
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
  // Pipeline triggers
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
  // Payment triggers
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
  // Integration triggers
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

export function TriggerNodeCard({ trigger, isSelected, onSelect }: TriggerNodeCardProps) {
  const display = TRIGGER_DISPLAY[trigger.type] || {
    label: trigger.type,
    icon: <Zap className="h-5 w-5" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  };

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
          <div className="text-xs text-white/50 uppercase tracking-wide">Trigger</div>
          <div className="text-white font-medium flex items-center gap-2">
            {display.label}
            <ChevronRight className="h-4 w-4 text-white/40" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
