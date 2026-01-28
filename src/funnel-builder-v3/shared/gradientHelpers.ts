/**
 * Funnel Builder v3 - Gradient Helpers
 * 
 * Pure utility functions for gradient manipulation.
 * IMPORTANT: All functions are pure - they never mutate input.
 */

import type { GradientValue, GradientStop } from './presets';

// Re-export types for convenience
export type { GradientValue, GradientStop };

/**
 * Default gradient value (purple-to-pink)
 */
export const defaultGradientValue: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#8b5cf6', position: 0 },
    { color: '#d946ef', position: 100 },
  ],
};

/**
 * Default gradient presets for rotation
 */
const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
  'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
  'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
  'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
];

let defaultGradientIndex = 0;

/**
 * Get a varied default gradient (rotates through palette)
 */
export const getVariedDefaultGradient = (): string => {
  const gradient = DEFAULT_GRADIENTS[defaultGradientIndex];
  defaultGradientIndex = (defaultGradientIndex + 1) % DEFAULT_GRADIENTS.length;
  return gradient;
};

/**
 * Deep clone a gradient object to prevent shared references
 */
export const cloneGradient = (gradient: GradientValue): GradientValue => ({
  type: gradient.type,
  angle: gradient.angle,
  stops: gradient.stops.map(stop => ({ ...stop })),
});

/**
 * Convert a gradient object to CSS gradient string
 * IMPORTANT: This function is PURE - it does NOT mutate the input gradient
 */
export const gradientToCSS = (gradient: GradientValue): string => {
  if (!gradient || !gradient.stops || gradient.stops.length === 0) {
    return getVariedDefaultGradient();
  }
  
  // Clone and sort stops to avoid mutating the original array
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsString})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stopsString})`;
};

/**
 * Parse CSS gradient string to GradientValue object
 */
export const cssToGradientValue = (css: string): GradientValue | null => {
  if (!css || !css.includes('gradient')) return null;
  
  const isRadial = css.includes('radial');
  const angleMatch = css.match(/(\d+)deg/);
  const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
  
  // Extract color stops
  const stopsRegex = /(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)|hsl\([^)]+\))\s*(\d+)?%?/g;
  const stops: GradientStop[] = [];
  let match;
  let index = 0;
  
  while ((match = stopsRegex.exec(css)) !== null) {
    const color = match[1];
    const position = match[2] ? parseInt(match[2]) : (index === 0 ? 0 : 100);
    stops.push({ color, position });
    index++;
  }
  
  if (stops.length < 2) return null;
  
  return {
    type: isRadial ? 'radial' : 'linear',
    angle,
    stops,
  };
};

/**
 * Compare two gradients for equality (deep comparison)
 */
export const gradientEquals = (
  a: GradientValue | undefined, 
  b: GradientValue | undefined
): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.type !== b.type || a.angle !== b.angle) return false;
  if (a.stops.length !== b.stops.length) return false;
  
  for (let i = 0; i < a.stops.length; i++) {
    if (a.stops[i].color !== b.stops[i].color || a.stops[i].position !== b.stops[i].position) {
      return false;
    }
  }
  return true;
};

/**
 * Normalize a gradient, ensuring it has valid defaults
 */
export const normalizeGradient = (gradient: GradientValue | undefined): GradientValue => {
  if (!gradient) return cloneGradient(defaultGradientValue);
  
  return {
    type: gradient.type || 'linear',
    angle: gradient.angle ?? 135,
    stops: gradient.stops?.length >= 2 
      ? gradient.stops.map(s => ({ 
          color: s.color || '#8B5CF6', 
          position: s.position ?? 0 
        }))
      : cloneGradient(defaultGradientValue).stops,
  };
};

/**
 * Extract the first color from a gradient for contrast calculations
 */
export const extractGradientFirstColor = (gradient: GradientValue): string => {
  if (!gradient.stops || gradient.stops.length === 0) {
    return '#8B5CF6';
  }
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  return sortedStops[0].color;
};

/**
 * Add a color stop to a gradient
 */
export const addGradientStop = (
  gradient: GradientValue, 
  color: string, 
  position: number
): GradientValue => {
  return {
    ...gradient,
    stops: [...gradient.stops, { color, position }].sort((a, b) => a.position - b.position),
  };
};

/**
 * Remove a color stop from a gradient (minimum 2 stops)
 */
export const removeGradientStop = (
  gradient: GradientValue, 
  index: number
): GradientValue => {
  if (gradient.stops.length <= 2) return gradient;
  
  return {
    ...gradient,
    stops: gradient.stops.filter((_, i) => i !== index),
  };
};

/**
 * Update a color stop in a gradient
 */
export const updateGradientStop = (
  gradient: GradientValue, 
  index: number, 
  updates: Partial<GradientStop>
): GradientValue => {
  return {
    ...gradient,
    stops: gradient.stops.map((stop, i) => 
      i === index ? { ...stop, ...updates } : stop
    ),
  };
};
