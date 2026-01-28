/**
 * Funnel Builder v3 - Shared Utilities
 * 
 * Public exports for all shared utilities.
 */

// Presets
export {
  // Color presets
  masterColorPresets,
  compactColorPresets,
  inspectorColorPresets,
  inspectorColorPresetsFlat,
  backgroundColorPresets,
  textColorPresets,
  highlightPresets,
  // Gradient presets
  masterGradientPresets,
  inspectorGradientPresets,
  // Shadow presets
  textShadowPresets,
  blockShadowPresets,
  // Font presets
  fontSizeOptions,
  fontWeightOptions,
  letterSpacingOptions,
  lineHeightOptions,
  textTransformOptions,
  masterFontFamilies,
  compactFontFamilies,
  // Utility functions
  getTextShadowCSS,
  getBlockShadowClass,
  // Types
  type GradientValue,
  type GradientStop,
  type GradientPreset,
  type TextShadowPreset,
  type BlockShadowPreset,
  type FontFamilyOption,
} from './presets';

// Gradient helpers
export {
  defaultGradientValue,
  getVariedDefaultGradient,
  cloneGradient,
  gradientToCSS,
  cssToGradientValue,
  gradientEquals,
  normalizeGradient,
  extractGradientFirstColor,
  addGradientStop,
  removeGradientStop,
  updateGradientStop,
} from './gradientHelpers';

// Animation presets
export {
  animationPresets,
  triggerOptions,
  easingOptions,
  springPresets,
  getDefaultAnimationSettings,
  getAnimationClass,
  getAnimationStyle,
  getPresetsByCategory,
  isAttentionAnimation,
  type AnimationEffect,
  type AnimationTrigger,
  type AnimationEasing,
  type AnimationSettings,
  type AnimationPreset,
  type SpringPreset,
} from './animationPresets';

// Video helpers
export {
  getVideoProvider,
  getVideoEmbedUrl,
  isValidVideoUrl,
  getProviderDisplayName,
  getVideoThumbnail,
  type VideoProvider,
} from './videoHelpers';
