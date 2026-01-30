import React, { useCallback } from 'react';
import { ReviewsContent, TextStyles } from '@/types/funnel';
import { Star, StarHalf, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/context/FunnelContext';
import { EditableText } from '@/components/editor/EditableText';

interface ReviewsBlockProps {
  content: ReviewsContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

// Renders a star that can be full, half, or empty
function StarRating({ 
  rating, 
  starColor = '#facc15' 
}: { 
  rating: number; 
  starColor?: string;
}) {
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Full star
      stars.push(
        <Star
          key={i}
          className="h-4 w-4"
          style={{ fill: starColor, color: starColor }}
        />
      );
    } else if (rating >= i - 0.5) {
      // Half star - use a custom approach with clipping
      stars.push(
        <div key={i} className="relative h-4 w-4">
          {/* Empty star background */}
          <Star
            className="absolute h-4 w-4"
            style={{ 
              fill: 'transparent', 
              color: 'hsl(var(--muted-foreground) / 0.3)' 
            }}
          />
          {/* Half-filled overlay using clip-path */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ width: '50%' }}
          >
            <Star
              className="h-4 w-4"
              style={{ fill: starColor, color: starColor }}
            />
          </div>
        </div>
      );
    } else {
      // Empty star
      stars.push(
        <Star
          key={i}
          className="h-4 w-4"
          style={{ 
            fill: 'transparent', 
            color: 'hsl(var(--muted-foreground) / 0.3)' 
          }}
        />
      );
    }
  }
  
  return <div className="flex gap-0.5">{stars}</div>;
}

// Avatar component with fallback
function ReviewAvatar({ 
  src, 
  author 
}: { 
  src?: string; 
  author: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={author}
        className="h-8 w-8 rounded-full object-cover border-2 border-background shadow-sm"
      />
    );
  }
  
  // Fallback to initials/icon
  return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background shadow-sm">
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function ReviewsBlock({ content, blockId, stepId, isPreview }: ReviewsBlockProps) {
  const { updateBlockContent } = useFunnel();
  const { 
    reviews = [],
    cardStyle = 'outline',
    reviewTextColor,
    authorColor,
    starColor,
    showAvatars = true,
  } = content;

  const canEdit = blockId && stepId && !isPreview;

  const handleReviewTextChange = useCallback((reviewId: string, newText: string) => {
    if (blockId && stepId) {
      const updatedReviews = reviews.map(review =>
        review.id === reviewId ? { ...review, text: newText } : review
      );
      updateBlockContent(stepId, blockId, { reviews: updatedReviews });
    }
  }, [blockId, stepId, reviews, updateBlockContent]);

  const handleAuthorChange = useCallback((reviewId: string, newAuthor: string) => {
    if (blockId && stepId) {
      const updatedReviews = reviews.map(review =>
        review.id === reviewId ? { ...review, author: newAuthor } : review
      );
      updateBlockContent(stepId, blockId, { reviews: updatedReviews });
    }
  }, [blockId, stepId, reviews, updateBlockContent]);

  // Build card classes based on style
  const getCardClasses = () => {
    const baseClasses = 'rounded-lg p-4';
    
    if (cardStyle === 'filled') {
      return cn(baseClasses, 'bg-muted');
    }
    return cn(baseClasses, 'bg-card border border-border');
  };

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div
          key={review.id}
          className={getCardClasses()}
        >
          {/* Star Rating */}
          <StarRating rating={review.rating} starColor={starColor} />
          
          {/* Review Text */}
          <div 
            className="text-sm text-foreground mt-2 mb-2"
            style={{ color: reviewTextColor || undefined }}
          >
            {canEdit ? (
              <>
                "
                <EditableText
                  value={review.text}
                  onChange={(newText) => handleReviewTextChange(review.id, newText)}
                  as="span"
                  isPreview={isPreview}
                  showToolbar={true}
                  richText={true}
                  styles={{}}
                  onStyleChange={() => {}}
                />
                "
              </>
            ) : (
              `"${review.text}"`
            )}
          </div>
          
          {/* Author with Avatar */}
          <div className="flex items-center gap-2">
            {showAvatars && (
              <ReviewAvatar src={review.avatar} author={review.author} />
            )}
            <div 
              className="text-xs font-medium"
              style={{ color: authorColor || 'hsl(var(--muted-foreground))' }}
            >
              {canEdit ? (
                <>
                  — 
                  <EditableText
                    value={review.author}
                    onChange={(newAuthor) => handleAuthorChange(review.id, newAuthor)}
                    as="span"
                    isPreview={isPreview}
                    showToolbar={true}
                    richText={true}
                    styles={{}}
                    onStyleChange={() => {}}
                  />
                </>
              ) : (
                `— ${review.author}`
              )}
            </div>
          </div>
        </div>
      ))}
      
      {reviews.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No reviews yet
        </div>
      )}
    </div>
  );
}
