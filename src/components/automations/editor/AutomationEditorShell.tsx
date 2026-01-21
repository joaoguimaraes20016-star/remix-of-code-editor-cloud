import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Save,
  Loader2,
  Play,
  PanelRightClose,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger } from "@/lib/automations/types";
import { TemplateGallery } from "./TemplateGallery";
import { WorkflowAIHelper } from "./WorkflowAIHelper";
import { AutomationCanvasArea } from "./AutomationCanvasArea";
import { NodeInspector } from "./NodeInspector";
import { cn } from "@/lib/utils";
import "./automation-editor.css";

interface AutomationEditorShellProps {
  teamId: string;
  definition: AutomationDefinition;
  onChange: (definition: AutomationDefinition) => void;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function AutomationEditorShell({
  teamId,
  definition,
  onChange,
  name,
  onNameChange,
  onSave,
  onBack,
  isSaving,
}: AutomationEditorShellProps) {
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

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
      setRightCollapsed(false);
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
      if (selectedNodeId === stepId) {
        setSelectedNodeId(null);
        setRightCollapsed(true);
      }
    },
    [definition, onChange, selectedNodeId]
  );

  const handleTemplateSelect = useCallback(
    (templateDefinition: AutomationDefinition) => {
      onChange(templateDefinition);
      onNameChange(templateDefinition.name);
    },
    [onChange, onNameChange]
  );

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) {
      setRightCollapsed(false);
    }
  }, []);

  const selectedStep = selectedNodeId === "trigger"
    ? null
    : definition.steps.find((s) => s.id === selectedNodeId);

  const showAIHelper = !selectedNodeId && !selectedStep;

  return (
    <div className="automation-editor">
      {/* Simplified Header */}
      <header className="automation-editor-header">
        <div className="automation-editor-header-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="automation-editor-divider" />
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Automation name..."
            className="automation-editor-name-input"
          />
        </div>

        <div className="automation-editor-header-center">
          <div className="flex items-center gap-2 text-xs">
            <div className={cn(
              "w-2 h-2 rounded-full",
              definition.steps.length > 0 ? "bg-green-400" : "bg-yellow-400"
            )} />
            <span className="text-white/50">
              {definition.steps.length > 0 
                ? `${definition.steps.length} step${definition.steps.length !== 1 ? "s" : ""}` 
                : "No steps yet"}
            </span>
          </div>
        </div>

        <div className="automation-editor-header-right">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Layout - Centered Canvas */}
      <div className="automation-editor-body">
        {/* Center - Full Width Canvas */}
        <main className={cn(
          "automation-editor-canvas flex-1",
          !rightCollapsed && "mr-80"
        )}>
          <AutomationCanvasArea
            definition={definition}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            onTriggerChange={handleTriggerChange}
            onStepUpdate={handleStepUpdate}
            onStepDelete={handleStepDelete}
            onAddStep={handleAddStep}
          />
        </main>

        {/* Right Panel - Slides in when node selected */}
        <AnimatePresence>
          {!rightCollapsed && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-14 bottom-0 w-80 bg-sidebar border-l border-sidebar-border z-20"
            >
              <div className="automation-editor-panel-header">
                <span className="automation-editor-panel-title flex items-center gap-2">
                  {showAIHelper ? (
                    <>
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Assistant
                    </>
                  ) : selectedNodeId === "trigger" ? (
                    "Configure Trigger"
                  ) : selectedStep ? (
                    "Configure Step"
                  ) : (
                    "Inspector"
                  )}
                </span>
                <button
                  type="button"
                  className="automation-editor-panel-collapse"
                  onClick={() => {
                    setRightCollapsed(true);
                    setSelectedNodeId(null);
                  }}
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
              <div className="automation-editor-panel-content">
                <AnimatePresence mode="wait">
                  {showAIHelper ? (
                    <motion.div
                      key="ai-helper"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <WorkflowAIHelper definition={definition} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="inspector"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <NodeInspector
                        selectedNodeId={selectedNodeId}
                        trigger={definition.trigger}
                        step={selectedStep}
                        onTriggerChange={handleTriggerChange}
                        onStepUpdate={handleStepUpdate}
                        onStepDelete={handleStepDelete}
                        teamId={teamId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Template Gallery Modal */}
      <TemplateGallery
        open={showTemplates}
        onOpenChange={setShowTemplates}
        teamId={teamId}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}

function getDefaultConfigForType(type: ActionType): Record<string, any> {
  switch (type) {
    case "send_message":
      return { channel: "sms", template: "" };
    case "time_delay":
      return { delayValue: 5, delayType: "minutes" };
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
    case "condition":
      return { conditions: [] };
    default:
      return {};
  }
}
