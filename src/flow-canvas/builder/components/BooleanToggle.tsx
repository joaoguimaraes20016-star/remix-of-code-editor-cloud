import React from 'react';
import { cn } from '@/lib/utils';

interface BooleanToggleProps {
  /** Current boolean value */
  value: boolean;
  /** Callback when value changes - receives the NEW value, not a flip */
  onValueChange: (newValue: boolean) => void;
  /** Labels for [true, false] states */
  labels?: [string, string];
  /** Optional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A deterministic boolean toggle that explicitly sets true or false.
 * Unlike TogglePill which flips, this always sets the exact value clicked.
 */
export const BooleanToggle: React.FC<BooleanToggleProps> = ({
  value,
  onValueChange,
  labels = ['Yes', 'No'],
  className,
  disabled = false,
}) => {
  return (
    <div className={cn('toggle-pill', disabled && 'opacity-50 pointer-events-none', className)}>
      <button
        type="button"
        onClick={() => onValueChange(true)}
        className={cn(
          'toggle-pill-option',
          value === true ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
        )}
        disabled={disabled}
      >
        {labels[0]}
      </button>
      <button
        type="button"
        onClick={() => onValueChange(false)}
        className={cn(
          'toggle-pill-option',
          value === false ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
        )}
        disabled={disabled}
      >
        {labels[1]}
      </button>
    </div>
  );
};

/**
 * Helper to coerce a prop value to a boolean with a default.
 * Handles undefined, null, and actual boolean values consistently.
 */
export function coerceBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

export default BooleanToggle;
