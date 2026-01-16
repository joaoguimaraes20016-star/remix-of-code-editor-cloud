// Shared step rendering utilities for ApplicationFlowCard and StepContentEditor
// This ensures consistent rendering between canvas and inspector preview

import { ApplicationFlowStep, ApplicationFlowStepSettings } from '../../types/infostack';

// ─────────────────────────────────────────────────────────
// BUTTON SYSTEM - DEPRECATED
// All button rendering now uses UnifiedButton from @/components/builder/UnifiedButton
// These legacy helpers are kept only for backwards compatibility
// DO NOT USE IN NEW CODE
// ─────────────────────────────────────────────────────────

/** @deprecated Use UnifiedButton component from @/components/builder/UnifiedButton */
export type ButtonPreset = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';

/** @deprecated Use UnifiedButton component - this function returns empty */
export const getButtonPresetClasses = (_preset: ButtonPreset = 'primary'): string => {
  console.warn('getButtonPresetClasses is deprecated. Use UnifiedButton component instead.');
  return '';
};

/** @deprecated Use UnifiedButton component - this function returns empty */
export const getButtonClasses = (_settings: Partial<ApplicationFlowStepSettings>): string => {
  console.warn('getButtonClasses is deprecated. Use UnifiedButton component instead.');
  return '';
};

/** @deprecated Use UnifiedButton component - this function returns empty */
export const getButtonStyle = (_settings: Partial<ApplicationFlowStepSettings>): React.CSSProperties => {
  console.warn('getButtonStyle is deprecated. Use UnifiedButton component instead.');
  return {};
};

// ─────────────────────────────────────────────────────────
// Style helpers - map settings to Tailwind classes
// ─────────────────────────────────────────────────────────

export const getTitleSizeClass = (size?: string): string => {
  const sizes: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };
  return sizes[size || 'xl'] || 'text-xl';
};

export const getAlignClass = (align?: string): string => {
  return align === 'left' ? 'text-left items-start' : 'text-center items-center';
};

export const getSpacingClass = (spacing?: string): string => {
  const spacings: Record<string, string> = {
    compact: 'py-6 px-4',
    normal: 'py-12 px-8',
    relaxed: 'py-16 px-12',
  };
  return spacings[spacing || 'normal'] || 'py-12 px-8';
};

export const getInputStyleClass = (style?: string): string => {
  const styles: Record<string, string> = {
    default: 'rounded-lg',
    minimal: 'rounded-none border-t-0 border-l-0 border-r-0',
    rounded: 'rounded-full',
    square: 'rounded-none',
  };
  return styles[style || 'default'] || 'rounded-lg';
};

// ─────────────────────────────────────────────────────────
// Get step settings with defaults
// ─────────────────────────────────────────────────────────

export const getStepSettings = (step: ApplicationFlowStep): ApplicationFlowStepSettings => {
  return (step as any).settings || {};
};

// ─────────────────────────────────────────────────────────
// Get default content for each step type
// ─────────────────────────────────────────────────────────

export const getDefaultTitle = (stepType: string): string => {
  switch (stepType) {
    case 'welcome':
      return 'Apply Now';
    case 'question':
      return 'Your question here';
    case 'capture':
      return 'Where should we send your results?';
    case 'ending':
      return 'Thanks — we will be in touch!';
    default:
      return 'Heading';
  }
};

export const getDefaultDescription = (stepType: string): string => {
  switch (stepType) {
    case 'welcome':
      return 'Answer a few quick questions to see if we are a good fit.';
    case 'ending':
      return 'We will be in touch shortly.';
    default:
      return '';
  }
};

export const getDefaultButtonText = (stepType: string): string => {
  switch (stepType) {
    case 'welcome':
      return 'Start Application →';
    case 'capture':
      return 'Submit';
    case 'ending':
      return 'Done';
    default:
      return 'Continue';
  }
};
