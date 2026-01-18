/**
 * ColorControl - Framer-style color picker with presets
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { normalizeColorForColorInput } from '@/flow-canvas/builder/utils/color';

interface ColorControlProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Import unified presets from single source of truth
import { inspectorColorPresets as COLOR_PRESETS } from '@/flow-canvas/builder/utils/presets';

export function ColorControl({ value, onChange, label }: ColorControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Local value state for external sync
  const [localValue, setLocalValue] = useState(value);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Manual outside-dismiss logic to allow proper closing when clicking outside
  // IMPORTANT: We use 'pointerdown' (not capture) to let other handlers process first
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      
      // Check if click is inside content or trigger
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      
      // Check if click is inside any Radix portal (nested popovers, selects, etc.)
      const radixPortals = document.querySelectorAll(
        '[data-radix-popper-content-wrapper], [data-radix-popover-content], [data-radix-select-content]'
      );
      for (const portal of radixPortals) {
        if (portal.contains(target)) return;
      }
      
      // Close the popover but don't prevent the click from reaching its target
      setIsOpen(false);
    };

    // Use regular event listener (not capture) so clicks reach their targets first
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild ref={triggerRef}>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9"
        >
          <div
            className={cn(
              'w-5 h-5 rounded border border-slate-200 flex-shrink-0',
              value === 'transparent' && 'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%278%27%3E%3Crect width=%278%27 height=%278%27 fill=%27%23fff%27/%3E%3Crect width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3Crect x=%274%27 y=%274%27 width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3C/svg%3E")]'
            )}
            style={{ backgroundColor: value !== 'transparent' ? value : undefined }}
          />
          <span className="text-xs font-mono text-slate-600 truncate">
            {value || 'Select color'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={contentRef}
        className="w-64 p-3" 
        align="start" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-7 h-7 rounded-md border-2 transition-all hover:scale-110',
                  value === color
                    ? 'border-slate-900 ring-2 ring-slate-300'
                    : 'border-transparent',
                  color === 'transparent' && 'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%278%27%3E%3Crect width=%278%27 height=%278%27 fill=%27%23fff%27/%3E%3Crect width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3Crect x=%274%27 y=%274%27 width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3C/svg%3E")]'
                )}
                style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={value !== 'transparent' ? normalizeColorForColorInput(value, '#ffffff') : '#ffffff'}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-8 p-0.5 cursor-pointer"
            />
            <Input
              type="text"
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="#ffffff"
              className="flex-1 h-8 text-xs font-mono"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
