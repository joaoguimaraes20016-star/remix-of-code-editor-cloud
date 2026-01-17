import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Check, Sparkles } from 'lucide-react';

export interface LoaderAnimationProps {
  text?: string;
  subText?: string;
  animationType?: 'spinner' | 'progress' | 'dots' | 'pulse' | 'analyzing';
  duration?: number; // milliseconds
  autoAdvance?: boolean;
  onComplete?: () => void;
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
  };
  showProgress?: boolean;
  // NEW: Enhanced features
  size?: 'sm' | 'md' | 'lg';
  customSteps?: string[]; // For analyzing type
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  completeText?: string;
  showPercentage?: boolean;
  className?: string;
  isBuilder?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: {
    spinner: 'w-10 h-10',
    check: 'w-5 h-5',
    progress: 'h-2 max-w-[200px]',
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
    subText: 'text-xs',
    pulse: { outer: 'w-14 h-14', inner: 'w-8 h-8', icon: 'w-4 h-4' },
    analyzing: { outer: 'w-16 h-16', middle: 'w-14 h-14', inner: 'w-12 h-12', text: 'text-lg' },
  },
  md: {
    spinner: 'w-16 h-16',
    check: 'w-8 h-8',
    progress: 'h-3 max-w-xs',
    dot: 'w-4 h-4',
    text: 'text-lg',
    subText: 'text-sm',
    pulse: { outer: 'w-20 h-20', inner: 'w-12 h-12', icon: 'w-6 h-6' },
    analyzing: { outer: 'w-24 h-24', middle: 'w-20 h-20', inner: 'w-16 h-16', text: 'text-2xl' },
  },
  lg: {
    spinner: 'w-24 h-24',
    check: 'w-12 h-12',
    progress: 'h-4 max-w-md',
    dot: 'w-6 h-6',
    text: 'text-xl',
    subText: 'text-base',
    pulse: { outer: 'w-28 h-28', inner: 'w-16 h-16', icon: 'w-8 h-8' },
    analyzing: { outer: 'w-32 h-32', middle: 'w-28 h-28', inner: 'w-24 h-24', text: 'text-3xl' },
  },
};

// Easing functions
const easingFunctions = {
  'linear': (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

export const LoaderAnimation: React.FC<LoaderAnimationProps> = ({
  text = 'Loading...',
  subText,
  animationType = 'spinner',
  duration = 3000,
  autoAdvance = true,
  onComplete,
  colors = {},
  showProgress = true,
  size = 'md',
  customSteps,
  easing = 'ease-out',
  completeText = 'Complete!',
  showPercentage = true,
  className,
  isBuilder = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const sizes = sizeConfig[size];
  const easingFn = easingFunctions[easing];

  useEffect(() => {
    // In builder mode, run a looping preview animation that respects duration/easing
    if (isBuilder) {
      let animationFrame: number;
      let startTime = Date.now();
      
      const animatePreview = () => {
        const elapsed = Date.now() - startTime;
        // Loop the animation based on actual duration
        const loopedElapsed = elapsed % duration;
        const rawProgress = loopedElapsed / duration;
        const easedProgress = easingFn(rawProgress) * 100;
        
        setProgress(easedProgress);
        animationFrame = requestAnimationFrame(animatePreview);
      };
      
      animationFrame = requestAnimationFrame(animatePreview);
      return () => cancelAnimationFrame(animationFrame);
    }

    if (!autoAdvance) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const easedProgress = easingFn(rawProgress) * 100;
      
      setProgress(easedProgress);

      if (rawProgress >= 1) {
        clearInterval(interval);
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, autoAdvance, onComplete, isBuilder, easing, easingFn]);

  const primaryColor = colors.primary || 'hsl(var(--primary))';
  const backgroundColor = colors.background || 'hsl(var(--muted))';
  const textColor = colors.text || 'inherit';

  // Spinner animation
  if (animationType === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="relative">
          {isComplete ? (
            <div 
              className={cn('rounded-full flex items-center justify-center animate-scale-in', sizes.spinner)}
              style={{ backgroundColor: primaryColor }}
            >
              <Check className={cn('text-white', sizes.check)} />
            </div>
          ) : (
            <Loader2 
              className={cn('animate-spin', sizes.spinner)} 
              style={{ color: primaryColor }}
            />
          )}
        </div>
        <p 
          className={cn('mt-4 font-medium', sizes.text)}
          style={{ color: textColor }}
        >
          {isComplete ? completeText : text}
        </p>
        {subText && !isComplete && (
          <p className={cn('mt-1 opacity-60', sizes.subText)} style={{ color: textColor }}>
            {subText}
          </p>
        )}
        {showProgress && (
          <div className={cn('mt-4 w-48', sizes.progress)}>
            <div 
              className="h-full rounded-full overflow-hidden"
              style={{ backgroundColor }}
            >
              <div 
                className="h-full rounded-full transition-all duration-150"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: primaryColor 
                }}
              />
            </div>
            {showPercentage && (
              <p className="mt-1 text-xs text-center opacity-60" style={{ color: textColor }}>
                {Math.round(progress)}%
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Progress bar animation
  if (animationType === 'progress') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p 
          className={cn('mb-4 font-medium', sizes.text)}
          style={{ color: textColor }}
        >
          {isComplete ? completeText : text}
        </p>
        <div className={cn('w-full', sizes.progress)}>
          <div 
            className="h-full rounded-full overflow-hidden"
            style={{ backgroundColor }}
          >
            <div 
              className="h-full rounded-full transition-all duration-150 relative overflow-hidden"
              style={{ 
                width: `${progress}%`,
                backgroundColor: primaryColor 
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          {showPercentage && (
            <p className="mt-2 text-sm text-center opacity-60" style={{ color: textColor }}>
              {Math.round(progress)}%
            </p>
          )}
        </div>
        {subText && !isComplete && (
          <p className={cn('mt-3 opacity-60', sizes.subText)} style={{ color: textColor }}>
            {subText}
          </p>
        )}
        
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Dots animation
  if (animationType === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('rounded-full animate-bounce', sizes.dot)}
              style={{ 
                backgroundColor: primaryColor,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
        <p 
          className={cn('mt-4 font-medium', sizes.text)}
          style={{ color: textColor }}
        >
          {text}
        </p>
        {subText && (
          <p className={cn('mt-1 opacity-60', sizes.subText)} style={{ color: textColor }}>
            {subText}
          </p>
        )}
      </div>
    );
  }

  // Pulse animation
  if (animationType === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="relative">
          <div 
            className={cn('rounded-full animate-pulse', sizes.pulse.outer)}
            style={{ backgroundColor: `${primaryColor}20` }}
          />
          <div 
            className={cn('absolute inset-0 m-auto rounded-full flex items-center justify-center', sizes.pulse.inner)}
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className={cn('text-white', sizes.pulse.icon)} />
          </div>
        </div>
        <p 
          className={cn('mt-4 font-medium', sizes.text)}
          style={{ color: textColor }}
        >
          {text}
        </p>
        {subText && (
          <p className={cn('mt-1 opacity-60', sizes.subText)} style={{ color: textColor }}>
            {subText}
          </p>
        )}
        {showProgress && (
          <div className={cn('mt-4 w-48', sizes.progress)}>
            <div 
              className="h-full rounded-full overflow-hidden"
              style={{ backgroundColor }}
            >
              <div 
                className="h-full rounded-full transition-all duration-150"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: primaryColor 
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Analyzing animation (multi-step with messages)
  if (animationType === 'analyzing') {
    const defaultSteps = [
      'Analyzing your responses...',
      'Calculating results...',
      'Preparing your personalized report...',
    ];
    const steps = customSteps?.length ? customSteps : defaultSteps;
    const currentStep = Math.min(Math.floor(progress / (100 / steps.length)), steps.length - 1);

    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="relative mb-4">
          <div 
            className={cn('rounded-full border-4 border-t-transparent animate-spin', sizes.analyzing.outer)}
            style={{ borderColor: `${primaryColor}30`, borderTopColor: 'transparent' }}
          />
          <div 
            className={cn('absolute inset-0 m-auto rounded-full border-4 border-t-transparent animate-spin', sizes.analyzing.middle)}
            style={{ 
              borderColor: `${primaryColor}60`, 
              borderTopColor: 'transparent',
              animationDirection: 'reverse',
              animationDuration: '1.5s'
            }}
          />
          <div 
            className={cn('absolute inset-0 m-auto rounded-full flex items-center justify-center', sizes.analyzing.inner)}
            style={{ backgroundColor: primaryColor }}
          >
            <span className={cn('font-bold text-white', sizes.analyzing.text)}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        
        <p 
          className={cn('font-medium transition-all duration-300', sizes.text)}
          style={{ color: textColor }}
        >
          {isBuilder ? text : steps[currentStep]}
        </p>
        
        {subText && (
          <p className={cn('mt-1 opacity-60', sizes.subText)} style={{ color: textColor }}>
            {subText}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i <= currentStep ? 'scale-100' : 'scale-75 opacity-50'
              )}
              style={{ 
                backgroundColor: i <= currentStep ? primaryColor : backgroundColor 
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default LoaderAnimation;
