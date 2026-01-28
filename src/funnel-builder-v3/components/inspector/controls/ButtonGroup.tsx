/**
 * ButtonGroup - Segmented button toggle control
 */

import React from 'react';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface ButtonGroupOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
}

export interface ButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: ButtonGroupOption[];
  hint?: string;
  className?: string;
}

export function ButtonGroup({
  value,
  onChange,
  label,
  options,
  hint,
  className,
}: ButtonGroupProps) {
  return (
    <FieldGroup label={label} hint={hint} className={className}>
      <div className="flex rounded-md border border-[hsl(var(--builder-v3-border))] overflow-hidden">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 h-8 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors",
              "border-r border-[hsl(var(--builder-v3-border))] last:border-r-0",
              value === option.value
                ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                : "bg-[hsl(var(--builder-v3-surface-active))] text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
            )}
          >
            {option.icon && (
              <span className={cn(
                "w-4 h-4",
                value === option.value ? "text-white" : "text-[hsl(var(--builder-v3-text-muted))]"
              )}>
                {option.icon}
              </span>
            )}
            {option.label && <span>{option.label}</span>}
          </button>
        ))}
      </div>
    </FieldGroup>
  );
}
