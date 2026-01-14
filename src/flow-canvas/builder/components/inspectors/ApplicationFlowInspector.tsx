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
  ChevronDown,
  ChevronRight,
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
  ending: 'Ending',
};

interface ApplicationFlowInspectorProps {
  block: Block;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onSelectStep?: (stepId: string) => void;
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

// Sortable Step Item
interface SortableStepItemProps {
  step: ApplicationFlowStep;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
  totalSteps: number;
  allSteps: ApplicationFlowStep[];
  onSelect: () => void;
  onToggleExpand: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onUpdateNavigation: (nav: ApplicationFlowStep['navigation']) => void;
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  isActive,
  isExpanded,
  totalSteps,
  allSteps,
  onSelect,
  onToggleExpand,
  onDuplicate,
  onDelete,
  onRename,
  onUpdateNavigation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;

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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(step.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== step.name) {
      onRename(editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(step.name);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-0">
      <div
        className={cn(
          'group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150',
          isActive 
            ? 'bg-builder-accent/15 ring-1 ring-builder-accent/30' 
            : 'bg-builder-surface hover:bg-builder-surface-hover',
          isDragging && 'opacity-50 z-50 shadow-lg'
        )}
        onClick={() => !isEditing && onSelect()}
      >
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-3 h-3 text-builder-text-dim" />
        </div>

        {/* Step Number Badge */}
        <div className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
          isFirst ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
          isLast ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' :
          isActive ? 'bg-builder-accent text-white' : 'bg-builder-surface-active text-builder-text-muted'
        )}>
          {isFirst ? '★' : isLast ? '✓' : index}
        </div>

        {/* Step Info */}
        <div className="flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full text-xs bg-transparent border-b border-builder-accent outline-none text-builder-text"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className={cn(
              "text-xs font-medium truncate",
              isActive ? "text-builder-accent" : "text-builder-text"
            )}>
              {step.name}
            </div>
          )}
        </div>

        {/* Step Type Icon */}
        <div className={cn(
          "shrink-0",
          isActive ? "text-builder-accent" : "text-builder-text-muted"
        )}>
          {stepTypeIcons[step.type]}
        </div>

        {/* Expand/Collapse */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="p-0.5 rounded hover:bg-builder-surface-active transition-all shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-builder-text-muted" />
          ) : (
            <ChevronRight className="w-3 h-3 text-builder-text-muted" />
          )}
        </button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-builder-surface-active transition-all shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3 text-builder-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-builder-surface border-builder-border">
            <DropdownMenuItem 
              onClick={() => {
                setEditValue(step.name);
                setIsEditing(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="text-builder-text hover:bg-builder-surface-hover text-xs"
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDuplicate}
              className="text-builder-text hover:bg-builder-surface-hover text-xs"
            >
              <Copy className="w-3 h-3 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-builder-border-subtle" />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-builder-error hover:bg-builder-error/10 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded Navigation Config */}
      {isExpanded && (
        <div className="ml-8 mt-1 p-2 rounded-lg bg-builder-bg border border-builder-border-subtle space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-builder-text-muted uppercase">After This Step</Label>
            <Select 
              value={step.navigation.action}
              onValueChange={(value) => onUpdateNavigation({ ...step.navigation, action: value as any })}
            >
              <SelectTrigger className="h-7 text-xs bg-builder-surface border-builder-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-builder-surface border-builder-border">
                <SelectItem value="next" className="text-xs">Go to Next Step</SelectItem>
                <SelectItem value="go-to-step" className="text-xs">Jump to Step...</SelectItem>
                <SelectItem value="submit" className="text-xs">Submit Form</SelectItem>
                <SelectItem value="redirect" className="text-xs">Redirect to URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {step.navigation.action === 'go-to-step' && (
            <div className="space-y-1">
              <Label className="text-[10px] text-builder-text-muted uppercase">Target Step</Label>
              <Select 
                value={step.navigation.targetStepId || ''}
                onValueChange={(value) => onUpdateNavigation({ ...step.navigation, targetStepId: value })}
              >
                <SelectTrigger className="h-7 text-xs bg-builder-surface border-builder-border">
                  <SelectValue placeholder="Select step..." />
                </SelectTrigger>
                <SelectContent className="bg-builder-surface border-builder-border">
                  {allSteps.filter(s => s.id !== step.id).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step.navigation.action === 'redirect' && (
            <div className="space-y-1">
              <Label className="text-[10px] text-builder-text-muted uppercase">Redirect URL</Label>
              <Input
                value={step.navigation.redirectUrl || ''}
                onChange={(e) => onUpdateNavigation({ ...step.navigation, redirectUrl: e.target.value })}
                placeholder="https://..."
                className="h-7 text-xs bg-builder-surface border-builder-border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ApplicationFlowInspector: React.FC<ApplicationFlowInspectorProps> = ({
  block,
  onUpdateBlock,
  onSelectStep,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
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
    const newSteps = steps.filter(s => s.id !== stepId);
    onUpdateBlock({ props: { ...settings, steps: newSteps } });
  };

  const activeStep = activeId ? steps.find(s => s.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(var(--builder-accent))]/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--builder-accent))]/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[hsl(var(--builder-accent))]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-builder-text">Application Flow</div>
            <div className="text-[10px] text-builder-text-muted">{steps.length} steps</div>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto builder-scroll p-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-builder-text-muted uppercase tracking-wide">Steps</span>
        </div>

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
                isActive={step.id === selectedStepId}
                isExpanded={step.id === expandedStepId}
                totalSteps={steps.length}
                allSteps={steps}
                onSelect={() => {
                  setSelectedStepId(step.id);
                  onSelectStep?.(step.id);
                }}
                onToggleExpand={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                onDuplicate={() => duplicateStep(step.id)}
                onDelete={() => deleteStep(step.id)}
                onRename={(name) => updateStep(step.id, { name })}
                onUpdateNavigation={(nav) => updateStep(step.id, { navigation: nav })}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeStep ? (
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-builder-surface-active text-builder-text shadow-xl border border-builder-accent">
                <GripVertical className="w-3 h-3 text-builder-text-dim" />
                <span className="text-xs font-medium text-builder-accent">{activeStep.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add Step Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg bg-builder-accent/10 text-builder-accent hover:bg-builder-accent/20 text-xs font-medium transition-colors">
              <Plus className="w-3 h-3" />
              Add Step
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-builder-surface border-builder-border">
            <DropdownMenuItem onClick={() => addStep('welcome')} className="text-xs">
              {stepTypeIcons.welcome} <span className="ml-2">Welcome Screen</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('question')} className="text-xs">
              {stepTypeIcons.question} <span className="ml-2">Question</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('capture')} className="text-xs">
              {stepTypeIcons.capture} <span className="ml-2">Capture Info</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('booking')} className="text-xs">
              {stepTypeIcons.booking} <span className="ml-2">Book a Call</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep('ending')} className="text-xs">
              {stepTypeIcons.ending} <span className="ml-2">Thank You</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Flow Settings */}
      <div className="border-t border-builder-border p-3 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-3 h-3 text-builder-text-muted" />
          <span className="text-[10px] font-medium text-builder-text-muted uppercase tracking-wide">Flow Settings</span>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-builder-text-muted">Display Mode</Label>
          <div className="flex rounded-md overflow-hidden border border-builder-border">
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, displayMode: 'one-at-a-time' } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.displayMode === 'one-at-a-time' 
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover'
              )}
            >
              One at a Time
            </button>
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, displayMode: 'all-visible' } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.displayMode === 'all-visible' 
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover'
              )}
            >
              All Visible
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-builder-text-muted">Progress Bar</Label>
          <div className="flex rounded-md overflow-hidden border border-builder-border">
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, showProgress: true } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                settings.showProgress 
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover'
              )}
            >
              Show
            </button>
            <button
              onClick={() => onUpdateBlock({ props: { ...settings, showProgress: false } })}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
                !settings.showProgress 
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface text-builder-text-muted hover:bg-builder-surface-hover'
              )}
            >
              Hide
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-builder-text-muted">Transition</Label>
          <Select 
            value={settings.transition || 'slide-up'}
            onValueChange={(value) => onUpdateBlock({ props: { ...settings, transition: value } })}
          >
            <SelectTrigger className="h-7 text-xs bg-builder-surface border-builder-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-builder-surface border-builder-border">
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
