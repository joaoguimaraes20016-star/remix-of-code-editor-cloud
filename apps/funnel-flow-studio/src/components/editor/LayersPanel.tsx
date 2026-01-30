import React, { useState, useCallback } from 'react';
import { useFunnel } from '@/context/FunnelContext';
import { blockDefinitions } from '@/lib/block-definitions';
import { Block } from '@/types/funnel';
import { cn } from '@/lib/utils';
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
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  AlignLeft,
  Image,
  Play,
  Minus,
  Square,
  MousePointer,
  FileText,
  Mail,
  Phone,
  Calendar,
  Quote,
  Star,
  Layers,
  Users,
  LayoutGrid,
  ChevronDown,
  Clock,
  HelpCircle,
  GripVertical,
} from 'lucide-react';
import { DragOverlayItem } from './DragOverlayItem';

// Block type to icon mapping
const blockIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  heading: Type,
  text: AlignLeft,
  image: Image,
  video: Play,
  divider: Minus,
  spacer: Square,
  button: MousePointer,
  form: FileText,
  'email-capture': Mail,
  'phone-capture': Phone,
  calendar: Calendar,
  testimonial: Quote,
  reviews: Star,
  'logo-bar': Layers,
  'social-proof': Users,
  columns: LayoutGrid,
  card: Square,
  accordion: ChevronDown,
  countdown: Clock,
  quiz: HelpCircle,
};

// Get preview text for block
function getBlockPreviewText(block: Block): string {
  const content = block.content as any;
  
  switch (block.type) {
    case 'heading':
    case 'text':
      const text = content?.text || '';
      return text.length > 25 ? text.substring(0, 25) + '...' : text;
    case 'button':
      return content?.text || 'Button';
    case 'image':
      return content?.alt || 'Image';
    case 'video':
      return content?.type || 'Video';
    case 'quiz':
      return content?.question?.substring(0, 20) || 'Quiz';
    case 'testimonial':
      return content?.authorName || 'Testimonial';
    case 'email-capture':
      return 'Email capture';
    case 'phone-capture':
      return 'Phone capture';
    case 'form':
      return `Form (${content?.fields?.length || 0} fields)`;
    default:
      return blockDefinitions[block.type]?.name || block.type;
  }
}

// Smooth drop animation
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
  duration: 200,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

interface SortableLayerItemProps {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
}

function SortableLayerItem({ block, isSelected, onClick }: SortableLayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ 
    id: block.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  const Icon = blockIcons[block.type] || Square;
  const previewText = getBlockPreviewText(block);
  const definition = blockDefinitions[block.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150',
        isSelected 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-accent border border-transparent',
        isDragging && 'opacity-0', // Hide original - overlay shows preview
      )}
    >
      {/* Drag handle - more visible */}
      <div 
        {...attributes}
        {...listeners}
        className={cn(
          'opacity-40 group-hover:opacity-100 transition-all duration-150',
          'cursor-grab active:cursor-grabbing touch-none',
          'hover:text-primary p-0.5 rounded hover:bg-primary/10'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      
      {/* Icon */}
      <div className={cn(
        'w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors',
        isSelected ? 'bg-primary/20' : 'bg-muted'
      )}>
        <Icon className={cn('h-3 w-3 transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-xs font-medium truncate transition-colors',
            isSelected ? 'text-primary' : 'text-foreground'
          )}>
            {definition?.name || block.type}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground truncate block">
          {previewText}
        </span>
      </div>
    </div>
  );
}

export function LayersPanel() {
  const { funnel, currentStepId, selectedBlockId, setSelectedBlockId, reorderBlocks } = useFunnel();
  const currentStep = funnel.steps.find(s => s.id === currentStepId);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (currentStep) {
      const block = currentStep.blocks.find(b => b.id === active.id);
      if (block) {
        setActiveBlock(block);
      }
    }
  }, [currentStep]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (over && active.id !== over.id && currentStepId && currentStep) {
      const oldIndex = currentStep.blocks.findIndex((b) => b.id === active.id);
      const newIndex = currentStep.blocks.findIndex((b) => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBlocks(currentStepId, oldIndex, newIndex);
      }
    }
  }, [currentStepId, currentStep, reorderBlocks]);

  const handleDragCancel = useCallback(() => {
    setActiveBlock(null);
  }, []);

  if (!currentStep) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Select a page to view layers
      </div>
    );
  }

  if (currentStep.blocks.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-muted flex items-center justify-center">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No blocks yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click "Add section" on the canvas
        </p>
      </div>
    );
  }

  const blockIds = currentStep.blocks.map((b) => b.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {currentStep.blocks.map((block) => (
            <SortableLayerItem
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onClick={() => setSelectedBlockId(block.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Layer-specific drag overlay */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeBlock ? (
          <DragOverlayItem block={activeBlock} variant="layer" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
