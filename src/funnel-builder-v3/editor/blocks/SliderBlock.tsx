import React, { useCallback, useEffect, useState } from 'react';
import { SliderContent } from '@/types/funnel';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SliderBlockProps {
  content: SliderContent;
}

export function SliderBlock({ content }: SliderBlockProps) {
  const { images, autoplay, interval = 5, showDots = true, showArrows = true } = content;
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  // Track selected slide
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Autoplay functionality - interval is in seconds
  useEffect(() => {
    if (!emblaApi || !autoplay) return;

    const autoplayInterval = setInterval(() => {
      emblaApi.scrollNext();
    }, interval * 1000); // Convert seconds to milliseconds

    return () => clearInterval(autoplayInterval);
  }, [emblaApi, autoplay, interval]);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No images added
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((image) => (
            <div key={image.id} className="flex-[0_0_100%] min-w-0">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full aspect-video object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && showArrows && (
        <>
          <button
            onClick={scrollPrev}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full',
              'bg-background/80 backdrop-blur-sm border border-border',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-background'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full',
              'bg-background/80 backdrop-blur-sm border border-border',
              'flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-background'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && showDots && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all backdrop-blur-sm",
                index === selectedIndex 
                  ? "bg-background w-4" 
                  : "bg-background/60 hover:bg-background/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
