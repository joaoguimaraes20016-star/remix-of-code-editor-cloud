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
        "bg-builder-surface border-builder-border",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-builder-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-primary/15">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-builder-text font-medium">If / Else</div>
          <div className="text-xs text-builder-text-muted">
            {conditionCount ? `${conditionCount} condition(s)` : "No conditions set"}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-builder-text-muted" />
      </div>
    </motion.button>
  );
}
