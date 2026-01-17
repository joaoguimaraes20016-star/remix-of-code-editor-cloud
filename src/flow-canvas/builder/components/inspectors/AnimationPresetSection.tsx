import React, { useState } from 'react';
import { Element, AnimationSettings } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import { Sparkles, Play, ChevronRight, ChevronDown, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AnimationPreset {
  id: string;
  label: string;
  description: string;
  category: 'entrance' | 'attention' | 'exit';
  animation: {
    type: string;
    duration: number;
    delay?: number;
    easing?: string;
  };
}

const animationPresets: AnimationPreset[] = [
  // Entrance animations
  { 
    id: 'none', 
    label: 'None', 
    description: 'No animation',
    category: 'entrance',
    animation: { type: 'none', duration: 0 }
  },
  { 
    id: 'fade-in', 
    label: 'Fade In', 
    description: 'Simple fade effect',
    category: 'entrance',
    animation: { type: 'fade-in', duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-up', 
    label: 'Slide Up', 
    description: 'Slide from bottom',
    category: 'entrance',
    animation: { type: 'slide-up', duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-down', 
    label: 'Slide Down', 
    description: 'Slide from top',
    category: 'entrance',
    animation: { type: 'slide-down', duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-left', 
    label: 'Slide Left', 
    description: 'Slide from right',
    category: 'entrance',
    animation: { type: 'slide-left', duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-right', 
    label: 'Slide Right', 
    description: 'Slide from left',
    category: 'entrance',
    animation: { type: 'slide-right', duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'scale-in', 
    label: 'Scale In', 
    description: 'Grow from small',
    category: 'entrance',
    animation: { type: 'scale-in', duration: 400, easing: 'ease-out' }
  },
  { 
    id: 'scale-up', 
    label: 'Scale Up', 
    description: 'Pop up effect',
    category: 'entrance',
    animation: { type: 'scale-up', duration: 300, easing: 'spring' }
  },
  { 
    id: 'blur-in', 
    label: 'Blur In', 
    description: 'Fade with blur',
    category: 'entrance',
    animation: { type: 'blur-in', duration: 600, easing: 'ease-out' }
  },
  { 
    id: 'rotate-in', 
    label: 'Rotate In', 
    description: 'Spin into view',
    category: 'entrance',
    animation: { type: 'rotate-in', duration: 500, easing: 'ease-out' }
  },
  // Attention animations
  { 
    id: 'bounce', 
    label: 'Bounce', 
    description: 'Bouncing effect',
    category: 'attention',
    animation: { type: 'bounce', duration: 800, easing: 'ease-in-out' }
  },
  { 
    id: 'pulse', 
    label: 'Pulse', 
    description: 'Pulsing glow',
    category: 'attention',
    animation: { type: 'pulse', duration: 1000, easing: 'ease-in-out' }
  },
  { 
    id: 'shake', 
    label: 'Shake', 
    description: 'Attention shake',
    category: 'attention',
    animation: { type: 'shake', duration: 500, easing: 'ease-in-out' }
  },
  { 
    id: 'wiggle', 
    label: 'Wiggle', 
    description: 'Playful wiggle',
    category: 'attention',
    animation: { type: 'wiggle', duration: 600, easing: 'ease-in-out' }
  },
];

const triggerOptions = [
  { value: 'load', label: 'On Page Load' },
  { value: 'scroll', label: 'On Scroll Into View' },
  { value: 'hover', label: 'On Hover' },
];

const easingOptions = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-in-out', label: 'Ease In/Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'linear', label: 'Linear' },
];

interface AnimationPresetSectionProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
  onReplayAnimation?: () => void;
}

/**
 * AnimationPresetSection - Uses legacy element.animation structure for compatibility
 * with the existing CanvasRenderer animation system.
 */
export const AnimationPresetSection: React.FC<AnimationPresetSectionProps> = ({
  element,
  onUpdate,
  onReplayAnimation,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Read from legacy element.animation structure
  const currentEffect = element.animation?.effect || 'none';
  const currentTrigger = element.animation?.trigger || 'scroll';
  const currentDuration = element.animation?.duration || 500;
  const currentDelay = element.animation?.delay || 0;
  const currentEasing = element.animation?.easing || 'ease-out';
  
  const currentPreset = animationPresets.find(p => p.id === currentEffect || p.animation.type === currentEffect);
  
  const handlePresetChange = (presetId: string) => {
    const preset = animationPresets.find(p => p.id === presetId);
    if (!preset || presetId === 'none') {
      // Clear animation
      onUpdate({ animation: undefined });
      return;
    }
    
    // Update using legacy animation structure
    onUpdate({
      animation: {
        effect: preset.animation.type,
        trigger: currentTrigger as 'load' | 'scroll' | 'hover',
        duration: preset.animation.duration,
        delay: currentDelay,
        easing: preset.animation.easing || 'ease-out',
        threshold: 0.1,
      } as AnimationSettings
    });
  };
  
  const handleAnimationChange = (updates: Partial<AnimationSettings>) => {
    onUpdate({
      animation: {
        effect: currentEffect,
        trigger: currentTrigger as 'load' | 'scroll' | 'hover',
        duration: currentDuration,
        delay: currentDelay,
        easing: currentEasing,
        threshold: 0.1,
        ...element.animation,
        ...updates,
      } as AnimationSettings
    });
  };

  return (
    <div className="px-4 py-3 border-b border-builder-border bg-gradient-to-r from-[hsl(315,85%,58%)]/5 to-transparent">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(315,85%,58%)]" />
          <span className="text-xs font-medium text-builder-text">Animation</span>
          {currentEffect && currentEffect !== 'none' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(315,85%,58%)]/20 text-[hsl(315,85%,58%)]">
              {currentPreset?.label || currentEffect}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {currentEffect && currentEffect !== 'none' && onReplayAnimation && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplayAnimation(); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-builder-surface-hover text-builder-text-muted hover:text-[hsl(315,85%,58%)] hover:bg-[hsl(315,85%,58%)]/10 transition-colors text-xs"
              title="Replay animation"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Preset Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs text-builder-text-muted">Effect</Label>
            <Select value={currentEffect || 'none'} onValueChange={handlePresetChange}>
              <SelectTrigger className="builder-input text-xs">
                <SelectValue placeholder="Select animation" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border max-h-60">
                <div className="px-2 py-1 text-[10px] text-muted-foreground font-medium">Entrance</div>
                {animationPresets.filter(p => p.category === 'entrance').map(preset => (
                  <SelectItem key={preset.id} value={preset.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{preset.label}</span>
                      <span className="text-muted-foreground text-[10px]">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] text-muted-foreground font-medium mt-1">Attention</div>
                {animationPresets.filter(p => p.category === 'attention').map(preset => (
                  <SelectItem key={preset.id} value={preset.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{preset.label}</span>
                      <span className="text-muted-foreground text-[10px]">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentEffect && currentEffect !== 'none' && (
            <>
              {/* Trigger */}
              <div className="flex items-center gap-2">
                <Select 
                  value={currentTrigger} 
                  onValueChange={(v) => handleAnimationChange({ trigger: v as 'load' | 'scroll' | 'hover' })}
                >
                  <SelectTrigger className="builder-input h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {triggerOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => onUpdate({ animation: undefined })}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-builder-text-muted hover:text-destructive transition-colors"
                  title="Remove animation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Duration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Duration</span>
                  <span className="text-xs font-mono text-builder-text-dim">{currentDuration}ms</span>
                </div>
                <Slider
                  value={[currentDuration]}
                  onValueChange={([v]) => handleAnimationChange({ duration: v })}
                  min={100}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
              
              {/* Delay */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-builder-text-muted">Delay</span>
                  <span className="text-xs font-mono text-builder-text-dim">{currentDelay}ms</span>
                </div>
                <Slider
                  value={[currentDelay]}
                  onValueChange={([v]) => handleAnimationChange({ delay: v })}
                  min={0}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
              
              {/* Easing */}
              <div className="space-y-1.5">
                <Label className="text-xs text-builder-text-muted">Easing</Label>
                <Select 
                  value={currentEasing} 
                  onValueChange={(v) => handleAnimationChange({ easing: v as 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' })}
                >
                  <SelectTrigger className="builder-input text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {easingOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimationPresetSection;
