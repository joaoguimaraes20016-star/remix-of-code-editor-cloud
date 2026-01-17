/**
 * useScrollProgress - Track scroll position for parallax effects
 * 
 * Returns a progress value 0-1 based on element visibility in viewport
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollProgress {
  /** Progress 0-1 where 0 = element at bottom of viewport, 1 = element at top */
  progress: number;
  /** Is element currently visible in viewport */
  isVisible: boolean;
  /** Ref to attach to the target element */
  ref: React.RefObject<HTMLElement>;
}

export function useScrollProgress(): ScrollProgress {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const updateProgress = useCallback(() => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate visibility
    const isInView = rect.bottom > 0 && rect.top < windowHeight;
    setIsVisible(isInView);
    
    if (!isInView) {
      // If above viewport, progress = 1; if below, progress = 0
      setProgress(rect.bottom <= 0 ? 1 : 0);
      return;
    }
    
    // Calculate progress: 0 when element enters at bottom, 1 when it exits at top
    // Using element center for smoother parallax
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    
    // Normalize to 0-1 range
    const rawProgress = (windowHeight - elementCenter) / windowHeight;
    const clampedProgress = Math.max(0, Math.min(1, rawProgress));
    
    setProgress(clampedProgress);
  }, []);

  useEffect(() => {
    // Initial calculation
    updateProgress();
    
    // Listen for scroll and resize
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [updateProgress]);

  return { progress, isVisible, ref };
}

/**
 * Calculate parallax transform based on scroll progress and intensity
 */
export function getParallaxTransform(
  progress: number, 
  intensity: number, 
  effect: 'lift' | 'sink' | 'scale' | 'fade' = 'lift'
): React.CSSProperties {
  // intensity: -50 to 50
  const normalized = intensity / 50; // -1 to 1
  
  switch (effect) {
    case 'lift':
      // Element moves up as you scroll down
      const liftY = (progress - 0.5) * normalized * 100;
      return { transform: `translateY(${-liftY}px)` };
      
    case 'sink':
      // Element moves down as you scroll down
      const sinkY = (progress - 0.5) * normalized * 100;
      return { transform: `translateY(${sinkY}px)` };
      
    case 'scale':
      // Element scales based on visibility
      const scaleBase = 1;
      const scaleAmount = progress * Math.abs(normalized) * 0.2;
      const scale = normalized > 0 ? scaleBase + scaleAmount : scaleBase - scaleAmount * 0.5;
      return { transform: `scale(${Math.max(0.8, Math.min(1.2, scale))})` };
      
    case 'fade':
      // Element fades in/out based on visibility
      const opacity = normalized > 0 
        ? Math.min(1, progress * 2)
        : Math.max(0, 1 - progress);
      return { opacity };
      
    default:
      return {};
  }
}
