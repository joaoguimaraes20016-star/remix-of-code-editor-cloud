/**
 * Builder Components Module
 * 
 * This module exports shared builder UI components that can be used
 * across different builders (funnel, website, email, etc.)
 * 
 * Phase 2: Button System Consolidation
 * ─────────────────────────────────────────────────────────
 * UnifiedButton is THE single source of truth for all buttons.
 * It provides consistent styling, behavior, and accessibility.
 * 
 * Key features:
 * - Variant system (primary, secondary, outline, ghost, gradient)
 * - Size presets (sm, md, lg, xl)
 * - Border radius options
 * - Shadow presets including glow and neon effects
 * - Full width control
 * - Icon support with position control
 * - Custom color overrides
 */

// ─────────────────────────────────────────────────────────
// UNIFIED BUTTON SYSTEM
// ─────────────────────────────────────────────────────────
export { 
  UnifiedButton, 
  unifiedButtonVariants,
  SHADOW_PRESETS, 
  getShadowValue,
  presetToVariant,
  sizeToVariant,
  // Deprecated aliases for backward compatibility
  FlowButton,
} from './UnifiedButton';

export type { 
  UnifiedButtonProps,
  ButtonPreset,
  // Deprecated alias
  FlowButtonProps,
} from './UnifiedButton';

// ─────────────────────────────────────────────────────────
// BUTTON STYLE INSPECTOR
// ─────────────────────────────────────────────────────────
export { 
  ButtonStyleInspector,
} from './ButtonStyleInspector';

export type { 
  ButtonStyleSettings,
} from './ButtonStyleInspector';
