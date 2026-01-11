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
        <TooltipProvider delayDuration={500}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: position === 'left' ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: position === 'left' ? -8 : 8 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'absolute',
              position === 'left' ? 'left-3 top-1/2' : 'right-3 top-1/2',
              'flex flex-col gap-1 p-1.5 rounded-xl',
              'bg-[hsl(220,10%,10%)]/95 backdrop-blur-xl',
              'border border-white/[0.08]',
              'shadow-2xl shadow-black/50 z-[60] pointer-events-auto'
            )}
            style={{ transform: 'translateY(-50%)' }}
          >
            {/* Block Drag Handle - connected to @dnd-kit for reordering blocks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...(dragHandleProps?.attributes || {})}
                  {...(dragHandleProps?.listeners || {})}
                  className="p-2 rounded-lg bg-[hsl(var(--builder-accent))]/20 text-[hsl(var(--builder-accent))] hover:bg-[hsl(var(--builder-accent))]/30 cursor-grab active:cursor-grabbing transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <GripVertical size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>
                <p>Drag to reorder</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-full h-px bg-white/10" />

            {/* Move Up */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className={cn(
                    'p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center',
                    canMoveUp 
                      ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95' 
                      : 'text-white/20 cursor-not-allowed'
                  )}
                >
                  <ChevronUp size={16} />
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
                    'p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center',
                    canMoveDown 
                      ? 'text-white/60 hover:text-white hover:bg-white/10 active:scale-95' 
                      : 'text-white/20 cursor-not-allowed'
                  )}
                >
                  <ChevronDown size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>
                <p>Move down</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-full h-px bg-white/10" />

            {/* Duplicate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDuplicate}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Copy size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>
                <p>Duplicate</p>
              </TooltipContent>
            </Tooltip>

            {/* Delete */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/20 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-full h-px bg-white/10" />

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side={tooltipSide}
                className="bg-[hsl(220,10%,10%)]/95 backdrop-blur-xl border-white/[0.08]"
              >
                <DropdownMenuItem 
                  onClick={onAddAbove}
                  className="text-white focus:bg-white/10"
                >
                  <Plus size={14} className="mr-2" />
                  Add block above
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onAddBelow}
                  className="text-white focus:bg-white/10"
                >
                  <Plus size={14} className="mr-2" />
                  Add block below
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={onDuplicate}
                  className="text-white focus:bg-white/10"
                >
                  <Copy size={14} className="mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-400 focus:bg-red-500/20"
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
