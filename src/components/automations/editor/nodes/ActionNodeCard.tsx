import { motion } from "framer-motion";
import { MessageSquare, Clock, Tag, ClipboardList, UserCheck, ArrowRightLeft, Bell, Webhook, ChevronRight } from "lucide-react";
import type { AutomationStep, ActionType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ActionNodeCardProps {
  step: AutomationStep;
  isSelected: boolean;
  onSelect: () => void;
}

const ACTION_META: Record<ActionType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  send_message: { label: "Send Message", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  time_delay: { label: "Wait", icon: <Clock className="h-4 w-4" />, color: "text-orange-400", bgColor: "bg-orange-500/20" },
  add_tag: { label: "Add Tag", icon: <Tag className="h-4 w-4" />, color: "text-green-400", bgColor: "bg-green-500/20" },
  add_task: { label: "Create Task", icon: <ClipboardList className="h-4 w-4" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  assign_owner: { label: "Assign Owner", icon: <UserCheck className="h-4 w-4" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  update_stage: { label: "Update Stage", icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-indigo-400", bgColor: "bg-indigo-500/20" },
  notify_team: { label: "Notify Team", icon: <Bell className="h-4 w-4" />, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  custom_webhook: { label: "Webhook", icon: <Webhook className="h-4 w-4" />, color: "text-gray-400", bgColor: "bg-gray-500/20" },
  enqueue_dialer: { label: "Power Dialer", icon: <MessageSquare className="h-4 w-4" />, color: "text-red-400", bgColor: "bg-red-500/20" },
  condition: { label: "If / Else", icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-amber-400", bgColor: "bg-amber-500/20" },
};

export function ActionNodeCard({ step, isSelected, onSelect }: ActionNodeCardProps) {
  const meta = ACTION_META[step.type] || ACTION_META.send_message;

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
        <div className={cn("p-2 rounded-lg", meta.bgColor)}>
          <span className={meta.color}>{meta.icon}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium">{meta.label}</div>
          <div className="text-xs text-white/50 truncate">Click to configure</div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </div>
    </motion.button>
  );
}
