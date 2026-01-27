/**
 * Stack Renderer - Renders a stack of blocks with drag-and-drop support
 */

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stack, Block, Element, SelectionState } from '../../../types/infostack';
import type { DeviceMode } from '../TopToolbar';
import { BlockDragOverlay } from './BlockDragOverlay';
import { isLightColor } from '@/builder/utils/ContrastEngine';
import { BlockAdder } from '../BlockAdder';

// Note: SortableBlockRenderer remains in CanvasRenderer.tsx as it's too complex to extract
// This is a forward reference that will be passed as a render prop

export interface StackRendererProps {
  stack: Stack;
  selection: SelectionState;
  multiSelectedIds?: Set<string>;
  onSelect: (selection: SelectionState, isShiftHeld?: boolean) => void;
  path: string[];
  onReorderBlocks?: (stackId: string, fromIndex: number, toIndex: number) => void;
  onReorderElements?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onAddBlock?: (block: Block, position?: { stackId: string; index: number }) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<Block>) => void;
  onUpdateElement?: (elementId: string, updates: Partial<Element>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onDeleteElement?: (elementId: string) => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  readOnly?: boolean;
  replayAnimationKey?: number;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  onOpenBlockPickerInPanel?: (stackId: string) => void;
  selectedApplicationStepId?: string | null;
  activeApplicationFlowBlockId?: string | null;
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
  // Render prop for block rendering (since SortableBlockRenderer is complex)
  renderBlock: (props: {
    block: Block;
    blockIndex: number;
    totalBlocks: number;
    stackPath: string[];
    activeBlockId: string | null;
  }) => React.ReactNode;
  // Parent background for contrast-adaptive UI
  parentBackgroundColor?: string;
}

export const StackRenderer: React.FC<StackRendererProps> = ({ 
  stack, 
  selection,
  onSelect, 
  path,
  onReorderBlocks,
  onAddBlock,
  readOnly = false,
  onOpenBlockPickerInPanel,
  renderBlock,
  parentBackgroundColor,
}) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const isSelected = selection.type === 'stack' && selection.id === stack.id;
  const stackPath = [...path, 'stack', stack.id];

  // Compute if parent background is dark for contrast-adaptive UI
  const isParentDark = useMemo(() => {
    if (!parentBackgroundColor || parentBackgroundColor === 'transparent') return false;
    return !isLightColor(parentBackgroundColor);
  }, [parentBackgroundColor]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (over && active.id !== over.id && onReorderBlocks) {
      const oldIndex = stack.blocks.findIndex((block) => block.id === active.id);
      const newIndex = stack.blocks.findIndex((block) => block.id === over.id);
      onReorderBlocks(stack.id, oldIndex, newIndex);
    }
  };

  const activeBlock = activeBlockId 
    ? stack.blocks.find(b => b.id === activeBlockId) 
    : null;

  // Extract parent frame ID and path from the received path prop
  const frameIndex = path.indexOf('frame');
  const parentFrameId = frameIndex !== -1 && path[frameIndex + 1] ? path[frameIndex + 1] : null;
  const parentFramePath = frameIndex !== -1 ? path.slice(0, frameIndex + 2) : path;

  // Handler for selecting the parent frame
  const selectParentFrame = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (parentFrameId && !readOnly) {
      onSelect({ type: 'frame', id: parentFrameId, path: parentFramePath });
    }
  };

  return (
    <div
      className={cn(
        'p-2 rounded-xl relative',
        // Only add editor chrome classes when NOT in readOnly mode
        !readOnly && 'builder-section-selectable group/section',
        !readOnly && isSelected && 'builder-section-selected',
        stack.direction === 'horizontal' ? 'flex flex-row gap-4' : 'flex flex-col gap-3'
      )}
    >
      {/* Empty state - only show in editor mode */}
      {stack.blocks.length === 0 && !readOnly ? (
        // Empty state - contrast-adaptive based on parent background
        <div 
          onClick={(e) => {
            e.stopPropagation();
            selectParentFrame();
            onOpenBlockPickerInPanel?.(stack.id);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center py-16 px-8 rounded-xl cursor-pointer transition-all",
            "border-2 border-dashed",
            isParentDark 
              ? "border-white/30 hover:border-white/50 bg-white/5"
              : "border-gray-200 hover:border-gray-300 bg-gradient-to-b from-gray-50/50 to-transparent",
            "group/empty"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl border shadow-sm flex items-center justify-center transition-all",
              isParentDark
                ? "bg-white/10 border-white/20 group-hover/empty:bg-white/15 group-hover/empty:shadow-md"
                : "bg-white border-gray-200 group-hover/empty:border-gray-300 group-hover/empty:shadow-md"
            )}>
              <LayoutGrid className={cn(
                "w-5 h-5 transition-colors",
                isParentDark 
                  ? "text-white/60 group-hover/empty:text-white/80" 
                  : "text-gray-400 group-hover/empty:text-gray-600"
              )} />
            </div>
            <div className="text-center">
              <p className={cn(
                "text-sm font-medium transition-colors",
                isParentDark 
                  ? "text-white/80 group-hover/empty:text-white" 
                  : "text-gray-600 group-hover/empty:text-gray-800"
              )}>
                Add Block
              </p>
              <p className={cn(
                "text-xs mt-0.5",
                isParentDark ? "text-white/50" : "text-gray-400"
              )}>
                Click to add content
              </p>
            </div>
          </div>
        </div>
      ) : stack.blocks.length === 0 && readOnly ? (
        // Empty state in runtime - render nothing
        null
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stack.blocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {stack.blocks.map((block, blockIndex) => 
                renderBlock({
                  block,
                  blockIndex,
                  totalBlocks: stack.blocks.length,
                  stackPath,
                  activeBlockId,
                })
              )}
            </SortableContext>
            <DragOverlay>
              {activeBlock ? <BlockDragOverlay block={activeBlock} /> : null}
            </DragOverlay>
          </DndContext>
          
          {/* Add content button - use BlockAdder popover */}
          {!readOnly && stack.blocks.length > 0 && (
            <div className={cn(
              "mt-3 flex justify-center opacity-60 hover:opacity-100 transition-opacity",
              isParentDark ? "text-white/50" : "text-gray-500"
            )}>
              <BlockAdder 
                variant="minimal"
                onAddBlock={(blockType) => {
                  // For now, use the existing callback if available
                  onOpenBlockPickerInPanel?.(stack.id);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

StackRenderer.displayName = 'StackRenderer';
