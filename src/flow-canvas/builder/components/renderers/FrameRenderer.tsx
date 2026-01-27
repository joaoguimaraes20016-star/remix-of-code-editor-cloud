/**
 * Frame Renderer - Renders a frame (section) with background and layout
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { Frame, Stack, Block, Element, SelectionState } from '../../../types/infostack';
import type { DeviceMode } from '../TopToolbar';
import { SectionActionBar } from '../SectionActionBar';
import { gradientToCSS } from '../modals';

export interface FrameRendererProps {
  frame: Frame;
  frameIndex: number;
  totalFrames: number;
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
  isDarkTheme?: boolean;
  replayAnimationKey?: number;
  deviceMode?: DeviceMode;
  onNextStep?: () => void;
  onGoToStep?: (stepId: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  // Section actions
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onRename?: (newName: string) => void;
  // Drag and drop
  dragHandleListeners?: React.DOMAttributes<HTMLButtonElement>;
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  onOpenBlockPickerInPanel?: (stackId: string) => void;
  selectedApplicationStepId?: string | null;
  activeApplicationFlowBlockId?: string | null;
  selectedStepElement?: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null;
  onSelectStepElement?: (element: { stepId: string; elementType: 'title' | 'description' | 'button' | 'option' | 'input'; optionIndex?: number } | null) => void;
  // Render prop for stack rendering
  renderStack: (props: { stack: Stack; framePath: string[] }) => React.ReactNode;
}

/**
 * Get frame background styles based on configuration
 * Now supports glassTint and glassBlur from frame settings
 */
function getFrameBackgroundStyles(frame: Frame): { className: string; style?: React.CSSProperties } {
  const bg = frame.background || 'transparent';

  switch (bg) {
    case 'white':
      return { className: 'bg-white shadow-lg' };
    case 'dark':
      return { className: 'bg-gray-900 shadow-lg' };
    case 'glass': {
      // Use glassTint and glassBlur from frame.glass if available, otherwise defaults
      const glassSettings = (frame as any).glass as { backdropBlur?: number; glassTint?: string; glassTintOpacity?: number } | undefined;
      const glassTint = glassSettings?.glassTint || 'rgba(255,255,255,0.1)';
      const glassBlur = glassSettings?.backdropBlur || 12;
      const glassTintOpacity = glassSettings?.glassTintOpacity;
      
      // If glassTint is a hex color, convert to rgba with opacity
      let tintColor = glassTint;
      if (glassTint.startsWith('#') && glassTintOpacity !== undefined) {
        const hex = glassTint.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        tintColor = `rgba(${r}, ${g}, ${b}, ${glassTintOpacity / 100})`;
      }
      
      return { 
        className: 'border border-white/20 shadow-lg',
        style: {
          backdropFilter: `blur(${glassBlur}px)`,
          WebkitBackdropFilter: `blur(${glassBlur}px)`,
          backgroundColor: tintColor,
        }
      };
    }
    case 'custom':
      return {
        className: 'shadow-lg',
        style: { backgroundColor: frame.backgroundColor || '#ffffff' },
      };
    case 'gradient':
      return {
        className: 'shadow-lg',
        style: {
          background: frame.backgroundGradient
            ? gradientToCSS(frame.backgroundGradient as any)
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      };
    case 'image':
      return {
        className: 'shadow-lg',
        style: frame.backgroundImage
          ? {
              backgroundImage: `url(${frame.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: frame.backgroundColor || '#ffffff' },
      };
    case 'transparent':
    default:
      return { className: 'bg-transparent' };
  }
}

export const FrameRenderer: React.FC<FrameRendererProps> = ({ 
  frame, 
  frameIndex,
  totalFrames,
  selection,
  onSelect, 
  path,
  readOnly = false,
  // Section actions
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
  onRename,
  // Drag and drop
  dragHandleListeners,
  dragHandleAttributes,
  renderStack,
}) => {
  const isSelected = selection.type === 'frame' && selection.id === frame.id;
  const framePath = [...path, 'frame', frame.id];

  const frameStyles = getFrameBackgroundStyles(frame);
  
  // Determine layout mode - 'contained' (centered box) or 'full-width' (edge-to-edge)
  const isFullWidth = frame.layout !== 'contained';
  
  return (
    <div
      className={cn(
        'overflow-visible transition-all relative',
        // Only add editor chrome when NOT in readOnly mode
        !readOnly && 'group/frame cursor-pointer',
        !isFullWidth && 'rounded-2xl mx-auto',
        frameStyles.className,
        // Selection ring only in editor mode
        !readOnly && isSelected && 'ring-2 ring-builder-accent shadow-[0_0_0_4px_hsl(var(--builder-accent)/0.15)]'
      )}
      style={{
        ...frameStyles.style,
        maxWidth: !isFullWidth ? (frame.maxWidth || 520) : undefined,
      }}
      onClick={(e) => {
        if (!readOnly) {
          e.stopPropagation();
          onSelect({ type: 'frame', id: frame.id, path: framePath });
        }
      }}
    >
      {/* Section Action Bar */}
      {!readOnly && (
        <SectionActionBar
          sectionId={frame.id}
          sectionLabel={frame.label || `Section ${frameIndex + 1}`}
          isSelected={isSelected}
          frameIndex={frameIndex}
          totalFrames={totalFrames}
          onSelect={() => onSelect({ type: 'frame', id: frame.id, path: framePath })}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAddAbove={onAddAbove}
          onAddBelow={onAddBelow}
          onRename={onRename}
          dragHandleListeners={dragHandleListeners}
          dragHandleAttributes={dragHandleAttributes}
        />
      )}
      
      {/* Frame content with padding */}
      <div 
        style={{
          // Reduced default padding from 32px to 16px for tighter sections
          paddingTop: frame.paddingVertical ?? 16,
          paddingBottom: frame.paddingVertical ?? 16,
          paddingLeft: isFullWidth ? 16 : (frame.paddingHorizontal ?? 24),
          paddingRight: isFullWidth ? 16 : (frame.paddingHorizontal ?? 24),
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: frame.blockGap || 12 }}>
          {frame.stacks.map((stack) => renderStack({ stack, framePath }))}
        </div>
      </div>
    </div>
  );
};

FrameRenderer.displayName = 'FrameRenderer';

/**
 * Sortable wrapper for FrameRenderer - enables drag-and-drop reordering
 */
export interface SortableFrameRendererProps extends FrameRendererProps {
  id: string;
}

export const SortableFrameRenderer: React.FC<SortableFrameRendererProps> = ({ id, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
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

  return (
    <div ref={setNodeRef} style={style}>
      <FrameRenderer 
        {...props} 
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  );
};

SortableFrameRenderer.displayName = 'SortableFrameRenderer';
