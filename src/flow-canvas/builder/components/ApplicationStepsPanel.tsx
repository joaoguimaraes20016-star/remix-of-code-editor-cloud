import React, { useState } from 'react';
import { Step, Frame, Block } from '../../types/infostack';
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
  ChevronRight,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ApplicationStepsPanelProps {
  steps: Step[];
  activeStepId: string | null;
  onStepSelect: (stepId: string) => void;
  onReorderSteps: (fromIndex: number, toIndex: number) => void;
  onAddStep: () => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (stepId: string) => void;
  onRenameStep?: (stepId: string, newName: string) => void;
}

// Detect step type from its content for icon display
const detectStepType = (step: Step): 'welcome' | 'question' | 'capture' | 'content' | 'booking' | 'ending' => {
  const blocks = step.frames.flatMap(f => f.stacks.flatMap(s => s.blocks));
  const elements = blocks.flatMap(b => b.elements);
  
  // Check for booking/calendly
  if (blocks.some(b => b.type === 'booking')) return 'booking';
  
  // Check for capture fields (email, phone inputs)
  const hasEmailInput = elements.some(e => e.type === 'input' && (e.props?.type === 'email' || e.props?.fieldKey === 'email'));
  const hasPhoneInput = elements.some(e => e.type === 'input' && (e.props?.type === 'tel' || e.props?.fieldKey === 'phone'));
  if (hasEmailInput || hasPhoneInput) return 'capture';
  
  // Check for question (radio/checkbox)
  const hasQuestion = elements.some(e => e.type === 'radio' || e.type === 'checkbox');
  if (hasQuestion) return 'question';
  
  // Check for thank you / ending content
  const content = elements.map(e => (e.content || '').toLowerCase()).join(' ');
  if (content.includes('thank') || content.includes('success') || content.includes('all set') || content.includes('🎉')) return 'ending';
  
  // Check for welcome (usually first step with a start button)
  if (content.includes('welcome') || content.includes('get started') || content.includes('start')) return 'welcome';
  
  return 'content';
};

const stepTypeIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  capture: <UserPlus className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  ending: <CheckCircle2 className="w-4 h-4" />,
};

const stepTypeLabels: Record<string, string> = {
  welcome: 'Welcome',
  question: 'Question',
  capture: 'Capture',
  content: 'Content',
  booking: 'Booking',
  ending: 'Ending',
};

// Sortable Step Item
interface SortableStepItemProps {
  step: Step;
  index: number;
  isActive: boolean;
  totalSteps: number;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  index,
  isActive,
  totalSteps,
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const stepType = detectStepType(step);
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
      onRename?.(editValue.trim());
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150',
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
        <GripVertical className="w-4 h-4 text-builder-text-dim" />
      </div>

      {/* Step Number Badge */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
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
            className="w-full text-sm bg-transparent border-b border-builder-accent outline-none text-builder-text"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-builder-accent" : "text-builder-text"
            )}>
              {step.name || `Step ${index + 1}`}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "text-[10px] uppercase tracking-wide font-medium",
                isActive ? "text-builder-accent/70" : "text-builder-text-dim"
              )}>
                {stepTypeLabels[stepType]}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Step Type Icon */}
      <div className={cn(
        "shrink-0",
        isActive ? "text-builder-accent" : "text-builder-text-muted"
      )}>
        {stepTypeIcons[stepType]}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-builder-surface-active transition-all shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4 text-builder-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-builder-surface border-builder-border">
          <DropdownMenuItem 
            onClick={() => {
              setEditValue(step.name);
              setIsEditing(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="text-builder-text hover:bg-builder-surface-hover"
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDuplicate}
            className="text-builder-text hover:bg-builder-surface-hover"
          >
            <Copy className="w-3.5 h-3.5 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-builder-border-subtle" />
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-builder-error hover:bg-builder-error/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Drag Overlay
const DragOverlayItem: React.FC<{ step: Step; index: number; totalSteps: number }> = ({ step, index, totalSteps }) => {
  const stepType = detectStepType(step);
  const isFirst = index === 0;
  const isLast = index === totalSteps - 1;
  
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-builder-surface-active text-builder-text shadow-xl border border-builder-accent">
      <GripVertical className="w-4 h-4 text-builder-text-dim" />
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
        isFirst ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
        isLast ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' :
        'bg-builder-accent text-white'
      )}>
        {isFirst ? '★' : isLast ? '✓' : index}
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-builder-accent">
          {step.name || `Step ${index + 1}`}
        </span>
      </div>
      {stepTypeIcons[stepType]}
    </div>
  );
};

export const ApplicationStepsPanel: React.FC<ApplicationStepsPanelProps> = ({
  steps,
  activeStepId,
  onStepSelect,
  onReorderSteps,
  onAddStep,
  onDeleteStep,
  onDuplicateStep,
  onRenameStep,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

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
      onReorderSteps(oldIndex, newIndex);
    }
  };

  const activeStep = activeId ? steps.find(s => s.id === activeId) : null;
  const activeIndex = activeId ? steps.findIndex(s => s.id === activeId) : -1;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-builder-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-builder-text">Flow Container</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-builder-accent/10 text-builder-accent">
            {steps.length} steps
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto builder-scroll px-3 py-3 space-y-2">
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
                isActive={step.id === activeStepId}
                totalSteps={steps.length}
                onSelect={() => onStepSelect(step.id)}
                onDuplicate={() => onDuplicateStep(step.id)}
                onDelete={() => onDeleteStep(step.id)}
                onRename={onRenameStep ? (name) => onRenameStep(step.id, name) : undefined}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeStep ? (
              <DragOverlayItem step={activeStep} index={activeIndex} totalSteps={steps.length} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Step Button */}
      <div className="p-3 border-t border-builder-border-subtle">
        <button 
          onClick={onAddStep}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-builder-accent/10 text-builder-accent hover:bg-builder-accent/20 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>
    </div>
  );
};
