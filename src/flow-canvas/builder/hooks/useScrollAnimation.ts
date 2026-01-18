import { useEffect, useRef, useState, useCallback } from 'react';
import type { AnimationSettings } from '../../types/infostack';

interface UseScrollAnimationOptions {
  settings?: AnimationSettings;
  previewMode?: boolean;
}

interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement>;
  animationClass: string;
  animationStyle: React.CSSProperties;
  isVisible: boolean;
}

// Effect class mapping for animations
const effectClasses: Record<string, string> = {
  'fade-in': 'animate-fade-in',
  'slide-up': 'animate-slide-up',
  'slide-down': 'animate-slide-down',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'bounce': 'animate-bounce',
  'pulse': 'animate-pulse',
  'scale': 'animate-scale-in',
  'flip': 'animate-flip-in',
  'rotate': 'animate-rotate-in',
  'zoom-in': 'animate-zoom-in',
};

export const useScrollAnimation = (options: UseScrollAnimationOptions): UseScrollAnimationReturn => {
  const { settings, previewMode = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Reset animation state when settings change
  useEffect(() => {
    if (settings?.trigger === 'scroll') {
      setHasAnimated(false);
      setIsVisible(false);
    }
  }, [settings?.effect, settings?.trigger]);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    if (!settings || settings.trigger !== 'scroll' || !ref.current) {
      // If not scroll-triggered, show immediately for load trigger
      if (settings?.trigger === 'load' || !settings?.trigger) {
        setIsVisible(true);
      }
      return;
    }

    // Only run IntersectionObserver in preview mode
    if (!previewMode) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    const threshold = settings.threshold ?? 0.1;
    const scrollOffset = settings.scrollOffset ?? 0;
    const shouldRepeat = settings.repeat ?? false;
    const shouldExitAnimate = settings.exitAnimation ?? false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Only animate if not yet animated, or if repeat is enabled
          if (!hasAnimated || shouldRepeat) {
            setIsVisible(true);
            if (!shouldRepeat) {
              setHasAnimated(true);
            }
          }
        } else if (shouldExitAnimate && isVisible) {
          // Reset visibility when exiting viewport (for exit animations)
          setIsVisible(false);
        }
      },
      { 
        threshold, 
        rootMargin: `${scrollOffset}px 0px ${scrollOffset}px 0px` 
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [settings, previewMode, hasAnimated, isVisible]);

  // Get animation class
  const getAnimationClass = useCallback(() => {
    if (!settings?.effect) return '';
    
    // For load trigger, always show animation
    if (settings.trigger === 'load' || !settings.trigger) {
      return effectClasses[settings.effect] || '';
    }
    
    // For scroll trigger, only animate when visible
    if (settings.trigger === 'scroll') {
      return isVisible ? (effectClasses[settings.effect] || '') : 'opacity-0';
    }
    
    // For hover trigger, handle via CSS
    if (settings.trigger === 'hover') {
      return `hover:${effectClasses[settings.effect] || ''}`;
    }
    
    return '';
  }, [settings, isVisible]);

  // Get animation style for custom timing
  const getAnimationStyle = useCallback((): React.CSSProperties => {
    if (!settings) return {};
    
    const style: React.CSSProperties = {};
    
    if (settings.delay && settings.delay > 0) {
      style.animationDelay = `${settings.delay}ms`;
    }
    
    if (settings.duration && settings.duration > 0) {
      style.animationDuration = `${settings.duration}ms`;
    }
    
    if (settings.easing) {
      // Handle spring easing with custom cubic-bezier approximation
      if (settings.easing === 'spring') {
        const stiffness = settings.springStiffness ?? 300;
        const damping = settings.springDamping ?? 30;
        // Approximate spring with cubic-bezier based on stiffness/damping ratio
        const ratio = damping / Math.sqrt(stiffness);
        if (ratio < 0.5) {
          // Underdamped - bouncy
          style.animationTimingFunction = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else if (ratio < 1) {
          // Slightly underdamped
          style.animationTimingFunction = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
        } else {
          // Critically damped or overdamped
          style.animationTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
        }
      } else {
        style.animationTimingFunction = settings.easing;
      }
    }
    
    // For scroll animations that haven't triggered yet
    if (settings.trigger === 'scroll' && !isVisible) {
      style.opacity = 0;
      style.transition = 'none';
    }
    
    return style;
  }, [settings, isVisible]);

  return {
    ref,
    animationClass: getAnimationClass(),
    animationStyle: getAnimationStyle(),
    isVisible,
  };
};

// Helper to evaluate conditional visibility
export const evaluateVisibility = (
  conditions: Array<{ field: string; operator: string; value: string; action: string }>,
  logic: 'and' | 'or',
  formValues: Record<string, string>
): boolean => {
  if (!conditions || conditions.length === 0) return true;

  const results = conditions.map((condition) => {
    const fieldValue = formValues[condition.field] || '';
    
    let conditionMet = false;
    
    switch (condition.operator) {
      case 'equals':
        conditionMet = fieldValue === condition.value;
        break;
      case 'notEquals':
        conditionMet = fieldValue !== condition.value;
        break;
      case 'contains':
        conditionMet = fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        break;
      case 'notEmpty':
        conditionMet = fieldValue.trim().length > 0;
        break;
      case 'isEmpty':
        conditionMet = fieldValue.trim().length === 0;
        break;
      case 'greater_than':
      case 'greaterThan':
        conditionMet = Number(fieldValue) > Number(condition.value);
        break;
      case 'less_than':
      case 'lessThan':
        conditionMet = Number(fieldValue) < Number(condition.value);
        break;
      default:
        conditionMet = true;
    }
    
    // If action is 'hide', invert the result
    return condition.action === 'hide' ? !conditionMet : conditionMet;
  });

  // Apply AND/OR logic
  if (logic === 'and') {
    return results.every(Boolean);
  } else {
    return results.some(Boolean);
  }
};

// Get all input field keys from a page
export const collectFieldKeys = (steps: Array<{ frames: Array<{ stacks: Array<{ blocks: Array<{ elements: Array<{ type: string; props: Record<string, unknown> }> }> }> }> }>): Array<{ key: string; label: string }> => {
  const fields: Array<{ key: string; label: string }> = [];
  
  for (const step of steps) {
    for (const frame of step.frames) {
      for (const stack of frame.stacks) {
        for (const block of stack.blocks) {
          for (const element of block.elements) {
            if (['input', 'select', 'checkbox', 'radio', 'dropdown'].includes(element.type)) {
              const fieldKey = element.props?.fieldKey as string;
              const label = element.props?.label as string || element.props?.placeholder as string || fieldKey;
              if (fieldKey) {
                fields.push({ key: fieldKey, label });
              }
            }
          }
        }
      }
    }
  }
  
  return fields;
};
