import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Play, MessageSquare, List, Mail, Phone, Video, CheckCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FunnelStep } from '@/pages/FunnelEditor';

interface PagesListProps {
  steps: FunnelStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onAddStep: () => void;
}

const stepTypeIcons = {
  welcome: Play,
  text_question: MessageSquare,
  multi_choice: List,
  email_capture: Mail,
  phone_capture: Phone,
  video: Video,
  thank_you: CheckCircle,
};

function PageItem({
  step,
  index,
  isSelected,
  onSelect,
  onDelete,
  canDelete,
}: {
  step: FunnelStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = stepTypeIcons[step.step_type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
        isSelected 
          ? "bg-primary/20 text-primary" 
          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <span className={cn(
        "text-sm font-medium w-5",
        isSelected ? "text-primary" : "text-muted-foreground"
      )}>
        {index + 1}
      </span>

      <Icon className={cn(
        "h-4 w-4",
        isSelected ? "text-primary" : "text-muted-foreground"
      )} />

      <span className={cn(
        "flex-1 truncate text-sm",
        isSelected ? "text-primary font-medium" : ""
      )}>
        {step.content.headline || 'Untitled'}
      </span>

      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function PagesList({
  steps,
  selectedStepId,
  onSelectStep,
  onDeleteStep,
  onAddStep,
}: PagesListProps) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
        Pages
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-1">
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {steps.map((step, index) => (
            <PageItem
              key={step.id}
              step={step}
              index={index}
              isSelected={step.id === selectedStepId}
              onSelect={() => onSelectStep(step.id)}
              onDelete={() => onDeleteStep(step.id)}
              canDelete={step.step_type !== 'welcome' && step.step_type !== 'thank_you'}
            />
          ))}
        </SortableContext>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-4 gap-2"
        onClick={onAddStep}
      >
        <Plus className="h-4 w-4" />
        Add page
      </Button>
    </div>
  );
}
