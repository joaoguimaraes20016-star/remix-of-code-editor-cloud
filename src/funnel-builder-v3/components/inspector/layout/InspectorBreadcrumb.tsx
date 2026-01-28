/**
 * InspectorBreadcrumb - Selection context breadcrumb
 * 
 * Shows the hierarchy of the current selection (Screen > Block)
 * with clear button to deselect.
 */

import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InspectorBreadcrumbProps {
  screenName: string;
  blockType?: string | null;
  onClearSelection?: () => void;
  className?: string;
}

export function InspectorBreadcrumb({
  screenName,
  blockType,
  onClearSelection,
  className,
}: InspectorBreadcrumbProps) {
  return (
    <div className={cn('builder-v3-inspector-breadcrumb', className)}>
      <span className="builder-v3-breadcrumb-item">
        {screenName}
      </span>
      
      {blockType && (
        <>
          <ChevronRight className="builder-v3-breadcrumb-separator" />
          <span className="builder-v3-breadcrumb-item builder-v3-breadcrumb-item--active">
            {blockType}
          </span>
        </>
      )}
      
      {onClearSelection && blockType && (
        <button 
          onClick={onClearSelection}
          className="builder-v3-breadcrumb-clear"
          aria-label="Clear selection"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
