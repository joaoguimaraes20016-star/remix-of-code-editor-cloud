/**
 * Branding Applier for Funnel Builder V3
 * 
 * Applies cloned branding to steps and funnels
 */

import { FunnelStep, Funnel } from '@/funnel-builder-v3/types/funnel';

/**
 * Minimal branding interface for applying colors/theme
 * (subset of full ClonedStyle - only uses what's actually needed)
 */
export interface AppliedBranding {
  primaryColor: string;
  accentColor?: string;
  backgroundColor: string;
  textColor?: string;
  headingColor?: string;
  bodyFont?: string;
  theme?: 'dark' | 'light';
}

/**
 * Apply branding to a step
 */
export function applyBrandingToStep(
  step: FunnelStep,
  branding: AppliedBranding
): FunnelStep {
  return {
    ...step,
    settings: {
      ...step.settings,
      backgroundColor: branding.backgroundColor,
    },
  };
}

/**
 * Apply branding to multiple steps
 */
export function applyBrandingToSteps(
  steps: FunnelStep[],
  branding: AppliedBranding
): FunnelStep[] {
  return steps.map(step => applyBrandingToStep(step, branding));
}

/**
 * Apply branding to entire funnel
 */
export function applyBrandingToFunnel(
  funnel: Funnel,
  branding: AppliedBranding
): Funnel {
  return {
    ...funnel,
    settings: {
      ...funnel.settings,
      primaryColor: branding.primaryColor,
      fontFamily: branding.bodyFont,
    },
    steps: applyBrandingToSteps(funnel.steps, branding),
  };
}
