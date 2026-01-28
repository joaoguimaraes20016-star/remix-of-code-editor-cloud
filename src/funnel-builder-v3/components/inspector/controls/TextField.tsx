/**
 * TextField - Text/textarea input with label
 */

import React from 'react';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  className?: string;
}

export function TextField({
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
  rows = 3,
  hint,
  className,
}: TextFieldProps) {
  const inputClasses = cn(
    "w-full px-3 py-2 text-xs rounded-md",
    "bg-[hsl(var(--builder-v3-surface-active))]",
    "border border-[hsl(var(--builder-v3-border))]",
    "text-[hsl(var(--builder-v3-text))]",
    "placeholder:text-[hsl(var(--builder-v3-text-dim))]",
    "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--builder-v3-accent))]",
    "transition-colors"
  );

  return (
    <FieldGroup label={label} hint={hint} className={className}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(inputClasses, "resize-none")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClasses, "h-8")}
        />
      )}
    </FieldGroup>
  );
}
