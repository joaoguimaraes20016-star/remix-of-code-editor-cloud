// Gradient utility functions - centralized for consistency

import type { GradientValue } from '../components/modals';

/**
 * Deep clone a gradient object to prevent shared references
 * This prevents mutation bugs when multiple components share gradient objects
 */
export const cloneGradient = (gradient: GradientValue): GradientValue => ({
  type: gradient.type,
  angle: gradient.angle,
  stops: gradient.stops.map(stop => ({ ...stop })),
});

// Varied default gradients for fallback - rotates through different palettes
const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)', // Violet-Fuchsia
  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', // Sapphire
  'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)', // Ocean
  'linear-gradient(135deg, #10B981 0%, #047857 100%)', // Emerald
  'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', // Sunset
  'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', // Coral
  'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', // Indigo
  'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', // Teal
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
 * Convert a gradient object to CSS gradient string
 * IMPORTANT: This function is PURE - it does NOT mutate the input gradient
 */
export const gradientToCSS = (gradient: GradientValue): string => {
  if (!gradient || !gradient.stops || gradient.stops.length === 0) {
    // Use varied fallback instead of always the same purple-pink
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
 * Default gradient for new gradient selections
 */
export const defaultGradient: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#8B5CF6', position: 0 },
    { color: '#D946EF', position: 100 },
  ],
};

/**
 * Compare two gradients for equality (deep comparison)
 */
export const gradientEquals = (a: GradientValue | undefined, b: GradientValue | undefined): boolean => {
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
  if (!gradient) return cloneGradient(defaultGradient);
  
  return {
    type: gradient.type || 'linear',
    angle: gradient.angle ?? 135,
    stops: gradient.stops?.length >= 2 
      ? gradient.stops.map(s => ({ color: s.color || '#8B5CF6', position: s.position ?? 0 }))
      : cloneGradient(defaultGradient).stops,
  };
};
