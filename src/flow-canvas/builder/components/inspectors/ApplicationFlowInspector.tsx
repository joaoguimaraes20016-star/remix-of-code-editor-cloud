import React, { useState } from 'react';
import { Block, ApplicationFlowStep, ApplicationStepType, ApplicationFlowSettings, ApplicationFlowBackground } from '../../../types/infostack';
import { cn } from '@/lib/utils';
import {
  Plus,
  GripVertical,
  MoreHorizontal,
  Sparkles,
  HelpCircle,
  UserPlus,
  FileText,
  Calendar,
  CheckCircle2,
  Trash2,
  Copy,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Box,
  Layers,
  Square,
  RectangleHorizontal,
  Maximize,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StepContentEditor } from './StepContentEditor';
import { BackgroundEditor, BackgroundValue } from '../BackgroundEditor';
import { ColorPickerPopover } from '../modals';
import { 
  StepDesignPreset, 
  stepDesignPresets, 
  presetLabels, 
  presetDescriptions,
  applyPreset 
} from '../../utils/stepDesignPresets';

const stepTypeIcons: Record<ApplicationStepType, React.ReactNode> = {
  welcome: <Sparkles className="w-3.5 h-3.5" />,
  question: <HelpCircle className="w-3.5 h-3.5" />,
  capture: <UserPlus className="w-3.5 h-3.5" />,
  booking: <Calendar className="w-3.5 h-3.5" />,
  ending: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const stepTypeLabels: Record<ApplicationStepType, string> = {
  welcome: 'Welcome',
  question: 'Question',
  capture: 'Capture',
  booking: 'Booking',
  ending: 'Ending',
};

interface ApplicationFlowInspectorProps {
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
  selectedStepId?: string | null;
  onSelectStep?: (stepId: string | null) => void;
}

// Generate unique ID
const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default step templates
const createDefaultStep = (type: ApplicationStepType, index: number): ApplicationFlowStep => ({
  id: generateId(),
  name: type === 'welcome' ? 'Welcome' : type === 'ending' ? 'Thank You' : `Step ${index + 1}`,
  type,
  elements: [],
  navigation: {
    action: type === 'ending' ? 'submit' : 'next',
  },
});

// Minimal Step Item for the list
interface StepListItemProps {
  step: ApplicationFlowStep;
  index: number;
  isActive: boolean;
  totalSteps: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const StepListItem: React.FC<StepListItemProps> = ({
  step,
  index,
  isActive,
  totalSteps,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        'group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
        isActive 
          ? 'bg-accent/40 border-l-2 border-foreground' 
          : 'hover:bg-accent/30',
        isDragging && 'opacity-50 z-50 shadow-lg'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Step Number Badge */}
      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
        {index + 1}
      </div>

      {/* Step Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {step.name}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {stepTypeLabels[step.type]}
        </div>
      </div>

      {/* Step Type Icon */}
      <div className="shrink-0 text-muted-foreground">
        {stepTypeIcons[step.type]}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-all shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border">
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ApplicationFlowInspector: React.FC<ApplicationFlowInspectorProps> = ({
  block,
  onUpdateBlock,
  selectedStepId: controlledStepId,
  onSelectStep,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [containerOpen, setContainerOpen] = useState(true);
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  // Use controlled state from props, or fallback to local state
  const [localStepId, setLocalStepId] = useState<string | null>(null);
  const selectedStepId = controlledStepId !== undefined ? controlledStepId : localStepId;

  const defaultSettings: ApplicationFlowSettings = {
    displayMode: 'one-at-a-time',
    showProgress: true,
    transition: 'slide-up',
    steps: [],
  };
  
  const settings: ApplicationFlowSettings = {
    ...defaultSettings,
    ...(block.props as Partial<ApplicationFlowSettings>),
  };

  const steps = settings.steps || [];
  const selectedStep = selectedStepId ? steps.find(s => s.id === selectedStepId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      onUpdateBlock({ props: { ...settings, steps: newSteps } });
    }
  };

  const updateStep = (stepId: string, updates: Partial<ApplicationFlowStep>) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, ...updates } : s);
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
  };

  const addStep = (type: ApplicationStepType = 'question') => {
    const newStep = createDefaultStep(type, steps.length);
    onUpdateBlock({ props: { ...settings, steps: [...steps, newStep] } });
    // Auto-select the new step
    if (onSelectStep) {
      onSelectStep(newStep.id);
    } else {
      setLocalStepId(newStep.id);
    }
  };

  const duplicateStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      const newStep = { ...step, id: generateId(), name: `${step.name} (copy)` };
      const index = steps.findIndex(s => s.id === stepId);
      const newSteps = [...steps.slice(0, index + 1), newStep, ...steps.slice(index + 1)];
      onUpdateBlock({ props: { ...settings, steps: newSteps } });
    }
  };

  const deleteStep = (stepId: string) => {
    const newSteps = steps.filter(s => s.id !== stepId);
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
    if (selectedStepId === stepId) {
      if (onSelectStep) {
        onSelectStep(null);
      } else {
        setLocalStepId(null);
      }
    }
  };

  const handleSelectStep = (stepId: string) => {
    if (onSelectStep) {
      onSelectStep(stepId);
    } else {
      setLocalStepId(stepId);
    }
  };

  const handleBackToList = () => {
    if (onSelectStep) {
      onSelectStep(null);
    } else {
      setLocalStepId(null);
    }
  };

  const activeStep = activeId ? steps.find(s => s.id === activeId) : null;

  // Find the current step index for navigation
  const currentStepIndex = selectedStep ? steps.findIndex(s => s.id === selectedStep.id) : -1;
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < steps.length - 1;

  const goToPrevStep = () => {
    if (canGoPrev) {
      const prevStep = steps[currentStepIndex - 1];
      handleSelectStep(prevStep.id);
    }
  };

  const goToNextStep = () => {
    if (canGoNext) {
      const nextStep = steps[currentStepIndex + 1];
      handleSelectStep(nextStep.id);
    }
  };

  // If a step is selected, show the step editor directly (no list-first approach)
  if (selectedStep) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Step Navigation Header */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              All Steps
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevStep}
                disabled={!canGoPrev}
                className={cn(
                  "p-1 rounded transition-colors",
                  canGoPrev ? "text-muted-foreground hover:text-foreground hover:bg-accent" : "text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground px-1">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <button
                onClick={goToNextStep}
                disabled={!canGoNext}
                className={cn(
                  "p-1 rounded transition-colors",
                  canGoNext ? "text-muted-foreground hover:text-foreground hover:bg-accent" : "text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground">
              {stepTypeIcons[selectedStep.type]}
            </div>
            <span className="text-sm font-medium text-foreground truncate">{selectedStep.name}</span>
          </div>
        </div>
        
        {/* Step Content Editor - embedded directly */}
        <StepContentEditor
          step={selectedStep}
          allSteps={steps}
          onUpdate={(updates) => updateStep(selectedStep.id, updates)}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-bg">
      {/* Header - Uses builder accent (purple) for block-level consistency */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-builder-border bg-gradient-to-r from-[hsl(280,75%,55%,0.12)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[hsl(280,75%,55%,0.2)] flex items-center justify-center">
            <FileText className="w-3 h-3 text-[hsl(280,75%,70%)]" />
          </div>
          <div>
            <div className="text-sm font-medium text-builder-text">Multi-Step</div>
            <div className="text-[10px] text-builder-text-muted">{steps.length} steps</div>
          </div>
        </div>
      </div>

      {/* Steps List - Scrollable area with proper constraints */}
      <div className="flex-1 min-h-0 overflow-y-auto builder-scroll">
        {/* Sticky Steps Header */}
        <div className="sticky top-0 z-10 px-3 py-2 bg-builder-bg border-b border-builder-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-builder-text-muted uppercase tracking-wide">Steps ({steps.length})</span>
            <span className="text-[10px] text-builder-text-dim">Click to edit</span>
          </div>
        </div>
        
        <div className="p-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map((step, index) => (
                <StepListItem
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={step.id === selectedStepId}
                  totalSteps={steps.length}
                  onSelect={() => handleSelectStep(step.id)}
                  onDuplicate={() => duplicateStep(step.id)}
                  onDelete={() => deleteStep(step.id)}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeStep ? (
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-background text-foreground shadow-xl border border-border">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{activeStep.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Add Step Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-center gap-1 py-2 mt-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 rounded-md transition-colors">
                <Plus className="w-3 h-3" />
                Add Step
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-40 bg-background border-border">
              <DropdownMenuItem onClick={() => addStep('welcome')} className="text-xs">
                <Sparkles className="w-3 h-3 mr-2 text-muted-foreground" />
                Welcome Screen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addStep('question')} className="text-xs">
                <HelpCircle className="w-3 h-3 mr-2 text-muted-foreground" />
                Question
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addStep('capture')} className="text-xs">
                <UserPlus className="w-3 h-3 mr-2 text-muted-foreground" />
                Capture Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addStep('booking')} className="text-xs">
                <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                Book a Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addStep('ending')} className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-2 text-muted-foreground" />
                Thank You
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Design Preset - Primary control */}
      <Collapsible open={containerOpen} onOpenChange={setContainerOpen}>
        <CollapsibleTrigger className="flex-shrink-0 w-full border-t border-border px-3 py-2.5 flex items-center justify-between hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Style</span>
          </div>
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", containerOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          {/* Preset Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground">Preset</Label>
            <div className="grid grid-cols-5 gap-1">
              {(['none', 'minimal', 'card', 'glass', 'full-bleed'] as StepDesignPreset[]).map((preset) => {
                const isActive = (settings.designPreset || 'minimal') === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => {
                      const presetSettings = applyPreset(preset);
                      onUpdateBlock({ 
                        props: { 
                          ...settings, 
                          designPreset: preset,
                          containerPadding: presetSettings.containerPadding,
                          containerRadius: presetSettings.containerRadius,
                          containerBorderColor: presetSettings.containerBorderColor,
                          containerShadow: presetSettings.containerShadow,
                          backdropBlur: presetSettings.backdropBlur,
                        } 
                      });
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 p-1.5 rounded-md transition-all text-center',
                      isActive 
                        ? 'bg-primary/10 ring-1 ring-primary/40' 
                        : 'hover:bg-accent/50'
                    )}
                    title={presetDescriptions[preset]}
                  >
                    <div className={cn(
                      'w-6 h-4 rounded-sm border transition-all',
                      preset === 'none' && 'border-dashed border-muted-foreground/30',
                      preset === 'minimal' && 'border-transparent',
                      preset === 'card' && 'bg-background border-border shadow-sm',
                      preset === 'glass' && 'bg-gradient-to-br from-white/20 to-white/5 border-white/20 backdrop-blur-sm',
                      preset === 'full-bleed' && 'border-transparent bg-muted/30 w-full rounded-none',
                    )} />
                    <span className="text-[9px] text-muted-foreground leading-tight">
                      {presetLabels[preset]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Layout Controls */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Content Width</Label>
            <Select 
              value={settings.contentWidth || 'md'}
              onValueChange={(value) => onUpdateBlock({ props: { ...settings, contentWidth: value } })}
            >
              <SelectTrigger className="h-7 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="sm" className="text-xs">Small (400px)</SelectItem>
                <SelectItem value="md" className="text-xs">Medium (600px)</SelectItem>
                <SelectItem value="lg" className="text-xs">Large (800px)</SelectItem>
                <SelectItem value="full" className="text-xs">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Alignment</Label>
            <div className="flex rounded-md overflow-hidden border border-border">
              {[
                { value: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                { value: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
                { value: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
              ].map((align) => (
                <button
                  key={align.value}
                  type="button"
                  onClick={() => onUpdateBlock({ props: { ...settings, contentAlign: align.value } })}
                  className={cn(
                    'flex-1 px-2 py-1.5 transition-colors flex items-center justify-center',
                    (settings.contentAlign || 'center') === align.value
                      ? 'bg-foreground text-background' 
                      : 'bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  {align.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Fine-tune controls - Always available */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Padding</Label>
              <span className="text-[10px] text-muted-foreground">{settings.containerPadding ?? 32}px</span>
            </div>
            <Slider
              value={[settings.containerPadding ?? 32]}
              onValueChange={([value]) => onUpdateBlock({ props: { ...settings, containerPadding: value } })}
              min={0}
              max={80}
              step={4}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Radius</Label>
              <span className="text-[10px] text-muted-foreground">{settings.containerRadius ?? 0}px</span>
            </div>
            <Slider
              value={[settings.containerRadius ?? 0]}
              onValueChange={([value]) => onUpdateBlock({ props: { ...settings, containerRadius: value } })}
              min={0}
              max={40}
              step={2}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Border</Label>
            <ColorPickerPopover
              color={settings.containerBorderColor || 'transparent'}
              onChange={(color) => onUpdateBlock({ props: { ...settings, containerBorderColor: color } })}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: settings.containerBorderColor || 'transparent' }}
                />
                <span className="text-xs text-foreground font-mono">{settings.containerBorderColor || 'none'}</span>
              </button>
            </ColorPickerPopover>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Shadow</Label>
            <Select 
              value={settings.containerShadow || 'none'}
              onValueChange={(value) => onUpdateBlock({ props: { ...settings, containerShadow: value } })}
            >
              <SelectTrigger className="h-7 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none" className="text-xs">None</SelectItem>
                <SelectItem value="sm" className="text-xs">Subtle</SelectItem>
                <SelectItem value="md" className="text-xs">Medium</SelectItem>
                <SelectItem value="lg" className="text-xs">Large</SelectItem>
                <SelectItem value="xl" className="text-xs">Dramatic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Backdrop blur for glass preset */}
          {(settings.designPreset === 'glass' || (settings.backdropBlur && settings.backdropBlur > 0)) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Blur</Label>
                <span className="text-[10px] text-muted-foreground">{settings.backdropBlur ?? 0}px</span>
              </div>
              <Slider
                value={[settings.backdropBlur ?? 0]}
                onValueChange={([value]) => onUpdateBlock({ props: { ...settings, backdropBlur: value } })}
                min={0}
                max={24}
                step={2}
                className="w-full"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Appearance Settings - Collapsible */}
      <Collapsible open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <CollapsibleTrigger className="flex-shrink-0 w-full border-t border-border px-3 py-2.5 flex items-center justify-between hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Colors</span>
          </div>
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", appearanceOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground">Background</Label>
            <BackgroundEditor
              value={{
                type: settings.background?.type || 'solid',
                color: settings.background?.color || '#ffffff',
                gradient: settings.background?.gradient,
                imageUrl: settings.background?.imageUrl,
              } as BackgroundValue}
              onChange={(value) => {
                const bg: ApplicationFlowBackground = {
                  type: value.type,
                  color: value.color,
                  gradient: value.gradient,
                  imageUrl: value.imageUrl,
                };
                onUpdateBlock({ props: { ...settings, background: bg } });
              }}
              showImageOption={true}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Text Color</Label>
            <ColorPickerPopover
              color={settings.textColor || '#000000'}
              onChange={(color) => onUpdateBlock({ props: { ...settings, textColor: color } })}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: settings.textColor || '#000000' }}
                />
                <span className="text-xs text-foreground font-mono">{settings.textColor || '#000000'}</span>
              </button>
            </ColorPickerPopover>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Input Background</Label>
            <ColorPickerPopover
              color={settings.inputBackground || '#ffffff'}
              onChange={(color) => onUpdateBlock({ props: { ...settings, inputBackground: color } })}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: settings.inputBackground || '#ffffff' }}
                />
                <span className="text-xs text-foreground font-mono">{settings.inputBackground || '#ffffff'}</span>
              </button>
            </ColorPickerPopover>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Input Border</Label>
            <ColorPickerPopover
              color={settings.inputBorderColor || '#e5e7eb'}
              onChange={(color) => onUpdateBlock({ props: { ...settings, inputBorderColor: color } })}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: settings.inputBorderColor || '#e5e7eb' }}
                />
                <span className="text-xs text-foreground font-mono">{settings.inputBorderColor || '#e5e7eb'}</span>
              </button>
            </ColorPickerPopover>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Flow Settings - Display Mode & Progress */}
      <Collapsible>
        <CollapsibleTrigger className="flex-shrink-0 w-full border-t border-border px-3 py-2.5 flex items-center justify-between hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Flow</span>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Display Mode</Label>
            <Select 
              value={settings.displayMode || 'one-at-a-time'}
              onValueChange={(value: 'one-at-a-time' | 'all-visible') => onUpdateBlock({ props: { ...settings, displayMode: value } })}
            >
              <SelectTrigger className="h-7 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="one-at-a-time" className="text-xs">One at a time</SelectItem>
                <SelectItem value="all-visible" className="text-xs">All steps visible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground">Show Progress Bar</Label>
            <button
              type="button"
              onClick={() => onUpdateBlock({ props: { ...settings, showProgress: !settings.showProgress } })}
              className={cn(
                'w-8 h-4 rounded-full transition-colors relative',
                settings.showProgress ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div 
                className={cn(
                  'w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm',
                  settings.showProgress ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};