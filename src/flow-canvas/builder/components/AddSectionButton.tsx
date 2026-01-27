/**
 * AddSectionButton - Between-section add button
 * Shows a subtle divider with + button for adding sections between existing content
 */

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSectionButtonProps {
  onClick: () => void;
  variant?: 'default' | 'subtle' | 'prominent';
  className?: string;
}

export function AddSectionButton({ 
  onClick, 
  variant = 'default',
  className 
}: AddSectionButtonProps) {
  return (
    <div className={cn(
      "group relative flex items-center justify-center py-3",
      variant === 'subtle' && "py-2 opacity-50 hover:opacity-100",
      variant === 'prominent' && "py-4",
      className
    )}>
      {/* Connecting lines */}
      <div className={cn(
        "absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px",
        "bg-[hsl(var(--builder-border)/0.3)]",
        "group-hover:bg-[hsl(var(--builder-accent)/0.3)]",
        "transition-colors duration-200"
      )} />
      
      {/* Button */}
      <button
        onClick={onClick}
        className={cn(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "bg-[hsl(var(--builder-surface))]",
          "border border-[hsl(var(--builder-border))]",
          "text-[hsl(var(--builder-text-muted))]",
          "hover:border-[hsl(var(--builder-accent)/0.5)]",
          "hover:text-[hsl(var(--builder-accent))]",
          "hover:bg-[hsl(var(--builder-surface-hover))]",
          "hover:shadow-lg hover:shadow-[hsl(var(--builder-accent)/0.1)]",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--builder-accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--builder-bg))]",
          variant === 'prominent' && [
            "px-4 py-2",
            "bg-gradient-to-r from-[hsl(var(--builder-accent)/0.1)] to-transparent"
          ]
        )}
      >
        <Plus className={cn(
          "w-3.5 h-3.5 transition-transform",
          "group-hover:rotate-90"
        )} />
        <span className="text-xs font-medium">Add Section</span>
      </button>
    </div>
  );
}
