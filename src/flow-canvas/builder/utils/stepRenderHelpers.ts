// Shared step rendering utilities for ApplicationFlowCard and StepContentEditor
// This ensures consistent rendering between canvas and inspector preview

import { ApplicationFlowStep, ApplicationFlowStepSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// BUTTON SYSTEM - Now uses FlowButton component
// These helpers are DEPRECATED - use FlowButton directly
// Kept for backwards compatibility during migration
// ─────────────────────────────────────────────────────────

export type ButtonPreset = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';

/**
 * @deprecated Use FlowButton component with variant prop instead
 * Maps button preset to Tailwind classes - matches FlowButton variants
 */
export const getButtonPresetClasses = (preset: ButtonPreset = 'primary'): string => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-6 text-sm rounded-lg';
  
  switch (preset) {
    case 'primary':
      return cn(baseClasses, 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/20');
    case 'secondary':
      return cn(baseClasses, 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80');
    case 'outline':
      return cn(baseClasses, 'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground');
    case 'ghost':
      return cn(baseClasses, 'hover:bg-accent hover:text-accent-foreground');
    case 'gradient':
      return cn(baseClasses, 'text-white shadow-lg hover:shadow-xl');
    default:
      return cn(baseClasses, 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/20');
  }
};

/**
 * @deprecated Use FlowButton component with variant prop instead
 * Gets button classes for a step, using the preset system.
 */
export const getButtonClasses = (settings: Partial<ApplicationFlowStepSettings>): string => {
  const preset = settings.buttonPreset || 'primary';
  return getButtonPresetClasses(preset as ButtonPreset);
};

/**
 * @deprecated Use FlowButton component - no inline styles needed
 * Button style is now handled entirely by FlowButton component.
 */
export const getButtonStyle = (_settings: Partial<ApplicationFlowStepSettings>): React.CSSProperties => {
  // All styling is handled by FlowButton - no inline styles needed
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
