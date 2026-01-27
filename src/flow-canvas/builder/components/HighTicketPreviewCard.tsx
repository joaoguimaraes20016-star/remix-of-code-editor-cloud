/**
 * HighTicketPreviewCard - Premium visual preview cards for Section Picker
 * Rich visual previews that showcase high-converting funnel templates
 */

import React from 'react';
import { Plus, Star, Play, Calendar, CheckCircle2, Quote, Users, TrendingUp, HelpCircle, Clock, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionTemplate } from '@/builder_v2/templates/sectionTemplates';

interface HighTicketPreviewCardProps {
  template: SectionTemplate;
  onAdd: () => void;
}

// ============================================================================
// PREVIEW COMPONENTS - Rich visual representations of each template type
// ============================================================================

// Hero previews with different variants
const HeroPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    if (variant === 'impact') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col justify-center items-center gap-2">
          {/* Urgency Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <div className="h-1 w-12 bg-orange-400/60 rounded" />
          </div>
          {/* Headline */}
          <div className="h-4 w-36 bg-gradient-to-r from-white to-white/80 rounded" />
          <div className="h-2 w-32 bg-white/40 rounded" />
          {/* CTA */}
          <div className="h-7 w-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mt-2 shadow-lg shadow-blue-500/30" />
        </div>
      );
    }
    
    if (variant === 'video') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center gap-2">
          {/* Video placeholder */}
          <div className="w-full h-16 bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
            <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
              <Play size={16} className="text-white/80 ml-0.5" />
            </div>
          </div>
          <div className="h-2.5 w-28 bg-white/70 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded" />
        </div>
      );
    }
    
    if (variant === 'authority') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col items-center justify-center gap-2">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg" />
          <div className="h-3 w-24 bg-white/80 rounded" />
          <div className="h-1.5 w-32 bg-white/30 rounded" />
          <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
        </div>
      );
    }
    
    if (variant === 'split') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2 flex gap-2">
          {/* Image side */}
          <div className="flex-1 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg" />
          {/* Text side */}
          <div className="flex-1 flex flex-col justify-center gap-1.5 pr-2">
            <div className="h-2.5 w-full bg-white/80 rounded" />
            <div className="h-1.5 w-4/5 bg-white/30 rounded" />
            <div className="h-4 w-12 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // Minimal (default)
    return (
      <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col justify-center items-center gap-2">
        <div className="h-4 w-28 bg-white/90 rounded" />
        <div className="h-2 w-36 bg-white/30 rounded" />
        <div className="h-6 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mt-2" />
      </div>
    );
  }
);
HeroPreview.displayName = 'HeroPreview';

// Content preview
const ContentPreview = React.forwardRef<HTMLDivElement, { hasHeading?: boolean }>(
  ({ hasHeading }, ref) => (
    <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col gap-2">
      {hasHeading && <div className="h-3 w-24 bg-white/90 rounded" />}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-white/30 rounded" />
        <div className="h-1.5 w-5/6 bg-white/25 rounded" />
        <div className="h-1.5 w-4/5 bg-white/20 rounded" />
      </div>
    </div>
  )
);
ContentPreview.displayName = 'ContentPreview';

// CTA previews
const CTAPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    if (variant === 'urgency') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4 flex flex-col justify-center items-center gap-2">
          <div className="h-8 w-28 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <div className="h-2.5 w-20 bg-blue-600 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-white/70" />
            <div className="h-1.5 w-16 bg-white/50 rounded" />
          </div>
        </div>
      );
    }
    
    if (variant === 'dual') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col justify-center items-center gap-2">
          <div className="h-7 w-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg" />
          <div className="h-5 w-16 border border-white/20 rounded bg-transparent flex items-center justify-center">
            <div className="h-1.5 w-10 bg-white/40 rounded" />
          </div>
        </div>
      );
    }
    
    return (
      <div ref={ref} className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4 flex items-center justify-center">
        <div className="h-8 w-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
          <div className="h-2.5 w-16 bg-blue-600 rounded" />
        </div>
      </div>
    );
  }
);
CTAPreview.displayName = 'CTAPreview';

// Media preview
const MediaPreview = React.forwardRef<HTMLDivElement, { type: 'video' | 'image' }>(
  ({ type }, ref) => (
    <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-center">
      {type === 'video' ? (
        <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur">
          <Play size={24} className="text-white/80 ml-1" />
        </div>
      ) : (
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-600/50 flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-slate-500/50" />
          </div>
        </div>
      )}
    </div>
  )
);
MediaPreview.displayName = 'MediaPreview';

// Embed preview
const EmbedPreview = React.forwardRef<HTMLDivElement, { type: 'calendar' | 'empty' }>(
  ({ type }, ref) => (
    <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-center">
      {type === 'calendar' ? (
        <div className="bg-white/10 rounded-lg p-3 border border-white/10 backdrop-blur">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-blue-400" />
            <div className="h-1.5 w-16 bg-white/60 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-sm",
                  i === 8 || i === 15 ? "bg-blue-500" : "bg-white/20"
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
          <Plus size={20} className="text-white/30" />
        </div>
      )}
    </div>
  )
);
EmbedPreview.displayName = 'EmbedPreview';

// Social Proof previews
const SocialProofPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    if (variant === 'stars') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <div className="h-1.5 w-20 bg-white/50 rounded" />
        </div>
      );
    }
    
    if (variant === 'logos') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center gap-2">
          <div className="h-1.5 w-12 bg-white/40 rounded" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-10 h-5 rounded bg-white/15" />
            ))}
          </div>
        </div>
      );
    }
    
    if (variant === 'stats') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3">
            {['$10M+', '500+', '97%'].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-3 w-8 bg-gradient-to-r from-emerald-400 to-blue-400 rounded" />
                <div className="h-1 w-6 bg-white/30 rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Badges (default)
    return (
      <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col justify-center gap-2">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-emerald-400" />
            </div>
            <div className="h-1.5 w-20 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    );
  }
);
SocialProofPreview.displayName = 'SocialProofPreview';

// Features preview
const FeaturesPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    if (variant === 'grid') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center">
          <div className="h-2.5 w-20 bg-white/80 rounded mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {['🚀', '💎', '🎯'].map((emoji, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-xs">
                  {emoji}
                </div>
                <div className="h-1 w-8 bg-white/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col">
        <div className="h-2.5 w-20 bg-white/80 rounded mb-2" />
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <div className="h-1.5 w-24 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    );
  }
);
FeaturesPreview.displayName = 'FeaturesPreview';

// Testimonials preview
const TestimonialsPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    if (variant === 'carousel') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center">
          <div className="h-2 w-24 bg-white/70 rounded mb-2" />
          <div className="flex gap-2">
            {[1, 2].map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 p-2 flex flex-col items-center">
                <Quote size={8} className="text-white/30 mb-1" />
                <div className="h-1 w-12 bg-white/20 rounded" />
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 mt-2" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col items-center justify-center">
        <Quote size={20} className="text-white/20 mb-2" />
        <div className="space-y-1 w-full px-2">
          <div className="h-1.5 w-full bg-white/30 rounded" />
          <div className="h-1.5 w-4/5 bg-white/25 rounded mx-auto" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
          <div className="space-y-0.5">
            <div className="h-1.5 w-12 bg-white/60 rounded" />
            <div className="h-1 w-8 bg-white/30 rounded" />
          </div>
        </div>
      </div>
    );
  }
);
TestimonialsPreview.displayName = 'TestimonialsPreview';

// FAQ preview
const FAQPreview = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col gap-2">
    <div className="h-2.5 w-20 bg-white/80 rounded mb-1" />
    {[1, 2, 3].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 border border-white/10"
      >
        <HelpCircle size={10} className="text-white/40" />
        <div className="h-1.5 flex-1 bg-white/30 rounded" />
        <Plus size={8} className="text-white/30" />
      </div>
    ))}
  </div>
));
FAQPreview.displayName = 'FAQPreview';

// Team preview
const TeamPreview = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center">
    <div className="h-2 w-20 bg-white/80 rounded mb-3" />
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg mb-2" />
    <div className="space-y-1">
      <div className="h-1.5 w-28 bg-white/30 rounded" />
      <div className="h-1 w-20 bg-white/20 rounded mx-auto" />
    </div>
  </div>
));
TeamPreview.displayName = 'TeamPreview';

// ============================================================================
// MAIN COMPONENT - Select appropriate preview based on template
// ============================================================================

function getPreviewComponent(template: SectionTemplate) {
  const { category, id } = template;
  
  switch (category) {
    case 'hero':
      if (id.includes('impact')) return <HeroPreview variant="impact" />;
      if (id.includes('video')) return <HeroPreview variant="video" />;
      if (id.includes('authority')) return <HeroPreview variant="authority" />;
      if (id.includes('split')) return <HeroPreview variant="split" />;
      return <HeroPreview variant="minimal" />;
    
    case 'content':
      return <ContentPreview hasHeading={id.includes('heading')} />;
    
    case 'cta':
      if (id.includes('urgency')) return <CTAPreview variant="urgency" />;
      if (id.includes('dual')) return <CTAPreview variant="dual" />;
      return <CTAPreview variant="simple" />;
    
    case 'media':
      return <MediaPreview type={id.includes('video') ? 'video' : 'image'} />;
    
    case 'embed':
      return <EmbedPreview type={id.includes('calendar') ? 'calendar' : 'empty'} />;
    
    case 'social_proof':
      if (id.includes('stars')) return <SocialProofPreview variant="stars" />;
      if (id.includes('logos')) return <SocialProofPreview variant="logos" />;
      if (id.includes('stats')) return <SocialProofPreview variant="stats" />;
      return <SocialProofPreview variant="badges" />;
    
    case 'features':
      return <FeaturesPreview variant={id.includes('grid') ? 'grid' : 'list'} />;
    
    case 'testimonials':
      return <TestimonialsPreview variant={id.includes('carousel') || id.includes('stack') ? 'carousel' : 'single'} />;
    
    case 'faq':
      return <FAQPreview />;
    
    case 'team':
      return <TeamPreview />;
    
    default:
      return <ContentPreview />;
  }
}

export function HighTicketPreviewCard({ template, onAdd }: HighTicketPreviewCardProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "group relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-200",
        "bg-[hsl(var(--builder-surface))] border-2 border-[hsl(var(--builder-border))]",
        "hover:border-[hsl(var(--builder-accent))] hover:scale-[1.02]",
        "hover:shadow-xl hover:shadow-[hsl(var(--builder-accent)/0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--builder-accent))]"
      )}
    >
      {/* Preview Content */}
      <div className="absolute inset-0">
        {getPreviewComponent(template)}
      </div>
      
      {/* Hover Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      )}>
        {/* Add Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--builder-accent))] flex items-center justify-center shadow-lg">
            <Plus size={16} className="text-white" />
          </div>
        </div>
        
        {/* Template Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h4 className="text-sm font-semibold text-white">
            {template.name}
          </h4>
          <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
            {template.description}
          </p>
        </div>
      </div>
      
      {/* Always-visible label */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent",
        "group-hover:opacity-0 transition-opacity duration-200"
      )}>
        <h4 className="text-xs font-medium text-white/90">
          {template.name}
        </h4>
      </div>
    </button>
  );
}
