// Shared step rendering utilities for ApplicationFlowCard and StepContentEditor
// This ensures consistent rendering between canvas and inspector preview

import { ApplicationFlowStep, ApplicationFlowStepSettings } from '../../types/infostack';
import { User, UserCircle, Mail, AtSign, Phone, Smartphone, type LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// BUTTON SYSTEM - All button rendering uses UnifiedButton
// See: @/components/builder/UnifiedButton
// ─────────────────────────────────────────────────────────

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
    '3xl': 'text-3xl',
  };
  return sizes[size || 'xl'] || 'text-xl';
};

export const getDescriptionSizeClass = (size?: string): string => {
  const sizes: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };
  return sizes[size || 'sm'] || 'text-sm';
};

export const getAlignClass = (align?: string): string => {
  switch (align) {
    case 'left':
      return 'text-left items-start';
    case 'right':
      return 'text-right items-end';
    case 'center':
    default:
      return 'text-center items-center';
  }
};

export const getSpacingClass = (spacing?: string): string => {
  const spacings: Record<string, string> = {
    compact: 'py-6 px-4',
    normal: 'py-12 px-8',
    relaxed: 'py-16 px-12',
  };
  return spacings[spacing || 'normal'] || 'py-12 px-8';
};

export const getInputStyleClass = (style?: string, radiusPx?: number): string => {
  // If custom radius is provided, just return base styles (radius applied via inline style)
  if (radiusPx !== undefined) {
    const baseStyles: Record<string, string> = {
      default: '',
      outlined: 'border',
      filled: '',
      underline: 'border-t-0 border-l-0 border-r-0 border-b',
    };
    return baseStyles[style || 'default'] || '';
  }
  
  // Legacy: style-based radius
  const styles: Record<string, string> = {
    default: 'rounded-lg',
    outlined: 'rounded-lg border',
    filled: 'rounded-lg',
    underline: 'rounded-none border-t-0 border-l-0 border-r-0 border-b',
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
      return 'What\'s the best way to reach you?';
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
      return 'Submit and proceed';
    case 'ending':
      return 'Done';
    default:
      return 'Continue';
  }
};

// ─────────────────────────────────────────────────────────
// Capture step icons - Lucide icons for input fields
// ─────────────────────────────────────────────────────────

export type CaptureIconType = 'user' | 'user-circle' | 'mail' | 'at-sign' | 'phone' | 'smartphone' | 'none';

const CAPTURE_ICONS: Record<string, LucideIcon> = {
  'user': User,
  'user-circle': UserCircle,
  'mail': Mail,
  'at-sign': AtSign,
  'phone': Phone,
  'smartphone': Smartphone,
};

export const getCaptureInputIcon = (iconName?: string): LucideIcon | null => {
  if (!iconName || iconName === 'none') return null;
  return CAPTURE_ICONS[iconName] || null;
};

// Default icons for each capture field type
export const getDefaultCaptureIcon = (fieldType: 'name' | 'email' | 'phone'): CaptureIconType => {
  switch (fieldType) {
    case 'name':
      return 'user';
    case 'email':
      return 'mail';
    case 'phone':
      return 'phone';
    default:
      return 'none';
  }
};

// Default placeholders for capture fields
export const getDefaultCapturePlaceholder = (fieldType: 'name' | 'email' | 'phone'): string => {
  switch (fieldType) {
    case 'name':
      return 'Your name';
    case 'email':
      return 'Your email';
    case 'phone':
      return 'Your phone';
    default:
      return '';
  }
};
