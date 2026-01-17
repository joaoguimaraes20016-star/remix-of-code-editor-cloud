/**
 * FlowButton - DEPRECATED
 * 
 * This file now re-exports from UnifiedButton for backward compatibility.
 * All new code should import directly from '@/components/builder/UnifiedButton'.
 * 
 * @deprecated Use UnifiedButton from '@/components/builder/UnifiedButton' instead
 */

export {
  UnifiedButton as FlowButton,
  UnifiedButton,
  unifiedButtonVariants as flowButtonVariants,
  presetToVariant,
  sizeToVariant,
  getShadowValue,
  SHADOW_PRESETS,
  type UnifiedButtonProps as FlowButtonProps,
  type UnifiedButtonProps,
  type ButtonPreset,
} from '@/components/builder/UnifiedButton';
