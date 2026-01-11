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

    const top = rect ? rect.top + 12 : 12;
    const left = rect ? rect.left + 12 : 12;

    const btnBase =
      'flex items-center justify-center transition-colors active:scale-95';

    const circleBtn = cn(
      btnBase,
      'w-9 h-9 rounded-full',
      'bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl',
      'border border-[hsl(var(--builder-border))]',
      'shadow-lg shadow-black/30',
      'text-[hsl(var(--builder-text))]'
    );

    const pill = cn(
      'flex items-center gap-1 p-1 rounded-full',
      'bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl',
      'border border-[hsl(var(--builder-border))]',
      'shadow-lg shadow-black/30',
      'pointer-events-auto'
    );

    const iconBtn = (disabled?: boolean) =>
      cn(
        btnBase,
        'w-8 h-8 rounded-full',
        disabled
          ? 'text-[hsl(var(--builder-text-muted))]/40 cursor-not-allowed'
          : 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10'
      );

    const node = (
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top,
          left,
          zIndex: 9999,
        }}
      >
        <AnimatePresence mode="wait">
          {!mobileExpanded ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => {
                e.stopPropagation();
                setMobileExpanded(true);
              }}
              className={cn(circleBtn, 'pointer-events-auto')}
            >
              <MoreHorizontal size={16} />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
              className={pill}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileExpanded(false);
                }}
                className={iconBtn()}
              >
                <X size={14} />
              </button>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={!canMoveUp}
                className={iconBtn(!canMoveUp)}
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={!canMoveDown}
                className={iconBtn(!canMoveDown)}
              >
                <ChevronDown size={14} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={iconBtn()}>
                    <Plus size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl border-[hsl(var(--builder-border))]"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddAbove();
                    }}
                    className="text-[hsl(var(--builder-text))] focus:bg-white/10"
                  >
                    Add above
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddBelow();
                    }}
                    className="text-[hsl(var(--builder-text))] focus:bg-white/10"
                  >
                    Add below
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className={iconBtn()}
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={cn(iconBtn(), 'hover:text-red-400 hover:bg-red-500/20')}
              >
                <Trash2 size={14} />
              </button>

              {/* Drag handle (kept but compact) */}
              <button
                {...(dragHandleProps?.attributes || {})}
                {...(dragHandleProps?.listeners || {})}
                className={cn(iconBtn(), 'cursor-grab active:cursor-grabbing')}
                title="Drag"
              >
                <GripVertical size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );

    return portalContainer ? createPortal(node, portalContainer) : node;
  }

  // ---------------------------------------------------------------------------
  // Desktop/tablet: existing vertical action bar
  // ---------------------------------------------------------------------------
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
              'bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl',
              'border border-[hsl(var(--builder-border))]',
              'shadow-2xl shadow-black/50 z-[60] pointer-events-auto'
            )}
            style={{ transform: 'translateY(-50%)' }}
          >
            {/* Block Drag Handle */}
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
                      ? 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10 active:scale-95'
                      : 'text-[hsl(var(--builder-text-muted))]/30 cursor-not-allowed'
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
                      ? 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10 active:scale-95'
                      : 'text-[hsl(var(--builder-text-muted))]/30 cursor-not-allowed'
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
                  className="p-2 rounded-lg text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                  className="p-2 rounded-lg text-[hsl(var(--builder-text-muted))] hover:text-red-400 hover:bg-red-500/20 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                <button className="p-2 rounded-lg text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10 active:scale-95 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={tooltipSide}
                className="bg-[hsl(var(--builder-surface))]/95 backdrop-blur-xl border-[hsl(var(--builder-border))]"
              >
                <DropdownMenuItem
                  onClick={onAddAbove}
                  className="text-[hsl(var(--builder-text))] focus:bg-white/10"
                >
                  <Plus size={14} className="mr-2" />
                  Add block above
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAddBelow}
                  className="text-[hsl(var(--builder-text))] focus:bg-white/10"
                >
                  <Plus size={14} className="mr-2" />
                  Add block below
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onDuplicate}
                  className="text-[hsl(var(--builder-text))] focus:bg-white/10"
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
