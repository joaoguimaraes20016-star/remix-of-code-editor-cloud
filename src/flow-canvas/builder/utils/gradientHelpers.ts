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

/**
 * Convert a gradient object to CSS gradient string
 * IMPORTANT: This function is PURE - it does NOT mutate the input gradient
 */
export const gradientToCSS = (gradient: GradientValue): string => {
  if (!gradient || !gradient.stops || gradient.stops.length === 0) {
    return 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)';
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
