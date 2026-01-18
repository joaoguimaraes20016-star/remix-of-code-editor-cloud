/**
 * SortableInspectorRow - Reusable sortable row for inspector lists
 * 
 * FIXES the drag-and-drop issues by:
 * 1. Using setActivatorNodeRef to make ONLY the handle draggable
 * 2. Making the handle always visible (opacity 40%, 100% on hover)
 * 3. Proper hit area for the drag handle
 * 4. touch-none, select-none, cursor-grab for reliability
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableInspectorRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableInspectorRow({ id, children, className }: SortableInspectorRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn("flex items-center gap-2 group", className)}
    >
      {/* Drag Handle - ONLY this element initiates drag */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 -ml-1 rounded cursor-grab active:cursor-grabbing 
                   opacity-40 hover:opacity-100 group-hover:opacity-100 
                   transition-opacity touch-none select-none
                   hover:bg-builder-surface-hover"
        onPointerDownCapture={(e) => {
          // Stop propagation so parent handlers don't interfere
          e.stopPropagation();
        }}
      >
        <GripVertical className="w-3 h-3 text-builder-text-muted" />
      </button>
      {children}
    </div>
  );
}
