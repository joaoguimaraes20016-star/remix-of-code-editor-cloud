import React, { useState, useEffect } from 'react';
import { TestimonialSliderContent } from '@/funnel-builder-v3/types/funnel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface TestimonialSliderBlockProps {
  content: TestimonialSliderContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function TestimonialSliderBlock({ content, blockId, stepId, isPreview }: TestimonialSliderBlockProps) {
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'testimonial-slider',
    hintText: 'Click to edit testimonial slider'
  });
  const { 
    testimonials = [],
    autoPlay = false,
    interval = 5,
  } = content;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval * 1000);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (testimonials.length === 0) {
    return wrapWithOverlay(
      <div className="aspect-[4/5] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
        <div className="text-center text-white/80 p-6">
          <p className="text-lg font-medium">Add a testimonial</p>
          <p className="text-sm opacity-70">Upload an image and add a quote</p>
        </div>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return wrapWithOverlay(
    <div className="relative aspect-[4/5] rounded-xl overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ 
          backgroundImage: currentTestimonial.backgroundImage 
            ? `url(${currentTestimonial.backgroundImage})` 
            : 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        {/* Quote */}
        <blockquote className="text-lg md:text-xl font-medium leading-relaxed mb-4 drop-shadow-lg">
          "{currentTestimonial.quote}"
        </blockquote>
        
        {/* Author */}
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold drop-shadow-md">{currentTestimonial.authorName}</p>
            {currentTestimonial.authorTitle && (
              <p className="text-sm text-white/80 drop-shadow-md">{currentTestimonial.authorTitle}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Arrows (show on hover if multiple testimonials) */}
      {testimonials.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}
      
      {/* Dots Navigation */}
      {testimonials.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-white w-4" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
