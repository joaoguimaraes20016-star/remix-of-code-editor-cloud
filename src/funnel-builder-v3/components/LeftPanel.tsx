/**
 * Funnel Builder v3 - Left Panel (Screen List)
 * Enhanced with drag-and-drop reordering, rename, and templates
 */

import { useState, useCallback } from 'react';
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
import { 
  Plus, 
  FileText, 
  FormInput, 
  ListChecks, 
  Calendar, 
  CheckCircle,
  PanelLeftClose,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen, ScreenType, SCREEN_TYPE_CONFIG, BLOCK_TYPE_CONFIG } from '../types/funnel';
import { ScreenListItem } from './ScreenListItem';
import { TemplatePickerPopover } from './TemplatePickerPopover';
import { cn } from '@/lib/utils';

interface LeftPanelProps {
  screens: Screen[];
  selectedScreenId: string;
  selectedBlockId?: string | null;
  onSelectScreen: (screenId: string) => void;
  onSelectBlock?: (blockId: string | null) => void;
  onAddScreen: (type: ScreenType) => void;
  onDeleteScreen: (screenId: string) => void;
  onDuplicateScreen: (screenId: string) => void;
  onRenameScreen: (screenId: string, name: string) => void;
  onReorderScreens: (screenIds: string[]) => void;
  onAddTemplate?: (templateId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SCREEN_ICONS: Record<ScreenType, React.ComponentType<{ className?: string }>> = {
  content: FileText,
  form: FormInput,
  choice: ListChecks,
  calendar: Calendar,
  thankyou: CheckCircle,
};

type PanelTab = 'pages' | 'layers';

export function LeftPanel({
  screens,
  selectedScreenId,
  selectedBlockId,
  onSelectScreen,
  onSelectBlock,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  onRenameScreen,
  onReorderScreens,
  onAddTemplate,
  isCollapsed = false,
  onToggleCollapse,
}: LeftPanelProps) {
  const [addScreenOpen, setAddScreenOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('pages');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameScreenId, setRenameScreenId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Get current screen for layer tree
  const currentScreen = screens.find(s => s.id === selectedScreenId);

  // DnD sensors
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = screens.findIndex(s => s.id === active.id);
      const newIndex = screens.findIndex(s => s.id === over.id);
      const newOrder = arrayMove(screens.map(s => s.id), oldIndex, newIndex);
      onReorderScreens(newOrder);
    }
  }, [screens, onReorderScreens]);

  const handleRenameClick = useCallback((screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    if (screen) {
      setRenameScreenId(screenId);
      setRenameValue(screen.name);
      setRenameDialogOpen(true);
    }
  }, [screens]);

  const handleRenameSubmit = useCallback(() => {
    if (renameScreenId && renameValue.trim()) {
      onRenameScreen(renameScreenId, renameValue.trim());
    }
    setRenameDialogOpen(false);
    setRenameScreenId(null);
    setRenameValue('');
  }, [renameScreenId, renameValue, onRenameScreen]);

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="builder-v3-left-panel">
      {/* Header with Tabs */}
      <div className="builder-v3-panel-header">
        <div className="builder-v3-panel-tabs">
          <button
            onClick={() => setActiveTab('pages')}
            className={cn(
              'builder-v3-panel-tab',
              activeTab === 'pages' && 'builder-v3-panel-tab--active'
            )}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={cn(
              'builder-v3-panel-tab',
              activeTab === 'layers' && 'builder-v3-panel-tab--active'
            )}
          >
            Layers
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          {activeTab === 'pages' && (
            <Popover open={addScreenOpen} onOpenChange={setAddScreenOpen}>
              <PopoverTrigger asChild>
                <button className="builder-v3-add-screen-btn">
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="builder-v3-screen-picker" 
                align="end"
              >
                <div className="builder-v3-screen-picker-list">
                  {(Object.entries(SCREEN_TYPE_CONFIG) as [ScreenType, typeof SCREEN_TYPE_CONFIG[ScreenType]][]).map(
                    ([type, config]) => {
                      const Icon = SCREEN_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            onAddScreen(type);
                            setAddScreenOpen(false);
                          }}
                          className="builder-v3-screen-picker-item"
                        >
                          <Icon className="builder-v3-screen-picker-icon" />
                          <div className="builder-v3-screen-picker-content">
                            <div className="builder-v3-screen-picker-label">{config.label}</div>
                            <div className="builder-v3-screen-picker-desc">{config.description}</div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {activeTab === 'layers' && onAddTemplate && (
            <TemplatePickerPopover onSelectTemplate={onAddTemplate}>
              <button className="builder-v3-add-screen-btn">
                <Sparkles className="h-4 w-4" />
              </button>
            </TemplatePickerPopover>
          )}
          
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onToggleCollapse} className="builder-v3-toolbar-btn">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Collapse Panel</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1 builder-v3-scroll">
        {activeTab === 'pages' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={screens.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="builder-v3-screen-list">
                {screens.map((screen, index) => (
                  <ScreenListItem
                    key={screen.id}
                    screen={screen}
                    index={index}
                    isSelected={screen.id === selectedScreenId}
                    canDelete={screens.length > 1}
                    onSelect={() => onSelectScreen(screen.id)}
                    onDuplicate={() => onDuplicateScreen(screen.id)}
                    onDelete={() => onDeleteScreen(screen.id)}
                    onRename={() => handleRenameClick(screen.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="builder-v3-layer-tree">
            {currentScreen && currentScreen.blocks.length > 0 ? (
              <>
                <div className="px-3 py-2 border-b border-[hsl(var(--builder-v3-border))]">
                  <span className="text-[10px] font-medium text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider">
                    {currentScreen.name}
                  </span>
                </div>
                <div className="builder-v3-layer-list">
                  {currentScreen.blocks.map((block, index) => {
                    const config = BLOCK_TYPE_CONFIG[block.type];
                    const isSelected = block.id === selectedBlockId;
                    const preview = block.content?.substring(0, 20) || config?.label || block.type;
                    
                    return (
                      <button
                        key={block.id}
                        onClick={() => onSelectBlock?.(block.id)}
                        className={cn(
                          'builder-v3-layer-item group',
                          isSelected && 'builder-v3-layer-item--active'
                        )}
                      >
                        <span className="builder-v3-layer-index">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-[hsl(var(--builder-v3-text))] truncate">
                            {config?.label || block.type}
                          </div>
                          {block.content && (
                            <div className="text-[10px] text-[hsl(var(--builder-v3-text-dim))] truncate">
                              {preview}{block.content.length > 20 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="builder-v3-inspector-empty">
                  <div className="builder-v3-inspector-empty-icon">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h4 className="builder-v3-inspector-empty-title">No Blocks</h4>
                  <p className="builder-v3-inspector-empty-description">
                    Add blocks to see them in the layer tree
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--builder-v3-text))]">Rename Screen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Screen name"
              className="bg-[hsl(var(--builder-v3-surface-active))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              className="text-[hsl(var(--builder-v3-text-secondary))]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              className="bg-[hsl(var(--builder-v3-accent))] hover:bg-[hsl(var(--builder-v3-accent))]/90"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
