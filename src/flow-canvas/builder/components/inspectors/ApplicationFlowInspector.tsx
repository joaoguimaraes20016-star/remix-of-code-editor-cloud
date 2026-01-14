import React, { useState } from 'react';
import { Block, ApplicationFlowStep, ApplicationStepType, ApplicationFlowSettings } from '../../../types/infostack';
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
  Settings2,
} from 'lucide-react';
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
          ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-gray-900 dark:border-white' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
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
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>

      {/* Step Number Badge */}
      <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-400 shrink-0">
        {index + 1}
      </div>

      {/* Step Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
          {step.name}
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500">
          {stepTypeLabels[step.type]}
        </div>
      </div>

      {/* Step Type Icon */}
      <div className="shrink-0 text-gray-500 dark:text-gray-400">
        {stepTypeIcons[step.type]}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3 h-3 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
            className="text-red-600 dark:text-red-400 text-xs"
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

  // Two-panel layout: Step List View vs Step Editor View
  if (selectedStep) {
    return (
      <StepContentEditor
        step={selectedStep}
        allSteps={steps}
        onUpdate={(updates) => updateStep(selectedStep.id, updates)}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FileText className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Application Flow</div>
            <div className="text-[10px] text-gray-500">{steps.length} steps</div>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto builder-scroll p-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Steps</span>
          <span className="text-[10px] text-gray-400">Click to edit</span>
        </div>

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
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xl border border-gray-300 dark:border-gray-600">
                <GripVertical className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-medium">{activeStep.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add Step Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1 py-2 mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 rounded-md transition-colors">
              <Plus className="w-3 h-3" />
              Add Step
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DropdownMenuItem onClick={() => addStep('welcome')} className="text-xs">
              <Sparkles className="w-3 h-3 mr-2 text-gray-500" />
              Welcome Screen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('question')} className="text-xs">
              <HelpCircle className="w-3 h-3 mr-2 text-gray-500" />
              Question
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('capture')} className="text-xs">
              <UserPlus className="w-3 h-3 mr-2 text-gray-500" />
              Capture Info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('booking')} className="text-xs">
              <Calendar className="w-3 h-3 mr-2 text-gray-500" />
              Book a Call
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('ending')} className="text-xs">
              <CheckCircle2 className="w-3 h-3 mr-2 text-gray-500" />
              Thank You
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Flow Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Flow Settings</span>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-gray-500">Display Mode</Label>
          <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, displayMode: 'one-at-a-time' } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.displayMode === 'one-at-a-time' 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              One at a Time
            </button>
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, displayMode: 'all-visible' } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.displayMode === 'all-visible' 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              All Visible
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-gray-500">Progress Bar</Label>
          <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, showProgress: true } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.showProgress 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              Show
            </button>
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, showProgress: false } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                !settings.showProgress 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                  : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              Hide
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-gray-500">Transition</Label>
          <Select 
            value={settings.transition || 'slide-up'}
            onValueChange={(value) => onUpdateBlock({ props: { ...settings, transition: value } })}
          >
            <SelectTrigger className="h-7 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectItem value="slide-up" className="text-xs">Slide Up</SelectItem>
              <SelectItem value="slide-left" className="text-xs">Slide Left</SelectItem>
              <SelectItem value="fade" className="text-xs">Fade</SelectItem>
              <SelectItem value="none" className="text-xs">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
