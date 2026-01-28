/**
 * SliderField - Range slider with value display badge
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface SliderFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  className?: string;
}

export function SliderField({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  hint,
  className,
}: SliderFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))]">
          {label}
        </label>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text))]">
          {value}{unit}
        </span>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      
      {hint && (
        <p className="text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
          {hint}
        </p>
      )}
    </div>
  );
}
