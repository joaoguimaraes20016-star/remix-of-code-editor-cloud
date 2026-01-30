import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LogoBarContent, TextStyles } from '@/types/funnel';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

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

  /**
   * Animated marquee:
   * Tailwind keyframes translate from 0 -> -50%, which assumes the track is two identical halves.
   * To avoid any “dead space” on wide viewports, we first create a *segment* that is wide enough
   * to cover the container (by repeating the logo set), then duplicate that segment twice.
   */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [segmentRepeats, setSegmentRepeats] = useState(1);

  const maskGradient = useMemo(() => {
    // Mask uses alpha; use HSL to stay consistent with token rules.
    const opaque = 'hsl(0 0% 0%)';
    return `linear-gradient(to right, transparent 0%, ${opaque} 8%, ${opaque} 92%, transparent 100%)`;
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const measureEl = measureRef.current;
    if (!el || !measureEl) return;

    const computeRepeats = () => {
      const containerWidth = el.clientWidth;
      const baseWidth = measureEl.scrollWidth;
      if (!containerWidth || !baseWidth) return;

      // Ensure the segment is at least as wide as the container.
      const repeats = Math.max(1, Math.ceil(containerWidth / baseWidth));
      setSegmentRepeats(repeats);
    };

    computeRepeats();

    const ro = new ResizeObserver(() => computeRepeats());
    ro.observe(el);
    ro.observe(measureEl);

    return () => ro.disconnect();
  }, [logos.length]);

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

  // Animated marquee version - segment x2 (two identical halves) for seamless loop
  return (
    <div className="space-y-4 w-full overflow-hidden box-border">
      {renderTitle()}
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full box-border",
          pauseOnHover && "[&:hover_.marquee-track]:pause"
        )}
        style={{ 
          overflow: 'hidden',
          maskImage: maskGradient,
          WebkitMaskImage: maskGradient,
        }}
      >
        {/* Hidden measurement: one base logo set width */}
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none absolute -z-10 h-0 overflow-hidden opacity-0"
        >
          <div className="inline-flex items-center gap-8 whitespace-nowrap">
            {renderLogoSet('measure')}
          </div>
        </div>

        {/* Marquee track - two identical halves (segment A + segment B) */}
        <div 
          className={cn(
            "flex items-center gap-8 will-change-transform marquee-track",
            speedClasses[speed],
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{ 
            display: 'inline-flex',
            whiteSpace: 'nowrap',
          }}
        >
          {renderSegment('a')}
          {renderSegment('b')}
        </div>
      </div>
    </div>
  );
}
