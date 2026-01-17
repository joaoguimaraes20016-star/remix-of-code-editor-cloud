import React from 'react';
import { cn } from '@/lib/utils';
import { Star, ExternalLink } from 'lucide-react';

export interface TrustpilotWidgetProps {
  businessId?: string;
  rating?: number; // 1-5, manual input
  reviewCount?: number;
  businessName?: string;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showLogo?: boolean;
  showReviewCount?: boolean;
  linkUrl?: string;
  className?: string;
  isBuilder?: boolean;
}

const StarRating: React.FC<{ rating: number; size?: number }> = ({ 
  rating, 
  size = 20 
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <div 
          key={`full-${i}`}
          className="bg-[#00b67a] p-0.5"
          style={{ width: size, height: size }}
        >
          <Star 
            className="w-full h-full text-white fill-white" 
          />
        </div>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div 
          className="relative bg-[#dcdce6] p-0.5 overflow-hidden"
          style={{ width: size, height: size }}
        >
          <div 
            className="absolute inset-0 bg-[#00b67a] p-0.5"
            style={{ width: '50%' }}
          >
            <Star className="w-full h-full text-white fill-white" />
          </div>
          <Star className="w-full h-full text-[#dcdce6] fill-[#dcdce6] relative" />
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <div 
          key={`empty-${i}`}
          className="bg-[#dcdce6] p-0.5"
          style={{ width: size, height: size }}
        >
          <Star className="w-full h-full text-[#dcdce6] fill-[#dcdce6]" />
        </div>
      ))}
    </div>
  );
};

export const TrustpilotWidget: React.FC<TrustpilotWidgetProps> = ({
  businessId,
  rating = 4.5,
  reviewCount = 1234,
  businessName,
  layout = 'horizontal',
  showLogo = true,
  showReviewCount = true,
  linkUrl,
  className,
  isBuilder = false,
}) => {
  const trustpilotUrl = linkUrl || (businessId 
    ? `https://www.trustpilot.com/review/${businessId}`
    : 'https://www.trustpilot.com'
  );

  const ratingText = rating.toFixed(1);
  const reviewText = reviewCount >= 1000 
    ? `${(reviewCount / 1000).toFixed(1)}k reviews`
    : `${reviewCount} reviews`;

  // Compact layout
  if (layout === 'compact') {
    return (
      <a
        href={isBuilder ? undefined : trustpilotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-background border border-border hover:border-muted-foreground/40',
          'transition-colors cursor-pointer',
          className
        )}
        onClick={(e) => isBuilder && e.preventDefault()}
      >
        <StarRating rating={rating} size={16} />
        <span className="text-sm font-medium text-foreground">
          {ratingText}
        </span>
        {showReviewCount && (
          <span className="text-xs text-muted-foreground">
            ({reviewText})
          </span>
        )}
      </a>
    );
  }

  // Vertical layout
  if (layout === 'vertical') {
    return (
      <a
        href={isBuilder ? undefined : trustpilotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex flex-col items-center gap-3 p-4 rounded-xl',
          'bg-background border border-border hover:border-muted-foreground/40',
          'transition-colors cursor-pointer text-center',
          className
        )}
        onClick={(e) => isBuilder && e.preventDefault()}
      >
        {showLogo && (
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-[#00b67a] fill-[#00b67a]" />
            <span className="font-semibold text-foreground">Trustpilot</span>
          </div>
        )}
        
        <StarRating rating={rating} size={24} />
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-foreground">
            {ratingText}
          </span>
          {showReviewCount && (
            <span className="text-sm text-muted-foreground">
              Based on {reviewText}
            </span>
          )}
        </div>

        {businessName && (
          <span className="text-sm text-muted-foreground">
            {businessName}
          </span>
        )}

        <span className="text-xs text-[#00b67a] flex items-center gap-1">
          View on Trustpilot
          <ExternalLink className="w-3 h-3" />
        </span>
      </a>
    );
  }

  // Horizontal layout (default)
  return (
    <a
      href={isBuilder ? undefined : trustpilotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-background border border-border hover:border-muted-foreground/40',
        'transition-colors cursor-pointer',
        className
      )}
      onClick={(e) => isBuilder && e.preventDefault()}
    >
      {showLogo && (
        <div className="flex items-center gap-1 pr-4 border-r border-border">
          <Star className="w-6 h-6 text-[#00b67a] fill-[#00b67a]" />
          <span className="font-semibold text-foreground">Trustpilot</span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <StarRating rating={rating} size={20} />
        
        <div className="flex flex-col">
          <span className="font-bold text-foreground">
            {ratingText} out of 5
          </span>
          {showReviewCount && (
            <span className="text-sm text-muted-foreground">
              Based on {reviewText}
            </span>
          )}
        </div>
      </div>

      <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
    </a>
  );
};

export default TrustpilotWidget;
