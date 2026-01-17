import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ImageCarouselProps {
  slides: Array<{
    id: string;
    src: string;
    alt?: string;
    caption?: string;
  }>;
  autoplay?: boolean;
  autoplayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  navigationStyle?: 'arrows' | 'dots' | 'both' | 'none';
  transitionEffect?: 'slide' | 'fade';
  loop?: boolean;
  aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1' | '21:9';
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  gap?: number;
  // NEW: Enhanced features
  arrowStyle?: 'default' | 'minimal' | 'rounded';
  arrowColor?: string;
  dotStyle?: 'dots' | 'lines' | 'numbers';
  dotColor?: string;
  dotActiveColor?: string;
  showCaptions?: boolean;
  captionPosition?: 'bottom' | 'overlay';
  onSlideChange?: (index: number) => void;
  onSlideClick?: (slide: ImageCarouselProps['slides'][0]) => void;
  isBuilder?: boolean;
  onSlidesChange?: (slides: ImageCarouselProps['slides']) => void;
  className?: string;
}

const aspectRatioClasses: Record<string, string> = {
  'auto': '',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  slides = [],
  autoplay = false,
  autoplayInterval = 4000,
  navigationStyle = 'both',
  transitionEffect = 'slide',
  loop = true,
  aspectRatio = '16:9',
  objectFit = 'cover',
  borderRadius = 12,
  gap = 0,
  arrowStyle = 'default',
  arrowColor,
  dotStyle = 'dots',
  dotColor,
  dotActiveColor,
  showCaptions = true,
  captionPosition = 'overlay',
  onSlideChange,
  onSlideClick,
  isBuilder = false,
  onSlidesChange,
  className,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // For fade effect, we don't use Embla - just manual index management
  const isFade = transitionEffect === 'fade';

  const autoplayPlugin = autoplay 
    ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop,
      align: 'start',
      skipSnaps: false,
      active: !isFade, // Disable embla for fade effect
    },
    isFade ? [] : autoplayPlugin
  );

  // Manual autoplay for fade effect
  useEffect(() => {
    if (!isFade || !autoplay || slides.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedIndex(prev => (prev + 1) % slides.length);
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [isFade, autoplay, autoplayInterval, slides.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Builder-only: Add slide
  const handleAddSlide = () => {
    if (!onSlidesChange) return;
    const newSlide = {
      id: `slide-${Date.now()}`,
      src: '',
      alt: `Slide ${slides.length + 1}`,
    };
    onSlidesChange([...slides, newSlide]);
  };

  // Builder-only: Remove slide
  const handleRemoveSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSlidesChange) return;
    onSlidesChange(slides.filter(s => s.id !== id));
  };

  const showArrows = navigationStyle === 'arrows' || navigationStyle === 'both';
  const showDots = navigationStyle === 'dots' || navigationStyle === 'both';

  // Empty state for builder
  if (slides.length === 0) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8',
          'bg-muted/30 border-muted-foreground/20',
          aspectRatioClasses[aspectRatio] || 'min-h-[200px]',
          className
        )}
        style={{ borderRadius }}
      >
        <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No slides added</p>
        {isBuilder && onSlidesChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddSlide}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </Button>
        )}
      </div>
    );
  }

  // Arrow styling
  const getArrowStyles = () => {
    const baseStyles: React.CSSProperties = {};
    if (arrowColor) {
      baseStyles.backgroundColor = arrowStyle === 'minimal' ? 'transparent' : arrowColor;
      baseStyles.color = arrowStyle === 'minimal' ? arrowColor : 'white';
    }
    return baseStyles;
  };

  // Dot styling
  const getDotStyles = (isActive: boolean): React.CSSProperties => {
    return {
      backgroundColor: isActive 
        ? (dotActiveColor || 'white') 
        : (dotColor || 'rgba(255,255,255,0.5)'),
    };
  };

  // Scroll functions for fade mode
  const scrollPrevFade = () => setSelectedIndex(prev => prev === 0 ? slides.length - 1 : prev - 1);
  const scrollNextFade = () => setSelectedIndex(prev => (prev + 1) % slides.length);

  return (
    <div className={cn('relative group', className)}>
      {/* Carousel viewport */}
      <div 
        className={cn('overflow-hidden', aspectRatioClasses[aspectRatio])}
        style={{ borderRadius }}
        ref={isFade ? undefined : emblaRef}
      >
        {/* Fade mode: absolute positioned slides */}
        {isFade ? (
          <div className="relative w-full h-full">
            {slides.map((slide, index) => (
              <div 
                key={slide.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-500',
                  index === selectedIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                )}
                onClick={() => onSlideClick?.(slide)}
              >
                {slide.src ? (
                  <img
                    src={slide.src}
                    alt={slide.alt || `Slide ${index + 1}`}
                    className={cn(
                      'w-full h-full',
                      objectFit === 'cover' && 'object-cover',
                      objectFit === 'contain' && 'object-contain',
                      objectFit === 'fill' && 'object-fill'
                    )}
                    style={{ borderRadius }}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center bg-muted/50"
                    style={{ borderRadius, minHeight: 200 }}
                  >
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Caption */}
                {showCaptions && slide.caption && (
                  <div className={cn(
                    'absolute left-0 right-0 p-4',
                    captionPosition === 'overlay' 
                      ? 'bottom-0 bg-gradient-to-t from-black/60 to-transparent'
                      : 'bottom-0 bg-black/80'
                  )}>
                    <p className="text-white text-sm">{slide.caption}</p>
                  </div>
                )}

                {/* Builder: Remove button */}
                {isBuilder && onSlidesChange && (
                  <button
                    onClick={(e) => handleRemoveSlide(slide.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Slide mode: Embla carousel */
          <div className="flex" style={{ gap }}>
            {slides.map((slide, index) => (
              <div 
                key={slide.id}
                className="flex-[0_0_100%] min-w-0 relative"
                onClick={() => onSlideClick?.(slide)}
              >
                {slide.src ? (
                  <img
                    src={slide.src}
                    alt={slide.alt || `Slide ${index + 1}`}
                    className={cn(
                      'w-full h-full',
                      objectFit === 'cover' && 'object-cover',
                      objectFit === 'contain' && 'object-contain',
                      objectFit === 'fill' && 'object-fill'
                    )}
                    style={{ borderRadius }}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center bg-muted/50"
                    style={{ borderRadius, minHeight: 200 }}
                  >
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Caption */}
                {showCaptions && slide.caption && (
                  <div className={cn(
                    'absolute left-0 right-0 p-4',
                    captionPosition === 'overlay' 
                      ? 'bottom-0 bg-gradient-to-t from-black/60 to-transparent'
                      : 'bottom-0 bg-black/80'
                  )}>
                    <p className="text-white text-sm">{slide.caption}</p>
                  </div>
                )}

                {/* Builder: Remove button */}
                {isBuilder && onSlidesChange && (
                  <button
                    onClick={(e) => handleRemoveSlide(slide.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={isFade ? scrollPrevFade : scrollPrev}
            disabled={!loop && !canScrollPrev && !isFade}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-20',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:scale-110',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
              arrowStyle === 'minimal' && 'bg-transparent',
              arrowStyle === 'default' && 'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white',
              arrowStyle === 'rounded' && 'w-10 h-10 rounded-full bg-white/90 text-black shadow-lg'
            )}
            style={getArrowStyles()}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={isFade ? scrollNextFade : scrollNext}
            disabled={!loop && !canScrollNext && !isFade}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-20',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:scale-110',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
              arrowStyle === 'minimal' && 'bg-transparent',
              arrowStyle === 'default' && 'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white',
              arrowStyle === 'rounded' && 'w-10 h-10 rounded-full bg-white/90 text-black shadow-lg'
            )}
            style={getArrowStyles()}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => isFade ? setSelectedIndex(index) : scrollTo(index)}
              className={cn(
                'transition-all duration-200',
                dotStyle === 'dots' && cn(
                  'rounded-full',
                  index === selectedIndex ? 'w-6 h-2' : 'w-2 h-2'
                ),
                dotStyle === 'lines' && cn(
                  'h-1 rounded-sm',
                  index === selectedIndex ? 'w-8' : 'w-4'
                ),
                dotStyle === 'numbers' && cn(
                  'w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center',
                  index === selectedIndex ? 'text-black' : 'text-white'
                )
              )}
              style={getDotStyles(index === selectedIndex)}
            >
              {dotStyle === 'numbers' && index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Builder: Add slide button */}
      {isBuilder && onSlidesChange && (
        <button
          onClick={handleAddSlide}
          className={cn(
            'absolute bottom-4 right-4 z-10',
            'w-8 h-8 rounded-full bg-primary text-primary-foreground',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:scale-110'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ImageCarousel;
