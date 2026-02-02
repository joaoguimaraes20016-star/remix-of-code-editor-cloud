import React, { useEffect, useState, useRef } from 'react';
import { LoaderContent } from '@/funnel-builder-v3/types/funnel';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { cn } from '@/lib/utils';

interface LoaderBlockProps {
  content: LoaderContent;
  isPreview?: boolean;
}

// Size mappings
const sizeClasses = {
  small: { loader: 'w-8 h-8', text: 'text-sm', subtext: 'text-xs' },
  medium: { loader: 'w-12 h-12', text: 'text-base', subtext: 'text-sm' },
  large: { loader: 'w-16 h-16', text: 'text-lg', subtext: 'text-base' },
};

export function LoaderBlock({ content, isPreview }: LoaderBlockProps) {
  const {
    text = 'Processing...',
    subtext,
    loaderStyle = 'circular',
    size = 'medium',
    color = '#6366f1',
    backgroundColor,
    duration = 3,
    action = { type: 'next-step' },
  } = content;

  const runtime = useFunnelRuntimeOptional();
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Timer and action execution (only in preview/live mode)
  useEffect(() => {
    if (!isPreview) return;

    startTimeRef.current = Date.now();
    const durationMs = duration * 1000;

    // Progress animation for progress bar style
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(newProgress);
    }, 50);

    // Action execution timer
    timerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);

      // Execute action
      switch (action.type) {
        case 'next-step':
          runtime?.goToNextStep();
          break;
        case 'specific-step':
          if (action.stepId) {
            runtime?.goToStep(action.stepId);
          }
          break;
        case 'external-url':
          if (action.url) {
            window.location.href = action.url;
          }
          break;
        case 'reveal-content':
          // Future: implement block reveal logic
          break;
      }
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(progressInterval);
    };
  }, [isPreview, duration, action, runtime]);

  const sizeConfig = sizeClasses[size] || sizeClasses.medium;

  const renderLoader = () => {
    switch (loaderStyle) {
      case 'circular':
        return <CircularLoader size={sizeConfig.loader} color={color} />;
      case 'dots':
        return <DotsLoader size={sizeConfig.loader} color={color} />;
      case 'bars':
        return <BarsLoader size={sizeConfig.loader} color={color} />;
      case 'progress':
        return <ProgressLoader progress={progress} color={color} />;
      case 'pulse':
        return <PulseLoader size={sizeConfig.loader} color={color} />;
      default:
        return <CircularLoader size={sizeConfig.loader} color={color} />;
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-lg"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      {renderLoader()}
      
      {text && (
        <p 
          className={cn("font-medium text-center", sizeConfig.text)}
          style={content.textStyles ? {
            color: content.textStyles.color,
            fontSize: content.textStyles.fontSize,
            fontWeight: content.textStyles.fontWeight,
          } : undefined}
        >
          {text}
        </p>
      )}
      
      {subtext && (
        <p 
          className={cn("text-muted-foreground text-center", sizeConfig.subtext)}
          style={content.subtextStyles ? {
            color: content.subtextStyles.color,
            fontSize: content.subtextStyles.fontSize,
          } : undefined}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}

// ========== LOADER ANIMATIONS ==========

function CircularLoader({ size, color }: { size: string; color: string }) {
  return (
    <div className={cn(size, "relative")}>
      <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={`${color}30`}
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  );
}

function DotsLoader({ size, color }: { size: string; color: string }) {
  return (
    <div className={cn(size, "flex items-center justify-center gap-1.5")}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full animate-bounce"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

function BarsLoader({ size, color }: { size: string; color: string }) {
  return (
    <div className={cn(size, "flex items-end justify-center gap-1")}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            height: '100%',
            animation: 'bars 1s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bars {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function ProgressLoader({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="w-full max-w-xs">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        {Math.round(progress)}%
      </p>
    </div>
  );
}

function PulseLoader({ size, color }: { size: string; color: string }) {
  return (
    <div className={cn(size, "relative flex items-center justify-center")}>
      <div
        className="absolute w-full h-full rounded-full animate-ping opacity-30"
        style={{ backgroundColor: color }}
      />
      <div
        className="w-1/2 h-1/2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
