/**
 * Funnel Builder v3 - Left Panel (Screen List)
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
}

const SCREEN_ICONS: Record<ScreenType, React.ComponentType<{ className?: string }>> = {
  content: FileText,
  form: FormInput,
  choice: ListChecks,
  calendar: Calendar,
  thankyou: CheckCircle,
};

export function LeftPanel({
  screens,
  selectedScreenId,
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  onReorderScreens,
}: LeftPanelProps) {
  const [addScreenOpen, setAddScreenOpen] = useState(false);

  return (
    <div className="w-64 border-r border-[hsl(var(--builder-v3-border))] bg-[hsl(var(--builder-v3-surface))] flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[hsl(var(--builder-v3-border-subtle))]">
        <span className="text-sm font-medium text-[hsl(var(--builder-v3-text))]">Screens</span>
        
        <Popover open={addScreenOpen} onOpenChange={setAddScreenOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-[hsl(var(--builder-v3-text-muted))] hover:text-[hsl(var(--builder-v3-text))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-2 bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]" 
            align="end"
          >
            <div className="space-y-1">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(var(--builder-v3-surface-hover))] text-left transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[hsl(var(--builder-v3-text-muted))]" />
                      <div>
                        <div className="text-sm font-medium text-[hsl(var(--builder-v3-text))]">{config.label}</div>
                        <div className="text-xs text-[hsl(var(--builder-v3-text-dim))]">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Screen List */}
      <ScrollArea className="flex-1 builder-v3-scroll">
        <div className="p-2 space-y-1">
          {screens.map((screen, index) => {
            const Icon = SCREEN_ICONS[screen.type];
            const isSelected = screen.id === selectedScreenId;
            
            return (
              <div
                key={screen.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150',
                  isSelected
                    ? 'bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))]'
                    : 'bg-[hsl(var(--builder-v3-surface))] hover:bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-secondary))]'
                )}
                onClick={() => onSelectScreen(screen.id)}
              >
                {/* Drag Handle */}
                <GripVertical className="h-3 w-3 text-[hsl(var(--builder-v3-text-dim))] opacity-0 group-hover:opacity-100 cursor-grab" />
                
                {/* Icon */}
                <Icon className={cn(
                  'h-4 w-4 shrink-0',
                  isSelected ? 'text-[hsl(var(--builder-v3-accent))]' : 'text-[hsl(var(--builder-v3-text-muted))]'
                )} />
                
                {/* Name */}
                <span className={cn(
                  'flex-1 text-sm truncate',
                  isSelected && 'font-medium'
                )}>
                  {index + 1}. {screen.name}
                </span>
                
                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[hsl(var(--builder-v3-text-muted))] hover:bg-[hsl(var(--builder-v3-surface-active))]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end"
                    className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]"
                  >
                    <DropdownMenuItem 
                      onClick={() => onDuplicateScreen(screen.id)}
                      className="text-[hsl(var(--builder-v3-text-secondary))] focus:bg-[hsl(var(--builder-v3-surface-hover))] focus:text-[hsl(var(--builder-v3-text))]"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[hsl(var(--builder-v3-border))]" />
                    <DropdownMenuItem
                      onClick={() => onDeleteScreen(screen.id)}
                      disabled={screens.length <= 1}
                      className="text-[hsl(var(--builder-v3-error))] focus:text-[hsl(var(--builder-v3-error))] focus:bg-[hsl(var(--builder-v3-error)/0.1)]"
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
      </ScrollArea>
    </div>
  );
}
