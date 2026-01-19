/**
 * Background utilities for runtime rendering.
 * These mirror the editor's background logic exactly to ensure WYSIWYG parity.
 */

export interface GradientStop {
  color: string;
  position: number;
}

export interface GradientValue {
  type: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}

export interface PatternSettings {
  type: 'dots' | 'grid' | 'lines' | 'noise';
  color: string;
  size?: number;
  opacity?: number;
}

export interface PageBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  color?: string;
  gradient?: GradientValue;
  image?: string;
  video?: string;
  pattern?: PatternSettings;
  overlay?: 'none' | 'dark' | 'light' | 'gradient-dark' | 'gradient-light';
  overlayOpacity?: number;
}

/**
 * Convert gradient to CSS string
 */
export function gradientToCSS(gradient: GradientValue): string {
  if (!gradient.stops || gradient.stops.length < 2) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopsCSS = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stopsCSS})`;
  }

  const angle = gradient.angle ?? 135;
  return `linear-gradient(${angle}deg, ${stopsCSS})`;
}

/**
 * Generate page background styles - exact mirror of editor logic
 */
export function getPageBackgroundStyles(
  bg: PageBackground | undefined,
  isDarkTheme = true
): React.CSSProperties {
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
      // Video backgrounds need a separate element, background stays transparent
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
            svg = `<circle cx="${size / 2}" cy="${size / 2}" r="1.5" fill="${p.color}" fill-opacity="${opacity}"/>`;
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
        const encoded = encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${svg}</svg>`
        );
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
 * Get video embed URL from various platforms
 */
export function getVideoBackgroundUrl(url: string | undefined): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return url;
  }

  return null;
}

/**
 * Check if URL is a direct video file
 */
export function isDirectVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}
