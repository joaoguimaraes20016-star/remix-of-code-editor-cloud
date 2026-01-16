// Shared step rendering utilities for ApplicationFlowCard and StepContentEditor
// This ensures consistent rendering between canvas and inspector preview

import { ApplicationFlowStep, ApplicationFlowStepSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// BUTTON PRESET SYSTEM - Forms reference shared Button styles
// ─────────────────────────────────────────────────────────

export type ButtonPreset = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * Maps button preset to Tailwind classes matching the shared Button component.
 * Forms may NOT define custom button styles - they select a preset.
 */
export const getButtonPresetClasses = (preset: ButtonPreset = 'primary'): string => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-6 py-3';
  
  switch (preset) {
    case 'primary':
      return cn(baseClasses, 'bg-primary text-primary-foreground shadow hover:bg-primary/90');
    case 'secondary':
      return cn(baseClasses, 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80');
    case 'outline':
      return cn(baseClasses, 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground');
    case 'ghost':
      return cn(baseClasses, 'hover:bg-accent hover:text-accent-foreground');
    default:
      return cn(baseClasses, 'bg-primary text-primary-foreground shadow hover:bg-primary/90');
  }
};

/**
 * Gets button classes for a step, using the preset system.
 * This is the ONLY way forms render buttons - via presets.
 */
export const getButtonClasses = (settings: Partial<ApplicationFlowStepSettings>): string => {
  const preset = settings.buttonPreset || 'primary';
  return getButtonPresetClasses(preset as ButtonPreset);
};

/**
 * Button style is now handled entirely by presets.
 * This returns an empty object since presets handle all styling.
 */
export const getButtonStyle = (_settings: Partial<ApplicationFlowStepSettings>): React.CSSProperties => {
  // All styling is handled by presets - no inline styles needed
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