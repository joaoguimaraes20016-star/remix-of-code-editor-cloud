/**
 * EmptyState - Professional centered prompt for inspector panels
 * 
 * Used when no block is selected or when sections are empty.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('builder-v3-inspector-empty', className)}>
      {icon && (
        <div className="builder-v3-inspector-empty-icon">
          {icon}
        </div>
      )}
      <h4 className="builder-v3-inspector-empty-title">
        {title}
      </h4>
      {description && (
        <p className="builder-v3-inspector-empty-description">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
