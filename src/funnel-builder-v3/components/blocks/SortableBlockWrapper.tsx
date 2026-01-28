/**
 * SortableBlockWrapper - DnD wrapper for blocks
 * Uses dnd-kit for smooth drag-and-drop reordering
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableBlockWrapperProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  previewMode: boolean;
}

export function SortableBlockWrapper({ 
  id, 
  children, 
  isSelected,
  previewMode 
}: SortableBlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: previewMode });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  // Hide drag handle in preview mode
  if (previewMode) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "builder-v3-block-wrapper group relative",
        isDragging && "builder-v3-block-dragging"
      )}
    >
      {/* Drag Handle - only visible on hover */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "builder-v3-drag-handle",
          "absolute -left-8 top-1/2 -translate-y-1/2",
          "w-6 h-8 flex items-center justify-center",
          "rounded cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-[hsl(var(--builder-v3-surface))] border border-[hsl(var(--builder-v3-border))]",
          "hover:bg-[hsl(var(--builder-v3-surface-hover))]",
          isSelected && "opacity-100"
        )}
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-3.5 h-3.5 text-[hsl(var(--builder-v3-text-muted))]" />
      </div>
      
      {children}
    </div>
  );
}
