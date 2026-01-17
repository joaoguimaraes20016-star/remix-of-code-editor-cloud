/**
 * Premium Element Components
 * 
 * High-impact visual elements for premium funnel designs.
 * Inspired by InfiniaGrowth, Puppetmaster, and The 2026 Blueprint.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Play, Check, ArrowRight } from 'lucide-react';

// ============================================
// GRADIENT TEXT
// ============================================

interface GradientTextProps {
  content: string;
  gradient?: string[];  // Array of color stops
  angle?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GradientText({ 
  content, 
  gradient = ['#A855F7', '#EC4899'], 
  angle = 90,
  className,
  style 
}: GradientTextProps) {
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${angle}deg, ${gradient.join(', ')})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline',
    ...style,
  };

  return (
    <span className={cn("font-bold", className)} style={gradientStyle}>
      {content}
    </span>
  );
}

// ============================================
// UNDERLINE TEXT
// ============================================

interface UnderlineTextProps {
  content: string;
  underlineColor?: string;
  underlineGradient?: string[];
  underlineStyle?: 'solid' | 'wavy' | 'script';
  className?: string;
  style?: React.CSSProperties;
}

export function UnderlineText({ 
  content, 
  underlineColor = '#EC4899',
  underlineGradient,
  underlineStyle = 'solid',
  className,
  style 
}: UnderlineTextProps) {
  const underline = underlineGradient 
    ? `linear-gradient(90deg, ${underlineGradient.join(', ')})`
    : underlineColor;

  return (
    <span 
      className={cn("relative inline-block", className)} 
      style={style}
    >
      {content}
      <span 
        className={cn(
          "absolute left-0 right-0 bottom-0 h-[3px] rounded-full",
          underlineStyle === 'wavy' && "animate-wiggle"
        )}
        style={{ 
          background: underline,
          bottom: '-4px',
        }}
      />
    </span>
  );
}

// ============================================
// STAT NUMBER
// ============================================

interface StatNumberProps {
  value: number | string;
  suffix?: string;
  prefix?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export function StatNumber({ 
  value, 
  suffix = '+', 
  prefix = '',
  label,
  size = 'lg',
  className,
  style 
}: StatNumberProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  };

  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : value;

  return (
    <div className={cn("text-center", className)} style={style}>
      <div className={cn(
        sizeClasses[size],
        "font-bold tracking-tight tabular-nums leading-none"
      )}>
        {prefix}{formattedValue}{suffix}
      </div>
      {label && (
        <div className="text-sm opacity-70 uppercase tracking-wider mt-2">
          {label}
        </div>
      )}
    </div>
  );
}

// ============================================
// AVATAR GROUP
// ============================================

interface AvatarGroupProps {
  avatars?: string[];  // Array of image URLs
  count?: number;      // Number of placeholder avatars if no images
  size?: 'sm' | 'md' | 'lg';
  overlap?: number;    // Overlap in pixels
  className?: string;
  style?: React.CSSProperties;
}

export function AvatarGroup({ 
  avatars = [], 
  count = 3,
  size = 'md',
  overlap = -8,
  className,
  style 
}: AvatarGroupProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const displayCount = avatars.length > 0 ? avatars.length : count;
  
  // Placeholder colors for demo
  const placeholderColors = [
    'bg-purple-500',
    'bg-pink-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-orange-500',
  ];

  return (
    <div className={cn("flex items-center", className)} style={style}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            sizeClasses[size],
            "rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center overflow-hidden",
            !avatars[i] && placeholderColors[i % placeholderColors.length]
          )}
          style={{ marginLeft: i > 0 ? overlap : 0 }}
        >
          {avatars[i] ? (
            <img 
              src={avatars[i]} 
              alt={`Avatar ${i + 1}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-medium">
              {String.fromCharCode(65 + i)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// TICKER BAR
// ============================================

interface TickerBarProps {
  items: string[];
  separator?: string;
  speed?: number;  // Duration in seconds
  className?: string;
  style?: React.CSSProperties;
}

export function TickerBar({ 
  items, 
  separator = '  •  ',
  speed = 30,
  className,
  style 
}: TickerBarProps) {
  const content = items.join(separator);
  
  return (
    <div 
      className={cn(
        "overflow-hidden whitespace-nowrap py-3 bg-black/20 backdrop-blur-sm",
        className
      )} 
      style={style}
    >
      <div 
        className="inline-block animate-scroll-left"
        style={{ 
          animationDuration: `${speed}s`,
        }}
      >
        <span className="uppercase tracking-widest text-sm font-medium opacity-90">
          {content}{separator}{content}
        </span>
      </div>
    </div>
  );
}

// ============================================
// BADGE
// ============================================

interface BadgeProps {
  content: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ 
  content, 
  icon,
  variant = 'default',
  size = 'md',
  className,
  style 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-white/10 text-white border-white/20',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    premium: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )} 
      style={style}
    >
      {icon}
      {content}
    </span>
  );
}

// ============================================
// PROCESS STEP
// ============================================

interface ProcessStepProps {
  step: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  showArrow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ProcessStep({ 
  step,
  title, 
  description,
  icon,
  isActive = false,
  isCompleted = false,
  showArrow = true,
  className,
  style 
}: ProcessStepProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} style={style}>
      <div className="flex flex-col items-center text-center flex-1">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2",
          isCompleted && "bg-green-500 text-white",
          isActive && !isCompleted && "bg-purple-500 text-white",
          !isActive && !isCompleted && "bg-white/10 text-white/70"
        )}>
          {isCompleted ? <Check className="w-6 h-6" /> : icon || step}
        </div>
        <div className="font-semibold text-sm uppercase tracking-wide">
          {title}
        </div>
        {description && (
          <div className="text-xs opacity-60 mt-1">
            {description}
          </div>
        )}
      </div>
      {showArrow && (
        <ArrowRight className="w-5 h-5 opacity-30 flex-shrink-0" />
      )}
    </div>
  );
}

// ============================================
// VIDEO THUMBNAIL
// ============================================

interface VideoThumbnailProps {
  thumbnailUrl?: string;
  placeholder?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  playButtonSize?: 'sm' | 'md' | 'lg';
  overlayOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function VideoThumbnail({ 
  thumbnailUrl,
  placeholder = false,
  aspectRatio = '16:9',
  playButtonSize = 'lg',
  overlayOpacity = 0.3,
  className,
  style,
  onClick 
}: VideoThumbnailProps) {
  const aspectClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  };

  const playSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div 
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer group",
        aspectClasses[aspectRatio],
        className
      )} 
      style={style}
      onClick={onClick}
    >
      {/* Background */}
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt="Video thumbnail" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
          {placeholder && (
            <span className="text-white/30 text-sm">Video Thumbnail</span>
          )}
        </div>
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black transition-opacity group-hover:opacity-40"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "rounded-full bg-white/90 flex items-center justify-center transition-transform group-hover:scale-110",
          playSizes[playButtonSize]
        )}>
          <Play className="w-1/2 h-1/2 text-purple-600 fill-purple-600 ml-1" />
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-white/10 group-hover:ring-white/20 transition-all" />
    </div>
  );
}

// ============================================
// CREDIBILITY BAR
// ============================================

interface CredibilityBarProps {
  avatars?: string[];
  text: string;
  highlightedNames?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function CredibilityBar({ 
  avatars = [],
  text,
  highlightedNames = [],
  className,
  style 
}: CredibilityBarProps) {
  // Parse text and highlight names
  let displayText = text;
  highlightedNames.forEach(name => {
    displayText = displayText.replace(
      name, 
      `<strong class="text-white font-semibold">${name}</strong>`
    );
  });

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-4 py-4",
        className
      )} 
      style={style}
    >
      <AvatarGroup avatars={avatars} count={3} size="sm" />
      <span 
        className="text-sm text-white/70"
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  );
}

// ============================================
// STATS ROW
// ============================================

interface StatsRowProps {
  stats: Array<{
    value: number | string;
    suffix?: string;
    label: string;
  }>;
  className?: string;
  style?: React.CSSProperties;
}

export function StatsRow({ 
  stats,
  className,
  style 
}: StatsRowProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-8 md:gap-12 py-6",
        className
      )} 
      style={style}
    >
      {stats.map((stat, i) => (
        <StatNumber
          key={i}
          value={stat.value}
          suffix={stat.suffix || '+'}
          label={stat.label}
          size="lg"
        />
      ))}
    </div>
  );
}

// ============================================
// PROCESS FLOW
// ============================================

interface ProcessFlowProps {
  steps: Array<{
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  activeStep?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ProcessFlow({ 
  steps,
  activeStep = 0,
  className,
  style 
}: ProcessFlowProps) {
  return (
    <div 
      className={cn(
        "flex items-start justify-center gap-2 md:gap-4 py-6",
        className
      )} 
      style={style}
    >
      {steps.map((step, i) => (
        <ProcessStep
          key={i}
          step={i + 1}
          title={step.title}
          description={step.description}
          icon={step.icon}
          isActive={i === activeStep}
          isCompleted={i < activeStep}
          showArrow={i < steps.length - 1}
        />
      ))}
    </div>
  );
}

export default {
  GradientText,
  UnderlineText,
  StatNumber,
  AvatarGroup,
  TickerBar,
  Badge,
  ProcessStep,
  VideoThumbnail,
  CredibilityBar,
  StatsRow,
  ProcessFlow,
};
