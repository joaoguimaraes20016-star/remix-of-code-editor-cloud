/**
 * ContrastEngine - Intelligent color contrast and theme-aware color generation
 * 
 * This is the single source of truth for color intelligence in the funnel builder.
 * Handles hex, rgb, rgba, hsl, hsla, gradients, and transparent colors.
 * Ensures WCAG AA compliance (4.5:1 for normal text, 3:1 for large text).
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ThemeAwareColors {
  /** Primary readable text color */
  text: string;
  /** Secondary/muted text color */
  textMuted: string;
  /** Background color on hover */
  hoverBg: string;
  /** Background color on active/pressed */
  activeBg: string;
  /** Border color if needed */
  border: string;
  /** Whether text/bg combo meets WCAG AA */
  meetsAAContrast: boolean;
}

// ============================================================================
// COLOR PARSING
// ============================================================================

/**
 * Parse any CSS color format to RGB values
 * Supports: hex (#fff, #ffffff), rgb(), rgba(), hsl(), hsla(), named colors
 */
export function parseColor(color: string): RGB | null {
  if (!color || typeof color !== 'string') return null;
  
  const trimmed = color.trim().toLowerCase();
  
  // Handle transparent
  if (trimmed === 'transparent') {
    return { r: 255, g: 255, b: 255, a: 0 };
  }
  
  // Handle currentcolor (assume dark for safety)
  if (trimmed === 'currentcolor') {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  
  // Handle hex colors
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }
  
  // Handle rgb/rgba
  if (trimmed.startsWith('rgb')) {
    return parseRgbColor(trimmed);
  }
  
  // Handle hsl/hsla
  if (trimmed.startsWith('hsl')) {
    return parseHslColor(trimmed);
  }
  
  // Try to resolve named colors via canvas
  return resolveNamedColor(trimmed);
}

function parseHexColor(hex: string): RGB | null {
  const h = hex.replace('#', '');
  
  if (h.length === 3) {
    // Short hex: #fff → #ffffff
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b, a: 1 };
  }
  
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  
  if (h.length === 8) {
    // With alpha: #ffffffaa
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  
  return null;
}

function parseRgbColor(rgb: string): RGB | null {
  // Match both rgb(r, g, b) and rgba(r, g, b, a) and modern rgb(r g b / a)
  const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)(?:\s*[,\/]\s*([\d.]+%?))?\s*\)/);
  
  if (!match) return null;
  
  const r = Math.min(255, Math.max(0, parseInt(match[1], 10)));
  const g = Math.min(255, Math.max(0, parseInt(match[2], 10)));
  const b = Math.min(255, Math.max(0, parseInt(match[3], 10)));
  
  let a = 1;
  if (match[4]) {
    if (match[4].endsWith('%')) {
      a = parseFloat(match[4]) / 100;
    } else {
      a = parseFloat(match[4]);
    }
  }
  
  return { r, g, b, a: Math.min(1, Math.max(0, a)) };
}

function parseHslColor(hsl: string): RGB | null {
  // Match hsl(h, s%, l%) and hsla(h, s%, l%, a)
  const match = hsl.match(/hsla?\s*\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?(?:\s*[,\/]\s*([\d.]+%?))?\s*\)/);
  
  if (!match) return null;
  
  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;
  
  let a = 1;
  if (match[4]) {
    if (match[4].endsWith('%')) {
      a = parseFloat(match[4]) / 100;
    } else {
      a = parseFloat(match[4]);
    }
  }
  
  // HSL to RGB conversion
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: Math.min(1, Math.max(0, a)),
  };
}

function resolveNamedColor(name: string): RGB | null {
  // Use canvas to resolve named colors
  if (typeof document === 'undefined') {
    // SSR fallback - common colors
    const commonColors: Record<string, RGB> = {
      white: { r: 255, g: 255, b: 255, a: 1 },
      black: { r: 0, g: 0, b: 0, a: 1 },
      red: { r: 255, g: 0, b: 0, a: 1 },
      green: { r: 0, g: 128, b: 0, a: 1 },
      blue: { r: 0, g: 0, b: 255, a: 1 },
      gray: { r: 128, g: 128, b: 128, a: 1 },
      grey: { r: 128, g: 128, b: 128, a: 1 },
    };
    return commonColors[name] || null;
  }
  
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return null;
    
    ctx.fillStyle = name;
    const computed = ctx.fillStyle;
    
    // Check if it was recognized
    if (computed.startsWith('#')) {
      return parseHexColor(computed);
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// LUMINANCE & CONTRAST
// ============================================================================

/**
 * Calculate relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate contrast ratio between two colors per WCAG 2.1
 * Returns a value between 1 (no contrast) and 21 (max contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA standards
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 3 : 4.5);
}

// ============================================================================
// INTELLIGENT COLOR GENERATION
// ============================================================================

/**
 * Check if a color is considered "light"
 */
export function isLightColor(color: string): boolean {
  const rgb = parseColor(color);
  if (!rgb) return true; // Default to light for safety
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

/**
 * Get a contrasting text color (WCAG compliant)
 * Enhanced version that handles all color formats
 */
export function getContrastTextColor(
  backgroundColor: string,
  options?: { 
    preferDark?: boolean;
    darkColor?: string;
    lightColor?: string;
  }
): string {
  const {
    preferDark = false,
    darkColor = '#1f2937',
    lightColor = '#ffffff',
  } = options || {};
  
  const rgb = parseColor(backgroundColor);
  
  // If we can't parse, make intelligent guess based on theme preference
  if (!rgb) {
    return preferDark ? darkColor : lightColor;
  }
  
  // For transparent/semi-transparent colors, consider the alpha
  if (rgb.a < 0.5) {
    // Background is mostly transparent, use theme preference
    return preferDark ? darkColor : lightColor;
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // Use WCAG-compliant decision with slight threshold adjustment
  // for better visual results
  return luminance > 0.45 ? darkColor : lightColor;
}

/**
 * Derive hover color from a background
 * - Light backgrounds: darken by 8-12%
 * - Dark backgrounds: lighten by 8-12%
 */
export function deriveHoverColor(backgroundColor: string, isDarkTheme?: boolean): string {
  const rgb = parseColor(backgroundColor);
  
  if (!rgb) {
    // Fallback based on theme
    return isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const isLight = luminance > 0.5;
  
  // For dark colors, add brightness. For light colors, reduce brightness.
  const adjust = (c: number) => {
    if (isLight) {
      // Darken by 10%
      return Math.min(255, Math.max(0, Math.round(c * 0.9)));
    } else {
      // Lighten: add 25 or multiply by 1.15, whichever is larger
      const added = c + 25;
      const multiplied = c * 1.15;
      return Math.min(255, Math.max(0, Math.round(Math.max(added, multiplied))));
    }
  };
  
  const newR = adjust(rgb.r);
  const newG = adjust(rgb.g);
  const newB = adjust(rgb.b);
  
  if (rgb.a < 1) {
    return `rgba(${newR}, ${newG}, ${newB}, ${rgb.a})`;
  }
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Derive active/pressed color (more pronounced than hover)
 */
export function deriveActiveColor(backgroundColor: string, isDarkTheme?: boolean): string {
  const rgb = parseColor(backgroundColor);
  
  if (!rgb) {
    return isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const isLight = luminance > 0.5;
  
  // For dark colors, add brightness. For light colors, reduce brightness.
  const adjust = (c: number) => {
    if (isLight) {
      // Darken by 15%
      return Math.min(255, Math.max(0, Math.round(c * 0.85)));
    } else {
      // Lighten: add 35 or multiply by 1.2, whichever is larger
      const added = c + 35;
      const multiplied = c * 1.2;
      return Math.min(255, Math.max(0, Math.round(Math.max(added, multiplied))));
    }
  };
  
  const newR = adjust(rgb.r);
  const newG = adjust(rgb.g);
  const newB = adjust(rgb.b);
  
  if (rgb.a < 1) {
    return `rgba(${newR}, ${newG}, ${newB}, ${rgb.a})`;
  }
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Get complete theme-aware color palette from a background color
 */
export function getThemeAwareColors(
  backgroundColor: string,
  options?: {
    isDarkTheme?: boolean;
    primaryColor?: string;
  }
): ThemeAwareColors {
  const { isDarkTheme = false, primaryColor = '#8B5CF6' } = options || {};
  
  const rgb = parseColor(backgroundColor);
  const isLight = rgb ? getLuminance(rgb.r, rgb.g, rgb.b) > 0.45 : !isDarkTheme;
  
  // Text colors
  const text = isLight ? '#1f2937' : '#ffffff';
  const textMuted = isLight ? '#6b7280' : '#9ca3af';
  
  // Hover/active colors
  const hoverBg = deriveHoverColor(backgroundColor, isDarkTheme);
  const activeBg = deriveActiveColor(backgroundColor, isDarkTheme);
  
  // Border color (subtle)
  const border = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  
  // Check WCAG compliance
  const meetsAAContrast = meetsWCAGAA(text, backgroundColor);
  
  return {
    text,
    textMuted,
    hoverBg,
    activeBg,
    border,
    meetsAAContrast,
  };
}

/**
 * Extract the dominant color from a gradient string
 * Returns the first color stop
 */
export function extractGradientFirstColor(gradient: string): string | null {
  // Match various gradient formats
  // linear-gradient(135deg, #fff 0%, #000 100%)
  // linear-gradient(to right, rgb(255, 255, 255), rgb(0, 0, 0))
  
  const colorMatches = gradient.match(
    /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/g
  );
  
  if (colorMatches && colorMatches.length > 0) {
    return colorMatches[0];
  }
  
  return null;
}

/**
 * Check if a text/background combination is readable
 */
export function isReadable(textColor: string, bgColor: string): boolean {
  return meetsWCAGAA(textColor, bgColor);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Adjust color brightness
 * @param color - Any valid CSS color
 * @param amount - Positive to lighten, negative to darken (-100 to 100)
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  
  const factor = 1 + (amount / 100);
  
  const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c * factor)));
  
  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

// Export default object for convenient access
export const ContrastEngine = {
  parseColor,
  getLuminance,
  getContrastRatio,
  meetsWCAGAA,
  isLightColor,
  getContrastTextColor,
  deriveHoverColor,
  deriveActiveColor,
  getThemeAwareColors,
  extractGradientFirstColor,
  isReadable,
  rgbToHsl,
  adjustBrightness,
};
