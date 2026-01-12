import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, RotateCw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientValue {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

interface GradientPickerPopoverProps {
  children: React.ReactNode;
  value: GradientValue | null;
  onChange: (gradient: GradientValue) => void;
}

// Unified gradient presets - optimized for dark themes and high contrast
export const presetGradients: GradientValue[] = [
  // Text/headline gradients
  { type: 'linear', angle: 180, stops: [{ color: '#ffffff', position: 0 }, { color: '#9ca3af', position: 100 }] },
  { type: 'linear', angle: 135, stops: [{ color: '#ef4444', position: 0 }, { color: '#f97316', position: 50 }, { color: '#fbbf24', position: 100 }] },
  { type: 'linear', angle: 135, stops: [{ color: '#fbbf24', position: 0 }, { color: '#f59e0b', position: 50 }, { color: '#d97706', position: 100 }] },
  // Background gradients
  { type: 'linear', angle: 135, stops: [{ color: '#8b5cf6', position: 0 }, { color: '#a855f7', position: 50 }, { color: '#d946ef', position: 100 }] },
  { type: 'linear', angle: 135, stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 50 }, { color: '#8b5cf6', position: 100 }] },
  { type: 'linear', angle: 135, stops: [{ color: '#f97316', position: 0 }, { color: '#ef4444', position: 50 }, { color: '#ec4899', position: 100 }] },
  { type: 'linear', angle: 180, stops: [{ color: '#374151', position: 0 }, { color: '#1f2937', position: 100 }] },
  { type: 'linear', angle: 135, stops: [{ color: '#10b981', position: 0 }, { color: '#22d3ee', position: 100 }] },
  { type: 'radial', angle: 0, stops: [{ color: '#1e3a8a', position: 0 }, { color: '#0f172a', position: 100 }] },
];

// CRITICAL: This function is PURE - never mutate the input gradient!
// Previously this was sorting gradient.stops in-place which caused glitchy behavior
export const gradientToCSS = (gradient: GradientValue): string => {
  // Create a sorted copy - NEVER mutate the original stops array
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops
    .map(s => `${s.color} ${s.position}%`)
    .join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stopsStr})`;
};

export const defaultGradient: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#8B5CF6', position: 0 },
    { color: '#EC4899', position: 100 },
  ],
};

// Helper to deep clone a gradient to prevent shared references
export const cloneGradient = (gradient: GradientValue): GradientValue => ({
  type: gradient.type,
  angle: gradient.angle,
  stops: gradient.stops.map(s => ({ ...s })),
});

// Reusable Gradient Editor component (no popover wrapper)
interface GradientEditorProps {
  value: GradientValue;
  onChange: (gradient: GradientValue) => void;
  compact?: boolean; // For use in toolbar
}

// Use forwardRef to eliminate "Function components cannot be given refs" warning
export const GradientEditor = React.forwardRef<HTMLDivElement, GradientEditorProps>(({
  value,
  onChange,
  compact = false,
}, ref) => {
  // Use a ref to track value for comparison without triggering re-renders
  const prevValueRef = React.useRef<string>('');
  const [gradient, setGradient] = useState<GradientValue>(() => cloneGradient(value || defaultGradient));

  // Sync with external value when it changes - use JSON comparison with ref
  useEffect(() => {
    if (!value) return;
    
    const valueStr = JSON.stringify(value);
    
    // Only sync if external value actually changed (not our own update)
    if (valueStr !== prevValueRef.current) {
      prevValueRef.current = valueStr;
      setGradient(cloneGradient(value));
    }
  }, [value]);

  // Always deep clone before updating to prevent shared references
  const updateGradient = (updates: Partial<GradientValue>) => {
    const newGradient: GradientValue = {
      type: updates.type ?? gradient.type,
      angle: updates.angle ?? gradient.angle,
      // Deep clone stops to prevent mutation issues
      stops: (updates.stops ?? gradient.stops).map(s => ({ ...s })),
    };
    setGradient(newGradient);
    
    // Update the ref so we don't re-sync our own changes
    prevValueRef.current = JSON.stringify(newGradient);
    
    // Clone for parent to prevent shared references
    onChange(cloneGradient(newGradient));
  };

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    // Deep clone all stops
    const newStops = gradient.stops.map((s, i) => 
      i === index ? { ...s, ...updates } : { ...s }
    );
    updateGradient({ stops: newStops });
  };

  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    const newStops = [...gradient.stops.map(s => ({ ...s })), { color: '#FFFFFF', position: 50 }];
    updateGradient({ stops: newStops });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return;
    const newStops = gradient.stops.filter((_, i) => i !== index).map(s => ({ ...s }));
    updateGradient({ stops: newStops });
  };

  const applyPreset = (preset: GradientValue) => {
    // Deep clone preset to prevent mutation
    const cloned = cloneGradient(preset);
    setGradient(cloned);
    prevValueRef.current = JSON.stringify(cloned);
    onChange(cloneGradient(cloned)); // Another clone for parent
  };

  return (
    <div ref={ref} className="space-y-3">
      {/* Preview - Show as text gradient, not box fill */}
      <div 
        className={cn(
          "w-full rounded-lg border border-[hsl(var(--builder-border))] flex items-center justify-center font-bold",
          compact ? "h-10 text-lg" : "h-16 text-2xl"
        )}
        style={{ 
          backgroundImage: gradientToCSS(gradient),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } as React.CSSProperties}
      >
        Aa
      </div>

      {/* Type & Angle */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[hsl(var(--builder-text-muted))] mb-1 block">Type</label>
          <Select value={gradient.type} onValueChange={(v) => updateGradient({ type: v as 'linear' | 'radial' })}>
            <SelectTrigger className="h-7 text-xs bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]">
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {gradient.type === 'linear' && (
          <div>
            <label className="text-xs text-[hsl(var(--builder-text-muted))] mb-1 block">Angle</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={gradient.angle}
                onChange={(e) => updateGradient({ angle: parseInt(e.target.value) || 0 })}
                className="h-7 text-xs bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
                min={0}
                max={360}
              />
              <RotateCw className="w-3.5 h-3.5 text-[hsl(var(--builder-text-muted))]" />
            </div>
          </div>
        )}
      </div>

      {/* Color Stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[hsl(var(--builder-text-muted))]">Color Stops</label>
          <button
            onClick={addStop}
            disabled={gradient.stops.length >= 5}
            className="p-1 rounded text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-accent))] hover:bg-[hsl(var(--builder-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {gradient.stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(index, { color: e.target.value })}
                className="w-7 h-7 rounded border border-[hsl(var(--builder-border))] cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <Slider
                value={[stop.position]}
                onValueChange={([v]) => updateStop(index, { position: v })}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-xs text-[hsl(var(--builder-text-muted))] w-7">{stop.position}%</span>
            <button
              onClick={() => removeStop(index)}
              disabled={gradient.stops.length <= 2}
              className="p-0.5 rounded text-[hsl(var(--builder-text-muted))] hover:text-red-400 hover:bg-[hsl(var(--builder-surface-hover))] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs text-[hsl(var(--builder-text-muted))] mb-1.5 block">Presets</label>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-4" : "grid-cols-3")}>
          {presetGradients.slice(0, compact ? 8 : 9).map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded border border-[hsl(var(--builder-border))] hover:ring-2 hover:ring-[hsl(var(--builder-accent))] transition-all",
                compact ? "h-5" : "h-8"
              )}
              style={{ background: gradientToCSS(preset) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

GradientEditor.displayName = 'GradientEditor';

export const GradientPickerPopover: React.FC<GradientPickerPopoverProps> = ({
  children,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 bg-[hsl(220,22%,7%)] border-[hsl(220,18%,14%)] text-white" 
        align="end"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          // Bubble-phase only so sliders still work, but canvas/global handlers won't.
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          const isSliderInteraction =
            !!target.closest('[data-lovable-slider="true"]') ||
            !!target.closest('[role="slider"]');

          if (isSliderInteraction) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          const isSliderInteraction =
            !!target.closest('[data-lovable-slider="true"]') ||
            !!target.closest('[role="slider"]');

          if (isSliderInteraction) e.preventDefault();
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[hsl(220,18%,14%)]">
          <Palette className="w-4 h-4 text-[hsl(275,70%,55%)]" />
          <span className="text-sm font-medium text-white">Gradient Editor</span>
        </div>

        <GradientEditor 
          value={value || defaultGradient} 
          onChange={onChange} 
        />
      </PopoverContent>
    </Popover>
  );
};
