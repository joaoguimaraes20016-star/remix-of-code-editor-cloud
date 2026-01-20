/**
 * FlowCanvasSurface - Shared surface renderer for editor and runtime parity
 * 
 * This component is the SINGLE SOURCE OF TRUTH for:
 * - Device width constraints (max-w-5xl/2xl/sm)
 * - Background resolution (step.background → page.settings.page_background)
 * - Dark/light theme detection (background luminance)
 * - Font family + primary color injection
 * - Full-bleed background with constrained content
 * 
 * Used by:
 * - CanvasRenderer (editor mode with chrome)
 * - FlowCanvasRenderer (runtime mode, no chrome)
 */

import React, { useMemo, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { 
  getPageBackgroundStyles, 
  getOverlayStyles, 
  getVideoBackgroundUrl, 
  isDirectVideoUrl,
  type PageBackground 
} from '../components/runtime/backgroundUtils';

// ============================================================================
// Types
// ============================================================================

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface SurfaceSettings {
  theme?: 'light' | 'dark';
  font_family?: string;
  primary_color?: string;
  page_background?: PageBackground;
}

export interface SurfaceBackground {
  type?: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    stops: Array<{ color: string; position: number }>;
  };
  image?: string;
  video?: string;
  pattern?: {
    type: 'dots' | 'grid' | 'lines' | 'noise';
    color: string;
    size?: number;
    opacity?: number;
  };
  overlay?: 'none' | 'dark' | 'light' | 'gradient-dark' | 'gradient-light';
  overlayOpacity?: number;
  videoOpacity?: number;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
}

export interface FlowCanvasSurfaceProps {
  children: React.ReactNode;
  /** Device mode for responsive constraints */
  deviceMode: DeviceMode;
  /** Step-level background (overrides page) */
  stepBackground?: SurfaceBackground;
  /** Page-level settings including background fallback */
  pageSettings?: SurfaceSettings;
  /** Additional className for the root element */
  className?: string;
  /** Whether this is runtime (full-bleed) or editor (with canvas chrome) */
  mode?: 'editor' | 'runtime';
}

// ============================================================================
// Theme Context (shared by editor + runtime)
// ============================================================================

export interface ThemeContextValue {
  isDarkTheme: boolean;
  primaryColor: string;
  fontFamily: string;
}

export const SurfaceThemeContext = createContext<ThemeContextValue>({
  isDarkTheme: false,
  primaryColor: '#8B5CF6',
  fontFamily: 'Inter',
});

export const useSurfaceTheme = () => useContext(SurfaceThemeContext);

// ============================================================================
// Constants
// ============================================================================

export const deviceWidths: Record<DeviceMode, string> = {
  desktop: 'max-w-5xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate luminance from hex color to determine if background is dark
 */
function calcLuminance(hex: string): number | null {
  try {
    const h = hex.replace('#', '');
    if (h.length !== 6) return null;
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return null;
  }
}

/**
 * Detect if background is dark based on color/gradient/overlay
 * Matches CanvasRenderer's detection logic exactly
 */
function detectIsDarkBackground(
  background: SurfaceBackground | PageBackground | undefined,
  fallbackTheme?: 'light' | 'dark'
): boolean {
  if (!background) {
    return fallbackTheme === 'dark';
  }

  if (background.type === 'solid' && background.color) {
    const lum = calcLuminance(background.color);
    if (lum !== null) return lum < 0.5;
  }

  if (background.type === 'gradient' && background.gradient?.stops?.length) {
    const stops = background.gradient.stops;
    const luminances = stops
      .map((s) => calcLuminance(s.color))
      .filter((l): l is number => l !== null);
    if (luminances.length > 0) {
      const avgLuminance = luminances.reduce((a, b) => a + b, 0) / luminances.length;
      return avgLuminance < 0.5;
    }
  }

  if ((background.type === 'image' || background.type === 'video') && background.overlay) {
    // For overlays, check if it's a dark overlay
    if (background.overlay === 'dark' || background.overlay === 'gradient-dark') {
      return true;
    }
    if (background.overlay === 'light' || background.overlay === 'gradient-light') {
      return false;
    }
  }

  // Fallback to theme setting
  return fallbackTheme === 'dark';
}

// ============================================================================
// Component
// ============================================================================

export function FlowCanvasSurface({
  children,
  deviceMode,
  stepBackground,
  pageSettings,
  className,
  mode = 'runtime',
}: FlowCanvasSurfaceProps) {
  // Resolve background: step-level overrides page-level
  const resolvedBackground = useMemo(() => {
    const hasStepBg = stepBackground && (stepBackground.type || stepBackground.color);
    return hasStepBg ? stepBackground : pageSettings?.page_background;
  }, [stepBackground, pageSettings?.page_background]);

  // Detect dark theme from background luminance
  const isDarkTheme = useMemo(
    () => detectIsDarkBackground(resolvedBackground, pageSettings?.theme),
    [resolvedBackground, pageSettings?.theme]
  );

  // Extract design tokens
  const primaryColor = pageSettings?.primary_color || '#8B5CF6';
  const fontFamily = pageSettings?.font_family || 'Inter';

  // Generate background styles
  const backgroundStyles = useMemo(
    () => getPageBackgroundStyles(resolvedBackground as PageBackground | undefined, isDarkTheme),
    [resolvedBackground, isDarkTheme]
  );

  const overlayStyles = useMemo(
    () => getOverlayStyles(resolvedBackground as PageBackground | undefined),
    [resolvedBackground]
  );

  // Video background handling
  const videoBackgroundUrl = useMemo(() => {
    if (resolvedBackground?.type === 'video' && resolvedBackground.video) {
      return getVideoBackgroundUrl(resolvedBackground.video);
    }
    return null;
  }, [resolvedBackground]);

  const isDirectVideo = useMemo(() => {
    if (resolvedBackground?.type === 'video' && resolvedBackground.video) {
      return isDirectVideoUrl(resolvedBackground.video);
    }
    return false;
  }, [resolvedBackground]);

  // Cast to access video-specific props safely
  const bgWithVideo = resolvedBackground as SurfaceBackground | undefined;
  const videoOpacity = ((bgWithVideo?.videoOpacity ?? 100) / 100);

  // Theme context value
  const themeValue = useMemo(
    () => ({ isDarkTheme, primaryColor, fontFamily }),
    [isDarkTheme, primaryColor, fontFamily]
  );

  // Runtime mode: full-bleed background, constrained content
  if (mode === 'runtime') {
    return (
      <SurfaceThemeContext.Provider value={themeValue}>
        <div
          className={cn(
            'flowcanvas-runtime min-h-screen relative overflow-x-hidden',
            isDarkTheme && 'dark',
            className
          )}
          style={{
            fontFamily,
            '--primary-color': primaryColor,
            ...backgroundStyles,
          } as React.CSSProperties}
        >
          {/* Video background - full bleed */}
          {videoBackgroundUrl && (
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
              {isDirectVideo ? (
                <video
                  src={videoBackgroundUrl}
                  autoPlay={bgWithVideo?.videoAutoplay ?? true}
                  muted={bgWithVideo?.videoMuted ?? true}
                  loop={bgWithVideo?.videoLoop ?? true}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: videoOpacity }}
                />
              ) : (
                <iframe
                  src={videoBackgroundUrl}
                  className="absolute inset-0 w-full h-full scale-150"
                  style={{ opacity: videoOpacity }}
                  allow="autoplay; fullscreen"
                  frameBorder={0}
                />
              )}
            </div>
          )}

          {/* Background overlay - full bleed */}
          {overlayStyles && (
            <div
              className="fixed inset-0 z-[1] pointer-events-none"
              style={overlayStyles}
            />
          )}

          {/* Constrained content container - matches editor spacing */}
          <div className={cn('mx-auto px-8 pb-8 pt-4 relative z-10', deviceWidths[deviceMode])}>
            {children}
          </div>
        </div>
      </SurfaceThemeContext.Provider>
    );
  }

  // Editor mode: canvas chrome wrapper (handled by CanvasRenderer)
  // This branch is mainly for documentation; editor uses CanvasRenderer directly
  return (
    <SurfaceThemeContext.Provider value={themeValue}>
      <div
        className={cn('relative', isDarkTheme && 'dark-theme', className)}
        style={{
          fontFamily,
          '--primary-color': primaryColor,
          ...backgroundStyles,
        } as React.CSSProperties}
      >
        {/* Video background */}
        {videoBackgroundUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {isDirectVideo ? (
              <video
                src={videoBackgroundUrl}
                autoPlay={bgWithVideo?.videoAutoplay ?? true}
                muted={bgWithVideo?.videoMuted ?? true}
                loop={bgWithVideo?.videoLoop ?? true}
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: videoOpacity }}
              />
            ) : (
              <iframe
                src={videoBackgroundUrl}
                className="absolute inset-0 w-full h-full scale-150"
                style={{ opacity: videoOpacity }}
                allow="autoplay; fullscreen"
                frameBorder={0}
              />
            )}
          </div>
        )}

        {/* Background overlay */}
        {overlayStyles && (
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={overlayStyles}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </SurfaceThemeContext.Provider>
  );
}

export default FlowCanvasSurface;
