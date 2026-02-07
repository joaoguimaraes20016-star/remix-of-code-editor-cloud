import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Plus, MessageSquare, Clock, GitBranch, Tag, Bell, Webhook, Zap } from "lucide-react";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TriggerNodeCard } from "./nodes/TriggerNodeCard";
import { ActionNodeCard } from "./nodes/ActionNodeCard";
import { ConditionNodeCard } from "./nodes/ConditionNodeCard";
import { NodeConnectionLine } from "./nodes/NodeConnectionLine";
import { getContextualSuggestions } from "@/lib/automations/workflowSuggestions";
import { ZoomControl, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "./ZoomControl";
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
  onOpenActionLibrary: (afterStepId?: string) => void;
  onToggleStepEnabled?: (stepId: string, enabled: boolean) => void;
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
  onOpenActionLibrary,
  onToggleStepEnabled,
}: AutomationCanvasAreaProps) {
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const suggestions = getContextualSuggestions(definition.trigger.type, definition.steps);
  const topSuggestions = suggestions.slice(0, 4);
  const hasTrigger = !isTriggerEmpty(definition.trigger);

  // Mouse wheel zoom (Ctrl/Cmd + scroll)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((prev) => {
          const next = Math.round((prev + delta) * 100) / 100;
          return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
        });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Keyboard shortcuts for zoom and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Zoom shortcuts
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100));
        return;
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((prev) => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100));
        return;
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        return;
      } else if (e.key === '1' && !e.shiftKey) {
        // Fit to screen - calculate zoom that fits all nodes
        e.preventDefault();
        // For now, set to 0.75 as a reasonable "fit" zoom
        // TODO: Calculate actual fit based on node positions
        setZoom(0.75);
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        onSelectNode(null);
        return;
      }

      // Delete/Backspace to delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && selectedNodeId !== 'trigger') {
        e.preventDefault();
        onStepDelete(selectedNodeId);
        return;
      }

      // D to toggle enable/disable on selected node
      if (e.key === 'd' && selectedNodeId && selectedNodeId !== 'trigger' && onToggleStepEnabled) {
        e.preventDefault();
        const step = definition.steps.find(s => s.id === selectedNodeId);
        if (step) {
          onToggleStepEnabled(step.id, step.enabled === false);
        }
        return;
      }

      // Arrow key navigation between nodes
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        // Build list of all selectable node IDs (trigger first, then steps)
        const nodeIds: (string | null)[] = [];
        if (hasTrigger) {
          nodeIds.push('trigger');
        }
        definition.steps.forEach(step => {
          nodeIds.push(step.id);
        });

        if (nodeIds.length === 0) return;

        // Find current index
        const currentIndex = selectedNodeId 
          ? nodeIds.indexOf(selectedNodeId)
          : -1;

        // Navigate
        let newIndex: number;
        if (e.key === 'ArrowDown') {
          // Move to next node (or first if none selected)
          newIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, nodeIds.length - 1);
        } else {
          // Move to previous node (or last if none selected)
          newIndex = currentIndex < 0 ? nodeIds.length - 1 : Math.max(currentIndex - 1, 0);
        }

        const newNodeId = nodeIds[newIndex];
        if (newNodeId !== undefined) {
          onSelectNode(newNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, definition.steps, hasTrigger, onSelectNode, onStepDelete, onToggleStepEnabled]);

  return (
    <div className="relative min-h-full w-full" ref={canvasRef}>
      {/* Zoom Controls - Fixed position in bottom right */}
      <div className="fixed bottom-6 right-6 z-30">
        <ZoomControl zoom={zoom} onZoomChange={setZoom} />
      </div>

      {/* Canvas Content with Zoom Transform */}
      <div 
        className="min-h-full w-full py-12 px-8 flex flex-col items-center transition-transform duration-200"
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
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
          <div className="text-muted-foreground text-sm font-medium">Then do this...</div>
          
          {/* PRIMARY: Large Add Step Button - Opens Action Library */}
          <motion.button
            onClick={() => onOpenActionLibrary()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/30 text-primary transition-all shadow-lg"
          >
            <Plus className="h-10 w-10" />
          </motion.button>
          
          <div className="text-muted-foreground/60 text-xs">or choose a quick action</div>
          
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border hover:border-primary/50 text-foreground/70 hover:text-foreground transition-all group shadow-sm"
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
                onToggleEnabled={onToggleStepEnabled}
              />
            )}

            {/* Connection after this step */}
            <NodeConnectionLine />

            {/* Inline Add Button */}
            <AddStepButton 
              suggestions={topSuggestions.slice(0, 3)}
              onAddStep={(type) => onAddStep(type, step.id)}
              onOpenLibrary={() => onOpenActionLibrary(step.id)}
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
          <div className="w-14 h-14 rounded-full bg-background border border-border flex items-center justify-center">
            <ZapOff className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <span className="text-sm text-muted-foreground/60 font-medium">End</span>
        </motion.div>
      )}
      </div>
    </div>
  );
}

interface AddStepButtonProps {
  suggestions: { type: ActionType; label: string }[];
  onAddStep: (type: ActionType) => void;
  onOpenLibrary: () => void;
}

function AddStepButton({ suggestions, onAddStep, onOpenLibrary }: AddStepButtonProps) {
  return (
    <div className="group relative">
      <motion.button
        onClick={onOpenLibrary}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/20 text-primary/60 hover:text-primary transition-all shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
      
      {/* Hover tooltip with quick actions */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
        <div className="flex gap-1.5 p-2 bg-background rounded-xl border border-border shadow-xl">
          {suggestions.map((suggestion) => {
            const config = QUICK_ACTION_CONFIG[suggestion.type];
            return (
              <button
                key={suggestion.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStep(suggestion.type);
                }}
                className="p-3 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
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
      className="w-96 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-background/50 hover:bg-background transition-all shadow-lg group"
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
          <div className="text-foreground/70 group-hover:text-foreground font-semibold text-lg transition-colors">
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
