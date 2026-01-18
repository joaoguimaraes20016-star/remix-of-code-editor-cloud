/**
 * Shared Inspector Components
 * 
 * Unified components used across all inspector panels for consistency.
 * Import from this index to ensure you're using the canonical versions.
 */

export { CollapsibleSection, type CollapsibleSectionProps } from './CollapsibleSection';
export { FieldGroup, type FieldGroupProps } from './FieldGroup';
export { CanvasErrorBoundary, withErrorBoundary } from './CanvasErrorBoundary';
export { 
  ColorGradientControl, 
  getColorOrGradientCSS, 
  getTextColorStyle, 
  getBackgroundStyle,
  type ColorType,
  type ColorGradientControlProps 
} from './ColorGradientControl';
