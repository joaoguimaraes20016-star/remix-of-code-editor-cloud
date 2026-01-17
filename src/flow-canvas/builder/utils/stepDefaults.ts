// ═══════════════════════════════════════════════════════════════
// Centralized step defaults - SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════
// All step creation and rendering should reference these defaults
// to ensure consistency between canvas, inspector, and new steps.

import { getDefaultTitle, getDefaultDescription, getDefaultButtonText } from './stepRenderHelpers';

/**
 * Default settings for new steps.
 * These are applied when creating a step so it has proper initial values.
 * Note: buttonColor is intentionally undefined - let theme take over.
 */
export const STEP_DEFAULTS = {
  // Button styling - let theme color take precedence
  buttonColor: undefined as string | undefined,
  buttonPreset: 'primary' as const,
  buttonRadius: 12,
  buttonSize: 'md' as const,
  buttonShadow: 'none' as const,
  buttonFullWidth: false,
  buttonShowIcon: true,
  buttonIcon: 'ArrowRight' as const,
  
  // Typography
  titleSize: 'xl' as const,
  descriptionSize: 'sm' as const,
  align: 'center' as const,
  spacing: 'normal' as const,
  
  // Input styling
  inputStyle: 'default' as const,
  inputRadius: 8,
  
  // Option styling
  optionStyle: 'outlined' as const,
  optionRadius: 12,
} as const;

/**
 * Creates default settings for a new step based on its type.
 * Includes content defaults (title, description, button text) and style defaults.
 */
export const createDefaultStepSettings = (stepType: string) => ({
  // Content - based on step type
  title: getDefaultTitle(stepType),
  description: getDefaultDescription(stepType),
  buttonText: getDefaultButtonText(stepType),
  
  // Styling - from centralized defaults
  ...STEP_DEFAULTS,
  
  // Question step defaults
  ...(stepType === 'question' && {
    questionType: 'multiple-choice' as const,
    options: ['Option 1', 'Option 2'],
    required: true,
  }),
  
  // Capture step defaults
  ...(stepType === 'capture' && {
    collectName: true,
    collectEmail: true,
    collectPhone: false,
  }),
});
