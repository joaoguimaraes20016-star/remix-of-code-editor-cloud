import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Plus, MessageSquare, Clock, GitBranch, Tag, Bell, Webhook } from "lucide-react";
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

const QUICK_ACTION_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  send_message: { icon: <MessageSquare className="h-4 w-4" />, label: "Send Message" },
  time_delay: { icon: <Clock className="h-4 w-4" />, label: "Wait" },
  condition: { icon: <GitBranch className="h-4 w-4" />, label: "If/Else" },
  add_tag: { icon: <Tag className="h-4 w-4" />, label: "Add Tag" },
  notify_team: { icon: <Bell className="h-4 w-4" />, label: "Notify Team" },
  custom_webhook: { icon: <Webhook className="h-4 w-4" />, label: "Webhook" },
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
  const topSuggestions = suggestions.slice(0, 4);

  return (
    <div className="min-h-full py-12 px-8 flex flex-col items-center">
      {/* Trigger Node */}
      <TriggerNodeCard
        trigger={definition.trigger}
        isSelected={selectedNodeId === "trigger"}
        onSelect={() => onSelectNode("trigger")}
      />

      {/* Connection to first step or add button */}
      <NodeConnectionLine />

      {/* Empty state - Add first step with smart suggestions */}
      {definition.steps.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="text-white/40 text-sm font-medium">Then do this...</div>
          
          {/* Smart Suggestions Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {topSuggestions.map((suggestion) => {
              const config = QUICK_ACTION_CONFIG[suggestion.type];
              return (
                <motion.button
                  key={suggestion.type}
                  onClick={() => onAddStep(suggestion.type)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar border border-sidebar-border hover:border-primary/50 text-white/70 hover:text-white transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/15 text-primary group-hover:bg-primary/20">
                    {config?.icon || <Plus className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">{config?.label || suggestion.label}</span>
                </motion.button>
              );
            })}
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
                isSelected={selectedNodeId === step.id}
                onSelect={() => onSelectNode(step.id)}
              />
            )}

            {/* Connection after this step */}
            <NodeConnectionLine />

            {/* Inline Add Button */}
            <AddStepButton 
              suggestions={topSuggestions.slice(0, 3)}
              onAddStep={(type) => onAddStep(type, step.id)}
            />

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
          <div className="w-14 h-14 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center">
            <ZapOff className="h-6 w-6 text-white/30" />
          </div>
          <span className="text-sm text-white/30 font-medium">End</span>
        </motion.div>
      )}
    </div>
  );
}

interface AddStepButtonProps {
  suggestions: { type: ActionType; label: string }[];
  onAddStep: (type: ActionType) => void;
}

function AddStepButton({ suggestions, onAddStep }: AddStepButtonProps) {
  return (
    <div className="group relative">
      <motion.button
        onClick={() => onAddStep("send_message")}
        whileHover={{ scale: 1.1 }}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-sidebar border border-dashed border-white/20 hover:border-primary text-white/40 hover:text-primary transition-all"
      >
        <Plus className="h-5 w-5" />
      </motion.button>
      
      {/* Hover tooltip with quick actions */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
        <div className="flex gap-1.5 p-1.5 bg-sidebar rounded-xl border border-sidebar-border shadow-xl">
          {suggestions.map((suggestion) => {
            const config = QUICK_ACTION_CONFIG[suggestion.type];
            return (
              <button
                key={suggestion.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStep(suggestion.type);
                }}
                className="p-2.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title={config?.label || suggestion.label}
              >
                {config?.icon || <Plus className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
