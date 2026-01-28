/**
 * Funnel Builder v3 - Animation Presets
 * 
 * Unified animation presets for all block types.
 */

// =============================================================================
// TYPES
// =============================================================================

export type AnimationEffect = 
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'scale-up'
  | 'blur-in'
  | 'rotate-in'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'wiggle';

export type AnimationTrigger = 'load' | 'scroll' | 'hover';

export type AnimationEasing = 
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'
  | 'spring';

export interface AnimationSettings {
  effect: AnimationEffect;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  easing?: AnimationEasing;
  threshold?: number;
  // Spring physics (when easing = 'spring')
  springStiffness?: number;
  springDamping?: number;
  springMass?: number;
  // Advanced options
  repeat?: boolean;
  exitAnimation?: boolean;
  scrollOffset?: number;
}

export interface AnimationPreset {
  id: AnimationEffect;
  label: string;
  description: string;
  category: 'entrance' | 'attention' | 'exit';
  defaults: {
    duration: number;
    easing: AnimationEasing;
    delay?: number;
  };
}

// =============================================================================
// PRESETS
// =============================================================================

export const animationPresets: AnimationPreset[] = [
  // Entrance animations
  { 
    id: 'none', 
    label: 'None', 
    description: 'No animation',
    category: 'entrance',
    defaults: { duration: 0, easing: 'ease-out' }
  },
  { 
    id: 'fade-in', 
    label: 'Fade In', 
    description: 'Simple fade effect',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-up', 
    label: 'Slide Up', 
    description: 'Slide from bottom',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-down', 
    label: 'Slide Down', 
    description: 'Slide from top',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-left', 
    label: 'Slide Left', 
    description: 'Slide from right',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'slide-right', 
    label: 'Slide Right', 
    description: 'Slide from left',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  { 
    id: 'scale-in', 
    label: 'Scale In', 
    description: 'Grow from small',
    category: 'entrance',
    defaults: { duration: 400, easing: 'ease-out' }
  },
  { 
    id: 'scale-up', 
    label: 'Scale Up', 
    description: 'Pop up effect',
    category: 'entrance',
    defaults: { duration: 300, easing: 'spring' }
  },
  { 
    id: 'blur-in', 
    label: 'Blur In', 
    description: 'Fade with blur',
    category: 'entrance',
    defaults: { duration: 600, easing: 'ease-out' }
  },
  { 
    id: 'rotate-in', 
    label: 'Rotate In', 
    description: 'Spin into view',
    category: 'entrance',
    defaults: { duration: 500, easing: 'ease-out' }
  },
  // Attention animations
  { 
    id: 'bounce', 
    label: 'Bounce', 
    description: 'Bouncing effect',
    category: 'attention',
    defaults: { duration: 800, easing: 'ease-in-out' }
  },
  { 
    id: 'pulse', 
    label: 'Pulse', 
    description: 'Pulsing glow',
    category: 'attention',
    defaults: { duration: 1000, easing: 'ease-in-out' }
  },
  { 
    id: 'shake', 
    label: 'Shake', 
    description: 'Attention shake',
    category: 'attention',
    defaults: { duration: 500, easing: 'ease-in-out' }
  },
  { 
    id: 'wiggle', 
    label: 'Wiggle', 
    description: 'Playful wiggle',
    category: 'attention',
    defaults: { duration: 600, easing: 'ease-in-out' }
  },
];

// =============================================================================
// TRIGGER OPTIONS
// =============================================================================

export const triggerOptions: { value: AnimationTrigger; label: string }[] = [
  { value: 'load', label: 'On Page Load' },
  { value: 'scroll', label: 'On Scroll Into View' },
  { value: 'hover', label: 'On Hover' },
];

// =============================================================================
// EASING OPTIONS
// =============================================================================

export const easingOptions: { value: AnimationEasing; label: string }[] = [
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-in-out', label: 'Ease In/Out' },
  { value: 'spring', label: 'Spring (Custom)' },
  { value: 'linear', label: 'Linear' },
];

// =============================================================================
// SPRING PHYSICS PRESETS
// =============================================================================

export interface SpringPreset {
  label: string;
  stiffness: number;
  damping: number;
  mass: number;
}

export const springPresets: SpringPreset[] = [
  { label: 'Gentle', stiffness: 120, damping: 20, mass: 1 },
  { label: 'Default', stiffness: 300, damping: 30, mass: 1 },
  { label: 'Snappy', stiffness: 400, damping: 25, mass: 0.8 },
  { label: 'Bouncy', stiffness: 200, damping: 15, mass: 1.2 },
  { label: 'Stiff', stiffness: 500, damping: 40, mass: 0.5 },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get default animation settings for a preset
 */
export const getDefaultAnimationSettings = (effect: AnimationEffect): AnimationSettings => {
  const preset = animationPresets.find(p => p.id === effect);
  
  if (!preset || effect === 'none') {
    return {
      effect: 'none',
      trigger: 'scroll',
      duration: 0,
      delay: 0,
    };
  }
  
  return {
    effect,
    trigger: 'scroll',
    duration: preset.defaults.duration,
    delay: preset.defaults.delay || 0,
    easing: preset.defaults.easing,
    threshold: 0.1,
  };
};

/**
 * Get CSS animation class for an effect
 */
export const getAnimationClass = (effect: AnimationEffect): string => {
  if (!effect || effect === 'none') return '';
  return `builder-animate-${effect}`;
};

/**
 * Get CSS animation style object
 */
export const getAnimationStyle = (settings: AnimationSettings): React.CSSProperties => {
  if (!settings || settings.effect === 'none') return {};
  
  return {
    animationDuration: `${settings.duration}ms`,
    animationDelay: `${settings.delay}ms`,
    animationTimingFunction: settings.easing === 'spring' 
      ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
      : settings.easing,
  };
};

/**
 * Get animation presets by category
 */
export const getPresetsByCategory = (category: 'entrance' | 'attention' | 'exit'): AnimationPreset[] => {
  return animationPresets.filter(p => p.category === category);
};

/**
 * Check if an animation is an attention animation (loops)
 */
export const isAttentionAnimation = (effect: AnimationEffect): boolean => {
  const preset = animationPresets.find(p => p.id === effect);
  return preset?.category === 'attention';
};
