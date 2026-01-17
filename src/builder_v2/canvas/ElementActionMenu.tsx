import { 
  Plus,
  Minus,
  Copy, 
  Square,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElementActionMenuProps {
  elementId: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onSelectParent?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
}

export function ElementActionMenu({
  elementId,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
  onSelectParent,
  canMoveUp = true,
  canMoveDown = true,
  className,
}: ElementActionMenuProps) {
  return (
    <div 
      className={cn(
        "element-action-menu",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Add element above */}
      {onAddAbove && (
        <button
          type="button"
          className="element-action-btn"
          onClick={(e) => { e.stopPropagation(); onAddAbove(); }}
          title="Add above"
        >
          <Plus size={16} />
        </button>
      )}

      {/* Add element below */}
      {onAddBelow && (
        <button
          type="button"
          className="element-action-btn"
          onClick={(e) => { e.stopPropagation(); onAddBelow(); }}
          title="Add below"
        >
          <Minus size={16} />
        </button>
      )}
      
      {onDuplicate && (
        <button
          type="button"
          className="element-action-btn"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          title="Duplicate"
        >
          <Copy size={16} />
        </button>
      )}

      {/* Select parent */}
      {onSelectParent && (
        <button
          type="button"
          className="element-action-btn"
          onClick={(e) => { e.stopPropagation(); onSelectParent(); }}
          title="Select parent"
        >
          <Square size={16} />
        </button>
      )}
      
      {onDelete && (
        <button
          type="button"
          className="element-action-btn element-action-btn--delete"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}