import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Save, Loader2, Plus, ZapOff } from "lucide-react";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TriggerNode } from "./TriggerNode";
import { ActionNode } from "./ActionNode";
import { ConditionNode } from "./ConditionNode";
import { AddNodeButton } from "./AddNodeButton";
import { NodeConnection } from "./NodeConnection";
import { cn } from "@/lib/utils";

interface AutomationCanvasProps {
  teamId: string;
  definition: AutomationDefinition;
  onChange: (definition: AutomationDefinition) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
  name: string;
  onNameChange: (name: string) => void;
}

export function AutomationCanvas({
  teamId,
  definition,
  onChange,
  onSave,
  onClose,
  isSaving,
  name,
  onNameChange,
}: AutomationCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleTriggerChange = useCallback(
    (trigger: AutomationTrigger) => {
      onChange({ ...definition, trigger });
    },
    [definition, onChange]
  );

  const handleAddStep = useCallback(
    (type: ActionType, afterStepId?: string) => {
      const newStep: AutomationStep = {
        id: `step-${Date.now()}`,
        order: definition.steps.length + 1,
        type,
        config: getDefaultConfigForType(type),
      };

      let newSteps: AutomationStep[];
      if (afterStepId) {
        const insertIndex = definition.steps.findIndex((s) => s.id === afterStepId) + 1;
        newSteps = [
          ...definition.steps.slice(0, insertIndex),
          newStep,
          ...definition.steps.slice(insertIndex),
        ].map((s, idx) => ({ ...s, order: idx + 1 }));
      } else {
        newSteps = [...definition.steps, newStep];
      }

      onChange({ ...definition, steps: newSteps });
      setSelectedNodeId(newStep.id);
    },
    [definition, onChange]
  );

  const handleStepUpdate = useCallback(
    (stepId: string, updates: Partial<AutomationStep>) => {
      const updatedSteps = definition.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      );
      onChange({ ...definition, steps: updatedSteps });
    },
    [definition, onChange]
  );

  const handleStepDelete = useCallback(
    (stepId: string) => {
      const updatedSteps = definition.steps
        .filter((step) => step.id !== stepId)
        .map((step, idx) => ({ ...step, order: idx + 1 }));
      onChange({ ...definition, steps: updatedSteps });
      if (selectedNodeId === stepId) setSelectedNodeId(null);
    },
    [definition, onChange, selectedNodeId]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="h-5 w-5" />
          </Button>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Automation name..."
            className="bg-transparent border-none text-foreground text-lg font-medium w-64 focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground/70 hover:bg-muted/50 hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !name.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto relative">
        {/* Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Flow Container */}
        <div className="relative min-h-full p-8 flex flex-col items-center">
          {/* Trigger Node */}
          <TriggerNode
            trigger={definition.trigger}
            onChange={handleTriggerChange}
            isSelected={selectedNodeId === "trigger"}
            onSelect={() => setSelectedNodeId("trigger")}
          />

          {/* Connection from trigger */}
          {definition.steps.length > 0 && <NodeConnection />}

          {/* Add first step if none */}
          {definition.steps.length === 0 && (
            <AddNodeButton onAdd={handleAddStep} className="mt-4" />
          )}

          {/* Action Steps */}
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
                  <ConditionNode
                    step={step}
                    onUpdate={(updates) => handleStepUpdate(step.id, updates)}
                    onDelete={() => handleStepDelete(step.id)}
                    isSelected={selectedNodeId === step.id}
                    onSelect={() => setSelectedNodeId(step.id)}
                    teamId={teamId}
                  />
                ) : (
                  <ActionNode
                    step={step}
                    onUpdate={(updates) => handleStepUpdate(step.id, updates)}
                    onDelete={() => handleStepDelete(step.id)}
                    isSelected={selectedNodeId === step.id}
                    onSelect={() => setSelectedNodeId(step.id)}
                    teamId={teamId}
                  />
                )}

                {/* Connection to next */}
                <NodeConnection />

                {/* Add button after each step */}
                <AddNodeButton
                  onAdd={(type) => handleAddStep(type, step.id)}
                  size="sm"
                />

                {index < definition.steps.length - 1 && <NodeConnection />}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* End Node */}
          {definition.steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center gap-2 text-muted-foreground/50"
            >
              <ZapOff className="h-4 w-4" />
              <span className="text-sm">End</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getDefaultConfigForType(type: ActionType): Record<string, any> {
  switch (type) {
    case "send_message":
      return { channel: "sms", template: "" };
    case "time_delay":
      return { duration: 5, unit: "minutes" };
    case "add_tag":
      return { tag: "" };
    case "add_task":
      return { title: "", assignTo: "setter" };
    case "assign_owner":
      return { entity: "lead", ownerId: "" };
    case "update_stage":
      return { entity: "lead", stageId: "" };
    case "notify_team":
      return { message: "", notifyAdmin: true };
    case "custom_webhook":
      return { url: "", method: "POST", payload: "" };
    case "enqueue_dialer":
      return {};
    default:
      return {};
  }
}
