import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { AutomationStep } from "@/lib/automations/types";
import { StepCard } from "./StepCard";
import { ArrowDown } from "lucide-react";

interface StepsListProps {
  steps: AutomationStep[];
  onReorder: (steps: AutomationStep[]) => void;
  onStepUpdate: (stepId: string, updates: Partial<AutomationStep>) => void;
  onStepDelete: (stepId: string) => void;
  teamId: string;
}

export function StepsList({
  steps,
  onReorder,
  onStepUpdate,
  onStepDelete,
  teamId,
}: StepsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(steps, oldIndex, newIndex).map((step, idx) => ({
        ...step,
        order: idx + 1,
      }));
      onReorder(reordered);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg text-center">
        <p className="text-muted-foreground mb-1">No action steps yet</p>
        <p className="text-sm text-muted-foreground">
          Click "Add Step" below to create your first action
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={steps.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id}>
              {index > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <StepCard
                step={step}
                onUpdate={(updates) => onStepUpdate(step.id, updates)}
                onDelete={() => onStepDelete(step.id)}
                teamId={teamId}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
