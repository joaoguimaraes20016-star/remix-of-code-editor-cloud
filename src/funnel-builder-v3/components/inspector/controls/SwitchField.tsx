/**
 * SwitchField - Toggle switch with label (horizontal layout)
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SwitchFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
}

export function SwitchField({
  value,
  onChange,
  label,
  hint,
  className,
}: SwitchFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))]">
          {label}
        </label>
        <Switch
          checked={value}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[hsl(var(--builder-v3-accent))]"
        />
      </div>
      {hint && (
        <p className="text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
          {hint}
        </p>
      )}
    </div>
  );
}
