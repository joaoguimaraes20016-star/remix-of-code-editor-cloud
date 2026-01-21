import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Plus, MessageSquare, Clock, GitBranch, Tag, Bell, Webhook, Zap } from "lucide-react";
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
  onTriggerDelete: () => void;
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

// Check if trigger is in empty/placeholder state
function isTriggerEmpty(trigger: AutomationTrigger): boolean {
  return trigger.type === 'manual_trigger' && Object.keys(trigger.config || {}).length === 0;
}

export function AutomationCanvasArea({
  definition,
  selectedNodeId,
  onSelectNode,
  onTriggerChange,
  onTriggerDelete,
  onStepUpdate,
  onStepDelete,
  onAddStep,
}: AutomationCanvasAreaProps) {
  const suggestions = getContextualSuggestions(definition.trigger.type, definition.steps);
  const topSuggestions = suggestions.slice(0, 4);
  const hasTrigger = !isTriggerEmpty(definition.trigger);

  return (
    <div className="min-h-full py-12 px-8 flex flex-col items-center">
      {/* Trigger Node or Add Trigger Placeholder */}
      {hasTrigger ? (
        <TriggerNodeCard
          trigger={definition.trigger}
          isSelected={selectedNodeId === "trigger"}
          onSelect={() => onSelectNode("trigger")}
          onDelete={onTriggerDelete}
        />
      ) : (
        <AddTriggerPlaceholder onSelect={() => onSelectNode("trigger")} />
      )}

      {/* Connection to first step or add button */}
      <NodeConnectionLine />

      {/* Empty state - Add first step with primary + button and smart suggestions */}
      {definition.steps.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="text-white/40 text-sm font-medium">Then do this...</div>
          
          {/* PRIMARY: Large Add Step Button */}
          <motion.button
            onClick={() => onAddStep("send_message")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/30 text-primary transition-all shadow-lg"
          >
            <Plus className="h-10 w-10" />
          </motion.button>
          
          <div className="text-white/30 text-xs">or choose a quick action</div>
          
          {/* SECONDARY: Smart Suggestions Grid */}
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
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/20 text-primary/60 hover:text-primary transition-all shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
      
      {/* Hover tooltip with quick actions */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
        <div className="flex gap-1.5 p-2 bg-sidebar rounded-xl border border-sidebar-border shadow-xl">
          {suggestions.map((suggestion) => {
            const config = QUICK_ACTION_CONFIG[suggestion.type];
            return (
              <button
                key={suggestion.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStep(suggestion.type);
                }}
                className="p-3 rounded-lg hover:bg-primary/20 text-white/60 hover:text-primary transition-colors"
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

interface AddTriggerPlaceholderProps {
  onSelect: () => void;
}

function AddTriggerPlaceholder({ onSelect }: AddTriggerPlaceholderProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-96 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-sidebar/50 hover:bg-sidebar transition-all shadow-lg group"
    >
      <div className="flex items-center gap-5 p-6">
        {/* Icon */}
        <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Plus className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <div className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">
            Start your workflow
          </div>
          <div className="text-white/70 group-hover:text-white font-semibold text-lg transition-colors">
            Add a Trigger
          </div>
        </div>

        {/* Trigger Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-sm font-medium text-primary/70 group-hover:text-primary transition-colors">
          Required
        </div>
      </div>
    </motion.button>
  );
}
