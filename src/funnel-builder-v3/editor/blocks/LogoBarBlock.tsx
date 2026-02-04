import React, { useCallback, useMemo, useState } from 'react';
import { LogoBarContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

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
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'logo-bar',
    hintText: 'Click to edit logo bar'
  });

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
  // Safety check: ensure logos is an array before filtering
  const validLogos = useMemo(() => {
    if (!Array.isArray(logos)) return [];
    return logos.filter(logo => logo && logo.src);
  }, [logos]);

  // State for hover pause functionality - MUST be before any conditional returns (React Rules of Hooks)
  const [isHovered, setIsHovered] = useState(false);

  // Calculate repeat count to ensure viewport is always filled with logos
  // Each logo is ~130-180px wide depending on screen, need at least 8 slots for continuous scroll on larger screens
  const repeatCount = useMemo(() => {
    const logoCount = validLogos.length;
    if (logoCount === 0) return 1;
    const minSlots = 8; // Minimum logo slots to fill viewport continuously (increased for tablet/desktop)
    return Math.ceil(minSlots / logoCount);
  }, [validLogos.length]);

  // Animation duration based on speed only (for seamless infinite loop)
  // The animation always moves 50% (one set width), so duration should be consistent
  const animationDuration = useMemo(() => {
    // Fixed durations for smooth infinite scrolling
    // The keyframes move 50% regardless of logo count, so duration is speed-based only
    return speed === 'slow' ? '60s' : speed === 'fast' ? '15s' : '30s';
  }, [speed]);

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
          <span style={titleStyles?.color ? { color: titleStyles.color } : undefined}>{title}</span>
        )}
      </div>
    );
  };

  // Create duplicated logos array for seamless infinite loop
  // Logos are repeated based on repeatCount, then duplicated for seamless animation
  // Uses stable identifiers for React keys to prevent console errors when logos are deleted
  const duplicatedLogos = useMemo(() => {
    // Safety check: return empty array if no valid logos
    if (!validLogos || validLogos.length === 0) {
      return [];
    }

    // First, repeat logos to fill viewport
    const repeated: Array<{ src: string; alt: string; key: string }> = [];
    for (let r = 0; r < repeatCount; r++) {
      validLogos.forEach((logo, idx) => {
        // Safety check: ensure logo exists and has required properties
        if (!logo) return;
        
        // Use logo.id if available (most stable - doesn't change)
        // Otherwise use logo.src (should be unique per logo and stable)
        // Fallback to index only as last resort (but this shouldn't happen)
        const identifier = logo.id || logo.src || `logo-${idx}`;
        // Sanitize to remove special characters that could cause key issues
        const sanitizedId = String(identifier).replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 50);
        repeated.push({ 
          src: logo.src || '', 
          alt: logo.alt || 'Company logo', 
          key: `r${r}-${sanitizedId}` 
        });
      });
    }
    // Duplicate the entire set for seamless loop (animation moves -50%)
    return [...repeated, ...repeated.map(l => ({ ...l, key: `dup-${l.key}` }))];
  }, [validLogos, repeatCount]);

  // Stable animation key - only changes when logos, direction, or speed change
  // This ensures animation only restarts when content/config actually changes
  // MUST be before any conditional returns (React Rules of Hooks)
  const animationKey = useMemo(() => {
    if (!validLogos || validLogos.length === 0) {
      return `marquee-empty-${direction}-${speed}`;
    }
    return `marquee-${validLogos.map(l => l?.src || '').filter(Boolean).join('-')}-${direction}-${speed}`;
  }, [validLogos, direction, speed]);

  // Static (non-animated) version - used for 3 or fewer logos, or when animation is disabled
  if (!shouldAnimate) {
    // Show empty state if no valid logos
    if (validLogos.length === 0) {
      return wrapWithOverlay(
        <div className="w-full max-w-full overflow-x-hidden py-2">
          {renderTitle()}
          <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 text-muted-foreground text-sm sm:text-base">
            {canEdit ? 'Add logos in the inspector' : 'No logos to display'}
          </div>
        </div>
      );
    }
    
    return wrapWithOverlay(
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
    return wrapWithOverlay(
      <div className="w-full max-w-full overflow-x-hidden py-2">
        {renderTitle()}
        <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 text-muted-foreground text-sm sm:text-base">
          {canEdit ? 'Add logos in the inspector' : 'No logos to display'}
        </div>
      </div>
    );
  }

  // Animated marquee version
  // Safety check: if no duplicated logos, show empty state
  if (!duplicatedLogos || duplicatedLogos.length === 0) {
    return wrapWithOverlay(
      <div className="w-full max-w-full overflow-hidden py-2">
        {renderTitle()}
        <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 text-muted-foreground text-sm sm:text-base">
          {canEdit ? 'Add logos in the inspector' : 'No logos to display'}
        </div>
      </div>
    );
  }

  return wrapWithOverlay(
    <div className="w-full max-w-full overflow-hidden py-2">
      {renderTitle()}
      {/* Wrapper - relative positioning, clips content, fixed height */}
      <div 
        className="relative w-full overflow-hidden h-16 sm:h-20 lg:h-24"
        onMouseEnter={() => pauseOnHover && setIsHovered(true)}
        onMouseLeave={() => pauseOnHover && setIsHovered(false)}
        style={{
          // CSS mask for subtle edge fading
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      >
        {/* Animation track - absolute positioned, removed from document flow */}
        <div
          key={animationKey}
          className="absolute top-0 left-0 h-full flex items-center"
          style={{
            gap: '2rem',
            animation: `${direction === 'right' ? 'marquee-right' : 'marquee-left'} ${animationDuration} linear infinite`,
            animationPlayState: isHovered ? 'paused' : 'running',
            willChange: 'transform',
          }}
        >
          {/* Render all duplicated logos */}
          {duplicatedLogos.map((logo) => {
            // Safety check: ensure logo exists before rendering
            if (!logo || !logo.src) return null;
            return (
              <img
                key={logo.key}
                src={logo.src}
                alt={logo.alt || 'Company logo'}
                className={cn(
                  "h-8 sm:h-10 lg:h-12 max-h-10 sm:max-h-12 lg:max-h-14 object-contain",
                  grayscale
                    ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                    : "opacity-80 hover:opacity-100 transition-opacity duration-300"
                )}
                style={{
                  // Override .canvas-content img { width: 100%; max-width: 100% } rules
                  width: 'auto',
                  maxWidth: 'none',
                  flexShrink: 0,
                }}
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Prevent broken images from causing crashes
                  e.currentTarget.style.display = 'none';
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
