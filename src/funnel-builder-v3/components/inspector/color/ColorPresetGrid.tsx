/**
 * ColorPresetGrid - 8-column color swatch grid
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { inspectorColorPresets, inspectorColorPresetsFlat } from '@/funnel-builder-v3/shared/presets';

export interface ColorPresetGridProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  columns?: number;
  showTransparent?: boolean;
  showCategories?: boolean;
  className?: string;
}

export function ColorPresetGrid({
  value,
  onChange,
  presets,
  columns = 8,
  showTransparent = false,
  showCategories = false,
  className,
}: ColorPresetGridProps) {
  const normalizedValue = value?.toLowerCase();

  if (showCategories) {
    return (
      <div className={cn("space-y-3", className)}>
        {showTransparent && (
          <button
            type="button"
            onClick={() => onChange('transparent')}
            className={cn(
              "w-full h-7 rounded border text-xs font-medium transition-colors",
              normalizedValue === 'transparent'
                ? "border-[hsl(var(--builder-v3-accent))] ring-2 ring-[hsl(var(--builder-v3-accent))]"
                : "border-[hsl(var(--builder-v3-border))] hover:border-[hsl(var(--builder-v3-text-muted))]",
              "bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]",
              "text-[hsl(var(--builder-v3-text-secondary))]"
            )}
          >
            Transparent
          </button>
        )}
        
        {Object.entries(inspectorColorPresets).map(([category, colors]) => (
          <div key={category}>
            <span className="text-[9px] uppercase tracking-wider text-[hsl(var(--builder-v3-text-dim))] mb-1.5 block">
              {category}
            </span>
            <div className={cn("grid gap-1", `grid-cols-${columns}`)}>
              {colors.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  isActive={normalizedValue === color.toLowerCase()}
                  onClick={() => onChange(color)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const colorList = presets || inspectorColorPresetsFlat;

  return (
    <div className={cn("space-y-2", className)}>
      {showTransparent && (
        <button
          type="button"
          onClick={() => onChange('transparent')}
          className={cn(
            "w-full h-7 rounded border text-xs font-medium transition-colors",
            normalizedValue === 'transparent'
              ? "border-[hsl(var(--builder-v3-accent))] ring-2 ring-[hsl(var(--builder-v3-accent))]"
              : "border-[hsl(var(--builder-v3-border))] hover:border-[hsl(var(--builder-v3-text-muted))]",
            "bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]",
            "text-[hsl(var(--builder-v3-text-secondary))]"
          )}
        >
          Transparent
        </button>
      )}
      
      <div 
        className="grid gap-1" 
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {colorList.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            isActive={normalizedValue === color.toLowerCase()}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
}

interface ColorSwatchProps {
  color: string;
  isActive: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, isActive, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "aspect-square rounded transition-transform hover:scale-110",
        isActive && "ring-2 ring-[hsl(var(--builder-v3-accent))] ring-offset-1 ring-offset-[hsl(var(--builder-v3-surface))]"
      )}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}
