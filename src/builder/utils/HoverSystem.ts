/**
 * HoverSystem - Unified hover style generation
 * 
 * Generates consistent, theme-aware hover styles for all interactive elements.
 * Uses CSS custom properties for easy theming and overrides.
 */

import { deriveHoverColor, deriveActiveColor, parseColor, getLuminance } from './ContrastEngine';

export type HoverPreset = 'none' | 'lift' | 'scale' | 'glow' | 'brighten' | 'darken' | 'subtle';

export interface HoverStyles {
  transform?: string;
  filter?: string;
  boxShadow?: string;
  backgroundColor?: string;
  transition: string;
  opacity?: number;
}

export interface HoverStylesWithActive extends HoverStyles {
  active?: Partial<HoverStyles>;
}

// ============================================================================
// PRESET DEFINITIONS
// ============================================================================

const HOVER_PRESETS: Record<HoverPreset, (context: HoverContext) => Partial<HoverStyles>> = {
  none: () => ({}),
  
  lift: () => ({
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  }),
  
  scale: () => ({
    transform: 'scale(1.02)',
  }),
  
  glow: (ctx) => ({
    boxShadow: `0 0 20px ${hexToRgba(ctx.primaryColor, 0.4)}`,
    filter: 'brightness(1.05)',
  }),
  
  brighten: () => ({
    filter: 'brightness(1.1)',
  }),
  
  darken: () => ({
    filter: 'brightness(0.9)',
  }),
  
  subtle: (ctx) => ({
    backgroundColor: ctx.isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  }),
};

// ============================================================================
// TYPES
// ============================================================================

interface HoverContext {
  isDarkTheme: boolean;
  primaryColor: string;
}

interface ButtonConfig {
  backgroundColor?: string;
  isGradient?: boolean;
  isOutline?: boolean;
  hoverPreset?: HoverPreset;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate hover styles for a button based on its configuration
 */
export function getButtonHoverStyles(
  button: ButtonConfig,
  context: HoverContext
): HoverStylesWithActive {
  const {
    backgroundColor,
    isGradient = false,
    isOutline = false,
    hoverPreset = 'subtle',
  } = button;
  
  const { isDarkTheme, primaryColor } = context;
  
  // Base transition
  const baseTransition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  
  // If a preset is specified, use it
  if (hoverPreset && hoverPreset !== 'none') {
    const presetFn = HOVER_PRESETS[hoverPreset];
    if (presetFn) {
      return {
        ...presetFn(context),
        transition: baseTransition,
      };
    }
  }
  
  // No preset - derive intelligent hover from background
  const result: HoverStylesWithActive = {
    transition: baseTransition,
  };
  
  if (isGradient) {
    // For gradients, brighten on hover
    result.filter = 'brightness(1.08)';
    result.active = { filter: 'brightness(0.95)' };
  } else if (isOutline) {
    // For outline buttons, subtle background on hover
    result.backgroundColor = isDarkTheme 
      ? 'rgba(255, 255, 255, 0.08)' 
      : 'rgba(0, 0, 0, 0.05)';
    result.active = {
      backgroundColor: isDarkTheme 
        ? 'rgba(255, 255, 255, 0.12)' 
        : 'rgba(0, 0, 0, 0.08)',
    };
  } else if (backgroundColor) {
    // Solid background - derive hover color
    result.backgroundColor = deriveHoverColor(backgroundColor, isDarkTheme);
    result.active = {
      backgroundColor: deriveActiveColor(backgroundColor, isDarkTheme),
    };
  } else {
    // No background specified - use theme-aware default
    result.backgroundColor = isDarkTheme 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.08)';
  }
  
  return result;
}

/**
 * Generate CSS for button hover state
 * Returns a string of CSS rules to be injected
 */
export function getButtonHoverCSS(
  buttonId: string,
  config: ButtonConfig,
  context: HoverContext
): string {
  const className = `btn-${buttonId}`;
  const styles = getButtonHoverStyles(config, context);
  
  const css: string[] = [];
  
  // Base transition
  css.push(`.${className} { transition: ${styles.transition}; }`);
  
  // Hover state
  const hoverRules: string[] = [];
  if (styles.transform) hoverRules.push(`transform: ${styles.transform}`);
  if (styles.filter) hoverRules.push(`filter: ${styles.filter}`);
  if (styles.boxShadow) hoverRules.push(`box-shadow: ${styles.boxShadow}`);
  if (styles.backgroundColor) hoverRules.push(`background-color: ${styles.backgroundColor}`);
  if (styles.opacity !== undefined) hoverRules.push(`opacity: ${styles.opacity}`);
  
  if (hoverRules.length > 0) {
    css.push(`.${className}:hover { ${hoverRules.join('; ')}; }`);
  }
  
  // Active state
  if (styles.active) {
    const activeRules: string[] = [];
    if (styles.active.transform) activeRules.push(`transform: ${styles.active.transform}`);
    if (styles.active.filter) activeRules.push(`filter: ${styles.active.filter}`);
    if (styles.active.boxShadow) activeRules.push(`box-shadow: ${styles.active.boxShadow}`);
    if (styles.active.backgroundColor) activeRules.push(`background-color: ${styles.active.backgroundColor}`);
    
    if (activeRules.length > 0) {
      css.push(`.${className}:active { ${activeRules.join('; ')}; }`);
    }
  }
  
  return css.join('\n');
}

/**
 * Get CSS custom properties for hover theming
 * Apply these to the root or a container element
 */
export function getHoverCSSVars(isDarkTheme: boolean): Record<string, string> {
  return {
    '--hover-lift': 'translateY(-2px)',
    '--hover-scale': 'scale(1.02)',
    '--hover-brighten': 'brightness(1.1)',
    '--hover-darken': 'brightness(0.9)',
    '--hover-overlay-light': 'rgba(0, 0, 0, 0.05)',
    '--hover-overlay-dark': 'rgba(255, 255, 255, 0.08)',
    '--hover-overlay': isDarkTheme ? 'var(--hover-overlay-dark)' : 'var(--hover-overlay-light)',
    '--transition-hover': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  };
}

/**
 * Get inline style object for element with hover handling via React state
 * Use this when CSS injection isn't possible/desired
 */
export function getHoverInlineStyles(
  isHovered: boolean,
  isActive: boolean,
  config: ButtonConfig,
  context: HoverContext
): React.CSSProperties {
  const styles = getButtonHoverStyles(config, context);
  
  const base: React.CSSProperties = {
    transition: styles.transition,
  };
  
  if (isActive && styles.active) {
    return {
      ...base,
      transform: styles.active.transform || styles.transform,
      filter: styles.active.filter || styles.filter,
      boxShadow: styles.active.boxShadow || styles.boxShadow,
      backgroundColor: styles.active.backgroundColor || styles.backgroundColor,
    };
  }
  
  if (isHovered) {
    return {
      ...base,
      transform: styles.transform,
      filter: styles.filter,
      boxShadow: styles.boxShadow,
      backgroundColor: styles.backgroundColor,
    };
  }
  
  return base;
}

/**
 * Determine the best hover preset based on button appearance
 */
export function suggestHoverPreset(
  backgroundColor: string | undefined,
  isDarkTheme: boolean
): HoverPreset {
  if (!backgroundColor) {
    return 'subtle';
  }
  
  const rgb = parseColor(backgroundColor);
  if (!rgb) {
    return 'subtle';
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // Very light colors - darken on hover
  if (luminance > 0.85) {
    return 'darken';
  }
  
  // Very dark colors - brighten on hover
  if (luminance < 0.15) {
    return 'brighten';
  }
  
  // Mid-range colors - subtle works well
  return 'subtle';
}

// ============================================================================
// UTILITIES
// ============================================================================

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseColor(hex);
  if (!rgb) return `rgba(139, 92, 246, ${alpha})`; // Fallback purple
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Export for convenient access
export const HoverSystem = {
  getButtonHoverStyles,
  getButtonHoverCSS,
  getHoverCSSVars,
  getHoverInlineStyles,
  suggestHoverPreset,
  PRESETS: Object.keys(HOVER_PRESETS) as HoverPreset[],
};
