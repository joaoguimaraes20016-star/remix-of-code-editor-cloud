import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DroppableStageColumnProps {
  id: string;
  children: ReactNode;
}

export function DroppableStageColumn({ id, children }: DroppableStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col flex-shrink-0 transition-all ${
        isOver ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{ width: '300px' }}
    >
      {children}
    </div>
  );
}
