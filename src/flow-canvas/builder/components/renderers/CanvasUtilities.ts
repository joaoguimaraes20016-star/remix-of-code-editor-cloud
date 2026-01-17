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

/**
 * Easing presets map
 */
export const easingMap: Record<string, string> = {
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'linear': 'linear',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Export a utility object for convenient access
export const CanvasUtilities = {
  getContrastTextColor,
  lightenHex,
  getPageBackgroundStyles,
  getOverlayStyles,
  getEmbedUrl,
  effectClasses,
  deviceWidths,
  easingMap,
};
