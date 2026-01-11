import React from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  Plus,
  GripVertical,
  MoreHorizontal,
  Move
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSmartPlacement } from '../hooks/useSmartPlacement';

interface BlockActionBarProps {
  blockId: string;
  blockLabel: string;
  position: 'left' | 'right';
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  trackingId?: string;
  onTrackingIdChange?: (id: string) => void;
  // Drag handle props from @dnd-kit
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  };
}

export const BlockActionBar: React.FC<BlockActionBarProps> = ({
  blockId,
  blockLabel,
  position,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
  trackingId,
  onTrackingIdChange,
  dragHandleProps,
}) => {
  // Smart placement with prefer-inside strategy and manual drag support
  const {
    ref,
    computedSide,
    manualOffset,
    isDragging,
    dragHandleProps: positionDragProps,
    resetPosition,
  } = useSmartPlacement({
    preferredSide: position,
    strategy: 'prefer-inside',
    edgePadding: 12,
    draggable: true,
    placementKey: `block-action-${blockId}`,
  });

  // Position classes based on computed side (inside the block)
  const getPositionClasses = () => {
    switch (computedSide) {
      case 'left':
        return 'left-2 top-1/2';
      case 'right':
        return 'right-2 top-1/2';
      default:
        return 'left-2 top-1/2';
    }
  };

  const tooltipSide = computedSide === 'left' ? 'right' : 'left';

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        ref={ref}
        className={cn(
          'absolute',
          getPositionClasses(),
          'flex flex-col gap-0.5 p-1 rounded-lg',
          'bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))]',
          'shadow-lg opacity-0 group-hover/block:opacity-100 transition-opacity duration-150',
          'z-[60]',
          'pointer-events-auto',
          isDragging && 'cursor-grabbing shadow-2xl'
        )}
        style={{
          transform: `translateY(-50%) translate(${manualOffset.x}px, ${manualOffset.y}px)`,
        }}
      >
        {/* Position drag handle - for manually repositioning the bar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              {...positionDragProps}
              className="p-1 rounded bg-[hsl(var(--builder-accent)/0.1)] text-[hsl(var(--builder-accent))] hover:bg-[hsl(var(--builder-accent)/0.2)] transition-colors"
              title="Drag to reposition toolbar"
            >
              <Move size={10} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Drag to reposition</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-full h-px bg-[hsl(var(--builder-border))]" />

        {/* Block Drag Handle - connected to @dnd-kit for reordering blocks */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              {...(dragHandleProps?.attributes || {})}
              {...(dragHandleProps?.listeners || {})}
              className="p-1.5 rounded bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))] cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Drag to reorder</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-full h-px bg-[hsl(var(--builder-border))]" />

        {/* Move Up */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`
                p-1.5 rounded transition-colors
                ${canMoveUp 
                  ? 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]' 
                  : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-dim))] cursor-not-allowed opacity-50'
                }
              `}
            >
              <ChevronUp size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Move up</p>
          </TooltipContent>
        </Tooltip>

        {/* Move Down */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`
                p-1.5 rounded transition-colors
                ${canMoveDown 
                  ? 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]' 
                  : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-dim))] cursor-not-allowed opacity-50'
                }
              `}
            >
              <ChevronDown size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Move down</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-full h-px bg-[hsl(var(--builder-border))]" />

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))] transition-colors"
            >
              <Copy size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Duplicate (Cmd+D)</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDelete}
              className="p-1.5 rounded bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-error))] hover:bg-[hsl(var(--builder-error)/0.15)] transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-full h-px bg-[hsl(var(--builder-border))]" />

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side={tooltipSide}
            className="bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
          >
            <DropdownMenuItem 
              onClick={onAddAbove}
              className="text-[hsl(var(--builder-text))] focus:bg-[hsl(var(--builder-surface-hover))]"
            >
              <Plus size={14} className="mr-2" />
              Add block above
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onAddBelow}
              className="text-[hsl(var(--builder-text))] focus:bg-[hsl(var(--builder-surface-hover))]"
            >
              <Plus size={14} className="mr-2" />
              Add block below
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
            <DropdownMenuItem 
              onClick={onDuplicate}
              className="text-[hsl(var(--builder-text))] focus:bg-[hsl(var(--builder-surface-hover))]"
            >
              <Copy size={14} className="mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-[hsl(var(--builder-error))] focus:bg-[hsl(var(--builder-error)/0.1)]"
            >
              <Trash2 size={14} className="mr-2" />
              Delete block
            </DropdownMenuItem>
            {manualOffset.x !== 0 || manualOffset.y !== 0 ? (
              <>
                <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
                <DropdownMenuItem 
                  onClick={resetPosition}
                  className="text-[hsl(var(--builder-text-muted))] focus:bg-[hsl(var(--builder-surface-hover))]"
                >
                  <Move size={14} className="mr-2" />
                  Reset toolbar position
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};
