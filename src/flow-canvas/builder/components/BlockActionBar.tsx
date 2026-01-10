import React, { useLayoutEffect, useRef, useState } from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  Plus,
  GripVertical,
  MoreHorizontal
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
  const barRef = useRef<HTMLDivElement>(null);
  const [xOffset, setXOffset] = useState(0);
  const [computedPosition, setComputedPosition] = useState<'left' | 'right'>(position);

  // Dynamically clamp the bar inside the device frame
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // Find the device frame boundary
    const frame = bar.closest('.device-frame') as HTMLElement | null;
    if (!frame) return;

    const compute = () => {
      // Reset transform
      setXOffset(0);
      setComputedPosition(position);

      requestAnimationFrame(() => {
        const frameRect = frame.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        const padding = 12;

        // If bar would clip left edge of frame, shift it inside
        let dx = 0;
        if (barRect.left < frameRect.left + padding) {
          dx = (frameRect.left + padding) - barRect.left;
        }
        // If bar would clip right edge of frame, shift it inside
        if (barRect.right > frameRect.right - padding) {
          dx = (frameRect.right - padding) - barRect.right;
        }

        setXOffset(dx);
      });
    };

    compute();

    const onResize = () => compute();
    window.addEventListener('resize', onResize);

    const ro = new ResizeObserver(() => compute());
    ro.observe(frame);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [blockId, position]);

  const positionClasses = computedPosition === 'left' 
    ? 'right-full mr-2' 
    : 'left-full ml-2';

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        ref={barRef}
        className={cn(
          'absolute top-1/2 -translate-y-1/2',
          positionClasses,
          'flex flex-col gap-0.5 p-1 rounded-lg',
          'bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))]',
          'shadow-lg opacity-0 group-hover/block:opacity-100 transition-opacity duration-150',
          'z-[9000]'
        )}
        style={{
          transform: `translateY(-50%) translateX(${xOffset}px)`,
        }}
      >
        {/* Drag Handle - connected to @dnd-kit when dragHandleProps provided */}
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
          <TooltipContent side={position === 'left' ? 'left' : 'right'}>
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
          <TooltipContent side={position === 'left' ? 'left' : 'right'}>
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
          <TooltipContent side={position === 'left' ? 'left' : 'right'}>
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
          <TooltipContent side={position === 'left' ? 'left' : 'right'}>
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
          <TooltipContent side={position === 'left' ? 'left' : 'right'}>
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
            side={position === 'left' ? 'left' : 'right'}
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
      </div>
    </TooltipProvider>
  );
};