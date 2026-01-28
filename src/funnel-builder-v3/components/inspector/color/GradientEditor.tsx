/**
 * GradientEditor - Standalone gradient editor with stops, angle, type
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ButtonGroup } from '../controls/ButtonGroup';
import { SliderField } from '../controls/SliderField';
import { cn } from '@/lib/utils';
import { 
  type GradientValue, 
  type GradientStop,
  masterGradientPresets 
} from '@/funnel-builder-v3/shared/presets';

export interface GradientEditorProps {
  value: GradientValue;
  onChange: (gradient: GradientValue) => void;
  compact?: boolean;
  className?: string;
}

// Default gradient
export const defaultGradient: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#8B5CF6', position: 0 },
    { color: '#D946EF', position: 100 },
  ],
};

// Clone gradient to prevent mutation
export function cloneGradient(gradient: GradientValue): GradientValue {
  return {
    type: gradient.type,
    angle: gradient.angle,
    stops: gradient.stops.map(s => ({ ...s })),
  };
}

// Convert gradient to CSS string
export function gradientToCSS(gradient: GradientValue): string {
  if (!gradient?.stops?.length) {
    return 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)';
  }
  
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stopsStr})`;
}

export function GradientEditor({
  value,
  onChange,
  compact = false,
  className,
}: GradientEditorProps) {
  const gradient = value || defaultGradient;

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = gradient.stops.map((s, i) => 
      i === index ? { ...s, ...updates } : s
    );
    onChange({ ...gradient, stops: newStops });
  };

  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    
    // Add stop in the middle
    const midPosition = 50;
    const newStop: GradientStop = { 
      color: '#6366F1', 
      position: midPosition 
    };
    onChange({ 
      ...gradient, 
      stops: [...gradient.stops, newStop].sort((a, b) => a.position - b.position) 
    });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return;
    onChange({
      ...gradient,
      stops: gradient.stops.filter((_, i) => i !== index),
    });
  };

  const applyPreset = (preset: typeof masterGradientPresets[0]) => {
    onChange(cloneGradient(preset.gradient));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Preview */}
      <div 
        className="h-12 rounded-lg flex items-center justify-center border border-[hsl(var(--builder-v3-border))]"
        style={{ background: gradientToCSS(gradient) }}
      >
        <span className="text-lg font-bold text-white drop-shadow-md">Aa</span>
      </div>

      {/* Type toggle */}
      <ButtonGroup
        label="Type"
        value={gradient.type}
        onChange={(type) => onChange({ ...gradient, type: type as 'linear' | 'radial' })}
        options={[
          { value: 'linear', label: 'Linear' },
          { value: 'radial', label: 'Radial' },
        ]}
      />

      {/* Angle slider (linear only) */}
      {gradient.type === 'linear' && (
        <SliderField
          label="Angle"
          value={gradient.angle}
          onChange={(angle) => onChange({ ...gradient, angle })}
          min={0}
          max={360}
          step={5}
          unit="°"
        />
      )}

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))]">
            Color Stops
          </span>
          {gradient.stops.length < 5 && (
            <button
              type="button"
              onClick={addStop}
              className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                "bg-[hsl(var(--builder-v3-surface-hover))]",
                "text-[hsl(var(--builder-v3-text-muted))]",
                "hover:bg-[hsl(var(--builder-v3-surface-active))]",
                "transition-colors"
              )}
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {gradient.stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(index, { color: e.target.value })}
                  className="w-8 h-8 rounded border border-[hsl(var(--builder-v3-border))] cursor-pointer"
                />
              </div>
              
              {/* Position slider */}
              <div className="flex-1">
                <Slider
                  value={[stop.position]}
                  onValueChange={([position]) => updateStop(index, { position })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              {/* Position value */}
              <span className="text-xs font-mono w-8 text-right text-[hsl(var(--builder-v3-text-muted))]">
                {stop.position}%
              </span>
              
              {/* Remove button */}
              {gradient.stops.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center",
                    "text-[hsl(var(--builder-v3-text-dim))]",
                    "hover:bg-[hsl(var(--builder-v3-surface-hover))] hover:text-red-400",
                    "transition-colors"
                  )}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      {!compact && (
        <div>
          <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--builder-v3-text-dim))] mb-2 block">
            Presets
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {masterGradientPresets.slice(0, 8).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="h-8 rounded transition-transform hover:scale-105 border border-[hsl(var(--builder-v3-border))]"
                style={{ background: gradientToCSS(preset.gradient) }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
