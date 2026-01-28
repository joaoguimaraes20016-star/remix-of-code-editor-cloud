/**
 * Funnel Builder v3 - Canvas (Preview Area)
 * Multi-device support: Mobile, Tablet, Desktop frames
 * Drag-and-drop block reordering with dnd-kit
 */

import { Screen, Block, FunnelSettings } from '../types/funnel';
import { BlockRenderer } from './blocks/BlockRenderer';
import { SortableBlockWrapper } from './blocks/SortableBlockWrapper';
import { EmptyCanvasState } from './EmptyCanvasState';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { DeviceMode } from './Toolbar';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface CanvasProps {
  screen: Screen | null;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onReorderBlocks: (blockIds: string[]) => void;
  onUpdateBlockContent?: (blockId: string, content: string) => void;
  previewMode: boolean;
  settings: FunnelSettings;
  deviceMode: DeviceMode;
  onOpenSectionPicker?: () => void;
  onQuickAdd?: (type: 'hero' | 'cta' | 'form') => void;
}

export function Canvas({
  screen,
  selectedBlockId,
  onSelectBlock,
  onReorderBlocks,
  onUpdateBlockContent,
  previewMode,
  settings,
  deviceMode,
  onOpenSectionPicker,
  onQuickAdd,
}: CanvasProps) {
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && screen) {
      const oldIndex = screen.blocks.findIndex(b => b.id === active.id);
      const newIndex = screen.blocks.findIndex(b => b.id === over.id);
      
      const newOrder = arrayMove(
        screen.blocks.map(b => b.id),
        oldIndex,
        newIndex
      );
      
      onReorderBlocks(newOrder);
    }
  };

  if (!screen) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--builder-v3-canvas-bg))' }}
      >
        <p className="text-[hsl(var(--builder-v3-text-muted))]">No screen selected</p>
      </div>
    );
  }

  // Background styles - default to white for content visibility
  const getBackgroundStyle = () => {
    const defaultBg = { backgroundColor: '#ffffff' };
    
    if (!screen.background) {
      return defaultBg;
    }

    switch (screen.background.type) {
      case 'solid':
        return { backgroundColor: screen.background.color || '#ffffff' };
      case 'gradient': {
        const { from, to, angle } = screen.background.gradient || { from: '#fff', to: '#f0f0f0', angle: 180 };
        return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
      }
      case 'image':
        return {
          backgroundImage: `url(${screen.background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#ffffff',
        };
      default:
        return defaultBg;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !previewMode) {
      onSelectBlock(null);
    }
  };

  // Block IDs for sortable context
  const blockIds = screen.blocks.map(b => b.id);

  // Shared screen content component
  const ScreenContent = () => (
    <div 
      className="builder-v3-device-screen"
      style={{
        ...getBackgroundStyle(),
        fontFamily: settings.fontFamily || 'Inter, sans-serif',
      }}
      onClick={handleCanvasClick}
    >
      <div className={cn(
        "builder-v3-device-screen-content",
        deviceMode === 'desktop' && 'pt-0' // No notch space on desktop
      )}>
        {/* Progress Bar */}
        {settings.showProgress && (
          <div className="builder-v3-progress-bar">
            <div 
              className="builder-v3-progress-fill" 
              style={{ width: '33%' }}
            />
          </div>
        )}

        {/* Blocks with DnD */}
        <div className="p-6 space-y-4 pl-10">
          {screen.blocks.length === 0 ? (
            previewMode ? (
              <div className="builder-v3-empty-page-state">
                <p className="builder-v3-empty-page-label">This screen is empty</p>
              </div>
            ) : (
              <EmptyCanvasState 
                onQuickAdd={onQuickAdd || (() => {})}
                onBrowseAll={onOpenSectionPicker || (() => {})}
              />
            )
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blockIds}
                strategy={verticalListSortingStrategy}
              >
                {screen.blocks.map((block) => (
                  <SortableBlockWrapper
                    key={block.id}
                    id={block.id}
                    isSelected={block.id === selectedBlockId}
                    previewMode={previewMode}
                  >
                    <BlockRenderer
                      block={block}
                      isSelected={block.id === selectedBlockId}
                      onSelect={() => onSelectBlock(block.id)}
                      previewMode={previewMode}
                      primaryColor={settings.primaryColor}
                      onContentChange={onUpdateBlockContent 
                        ? (content) => onUpdateBlockContent(block.id, content) 
                        : undefined
                      }
                    />
                  </SortableBlockWrapper>
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add Content Button - shown when there are blocks and not in preview */}
          {screen.blocks.length > 0 && !previewMode && onOpenSectionPicker && (
            <button
              onClick={onOpenSectionPicker}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all',
                'border-2 border-dashed border-slate-300 hover:border-blue-400',
                'bg-slate-50/50 hover:bg-blue-50/50',
                'text-slate-400 hover:text-blue-500',
                'group'
              )}
            >
              <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Add content</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="builder-v3-canvas-viewport flex-1 flex items-center justify-center p-8 overflow-auto"
      data-preview={previewMode ? 'true' : undefined}
    >
      {/* Desktop Frame */}
      {deviceMode === 'desktop' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--desktop">
          {/* Browser Bar */}
          <div className="builder-v3-browser-bar">
            <div className="builder-v3-traffic-lights">
              <span className="builder-v3-traffic-light builder-v3-traffic-light--red" />
              <span className="builder-v3-traffic-light builder-v3-traffic-light--yellow" />
              <span className="builder-v3-traffic-light builder-v3-traffic-light--green" />
            </div>
            <div className="builder-v3-url-bar">yourfunnel.com</div>
          </div>
          <ScreenContent />
        </div>
      )}

      {/* Tablet Frame */}
      {deviceMode === 'tablet' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--tablet">
          <ScreenContent />
          <div className="builder-v3-device-home-bar">
            <div className="builder-v3-home-indicator" />
          </div>
        </div>
      )}

      {/* Mobile Frame */}
      {deviceMode === 'mobile' && (
        <div className="builder-v3-device-frame builder-v3-device-frame--mobile">
          {/* Phone Notch */}
          <div className="builder-v3-phone-notch">
            <div className="builder-v3-phone-notch-inner" />
          </div>
          
          <ScreenContent />
          
          {/* Home Bar */}
          <div className="builder-v3-device-home-bar">
            <div className="builder-v3-home-indicator" />
          </div>
        </div>
      )}
    </div>
  );
}
