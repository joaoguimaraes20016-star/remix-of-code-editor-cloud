import React from 'react';
import { ReviewsContent } from '@/funnel-builder-v3/types/funnel';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface ReviewsBlockProps {
  content: ReviewsContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function ReviewsBlock({ content, blockId, stepId, isPreview }: ReviewsBlockProps) {
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'reviews',
    hintText: 'Click to edit reviews'
  });
  const { 
    avatars = [],
    rating = 4.8,
    reviewCount = '200+',
    starColor = '#facc15',
    textColor,
  } = content;

  // Render star rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            className="h-5 w-5" 
            style={{ fill: starColor, color: starColor }} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-5 w-5">
            <Star 
              className="absolute h-5 w-5" 
              style={{ fill: 'transparent', color: `${starColor}40` }} 
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star 
                className="h-5 w-5" 
                style={{ fill: starColor, color: starColor }} 
              />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className="h-5 w-5" 
            style={{ fill: 'transparent', color: `${starColor}40` }} 
          />
        );
      }
    }
    return stars;
  };

  return wrapWithOverlay(
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Overlapping Avatars */}
      {avatars.length > 0 && (
        <div className="flex -space-x-3">
          {avatars.slice(0, 5).map((avatar, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted"
              style={{ zIndex: avatars.length - index }}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={`Reviewer ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Star Rating */}
      <div className="flex gap-0.5">
        {renderStars()}
      </div>
      
      {/* Rating Text */}
      <p 
        className="text-sm font-medium"
        style={{ color: textColor || undefined }}
      >
        <span className="font-bold">{rating}</span>
        {' '}from {reviewCount} reviews
      </p>
    </div>
  );
}
