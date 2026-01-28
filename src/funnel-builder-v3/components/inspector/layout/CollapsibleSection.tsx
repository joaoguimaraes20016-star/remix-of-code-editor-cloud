/**
 * CollapsibleSection - Expandable property group
 * 
 * Features animated chevron, optional badge/accent, dark theme styling.
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
  accentColor?: string;
  className?: string;
}

export const CollapsibleSection = React.forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  ({ title, icon, defaultOpen = false, children, badge, accentColor, className }, ref) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div 
        ref={ref} 
        className={cn(
          "border-b border-[hsl(var(--builder-v3-border))]",
          className
        )}
      >
        {/* Accent gradient strip */}
        {accentColor && (
          <div 
            className="h-0.5 w-full" 
            style={{ background: accentColor }}
          />
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--builder-v3-surface-hover))] transition-colors"
          type="button"
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="text-[hsl(var(--builder-v3-text-muted))] flex-shrink-0">
                {icon}
              </span>
            )}
            <span className="text-xs font-medium text-[hsl(var(--builder-v3-text))] truncate">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--builder-v3-accent)/0.15)] text-[hsl(var(--builder-v3-accent))] font-medium flex-shrink-0">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "w-3.5 h-3.5 text-[hsl(var(--builder-v3-text-dim))] flex-shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        
        <div
          className={cn(
            "grid transition-all duration-200 ease-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 space-y-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';
