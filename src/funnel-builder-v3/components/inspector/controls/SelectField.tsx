/**
 * SelectField - Styled dropdown with dark theme
 */

import React from 'react';
import { FieldGroup } from '../layout/FieldGroup';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options?: SelectOption[];
  grouped?: Record<string, SelectOption[]>;
  placeholder?: string;
  hint?: string;
  className?: string;
}

export function SelectField({
  value,
  onChange,
  label,
  options,
  grouped,
  placeholder = 'Select...',
  hint,
  className,
}: SelectFieldProps) {
  return (
    <FieldGroup label={label} hint={hint} className={className}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "h-8 text-xs",
            "bg-[hsl(var(--builder-v3-surface-active))]",
            "border-[hsl(var(--builder-v3-border))]",
            "text-[hsl(var(--builder-v3-text))]",
            "focus:ring-[hsl(var(--builder-v3-accent))]"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent 
          className={cn(
            "bg-[hsl(var(--builder-v3-surface))]",
            "border-[hsl(var(--builder-v3-border))]",
            "z-[100]"
          )}
        >
          {grouped ? (
            Object.entries(grouped).map(([groupLabel, groupOptions]) => (
              <SelectGroup key={groupLabel}>
                <SelectLabel className="text-[10px] text-[hsl(var(--builder-v3-text-dim))] uppercase tracking-wider px-2 py-1.5">
                  {groupLabel}
                </SelectLabel>
                {groupOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-xs text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            options?.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-xs text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]"
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-[hsl(var(--builder-v3-text-dim))]">
                      {option.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </FieldGroup>
  );
}
