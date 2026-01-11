import React, { useEffect, useMemo, useState } from 'react';
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
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
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
  /** Device mode from builder - controls mobile layout */
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  /** Target element ref for portal positioning */
  targetRef?: React.RefObject<HTMLElement>;
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
  deviceMode = 'desktop',
  targetRef,
}) => {
  const tooltipSide = position === 'left' ? 'right' : 'left';
  const isMobilePreview = deviceMode === 'mobile';
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    if (!isSelected) setMobileExpanded(false);
  }, [isSelected]);

  const portalContainer = useMemo(() => {
    let el = document.getElementById('toolbar-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toolbar-portal-root';
      el.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9999;';
      document.body.appendChild(el);
    }
    return el;
  }, []);

  if (!isSelected) return null;

  // ---------------------------------------------------------------------------
  // Mobile: compact 3-dot menu near the block (instead of the big vertical rail)
  // ---------------------------------------------------------------------------
  if (isMobilePreview) {
    const rect = targetRef?.current?.getBoundingClientRect();
    const top = rect ? rect.top + 8 : 8;
    const left = rect ? rect.left + 8 : 8;

    const btnBase = 'flex items-center justify-center transition-colors';

    const circleBtn = cn(
      btnBase,
      'w-8 h-8 rounded-lg',
      'bg-[hsl(var(--builder-surface))]/90 backdrop-blur-md',
      'border border-[hsl(315,85%,58%)/0.2]',
      'shadow-md text-white/70'
    );

    const pill = cn(
      'flex items-center gap-0.5 p-0.5 rounded-lg',
      'bg-[hsl(var(--builder-surface))]/90 backdrop-blur-md',
      'border border-[hsl(315,85%,58%)/0.2]',
      'shadow-md pointer-events-auto'
    );

    const iconBtn = (disabled?: boolean) =>
      cn(
        btnBase,
        'w-7 h-7 rounded-md',
        disabled
          ? 'text-white/20 cursor-not-allowed'
          : 'text-white/60 hover:text-white hover:bg-[hsl(315,85%,58%)/0.1]'
      );

    const node = (
      <div
        className="pointer-events-none"
        style={{ position: 'fixed', top, left, zIndex: 9999 }}
      >
        <AnimatePresence mode="wait">
          {!mobileExpanded ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => { e.stopPropagation(); setMobileExpanded(true); }}
              className={cn(circleBtn, 'pointer-events-auto')}
            >
              <MoreHorizontal size={14} />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className={pill}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={(e) => { e.stopPropagation(); setMobileExpanded(false); }} className={iconBtn()}>
                <X size={12} />
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={!canMoveUp} className={iconBtn(!canMoveUp)}>
                <ChevronUp size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={!canMoveDown} className={iconBtn(!canMoveDown)}>
                <ChevronDown size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className={iconBtn()}>
                <Copy size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={cn(iconBtn(), 'hover:text-red-400')}>
                <Trash2 size={12} />
              </button>
              <button
                {...(dragHandleProps?.attributes || {})}
                {...(dragHandleProps?.listeners || {})}
                className={cn(iconBtn(), 'cursor-grab')}
              >
                <GripVertical size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

    return portalContainer ? createPortal(node, portalContainer) : node;
  }

  // ---------------------------------------------------------------------------
  // Desktop/tablet: ultra-compact vertical action bar
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      {isSelected && (
        <TooltipProvider delayDuration={400}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: position === 'left' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: position === 'left' ? -4 : 4 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'absolute',
              position === 'left' ? 'left-1.5 top-1/2' : 'right-1.5 top-1/2',
              'flex flex-col gap-0.5 p-1 rounded-lg',
              'bg-[hsl(var(--builder-surface))]/90 backdrop-blur-md',
              'border border-[hsl(315,85%,58%)/0.2]',
              'shadow-lg shadow-black/30 z-[60] pointer-events-auto'
            )}
            style={{ transform: 'translateY(-50%)' }}
          >
            {/* Drag Handle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...(dragHandleProps?.attributes || {})}
                  {...(dragHandleProps?.listeners || {})}
                  className="p-1 rounded-md bg-[hsl(315,85%,58%)]/15 text-[hsl(315,85%,58%)] hover:bg-[hsl(315,85%,58%)]/25 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
                >
                  <GripVertical size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="text-xs">Drag</TooltipContent>
            </Tooltip>

            {/* Move Up */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className={cn(
                    'p-1 rounded-md transition-colors flex items-center justify-center',
                    canMoveUp
                      ? 'text-white/60 hover:text-white hover:bg-[hsl(315,85%,58%)/0.1]'
                      : 'text-white/20 cursor-not-allowed'
                  )}
                >
                  <ChevronUp size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="text-xs">Up</TooltipContent>
            </Tooltip>

            {/* Move Down */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className={cn(
                    'p-1 rounded-md transition-colors flex items-center justify-center',
                    canMoveDown
                      ? 'text-white/60 hover:text-white hover:bg-[hsl(315,85%,58%)/0.1]'
                      : 'text-white/20 cursor-not-allowed'
                  )}
                >
                  <ChevronDown size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="text-xs">Down</TooltipContent>
            </Tooltip>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md text-white/60 hover:text-white hover:bg-[hsl(315,85%,58%)/0.1] transition-colors flex items-center justify-center">
                  <MoreHorizontal size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={tooltipSide}
                className="bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl border-[hsl(315,85%,58%)/0.2] min-w-[140px]"
              >
                <DropdownMenuItem
                  onClick={onAddAbove}
                  className="text-white/80 text-xs focus:bg-[hsl(315,85%,58%)/0.1] focus:text-white"
                >
                  <Plus size={12} className="mr-2" />
                  Add above
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAddBelow}
                  className="text-white/80 text-xs focus:bg-[hsl(315,85%,58%)/0.1] focus:text-white"
                >
                  <Plus size={12} className="mr-2" />
                  Add below
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onDuplicate}
                  className="text-white/80 text-xs focus:bg-[hsl(315,85%,58%)/0.1] focus:text-white"
                >
                  <Copy size={12} className="mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-400 text-xs focus:bg-red-500/15"
                >
                  <Trash2 size={12} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
};
