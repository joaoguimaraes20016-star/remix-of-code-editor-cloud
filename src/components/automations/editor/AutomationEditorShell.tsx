import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Save,
  Loader2,
  Play,
  PanelRightClose,
  PanelLeftOpen,
  Sparkles,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AutomationDefinition, AutomationStep, ActionType, AutomationTrigger, TriggerType } from "@/lib/automations/types";
import { TemplateGallery } from "./TemplateGallery";
import { AutomationAIPanel } from "./AutomationAIPanel";
import { AutomationCanvasArea } from "./AutomationCanvasArea";
import { NodeInspector } from "./NodeInspector";
import { PublishStatusBadge } from "./PublishStatusBadge";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { TestPanel } from "./TestPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "./automation-editor.css";
import type { PublishStatus } from "@/hooks/useAutomationVersioning";

interface AutomationEditorShellProps {
  teamId: string;
  definition: AutomationDefinition;
  onChange: (definition: AutomationDefinition) => void;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onBack: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  isNew?: boolean;
  automationId?: string | null;
  publishStatus: PublishStatus;
  currentVersionNumber?: number | null;
  currentVersionId?: string | null;
}

// Track "add step" mode in selectedNodeId
// - "add-step" = adding first step
// - "add-step-after:{stepId}" = adding after specific step
function isAddStepMode(id: string | null): boolean {
  return id?.startsWith("add-step") ?? false;
}

function getAfterStepId(id: string | null): string | undefined {
  if (id?.startsWith("add-step-after:")) {
    return id.replace("add-step-after:", "");
  }
  return undefined;
}

export function AutomationEditorShell({
  teamId,
  definition,
  onChange,
  name,
  onNameChange,
  onSave,
  onPublish,
  onBack,
  isSaving,
  isPublishing,
  isNew,
  automationId,
  publishStatus,
  currentVersionNumber,
  currentVersionId,
}: AutomationEditorShellProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

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

  const handleTriggerDelete = useCallback(() => {
    // Reset trigger to empty/placeholder state
    onChange({
      ...definition,
      trigger: { type: 'manual_trigger', config: {} }
    });
    setSelectedNodeId(null);
    setRightCollapsed(true);
  }, [definition, onChange]);

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

  // Handler for opening action library (called by "+" buttons)
  const handleOpenActionLibrary = useCallback((afterStepId?: string) => {
    if (afterStepId) {
      setSelectedNodeId(`add-step-after:${afterStepId}`);
    } else {
      setSelectedNodeId("add-step");
    }
    setRightCollapsed(false);
  }, []);

  // Handler for when action is selected from library
  const handleActionSelected = useCallback((type: ActionType) => {
    const afterStepId = getAfterStepId(selectedNodeId);
    handleAddStep(type, afterStepId);
  }, [selectedNodeId, handleAddStep]);

  const selectedStep = selectedNodeId && !isAddStepMode(selectedNodeId) && selectedNodeId !== "trigger"
    ? definition.steps.find((s) => s.id === selectedNodeId)
    : undefined;

  return (
    <div className="automation-editor">
      {/* Simplified Header */}
      <header className="automation-editor-header">
        <div className="automation-editor-header-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
          <div className="flex items-center gap-3">
            <PublishStatusBadge 
              status={publishStatus} 
              version={currentVersionNumber} 
            />
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground text-xs">
              {definition.steps.length} step{definition.steps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="automation-editor-header-right">
          <VersionHistoryPanel
            automationId={automationId}
            teamId={teamId}
            currentVersionId={currentVersionId}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestPanel(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || isPublishing}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={onPublish}
            disabled={isPublishing || isSaving || isNew || definition.steps.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Rocket className="h-4 w-4 mr-2" />
            {publishStatus === "unpublished" ? "Publish" : "Update Live"}
          </Button>
        </div>
      </header>

      {/* Main Layout - Two Panel with AI on Left */}
      <div className="automation-editor-body">
        {/* Left Panel - AI Chat (Lovable-style) */}
        <AnimatePresence>
          {!leftCollapsed && (
            <motion.aside
              initial={{ x: -360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -360, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-[360px] min-w-[360px] border-r border-border flex-shrink-0"
            >
              <AutomationAIPanel
                definition={definition}
                onDefinitionChange={onChange}
                onNameChange={onNameChange}
                onCollapse={() => setLeftCollapsed(true)}
                isNew={isNew}
                teamId={teamId}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Expand button when left collapsed */}
        {leftCollapsed && (
          <button
            onClick={() => setLeftCollapsed(false)}
            className="automation-editor-expand-btn automation-editor-expand-btn--left"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {/* Center - Canvas */}
        <main className={cn(
          "automation-editor-canvas flex-1",
          !rightCollapsed && "mr-80"
        )}>
          <AutomationCanvasArea
            definition={definition}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            onTriggerChange={handleTriggerChange}
            onTriggerDelete={handleTriggerDelete}
            onStepUpdate={handleStepUpdate}
            onStepDelete={handleStepDelete}
            onAddStep={handleAddStep}
            onOpenActionLibrary={handleOpenActionLibrary}
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
              className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l border-border z-20"
            >
              <div className="automation-editor-panel-header">
                <span className="automation-editor-panel-title flex items-center gap-2">
                  {isAddStepMode(selectedNodeId) ? (
                    "Add Action"
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
                <NodeInspector
                  selectedNodeId={selectedNodeId}
                  trigger={definition.trigger}
                  step={selectedStep}
                  onTriggerChange={handleTriggerChange}
                  onStepUpdate={handleStepUpdate}
                  onStepDelete={handleStepDelete}
                  onActionSelected={handleActionSelected}
                  teamId={teamId}
                />
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

      {/* Test Panel */}
      <TestPanel
        open={showTestPanel}
        onOpenChange={setShowTestPanel}
        automationId={automationId || null}
        teamId={teamId}
        definition={definition}
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
