/**
 * SpacingControl - 4-way padding/margin control with link toggle
 */

import React, { useState } from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SpacingControlProps {
  value: SpacingValue;
  onChange: (value: SpacingValue) => void;
  label: string;
  unit?: string;
  max?: number;
  className?: string;
}

export function SpacingControl({
  value,
  onChange,
  label,
  unit = 'px',
  max = 100,
  className,
}: SpacingControlProps) {
  const [linked, setLinked] = useState(
    value.top === value.right && value.right === value.bottom && value.bottom === value.left
  );

  const handleChange = (side: keyof SpacingValue, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(max, newValue));
    
    if (linked) {
      onChange({
        top: clampedValue,
        right: clampedValue,
        bottom: clampedValue,
        left: clampedValue,
      });
    } else {
      onChange({
        ...value,
        [side]: clampedValue,
      });
    }
  };

  const inputClasses = cn(
    "w-12 h-7 text-center text-xs rounded",
    "bg-[hsl(var(--builder-v3-surface-active))]",
    "border border-[hsl(var(--builder-v3-border))]",
    "text-[hsl(var(--builder-v3-text))]",
    "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--builder-v3-accent))]"
  );

  return (
    <FieldGroup label={label} className={className}>
      <div className="relative">
        {/* Grid layout for spacing inputs */}
        <div className="grid grid-cols-3 gap-1 place-items-center">
          {/* Top */}
          <div className="col-start-2">
            <input
              type="number"
              value={value.top}
              onChange={(e) => handleChange('top', parseInt(e.target.value) || 0)}
              className={inputClasses}
              min={0}
              max={max}
            />
          </div>

          {/* Left - Center (link button) - Right */}
          <input
            type="number"
            value={value.left}
            onChange={(e) => handleChange('left', parseInt(e.target.value) || 0)}
            className={inputClasses}
            min={0}
            max={max}
          />
          
          <button
            type="button"
            onClick={() => {
              if (!linked) {
                // When linking, set all to top value
                const allSame = value.top;
                onChange({ top: allSame, right: allSame, bottom: allSame, left: allSame });
              }
              setLinked(!linked);
            }}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center transition-colors",
              linked
                ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                : "bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-muted))] hover:bg-[hsl(var(--builder-v3-surface-active))]"
            )}
            title={linked ? "Unlink values" : "Link values"}
          >
            {linked ? <Link2 size={14} /> : <Link2Off size={14} />}
          </button>
          
          <input
            type="number"
            value={value.right}
            onChange={(e) => handleChange('right', parseInt(e.target.value) || 0)}
            className={inputClasses}
            min={0}
            max={max}
          />

          {/* Bottom */}
          <div className="col-start-2">
            <input
              type="number"
              value={value.bottom}
              onChange={(e) => handleChange('bottom', parseInt(e.target.value) || 0)}
              className={inputClasses}
              min={0}
              max={max}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
            T
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
            B
          </span>
          <span className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
            L
          </span>
          <span className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 text-[9px] text-[hsl(var(--builder-v3-text-dim))]">
            R
          </span>
        </div>
      </div>
    </FieldGroup>
  );
}
