import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  // NEW: Enhanced features
  loopMode?: boolean;
  loopInterval?: number; // minutes to reset to
  speedMultiplier?: number; // 1 = real, 2 = 2x faster, etc.
  boxSize?: 'sm' | 'md' | 'lg' | 'xl';
  customLabels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
  animateDigits?: boolean;
  urgencyPulse?: boolean; // Pulse animation when under 1 minute
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

// Size variants for boxes
const sizeClasses = {
  sm: { box: 'w-10 h-10 sm:w-12 sm:h-12', text: 'text-lg sm:text-xl', label: 'text-[8px]', separator: 'text-lg sm:text-xl' },
  md: { box: 'w-14 h-14 sm:w-20 sm:h-20', text: 'text-2xl sm:text-4xl', label: 'text-[10px] sm:text-xs', separator: 'text-2xl sm:text-3xl' },
  lg: { box: 'w-18 h-18 sm:w-24 sm:h-24', text: 'text-3xl sm:text-5xl', label: 'text-xs sm:text-sm', separator: 'text-3xl sm:text-4xl' },
  xl: { box: 'w-24 h-24 sm:w-32 sm:h-32', text: 'text-4xl sm:text-6xl', label: 'text-sm', separator: 'text-4xl sm:text-5xl' },
};

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
  loopMode = false,
  loopInterval = 60, // 60 minutes default
  speedMultiplier = 1,
  boxSize = 'md',
  customLabels,
  animateDigits = false,
  urgencyPulse = false,
  onExpire,
  className,
  isBuilder = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => 
    calculateTimeRemaining(endDate)
  );
  const [hasExpired, setHasExpired] = useState(false);
  const [loopEndDate, setLoopEndDate] = useState(endDate);
  const prevTimeRef = useRef<TimeRemaining | null>(null);

  useEffect(() => {
    // Update immediately when endDate changes
    setTimeRemaining(calculateTimeRemaining(endDate));
    setLoopEndDate(endDate);
    setHasExpired(false);
  }, [endDate]);

  useEffect(() => {
    if (hasExpired && !loopMode) return;
    
    // Use faster interval for speed multiplier
    const intervalMs = Math.max(50, 1000 / speedMultiplier);
    
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(loopEndDate);
      
      // Apply speed multiplier by advancing time faster
      if (speedMultiplier > 1) {
        const adjustedTotal = remaining.total - (intervalMs * (speedMultiplier - 1));
        const adjustedEnd = new Date(new Date(loopEndDate).getTime() - (intervalMs * (speedMultiplier - 1)));
        setLoopEndDate(adjustedEnd.toISOString());
      }
      
      setTimeRemaining(remaining);
      
      if (remaining.total <= 0) {
        if (loopMode && !isBuilder) {
          // Reset to loop interval
          const newEndDate = new Date(Date.now() + loopInterval * 60 * 1000);
          setLoopEndDate(newEndDate.toISOString());
          setTimeRemaining(calculateTimeRemaining(newEndDate.toISOString()));
        } else if (!hasExpired) {
          setHasExpired(true);
          onExpire?.();
          
          if (expiredAction === 'redirect' && expiredRedirectUrl && !isBuilder) {
            window.location.href = expiredRedirectUrl;
          }
        }
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [loopEndDate, hasExpired, expiredAction, expiredRedirectUrl, onExpire, isBuilder, loopMode, loopInterval, speedMultiplier]);

  // Track previous values for animation
  useEffect(() => {
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining]);

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

  const { days, hours, minutes, seconds, total } = timeRemaining;
  const isUrgent = urgencyPulse && total < 60000 && total > 0; // Under 1 minute
  const sizes = sizeClasses[boxSize];

  const getLabel = (key: 'days' | 'hours' | 'minutes' | 'seconds') => {
    return customLabels?.[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const timeUnits = useMemo(() => {
    const units: { value: number; label: string; key: string }[] = [];
    if (showDays) units.push({ value: days, label: getLabel('days'), key: 'days' });
    units.push({ value: hours, label: getLabel('hours'), key: 'hours' });
    units.push({ value: minutes, label: getLabel('minutes'), key: 'minutes' });
    if (showSeconds) units.push({ value: seconds, label: getLabel('seconds'), key: 'seconds' });
    return units;
  }, [days, hours, minutes, seconds, showDays, showSeconds, customLabels]);

  // Check if digit changed for animation
  const didChange = (key: string, value: number) => {
    if (!animateDigits || !prevTimeRef.current) return false;
    const prev = prevTimeRef.current;
    const prevValue = key === 'days' ? prev.days : key === 'hours' ? prev.hours : key === 'minutes' ? prev.minutes : prev.seconds;
    return prevValue !== value;
  };

  // Boxes style (default)
  if (style === 'boxes') {
    return (
      <div className={cn('flex items-center justify-center gap-2 sm:gap-4', isUrgent && 'animate-pulse', className)}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.key}>
            {index > 0 && (
              <span 
                className={cn('font-bold opacity-50', sizes.separator)}
                style={{ color: colors.separator || colors.text }}
              >
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  'rounded-xl flex items-center justify-center transition-transform',
                  sizes.box,
                  animateDigits && didChange(unit.key, unit.value) && 'animate-bounce-subtle'
                )}
                style={{ 
                  backgroundColor: colors.background || 'rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <span 
                  className={cn('font-bold tabular-nums', sizes.text)}
                  style={{ color: colors.text || 'inherit' }}
                >
                  {padZero(unit.value)}
                </span>
              </div>
              {showLabels && (
                <span 
                  className={cn('uppercase tracking-wider mt-1.5 font-medium opacity-70', sizes.label)}
                  style={{ color: colors.label || colors.text }}
                >
                  {unit.label}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
        
        {/* Urgency pulse keyframes */}
        {isUrgent && (
          <style>{`
            @keyframes urgency-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.02); }
            }
          `}</style>
        )}
        
        {/* Digit bounce animation */}
        {animateDigits && (
          <style>{`
            @keyframes bounce-subtle {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            .animate-bounce-subtle {
              animation: bounce-subtle 0.3s ease-out;
            }
          `}</style>
        )}
      </div>
    );
  }

  // Inline style
  if (style === 'inline') {
    const parts = timeUnits.map(u => padZero(u.value));
    return (
      <div className={cn('text-center', isUrgent && 'animate-pulse', className)}>
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
                key={unit.key}
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
        className={cn('font-mono font-semibold text-lg', isUrgent && 'animate-pulse', className)}
        style={{ color: colors.text || 'inherit' }}
      >
        {parts.join(':')}
      </span>
    );
  }

  // Flip style (animated)
  if (style === 'flip') {
    return (
      <div className={cn('flex items-center justify-center gap-1 sm:gap-3', isUrgent && 'animate-pulse', className)}>
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.key}>
            {index > 0 && (
              <span 
                className="text-3xl font-bold mx-1"
                style={{ color: colors.separator || colors.text }}
              >
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <div className="relative perspective-500">
                <div 
                  className={cn(
                    'rounded-lg flex items-center justify-center overflow-hidden',
                    boxSize === 'sm' ? 'w-10 h-14 sm:w-12 sm:h-16' :
                    boxSize === 'lg' ? 'w-16 h-22 sm:w-20 sm:h-28' :
                    boxSize === 'xl' ? 'w-20 h-28 sm:w-24 sm:h-32' :
                    'w-12 h-16 sm:w-16 sm:h-20',
                    animateDigits && didChange(unit.key, unit.value) && 'flip-animate'
                  )}
                  style={{ 
                    backgroundColor: colors.background || '#1a1a2e',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <span 
                    className={cn('font-bold tabular-nums', sizes.text)}
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
                  className={cn('uppercase tracking-wider mt-2 font-medium', sizes.label)}
                  style={{ color: colors.label || colors.text || '#888' }}
                >
                  {unit.label}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
        
        {animateDigits && (
          <style>{`
            .perspective-500 { perspective: 500px; }
            @keyframes flip-down {
              0% { transform: rotateX(0deg); }
              50% { transform: rotateX(-90deg); }
              100% { transform: rotateX(0deg); }
            }
            .flip-animate {
              animation: flip-down 0.6s ease-in-out;
            }
          `}</style>
        )}
      </div>
    );
  }

  return null;
};

export default CountdownTimer;
