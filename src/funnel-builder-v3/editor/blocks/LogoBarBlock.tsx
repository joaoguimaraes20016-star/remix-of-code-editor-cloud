import React, { useCallback, useMemo } from 'react';
import { LogoBarContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';

interface LogoBarBlockProps {
  content: LogoBarContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function LogoBarBlock({ content, blockId, stepId, isPreview }: LogoBarBlockProps) {
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const { 
    title, 
    titleStyles,
    logos, 
    animated = false, 
    speed = 'medium', 
    direction = 'left', 
    pauseOnHover = true,
    grayscale = true 
  } = content;

  const canEdit = blockId && stepId && !isPreview;

  const handleTitleChange = useCallback((newTitle: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { title: newTitle });
    }
  }, [blockId, stepId, updateBlockContent]);

  const handleTitleStyleChange = useCallback((updates: Partial<TextStyles>) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { 
        titleStyles: { ...titleStyles, ...updates } 
      });
    }
  }, [blockId, stepId, titleStyles, updateBlockContent]);

  // Filter out logos with empty src
  const validLogos = useMemo(() => logos.filter(logo => logo.src), [logos]);

  // Calculate repeat count to ensure viewport is always filled with logos
  // Each logo is ~130-180px wide depending on screen, need at least 8 slots for continuous scroll on larger screens
  const repeatCount = useMemo(() => {
    const logoCount = validLogos.length;
    if (logoCount === 0) return 1;
    const minSlots = 8; // Minimum logo slots to fill viewport continuously (increased for tablet/desktop)
    return Math.ceil(minSlots / logoCount);
  }, [validLogos.length]);

  // Animation duration based on speed AND total logo count (including repeats)
  const animationDuration = useMemo(() => {
    const totalLogos = (validLogos.length * repeatCount) || 1;
    const baseTimePerLogo = speed === 'slow' ? 3 : speed === 'fast' ? 1 : 2; // seconds per logo
    const totalTime = totalLogos * baseTimePerLogo;
    return `${totalTime}s`;
  }, [speed, validLogos.length, repeatCount]);

  // Determine if we should animate:
  // - If user explicitly enabled animation, always animate
  // - If 4+ logos, auto-enable animation to prevent overflow on mobile
  // - Otherwise stay static (3 or fewer logos fit nicely centered)
  const shouldAnimate = useMemo(() => {
    if (animated) return true; // User explicitly enabled
    if (validLogos.length >= 4) return true; // Auto-enable for 4+ logos
    return false; // Static for 3 or fewer
  }, [animated, validLogos.length]);


  const renderTitle = () => {
    if (!title && !canEdit) return null;
    
    const hasCustomTextStyle = titleStyles?.textGradient || titleStyles?.color;
    
    return (
      <div className={cn(
        "text-xs sm:text-sm lg:text-base text-center uppercase tracking-wider mb-4 sm:mb-6",
        !hasCustomTextStyle && "text-muted-foreground"
      )}>
        {canEdit ? (
          <EditableText
            value={title || ''}
            onChange={handleTitleChange}
            as="p"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={titleStyles || {}}
            onStyleChange={handleTitleStyleChange}
            placeholder="Add title..."
          />
        ) : (
          title
        )}
      </div>
    );
  };

  // Render a complete logo set (used twice for seamless loop)
  // Logos are repeated based on repeatCount to ensure continuous scrolling
  const renderLogoSet = useCallback((setId: string) => {
    // Create an array of repeated logos to fill the viewport
    const repeatedLogos: Array<{ src: string; alt: string; key: string }> = [];
    for (let r = 0; r < repeatCount; r++) {
      validLogos.forEach((logo, idx) => {
        repeatedLogos.push({ 
          src: logo.src, 
          alt: logo.alt || 'Company logo', 
          key: `${setId}-${r}-${idx}` 
        });
      });
    }

    return (
      <div className="flex items-center shrink-0 h-full gap-0">
        {repeatedLogos.map((logo) => (
          <div key={logo.key} className="flex-shrink-0 px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <img
              src={logo.src}
              alt={logo.alt}
              className={cn(
                "h-8 sm:h-10 lg:h-12 max-h-10 sm:max-h-12 lg:max-h-14 w-auto max-w-[100px] sm:max-w-[140px] lg:max-w-[180px] object-contain",
                grayscale
                  ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                  : "opacity-80 hover:opacity-100 transition-opacity duration-300"
              )}
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>
    );
  }, [validLogos, grayscale, repeatCount]);

  // Static (non-animated) version - used for 3 or fewer logos, or when animation is disabled
  if (!shouldAnimate) {
    // Show empty state if no valid logos
    if (validLogos.length === 0) {
      return (
        <div className="w-full max-w-full overflow-x-hidden py-2">
          {renderTitle()}
          <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 text-muted-foreground text-sm sm:text-base">
            {canEdit ? 'Add logos in the inspector' : 'No logos to display'}
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full max-w-full overflow-x-hidden py-2">
        {renderTitle()}
        <div className="flex items-center justify-center gap-6 sm:gap-8 lg:gap-12 flex-wrap h-16 sm:h-20 lg:h-24">
          {validLogos.map((logo, idx) => (
            <div key={`static-${idx}`} className="h-full flex items-center">
              <img
                src={logo.src}
                alt={logo.alt || 'Company logo'}
                className={cn(
                  "h-8 sm:h-10 lg:h-12 max-h-10 sm:max-h-12 lg:max-h-14 w-auto max-w-[100px] sm:max-w-[140px] lg:max-w-[180px] object-contain flex-shrink-0",
                  grayscale
                    ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                    : "opacity-80 hover:opacity-100 transition-opacity duration-300"
                )}
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state - check validLogos instead of logos
  if (!validLogos || validLogos.length === 0) {
    return (
      <div className="w-full max-w-full overflow-x-hidden py-2">
        {renderTitle()}
        <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 text-muted-foreground text-sm sm:text-base">
          {canEdit ? 'Add logos in the inspector' : 'No logos to display'}
        </div>
      </div>
    );
  }

  // Animated marquee version
  return (
    <div className="w-full max-w-full overflow-x-hidden py-2">
      {renderTitle()}
      {/* Wrapper - clips content, fixed height, relative for absolute child, edge fade */}
      <div 
        className="relative w-full overflow-hidden h-16 sm:h-20 lg:h-24"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        {/* Content - absolutely positioned, animates, contains two identical sets */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center h-full",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{
            animation: `${direction === 'right' ? 'marquee-right' : 'marquee-left'} ${animationDuration} linear infinite`,
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Logo Set 1 */}
          {renderLogoSet('set1')}
          {/* Logo Set 2 - DUPLICATE for seamless loop */}
          {renderLogoSet('set2')}
        </div>
      </div>
    </div>
  );
}
