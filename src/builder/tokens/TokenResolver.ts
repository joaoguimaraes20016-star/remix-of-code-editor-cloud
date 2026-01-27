/**
 * TokenResolver - Converts style tokens to CSS properties
 * 
 * This is the ONLY place where tokens become CSS.
 * No conditional logic. No fallbacks. Just token → CSS.
 */

import type { CSSProperties } from 'react';
import {
  StyleTokenSystem,
  type StyleTokens,
  type ShadowToken,
  type RadiusToken,
  type BorderWidthToken,
  type EffectToken,
  type HoverToken,
} from './StyleTokenSystem';

export interface TokenContext {
  /** Primary color for glow effects */
  primaryColor?: string;
  /** Whether element is currently hovered */
  isHovered?: boolean;
}

const DEFAULT_PRIMARY_COLOR = '#8b5cf6'; // Purple fallback

/**
 * Resolve a single shadow token to CSS
 */
export function resolveShadow(
  token: ShadowToken | undefined,
  primaryColor: string = DEFAULT_PRIMARY_COLOR
): CSSProperties {
  if (!token || token === 'none') return { boxShadow: 'none' };
  
  const tokenDef = StyleTokenSystem.shadow[token];
  if (!tokenDef) return {};
  
  return typeof tokenDef === 'function' ? tokenDef(primaryColor) : tokenDef;
}

/**
 * Resolve a single radius token to CSS
 */
export function resolveRadius(token: RadiusToken | undefined): CSSProperties {
  if (!token) return {};
  return StyleTokenSystem.radius[token] || {};
}

/**
 * Resolve a single border width token to CSS
 */
export function resolveBorderWidth(token: BorderWidthToken | undefined): CSSProperties {
  if (!token) return {};
  return StyleTokenSystem.borderWidth[token] || {};
}

/**
 * Resolve a single effect token to CSS
 */
export function resolveEffect(token: EffectToken | undefined): CSSProperties {
  if (!token || token === 'none') return {};
  return StyleTokenSystem.effect[token] || {};
}

/**
 * Resolve a single hover token to CSS
 */
export function resolveHover(
  token: HoverToken | undefined,
  primaryColor: string = DEFAULT_PRIMARY_COLOR
): CSSProperties {
  if (!token || token === 'none') return {};
  
  const tokenDef = StyleTokenSystem.hover[token];
  if (!tokenDef) return {};
  
  return typeof tokenDef === 'function' ? tokenDef(primaryColor) : tokenDef;
}

/**
 * Main token resolution function
 * 
 * Resolves ALL style tokens to a single CSSProperties object.
 * This is the single source of truth for token → CSS conversion.
 * 
 * @param tokens - The style tokens to resolve
 * @param context - Optional context (primary color, hover state)
 * @returns Complete CSS properties object
 */
export function resolveTokens(
  tokens: StyleTokens | undefined,
  context: TokenContext = {}
): CSSProperties {
  if (!tokens) return {};
  
  const primaryColor = context.primaryColor || DEFAULT_PRIMARY_COLOR;
  const result: CSSProperties = {};
  
  // Shadow
  if (tokens.shadow !== undefined) {
    Object.assign(result, resolveShadow(tokens.shadow, primaryColor));
  }
  
  // Radius
  if (tokens.radius !== undefined) {
    Object.assign(result, resolveRadius(tokens.radius));
  }
  
  // Border Width
  if (tokens.borderWidth !== undefined) {
    Object.assign(result, resolveBorderWidth(tokens.borderWidth));
  }
  
  // Effect (animation)
  if (tokens.effect !== undefined && tokens.effect !== 'none') {
    Object.assign(result, resolveEffect(tokens.effect));
  }
  
  // Hover (only apply if hovered)
  if (context.isHovered && tokens.hover !== undefined && tokens.hover !== 'none') {
    Object.assign(result, resolveHover(tokens.hover, primaryColor));
  }
  
  return result;
}

/**
 * Get hover styles for a token (for use in onMouseEnter/Leave)
 */
export function getHoverStyles(
  tokens: StyleTokens | undefined,
  primaryColor: string = DEFAULT_PRIMARY_COLOR
): CSSProperties {
  if (!tokens?.hover || tokens.hover === 'none') return {};
  return resolveHover(tokens.hover, primaryColor);
}

/**
 * Get CSS class name for effect animation
 * (Alternative to inline styles for animations)
 */
export function getEffectClassName(token: EffectToken | undefined): string {
  if (!token || token === 'none') return '';
  return `token-effect-${token}`;
}

/**
 * Get CSS class name for hover effect
 * (Alternative to inline styles for hover)
 */
export function getHoverClassName(token: HoverToken | undefined): string {
  if (!token || token === 'none') return '';
  return `token-hover-${token}`;
}
