/**
 * Style Token System - Public API
 * 
 * Single source of truth for all visual styling in the funnel builder.
 */

// Core token definitions
export {
  StyleTokenSystem,
  shadowTokens,
  radiusTokens,
  borderWidthTokens,
  effectTokens,
  hoverTokens,
  tokenMetadata,
  hexToRgba,
  type StyleTokens,
  type ShadowToken,
  type RadiusToken,
  type BorderWidthToken,
  type EffectToken,
  type HoverToken,
} from './StyleTokenSystem';

// Token resolution
export {
  resolveTokens,
  resolveShadow,
  resolveRadius,
  resolveBorderWidth,
  resolveEffect,
  resolveHover,
  getHoverStyles,
  getEffectClassName,
  getHoverClassName,
  type TokenContext,
} from './TokenResolver';

// Import animations CSS (side effect)
import './animations.css';
