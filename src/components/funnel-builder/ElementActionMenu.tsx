import { Button } from '@/components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElementActionMenuProps {
  elementId: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
  position?: 'right' | 'left';
}

export function ElementActionMenu({
  elementId,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  className,
  position = 'right',
}: ElementActionMenuProps) {
  return (
    <div 
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-50 flex flex-col gap-0.5 p-1 bg-background border border-border rounded-lg shadow-lg animate-in fade-in-0 slide-in-from-left-2",
        position === 'right' ? "-right-12" : "-left-12",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag handle */}
      <div className="flex items-center justify-center h-6 w-8 cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      
      <div className="w-full h-px bg-border" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-8 rounded-sm"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        title="Move up"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-8 rounded-sm"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        title="Move down"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      
      <div className="w-full h-px bg-border" />
      
      {onDuplicate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-8 rounded-sm"
          onClick={onDuplicate}
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
      
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-8 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
