import React, { useState } from 'react';
import { Block, ApplicationFlowStep, ApplicationStepType, ApplicationFlowSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';
import {
  X,
  Plus,
  GripVertical,
  Sparkles,
  HelpCircle,
  UserPlus,
  Calendar,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Settings2,
  ArrowRight,
  ExternalLink,
  Target,
  Lightbulb,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/flow-canvas/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Input } from '@/components/ui/input';
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

const stepTypeIcons: Record<ApplicationStepType, React.ReactNode> = {
  welcome: <Sparkles className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  capture: <UserPlus className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  ending: <CheckCircle2 className="w-4 h-4" />,
};

const stepTypeLabels: Record<ApplicationStepType, string> = {
  welcome: 'Welcome',
  question: 'Question',
  capture: 'Capture',
  booking: 'Booking',
  ending: 'Thank You',
};

const stepTypeColors: Record<ApplicationStepType, string> = {
  welcome: 'bg-amber-100 text-amber-700 border-amber-200',
  question: 'bg-blue-100 text-blue-700 border-blue-200',
  capture: 'bg-green-100 text-green-700 border-green-200',
  booking: 'bg-purple-100 text-purple-700 border-purple-200',
  ending: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

interface ApplicationFlowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
}

const generateId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createDefaultStep = (type: ApplicationStepType, index: number): ApplicationFlowStep => ({
  id: generateId(),
  name: type === 'welcome' ? 'Welcome' : type === 'ending' ? 'Thank You' : `Step ${index + 1}`,
  type,
  elements: [],
  navigation: {
    action: type === 'ending' ? 'submit' : 'next',
  },
});

// Sortable Step Item
interface SortableStepItemProps {
  step: ApplicationFlowStep;
  index: number;
  isSelected: boolean;
  totalSteps: number;
  allSteps: ApplicationFlowStep[];
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onUpdateNavigation: (nav: ApplicationFlowStep['navigation']) => void;
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  isSelected,
  totalSteps,
  allSteps,
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
  onUpdateNavigation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.name);

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

  const handleRename = () => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-stretch rounded-lg border transition-all duration-200',
        isDragging && 'opacity-50 shadow-xl z-50',
        isSelected
          ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-2 cursor-grab active:cursor-grabbing border-r border-gray-200 dark:border-gray-700"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Main Content */}
      <div 
        className="flex-1 flex items-center gap-3 px-3 py-3 cursor-pointer"
        onClick={onSelect}
      >
        {/* Step Type Badge */}
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
          stepTypeColors[step.type]
        )}>
          {stepTypeIcons[step.type]}
          {stepTypeLabels[step.type]}
        </div>

        {/* Step Name */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditValue(step.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm rounded border border-indigo-300 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {step.name}
          </span>
        )}

        {/* Navigation indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ArrowRight className="w-3 h-3" />
          <span>
            {step.navigation.action === 'next' && 'Next'}
            {step.navigation.action === 'go-to-step' && 'Jump'}
            {step.navigation.action === 'submit' && 'Submit'}
            {step.navigation.action === 'redirect' && 'Redirect'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
          title="Delete"
          disabled={totalSteps <= 1}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const ApplicationFlowEditorModal: React.FC<ApplicationFlowEditorModalProps> = ({
  isOpen,
  onClose,
  block,
  onUpdateBlock,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

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

  // Check if booking step exists
  const hasBookingStep = steps.some(s => s.type === 'booking');
  const hasCaptureStep = steps.some(s => s.type === 'capture');

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
    if (steps.length <= 1) return;
    const newSteps = steps.filter(s => s.id !== stepId);
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const activeStep = activeId ? steps.find(s => s.id === activeId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {block.label || 'Application Flow'}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {steps.length} steps · Typeform-style experience
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Steps List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Steps</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-md transition-colors">
                      <Plus className="w-3 h-3" />
                      Add Step
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem onClick={() => addStep('welcome')} className="text-sm">
                      {stepTypeIcons.welcome} <span className="ml-2">Welcome Screen</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addStep('question')} className="text-sm">
                      {stepTypeIcons.question} <span className="ml-2">Question</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addStep('capture')} className="text-sm">
                      {stepTypeIcons.capture} <span className="ml-2">Capture Info</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addStep('booking')} className="text-sm">
                      {stepTypeIcons.booking} <span className="ml-2">Book a Call</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addStep('ending')} className="text-sm">
                      {stepTypeIcons.ending} <span className="ml-2">Thank You</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {steps.map((step, index) => (
                    <SortableStepItem
                      key={step.id}
                      step={step}
                      index={index}
                      isSelected={step.id === selectedStepId}
                      totalSteps={steps.length}
                      allSteps={steps}
                      onSelect={() => setSelectedStepId(step.id)}
                      onDuplicate={() => duplicateStep(step.id)}
                      onDelete={() => deleteStep(step.id)}
                      onRename={(name) => updateStep(step.id, { name })}
                      onUpdateNavigation={(nav) => updateStep(step.id, { navigation: nav })}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeStep ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shadow-xl border border-indigo-300 dark:border-indigo-700">
                      {stepTypeIcons[activeStep.type]}
                      <span className="text-sm font-medium">{activeStep.name}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Booking Suggestion */}
              {hasCaptureStep && !hasBookingStep && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Suggestion
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Add a Booking Step after capture to schedule calls.
                      </p>
                      <button
                        onClick={() => addStep('booking')}
                        className="mt-2 px-3 py-1 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                      >
                        Add Booking Step
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Step Configuration */}
          <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-900">
            {selectedStep ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                      stepTypeColors[selectedStep.type]
                    )}>
                      {stepTypeIcons[selectedStep.type]}
                      {stepTypeLabels[selectedStep.type]}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedStep.name}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Navigation Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        After This Step
                      </span>
                    </div>

                    <div className="space-y-3">
                      <Select
                        value={selectedStep.navigation.action}
                        onValueChange={(value: 'next' | 'go-to-step' | 'submit' | 'redirect') => {
                          updateStep(selectedStep.id, {
                            navigation: { ...selectedStep.navigation, action: value }
                          });
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="next">Go to Next Step</SelectItem>
                          <SelectItem value="go-to-step">Jump to Specific Step</SelectItem>
                          <SelectItem value="submit">Submit & Complete</SelectItem>
                          <SelectItem value="redirect">Redirect to URL</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectedStep.navigation.action === 'go-to-step' && (
                        <Select
                          value={selectedStep.navigation.targetStepId || ''}
                          onValueChange={(value) => {
                            updateStep(selectedStep.id, {
                              navigation: { ...selectedStep.navigation, targetStepId: value }
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select target step" />
                          </SelectTrigger>
                          <SelectContent>
                            {steps.filter(s => s.id !== selectedStep.id).map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {selectedStep.navigation.action === 'redirect' && (
                        <Input
                          type="url"
                          placeholder="https://example.com"
                          value={selectedStep.navigation.redirectUrl || ''}
                          onChange={(e) => {
                            updateStep(selectedStep.id, {
                              navigation: { ...selectedStep.navigation, redirectUrl: e.target.value }
                            });
                          }}
                          className="h-9 text-sm"
                        />
                      )}
                    </div>

                    {/* Helper text */}
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
                      💡 Submit can go to any step — even a different page in your funnel.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a step to configure</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Typical flow: Qualify → Capture → Book → Thank You
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
