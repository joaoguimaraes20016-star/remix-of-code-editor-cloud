import React from 'react';
import { LoaderContent } from '@/types/funnel';
import { cn } from '@/lib/utils';

interface LoaderBlockProps {
  content: LoaderContent;
}

export function LoaderBlock({ content }: LoaderBlockProps) {
  const { progress, showPercentage, color, trackColor, label } = content;
  
  // Circular progress indicator
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={trackColor || 'hsl(var(--muted))'}
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color || 'hsl(var(--primary))'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-2xl font-bold"
              style={{ color: color || 'hsl(var(--primary))' }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      
      {label && (
        <p className="text-sm text-muted-foreground text-center">{label}</p>
      )}
    </div>
  );
}
