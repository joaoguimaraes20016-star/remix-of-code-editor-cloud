/**
 * Template Theme Utilities
 * 
 * Provides theme-aware color generation for section templates.
 * Templates use these utilities to automatically adapt to the funnel's theme.
 */

import type { PageBackground } from '@/flow-canvas/types/infostack';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateTheme {
  // Core theme detection
  isDark: boolean;
  
  // Primary accent color from funnel settings
  primaryColor: string;
  
  // Derived colors for elements
  accentGradient: [string, string];  // Two-color gradient for text/buttons
  
  // Text colors
  textColor: string;           // Main text color
  mutedTextColor: string;      // Muted/secondary text
  captionColor: string;        // Caption text
  
  // Background colors
  backgroundColor: string;     // Main background
  surfaceColor: string;        // Cards, elevated surfaces
  surfaceHover: string;        // Hover state for surfaces
  
  // Border colors
  borderColor: string;         // Default border
  borderSubtle: string;        // Subtle borders
  
  // Element-specific colors
  badgeBg: string;             // Badge background
  badgeText: string;           // Badge text
  inputBg: string;             // Form input background
  inputBorder: string;         // Form input border
  
  // CSS classes for convenience
  textClass: string;
  mutedTextClass: string;
  bgClass: string;
}

export interface PageSettings {
  theme?: 'light' | 'dark';
  primary_color?: string;
  page_background?: PageBackground;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Determines if a hex color is "dark" (needs light text on top)
 */
export function isColorDark(hex: string): boolean {
  try {
    const color = hex.replace('#', '');
    if (color.length !== 6) return false;
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  } catch {
    return false;
  }
}

/**
 * Get appropriate text color for a background
 */
export function getContrastTextColor(bgColor: string): string {
  return isColorDark(bgColor) ? '#ffffff' : '#1f2937';
}

/**
 * Lighten a hex color by mixing with white
 */
export function lightenHex(hex: string, amount = 0.3): string {
  try {
    const color = hex.replace('#', '');
    if (color.length !== 6) return hex;
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const lighten = (c: number) => Math.round(c + (255 - c) * amount);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    
    return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
  } catch {
    return hex;
  }
}

/**
 * Darken a hex color
 */
export function darkenHex(hex: string, amount = 0.2): string {
  try {
    const color = hex.replace('#', '');
    if (color.length !== 6) return hex;
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const darken = (c: number) => Math.round(c * (1 - amount));
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    
    return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
  } catch {
    return hex;
  }
}

/**
 * Shift hue of a color to create a complementary gradient stop
 */
export function shiftHue(hex: string, shift = 30): string {
  try {
    const color = hex.replace('#', '');
    if (color.length !== 6) return hex;
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Convert RGB to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;
    
    let h = 0;
    let s = 0;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }
    
    // Shift hue
    h = (h + shift / 360) % 1;
    
    // Convert back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let rOut: number, gOut: number, bOut: number;
    
    if (s === 0) {
      rOut = gOut = bOut = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rOut = hue2rgb(p, q, h + 1/3);
      gOut = hue2rgb(p, q, h);
      bOut = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
  } catch {
    return hex;
  }
}

// Known palette gradients for common primary colors
const KNOWN_PALETTE_GRADIENTS: Record<string, [string, string]> = {
  '#8B5CF6': ['#8B5CF6', '#D946EF'], // Violet
  '#3B82F6': ['#3B82F6', '#8B5CF6'], // Sapphire
  '#0EA5E9': ['#0EA5E9', '#06B6D4'], // Ocean
  '#14B8A6': ['#14B8A6', '#0D9488'], // Teal
  '#10B981': ['#10B981', '#047857'], // Emerald
  '#F97316': ['#F97316', '#EF4444'], // Sunset
  '#FB7185': ['#FB7185', '#F43F5E'], // Coral
  '#F59E0B': ['#F59E0B', '#EAB308'], // Amber
  '#E11D48': ['#E11D48', '#DB2777'], // Rose
  '#6366F1': ['#818CF8', '#6366F1'], // Indigo
  '#D946EF': ['#E879F9', '#D946EF'], // Fuchsia
  '#D4AF37': ['#D4AF37', '#F5D061'], // Gold
};

/**
 * Generate a complementary gradient from a primary color
 * Uses known palette combinations for common colors, falls back to hue shift
 */
export function generateAccentGradient(primaryColor: string): [string, string] {
  // Check if we have a known palette for this color
  const upperColor = primaryColor.toUpperCase();
  for (const [key, gradient] of Object.entries(KNOWN_PALETTE_GRADIENTS)) {
    if (key.toUpperCase() === upperColor) {
      return gradient;
    }
  }
  
  // Fallback to hue shift for custom colors
  const shifted = shiftHue(primaryColor, 40);
  return [primaryColor, shifted];
}

// ============================================================================
// THEME DETECTION
// ============================================================================

/**
 * Detect if the page background is dark
 */
export function detectIsDarkTheme(settings?: PageSettings): boolean {
  if (!settings) return false;
  
  const bg = settings.page_background;
  
  // Check explicit theme setting first
  if (settings.theme === 'dark') return true;
  if (settings.theme === 'light') return false;
  
  // Derive from background
  if (!bg) return false;
  
  if (bg.type === 'solid' && bg.color) {
    return isColorDark(bg.color);
  }
  
  if (bg.type === 'gradient' && bg.gradient?.stops?.length) {
    // Check first gradient stop
    const firstStop = bg.gradient.stops[0]?.color;
    if (firstStop) return isColorDark(firstStop);
  }
  
  return false;
}

// ============================================================================
// MAIN THEME BUILDER
// ============================================================================

/**
 * Build a complete theme context from page settings
 * 
 * This is the main function used by templates to get theme-aware colors.
 */
export function buildTemplateTheme(settings?: PageSettings): TemplateTheme {
  const isDark = detectIsDarkTheme(settings);
  const primaryColor = settings?.primary_color || '#8B5CF6';
  
  if (isDark) {
    // Dark theme palette
    return {
      isDark: true,
      primaryColor,
      accentGradient: generateAccentGradient(primaryColor),
      
      textColor: '#ffffff',
      mutedTextColor: 'rgba(255, 255, 255, 0.7)',
      captionColor: 'rgba(255, 255, 255, 0.5)',
      
      backgroundColor: '#111827',
      surfaceColor: 'rgba(255, 255, 255, 0.05)',
      surfaceHover: 'rgba(255, 255, 255, 0.1)',
      
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderSubtle: 'rgba(255, 255, 255, 0.05)',
      
      badgeBg: `${primaryColor}20`,
      badgeText: lightenHex(primaryColor, 0.3),
      inputBg: 'rgba(255, 255, 255, 0.05)',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      
      textClass: 'text-white',
      mutedTextClass: 'text-white/70',
      bgClass: 'bg-gray-900',
    };
  } else {
    // Light theme palette
    return {
      isDark: false,
      primaryColor,
      accentGradient: generateAccentGradient(primaryColor),
      
      textColor: '#1f2937',
      mutedTextColor: '#6b7280',
      captionColor: '#9ca3af',
      
      backgroundColor: '#ffffff',
      surfaceColor: '#f9fafb',
      surfaceHover: '#f3f4f6',
      
      borderColor: '#e5e7eb',
      borderSubtle: '#f3f4f6',
      
      badgeBg: `${primaryColor}15`,
      badgeText: darkenHex(primaryColor, 0.1),
      inputBg: '#ffffff',
      inputBorder: '#e5e7eb',
      
      textClass: 'text-gray-900',
      mutedTextClass: 'text-gray-600',
      bgClass: 'bg-white',
    };
  }
}

// ============================================================================
// ELEMENT STYLE GENERATORS
// ============================================================================

/**
 * Generate inline styles for text elements based on theme
 */
export function getTextStyles(theme: TemplateTheme, variant?: 'normal' | 'muted' | 'caption'): Record<string, string> {
  switch (variant) {
    case 'muted':
      return { color: theme.mutedTextColor };
    case 'caption':
      return { color: theme.captionColor };
    default:
      return { color: theme.textColor };
  }
}

/**
 * Generate className for text based on theme
 */
export function getTextClassName(theme: TemplateTheme, variant?: 'normal' | 'muted' | 'caption'): string {
  if (theme.isDark) {
    switch (variant) {
      case 'muted': return 'text-white/70';
      case 'caption': return 'text-white/50';
      default: return 'text-white';
    }
  } else {
    switch (variant) {
      case 'muted': return 'text-gray-600';
      case 'caption': return 'text-gray-400';
      default: return 'text-gray-900';
    }
  }
}

/**
 * Generate props for a gradient-text element
 */
export function getGradientTextProps(theme: TemplateTheme): { gradient: [string, string] } {
  return { gradient: theme.accentGradient };
}

/**
 * Generate background style for surfaces/cards
 */
export function getSurfaceStyles(theme: TemplateTheme): Record<string, string> {
  return {
    backgroundColor: theme.surfaceColor,
    borderColor: theme.borderColor,
  };
}

/**
 * Generate badge variant based on theme
 */
export function getBadgeVariant(theme: TemplateTheme): string {
  // Return a variant that works with the theme
  return theme.isDark ? 'premium' : 'secondary';
}
