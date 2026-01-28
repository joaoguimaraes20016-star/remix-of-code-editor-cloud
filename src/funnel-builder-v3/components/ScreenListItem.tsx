/**
 * Screen List Item - Draggable screen item for left panel
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MoreVertical,
  FileText,
  FormInput,
  ListChecks,
  Calendar,
  CheckCircle,
  Copy,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Screen, ScreenType } from '../types/funnel';
import { cn } from '@/lib/utils';

const SCREEN_ICONS: Record<ScreenType, React.ComponentType<{ className?: string }>> = {
  content: FileText,
  form: FormInput,
  choice: ListChecks,
  calendar: Calendar,
  thankyou: CheckCircle,
};

interface ScreenListItemProps {
  screen: Screen;
  index: number;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export function ScreenListItem({
  screen,
  index,
  isSelected,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
}: ScreenListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = SCREEN_ICONS[screen.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'builder-v3-screen-item group',
        isSelected && 'builder-v3-screen-item--active',
        isDragging && 'builder-v3-screen-item--dragging'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        className="builder-v3-drag-handle cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </div>

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
        <DropdownMenuContent align="end" className="builder-v3-dropdown">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="builder-v3-dropdown-item"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="builder-v3-dropdown-item"
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator className="builder-v3-dropdown-separator" />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={!canDelete}
            className="builder-v3-dropdown-item builder-v3-dropdown-item--danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
