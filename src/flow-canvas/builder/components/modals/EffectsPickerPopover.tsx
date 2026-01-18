import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Maximize,
  Type,
  MousePointer,
  Eye,
  Vibrate,
  Heart,
  Star
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommitSlider } from '../CommitSlider';
import { cn } from '@/lib/utils';

interface Effect {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'entrance' | 'text' | 'icon' | 'attention';
}

const effects: Effect[] = [
  // Entrance animations
  { id: 'fade-in', name: 'Fade In', icon: <Zap className="w-4 h-4" />, description: 'Smoothly fade in', category: 'entrance' },
  { id: 'slide-up', name: 'Slide Up', icon: <ArrowUp className="w-4 h-4" />, description: 'Slide from below', category: 'entrance' },
  { id: 'slide-down', name: 'Slide Down', icon: <ArrowDown className="w-4 h-4" />, description: 'Slide from above', category: 'entrance' },
  { id: 'slide-left', name: 'Slide Left', icon: <ArrowLeft className="w-4 h-4" />, description: 'Slide from right', category: 'entrance' },
  { id: 'slide-right', name: 'Slide Right', icon: <ArrowRight className="w-4 h-4" />, description: 'Slide from left', category: 'entrance' },
  { id: 'scale', name: 'Scale', icon: <Maximize className="w-4 h-4" />, description: 'Scale up from center', category: 'entrance' },
  { id: 'rotate', name: 'Rotate', icon: <RotateCw className="w-4 h-4" />, description: 'Rotate in', category: 'entrance' },
  { id: 'bounce-in', name: 'Bounce In', icon: <ArrowDown className="w-4 h-4" />, description: 'Bounce into view', category: 'entrance' },
  { id: 'flip-in', name: 'Flip In', icon: <RotateCw className="w-4 h-4" />, description: '3D flip entrance', category: 'entrance' },
  
  // Text animations
  { id: 'typewriter', name: 'Typewriter', icon: <Type className="w-4 h-4" />, description: 'Type letter by letter', category: 'text' },
  { id: 'word-fade', name: 'Word Fade', icon: <Type className="w-4 h-4" />, description: 'Fade word by word', category: 'text' },
  { id: 'text-blur', name: 'Blur Reveal', icon: <Eye className="w-4 h-4" />, description: 'Blur to clear', category: 'text' },
  { id: 'text-glow', name: 'Glow', icon: <Sparkles className="w-4 h-4" />, description: 'Glowing text', category: 'text' },
  { id: 'text-gradient', name: 'Gradient Shift', icon: <Sparkles className="w-4 h-4" />, description: 'Animated gradient', category: 'text' },
  
  // Icon animations
  { id: 'icon-spin', name: 'Spin', icon: <RotateCw className="w-4 h-4" />, description: 'Continuous rotation', category: 'icon' },
  { id: 'icon-pulse', name: 'Pulse', icon: <Heart className="w-4 h-4" />, description: 'Heartbeat pulse', category: 'icon' },
  { id: 'icon-bounce', name: 'Bounce', icon: <ArrowUp className="w-4 h-4" />, description: 'Bouncing icon', category: 'icon' },
  { id: 'icon-shake', name: 'Shake', icon: <Vibrate className="w-4 h-4" />, description: 'Shake side to side', category: 'icon' },
  { id: 'icon-wobble', name: 'Wobble', icon: <Star className="w-4 h-4" />, description: 'Wobble rotation', category: 'icon' },
  
  // Attention animations
  { id: 'pulse', name: 'Pulse', icon: <Heart className="w-4 h-4" />, description: 'Gentle pulse', category: 'attention' },
  { id: 'shake', name: 'Shake', icon: <Vibrate className="w-4 h-4" />, description: 'Shake to grab attention', category: 'attention' },
  { id: 'wiggle', name: 'Wiggle', icon: <MousePointer className="w-4 h-4" />, description: 'Playful wiggle', category: 'attention' },
  { id: 'glow', name: 'Glow', icon: <Sparkles className="w-4 h-4" />, description: 'Glowing highlight', category: 'attention' },
];

interface EffectsPickerPopoverProps {
  children: React.ReactNode;
  onSelectEffect: (effectId: string, settings?: EffectSettings) => void;
  currentEffect?: string;
}

interface EffectSettings {
  duration: number;
  delay: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'bounce';
  repeat: 'once' | 'loop' | 'hover';
}

// Import unified presets from single source of truth
import { easingOptions } from '../../utils/presets';

// Filter to match EffectSettings['easing'] type
const EASING_OPTIONS = easingOptions.filter(
  e => ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'bounce'].includes(e.value)
) as { value: EffectSettings['easing']; label: string }[];

const REPEAT_OPTIONS: { value: EffectSettings['repeat']; label: string; icon: React.ReactNode }[] = [
  { value: 'once', label: 'Once', icon: <Zap className="w-3 h-3" /> },
  { value: 'loop', label: 'Loop', icon: <RotateCw className="w-3 h-3" /> },
  { value: 'hover', label: 'On Hover', icon: <MousePointer className="w-3 h-3" /> },
];

export const EffectsPickerPopover: React.FC<EffectsPickerPopoverProps> = ({
  children,
  onSelectEffect,
  currentEffect,
}) => {
  const [selectedEffect, setSelectedEffect] = useState<string | null>(currentEffect || null);
  const [duration, setDuration] = useState(0.5);
  const [delay, setDelay] = useState(0);
  const [easing, setEasing] = useState<EffectSettings['easing']>('ease');
  const [repeat, setRepeat] = useState<EffectSettings['repeat']>('once');
  const [isOpen, setIsOpen] = useState(false);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Manual outside-dismiss logic to prevent slider drags from closing the popover
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      
      // Check if click is inside content or trigger
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      
      // Check if click is inside any Radix portal (nested popovers, selects, etc.)
      const radixPortals = document.querySelectorAll(
        '[data-radix-popper-content-wrapper], [data-radix-popover-content], [data-radix-select-content]'
      );
      for (const portal of radixPortals) {
        if (portal.contains(target)) return;
      }
      
      // Close the popover
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [isOpen]);

  // Emit updated settings when any setting changes (if an effect is selected)
  React.useEffect(() => {
    if (selectedEffect) {
      onSelectEffect(selectedEffect, { duration, delay, easing, repeat });
    }
  }, [duration, delay, easing, repeat]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectEffect = (effectId: string) => {
    setSelectedEffect(effectId);
    onSelectEffect(effectId, { duration, delay, easing, repeat });
  };

  const handleRemoveEffect = () => {
    setSelectedEffect(null);
    setEasing('ease');
    setRepeat('once');
    onSelectEffect('', undefined);
    setIsOpen(false);
  };

  const entranceEffects = effects.filter(e => e.category === 'entrance');
  const textEffects = effects.filter(e => e.category === 'text');
  const iconEffects = effects.filter(e => e.category === 'icon');
  const attentionEffects = effects.filter(e => e.category === 'attention');

  const renderEffectList = (effectList: Effect[]) => (
    <div className="space-y-1 max-h-48 overflow-y-auto builder-scroll">
      {effectList.map((effect) => (
        <button
          key={effect.id}
          onClick={() => handleSelectEffect(effect.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
            (selectedEffect || currentEffect) === effect.id
              ? 'bg-builder-accent/10 text-builder-accent'
              : 'text-builder-text hover:bg-builder-surface-hover'
          )}
        >
          <div className={cn(
            'p-1.5 rounded-md',
            (selectedEffect || currentEffect) === effect.id ? 'bg-builder-accent/20' : 'bg-builder-surface-hover'
          )}>
            {effect.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{effect.name}</div>
            <div className="text-xs text-builder-text-muted">{effect.description}</div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild ref={triggerRef}>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        ref={contentRef}
        className="w-80 p-0 bg-builder-surface border-builder-border" 
        align="end"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-builder-border">
          <Sparkles className="w-4 h-4 text-builder-accent" />
          <span className="text-sm font-medium text-builder-text">Add Animation Effect</span>
        </div>
        
        <Tabs defaultValue="entrance" className="w-full">
          <TabsList className="w-full bg-builder-bg rounded-none border-b border-builder-border">
            <TabsTrigger value="entrance" className="flex-1 text-xs">Entrance</TabsTrigger>
            <TabsTrigger value="text" className="flex-1 text-xs">Text</TabsTrigger>
            <TabsTrigger value="icon" className="flex-1 text-xs">Icon</TabsTrigger>
            <TabsTrigger value="attention" className="flex-1 text-xs">Attention</TabsTrigger>
          </TabsList>
          
          <div className="p-2">
            <TabsContent value="entrance" className="mt-0">
              {renderEffectList(entranceEffects)}
            </TabsContent>
            <TabsContent value="text" className="mt-0">
              {renderEffectList(textEffects)}
            </TabsContent>
            <TabsContent value="icon" className="mt-0">
              {renderEffectList(iconEffects)}
            </TabsContent>
            <TabsContent value="attention" className="mt-0">
              {renderEffectList(attentionEffects)}
            </TabsContent>
          </div>
        </Tabs>

        {/* Timing Controls */}
        <div className="p-3 border-t border-builder-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Duration</span>
            <div className="flex items-center gap-2">
              <CommitSlider 
                value={duration * 10} 
                onValueCommit={(v) => setDuration(v / 10)}
                max={30}
                step={1}
                className="w-20"
              />
              <span className="text-xs text-builder-text w-8">{duration}s</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Delay</span>
            <div className="flex items-center gap-2">
              <CommitSlider 
                value={delay * 10} 
                onValueCommit={(v) => setDelay(v / 10)}
                max={20}
                step={1}
                className="w-20"
              />
              <span className="text-xs text-builder-text w-8">{delay}s</span>
            </div>
          </div>
          
          {/* Easing Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Easing</span>
            <div className="flex gap-1">
              {EASING_OPTIONS.slice(0, 4).map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); setEasing(opt.value); }}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded transition-colors',
                    easing === opt.value
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  {opt.label.replace('Ease ', '').replace('Ease', 'Ease')}
                </button>
              ))}
            </div>
          </div>
          
          {/* Repeat Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Repeat</span>
            <div className="flex gap-1">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); setRepeat(opt.value); }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors',
                    repeat === opt.value
                      ? 'bg-builder-accent text-white'
                      : 'bg-builder-surface-hover text-builder-text-muted hover:text-builder-text'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Remove Effect Button */}
        {(selectedEffect || currentEffect) && (
          <div className="p-2 border-t border-builder-border">
            <button
              onClick={handleRemoveEffect}
              className="w-full py-2 text-xs text-builder-error hover:bg-builder-error/10 rounded-lg transition-colors"
            >
              Remove Effect
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
