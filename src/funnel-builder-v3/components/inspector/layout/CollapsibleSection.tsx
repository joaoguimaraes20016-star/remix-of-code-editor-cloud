/**
 * CollapsibleSection - Expandable property group
 * 
 * Features animated chevron, optional badge/accent, dark theme styling.
 * Enhanced with border-left accent on expanded sections.
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
          'builder-v3-collapsible-section',
          isOpen && 'builder-v3-collapsible-section--expanded',
          className
        )}
      >
        {/* Accent gradient strip (optional custom color) */}
        {accentColor && (
          <div 
            className="h-0.5 w-full" 
            style={{ background: accentColor }}
          />
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="builder-v3-collapsible-header"
          type="button"
        >
          <div className="builder-v3-collapsible-header-left">
            {icon && (
              <span className="builder-v3-collapsible-icon">
                {icon}
              </span>
            )}
            <span className="builder-v3-collapsible-title">
              {title}
            </span>
            {badge && (
              <span className="builder-v3-collapsible-badge">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown 
            className={cn(
              'builder-v3-collapsible-chevron',
              isOpen && 'builder-v3-collapsible-chevron--open'
            )}
          />
        </button>
        
        <div
          className={cn(
            'builder-v3-collapsible-content',
            isOpen ? 'builder-v3-collapsible-content--open' : 'builder-v3-collapsible-content--closed'
          )}
        >
          <div className="builder-v3-collapsible-inner">
            <div className="builder-v3-collapsible-inner-padding space-y-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';
