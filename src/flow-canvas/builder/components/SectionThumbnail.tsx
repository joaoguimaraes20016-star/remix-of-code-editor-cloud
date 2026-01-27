import React from 'react';
import { cn } from '@/lib/utils';
import { Star, Play, Calendar, CheckCircle2, Quote, Users, Plus } from 'lucide-react';

interface SectionThumbnailProps {
  templateType: string;
  className?: string;
}

/**
 * SectionThumbnail renders premium mini visual previews of section templates.
 * Designed with high-ticket coaching aesthetic - dark gradients, premium accents.
 */
export const SectionThumbnail: React.FC<SectionThumbnailProps> = ({ templateType, className }) => {
  const thumbnails: Record<string, React.ReactNode> = {
    // =========================================================================
    // HERO SECTIONS - Dark gradients with bold headlines
    // =========================================================================
    'hero': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 flex flex-col items-center justify-center gap-1">
        {/* Premium badge */}
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          <div className="h-0.5 w-4 bg-emerald-400/60 rounded" />
        </div>
        {/* Headline */}
        <div className="h-2.5 w-16 bg-gradient-to-r from-white to-white/80 rounded mt-0.5" />
        <div className="h-1 w-12 bg-white/30 rounded" />
        {/* CTA */}
        <div className="h-3 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded mt-1 shadow-lg shadow-blue-500/30" />
      </div>
    ),
    'hero-video': (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 p-2 flex flex-col items-center justify-center gap-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
        {/* Play button */}
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur z-10">
          <Play size={12} className="text-white/80 ml-0.5" />
        </div>
        <div className="h-1.5 w-14 bg-white/80 rounded z-10" />
        <div className="h-1 w-10 bg-white/40 rounded z-10" />
      </div>
    ),
    'hero-split': (
      <div className="w-full h-full flex">
        <div className="w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 flex flex-col justify-center gap-0.5">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-8 bg-white/40 rounded" />
          <div className="h-2 w-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded mt-1" />
        </div>
        <div className="w-1/2 bg-gradient-to-br from-blue-400 to-purple-500" />
      </div>
    ),
    'hero-centered': (
      <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-2 w-14 bg-white/90 rounded" />
        <div className="h-1 w-16 bg-white/40 rounded" />
        <div className="h-3 w-10 bg-white rounded mt-1 shadow-lg" />
      </div>
    ),
    'hero-badge': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1.5 w-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
        <div className="h-2 w-14 bg-white/90 rounded mt-0.5" />
        <div className="h-1 w-10 bg-white/40 rounded" />
        <div className="h-3 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded mt-1" />
      </div>
    ),
    
    // =========================================================================
    // FEATURE SECTIONS - Premium grid layouts
    // =========================================================================
    'features-grid': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2">
        <div className="h-1.5 w-10 bg-white/80 rounded mb-2 mx-auto" />
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center">
                <CheckCircle2 size={8} className="text-blue-400" />
              </div>
              <div className="h-0.5 w-5 bg-white/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
    'features-list': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex-shrink-0 flex items-center justify-center">
              <CheckCircle2 size={6} className="text-white" />
            </div>
            <div className="h-1 flex-1 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // =========================================================================
    // PRICING - Premium card layouts
    // =========================================================================
    'pricing': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 flex gap-1 items-stretch">
        {[1, 2].map(i => (
          <div key={i} className={cn(
            "flex-1 rounded border flex flex-col items-center justify-center p-1",
            i === 2 ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5"
          )}>
            <div className="h-1 w-4 bg-white/40 rounded mb-0.5" />
            <div className="h-1.5 w-6 bg-white/80 rounded" />
            {i === 2 && <div className="h-2 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded mt-1" />}
          </div>
        ))}
      </div>
    ),
    'pricing-single': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center">
        <div className="w-16 bg-white/5 border border-white/10 rounded-lg p-1.5 flex flex-col items-center">
          <div className="h-1 w-6 bg-white/40 rounded mb-1" />
          <div className="h-2 w-8 bg-white/80 rounded mb-1" />
          <div className="h-2 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // FAQ - Accordion style
    // =========================================================================
    'faq': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col gap-1">
        <div className="h-1.5 w-8 bg-white/80 rounded mb-1" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1 px-1 py-0.5 rounded bg-white/5 border border-white/10">
            <Plus size={6} className="text-white/40" />
            <div className="h-0.5 flex-1 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // =========================================================================
    // CTA SECTIONS - Gradient banners
    // =========================================================================
    'cta-banner': (
      <div className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-2 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="h-1.5 w-12 bg-white/90 rounded" />
          <div className="h-1 w-8 bg-white/40 rounded" />
        </div>
        <div className="h-3 w-6 bg-white rounded shadow-lg" />
      </div>
    ),
    'cta-image': (
      <div className="w-full h-full flex">
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 flex flex-col justify-center gap-0.5">
          <div className="h-1 w-8 bg-white/90 rounded" />
          <div className="h-2 w-6 bg-white rounded mt-0.5" />
        </div>
        <div className="w-1/2 bg-gradient-to-br from-slate-700 to-slate-800" />
      </div>
    ),
    'cta-urgency': (
      <div className="w-full h-full bg-gradient-to-r from-red-600 to-orange-600 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1 w-8 bg-yellow-300 rounded" />
        <div className="h-1.5 w-14 bg-white/90 rounded" />
        <div className="h-3 w-10 bg-white rounded mt-0.5 shadow-lg" />
      </div>
    ),
    'cta-double': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="h-1.5 w-14 bg-white/90 rounded" />
        <div className="flex gap-1 mt-1">
          <div className="h-2.5 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded" />
          <div className="h-2.5 w-8 bg-white/10 rounded border border-white/30" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // BENEFITS - Checkmark lists
    // =========================================================================
    'benefits': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <CheckCircle2 size={6} className="text-white" />
            </div>
            <div className="h-1 flex-1 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    ),
    
    // =========================================================================
    // STATS - Metrics bar
    // =========================================================================
    'stats-bar': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-around">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-2.5 w-5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded font-bold text-[6px] flex items-center justify-center text-white">
              {i * 10}+
            </div>
            <div className="h-0.5 w-5 bg-white/40 rounded mt-0.5" />
          </div>
        ))}
      </div>
    ),
    
    // =========================================================================
    // GUARANTEE - Trust badge
    // =========================================================================
    'guarantee': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-emerald-400" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-14 bg-white/30 rounded" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // COUNTDOWN - Urgency timer
    // =========================================================================
    'countdown': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center">
        <div className="h-1 w-10 bg-gradient-to-r from-red-500 to-orange-500 rounded mb-1" />
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-4 h-5 bg-white/10 border border-white/20 rounded flex flex-col items-center justify-center">
              <div className="text-white/80 text-[5px] font-mono font-bold">00</div>
            </div>
          ))}
        </div>
      </div>
    ),
    
    // =========================================================================
    // FOOTER/HEADER - Navigation elements
    // =========================================================================
    'footer-simple': (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 p-2 flex items-center justify-between">
        <div className="h-1 w-8 bg-white/40 rounded" />
        <div className="flex gap-1">
          <div className="h-1 w-4 bg-white/30 rounded" />
          <div className="h-1 w-4 bg-white/30 rounded" />
        </div>
      </div>
    ),
    'footer-social': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-3 h-3 rounded-full bg-white/20 hover:bg-white/30" />
          ))}
        </div>
        <div className="h-0.5 w-10 bg-white/20 rounded" />
      </div>
    ),
    'header-nav': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-between border-b border-white/10">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-indigo-500" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-1 w-4 bg-white/40 rounded" />
          ))}
        </div>
        <div className="h-2.5 w-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded" />
      </div>
    ),
    'header-minimal': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center border-b border-white/10">
        <div className="w-6 h-4 rounded bg-gradient-to-br from-blue-400 to-indigo-500" />
      </div>
    ),
    
    // =========================================================================
    // TESTIMONIAL - Quote cards
    // =========================================================================
    'testimonial': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <Quote size={14} className="text-white/20" />
        <div className="h-1 w-14 bg-white/30 rounded" />
        <div className="h-1 w-10 bg-white/20 rounded" />
        <div className="flex items-center gap-1 mt-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          <div className="h-0.5 w-6 bg-white/40 rounded" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // ABOUT - Bio section
    // =========================================================================
    'about': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex gap-2">
        <div className="w-1/3 bg-gradient-to-br from-slate-700 to-slate-800 rounded" />
        <div className="flex-1 flex flex-col gap-0.5 justify-center">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-full bg-white/20 rounded" />
          <div className="h-1 w-3/4 bg-white/15 rounded" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // TEAM - Member grid
    // =========================================================================
    'team': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center">
        <div className="h-1.5 w-10 bg-white/80 rounded mb-2" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <Users size={8} className="text-white/40" />
              </div>
              <div className="h-0.5 w-4 bg-white/30 rounded mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    ),
    
    // =========================================================================
    // PRODUCT - Split layout
    // =========================================================================
    'product': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex gap-2">
        <div className="w-1/2 bg-gradient-to-br from-slate-700 to-slate-800 rounded flex items-center justify-center">
          <div className="w-8 h-6 bg-slate-600/50 rounded" />
        </div>
        <div className="w-1/2 flex flex-col gap-0.5 justify-center">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-12 bg-white/20 rounded" />
          <div className="h-2.5 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded mt-1" />
        </div>
      </div>
    ),
    
    // =========================================================================
    // CUSTOM/EMPTY - Flexible container
    // =========================================================================
    'custom': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
        <Plus size={16} className="text-white/30" />
      </div>
    ),
    
    // =========================================================================
    // TEXT BLOCK / THANK YOU
    // =========================================================================
    'text-block': (
      <div className="w-full h-full bg-gradient-to-br from-emerald-900/50 via-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="text-lg">🎉</div>
        <div className="h-1.5 w-10 bg-white/80 rounded" />
        <div className="h-1 w-14 bg-white/40 rounded" />
      </div>
    ),
    
    // =========================================================================
    // SOCIAL PROOF - Stars and logos
    // =========================================================================
    'social-proof': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={8} className="fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <div className="h-1 w-12 bg-white/40 rounded" />
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-6 h-3 rounded bg-white/10" />
          ))}
        </div>
      </div>
    ),
    
    // =========================================================================
    // EMBED - Calendar widget
    // =========================================================================
    'embed-calendar': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center">
        <div className="bg-white/10 rounded-lg p-2 border border-white/10">
          <div className="flex items-center gap-1 mb-1">
            <Calendar size={10} className="text-blue-400" />
            <div className="h-1 w-10 bg-white/60 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-sm",
                  i === 5 || i === 10 ? "bg-blue-500" : "bg-white/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    
    // =========================================================================
    // MEDIA - Video/Image
    // =========================================================================
    'media-video': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur">
          <Play size={16} className="text-white/80 ml-0.5" />
        </div>
      </div>
    ),
    'media-image': (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex items-center justify-center">
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center">
            <div className="w-4 h-4 rounded bg-slate-500/50" />
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className={cn("w-full h-full rounded overflow-hidden", className)}>
      {thumbnails[templateType] || (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="w-4 h-4 bg-white/20 rounded" />
        </div>
      )}
    </div>
  );
};

export default SectionThumbnail;
