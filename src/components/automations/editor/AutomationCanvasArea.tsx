import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Plus } from "lucide-react";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TriggerNodeCard } from "./nodes/TriggerNodeCard";
import { ActionNodeCard } from "./nodes/ActionNodeCard";
import { ConditionNodeCard } from "./nodes/ConditionNodeCard";
import { NodeConnectionLine } from "./nodes/NodeConnectionLine";
import { cn } from "@/lib/utils";

interface AutomationCanvasAreaProps {
  definition: AutomationDefinition;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onTriggerChange: (trigger: AutomationTrigger) => void;
  onStepUpdate: (stepId: string, updates: Partial<AutomationStep>) => void;
  onStepDelete: (stepId: string) => void;
  onAddStep: (type: ActionType, afterStepId?: string) => void;
}

export function AutomationCanvasArea({
  definition,
  selectedNodeId,
  onSelectNode,
  onTriggerChange,
  onStepUpdate,
  onStepDelete,
  onAddStep,
}: AutomationCanvasAreaProps) {
  return (
    <div className="min-h-full p-8 flex flex-col items-center">
      {/* Trigger Node */}
      <TriggerNodeCard
        trigger={definition.trigger}
        isSelected={selectedNodeId === "trigger"}
        onSelect={() => onSelectNode("trigger")}
      />

      {/* Connection to first step */}
      {definition.steps.length > 0 && <NodeConnectionLine />}

      {/* Empty state - Add first step */}
      {definition.steps.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <div className="text-white/30 text-sm">Add your first action</div>
          <button
            onClick={() => onAddStep("send_message")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Step</span>
          </button>
        </motion.div>
      )}

      {/* Steps */}
      <AnimatePresence mode="popLayout">
        {definition.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            {step.type === "condition" ? (
              <ConditionNodeCard
                step={step}
                isSelected={selectedNodeId === step.id}
                onSelect={() => onSelectNode(step.id)}
              />
            ) : (
              <ActionNodeCard
                step={step}
                isSelected={selectedNodeId === step.id}
                onSelect={() => onSelectNode(step.id)}
              />
            )}

            {/* Connection after this step */}
            <NodeConnectionLine />

            {/* Inline Add Button */}
            <button
              onClick={() => onAddStep("send_message", step.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-primary/20 border border-dashed border-white/20 hover:border-primary text-white/40 hover:text-primary transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Connection to next step */}
            {index < definition.steps.length - 1 && <NodeConnectionLine />}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* End Node */}
      {definition.steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-2 text-white/30"
        >
          <ZapOff className="h-4 w-4" />
          <span className="text-sm">End</span>
        </motion.div>
      )}
    </div>
  );
}
