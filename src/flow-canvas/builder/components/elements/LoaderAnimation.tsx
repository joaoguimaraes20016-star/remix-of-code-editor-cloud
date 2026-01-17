import React, { useState, useEffect } from 'react';
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
  className?: string;
  isBuilder?: boolean;
}

export const LoaderAnimation: React.FC<LoaderAnimationProps> = ({
  text = 'Loading...',
  subText,
  animationType = 'spinner',
  duration = 3000,
  autoAdvance = true,
  onComplete,
  colors = {},
  showProgress = true,
  className,
  isBuilder = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isBuilder) {
      // In builder, show at 60% for preview
      setProgress(60);
      return;
    }

    if (!autoAdvance) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      
      // Ease-out for more natural feel
      const easedProgress = 100 - Math.pow(1 - newProgress / 100, 3) * 100;
      setProgress(easedProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, autoAdvance, onComplete, isBuilder]);

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
              className="w-16 h-16 rounded-full flex items-center justify-center animate-scale-in"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-8 h-8 text-white" />
            </div>
          ) : (
            <Loader2 
              className="w-16 h-16 animate-spin" 
              style={{ color: primaryColor }}
            />
          )}
        </div>
        <p 
          className="mt-4 text-lg font-medium"
          style={{ color: textColor }}
        >
          {isComplete ? 'Complete!' : text}
        </p>
        {subText && !isComplete && (
          <p className="mt-1 text-sm opacity-60" style={{ color: textColor }}>
            {subText}
          </p>
        )}
        {showProgress && (
          <div className="mt-4 w-48">
            <div 
              className="h-1.5 rounded-full overflow-hidden"
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

  // Progress bar animation
  if (animationType === 'progress') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p 
          className="mb-4 text-lg font-medium"
          style={{ color: textColor }}
        >
          {isComplete ? 'Complete!' : text}
        </p>
        <div className="w-full max-w-xs">
          <div 
            className="h-3 rounded-full overflow-hidden"
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
          <p className="mt-2 text-sm text-center opacity-60" style={{ color: textColor }}>
            {Math.round(progress)}%
          </p>
        </div>
        {subText && !isComplete && (
          <p className="mt-3 text-sm opacity-60" style={{ color: textColor }}>
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
              className="w-4 h-4 rounded-full animate-bounce"
              style={{ 
                backgroundColor: primaryColor,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
        <p 
          className="mt-4 text-lg font-medium"
          style={{ color: textColor }}
        >
          {text}
        </p>
        {subText && (
          <p className="mt-1 text-sm opacity-60" style={{ color: textColor }}>
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
            className="w-20 h-20 rounded-full animate-pulse"
            style={{ backgroundColor: `${primaryColor}20` }}
          />
          <div 
            className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <p 
          className="mt-4 text-lg font-medium"
          style={{ color: textColor }}
        >
          {text}
        </p>
        {subText && (
          <p className="mt-1 text-sm opacity-60" style={{ color: textColor }}>
            {subText}
          </p>
        )}
        {showProgress && (
          <div className="mt-4 w-48">
            <div 
              className="h-1.5 rounded-full overflow-hidden"
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
    const steps = [
      'Analyzing your responses...',
      'Calculating results...',
      'Preparing your personalized report...',
    ];
    const currentStep = Math.min(Math.floor(progress / 35), steps.length - 1);

    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="relative mb-4">
          <div 
            className="w-24 h-24 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${primaryColor}30`, borderTopColor: 'transparent' }}
          />
          <div 
            className="absolute inset-0 m-auto w-20 h-20 rounded-full border-4 border-t-transparent animate-spin"
            style={{ 
              borderColor: `${primaryColor}60`, 
              borderTopColor: 'transparent',
              animationDirection: 'reverse',
              animationDuration: '1.5s'
            }}
          />
          <div 
            className="absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-2xl font-bold text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        
        <p 
          className="text-lg font-medium transition-all duration-300"
          style={{ color: textColor }}
        >
          {isBuilder ? text : steps[currentStep]}
        </p>
        
        {subText && (
          <p className="mt-1 text-sm opacity-60" style={{ color: textColor }}>
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
