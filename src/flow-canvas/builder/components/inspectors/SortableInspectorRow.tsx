/**
 * SortableInspectorRow - Reusable sortable row for inspector lists
 * 
 * GUARANTEED FIX for drag-and-drop:
 * 1. Using setActivatorNodeRef to make ONLY the handle draggable
 * 2. Handle has larger hit area (min-h-6, min-w-6)
 * 3. Handle is a div (not button) to avoid focus issues
 * 4. Applies touch-action: none via inline style for cross-browser reliability
 * 5. NO event.stopPropagation() on the handle - dnd-kit needs events to bubble
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  // Inline style for the handle to ensure touch-action works cross-browser
  const handleStyle: React.CSSProperties = {
    touchAction: 'none',
    userSelect: 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn("flex items-center gap-2 group relative", className)}
    >
      {/* Drag Handle - div with role="button" for better event handling */}
      <div
        ref={setActivatorNodeRef}
        role="button"
        tabIndex={0}
        style={handleStyle}
        {...attributes}
        {...listeners}
        className="flex-shrink-0 min-w-6 min-h-6 flex items-center justify-center 
                   rounded cursor-grab active:cursor-grabbing 
                   opacity-40 hover:opacity-100 group-hover:opacity-100 
                   transition-opacity hover:bg-builder-surface-hover
                   focus:outline-none focus-visible:ring-1 focus-visible:ring-builder-accent"
      >
        <GripVertical className="w-4 h-4 text-builder-text-muted" />
      </div>
      {children}
    </div>
  );
}
