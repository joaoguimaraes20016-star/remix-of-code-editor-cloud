/**
 * GradientPickerPopover - Popover wrapper for GradientEditor
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GradientEditor, gradientToCSS, defaultGradient } from './GradientEditor';
import { cn } from '@/lib/utils';
import type { GradientValue } from '@/funnel-builder-v3/shared/presets';

export interface GradientPickerPopoverProps {
  value: GradientValue | null;
  onChange: (gradient: GradientValue) => void;
  children?: React.ReactNode;
  className?: string;
}

export function GradientPickerPopover({
  value,
  onChange,
  children,
  className,
}: GradientPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const gradient = value || defaultGradient;

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "w-8 h-8 rounded border border-[hsl(var(--builder-v3-border))] transition-colors",
        "hover:border-[hsl(var(--builder-v3-text-muted))]"
      )}
      style={{ background: gradientToCSS(gradient) }}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-72 p-4",
          "bg-[hsl(var(--builder-v3-surface))]",
          "border-[hsl(var(--builder-v3-border))]",
          "z-[100]",
          className
        )}
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--builder-v3-border))]">
          <Sparkles size={14} className="text-[hsl(var(--builder-v3-accent))]" />
          <span className="text-xs font-medium text-[hsl(var(--builder-v3-text))]">
            Gradient Editor
          </span>
        </div>

        <GradientEditor
          value={gradient}
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}
