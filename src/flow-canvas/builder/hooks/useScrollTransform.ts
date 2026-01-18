/**
 * useScrollTransform - Bind element properties to scroll progress
 * 
 * Creates smooth parallax and reveal effects by interpolating
 * property values based on element's position in viewport.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface ScrollTransformConfig {
  enabled: boolean;
  property: 'opacity' | 'scale' | 'translateY' | 'translateX' | 'rotate';
  startValue: number;  // Value when element is at bottom of viewport
  endValue: number;    // Value when element is at top of viewport
}

interface UseScrollTransformOptions {
  config?: ScrollTransformConfig;
  previewMode?: boolean;
}

interface UseScrollTransformReturn {
  ref: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
  progress: number;
}

/**
 * Interpolate between start and end values based on progress (0-1)
 */
function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function useScrollTransform(options: UseScrollTransformOptions): UseScrollTransformReturn {
  const { config, previewMode = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();

  const updateProgress = useCallback(() => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Check if element is in view
    const isInView = rect.bottom > 0 && rect.top < windowHeight;
    
    if (!isInView) {
      // Clamp to 0 or 1 based on position
      setProgress(rect.bottom <= 0 ? 1 : 0);
      return;
    }
    
    // Calculate progress: 0 when element enters at bottom, 1 when it exits at top
    // Using element center for smoother transitions
    const elementCenter = rect.top + rect.height / 2;
    const rawProgress = (windowHeight - elementCenter) / windowHeight;
    const clampedProgress = Math.max(0, Math.min(1, rawProgress));
    
    setProgress(clampedProgress);
  }, []);

  useEffect(() => {
    if (!config?.enabled || !previewMode) {
      return;
    }

    const handleScroll = () => {
      // Use requestAnimationFrame for smooth updates
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    // Initial calculation
    updateProgress();
    
    // Listen for scroll and resize
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [config?.enabled, previewMode, updateProgress]);

  // Calculate the transform style based on progress
  const style = useMemo((): React.CSSProperties => {
    if (!config?.enabled || !previewMode) {
      return {};
    }

    const { property, startValue, endValue } = config;
    const interpolatedValue = lerp(startValue, endValue, progress);

    switch (property) {
      case 'opacity':
        return { opacity: Math.max(0, Math.min(1, interpolatedValue / 100)) };
      
      case 'scale':
        return { transform: `scale(${interpolatedValue / 100})` };
      
      case 'translateY':
        return { transform: `translateY(${interpolatedValue}px)` };
      
      case 'translateX':
        return { transform: `translateX(${interpolatedValue}px)` };
      
      case 'rotate':
        return { transform: `rotate(${interpolatedValue}deg)` };
      
      default:
        return {};
    }
  }, [config, progress, previewMode]);

  return { ref, style, progress };
}

/**
 * Property presets for common scroll transform effects
 */
export const scrollTransformPresets = [
  { 
    id: 'fade-in', 
    label: 'Fade In', 
    property: 'opacity' as const, 
    startValue: 0, 
    endValue: 100,
    description: 'Fade in as you scroll'
  },
  { 
    id: 'fade-out', 
    label: 'Fade Out', 
    property: 'opacity' as const, 
    startValue: 100, 
    endValue: 0,
    description: 'Fade out as you scroll'
  },
  { 
    id: 'scale-up', 
    label: 'Scale Up', 
    property: 'scale' as const, 
    startValue: 80, 
    endValue: 100,
    description: 'Grow as you scroll'
  },
  { 
    id: 'scale-down', 
    label: 'Scale Down', 
    property: 'scale' as const, 
    startValue: 100, 
    endValue: 80,
    description: 'Shrink as you scroll'
  },
  { 
    id: 'parallax-up', 
    label: 'Parallax Up', 
    property: 'translateY' as const, 
    startValue: 50, 
    endValue: -50,
    description: 'Move up faster than scroll'
  },
  { 
    id: 'parallax-down', 
    label: 'Parallax Down', 
    property: 'translateY' as const, 
    startValue: -50, 
    endValue: 50,
    description: 'Move down slower than scroll'
  },
  { 
    id: 'slide-in-left', 
    label: 'Slide In Left', 
    property: 'translateX' as const, 
    startValue: -100, 
    endValue: 0,
    description: 'Slide in from left'
  },
  { 
    id: 'slide-in-right', 
    label: 'Slide In Right', 
    property: 'translateX' as const, 
    startValue: 100, 
    endValue: 0,
    description: 'Slide in from right'
  },
  { 
    id: 'rotate-in', 
    label: 'Rotate In', 
    property: 'rotate' as const, 
    startValue: -15, 
    endValue: 0,
    description: 'Rotate as you scroll'
  },
];
