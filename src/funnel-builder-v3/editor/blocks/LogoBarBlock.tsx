import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LogoBarContent, TextStyles } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';

interface LogoBarBlockProps {
  content: LogoBarContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function LogoBarBlock({ content, blockId, stepId, isPreview }: LogoBarBlockProps) {
  const { updateBlockContent } = useFunnel();
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

  // Speed to animation class mapping
  const speedClasses = {
    slow: direction === 'left' ? 'animate-marquee-slow' : 'animate-marquee-slow-right',
    medium: direction === 'left' ? 'animate-marquee-medium' : 'animate-marquee-medium-right',
    fast: direction === 'left' ? 'animate-marquee-fast' : 'animate-marquee-fast-right',
  };

  /**
   * Animated marquee state - must be called unconditionally (Rules of Hooks)
   */
  const [segmentRepeats, setSegmentRepeats] = useState(1);

  const maskGradient = useMemo(() => {
    // Mask uses alpha; use HSL to stay consistent with token rules.
    const opaque = 'hsl(0 0% 0%)';
    return `linear-gradient(to right, transparent 0%, ${opaque} 8%, ${opaque} 92%, transparent 100%)`;
  }, []);

  useLayoutEffect(() => {
    if (!animated) {
      setSegmentRepeats(1); // Reset when not animated
      return;
    }
    
    // For animated marquee, we need enough logos to fill the screen + extra for seamless loop
    // Use a fixed multiplier based on typical screen sizes
    // Each segment will be duplicated twice (segment A + segment B) in the render
    const repeatsNeeded = Math.max(3, Math.ceil(logos.length * 0.5));
    setSegmentRepeats(repeatsNeeded);
  }, [animated, logos.length]);

  const renderLogoSet = useCallback((suffix: string) => {
    return logos.map((logo) => (
      <img
        key={`${logo.id}-${suffix}`}
        src={logo.src}
        alt={logo.alt}
        className={cn(
          'h-6 w-auto max-w-[48px] object-contain shrink-0 transition-all duration-300',
          grayscale
            ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            : 'opacity-70 hover:opacity-100'
        )}
      />
    ));
  }, [logos, grayscale]);

  const renderSegment = useCallback((segmentId: string) => {
    return Array.from({ length: segmentRepeats }, (_, i) => (
      <React.Fragment key={`${segmentId}-set-${i}`}>
        {renderLogoSet(`${segmentId}-${i}`)}
      </React.Fragment>
    ));
  }, [renderLogoSet, segmentRepeats]);

  const renderTitle = () => {
    if (!title && !canEdit) return null;
    
    // Only apply text-muted-foreground if no gradient or custom color in titleStyles
    const hasCustomTextStyle = titleStyles?.textGradient || titleStyles?.color;
    
    return (
      <div className={cn(
        "text-xs text-center uppercase tracking-wider",
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

  // Static (non-animated) version
  if (!animated) {
    return (
      <div className="space-y-4 w-full overflow-hidden box-border">
        {renderTitle()}
        <div className="flex items-center justify-evenly gap-4 flex-wrap w-full">
          {logos.map((logo) => (
            <img
              key={logo.id}
              src={logo.src}
              alt={logo.alt}
              className={cn(
                "h-6 w-auto max-w-[48px] object-contain transition-all flex-shrink-0",
                grayscale 
                  ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0" 
                  : "opacity-80 hover:opacity-100"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Animated marquee version - segment x2 (two identical halves) for seamless loop
  return (
    <div className="space-y-4 w-full">
      {renderTitle()}
      <div 
        className="relative w-full overflow-hidden"
        style={{ 
          maskImage: maskGradient,
          WebkitMaskImage: maskGradient,
        }}
      >
        {/* Marquee track - two identical halves (segment A + segment B) for seamless loop */}
        <div 
          className={cn(
            "flex items-center gap-8 will-change-transform marquee-track",
            speedClasses[speed] || 'animate-marquee-medium',
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{ 
            whiteSpace: 'nowrap',
            width: 'max-content',
          }}
        >
          {renderSegment('a')}
          {renderSegment('b')}
        </div>
      </div>
    </div>
  );
}
