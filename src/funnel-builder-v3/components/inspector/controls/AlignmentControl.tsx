/**
 * AlignmentControl - Horizontal and vertical alignment buttons
 */

import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';
import { FieldGroup } from '../layout/FieldGroup';
import { cn } from '@/lib/utils';

export interface AlignmentValue {
  horizontal: 'left' | 'center' | 'right';
  vertical?: 'top' | 'center' | 'bottom';
}

export interface AlignmentControlProps {
  value: AlignmentValue;
  onChange: (value: AlignmentValue) => void;
  label: string;
  showVertical?: boolean;
  className?: string;
}

const horizontalOptions = [
  { value: 'left' as const, icon: AlignLeft },
  { value: 'center' as const, icon: AlignCenter },
  { value: 'right' as const, icon: AlignRight },
];

const verticalOptions = [
  { value: 'top' as const, icon: AlignStartVertical },
  { value: 'center' as const, icon: AlignCenterVertical },
  { value: 'bottom' as const, icon: AlignEndVertical },
];

export function AlignmentControl({
  value,
  onChange,
  label,
  showVertical = false,
  className,
}: AlignmentControlProps) {
  return (
    <FieldGroup label={label} className={className}>
      <div className="flex gap-2">
        {/* Horizontal alignment */}
        <div className="flex rounded-md border border-[hsl(var(--builder-v3-border))] overflow-hidden">
          {horizontalOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...value, horizontal: option.value })}
                className={cn(
                  "w-8 h-8 flex items-center justify-center transition-colors",
                  "border-r border-[hsl(var(--builder-v3-border))] last:border-r-0",
                  value.horizontal === option.value
                    ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                    : "bg-[hsl(var(--builder-v3-surface-active))] text-[hsl(var(--builder-v3-text-muted))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
                )}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Vertical alignment (optional) */}
        {showVertical && (
          <div className="flex rounded-md border border-[hsl(var(--builder-v3-border))] overflow-hidden">
            {verticalOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ ...value, vertical: option.value })}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center transition-colors",
                    "border-r border-[hsl(var(--builder-v3-border))] last:border-r-0",
                    value.vertical === option.value
                      ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                      : "bg-[hsl(var(--builder-v3-surface-active))] text-[hsl(var(--builder-v3-text-muted))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
                  )}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FieldGroup>
  );
}
