import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, Home, FileText, Copy, Trash2, Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Step } from '../../types/infostack';

interface TouchStepCardProps {
  step: Step;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  canDelete?: boolean;
}

export const TouchStepCard: React.FC<TouchStepCardProps> = ({
  step,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
  canDelete = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.name || '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayName = step.name || (index === 0 ? 'Home' : `Page ${index + 1}`);
  
  // Get subtitle based on step content
  const getSubtitle = () => {
    const frameCount = step.frames?.length || 0;
    const blockCount = step.frames?.reduce((acc, frame) => {
      return acc + (frame.stacks?.reduce((stackAcc, stack) => stackAcc + (stack.blocks?.length || 0), 0) || 0);
    }, 0) || 0;
    
    if (blockCount === 0) return 'Empty page';
    return `${blockCount} block${blockCount !== 1 ? 's' : ''}`;
  };

  const handleStartRename = () => {
    setEditValue(displayName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveRename = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== step.name) {
      onRename?.(editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(step.name || '');
    }
  };

  return (
    <div
      className={cn(
        "touch-step-card",
        isActive && "touch-step-card--active"
      )}
      onClick={() => !isEditing && onSelect()}
    >
      {/* Number badge */}
      <div className="touch-step-card__badge">
        {index === 0 ? <Home className="w-4 h-4" /> : index + 1}
      </div>

      {/* Content */}
      <div className="touch-step-card__content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[15px] font-semibold bg-transparent border-b-2 border-[hsl(var(--builder-accent))] outline-none text-[hsl(var(--builder-text))]"
          />
        ) : (
          <>
            <div className="touch-step-card__name">{displayName}</div>
            <div className="touch-step-card__subtitle">{getSubtitle()}</div>
          </>
        )}
      </div>

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="touch-step-card__menu"
            onClick={(e) => e.stopPropagation()}
            aria-label="Page options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] z-[9999]"
        >
          <DropdownMenuItem
            onClick={handleStartRename}
            className="mobile-menu-item"
          >
            <Edit3 className="w-4 h-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDuplicate}
            className="mobile-menu-item"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-[hsl(var(--builder-border-subtle))]" />
              <DropdownMenuItem
                onClick={onDelete}
                className="mobile-menu-item mobile-menu-item--destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface TouchStepListProps {
  steps: Step[];
  activeStepId: string | null;
  onStepSelect: (stepId: string) => void;
  onAddStep: () => void;
  onDuplicateStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  onRenameStep?: (stepId: string, newName: string) => void;
}

export const TouchStepList: React.FC<TouchStepListProps> = ({
  steps,
  activeStepId,
  onStepSelect,
  onAddStep,
  onDuplicateStep,
  onDeleteStep,
  onRenameStep,
}) => {
  return (
    <div className="p-4">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[hsl(var(--builder-text-muted))]">
          Pages
        </span>
        <span className="text-xs text-[hsl(var(--builder-text-muted))]">
          {steps.findIndex(s => s.id === activeStepId) + 1} of {steps.length}
        </span>
      </div>

      {/* Step cards */}
      {steps.map((step, index) => (
        <TouchStepCard
          key={step.id}
          step={step}
          index={index}
          isActive={step.id === activeStepId}
          onSelect={() => onStepSelect(step.id)}
          onDuplicate={() => onDuplicateStep(step.id)}
          onDelete={() => onDeleteStep(step.id)}
          onRename={onRenameStep ? (name) => onRenameStep(step.id, name) : undefined}
          canDelete={steps.length > 1}
        />
      ))}

      {/* Add page button */}
      <button
        onClick={onAddStep}
        className="touch-add-page"
      >
        <span>+ Add Page</span>
      </button>
    </div>
  );
};
