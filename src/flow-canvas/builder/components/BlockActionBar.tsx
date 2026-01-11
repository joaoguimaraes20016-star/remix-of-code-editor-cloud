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
import { motion, AnimatePresence } from 'framer-motion';

interface BlockActionBarProps {
  blockId: string;
  blockLabel: string;
  position: 'left' | 'right';
  isSelected: boolean;
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
  isSelected,
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
  const tooltipSide = position === 'left' ? 'right' : 'left';

  return (
    <AnimatePresence>
      {isSelected && (
        <TooltipProvider delayDuration={300}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: position === 'left' ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: position === 'left' ? -8 : 8 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'absolute',
              position === 'left' ? 'left-2 top-1/2' : 'right-2 top-1/2',
              'flex flex-col gap-0.5 p-1 rounded-lg',
              'bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))]',
              'shadow-lg z-[60] pointer-events-auto'
            )}
            style={{ transform: 'translateY(-50%)' }}
          >
            {/* Block Drag Handle - connected to @dnd-kit for reordering blocks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...(dragHandleProps?.attributes || {})}
                  {...(dragHandleProps?.listeners || {})}
                  className="p-1.5 rounded bg-[hsl(var(--builder-accent)/0.1)] text-[hsl(var(--builder-accent))] hover:bg-[hsl(var(--builder-accent)/0.2)] cursor-grab active:cursor-grabbing transition-colors"
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
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    canMoveUp 
                      ? 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]' 
                      : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-dim))] cursor-not-allowed opacity-50'
                  )}
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
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    canMoveDown 
                      ? 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]' 
                      : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-dim))] cursor-not-allowed opacity-50'
                  )}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
};
