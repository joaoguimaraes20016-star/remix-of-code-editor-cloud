/**
 * Screen Background Editor - Enhanced with gradient and overlay support
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScreenBackground } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface ScreenBackgroundEditorProps {
  background: ScreenBackground | undefined;
  onChange: (background: ScreenBackground) => void;
}

const PRESET_GRADIENTS = [
  { name: 'Purple Sunset', from: '#7c3aed', to: '#ec4899', angle: 135 },
  { name: 'Ocean Blue', from: '#0ea5e9', to: '#6366f1', angle: 135 },
  { name: 'Fresh Green', from: '#10b981', to: '#06b6d4', angle: 135 },
  { name: 'Warm Orange', from: '#f97316', to: '#eab308', angle: 135 },
  { name: 'Rose Gold', from: '#f43f5e', to: '#fb923c', angle: 135 },
  { name: 'Dark Slate', from: '#1e293b', to: '#334155', angle: 180 },
];

export function ScreenBackgroundEditor({ background, onChange }: ScreenBackgroundEditorProps) {
  const bgType = background?.type || 'solid';
  const bgColor = background?.color || '#ffffff';
  const gradient = background?.gradient || { from: '#7c3aed', to: '#ec4899', angle: 135 };
  const overlay = background?.overlay || 'none';
  const overlayOpacity = background?.overlayOpacity ?? 50;

  const updateBackground = (updates: Partial<ScreenBackground>) => {
    onChange({ ...background, ...updates } as ScreenBackground);
  };

  return (
    <div className="space-y-4">
      {/* Background Type */}
      <div className="builder-v3-field-group">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Type</Label>
        <Select
          value={bgType}
          onValueChange={(value) => updateBackground({ type: value as ScreenBackground['type'] })}
        >
          <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
            <SelectItem value="solid" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Solid Color</SelectItem>
            <SelectItem value="gradient" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Gradient</SelectItem>
            <SelectItem value="image" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Solid Color */}
      {bgType === 'solid' && (
        <div className="builder-v3-field-group">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Color</Label>
          <div className="flex gap-2">
            <div 
              className="builder-v3-color-swatch relative"
              style={{ background: bgColor }}
            >
              <input
                type="color"
                value={bgColor}
                onChange={(e) => updateBackground({ color: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </div>
            <Input
              value={bgColor}
              onChange={(e) => updateBackground({ color: e.target.value })}
              className="builder-v3-input builder-v3-control-md flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>
      )}

      {/* Gradient */}
      {bgType === 'gradient' && (
        <>
          {/* Preset Gradients */}
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateBackground({ gradient: preset })}
                  className={cn(
                    'h-8 rounded-md border transition-all',
                    gradient.from === preset.from && gradient.to === preset.to
                      ? 'border-[hsl(var(--builder-v3-accent))] ring-1 ring-[hsl(var(--builder-v3-accent))]'
                      : 'border-[hsl(var(--builder-v3-border))] hover:border-[hsl(var(--builder-v3-accent)/0.5)]'
                  )}
                  style={{
                    background: `linear-gradient(${preset.angle}deg, ${preset.from}, ${preset.to})`
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Custom Gradient */}
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">From Color</Label>
            <div className="flex gap-2">
              <div 
                className="builder-v3-color-swatch relative"
                style={{ background: gradient.from }}
              >
                <input
                  type="color"
                  value={gradient.from}
                  onChange={(e) => updateBackground({ gradient: { ...gradient, from: e.target.value } })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </div>
              <Input
                value={gradient.from}
                onChange={(e) => updateBackground({ gradient: { ...gradient, from: e.target.value } })}
                className="builder-v3-input builder-v3-control-md flex-1"
              />
            </div>
          </div>

          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">To Color</Label>
            <div className="flex gap-2">
              <div 
                className="builder-v3-color-swatch relative"
                style={{ background: gradient.to }}
              >
                <input
                  type="color"
                  value={gradient.to}
                  onChange={(e) => updateBackground({ gradient: { ...gradient, to: e.target.value } })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </div>
              <Input
                value={gradient.to}
                onChange={(e) => updateBackground({ gradient: { ...gradient, to: e.target.value } })}
                className="builder-v3-input builder-v3-control-md flex-1"
              />
            </div>
          </div>

          <div className="builder-v3-field-group">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Angle</Label>
              <span className="text-xs font-mono text-[hsl(var(--builder-v3-text-dim))]">{gradient.angle}°</span>
            </div>
            <Slider
              value={[gradient.angle]}
              onValueChange={([value]) => updateBackground({ gradient: { ...gradient, angle: value } })}
              min={0}
              max={360}
              step={15}
              className="w-full"
            />
          </div>

          {/* Preview */}
          <div 
            className="h-12 rounded-lg border border-[hsl(var(--builder-v3-border))]"
            style={{
              background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`
            }}
          />
        </>
      )}

      {/* Image */}
      {bgType === 'image' && (
        <>
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Image URL</Label>
            <Input
              value={background?.image || ''}
              onChange={(e) => updateBackground({ image: e.target.value })}
              placeholder="https://..."
              className="builder-v3-input builder-v3-control-md"
            />
          </div>

          {/* Overlay */}
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Overlay</Label>
            <Select
              value={overlay}
              onValueChange={(value) => updateBackground({ overlay: value as ScreenBackground['overlay'] })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
                <SelectItem value="none" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">None</SelectItem>
                <SelectItem value="dark" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Dark</SelectItem>
                <SelectItem value="light" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Light</SelectItem>
                <SelectItem value="gradient-dark" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Gradient Dark</SelectItem>
                <SelectItem value="gradient-light" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Gradient Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {overlay !== 'none' && (
            <div className="builder-v3-field-group">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Overlay Opacity</Label>
                <span className="text-xs font-mono text-[hsl(var(--builder-v3-text-dim))]">{overlayOpacity}%</span>
              </div>
              <Slider
                value={[overlayOpacity]}
                onValueChange={([value]) => updateBackground({ overlayOpacity: value })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
