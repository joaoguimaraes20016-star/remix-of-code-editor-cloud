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
  onSlideChange,
  onSlideClick,
  isBuilder = false,
  onSlidesChange,
  className,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const autoplayPlugin = autoplay 
    ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: true })]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop,
      align: 'start',
      skipSnaps: false,
    },
    autoplayPlugin
  );

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

  return (
    <div className={cn('relative group', className)}>
      {/* Carousel viewport */}
      <div 
        className={cn('overflow-hidden', aspectRatioClasses[aspectRatio])}
        style={{ borderRadius }}
        ref={emblaRef}
      >
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
                    objectFit === 'fill' && 'object-fill',
                    transitionEffect === 'fade' && 'transition-opacity duration-500'
                  )}
                  style={{ borderRadius }}
                />
              ) : (
                <div 
                  className={cn(
                    'w-full h-full flex items-center justify-center',
                    'bg-muted/50'
                  )}
                  style={{ borderRadius, minHeight: 200 }}
                >
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              
              {/* Caption */}
              {slide.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
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
      </div>

      {/* Navigation arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!loop && !canScrollPrev}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm',
              'flex items-center justify-center text-white',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:bg-black/60 hover:scale-110',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!loop && !canScrollNext}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm',
              'flex items-center justify-center text-white',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:bg-black/60 hover:scale-110',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === selectedIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/75'
              )}
            />
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
