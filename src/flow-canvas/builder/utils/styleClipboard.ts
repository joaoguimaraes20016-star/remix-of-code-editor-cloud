/**
 * Style Clipboard Utility
 * Enables copying and pasting styles between elements
 */

import type { Element } from '../../types/infostack';

export interface CopiedStyles {
  // Text styles
  textColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: string;
  
  // Appearance
  backgroundColor?: string;
  background?: string;
  opacity?: string | number;
  
  // Border
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  
  // Effects
  mixBlendMode?: string;
  backdropBlur?: string;
  
  // Props-based styles
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hueRotate?: number;
  grayscale?: number;
  sepia?: number;
  invert?: number;
  shadowPreset?: string;
  shadowLayers?: Array<{ x: number; y: number; blur: number; spread: number; color: string; inset?: boolean }>;
}

// Keys to extract from element.styles
const STYLE_KEYS: (keyof CopiedStyles)[] = [
  'textColor', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'textDecoration', 'textAlign', 'letterSpacing', 'lineHeight', 'textTransform',
  'backgroundColor', 'background', 'opacity',
  'borderWidth', 'borderStyle', 'borderColor', 'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginBottom',
  'mixBlendMode', 'backdropBlur',
];

// Keys to extract from element.props
const PROP_KEYS: (keyof CopiedStyles)[] = [
  'blur', 'brightness', 'contrast', 'saturation', 'hueRotate',
  'grayscale', 'sepia', 'invert', 'shadowPreset', 'shadowLayers',
];

/**
 * Extract styles from an element for copying
 */
export function extractStyles(element: Element): CopiedStyles {
  const styles: CopiedStyles = {};
  
  // Extract from element.styles
  for (const key of STYLE_KEYS) {
    const value = element.styles?.[key as keyof typeof element.styles];
    if (value !== undefined && value !== null && value !== '') {
      (styles as any)[key] = value;
    }
  }
  
  // Extract from element.props
  for (const key of PROP_KEYS) {
    const value = element.props?.[key as keyof typeof element.props];
    if (value !== undefined && value !== null) {
      (styles as any)[key] = value;
    }
  }
  
  return styles;
}

/**
 * Apply copied styles to an element
 */
export function applyStyles(copiedStyles: CopiedStyles): {
  styles: Partial<Element['styles']>;
  props: Partial<Element['props']>;
} {
  const styles: Partial<Element['styles']> = {};
  const props: Partial<Element['props']> = {};
  
  // Apply to styles
  for (const key of STYLE_KEYS) {
    const value = copiedStyles[key];
    if (value !== undefined) {
      (styles as any)[key] = value;
    }
  }
  
  // Apply to props
  for (const key of PROP_KEYS) {
    const value = copiedStyles[key];
    if (value !== undefined) {
      (props as any)[key] = value;
    }
  }
  
  return { styles, props };
}

/**
 * Get a summary of copied styles for display
 */
export function getStylesSummary(styles: CopiedStyles): string {
  const parts: string[] = [];
  
  if (styles.textColor || styles.fontFamily || styles.fontSize) {
    parts.push('Typography');
  }
  if (styles.backgroundColor || styles.background) {
    parts.push('Background');
  }
  if (styles.borderWidth || styles.borderColor || styles.borderRadius) {
    parts.push('Border');
  }
  if (styles.blur || styles.brightness || styles.shadowPreset || styles.shadowLayers) {
    parts.push('Effects');
  }
  if (styles.padding || styles.paddingTop || styles.margin || styles.marginTop) {
    parts.push('Spacing');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No styles';
}
