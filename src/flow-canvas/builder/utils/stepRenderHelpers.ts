// Shared step rendering utilities for ApplicationFlowCard and StepContentEditor
// This ensures consistent rendering between canvas and inspector preview

import { ApplicationFlowStep, ApplicationFlowStepSettings } from '../../types/infostack';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// Unified Button Size Classes - SINGLE SOURCE OF TRUTH
// ─────────────────────────────────────────────────────────

export const BUTTON_SIZES = {
  sm: { padding: 'px-4 py-2', text: 'text-xs', height: 'h-8' },
  md: { padding: 'px-6 py-3', text: 'text-sm', height: 'h-10' },
  lg: { padding: 'px-8 py-4', text: 'text-base', height: 'h-12' },
} as const;

export const BUTTON_RADII = {
  none: 'rounded-none',
  rounded: 'rounded-lg',
  full: 'rounded-full',
} as const;

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

export const getButtonClasses = (settings: Partial<ApplicationFlowStepSettings>): string => {
  const isOutline = settings.buttonStyle === 'outline';
  const isGhost = settings.buttonStyle === 'ghost';
  const size = settings.buttonSize || 'md';
  const radius = settings.buttonRadius || 'rounded';
  
  const sizeConfig = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const radiusClass = BUTTON_RADII[radius] || BUTTON_RADII.rounded;
  
  const baseClasses = cn(
    'inline-block font-medium transition-colors',
    sizeConfig.padding,
    sizeConfig.text,
    radiusClass,
    settings.buttonFullWidth && 'w-full'
  );
  
  if (isGhost) {
    return cn(baseClasses, 'bg-transparent text-foreground hover:bg-muted');
  }
  if (isOutline) {
    return cn(baseClasses, 'bg-transparent border-2');
  }
  return baseClasses;
};

// Helper to convert gradient to CSS
const gradientToCSS = (gradient: { type: 'linear' | 'radial'; angle: number; stops: Array<{ color: string; position: number }> }): string => {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  
  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stopsStr})`;
};

export const getButtonStyle = (settings: Partial<ApplicationFlowStepSettings>): React.CSSProperties | undefined => {
  const style: React.CSSProperties = {};
  
  // Handle gradient fill
  if (settings.buttonFillType === 'gradient' && settings.buttonGradient) {
    style.background = gradientToCSS(settings.buttonGradient);
    style.border = 'none';
  } else if (settings.buttonColor && settings.buttonStyle !== 'outline') {
    style.backgroundColor = settings.buttonColor;
  } else if (settings.buttonColor && settings.buttonStyle === 'outline') {
    style.borderColor = settings.buttonColor;
    style.color = settings.buttonColor;
  }
  
  // Apply text color
  if (settings.buttonTextColor && settings.buttonStyle !== 'outline') {
    style.color = settings.buttonTextColor;
  }
  
  return Object.keys(style).length > 0 ? style : undefined;
};

// Note: Interactive block backgrounds are now read from block.styles directly
// No special helper needed - this aligns with all other block types

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