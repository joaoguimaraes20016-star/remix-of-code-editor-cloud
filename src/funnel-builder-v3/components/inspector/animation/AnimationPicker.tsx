/**
 * AnimationPicker - Full animation configuration UI
 * 
 * Features effect dropdown, trigger selection, timing controls, spring physics.
 */

import React, { useState } from 'react';
import { Play, X, Settings2 } from 'lucide-react';
import { SelectField } from '../controls/SelectField';
import { SliderField } from '../controls/SliderField';
import { ButtonGroup } from '../controls/ButtonGroup';
import { CollapsibleSection } from '../layout/CollapsibleSection';
import { cn } from '@/lib/utils';

// Animation settings type
export interface AnimationSettings {
  effect: string;
  trigger: 'load' | 'scroll' | 'hover';
  duration: number;
  delay: number;
  easing: string;
  spring?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

export interface AnimationPickerProps {
  value: AnimationSettings | undefined;
  onChange: (settings: AnimationSettings | undefined) => void;
  onReplay?: () => void;
  className?: string;
}

// Effect options grouped by category
const effectOptions = {
  'Entrance': [
    { value: 'none', label: 'None' },
    { value: 'fade-in', label: 'Fade In' },
    { value: 'slide-up', label: 'Slide Up' },
    { value: 'slide-down', label: 'Slide Down' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'scale-in', label: 'Scale In' },
    { value: 'blur-in', label: 'Blur In' },
    { value: 'rotate-in', label: 'Rotate In' },
  ],
  'Attention': [
    { value: 'bounce', label: 'Bounce' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'shake', label: 'Shake' },
    { value: 'wiggle', label: 'Wiggle' },
  ],
};

const triggerOptions = [
  { value: 'load', label: 'On Page Load' },
  { value: 'scroll', label: 'On Scroll' },
  { value: 'hover', label: 'On Hover' },
];

const easingOptions = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'linear', label: 'Linear' },
];

const springPresets = [
  { label: 'Gentle', stiffness: 100, damping: 30, mass: 1 },
  { label: 'Default', stiffness: 170, damping: 26, mass: 1 },
  { label: 'Snappy', stiffness: 300, damping: 30, mass: 1 },
  { label: 'Bouncy', stiffness: 200, damping: 10, mass: 1 },
  { label: 'Stiff', stiffness: 400, damping: 40, mass: 1 },
];

const defaultSettings: AnimationSettings = {
  effect: 'none',
  trigger: 'load',
  duration: 500,
  delay: 0,
  easing: 'ease-out',
};

export function AnimationPicker({
  value,
  onChange,
  onReplay,
  className,
}: AnimationPickerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const settings = value || defaultSettings;

  const updateSettings = (updates: Partial<AnimationSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const handleEffectChange = (effect: string) => {
    if (effect === 'none') {
      onChange(undefined);
    } else {
      updateSettings({ effect });
    }
  };

  const applySpringPreset = (preset: typeof springPresets[0]) => {
    updateSettings({
      spring: {
        stiffness: preset.stiffness,
        damping: preset.damping,
        mass: preset.mass,
      },
    });
  };

  const hasAnimation = settings.effect !== 'none';
  const isSpring = settings.easing === 'spring';

  return (
    <CollapsibleSection
      title="Animation"
      defaultOpen={hasAnimation}
      badge={hasAnimation ? settings.effect.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined}
      accentColor={hasAnimation ? 'linear-gradient(90deg, #8B5CF6 0%, #D946EF 100%)' : undefined}
      className={className}
    >
      <div className="space-y-4">
        {/* Effect selection */}
        <SelectField
          label="Effect"
          value={settings.effect}
          onChange={handleEffectChange}
          grouped={effectOptions}
        />

        {hasAnimation && (
          <>
            {/* Trigger */}
            <SelectField
              label="Trigger"
              value={settings.trigger}
              onChange={(trigger) => updateSettings({ trigger: trigger as AnimationSettings['trigger'] })}
              options={triggerOptions}
            />

            {/* Duration */}
            <SliderField
              label="Duration"
              value={settings.duration}
              onChange={(duration) => updateSettings({ duration })}
              min={100}
              max={2000}
              step={50}
              unit="ms"
            />

            {/* Delay */}
            <SliderField
              label="Delay"
              value={settings.delay}
              onChange={(delay) => updateSettings({ delay })}
              min={0}
              max={2000}
              step={50}
              unit="ms"
            />

            {/* Easing */}
            <SelectField
              label="Easing"
              value={settings.easing}
              onChange={(easing) => updateSettings({ easing })}
              options={easingOptions}
            />

            {/* Spring physics (when easing = spring) */}
            {isSpring && (
              <div className="space-y-3 pt-2 border-t border-[hsl(var(--builder-v3-border))]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-secondary))]">
                    Spring Physics
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                      "p-1 rounded",
                      showAdvanced 
                        ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                        : "text-[hsl(var(--builder-v3-text-muted))] hover:bg-[hsl(var(--builder-v3-surface-hover))]"
                    )}
                  >
                    <Settings2 size={12} />
                  </button>
                </div>

                {/* Preset buttons */}
                <div className="flex flex-wrap gap-1">
                  {springPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applySpringPreset(preset)}
                      className={cn(
                        "px-2 py-1 text-[10px] rounded transition-colors",
                        settings.spring?.stiffness === preset.stiffness &&
                        settings.spring?.damping === preset.damping
                          ? "bg-[hsl(var(--builder-v3-accent))] text-white"
                          : "bg-[hsl(var(--builder-v3-surface-hover))] text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-active))]"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Advanced spring controls */}
                {showAdvanced && (
                  <div className="space-y-3 pt-2">
                    <SliderField
                      label="Stiffness"
                      value={settings.spring?.stiffness || 170}
                      onChange={(stiffness) => updateSettings({
                        spring: { ...settings.spring || { damping: 26, mass: 1 }, stiffness }
                      })}
                      min={50}
                      max={500}
                      step={10}
                    />
                    <SliderField
                      label="Damping"
                      value={settings.spring?.damping || 26}
                      onChange={(damping) => updateSettings({
                        spring: { ...settings.spring || { stiffness: 170, mass: 1 }, damping }
                      })}
                      min={5}
                      max={50}
                      step={1}
                    />
                    <SliderField
                      label="Mass"
                      value={settings.spring?.mass || 1}
                      onChange={(mass) => updateSettings({
                        spring: { ...settings.spring || { stiffness: 170, damping: 26 }, mass }
                      })}
                      min={0.1}
                      max={3}
                      step={0.1}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {onReplay && (
                <button
                  type="button"
                  onClick={onReplay}
                  className={cn(
                    "flex-1 h-8 rounded flex items-center justify-center gap-1.5 text-xs",
                    "bg-[hsl(var(--builder-v3-accent))]",
                    "text-white",
                    "hover:opacity-90",
                    "transition-opacity"
                  )}
                >
                  <Play size={12} />
                  Replay
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className={cn(
                  "h-8 px-3 rounded flex items-center justify-center gap-1.5 text-xs",
                  "bg-[hsl(var(--builder-v3-surface-hover))]",
                  "text-[hsl(var(--builder-v3-text-secondary))]",
                  "hover:bg-[hsl(var(--builder-v3-surface-active))]",
                  "transition-colors"
                )}
              >
                <X size={12} />
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
