import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface CountdownTimerProps {
  endDate: string;
  style?: 'boxes' | 'inline' | 'minimal' | 'flip';
  expiredAction?: 'hide' | 'show-message' | 'redirect';
  expiredMessage?: string;
  expiredRedirectUrl?: string;
  colors?: {
    background?: string;
    text?: string;
    label?: string;
    separator?: string;
  };
  showLabels?: boolean;
  showDays?: boolean;
  showSeconds?: boolean;
  onExpire?: () => void;
  className?: string;
  isBuilder?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(endDate: string): TimeRemaining {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = Math.max(0, end - now);
  
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return { days, hours, minutes, seconds, total };
}

function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  style = 'boxes',
  expiredAction = 'show-message',
  expiredMessage = 'Time\'s up!',
  expiredRedirectUrl,
  colors = {},
  showLabels = true,
  showDays = true,
  showSeconds = true,
  onExpire,
  className,
  isBuilder = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => 
    calculateTimeRemaining(endDate)
  );
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    // Update immediately when endDate changes
    setTimeRemaining(calculateTimeRemaining(endDate));
    setHasExpired(false);
  }, [endDate]);

  useEffect(() => {
    if (hasExpired) return;
    
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(endDate);
      setTimeRemaining(remaining);
      
      if (remaining.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        
        if (expiredAction === 'redirect' && expiredRedirectUrl && !isBuilder) {
          window.location.href = expiredRedirectUrl;
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endDate, hasExpired, expiredAction, expiredRedirectUrl, onExpire, isBuilder]);

  // Expired state
  if (hasExpired && expiredAction === 'hide') {
    return null;
  }

  if (hasExpired && expiredAction === 'show-message') {
    return (
      <div className={cn('text-center py-4', className)}>
        <span 
          className="text-lg font-semibold"
          style={{ color: colors.text }}
        >
          {expiredMessage}
        </span>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeRemaining;

  const timeUnits = useMemo(() => {
    const units: { value: number; label: string }[] = [];
    if (showDays) units.push({ value: days, label: 'Days' });
    units.push({ value: hours, label: 'Hours' });
    units.push({ value: minutes, label: 'Minutes' });
    if (showSeconds) units.push({ value: seconds, label: 'Seconds' });
    return units;
  }, [days, hours, minutes, seconds, showDays, showSeconds]);

  // Boxes style (default)
  if (style === 'boxes') {
    return (
      <div className={cn('flex items-center justify-center gap-2 sm:gap-4', className)}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            {index > 0 && (
              <span 
                className="text-2xl sm:text-3xl font-bold opacity-50"
                style={{ color: colors.separator || colors.text }}
              >
                :
              </span>
            )}
            <div 
              className="flex flex-col items-center"
            >
              <div 
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: colors.background || 'rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <span 
                  className="text-2xl sm:text-4xl font-bold tabular-nums"
                  style={{ color: colors.text || 'inherit' }}
                >
                  {padZero(unit.value)}
                </span>
              </div>
              {showLabels && (
                <span 
                  className="text-[10px] sm:text-xs uppercase tracking-wider mt-1.5 font-medium opacity-70"
                  style={{ color: colors.label || colors.text }}
                >
                  {unit.label}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Inline style
  if (style === 'inline') {
    const parts = timeUnits.map(u => padZero(u.value));
    return (
      <div className={cn('text-center', className)}>
        <span 
          className="text-3xl sm:text-5xl font-mono font-bold tracking-tight"
          style={{ color: colors.text || 'inherit' }}
        >
          {parts.join(' : ')}
        </span>
        {showLabels && (
          <div className="flex justify-center gap-8 mt-2">
            {timeUnits.map(unit => (
              <span 
                key={unit.label}
                className="text-xs uppercase tracking-wider opacity-60"
                style={{ color: colors.label || colors.text }}
              >
                {unit.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Minimal style
  if (style === 'minimal') {
    const parts = timeUnits.map(u => padZero(u.value));
    return (
      <span 
        className={cn('font-mono font-semibold text-lg', className)}
        style={{ color: colors.text || 'inherit' }}
      >
        {parts.join(':')}
      </span>
    );
  }

  // Flip style (animated)
  if (style === 'flip') {
    return (
      <div className={cn('flex items-center justify-center gap-1 sm:gap-3', className)}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            {index > 0 && (
              <span 
                className="text-3xl font-bold mx-1"
                style={{ color: colors.separator || colors.text }}
              >
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div 
                  className="w-12 h-16 sm:w-16 sm:h-20 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ 
                    backgroundColor: colors.background || '#1a1a2e',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <span 
                    className="text-2xl sm:text-4xl font-bold tabular-nums"
                    style={{ color: colors.text || '#ffffff' }}
                  >
                    {padZero(unit.value)}
                  </span>
                </div>
                {/* Center line effect */}
                <div 
                  className="absolute left-0 right-0 top-1/2 h-px opacity-20"
                  style={{ backgroundColor: colors.text || '#ffffff' }}
                />
              </div>
              {showLabels && (
                <span 
                  className="text-[10px] sm:text-xs uppercase tracking-wider mt-2 font-medium"
                  style={{ color: colors.label || colors.text || '#888' }}
                >
                  {unit.label}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return null;
};

export default CountdownTimer;
