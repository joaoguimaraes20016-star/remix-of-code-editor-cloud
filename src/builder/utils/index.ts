/**
 * Builder Utilities - Public API
 */

export {
  ContrastEngine,
  parseColor,
  getLuminance,
  getContrastRatio,
  meetsWCAGAA,
  isLightColor,
  getContrastTextColor,
  deriveHoverColor,
  deriveActiveColor,
  getThemeAwareColors,
  extractGradientFirstColor,
  isReadable,
  rgbToHsl,
  adjustBrightness,
  type RGB,
  type ThemeAwareColors,
} from './ContrastEngine';

export {
  HoverSystem,
  getButtonHoverStyles,
  getButtonHoverCSS,
  getHoverCSSVars,
  getHoverInlineStyles,
  suggestHoverPreset,
  type HoverPreset,
  type HoverStyles,
} from './HoverSystem';
