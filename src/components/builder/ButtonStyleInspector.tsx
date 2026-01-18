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
import { Input } from '@/components/ui/input';
import { 
  ChevronDown,
  ChevronRight,
  Palette,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPickerPopover, GradientPickerPopover, gradientToCSS, cloneGradient } from '@/flow-canvas/builder/components/modals';
import { ButtonIconPicker } from '@/flow-canvas/builder/components/ButtonIconPicker';
import type { GradientValue } from '@/flow-canvas/builder/components/modals';

// ─────────────────────────────────────────────────────────
// BUTTON STYLE TYPES
// ─────────────────────────────────────────────────────────

export interface ButtonStyleSettings {
  /** Preset: primary, secondary, outline, ghost, gradient, custom */
  preset?: string;
  /** Fill type: outline, solid, gradient */
  fillType?: 'outline' | 'solid' | 'gradient';
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Gradient value object */
  gradient?: GradientValue;
  /** Size: sm, md, lg, xl */
  size?: string;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Shadow: none, sm, md, lg, glow */
  shadow?: string;
  /** Full width mode */
  fullWidth?: boolean;
  /** Width mode: auto, fixed, full */
  widthMode?: 'auto' | 'fixed' | 'full';
  /** Custom width in pixels (for fixed mode) */
  customWidth?: number;
  /** Icon type (lucide icon name) */
  icon?: string;
  /** Show icon */
  showIcon?: boolean;
}

export interface ButtonStyleInspectorProps {
  settings: ButtonStyleSettings;
  onChange: (updates: Partial<ButtonStyleSettings>) => void;
  /** Show preset dropdown (default: true) */
  showPreset?: boolean;
  /** Show full width toggle (default: true) */
  showFullWidth?: boolean;
  /** Show icon picker (default: true) */
  showIcon?: boolean;
  /** Compact mode hides some options */
  compact?: boolean;
  /** Primary color from page settings */
  primaryColor?: string;
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
  { value: 'sm', label: 'Subtle' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'glow', label: 'Glow' },
];

// ─────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────

// Import shared CollapsibleSection from flow-canvas
import { CollapsibleSection } from '@/flow-canvas/builder/components/inspectors/shared/CollapsibleSection';

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
  showIcon: showIconProp = true,
  compact = false,
  primaryColor = '#8B5CF6',
}) => {
  const currentPreset = settings.preset || 'primary';
  const isCustom = currentPreset === 'custom' || currentPreset === 'gradient';
  const fillType = settings.fillType || 'solid';
  
  // Compute width mode from settings
  const widthMode = settings.widthMode || (
    settings.fullWidth ? 'full' : 
    settings.customWidth ? 'fixed' : 'auto'
  );

  const handlePresetChange = (preset: string) => {
    // IMPORTANT: single onChange call (avoid lost updates in parents that persist via one-shot merges)
    if (preset !== 'custom' && preset !== 'gradient') {
      onChange({
        preset,
        backgroundColor: undefined,
        textColor: undefined,
        gradient: undefined,
        fillType: preset === 'outline' ? 'outline' : 'solid',
      });
      return;
    }

    onChange({ preset });
  };

  const handleFillTypeChange = (newFillType: 'outline' | 'solid' | 'gradient') => {
    if (newFillType === 'outline') {
      onChange({ 
        fillType: 'outline', 
        gradient: undefined,
        backgroundColor: 'transparent',
      });
    } else if (newFillType === 'solid') {
      const bg = settings.backgroundColor && settings.backgroundColor !== 'transparent' 
        ? settings.backgroundColor 
        : primaryColor;
      onChange({ 
        fillType: 'solid', 
        gradient: undefined,
        backgroundColor: bg,
      });
    } else {
      const gradient = settings.gradient || {
        type: 'linear' as const,
        angle: 135,
        stops: [
          { color: primaryColor, position: 0 },
          { color: '#D946EF', position: 100 },
        ],
      };
      onChange({ 
        fillType: 'gradient',
        gradient: cloneGradient(gradient),
      });
    }
  };

  const handleWidthModeChange = (mode: 'auto' | 'fixed' | 'full') => {
    if (mode === 'full') {
      onChange({ widthMode: 'full', fullWidth: true, customWidth: undefined });
    } else if (mode === 'fixed') {
      onChange({ widthMode: 'fixed', fullWidth: false, customWidth: settings.customWidth || 200 });
    } else {
      onChange({ widthMode: 'auto', fullWidth: false, customWidth: undefined });
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

      {/* Colors Section */}
      <CollapsibleSection 
        title="Colors" 
        icon={<Palette className="w-3.5 h-3.5" />}
        defaultOpen={isCustom}
      >
        {/* Fill Type Toggle */}
        <FieldGroup label="Fill">
          <div className="flex rounded-lg overflow-hidden border border-builder-border">
            <button
              onClick={() => handleFillTypeChange('outline')}
              className={cn(
                "flex-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
                fillType === 'outline'
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
              )}
            >
              Outline
            </button>
            <button
              onClick={() => handleFillTypeChange('solid')}
              className={cn(
                "flex-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
                fillType === 'solid'
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
              )}
            >
              Solid
            </button>
            <button
              onClick={() => handleFillTypeChange('gradient')}
              className={cn(
                "flex-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
                fillType === 'gradient'
                  ? 'bg-builder-accent text-white' 
                  : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
              )}
            >
              Gradient
            </button>
          </div>
        </FieldGroup>

        {/* Solid Color - Only show when fillType is solid */}
        {fillType === 'solid' && (
          <FieldGroup label="Background">
            <ColorPickerPopover
              color={settings.backgroundColor || primaryColor}
              onChange={(color) => onChange({ backgroundColor: color, preset: 'custom' })}
              showGradientOption={false}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-5 h-5 rounded border border-border"
                  style={{ backgroundColor: settings.backgroundColor || primaryColor }}
                />
                <span className="text-xs text-foreground font-mono truncate">
                  {settings.backgroundColor || primaryColor}
                </span>
              </button>
            </ColorPickerPopover>
          </FieldGroup>
        )}

        {/* Gradient - Only show when fillType is gradient */}
        {fillType === 'gradient' && (
          <FieldGroup label="Gradient">
            <GradientPickerPopover
              value={settings.gradient}
              onChange={(gradient) => onChange({ gradient: cloneGradient(gradient) })}
            >
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                <div 
                  className="w-12 h-5 rounded border border-border" 
                  style={{ 
                    background: settings.gradient 
                      ? gradientToCSS(settings.gradient) 
                      : `linear-gradient(135deg, ${primaryColor}, #D946EF)` 
                  }} 
                />
                <span className="text-xs text-muted-foreground">Edit</span>
              </button>
            </GradientPickerPopover>
          </FieldGroup>
        )}

        {/* Text Color */}
        <FieldGroup label="Text Color">
          <ColorPickerPopover
            color={settings.textColor || '#ffffff'}
            onChange={(color) => onChange({ textColor: color, preset: 'custom' })}
            showGradientOption={false}
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
        {/* Icon */}
        {showIconProp && settings.showIcon !== false && (
          <FieldGroup label="Icon">
            <ButtonIconPicker 
              value={settings.icon || 'ArrowRight'} 
              onChange={(value) => onChange({ icon: value })}
            />
          </FieldGroup>
        )}

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
              max={50}
              step={2}
              className="flex-1"
            />
            <span className="text-xs text-builder-text-muted w-10 text-right">
              {settings.borderRadius ?? 12}px
            </span>
          </div>
        </FieldGroup>

        {/* Width Mode */}
        {showFullWidth && (
          <FieldGroup label="Width">
            <div className="flex items-center gap-2">
              <Select 
                value={widthMode}
                onValueChange={handleWidthModeChange}
              >
                <SelectTrigger className="flex-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
              {widthMode === 'fixed' && (
                <Input
                  type="number"
                  value={settings.customWidth || 200}
                  onChange={(e) => onChange({ customWidth: parseInt(e.target.value) || 200 })}
                  className="w-20 text-xs"
                  min={50}
                  max={800}
                />
              )}
            </div>
          </FieldGroup>
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
              value={settings.shadow || 'lg'}
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
