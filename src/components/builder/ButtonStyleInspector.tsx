/**
 * ButtonStyleInspector - SHARED BUTTON STYLING CONTROLS
 * 
 * This component provides unified button styling controls used by:
 * - Step button inspector (flow steps)
 * - Form button inspector (capture forms)
 * - V2 enhanced inspector (builder v2)
 * - Any standalone button inspector
 * 
 * RULES:
 * 1. All buttons use the same styling options
 * 2. Preset dropdown allows quick application of common styles
 * 3. Full customization available for all buttons
 * 4. No separate styling systems for different button types
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronDown,
  ChevronRight,
  Palette,
  Square,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover } from '@/flow-canvas/builder/components/modals';

// ─────────────────────────────────────────────────────────
// BUTTON STYLE TYPES
// ─────────────────────────────────────────────────────────

export interface ButtonStyleSettings {
  /** Preset: primary, secondary, outline, ghost, gradient, custom */
  preset?: string;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Gradient CSS (for gradient preset) */
  gradient?: string;
  /** Size: sm, md, lg, xl */
  size?: string;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Shadow: none, sm, md, lg, xl */
  shadow?: string;
  /** Full width mode */
  fullWidth?: boolean;
}

export interface ButtonStyleInspectorProps {
  settings: ButtonStyleSettings;
  onChange: (updates: Partial<ButtonStyleSettings>) => void;
  /** Show preset dropdown (default: true) */
  showPreset?: boolean;
  /** Show full width toggle (default: true) */
  showFullWidth?: boolean;
  /** Compact mode hides some options */
  compact?: boolean;
}

// ─────────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────────

const BUTTON_PRESETS = [
  { value: 'primary', label: 'Primary', description: 'Solid primary color' },
  { value: 'secondary', label: 'Secondary', description: 'Muted background' },
  { value: 'outline', label: 'Outline', description: 'Border only' },
  { value: 'ghost', label: 'Ghost', description: 'Transparent' },
  { value: 'gradient', label: 'Gradient', description: 'Custom gradient' },
  { value: 'custom', label: 'Custom', description: 'Full control' },
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

// ─────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────

const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-builder-border last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-builder-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-builder-text-muted">{icon}</span>}
          <span className="text-xs font-medium text-builder-text">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const FieldGroup: React.FC<{ 
  label: string; 
  children: React.ReactNode; 
  hint?: string;
}> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-builder-text-muted">{label}</Label>
    {children}
    {hint && <p className="text-[10px] text-builder-text-dim">{hint}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────
// BUTTON STYLE INSPECTOR COMPONENT
// ─────────────────────────────────────────────────────────

export const ButtonStyleInspector: React.FC<ButtonStyleInspectorProps> = ({
  settings,
  onChange,
  showPreset = true,
  showFullWidth = true,
  compact = false,
}) => {
  const currentPreset = settings.preset || 'primary';
  const isCustom = currentPreset === 'custom' || currentPreset === 'gradient';

  const handlePresetChange = (preset: string) => {
    onChange({ preset });
    
    // Reset custom values when switching away from custom
    if (preset !== 'custom' && preset !== 'gradient') {
      onChange({ 
        preset,
        backgroundColor: undefined,
        textColor: undefined,
        gradient: undefined,
      });
    }
  };

  return (
    <div className="flex flex-col bg-builder-bg">
      {/* Preset Selection */}
      {showPreset && (
        <CollapsibleSection 
          title="Preset" 
          icon={<Palette className="w-3.5 h-3.5" />} 
          defaultOpen
        >
          <FieldGroup label="Apply Preset">
            <Select
              value={currentPreset}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUTTON_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div className="flex flex-col">
                      <span>{preset.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CollapsibleSection>
      )}

      {/* Colors Section - Always shown for custom/gradient, optional for others */}
      <CollapsibleSection 
        title="Colors" 
        icon={<Palette className="w-3.5 h-3.5" />}
        defaultOpen={isCustom}
      >
        {/* Background Color */}
        <FieldGroup label="Background">
          <ColorPickerPopover
            color={settings.backgroundColor || '#6366f1'}
            onChange={(color) => onChange({ backgroundColor: color, preset: 'custom' })}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ 
                  background: settings.gradient || settings.backgroundColor || '#6366f1' 
                }}
              />
              <span className="text-xs text-foreground font-mono truncate">
                {settings.gradient ? 'Gradient' : settings.backgroundColor || '#6366f1'}
              </span>
            </button>
          </ColorPickerPopover>
        </FieldGroup>

        {/* Gradient input for gradient preset */}
        {currentPreset === 'gradient' && (
          <FieldGroup label="Gradient CSS" hint="e.g., linear-gradient(90deg, #6366f1, #a855f7)">
            <input
              type="text"
              value={settings.gradient || ''}
              onChange={(e) => onChange({ gradient: e.target.value })}
              placeholder="linear-gradient(90deg, #6366f1, #a855f7)"
              className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background"
            />
          </FieldGroup>
        )}

        {/* Text Color */}
        <FieldGroup label="Text Color">
          <ColorPickerPopover
            color={settings.textColor || '#ffffff'}
            onChange={(color) => onChange({ textColor: color, preset: 'custom' })}
          >
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
              <div 
                className="w-5 h-5 rounded border border-border"
                style={{ backgroundColor: settings.textColor || '#ffffff' }}
              />
              <span className="text-xs text-foreground font-mono">
                {settings.textColor || '#ffffff'}
              </span>
            </button>
          </ColorPickerPopover>
        </FieldGroup>
      </CollapsibleSection>

      {/* Size & Shape */}
      <CollapsibleSection 
        title="Size & Shape" 
        icon={<Square className="w-3.5 h-3.5" />}
        defaultOpen={!compact}
      >
        {/* Size */}
        <FieldGroup label="Size">
          <Select
            value={settings.size || 'md'}
            onValueChange={(value) => onChange({ size: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* Border Radius */}
        <FieldGroup label="Corner Radius">
          <div className="flex items-center gap-3">
            <Slider
              value={[settings.borderRadius ?? 12]}
              onValueChange={([value]) => onChange({ borderRadius: value })}
              min={0}
              max={32}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-builder-text-muted w-10 text-right">
              {settings.borderRadius ?? 12}px
            </span>
          </div>
        </FieldGroup>

        {/* Full Width */}
        {showFullWidth && (
          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-xs text-builder-text">Full Width</Label>
              <p className="text-[10px] text-builder-text-dim">Stretch to container</p>
            </div>
            <Switch
              checked={settings.fullWidth ?? false}
              onCheckedChange={(checked) => onChange({ fullWidth: checked })}
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Effects */}
      {!compact && (
        <CollapsibleSection 
          title="Effects" 
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          {/* Shadow */}
          <FieldGroup label="Shadow">
            <Select
              value={settings.shadow || 'none'}
              onValueChange={(value) => onChange({ shadow: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHADOW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default ButtonStyleInspector;
