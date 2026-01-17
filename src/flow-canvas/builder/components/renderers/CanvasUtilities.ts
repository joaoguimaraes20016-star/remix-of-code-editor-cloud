/**
 * Canvas Utilities - Shared helpers and contexts for canvas rendering
 */

import { createContext } from 'react';
import type { PageBackground } from '../../../types/infostack';
import { gradientToCSS } from '../modals';

// ============================================================================
// CONTEXTS
// ============================================================================

/**
 * Form state context for preview mode
 */
export interface FormStateContextValue {
  values: Record<string, string>;
  checkboxValues: Record<string, Set<string>>;
  setValue: (key: string, value: string) => void;
  toggleCheckbox: (groupKey: string, value: string) => void;
  isChecked: (groupKey: string, value: string) => boolean;
  isPreviewMode: boolean;
}

export const FormStateContext = createContext<FormStateContextValue>({
  values: {},
  checkboxValues: {},
  setValue: () => {},
  toggleCheckbox: () => {},
  isChecked: () => false,
  isPreviewMode: false,
});

/**
 * Theme context for passing dark mode state and primary color down
 */
export interface ThemeContextValue {
  isDarkTheme: boolean;
  primaryColor: string;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDarkTheme: false,
  primaryColor: '#8B5CF6',
});

// ============================================================================
// CONSTANTS
// ============================================================================

export const deviceWidths: Record<string, string> = {
  desktop: 'max-w-5xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

/**
 * Effect CSS class mapping - comprehensive mapping for all effect IDs
 */
export const effectClasses: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'bounce': 'animate-bounce',
  'bounce-in': 'effect-bounce-in',
  'pulse': 'animate-pulse',
  'scale': 'animate-scale-in',
  'flip': 'animate-flip-in',
  'flip-in': 'effect-flip-in',
  'rotate': 'animate-rotate-in',
  // Attention effects
  'shake': 'effect-shake',
  'wiggle': 'effect-wiggle',
  'glow': 'effect-glow',
  // Icon effects
  'icon-spin': 'effect-spin',
  'icon-pulse': 'effect-pulse',
  'icon-bounce': 'effect-bounce-in',
  'icon-shake': 'effect-shake',
  'icon-wobble': 'effect-wiggle',
  // Text effects
  'typewriter': 'effect-typewriter',
  'word-fade': 'effect-word-fade',
  'text-blur': 'effect-blur-in',
  'text-glow': 'effect-glow',
  'text-gradient': 'shimmer',
  'blur-in': 'effect-blur-in',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get contrasting text color based on background luminance
 */
export function getContrastTextColor(backgroundColor: string): string {
  try {
    const hex = backgroundColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

/**
 * Derive a lighter shade from a hex color (used for theme-aware gradient fallbacks)
 */
export function lightenHex(hex: string, mixWithWhite = 0.28): string {
  try {
    const h = hex.replace('#', '').trim();
    if (h.length !== 6) return hex;

    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);

    const mix = (c: number) => Math.round(c + (255 - c) * mixWithWhite);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');

    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
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

/**
 * Generate page background styles
 */
export function getPageBackgroundStyles(bg: PageBackground | undefined, isDarkTheme: boolean): React.CSSProperties {
  const defaultBg = isDarkTheme ? '#111827' : '#ffffff';
  
  if (!bg || !bg.type) {
    return { backgroundColor: defaultBg };
  }
  
  const styles: React.CSSProperties = {};
  
  switch (bg.type) {
    case 'solid':
      styles.backgroundColor = bg.color || defaultBg;
      break;
    case 'gradient':
      if (bg.gradient && bg.gradient.stops && bg.gradient.stops.length >= 2) {
        styles.background = gradientToCSS(bg.gradient);
      } else {
        styles.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      break;
    case 'image':
      if (bg.image) {
        styles.backgroundImage = `url(${bg.image})`;
        styles.backgroundSize = 'cover';
        styles.backgroundPosition = 'center';
      } else {
        styles.backgroundColor = defaultBg;
      }
      break;
    case 'video':
      // Video backgrounds render as transparent - actual video element overlaid separately
      styles.backgroundColor = 'transparent';
      break;
    case 'pattern':
      styles.backgroundColor = bg.color || defaultBg;
      if (bg.pattern) {
        const p = bg.pattern;
        const opacity = (p.opacity || 20) / 100;
        const size = p.size || 20;
        let svg = '';
        switch (p.type) {
          case 'dots':
            svg = `<circle cx="${size/2}" cy="${size/2}" r="1.5" fill="${p.color}" fill-opacity="${opacity}"/>`;
            break;
          case 'grid':
            svg = `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
          case 'lines':
            svg = `<path d="M 0 ${size} L ${size} 0" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
          case 'noise':
            svg = `<path d="M 0 ${size} L ${size} 0 M ${size} ${size} L 0 0" stroke="${p.color}" stroke-opacity="${opacity}" stroke-width="0.5"/>`;
            break;
        }
        const encoded = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`);
        styles.backgroundImage = `url("data:image/svg+xml,${encoded}")`;
        styles.backgroundRepeat = 'repeat';
      }
      break;
    default:
      styles.backgroundColor = defaultBg;
  }
  
  return styles;
}

/**
 * Get video embed URL from various platforms
 */
export function getVideoBackgroundUrl(url: string | undefined): string | null {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&modestbranding=1`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  
  // Direct video URL (mp4, webm)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  
  return null;
}

/**
 * Check if a video URL is a direct file (mp4, webm) vs embed (YouTube, Vimeo)
 */
export function isDirectVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !!url.match(/\.(mp4|webm|ogg)(\?|$)/i);
}

/**
 * Get overlay styles for backgrounds
 */
export function getOverlayStyles(bg: PageBackground | undefined): React.CSSProperties | null {
  if (!bg?.overlay || bg.overlay === 'none') return null;
  
  const opacity = (bg.overlayOpacity || 50) / 100;
  
  switch (bg.overlay) {
    case 'dark':
      return { backgroundColor: `rgba(0, 0, 0, ${opacity})` };
    case 'light':
      return { backgroundColor: `rgba(255, 255, 255, ${opacity})` };
    case 'gradient-dark':
      return { background: `linear-gradient(to bottom, transparent, rgba(0, 0, 0, ${opacity}))` };
    case 'gradient-light':
      return { background: `linear-gradient(to bottom, transparent, rgba(255, 255, 255, ${opacity}))` };
    default:
      return null;
  }
}

/**
 * Convert video URL to embed URL
 */
export function getEmbedUrl(url: string, platform: string): string {
  if (platform === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  if (platform === 'loom') {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) return `https://www.loom.com/embed/${match[1]}`;
  }
  return url;
}

// Re-export easing map from unified presets
import { easingMap } from '../../utils/presets';
export { easingMap };

// Export a utility object for convenient access
export const CanvasUtilities = {
  getContrastTextColor,
  lightenHex,
  shiftHue,
  getPageBackgroundStyles,
  getOverlayStyles,
  getEmbedUrl,
  effectClasses,
  deviceWidths,
  easingMap,
};
