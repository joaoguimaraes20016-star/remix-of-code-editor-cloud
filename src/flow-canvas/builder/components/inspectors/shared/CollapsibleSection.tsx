/**
 * CollapsibleSection - Shared inspector section component
 * 
 * Provides consistent collapsible sections across all inspector panels.
 * Uses builder design tokens for theming.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection = React.forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  ({ title, icon, defaultOpen = false, children, className }, ref) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div ref={ref} className={cn("border-b border-builder-border", className)}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-builder-surface-hover transition-colors"
          type="button"
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-builder-text-muted">{icon}</span>}
            <span className="text-xs font-medium text-builder-text">{title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
          )}
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-0 space-y-3">
            {children}
          </div>
        )}
      </div>
    );
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';
