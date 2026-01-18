/**
 * ScrollTransformWrapper - Runtime component for scroll-bound property transforms
 * 
 * Wraps elements and applies transforms based on scroll position.
 * Uses requestAnimationFrame for smooth 60fps updates.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface ScrollTransformConfig {
  enabled: boolean;
  property: 'opacity' | 'scale' | 'translateY' | 'translateX' | 'rotate';
  startValue: number;
  endValue: number;
}

interface ScrollTransformWrapperProps {
  children: React.ReactNode;
  config?: ScrollTransformConfig;
  className?: string;
  style?: React.CSSProperties;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function ScrollTransformWrapper({ 
  children, 
  config, 
  className,
  style 
}: ScrollTransformWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>();
  // Cache rect values to avoid layout thrashing
  const cachedRectRef = useRef<{ top: number; bottom: number; height: number } | null>(null);
  const lastScrollY = useRef<number>(0);

  const updateProgress = useCallback(() => {
    if (!ref.current) return;
    
    // Only recalculate rect if scroll position changed significantly
    // This reduces layout thrashing from getBoundingClientRect
    const scrollDelta = Math.abs(window.scrollY - lastScrollY.current);
    if (scrollDelta > 2 || !cachedRectRef.current) {
      const rect = ref.current.getBoundingClientRect();
      cachedRectRef.current = { top: rect.top, bottom: rect.bottom, height: rect.height };
      lastScrollY.current = window.scrollY;
    }
    
    const { top, bottom, height } = cachedRectRef.current;
    const windowHeight = window.innerHeight;
    
    // Check if in view
    const isInView = bottom > 0 && top < windowHeight;
    
    if (!isInView) {
      setProgress(bottom <= 0 ? 1 : 0);
      return;
    }
    
    // Calculate progress based on element center position
    const elementCenter = top + height / 2;
    const rawProgress = (windowHeight - elementCenter) / windowHeight;
    setProgress(Math.max(0, Math.min(1, rawProgress)));
  }, []);

  useEffect(() => {
    if (!config?.enabled) return;

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [config?.enabled, updateProgress]);

  // Calculate transform style
  const transformStyle = useMemo((): React.CSSProperties => {
    if (!config?.enabled) return {};

    const { property, startValue, endValue } = config;
    const value = lerp(startValue, endValue, progress);

    switch (property) {
      case 'opacity':
        return { opacity: Math.max(0, Math.min(1, value / 100)) };
      case 'scale':
        return { transform: `scale(${value / 100})` };
      case 'translateY':
        return { transform: `translateY(${value}px)` };
      case 'translateX':
        return { transform: `translateX(${value}px)` };
      case 'rotate':
        return { transform: `rotate(${value}deg)` };
      default:
        return {};
    }
  }, [config, progress]);

  // If not enabled, render children directly without wrapper overhead
  if (!config?.enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...transformStyle,
        willChange: config.property === 'opacity' ? 'opacity' : 'transform',
      }}
    >
      {children}
    </div>
  );
}
