import { motion } from "framer-motion";
import { GitBranch, ChevronRight } from "lucide-react";
import type { AutomationStep } from "@/lib/automations/types";
import { cn } from "@/lib/utils";

interface ConditionNodeCardProps {
  step: AutomationStep;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConditionNodeCard({ step, isSelected, onSelect }: ConditionNodeCardProps) {
  const conditionCount = step.conditions?.length || 0;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-72 rounded-xl border transition-all",
        "bg-gradient-to-br from-amber-900/30 to-amber-950/30",
        isSelected ? "border-amber-400 ring-2 ring-amber-400/30" : "border-amber-500/30 hover:border-amber-500/50"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <GitBranch className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium">If / Else</div>
          <div className="text-xs text-white/50">
            {conditionCount ? `${conditionCount} condition(s)` : "No conditions set"}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </div>
    </motion.button>
  );
}
