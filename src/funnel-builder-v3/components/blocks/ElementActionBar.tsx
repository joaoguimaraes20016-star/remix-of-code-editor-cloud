/**
 * ElementActionBar - Floating toolbar for block actions
 * Ported from flow-canvas with v3 builder tokens
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  GripVertical,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ElementActionBarProps {
  blockId: string;
  blockType: string;
  currentAlign?: string;
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  position?: 'top' | 'bottom';
  hidden?: boolean;
}

export const ElementActionBar = forwardRef<HTMLDivElement, ElementActionBarProps>(({
  blockId,
  blockType,
  currentAlign = 'left',
  onAlignChange,
  onDuplicate,
  onDelete,
  position = 'top',
  hidden = false,
}, ref) => {
  // Show alignment for text-based elements
  const showAlignment = ['button', 'text', 'heading', 'input', 'choice'].includes(blockType);

  if (hidden) return null;

  return (
    <TooltipProvider delayDuration={200}>
      {/* Invisible hover bridge */}
      <div 
        className={cn(
          'absolute left-0 right-0 z-20',
          position === 'top' ? '-top-12 h-14' : '-bottom-12 h-14'
        )}
        style={{ pointerEvents: 'auto' }}
      />
      <div
        ref={ref}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-30',
          'flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl border',
          'opacity-0 group-hover/block:opacity-100 transition-all duration-150',
          'bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]',
          position === 'top' ? '-top-11' : '-bottom-11'
        )}
      >
        {/* Drag Handle */}
        <div
          className={cn(
            'p-1 rounded cursor-grab active:cursor-grabbing',
            'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))]',
            'hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
          )}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Divider */}
        <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-v3-border))]" />

        {/* Alignment buttons */}
        {showAlignment && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAlignChange?.('left');
                  }}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    currentAlign === 'left' || !currentAlign
                      ? 'bg-[hsl(var(--builder-v3-accent))] text-white'
                      : 'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
                  )}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Align Left</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAlignChange?.('center');
                  }}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    currentAlign === 'center'
                      ? 'bg-[hsl(var(--builder-v3-accent))] text-white'
                      : 'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
                  )}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Align Center</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAlignChange?.('right');
                  }}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    currentAlign === 'right'
                      ? 'bg-[hsl(var(--builder-v3-accent))] text-white'
                      : 'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
                  )}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Align Right</p>
              </TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-v3-border))]" />
          </>
        )}

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
              className={cn(
                'p-1.5 rounded transition-colors',
                'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))]',
                'hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
              )}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Duplicate</p>
          </TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className={cn(
                'p-1.5 rounded transition-colors',
                'bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))]',
                'hover:text-destructive hover:bg-destructive/10'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

ElementActionBar.displayName = 'ElementActionBar';
