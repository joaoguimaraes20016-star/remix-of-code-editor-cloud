/**
 * Funnel Builder v3 - Left Panel (Screen List)
 * Enhanced with Pages/Layers tabs and collapse toggle
 * Dark charcoal theme matching flow-canvas aesthetic
 */

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  FileText, 
  FormInput, 
  ListChecks, 
  Calendar, 
  CheckCircle,
  GripVertical,
  MoreVertical,
  PanelLeftClose,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Screen, ScreenType, SCREEN_TYPE_CONFIG } from '../types/funnel';
import { cn } from '@/lib/utils';

interface LeftPanelProps {
  screens: Screen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
  onAddScreen: (type: ScreenType) => void;
  onDeleteScreen: (screenId: string) => void;
  onDuplicateScreen: (screenId: string) => void;
  onReorderScreens: (screenIds: string[]) => void;
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
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  onReorderScreens,
  isCollapsed = false,
  onToggleCollapse,
}: LeftPanelProps) {
  const [addScreenOpen, setAddScreenOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('pages');

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
          <div className="builder-v3-screen-list">
            {screens.map((screen, index) => {
              const Icon = SCREEN_ICONS[screen.type];
              const isSelected = screen.id === selectedScreenId;
              
              return (
                <div
                  key={screen.id}
                  className={cn(
                    'builder-v3-screen-item group',
                    isSelected && 'builder-v3-screen-item--active'
                  )}
                  onClick={() => onSelectScreen(screen.id)}
                >
                  {/* Drag Handle */}
                  <GripVertical className="builder-v3-drag-handle" />
                  
                  {/* Index Badge */}
                  <span className="builder-v3-screen-index">{index + 1}</span>
                  
                  {/* Icon */}
                  <Icon className="builder-v3-screen-icon" />
                  
                  {/* Name */}
                  <span className="builder-v3-screen-name">{screen.name}</span>
                  
                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="builder-v3-screen-actions-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end"
                      className="builder-v3-dropdown"
                    >
                      <DropdownMenuItem 
                        onClick={() => onDuplicateScreen(screen.id)}
                        className="builder-v3-dropdown-item"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="builder-v3-dropdown-separator" />
                      <DropdownMenuItem
                        onClick={() => onDeleteScreen(screen.id)}
                        disabled={screens.length <= 1}
                        className="builder-v3-dropdown-item builder-v3-dropdown-item--danger"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="builder-v3-inspector-empty">
              <div className="builder-v3-inspector-empty-icon">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="builder-v3-inspector-empty-title">Layer Tree</h4>
              <p className="builder-v3-inspector-empty-description">
                View and organize the element hierarchy of your current page
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
