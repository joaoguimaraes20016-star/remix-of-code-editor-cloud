import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Plus, MessageSquare, Clock, GitBranch } from "lucide-react";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TriggerNodeCard } from "./nodes/TriggerNodeCard";
import { ActionNodeCard } from "./nodes/ActionNodeCard";
import { ConditionNodeCard } from "./nodes/ConditionNodeCard";
import { NodeConnectionLine } from "./nodes/NodeConnectionLine";
import { getContextualSuggestions } from "@/lib/automations/workflowSuggestions";
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

const QUICK_ACTION_ICONS: Record<string, React.ReactNode> = {
  send_message: <MessageSquare className="h-3 w-3" />,
  time_delay: <Clock className="h-3 w-3" />,
  condition: <GitBranch className="h-3 w-3" />,
};

export function AutomationCanvasArea({
  definition,
  selectedNodeId,
  onSelectNode,
  onTriggerChange,
  onStepUpdate,
  onStepDelete,
  onAddStep,
}: AutomationCanvasAreaProps) {
  const suggestions = getContextualSuggestions(definition.trigger.type, definition.steps);
  const topSuggestions = suggestions.slice(0, 3);

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

      {/* Empty state - Add first step with smart suggestions */}
      {definition.steps.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="text-white/40 text-sm font-medium">Then do this...</div>
          
          {/* Smart Suggestions */}
          <div className="flex gap-3">
            {topSuggestions.map((suggestion) => (
              <motion.button
                key={suggestion.type}
                onClick={() => onAddStep(suggestion.type)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-white/70 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30">
                  {QUICK_ACTION_ICONS[suggestion.type] || <Plus className="h-3 w-3" />}
                </div>
                <span className="text-sm font-medium">{suggestion.label}</span>
              </motion.button>
            ))}
          </div>
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
                stepNumber={index + 1}
                isSelected={selectedNodeId === step.id}
                onSelect={() => onSelectNode(step.id)}
              />
            )}

            {/* Connection after this step */}
            <NodeConnectionLine />

            {/* Smart Inline Add Button */}
            <div className="group relative">
              <motion.button
                onClick={() => onAddStep("send_message", step.id)}
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-primary/20 border border-dashed border-white/20 hover:border-primary text-white/40 hover:text-primary transition-all"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
              
              {/* Hover tooltip with quick actions */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
                <div className="flex gap-1 p-1 bg-[#1a1a2e] rounded-lg border border-white/10 shadow-xl">
                  {topSuggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStep(suggestion.type, step.id);
                      }}
                      className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={suggestion.label}
                    >
                      {QUICK_ACTION_ICONS[suggestion.type] || <Plus className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ZapOff className="h-5 w-5 text-white/30" />
          </div>
          <span className="text-sm text-white/30 font-medium">End</span>
        </motion.div>
      )}
    </div>
  );
}
