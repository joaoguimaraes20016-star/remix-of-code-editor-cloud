import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  showNew?: boolean;
  gradient: 'blue' | 'purple' | 'orange' | 'emerald' | 'pink' | 'deep-blue' | 'indigo';
  variant?: 'standard' | 'hero';
  className?: string;
}

const gradients = {
  blue: 'from-blue-500 via-blue-600 to-indigo-600',
  purple: 'from-purple-500 via-violet-600 to-indigo-600',
  orange: 'from-orange-500 via-amber-500 to-yellow-500',
  emerald: 'from-emerald-600 via-teal-600 to-cyan-700',
  pink: 'from-pink-500 via-rose-500 to-red-500',
  'deep-blue': 'from-blue-600 via-blue-700 to-indigo-800',
  indigo: 'from-indigo-500 via-purple-600 to-violet-700'
};

export function StatCard({ label, value, trend, subtitle, showNew, gradient, variant = 'standard', className }: StatCardProps) {
  const isHero = variant === 'hero';
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-gradient-to-br text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
      gradients[gradient],
      isHero ? "p-8" : "p-6",
      className
    )}>
      {/* Glossy glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15 backdrop-blur-sm" />
      <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
      
      <div className="relative z-10">
        <p className={cn(
          "font-medium text-white/80 mb-1 drop-shadow-sm",
          isHero ? "text-base" : "text-sm"
        )}>{label}</p>
        <p className={cn(
          "font-semibold text-white drop-shadow-sm mb-2",
          isHero ? "text-4xl tracking-tight" : "text-2xl"
        )}>{value}</p>
        
        {showNew ? (
          <p className="text-sm flex items-center gap-1">
            <span className="text-white/90 font-medium">New</span>
            {subtitle && (
              <span className="text-white/70">{subtitle}</span>
            )}
          </p>
        ) : trend !== undefined ? (
          <p className="text-sm flex items-center gap-1">
            {trend.value !== 0 ? (
              <>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-white/90" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-white/90" />
                )}
                <span className="font-medium text-white/90">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </>
            ) : (
              <span className="text-white/70">—</span>
            )}
            {subtitle && (
              <span className="text-white/70">{subtitle}</span>
            )}
          </p>
        ) : subtitle ? (
          <p className="text-sm text-white/70 mt-2">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
