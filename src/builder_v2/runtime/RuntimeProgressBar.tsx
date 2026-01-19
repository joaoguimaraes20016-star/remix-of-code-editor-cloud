/**
 * RuntimeProgressBar - Shows funnel progress based on current step
 */

import { useFunnelRuntimeOptional } from '@/flow-canvas/components/runtime/FunnelRuntimeContext';
import { cn } from '@/lib/utils';

interface RuntimeProgressBarProps {
  className?: string;
  showStepCount?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export function RuntimeProgressBar({ 
  className,
  showStepCount = false,
  color = 'hsl(var(--primary))',
  backgroundColor = 'hsl(var(--muted))',
  height = 4,
}: RuntimeProgressBarProps) {
  const runtime = useFunnelRuntimeOptional();
  
  if (!runtime) return null;
  
  const { currentStep, totalSteps } = runtime.state;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className={cn('runtime-progress', className)}>
      <div 
        className="runtime-progress-track w-full overflow-hidden rounded-full"
        style={{ 
          backgroundColor,
          height: `${height}px`,
        }}
      >
        <div 
          className="runtime-progress-fill h-full transition-all duration-300 ease-out rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showStepCount && (
        <span className="runtime-progress-count text-xs text-muted-foreground mt-1">
          Step {currentStep + 1} of {totalSteps}
        </span>
      )}
    </div>
  );
}
