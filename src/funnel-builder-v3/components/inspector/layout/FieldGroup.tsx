/**
 * FieldGroup - Label + control + hint wrapper
 * 
 * Standardized field layout for inspector panels.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface FieldGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  horizontal?: boolean;
  className?: string;
}

export const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ label, hint, children, horizontal = false, className }, ref) => {
    if (horizontal) {
      return (
        <div ref={ref} className={cn("flex items-center justify-between gap-3", className)}>
          <label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))] flex-shrink-0">
            {label}
          </label>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        <label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))]">
          {label}
        </label>
        {children}
        {hint && (
          <p className="text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FieldGroup.displayName = 'FieldGroup';
