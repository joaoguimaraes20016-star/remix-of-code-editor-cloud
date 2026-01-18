import React, { useState } from 'react';
import { Element, AnimationSettings } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import { Sparkles, Play, ChevronRight, ChevronDown, X, Zap, RotateCcw, MousePointer2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { scrollTransformPresets } from '../../hooks/useScrollTransform';

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
  { value: 'spring', label: 'Spring (Custom)' },
  { value: 'linear', label: 'Linear' },
];

// Spring physics presets
const springPresets = [
  { label: 'Gentle', stiffness: 120, damping: 20, mass: 1 },
  { label: 'Default', stiffness: 300, damping: 30, mass: 1 },
  { label: 'Snappy', stiffness: 400, damping: 25, mass: 0.8 },
  { label: 'Bouncy', stiffness: 200, damping: 15, mass: 1.2 },
  { label: 'Stiff', stiffness: 500, damping: 40, mass: 0.5 },
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
  
  // Spring physics values
  const springStiffness = element.animation?.springStiffness ?? 300;
  const springDamping = element.animation?.springDamping ?? 30;
  const springMass = element.animation?.springMass ?? 1;
  
  // Scroll animation options
  const scrollOffset = element.animation?.scrollOffset ?? 0;
  const exitAnimation = element.animation?.exitAnimation ?? false;
  const repeatAnimation = element.animation?.repeat ?? false;
  
  const [showSpringAdvanced, setShowSpringAdvanced] = useState(false);
  
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
              
              {/* Spring Physics Controls - shown when easing is spring */}
              {currentEasing === 'spring' && (
                <div className="space-y-3 pt-2 border-t border-builder-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[hsl(315,85%,58%)]" />
                      <span className="text-xs font-medium text-builder-text">Spring Physics</span>
                    </div>
                    <button
                      onClick={() => setShowSpringAdvanced(!showSpringAdvanced)}
                      className="text-[10px] text-builder-text-muted hover:text-builder-text"
                    >
                      {showSpringAdvanced ? 'Simple' : 'Advanced'}
                    </button>
                  </div>
                  
                  {/* Spring Presets */}
                  {!showSpringAdvanced && (
                    <div className="flex flex-wrap gap-1">
                      {springPresets.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => handleAnimationChange({
                            springStiffness: preset.stiffness,
                            springDamping: preset.damping,
                            springMass: preset.mass,
                          })}
                          className={cn(
                            "px-2 py-1 text-[10px] rounded border transition-colors",
                            springStiffness === preset.stiffness && 
                            springDamping === preset.damping && 
                            springMass === preset.mass
                              ? "border-[hsl(315,85%,58%)] bg-[hsl(315,85%,58%)]/10 text-[hsl(315,85%,58%)]"
                              : "border-builder-border text-builder-text-muted hover:text-builder-text"
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Advanced Spring Controls */}
                  {showSpringAdvanced && (
                    <div className="space-y-2">
                      {/* Stiffness */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-builder-text-muted">Stiffness</span>
                          <span className="text-[10px] font-mono text-builder-text-dim">{springStiffness}</span>
                        </div>
                        <Slider
                          value={[springStiffness]}
                          onValueChange={([v]) => handleAnimationChange({ springStiffness: v })}
                          min={50}
                          max={500}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Damping */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-builder-text-muted">Damping</span>
                          <span className="text-[10px] font-mono text-builder-text-dim">{springDamping}</span>
                        </div>
                        <Slider
                          value={[springDamping]}
                          onValueChange={([v]) => handleAnimationChange({ springDamping: v })}
                          min={5}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Mass */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-builder-text-muted">Mass</span>
                          <span className="text-[10px] font-mono text-builder-text-dim">{springMass.toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[springMass * 10]}
                          onValueChange={([v]) => handleAnimationChange({ springMass: v / 10 })}
                          min={5}
                          max={50}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Scroll Animation Options - shown when trigger is scroll */}
              {currentTrigger === 'scroll' && (
                <div className="space-y-3 pt-2 border-t border-builder-border/50">
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-builder-text-muted" />
                    <span className="text-xs text-builder-text-muted">Scroll Options</span>
                  </div>
                  
                  {/* Threshold */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-builder-text-muted">Trigger Threshold</span>
                      <span className="text-[10px] font-mono text-builder-text-dim">{Math.round((element.animation?.threshold ?? 0.1) * 100)}%</span>
                    </div>
                    <Slider
                      value={[(element.animation?.threshold ?? 0.1) * 100]}
                      onValueChange={([v]) => handleAnimationChange({ threshold: v / 100 })}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Scroll Offset */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-builder-text-muted">Offset</span>
                      <span className="text-[10px] font-mono text-builder-text-dim">{scrollOffset}px</span>
                    </div>
                    <Slider
                      value={[scrollOffset]}
                      onValueChange={([v]) => handleAnimationChange({ scrollOffset: v })}
                      min={-200}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Toggle Options */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-builder-text-muted">Animate on exit</span>
                    <Switch
                      checked={exitAnimation}
                      onCheckedChange={(v) => handleAnimationChange({ exitAnimation: v })}
                      className="scale-75"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-builder-text-muted">Repeat on re-entry</span>
                    <Switch
                      checked={repeatAnimation}
                      onCheckedChange={(v) => handleAnimationChange({ repeat: v })}
                      className="scale-75"
                    />
                  </div>
                </div>
              )}

              {/* Scroll Transform Binding - Phase 2 */}
              <div className="space-y-3 pt-2 border-t border-builder-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MousePointer2 className="w-3.5 h-3.5 text-builder-text-muted" />
                    <span className="text-xs text-builder-text-muted">Scroll Transform</span>
                  </div>
                  <Switch
                    checked={element.animation?.scrollTransform?.enabled ?? false}
                    onCheckedChange={(enabled) => handleAnimationChange({ 
                      scrollTransform: { 
                        ...element.animation?.scrollTransform,
                        enabled,
                        property: element.animation?.scrollTransform?.property || 'opacity',
                        startValue: element.animation?.scrollTransform?.startValue ?? 0,
                        endValue: element.animation?.scrollTransform?.endValue ?? 100,
                      } 
                    })}
                    className="scale-75"
                  />
                </div>

                {element.animation?.scrollTransform?.enabled && (
                  <div className="space-y-3 pl-2">
                    {/* Preset Selection */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-builder-text-muted">Preset</span>
                      <Select
                        value={
                          scrollTransformPresets.find(p => 
                            p.property === element.animation?.scrollTransform?.property &&
                            p.startValue === element.animation?.scrollTransform?.startValue &&
                            p.endValue === element.animation?.scrollTransform?.endValue
                          )?.id || 'custom'
                        }
                        onValueChange={(id) => {
                          const preset = scrollTransformPresets.find(p => p.id === id);
                          if (preset) {
                            handleAnimationChange({ 
                              scrollTransform: {
                                enabled: true,
                                property: preset.property,
                                startValue: preset.startValue,
                                endValue: preset.endValue,
                              }
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-builder-surface border-builder-border">
                          <SelectValue placeholder="Select preset" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {scrollTransformPresets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id} className="text-xs">
                              {preset.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Property Selection */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-builder-text-muted">Property</span>
                      <Select
                        value={element.animation?.scrollTransform?.property || 'opacity'}
                        onValueChange={(property: 'opacity' | 'scale' | 'translateY' | 'translateX' | 'rotate') => 
                          handleAnimationChange({ 
                            scrollTransform: { 
                              ...element.animation?.scrollTransform!,
                              property 
                            } 
                          })
                        }
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-builder-surface border-builder-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="opacity" className="text-xs">Opacity</SelectItem>
                          <SelectItem value="scale" className="text-xs">Scale</SelectItem>
                          <SelectItem value="translateY" className="text-xs">Move Y</SelectItem>
                          <SelectItem value="translateX" className="text-xs">Move X</SelectItem>
                          <SelectItem value="rotate" className="text-xs">Rotate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Value */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-builder-text-muted">Start Value</span>
                        <span className="text-[10px] font-mono text-builder-text-dim">
                          {element.animation?.scrollTransform?.startValue ?? 0}
                          {element.animation?.scrollTransform?.property === 'opacity' || 
                           element.animation?.scrollTransform?.property === 'scale' ? '%' : 
                           element.animation?.scrollTransform?.property === 'rotate' ? '°' : 'px'}
                        </span>
                      </div>
                      <Slider
                        value={[element.animation?.scrollTransform?.startValue ?? 0]}
                        onValueChange={([v]) => handleAnimationChange({ 
                          scrollTransform: { 
                            ...element.animation?.scrollTransform!,
                            startValue: v 
                          } 
                        })}
                        min={element.animation?.scrollTransform?.property === 'rotate' ? -180 : -200}
                        max={element.animation?.scrollTransform?.property === 'rotate' ? 180 : 200}
                        step={element.animation?.scrollTransform?.property === 'opacity' || 
                              element.animation?.scrollTransform?.property === 'scale' ? 5 : 10}
                        className="w-full"
                      />
                    </div>

                    {/* End Value */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-builder-text-muted">End Value</span>
                        <span className="text-[10px] font-mono text-builder-text-dim">
                          {element.animation?.scrollTransform?.endValue ?? 100}
                          {element.animation?.scrollTransform?.property === 'opacity' || 
                           element.animation?.scrollTransform?.property === 'scale' ? '%' : 
                           element.animation?.scrollTransform?.property === 'rotate' ? '°' : 'px'}
                        </span>
                      </div>
                      <Slider
                        value={[element.animation?.scrollTransform?.endValue ?? 100]}
                        onValueChange={([v]) => handleAnimationChange({ 
                          scrollTransform: { 
                            ...element.animation?.scrollTransform!,
                            endValue: v 
                          } 
                        })}
                        min={element.animation?.scrollTransform?.property === 'rotate' ? -180 : -200}
                        max={element.animation?.scrollTransform?.property === 'rotate' ? 180 : 200}
                        step={element.animation?.scrollTransform?.property === 'opacity' || 
                              element.animation?.scrollTransform?.property === 'scale' ? 5 : 10}
                        className="w-full"
                      />
                    </div>

                    <p className="text-[9px] text-builder-text-dim italic">
                      Binds property to scroll position. Preview in runtime.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimationPresetSection;
