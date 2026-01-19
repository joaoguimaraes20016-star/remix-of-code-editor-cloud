/**
 * PagesList - Perspective-style simple numbered page list with drag-and-drop
 * Clean, minimal, shows page numbers with inline editable names
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Page } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PagesListProps {
  pages: Page[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage?: (id: string, name: string) => void;
  onReorderPages?: (pageIds: string[]) => void;
}

// Sortable page item component
interface SortablePageItemProps {
  page: Page;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onEditChange: (value: string) => void;
  onFinishEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SortablePageItem({
  page,
  index,
  isActive,
  isEditing,
  editValue,
  inputRef,
  onSelect,
  onStartEdit,
  onEditChange,
  onFinishEdit,
  onKeyDown,
  onCancelEdit,
  onDelete,
  canDelete,
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-primary/5"
      )}
    >
      {/* Drag handle - functional */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={12} className="text-muted-foreground" />
      </div>
      
      {/* Page number */}
      <span className={cn(
        "text-xs font-medium min-w-[20px]",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {index + 1}
      </span>
      
      {/* Page name - editable */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onFinishEdit}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1 text-sm bg-background border border-primary rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <span 
          className={cn(
            "flex-1 text-sm truncate",
            isActive ? "font-medium text-primary" : "text-foreground"
          )}
          onDoubleClick={onStartEdit}
          title="Double-click to rename"
        >
          {page.name}
        </span>
      )}

      {/* Actions menu */}
      {canDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Delete page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function PagesList({ 
  pages, 
  activePageId, 
  onSelectPage, 
  onAddPage, 
  onDeletePage,
  onRenamePage,
  onReorderPages,
}: PagesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(page.id);
    setEditValue(page.name);
  };

  const handleFinishEdit = () => {
    if (editingId && editValue.trim() && onRenamePage) {
      onRenamePage(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      const reordered = arrayMove(pages, oldIndex, newIndex);
      if (onReorderPages) {
        onReorderPages(reordered.map(p => p.id));
      }
    }
  }, [pages, onReorderPages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Pages</h3>
        <button
          onClick={onAddPage}
          className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Add page"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Pages list with drag-and-drop */}
      <div className="flex-1 overflow-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pages.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {pages.map((page, index) => (
                <SortablePageItem
                  key={page.id}
                  page={page}
                  index={index}
                  isActive={page.id === activePageId}
                  isEditing={editingId === page.id}
                  editValue={editValue}
                  inputRef={inputRef}
                  onSelect={() => onSelectPage(page.id)}
                  onStartEdit={(e) => handleStartEdit(page, e)}
                  onEditChange={setEditValue}
                  onFinishEdit={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  onCancelEdit={handleCancelEdit}
                  onDelete={() => onDeletePage(page.id)}
                  canDelete={pages.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
