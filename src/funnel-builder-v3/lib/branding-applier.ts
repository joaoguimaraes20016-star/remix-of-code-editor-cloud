/**
 * Branding Applier for Funnel Builder V3
 * 
 * Applies cloned branding to steps and funnels
 */

import { FunnelStep, Funnel } from '@/funnel-builder-v3/types/funnel';
import { ClonedStyle } from './clone-converter';

/**
 * Apply branding to a step
 */
export function applyBrandingToStep(
  step: FunnelStep,
  branding: ClonedStyle
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
  branding: ClonedStyle
): FunnelStep[] {
  return steps.map(step => applyBrandingToStep(step, branding));
}

/**
 * Apply branding to entire funnel
 */
export function applyBrandingToFunnel(
  funnel: Funnel,
  branding: ClonedStyle
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
