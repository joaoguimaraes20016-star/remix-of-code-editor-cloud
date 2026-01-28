/**
 * SortableBlockWrapper - DnD wrapper for blocks
 * Uses dnd-kit for smooth drag-and-drop reordering
 * Now includes ElementActionBar for quick actions
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { ElementActionBar } from './ElementActionBar';
import { Block } from '../../types/funnel';

interface SortableBlockWrapperProps {
  id: string;
  block: Block;
  children: React.ReactNode;
  isSelected: boolean;
  previewMode: boolean;
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function SortableBlockWrapper({ 
  id, 
  block,
  children, 
  isSelected,
  previewMode,
  onAlignChange,
  onDuplicate,
  onDelete,
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

  // Hide all editing UI in preview mode
  if (previewMode) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "builder-v3-block-wrapper group/block relative",
        isDragging && "builder-v3-block-dragging"
      )}
    >
      {/* ElementActionBar - floating toolbar on hover */}
      <ElementActionBar
        blockId={block.id}
        blockType={block.type}
        currentAlign={block.props.align}
        onAlignChange={onAlignChange}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
      
      {/* Drag Handle - integrates with dnd-kit */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "builder-v3-drag-handle",
          "absolute -left-8 top-1/2 -translate-y-1/2",
          "w-6 h-8 flex items-center justify-center",
          "rounded cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover/block:opacity-100 transition-opacity",
          "bg-[hsl(var(--builder-v3-surface))] border border-[hsl(var(--builder-v3-border))]",
          "hover:bg-[hsl(var(--builder-v3-surface-hover))]",
          isSelected && "opacity-100"
        )}
        style={{ touchAction: 'none' }}
      >
        <svg className="w-3.5 h-3.5 text-[hsl(var(--builder-v3-text-muted))]" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>
      
      {children}
    </div>
  );
}
