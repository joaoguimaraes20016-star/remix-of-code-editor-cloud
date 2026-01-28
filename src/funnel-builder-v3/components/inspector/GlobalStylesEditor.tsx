/**
 * Global Styles Editor - Funnel-wide style settings
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface GlobalStylesEditorProps {
  settings: FunnelSettings;
  onChange: (settings: FunnelSettings) => void;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
];

const PRESET_COLORS = [
  { name: 'Purple', color: 'hsl(262, 83%, 58%)' },
  { name: 'Blue', color: 'hsl(217, 91%, 60%)' },
  { name: 'Teal', color: 'hsl(168, 76%, 42%)' },
  { name: 'Green', color: 'hsl(142, 71%, 45%)' },
  { name: 'Orange', color: 'hsl(25, 95%, 53%)' },
  { name: 'Red', color: 'hsl(0, 84%, 60%)' },
  { name: 'Pink', color: 'hsl(330, 81%, 60%)' },
  { name: 'Slate', color: 'hsl(215, 16%, 47%)' },
];

export function GlobalStylesEditor({ settings, onChange }: GlobalStylesEditorProps) {
  const updateSettings = (updates: Partial<FunnelSettings>) => {
    onChange({ ...settings, ...updates });
  };

  return (
    <div className="space-y-4">
      {/* Primary Color */}
      <div className="builder-v3-field-group">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Primary Color</Label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateSettings({ primaryColor: preset.color })}
              className={cn(
                'h-8 rounded-md border transition-all',
                settings.primaryColor === preset.color
                  ? 'border-white ring-1 ring-white'
                  : 'border-transparent hover:border-[hsl(var(--builder-v3-border))]'
              )}
              style={{ background: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <div 
            className="builder-v3-color-swatch relative"
            style={{ background: settings.primaryColor || 'hsl(262, 83%, 58%)' }}
          >
            <input
              type="color"
              value={settings.primaryColor?.startsWith('hsl') ? '#7c3aed' : settings.primaryColor || '#7c3aed'}
              onChange={(e) => updateSettings({ primaryColor: e.target.value })}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </div>
          <Input
            value={settings.primaryColor || 'hsl(262, 83%, 58%)'}
            onChange={(e) => updateSettings({ primaryColor: e.target.value })}
            className="builder-v3-input builder-v3-control-md flex-1"
          />
        </div>
      </div>

      {/* Font Family */}
      <div className="builder-v3-field-group">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Font Family</Label>
        <Select
          value={settings.fontFamily || 'Inter'}
          onValueChange={(value) => updateSettings({ fontFamily: value })}
        >
          <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
            {FONT_OPTIONS.map((font) => (
              <SelectItem 
                key={font.value} 
                value={font.value}
                className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]"
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress Bar */}
      <div className="builder-v3-field-row">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Show Progress Bar</Label>
        <Switch
          checked={settings.showProgress ?? true}
          onCheckedChange={(checked) => updateSettings({ showProgress: checked })}
        />
      </div>

      {settings.showProgress && (
        <div className="builder-v3-field-group">
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Progress Style</Label>
          <Select
            value={settings.progressStyle || 'bar'}
            onValueChange={(value) => updateSettings({ progressStyle: value as FunnelSettings['progressStyle'] })}
          >
            <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
              <SelectItem value="bar" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Progress Bar</SelectItem>
              <SelectItem value="dots" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Dots</SelectItem>
              <SelectItem value="steps" className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]">Step Numbers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Logo URL */}
      <div className="builder-v3-field-group">
        <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Logo URL (optional)</Label>
        <Input
          value={settings.logoUrl || ''}
          onChange={(e) => updateSettings({ logoUrl: e.target.value })}
          placeholder="https://..."
          className="builder-v3-input builder-v3-control-md"
        />
      </div>
    </div>
  );
}
