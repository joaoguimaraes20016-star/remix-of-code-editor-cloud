import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { Pipette, Hash, Check, RotateCcw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ColorPickerPopoverProps {
  children: React.ReactNode;
  color: string;
  onChange: (color: string) => void;
  showGradientOption?: boolean;
  onGradientClick?: () => void;
}

// Import unified presets from single source of truth
import { masterColorPresets as presetColors } from '../../utils/presets';

// Check for EyeDropper API support
const supportsEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

// Recent colors storage key
const RECENT_COLORS_KEY = 'builder-recent-colors';

export const ColorPickerPopover = forwardRef<HTMLButtonElement, ColorPickerPopoverProps>(
  ({ children, color, onChange, showGradientOption = true, onGradientClick }, ref) => {
    const [inputValue, setInputValue] = useState(color);
    const [isOpen, setIsOpen] = useState(false);
    const [inputMode, setInputMode] = useState<'hex' | 'rgb'>('hex');
    const contentRef = useRef<HTMLDivElement | null>(null);
    // Capture selection when popover opens so we can restore it before applying colors
    const savedSelectionRef = useRef<Range | null>(null);
    
    // Recent colors state - persisted to localStorage
    const [recentColors, setRecentColors] = useState<string[]>(() => {
      if (typeof window === 'undefined') return [];
      try {
        const stored = localStorage.getItem(RECENT_COLORS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    });
    
    // Track recent colors on selection
    const trackRecentColor = useCallback((newColor: string) => {
      if (newColor === 'transparent' || !newColor.startsWith('#')) return;
      if (recentColors.includes(newColor)) return;
      const updated = [newColor, ...recentColors.slice(0, 7)]; // Keep last 8
      setRecentColors(updated);
      try {
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
    }, [recentColors]);

    // Capture selection when popover opens
    useEffect(() => {
      if (isOpen) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
          savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
        }
      } else {
        savedSelectionRef.current = null;
      }
    }, [isOpen]);

    // Helper to restore selection before applying color
    const restoreSelectionAndApply = useCallback((newColor: string) => {
      if (savedSelectionRef.current) {
        try {
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(savedSelectionRef.current.cloneRange());
          }
        } catch { /* ignore */ }
      }
      onChange(newColor);
    }, [onChange]);

    // Manual outside-dismiss so slider drags / non-focusable controls never close this popover.
    // IMPORTANT: We use 'pointerdown' (not capture) to let other handlers process first
    useEffect(() => {
      if (!isOpen) return;

      const onPointerDown = (ev: PointerEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        if (contentRef.current?.contains(target)) return;

        if (
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[data-radix-popover-content]') ||
          target.closest('[data-radix-select-content]')
        ) {
          return;
        }

        // If click is on a canvas element, close immediately to prevent stuck popovers
        if (target.closest('[data-node-id]') || target.closest('[data-element-id]')) {
          setIsOpen(false);
          return;
        }

        // Close the popover but don't prevent the click from reaching its target
        setIsOpen(false);
      };

      // Use regular event listener (not capture) so clicks reach their targets first
      document.addEventListener('pointerdown', onPointerDown);
      return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [isOpen]);
    // Sync input value with external color prop
    useEffect(() => {
      setInputValue(color);
    }, [color]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      // Validate hex color
      if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
        restoreSelectionAndApply(value);
      }
    };

    const handlePresetClick = (preset: string) => {
      setInputValue(preset);
      restoreSelectionAndApply(preset);
      trackRecentColor(preset);
    };

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      restoreSelectionAndApply(value);
      trackRecentColor(value);
    };
    
    // Hex to RGB conversion
    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    // RGB to Hex conversion
    const rgbToHex = (r: number, g: number, b: number): string => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    };
    
    const currentRgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
    
    const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
      const rgb = { ...currentRgb, [channel]: value };
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setInputValue(hex);
      restoreSelectionAndApply(hex);
      trackRecentColor(hex);
    };

    // Eyedropper handler using browser EyeDropper API
    const handleEyedropper = useCallback(async () => {
      if (!supportsEyeDropper) {
        toast.error('Eyedropper not supported in this browser');
        return;
      }
      
      try {
        // @ts-ignore - EyeDropper API is not yet in TypeScript types
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const pickedColor = result.sRGBHex;
        setInputValue(pickedColor);
        restoreSelectionAndApply(pickedColor);
        toast.success(`Color picked: ${pickedColor}`);
      } catch (e) {
        // User canceled the eyedropper
        console.log('Eyedropper canceled');
      }
    }, [onChange]);

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          ref={contentRef}
          className="w-64 p-3 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text))]" 
          align="end"
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
          // We manage outside-dismiss ourselves (document pointerdown); prevent Radix auto-dismiss.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          // Stop propagation so canvas/global handlers don't receive inside-popover events
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {/* Input Mode Toggle */}
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setInputMode('hex')}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded transition-colors',
                inputMode === 'hex' ? 'bg-builder-accent text-white' : 'text-builder-text-muted hover:text-builder-text'
              )}
            >
              HEX
            </button>
            <button
              onClick={() => setInputMode('rgb')}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded transition-colors',
                inputMode === 'rgb' ? 'bg-builder-accent text-white' : 'text-builder-text-muted hover:text-builder-text'
              )}
            >
              RGB
            </button>
          </div>

          {/* Color Input - HEX or RGB */}
          {inputMode === 'hex' ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-builder-text-muted" />
                <Input
                  value={inputValue.replace('#', '')}
                  onChange={(e) => handleInputChange({ ...e, target: { ...e.target, value: `#${e.target.value}` } } as React.ChangeEvent<HTMLInputElement>)}
                  className="builder-input pl-7 font-mono text-xs uppercase"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <div className="relative">
                <input
                  type="color"
                  value={color.startsWith('#') ? color : '#000000'}
                  onChange={handleColorInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className="w-9 h-9 rounded-lg border border-builder-border cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-builder-accent transition-all"
                  style={{ backgroundColor: color }}
                >
                  <Pipette className="w-4 h-4 text-white mix-blend-difference" />
                </div>
              </div>
              
              {/* Eyedropper Button */}
              {supportsEyeDropper && (
                <button
                  type="button"
                  onClick={handleEyedropper}
                  className="w-9 h-9 rounded-lg border border-builder-border bg-builder-surface-hover cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-builder-accent hover:bg-builder-accent/10 transition-all"
                  title="Pick color from screen"
                >
                  <Pipette className="w-4 h-4 text-builder-accent" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              {(['r', 'g', 'b'] as const).map(channel => (
                <div key={channel} className="flex-1">
                  <span className="text-[10px] text-builder-text-dim uppercase block mb-1">{channel}</span>
                  <Input
                    type="number"
                    min={0}
                    max={255}
                    value={currentRgb[channel]}
                    onChange={(e) => handleRgbChange(channel, parseInt(e.target.value) || 0)}
                    className="builder-input text-xs font-mono text-center"
                  />
                </div>
              ))}
              <div 
                className="w-9 h-9 rounded-lg border border-builder-border mt-4"
                style={{ backgroundColor: color }}
              />
            </div>
          )}

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-builder-text-dim">Recent</span>
                <button
                  onClick={() => {
                    setRecentColors([]);
                    localStorage.removeItem(RECENT_COLORS_KEY);
                  }}
                  className="text-[10px] text-builder-text-dim hover:text-builder-text transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-1.5">
                {recentColors.map((recentColor) => (
                  <button
                    key={recentColor}
                    onClick={() => handlePresetClick(recentColor)}
                    className={cn(
                      'w-6 h-6 rounded-md border transition-all hover:scale-110',
                      color === recentColor 
                        ? 'ring-2 ring-builder-accent border-builder-accent' 
                        : 'border-builder-border hover:border-builder-text-muted'
                    )}
                    style={{ backgroundColor: recentColor }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preset Colors Grid - 8 columns for 48 colors */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            {presetColors.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'w-6 h-6 rounded-md border transition-all hover:scale-110',
                  color === preset 
                    ? 'ring-2 ring-builder-accent border-builder-accent' 
                    : 'border-builder-border hover:border-builder-text-muted'
                )}
                style={{ backgroundColor: preset }}
              >
                {color === preset && (
                  <Check className="w-2.5 h-2.5 mx-auto text-white mix-blend-difference" />
                )}
              </button>
            ))}
          </div>

          {/* Gradient Option */}
          {showGradientOption && (
            <button
              onClick={() => {
                onGradientClick?.();
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-lg text-sm font-medium text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover transition-colors flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #8B5CF6 100%)',
              }}
            >
              <span className="text-white text-xs font-semibold">Use Gradient Instead</span>
            </button>
          )}

          {/* Transparent Option */}
          <button
            onClick={() => handlePresetClick('transparent')}
            className={cn(
              'w-full mt-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 border-dashed',
              color === 'transparent'
                ? 'border-builder-accent text-builder-accent'
                : 'border-builder-border text-builder-text-muted hover:border-builder-text-muted hover:text-builder-text'
            )}
          >
            Transparent
          </button>
        </PopoverContent>
      </Popover>
    );
  }
);

ColorPickerPopover.displayName = 'ColorPickerPopover';
