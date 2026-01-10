import React from 'react';
import { cn } from '@/lib/utils';
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'Saving...',
          color: 'text-[hsl(var(--builder-accent))]',
        };
      case 'saved':
        return {
          icon: <Check className="w-3.5 h-3.5" />,
          text: 'Saved',
          color: 'text-[hsl(var(--builder-success,142_71%_45%))]',
        };
      case 'error':
        return {
          icon: <CloudOff className="w-3.5 h-3.5" />,
          text: 'Error saving',
          color: 'text-[hsl(var(--builder-error,0_84%_60%))]',
        };
      case 'pending':
        return {
          icon: <Cloud className="w-3.5 h-3.5" />,
          text: 'Unsaved changes',
          color: 'text-[hsl(var(--builder-text-muted))]',
        };
      default:
        return {
          icon: <Cloud className="w-3.5 h-3.5" />,
          text: 'All changes saved',
          color: 'text-[hsl(var(--builder-text-dim))]',
        };
    }
  };

  const config = getStatusConfig();
  
  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Never saved';
    
    const now = new Date();
    const diff = now.getTime() - lastSavedAt.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastSavedAt.toLocaleDateString();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
          config.color,
          className
        )}>
          {config.icon}
          <span className="text-xs font-medium">{config.text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        className="bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
      >
        <p className="text-xs text-[hsl(var(--builder-text-muted))]">
          Last saved: {formatLastSaved()}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
