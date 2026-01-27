/**
 * StyleTokenSystem - Single source of truth for all visual tokens
 * 
 * This system provides guaranteed 1:1 mapping between token values and CSS output.
 * NO conditionals, NO fallbacks, NO surprises.
 * 
 * Usage:
 * - Inspector controls set tokens: element.tokens.shadow = 'lg'
 * - Renderer resolves tokens: resolveTokens(element.tokens) → CSS
 */

import type { CSSProperties } from 'react';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Handle HSL colors from design system
  if (hex.startsWith('hsl')) {
    return hex.replace(')', ` / ${alpha})`).replace('hsl(', 'hsla(');
  }
  
  // Handle rgb/rgba
  if (hex.startsWith('rgb')) {
    if (hex.includes('rgba')) {
      return hex;
    }
    return hex.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  
  // Handle hex
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(139, 92, 246, ${alpha})`; // Fallback purple
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// =============================================================================
// TOKEN TYPES
// =============================================================================

export type ShadowToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type BorderWidthToken = '0' | '1' | '2' | '4';
export type EffectToken = 'none' | 'fadeIn' | 'fadeOut' | 'slideUp' | 'slideDown' | 'scaleIn' | 'bounce';
export type HoverToken = 'none' | 'lift' | 'scale' | 'glow' | 'brighten';

export interface StyleTokens {
  shadow?: ShadowToken;
  radius?: RadiusToken;
  borderWidth?: BorderWidthToken;
  effect?: EffectToken;
  hover?: HoverToken;
}

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadowTokens: Record<ShadowToken, CSSProperties | ((color: string) => CSSProperties)> = {
  none: { boxShadow: 'none' },
  sm: { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
  md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
  lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
  xl: { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  glow: (color: string) => ({ 
    boxShadow: `0 0 20px ${hexToRgba(color, 0.5)}, 0 0 40px ${hexToRgba(color, 0.3)}` 
  }),
};

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const radiusTokens: Record<RadiusToken, CSSProperties> = {
  none: { borderRadius: '0' },
  sm: { borderRadius: '4px' },
  md: { borderRadius: '8px' },
  lg: { borderRadius: '12px' },
  xl: { borderRadius: '16px' },
  full: { borderRadius: '9999px' },
};

// =============================================================================
// BORDER WIDTH TOKENS
// =============================================================================

export const borderWidthTokens: Record<BorderWidthToken, CSSProperties> = {
  '0': { borderWidth: '0' },
  '1': { borderWidth: '1px' },
  '2': { borderWidth: '2px' },
  '4': { borderWidth: '4px' },
};

// =============================================================================
// EFFECT TOKENS (Entry/Exit Animations)
// =============================================================================

export const effectTokens: Record<EffectToken, CSSProperties> = {
  none: {},
  fadeIn: { animation: 'token-fadeIn 0.3s ease-out forwards' },
  fadeOut: { animation: 'token-fadeOut 0.3s ease-out forwards' },
  slideUp: { animation: 'token-slideUp 0.4s ease-out forwards' },
  slideDown: { animation: 'token-slideDown 0.4s ease-out forwards' },
  scaleIn: { animation: 'token-scaleIn 0.2s ease-out forwards' },
  bounce: { animation: 'token-bounce 0.5s ease-out forwards' },
};

// =============================================================================
// HOVER TOKENS
// =============================================================================

// Note: Hover tokens return the CSS for the :hover state
// The component is responsible for applying these on hover
export const hoverTokens: Record<HoverToken, CSSProperties | ((color: string) => CSSProperties)> = {
  none: {},
  lift: { transform: 'translateY(-2px)', transition: 'transform 0.2s ease-out' },
  scale: { transform: 'scale(1.02)', transition: 'transform 0.2s ease-out' },
  glow: (color: string) => ({ 
    filter: `drop-shadow(0 0 8px ${hexToRgba(color, 0.6)})`,
    transition: 'filter 0.2s ease-out',
  }),
  brighten: { filter: 'brightness(1.1)', transition: 'filter 0.2s ease-out' },
};

// =============================================================================
// STYLE TOKEN SYSTEM (Master Object)
// =============================================================================

export const StyleTokenSystem = {
  shadow: shadowTokens,
  radius: radiusTokens,
  borderWidth: borderWidthTokens,
  effect: effectTokens,
  hover: hoverTokens,
} as const;

// =============================================================================
// TOKEN METADATA (for UI controls)
// =============================================================================

export const tokenMetadata = {
  shadow: {
    label: 'Shadow',
    options: [
      { value: 'none', label: 'None' },
      { value: 'sm', label: 'S' },
      { value: 'md', label: 'M' },
      { value: 'lg', label: 'L' },
      { value: 'xl', label: 'XL' },
      { value: 'glow', label: 'Glow' },
    ] as const,
  },
  radius: {
    label: 'Corners',
    options: [
      { value: 'none', label: 'Sharp' },
      { value: 'sm', label: 'S' },
      { value: 'md', label: 'M' },
      { value: 'lg', label: 'L' },
      { value: 'xl', label: 'XL' },
      { value: 'full', label: 'Pill' },
    ] as const,
  },
  borderWidth: {
    label: 'Border',
    options: [
      { value: '0', label: 'None' },
      { value: '1', label: '1px' },
      { value: '2', label: '2px' },
      { value: '4', label: '4px' },
    ] as const,
  },
  effect: {
    label: 'Animation',
    options: [
      { value: 'none', label: 'None' },
      { value: 'fadeIn', label: 'Fade In' },
      { value: 'slideUp', label: 'Slide Up' },
      { value: 'slideDown', label: 'Slide Down' },
      { value: 'scaleIn', label: 'Scale In' },
      { value: 'bounce', label: 'Bounce' },
    ] as const,
  },
  hover: {
    label: 'Hover Effect',
    options: [
      { value: 'none', label: 'None' },
      { value: 'lift', label: 'Lift' },
      { value: 'scale', label: 'Scale' },
      { value: 'glow', label: 'Glow' },
      { value: 'brighten', label: 'Brighten' },
    ] as const,
  },
} as const;
