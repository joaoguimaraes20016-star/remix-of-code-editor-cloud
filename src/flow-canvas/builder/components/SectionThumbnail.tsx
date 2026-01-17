import React from 'react';
import { cn } from '@/lib/utils';

interface SectionThumbnailProps {
  templateType: string;
  className?: string;
}

/**
 * SectionThumbnail renders a mini visual preview of section templates.
 * These thumbnails help users quickly identify and select the right template.
 */
export const SectionThumbnail: React.FC<SectionThumbnailProps> = ({ templateType, className }) => {
  const thumbnails: Record<string, React.ReactNode> = {
    // Hero Sections
    'hero': (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-2 w-16 bg-white/90 rounded" />
        <div className="h-1 w-12 bg-white/40 rounded" />
        <div className="h-3 w-10 bg-blue-500 rounded mt-1" />
      </div>
    ),
    'hero-video': (
      <div className="w-full h-full bg-gray-900 p-2 flex flex-col items-center justify-center gap-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50" />
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center z-10">
          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
        </div>
        <div className="h-1.5 w-12 bg-white/80 rounded z-10" />
      </div>
    ),
    'hero-split': (
      <div className="w-full h-full flex">
        <div className="w-1/2 bg-gray-900 p-1.5 flex flex-col justify-center gap-1">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-8 bg-white/40 rounded" />
          <div className="h-2 w-6 bg-blue-500 rounded mt-0.5" />
        </div>
        <div className="w-1/2 bg-gradient-to-br from-blue-400 to-purple-500" />
      </div>
    ),
    'hero-centered': (
      <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-2 w-14 bg-white/90 rounded" />
        <div className="h-1 w-16 bg-white/40 rounded" />
        <div className="h-3 w-10 bg-white rounded mt-1" />
      </div>
    ),
    'hero-badge': (
      <div className="w-full h-full bg-gray-900 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1.5 w-8 bg-green-500/60 rounded-full" />
        <div className="h-2 w-14 bg-white/90 rounded mt-0.5" />
        <div className="h-1 w-10 bg-white/40 rounded" />
        <div className="h-3 w-8 bg-blue-500 rounded mt-1" />
      </div>
    ),
    
    // Feature Sections
    'features-grid': (
      <div className="w-full h-full bg-white p-2 grid grid-cols-3 gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mb-0.5" />
            <div className="h-0.5 w-5 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    ),
    'features-list': (
      <div className="w-full h-full bg-white p-2 flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="h-1 flex-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // Pricing
    'pricing': (
      <div className="w-full h-full bg-white p-1.5 flex gap-1 items-stretch">
        {[1, 2].map(i => (
          <div key={i} className={cn(
            "flex-1 rounded border flex flex-col items-center justify-center p-1",
            i === 2 ? "border-blue-500 bg-blue-50" : "border-gray-200"
          )}>
            <div className="h-1 w-4 bg-gray-400 rounded mb-0.5" />
            <div className="h-1.5 w-6 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    ),
    'pricing-single': (
      <div className="w-full h-full bg-gray-100 p-2 flex items-center justify-center">
        <div className="w-16 bg-white rounded border border-gray-200 p-1.5 flex flex-col items-center">
          <div className="h-1 w-6 bg-gray-400 rounded mb-1" />
          <div className="h-2 w-8 bg-gray-800 rounded mb-1" />
          <div className="h-2 w-10 bg-blue-500 rounded" />
        </div>
      </div>
    ),
    
    // FAQ
    'faq': (
      <div className="w-full h-full bg-white p-2 flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1 bg-gray-100 rounded px-1 py-0.5">
            <div className="w-2 h-2 text-gray-400 flex-shrink-0">+</div>
            <div className="h-0.5 flex-1 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // CTA Sections
    'cta-banner': (
      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-700 p-2 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="h-1.5 w-12 bg-white/90 rounded" />
          <div className="h-1 w-8 bg-white/40 rounded" />
        </div>
        <div className="h-3 w-6 bg-white rounded" />
      </div>
    ),
    'cta-image': (
      <div className="w-full h-full flex">
        <div className="w-1/2 bg-blue-600 p-1.5 flex flex-col justify-center gap-0.5">
          <div className="h-1 w-8 bg-white/90 rounded" />
          <div className="h-2 w-6 bg-white rounded mt-0.5" />
        </div>
        <div className="w-1/2 bg-gray-300" />
      </div>
    ),
    'cta-urgency': (
      <div className="w-full h-full bg-red-600 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1 w-8 bg-yellow-300 rounded" />
        <div className="h-1.5 w-14 bg-white/90 rounded" />
        <div className="h-3 w-10 bg-white rounded mt-0.5" />
      </div>
    ),
    'cta-double': (
      <div className="w-full h-full bg-gray-900 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1.5 w-14 bg-white/90 rounded" />
        <div className="flex gap-1 mt-1">
          <div className="h-2.5 w-8 bg-blue-500 rounded" />
          <div className="h-2.5 w-8 bg-white/20 rounded border border-white/40" />
        </div>
      </div>
    ),
    
    // Benefits
    'benefits': (
      <div className="w-full h-full bg-white p-2 flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-green-500 flex items-center justify-center text-white text-[6px]">✓</div>
            <div className="h-1 flex-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // Stats
    'stats-bar': (
      <div className="w-full h-full bg-gray-900 p-2 flex items-center justify-around">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-2 w-4 bg-white/90 rounded font-bold text-[8px]" />
            <div className="h-0.5 w-5 bg-white/40 rounded mt-0.5" />
          </div>
        ))}
      </div>
    ),
    
    // Guarantee
    'guarantee': (
      <div className="w-full h-full bg-white p-2 flex items-center justify-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[6px]">✓</div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="h-1.5 w-10 bg-gray-800 rounded" />
          <div className="h-1 w-14 bg-gray-300 rounded" />
        </div>
      </div>
    ),
    
    // Countdown
    'countdown': (
      <div className="w-full h-full bg-gray-900 p-2 flex flex-col items-center justify-center">
        <div className="h-1 w-10 bg-red-500/60 rounded mb-1" />
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-4 h-5 bg-gray-800 rounded flex flex-col items-center justify-center">
              <div className="text-white text-[6px] font-mono">00</div>
            </div>
          ))}
        </div>
      </div>
    ),
    
    // Footer/Header
    'footer-simple': (
      <div className="w-full h-full bg-gray-100 p-2 flex items-center justify-between">
        <div className="h-1 w-8 bg-gray-400 rounded" />
        <div className="flex gap-1">
          <div className="h-1 w-4 bg-gray-400 rounded" />
          <div className="h-1 w-4 bg-gray-400 rounded" />
        </div>
      </div>
    ),
    'footer-social': (
      <div className="w-full h-full bg-gray-900 p-2 flex flex-col items-center justify-center gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/40" />
          ))}
        </div>
        <div className="h-0.5 w-10 bg-white/20 rounded" />
      </div>
    ),
    'header-nav': (
      <div className="w-full h-full bg-white p-2 flex items-center justify-between border-b border-gray-200">
        <div className="w-4 h-4 rounded bg-gray-800" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-1 w-4 bg-gray-400 rounded" />
          ))}
        </div>
        <div className="h-2 w-6 bg-blue-500 rounded" />
      </div>
    ),
    'header-minimal': (
      <div className="w-full h-full bg-white p-2 flex items-center justify-center border-b border-gray-200">
        <div className="w-6 h-4 rounded bg-gray-800" />
      </div>
    ),
    
    // Testimonial
    'testimonial': (
      <div className="w-full h-full bg-white p-2 flex flex-col items-center justify-center gap-1">
        <div className="text-gray-300 text-lg leading-none">"</div>
        <div className="h-1 w-14 bg-gray-300 rounded" />
        <div className="h-1 w-10 bg-gray-200 rounded" />
        <div className="flex items-center gap-1 mt-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="h-0.5 w-6 bg-gray-400 rounded" />
        </div>
      </div>
    ),
    
    // About
    'about': (
      <div className="w-full h-full bg-white p-2 flex gap-2">
        <div className="w-1/3 bg-gray-200 rounded" />
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="h-1.5 w-10 bg-gray-800 rounded" />
          <div className="h-1 w-full bg-gray-200 rounded" />
          <div className="h-1 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    ),
    
    // Team
    'team': (
      <div className="w-full h-full bg-white p-2 flex flex-col items-center">
        <div className="h-1.5 w-10 bg-gray-800 rounded mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-gray-300 mb-0.5" />
              <div className="h-0.5 w-4 bg-gray-400 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
    
    // Product
    'product': (
      <div className="w-full h-full bg-white p-2 flex gap-2">
        <div className="w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center">
          <div className="w-8 h-6 bg-gray-300 rounded" />
        </div>
        <div className="w-1/2 flex flex-col gap-1 justify-center">
          <div className="h-1.5 w-10 bg-gray-800 rounded" />
          <div className="h-1 w-12 bg-gray-200 rounded" />
          <div className="h-2 w-8 bg-blue-500 rounded mt-0.5" />
        </div>
      </div>
    ),
    
    // Empty/Custom
    'custom': (
      <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="w-4 h-4 text-gray-400 flex items-center justify-center text-lg">+</div>
      </div>
    ),
    
    // Thank you
    'text-block': (
      <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 p-2 flex flex-col items-center justify-center gap-1">
        <div className="text-lg">🎉</div>
        <div className="h-1.5 w-10 bg-gray-800 rounded" />
        <div className="h-1 w-14 bg-gray-400 rounded" />
      </div>
    ),
  };

  return (
    <div className={cn("w-full h-full rounded overflow-hidden", className)}>
      {thumbnails[templateType] || (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-300 rounded" />
        </div>
      )}
    </div>
  );
};

export default SectionThumbnail;
