import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Import unified presets from single source of truth
import { 
  advancedShadowPresets as shadowPresets,
  shadowLayersToCSS,
  type ShadowLayer,
} from '../../utils/presets';

// Re-export for backwards compatibility
export { shadowLayersToCSS, shadowPresets };
export type { ShadowLayer };

interface ShadowEditorProps {
  value: ShadowLayer[];
  onChange: (layers: ShadowLayer[]) => void;
  compact?: boolean;
}

const defaultLayer: ShadowLayer = {
  x: 0,
  y: 4,
  blur: 12,
  spread: 0,
  color: 'rgba(0, 0, 0, 0.15)',
  inset: false,
};

export const ShadowEditor: React.FC<ShadowEditorProps> = ({
  value = [],
  onChange,
  compact = false,
}) => {
  const [expandedLayer, setExpandedLayer] = useState<number | null>(value.length > 0 ? 0 : null);

  const addLayer = () => {
    const newLayers = [...value, { ...defaultLayer }];
    onChange(newLayers);
    setExpandedLayer(newLayers.length - 1);
  };

  const removeLayer = (index: number) => {
    const newLayers = value.filter((_, i) => i !== index);
    onChange(newLayers);
    if (expandedLayer === index) {
      setExpandedLayer(newLayers.length > 0 ? 0 : null);
    }
  };

  const updateLayer = (index: number, updates: Partial<ShadowLayer>) => {
    const newLayers = value.map((layer, i) => 
      i === index ? { ...layer, ...updates } : layer
    );
    onChange(newLayers);
  };

  const applyPreset = (preset: { label: string; layers: ShadowLayer[] }) => {
    onChange(preset.layers.map(l => ({ ...l })));
    setExpandedLayer(preset.layers.length > 0 ? 0 : null);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div 
        className={cn(
          "rounded-lg border border-[hsl(var(--builder-border))] bg-[hsl(var(--builder-surface))] flex items-center justify-center",
          compact ? "h-12" : "h-16"
        )}
      >
        <div 
          className="w-12 h-8 rounded-md bg-white"
          style={{ boxShadow: shadowLayersToCSS(value) }}
        />
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs text-[hsl(var(--builder-text-muted))] mb-1.5 block">Presets</label>
        <div className="flex flex-wrap gap-1">
          {shadowPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={cn(
                "px-2 py-1 text-xs rounded border transition-colors",
                "border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text-muted))]",
                "hover:border-[hsl(var(--builder-accent))] hover:text-[hsl(var(--builder-text))]"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[hsl(var(--builder-text-muted))]">
            Shadow Layers ({value.length})
          </label>
          <button
            onClick={addLayer}
            disabled={value.length >= 5}
            className="p-1 rounded text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-accent))] hover:bg-[hsl(var(--builder-surface-hover))] disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {value.map((layer, index) => (
          <div 
            key={index} 
            className="border border-[hsl(var(--builder-border))] rounded-lg overflow-hidden"
          >
            {/* Layer header */}
            <button
              onClick={() => setExpandedLayer(expandedLayer === index ? null : index)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-[hsl(var(--builder-border))]"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-xs text-[hsl(var(--builder-text))]">
                  Layer {index + 1} {layer.inset && '(inset)'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); removeLayer(index); }}
                  className="p-1 rounded text-[hsl(var(--builder-text-muted))] hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </button>

            {/* Layer controls */}
            {expandedLayer === index && (
              <div className="p-3 space-y-3 bg-[hsl(var(--builder-surface))]">
                {/* Color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--builder-text-muted))]">Color</span>
                  <input
                    type="color"
                    value={layer.color.startsWith('rgba') ? '#000000' : layer.color}
                    onChange={(e) => updateLayer(index, { color: e.target.value })}
                    className="w-7 h-7 rounded border border-[hsl(var(--builder-border))] cursor-pointer"
                  />
                </div>

                {/* X Offset */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--builder-text-muted))]">X Offset</span>
                    <span className="text-xs text-[hsl(var(--builder-text))]">{layer.x}px</span>
                  </div>
                  <Slider
                    value={[layer.x]}
                    onValueChange={([v]) => updateLayer(index, { x: v })}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Y Offset */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--builder-text-muted))]">Y Offset</span>
                    <span className="text-xs text-[hsl(var(--builder-text))]">{layer.y}px</span>
                  </div>
                  <Slider
                    value={[layer.y]}
                    onValueChange={([v]) => updateLayer(index, { y: v })}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Blur */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--builder-text-muted))]">Blur</span>
                    <span className="text-xs text-[hsl(var(--builder-text))]">{layer.blur}px</span>
                  </div>
                  <Slider
                    value={[layer.blur]}
                    onValueChange={([v]) => updateLayer(index, { blur: v })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                {/* Spread */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--builder-text-muted))]">Spread</span>
                    <span className="text-xs text-[hsl(var(--builder-text))]">{layer.spread}px</span>
                  </div>
                  <Slider
                    value={[layer.spread]}
                    onValueChange={([v]) => updateLayer(index, { spread: v })}
                    min={-25}
                    max={25}
                    step={1}
                  />
                </div>

                {/* Inset toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--builder-text-muted))]">Inset</span>
                  <button
                    onClick={() => updateLayer(index, { inset: !layer.inset })}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors",
                      layer.inset
                        ? "bg-[hsl(var(--builder-accent))] border-[hsl(var(--builder-accent))] text-white"
                        : "border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text-muted))]"
                    )}
                  >
                    {layer.inset ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {value.length === 0 && (
          <div className="text-xs text-[hsl(var(--builder-text-dim))] text-center py-4">
            No shadow layers. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadowEditor;
