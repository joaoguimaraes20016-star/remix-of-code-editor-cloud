/**
 * ColorPickerPopover - Full color picker with popover
 * 
 * Features preset grid, native picker, HEX input, recent colors.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Pipette, Palette, Sparkles } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ColorPresetGrid } from './ColorPresetGrid';
import { cn } from '@/lib/utils';

const RECENT_COLORS_KEY = 'funnel-builder-v3-recent-colors';
const MAX_RECENT = 8;

export interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  children?: React.ReactNode;
  showGradients?: boolean;
  onSwitchToGradient?: () => void;
  className?: string;
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
  showGradients = false,
  onSwitchToGradient,
  className,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value || '#000000');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Load recent colors
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY);
      if (stored) {
        setRecentColors(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync hex input with value
  useEffect(() => {
    setHexInput(value || '#000000');
  }, [value]);

  const addToRecent = (color: string) => {
    const normalized = color.toLowerCase();
    const updated = [normalized, ...recentColors.filter(c => c !== normalized)].slice(0, MAX_RECENT);
    setRecentColors(updated);
    try {
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleColorChange = (color: string) => {
    onChange(color);
    addToRecent(color);
  };

  const handleHexSubmit = () => {
    const cleaned = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      handleColorChange(cleaned);
    }
  };

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(result.sRGBHex);
      } catch {
        // User cancelled
      }
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "w-8 h-8 rounded border border-[hsl(var(--builder-v3-border))] transition-colors",
        "hover:border-[hsl(var(--builder-v3-text-muted))]",
        value === 'transparent' && "bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
      )}
      style={{ backgroundColor: value !== 'transparent' ? value : undefined }}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-64 p-3",
          "bg-[hsl(var(--builder-v3-surface))]",
          "border-[hsl(var(--builder-v3-border))]",
          "z-[100]",
          className
        )}
        align="start"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header with native picker */}
          <div className="flex items-center gap-2">
            <div 
              className="relative w-10 h-10 rounded overflow-hidden cursor-pointer border border-[hsl(var(--builder-v3-border))]"
              onClick={() => colorInputRef.current?.click()}
              style={{ backgroundColor: value !== 'transparent' ? value : undefined }}
            >
              {value === 'transparent' && (
                <div className="absolute inset-0 bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]" />
              )}
              <input
                ref={colorInputRef}
                type="color"
                value={value !== 'transparent' ? value : '#000000'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
                className={cn(
                  "w-full h-8 px-2 text-xs font-mono rounded",
                  "bg-[hsl(var(--builder-v3-surface-active))]",
                  "border border-[hsl(var(--builder-v3-border))]",
                  "text-[hsl(var(--builder-v3-text))]",
                  "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--builder-v3-accent))]"
                )}
                placeholder="#000000"
              />
            </div>
            
            {'EyeDropper' in window && (
              <button
                type="button"
                onClick={handleEyedropper}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center",
                  "bg-[hsl(var(--builder-v3-surface-hover))]",
                  "text-[hsl(var(--builder-v3-text-muted))]",
                  "hover:bg-[hsl(var(--builder-v3-surface-active))]",
                  "transition-colors"
                )}
                title="Pick color from screen"
              >
                <Pipette size={14} />
              </button>
            )}
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--builder-v3-text-dim))] mb-1.5 block">
                Recent
              </span>
              <div className="flex gap-1">
                {recentColors.map((color, i) => (
                  <button
                    key={`${color}-${i}`}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-6 h-6 rounded transition-transform hover:scale-110",
                      value?.toLowerCase() === color && "ring-2 ring-[hsl(var(--builder-v3-accent))]"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset grid */}
          <ColorPresetGrid
            value={value}
            onChange={handleColorChange}
            showTransparent
          />

          {/* Switch to gradient option */}
          {showGradients && onSwitchToGradient && (
            <button
              type="button"
              onClick={() => {
                onSwitchToGradient();
                setOpen(false);
              }}
              className={cn(
                "w-full h-8 rounded flex items-center justify-center gap-2 text-xs",
                "bg-[hsl(var(--builder-v3-surface-hover))]",
                "text-[hsl(var(--builder-v3-text-secondary))]",
                "hover:bg-[hsl(var(--builder-v3-surface-active))]",
                "transition-colors"
              )}
            >
              <Sparkles size={12} />
              Use Gradient Instead
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
