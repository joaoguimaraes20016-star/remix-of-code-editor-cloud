import { motion } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";
import type { AutomationTrigger, TriggerType } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface TriggerNodeCardProps {
  trigger: AutomationTrigger;
  isSelected: boolean;
  onSelect: () => void;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  lead_created: "Lead Created",
  lead_tag_added: "Tag Added",
  appointment_booked: "Appointment Booked",
  appointment_rescheduled: "Rescheduled",
  appointment_no_show: "No Show",
  appointment_completed: "Completed",
  payment_received: "Payment Received",
  time_delay: "Time Delay",
};

export function TriggerNodeCard({ trigger, isSelected, onSelect }: TriggerNodeCardProps) {
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
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Zap className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs text-white/50 uppercase tracking-wide">Trigger</div>
          <div className="text-white font-medium flex items-center gap-2">
            {TRIGGER_LABELS[trigger.type] || trigger.type}
            <ChevronRight className="h-4 w-4 text-white/40" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
