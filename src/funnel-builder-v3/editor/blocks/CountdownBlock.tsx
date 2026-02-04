import React, { useState, useEffect, useCallback } from 'react';
import { CountdownContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface CountdownBlockProps {
  content: CountdownContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: string): TimeLeft | null {
  const difference = new Date(endDate).getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

interface TimeUnitProps {
  value: number;
  label: string;
  textColor?: string;
  textGradient?: string;
}

function TimeUnit({ value, label, textColor, textGradient }: TimeUnitProps) {
  // Text gradient uses CSS variable approach
  const hasGradient = !!textGradient;
  const labelStyle: React.CSSProperties = hasGradient
    ? { '--text-gradient': textGradient } as React.CSSProperties
    : textColor ? { color: textColor } : {};

  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center",
          textColor ? "text-background" : "bg-foreground text-background"
        )}
        style={textColor ? { backgroundColor: textColor } : undefined}
      >
        <span className="text-2xl font-bold tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span 
        className={cn(
          "text-xs mt-2 uppercase tracking-wider",
          !textColor && !hasGradient && "text-muted-foreground",
          hasGradient && "text-gradient-clip"
        )}
        style={labelStyle}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownBlock({ content, blockId, stepId, isPreview }: CountdownBlockProps) {
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const { endDate, showDays, expiredText, backgroundColor, backgroundGradient, textColor, textGradient } = content;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(endDate));

  const canEdit = blockId && stepId && !isPreview;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'countdown',
    hintText: 'Click to edit countdown'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const handleExpiredTextChange = useCallback((newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { expiredText: newText });
    }
  }, [blockId, stepId, updateBlockContent]);

  const containerStyle: React.CSSProperties = {};
  if (backgroundGradient) {
    containerStyle.background = backgroundGradient;
  } else if (backgroundColor) {
    containerStyle.backgroundColor = backgroundColor;
  }
  
  // Use text gradient or solid color
  const effectiveTextColor = textGradient ? undefined : textColor;

  if (!timeLeft) {
    return wrapWithOverlay(
      <div className="text-center py-4 rounded-lg" style={containerStyle}>
        <div 
          className="text-lg font-medium"
          style={textColor ? { color: textColor } : undefined}
        >
          {canEdit ? (
            <EditableText
              value={expiredText || 'Offer Expired'}
              onChange={handleExpiredTextChange}
              as="p"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{}}
              onStyleChange={() => {}}
            />
          ) : (
            expiredText || 'Offer Expired'
          )}
        </div>
      </div>
    );
  }

  return wrapWithOverlay(
    <div className="flex justify-center gap-3 py-4 rounded-lg" style={containerStyle}>
      {showDays && <TimeUnit value={timeLeft.days} label="Days" textColor={effectiveTextColor} textGradient={textGradient} />}
      <TimeUnit value={timeLeft.hours} label="Hours" textColor={effectiveTextColor} textGradient={textGradient} />
      <TimeUnit value={timeLeft.minutes} label="Mins" textColor={effectiveTextColor} textGradient={textGradient} />
      <TimeUnit value={timeLeft.seconds} label="Secs" textColor={effectiveTextColor} textGradient={textGradient} />
    </div>
  );
}
