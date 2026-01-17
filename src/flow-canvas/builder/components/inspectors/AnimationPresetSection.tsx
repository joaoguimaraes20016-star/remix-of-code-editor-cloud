import React, { useState } from 'react';
import { Element } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import { Sparkles, Play, ChevronRight, ChevronDown, Eye } from 'lucide-react';
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
  { value: 'click', label: 'On Click' },
];

const easingOptions = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-in-out', label: 'Ease In/Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'linear', label: 'Linear' },
];

interface AnimationPresetSectionProps {
  element: Element;
  onUpdate: (updates: Partial<Element>) => void;
  onReplayAnimation?: () => void;
}

export const AnimationPresetSection: React.FC<AnimationPresetSectionProps> = ({
  element,
  onUpdate,
  onReplayAnimation,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const currentPresetId = (element.props?.animationPreset as string) || 'none';
  const currentTrigger = (element.props?.animationTrigger as string) || 'scroll';
  const currentDuration = (element.props?.animationDuration as number) || 500;
  const currentDelay = (element.props?.animationDelay as number) || 0;
  const currentEasing = (element.props?.animationEasing as string) || 'ease-out';
  
  const currentPreset = animationPresets.find(p => p.id === currentPresetId);
  
  const handlePresetChange = (presetId: string) => {
    const preset = animationPresets.find(p => p.id === presetId);
    if (preset) {
      onUpdate({
        props: {
          ...element.props,
          animationPreset: presetId,
          animationDuration: preset.animation.duration,
          animationEasing: preset.animation.easing || 'ease-out',
        }
      });
    }
  };
  
  const handlePropsChange = (key: string, value: unknown) => {
    onUpdate({
      props: {
        ...element.props,
        [key]: value,
      }
    });
  };

  return (
    <div className="inspector-section">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inspector-section-header w-full"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-builder-text-muted" />
          <span className="text-xs font-medium text-builder-text">Animation</span>
          {currentPresetId !== 'none' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-builder-accent/20 text-builder-accent">
              {currentPreset?.label}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-builder-text-dim" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-builder-text-dim" />
        )}
      </button>
      
      {isOpen && (
        <div className="inspector-section-content space-y-4">
          {/* Preset Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs text-builder-text-muted">Entrance Effect</Label>
            <Select value={currentPresetId} onValueChange={handlePresetChange}>
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
          
          {currentPresetId !== 'none' && (
            <>
              {/* Trigger */}
              <div className="space-y-1.5">
                <Label className="text-xs text-builder-text-muted">Trigger</Label>
                <Select 
                  value={currentTrigger} 
                  onValueChange={(v) => handlePropsChange('animationTrigger', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
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
              </div>
              
              {/* Duration */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-builder-text-muted">Duration</Label>
                  <span className="text-[10px] text-builder-text-dim">{currentDuration}ms</span>
                </div>
                <Slider
                  value={[currentDuration]}
                  onValueChange={([v]) => handlePropsChange('animationDuration', v)}
                  min={100}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
              
              {/* Delay */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-builder-text-muted">Delay</Label>
                  <span className="text-[10px] text-builder-text-dim">{currentDelay}ms</span>
                </div>
                <Slider
                  value={[currentDelay]}
                  onValueChange={([v]) => handlePropsChange('animationDelay', v)}
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
                  onValueChange={(v) => handlePropsChange('animationEasing', v)}
                >
                  <SelectTrigger className="builder-input text-xs">
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
              
              {/* Preview Button */}
              {onReplayAnimation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplayAnimation}
                  className="w-full text-xs h-8 gap-2"
                >
                  <Play className="w-3 h-3" />
                  Preview Animation
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimationPresetSection;
