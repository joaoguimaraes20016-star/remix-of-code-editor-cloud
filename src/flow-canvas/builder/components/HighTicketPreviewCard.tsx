/**
 * HighTicketPreviewCard - Premium visual preview cards
 * Rich previews that look like actual high-ticket coaching funnels
 */

import { Plus, Star, Play, Calendar, CheckCircle2, Quote, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionTemplate } from '@/builder_v2/templates/sectionTemplates';

interface HighTicketPreviewCardProps {
  template: SectionTemplate;
  onAdd: () => void;
}

// Hero preview - Dark gradient with headline and CTA
function HeroPreview({ variant }: { variant?: string }) {
  const hasButton = variant !== 'simple';
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col justify-center items-center gap-2">
      {/* Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <div className="h-1 w-8 bg-emerald-400/60 rounded" />
      </div>
      {/* Headline */}
      <div className="h-4 w-32 bg-gradient-to-r from-white to-white/80 rounded mt-1" />
      <div className="h-2 w-40 bg-white/30 rounded" />
      {/* CTA Button */}
      {hasButton && (
        <div className="h-6 w-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mt-2 shadow-lg shadow-blue-500/30" />
      )}
    </div>
  );
}

// Content preview - Text blocks with heading
function ContentPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col gap-2">
      {/* Heading */}
      <div className="h-3 w-24 bg-white/90 rounded" />
      {/* Text lines */}
      <div className="space-y-1.5 mt-1">
        <div className="h-1.5 w-full bg-white/30 rounded" />
        <div className="h-1.5 w-5/6 bg-white/25 rounded" />
        <div className="h-1.5 w-4/5 bg-white/20 rounded" />
      </div>
    </div>
  );
}

// CTA preview - Gradient banner with button
function CTAPreview({ hasText }: { hasText?: boolean }) {
  return (
    <div className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-4 flex flex-col justify-center items-center gap-2">
      {hasText && (
        <>
          <div className="h-2.5 w-28 bg-white/90 rounded" />
          <div className="h-1.5 w-36 bg-white/50 rounded" />
        </>
      )}
      <div className="h-7 w-24 bg-white rounded-lg mt-1 shadow-lg flex items-center justify-center">
        <div className="h-2 w-14 bg-blue-600 rounded" />
      </div>
    </div>
  );
}

// Media preview - Video player placeholder
function MediaPreview({ type }: { type: 'video' | 'image' }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-center">
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
  );
}

// Embed preview - Calendar widget
function EmbedPreview({ type }: { type: 'calendar' | 'empty' }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex items-center justify-center">
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
  );
}

// Social Proof preview - Trust badges and ratings
function SocialProofPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center gap-2">
      {/* Star rating */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <div className="h-1.5 w-16 bg-white/40 rounded" />
      {/* Logo bar */}
      <div className="flex items-center gap-2 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-8 h-4 rounded bg-white/15" />
        ))}
      </div>
    </div>
  );
}

// Features preview - Grid with icons
function FeaturesPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3">
      <div className="h-2 w-20 bg-white/80 rounded mb-3 mx-auto" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-blue-400" />
            </div>
            <div className="h-1 w-8 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Testimonials preview - Quote card
function TestimonialsPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center">
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

// Team preview - Member grid
function TeamPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col items-center justify-center">
      <div className="h-2 w-16 bg-white/80 rounded mb-3" />
      <div className="flex items-center gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <Users size={12} className="text-white/40" />
            </div>
            <div className="h-1 w-6 bg-white/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ preview - Accordion style
function FAQPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-3 flex flex-col gap-2">
      <div className="h-2 w-16 bg-white/80 rounded mb-1" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 border border-white/10"
        >
          <Plus size={10} className="text-white/40" />
          <div className="h-1.5 flex-1 bg-white/30 rounded" />
        </div>
      ))}
    </div>
  );
}

// Get preview component based on template category/type
function getPreviewComponent(template: SectionTemplate) {
  const category = template.category;
  const id = template.id;
  
  switch (category) {
    case 'hero':
      return <HeroPreview variant={id.includes('simple') ? 'simple' : 'button'} />;
    case 'content':
      return <ContentPreview />;
    case 'cta':
      return <CTAPreview hasText={id.includes('text')} />;
    case 'media':
      return <MediaPreview type={id.includes('video') ? 'video' : 'image'} />;
    case 'embed':
      return <EmbedPreview type={id.includes('calendar') ? 'calendar' : 'empty'} />;
    case 'social_proof':
      return <SocialProofPreview />;
    case 'features':
      return <FeaturesPreview />;
    default:
      // Fallback based on template name
      if (id.includes('testimonial')) return <TestimonialsPreview />;
      if (id.includes('team')) return <TeamPreview />;
      if (id.includes('faq')) return <FAQPreview />;
      return <ContentPreview />;
  }
}

export function HighTicketPreviewCard({ template, onAdd }: HighTicketPreviewCardProps) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "group relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-200",
        "bg-[hsl(var(--coaching-surface))] border-2 border-[hsl(var(--coaching-border))]",
        "hover:border-[hsl(var(--coaching-accent))] hover:scale-[1.02]",
        "hover:shadow-xl hover:shadow-[hsl(var(--coaching-accent)/0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--coaching-accent))]"
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
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--coaching-accent))] flex items-center justify-center shadow-lg">
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
