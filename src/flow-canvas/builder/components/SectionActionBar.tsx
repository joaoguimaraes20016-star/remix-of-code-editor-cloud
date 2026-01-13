/**
 * SectionActionBar - Action toolbar for sections (frames) with reorder and menu controls
 */

import React, { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, MoreHorizontal, Copy, Trash2, Plus, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SectionActionBarProps {
  sectionId: string;
  sectionLabel: string;
  isSelected: boolean;
  frameIndex: number;
  totalFrames: number;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onRename?: (newName: string) => void;
}

export const SectionActionBar: React.FC<SectionActionBarProps> = ({
  sectionId,
  sectionLabel,
  isSelected,
  frameIndex,
  totalFrames,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddAbove,
  onAddBelow,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(sectionLabel);
  
  const canMoveUp = frameIndex > 0;
  const canMoveDown = frameIndex < totalFrames - 1;
  
  const handleStartEdit = () => {
    setEditValue(sectionLabel);
    setIsEditing(true);
  };
  
  const handleFinishEdit = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== sectionLabel) {
      onRename?.(editValue.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditValue(sectionLabel);
      setIsEditing(false);
    }
  };
  
  return (
    <div 
      className={cn(
        "absolute -top-14 left-4 flex items-center gap-1.5 transition-all duration-200 z-30",
        isSelected ? "opacity-100" : "opacity-0 group-hover/frame:opacity-100"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Horizontal action bar - positioned at top left of section */}
      <div className={cn(
        "flex items-center gap-0.5 px-1.5 py-1 rounded-lg backdrop-blur-xl border shadow-lg",
        isSelected 
          ? "bg-[hsl(var(--builder-accent))] border-[hsl(var(--builder-accent))]" 
          : "bg-[hsl(220,10%,10%)]/95 border-white/[0.08]"
      )}>
        {/* Drag Handle */}
        <button
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-grab active:cursor-grabbing",
            isSelected ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
          )}
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        
        {/* Section Label */}
        <div 
          className="flex items-center gap-1.5 px-2 cursor-pointer"
          onClick={onSelect}
        >
          <Layout className="w-3.5 h-3.5 text-white/70" />
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-white text-xs font-medium w-20"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-semibold text-xs text-white">{sectionLabel || 'Section'}</span>
          )}
        </div>
        
        {/* Divider */}
        <div className="w-px h-4 bg-white/20" />
        
        {/* Move Up */}
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canMoveUp 
              ? isSelected ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
              : "text-white/20 cursor-not-allowed"
          )}
          title="Move section up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        
        {/* Move Down */}
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            canMoveDown 
              ? isSelected ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
              : "text-white/20 cursor-not-allowed"
          )}
          title="Move section down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        
        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isSelected ? "text-white/80 hover:text-white hover:bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
              )}
              title="More options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="start"
            className="w-48 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
          >
            <DropdownMenuItem onClick={handleStartEdit} className="text-[hsl(var(--builder-text))]">
              <Layout className="w-4 h-4 mr-2" />
              Rename Section
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
            <DropdownMenuItem onClick={onAddAbove} className="text-[hsl(var(--builder-text))]">
              <Plus className="w-4 h-4 mr-2" />
              Add Section Above
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddBelow} className="text-[hsl(var(--builder-text))]">
              <Plus className="w-4 h-4 mr-2" />
              Add Section Below
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
            <DropdownMenuItem onClick={onDuplicate} className="text-[hsl(var(--builder-text))]">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Section
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--builder-border))]" />
            <DropdownMenuItem 
              onClick={onDelete} 
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
