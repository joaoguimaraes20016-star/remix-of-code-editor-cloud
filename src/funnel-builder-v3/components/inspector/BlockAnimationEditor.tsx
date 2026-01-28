/**
 * Block Animation Editor - Entry animations for blocks
 */

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AnimationSettings, AnimationEffect, AnimationEasing } from '../../shared';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface BlockAnimationEditorProps {
  animation: AnimationSettings | undefined;
  onChange: (animation: AnimationSettings | undefined) => void;
}

const ANIMATION_EFFECTS: { value: AnimationEffect; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'scale-in', label: 'Scale In' },
  { value: 'scale-up', label: 'Scale Up' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'pulse', label: 'Pulse' },
];

const EASING_OPTIONS: { value: AnimationEasing; label: string }[] = [
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' },
];

export function BlockAnimationEditor({ animation, onChange }: BlockAnimationEditorProps) {
  const isEnabled = animation?.effect && animation.effect !== 'none';
  const effect = animation?.effect || 'none';
  const duration = animation?.duration ?? 400;
  const delay = animation?.delay ?? 0;
  const easing = animation?.easing || 'ease-out';

  const updateAnimation = (updates: Partial<AnimationSettings>) => {
    if (!animation) {
      onChange({ effect: 'fade-in', trigger: 'load', duration: 400, delay: 0, easing: 'ease-out', ...updates });
    } else {
      onChange({ ...animation, ...updates });
    }
  };

  return (
    <div className="space-y-4">
      {/* Enable Animation Toggle */}
      <div className="builder-v3-field-row">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[hsl(var(--builder-v3-text-muted))]" />
          <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Enable Animation</Label>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => {
            if (checked) {
              onChange({ effect: 'fade-in', trigger: 'load', duration: 400, delay: 0, easing: 'ease-out' });
            } else {
              onChange(undefined);
            }
          }}
        />
      </div>

      {isEnabled && (
        <>
          {/* Effect Type */}
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Effect</Label>
            <Select
              value={effect}
              onValueChange={(value) => updateAnimation({ effect: value as AnimationEffect })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
                {ANIMATION_EFFECTS.map((opt) => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="builder-v3-field-group">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Duration</Label>
              <span className="text-xs font-mono text-[hsl(var(--builder-v3-text-dim))]">{duration}ms</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([value]) => updateAnimation({ duration: value })}
              min={100}
              max={2000}
              step={50}
              className="w-full"
            />
          </div>

          {/* Delay */}
          <div className="builder-v3-field-group">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Delay</Label>
              <span className="text-xs font-mono text-[hsl(var(--builder-v3-text-dim))]">{delay}ms</span>
            </div>
            <Slider
              value={[delay]}
              onValueChange={([value]) => updateAnimation({ delay: value })}
              min={0}
              max={1000}
              step={50}
              className="w-full"
            />
          </div>

          {/* Easing */}
          <div className="builder-v3-field-group">
            <Label className="text-[11px] font-medium text-[hsl(var(--builder-v3-text-muted))]">Easing</Label>
            <Select
              value={easing}
              onValueChange={(value) => updateAnimation({ easing: value as AnimationEasing })}
            >
              <SelectTrigger className="builder-v3-control-md bg-[hsl(var(--builder-v3-surface-hover))] border-[hsl(var(--builder-v3-border))] text-[hsl(var(--builder-v3-text))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))] z-50">
                {EASING_OPTIONS.map((opt) => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className="text-[hsl(var(--builder-v3-text))] focus:bg-[hsl(var(--builder-v3-surface-hover))]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Animation */}
          <div className="pt-2">
            <button
              onClick={() => {
                // Trigger a quick re-render to preview animation
                const temp = animation;
                onChange(undefined);
                setTimeout(() => onChange(temp), 50);
              }}
              className={cn(
                'w-full py-2 px-3 rounded-md text-xs font-medium transition-colors',
                'bg-[hsl(var(--builder-v3-surface-hover))] border border-[hsl(var(--builder-v3-border))]',
                'text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-active))]'
              )}
            >
              Preview Animation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
