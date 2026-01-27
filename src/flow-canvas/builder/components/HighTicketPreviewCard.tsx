/**
 * HighTicketPreviewCard - Premium visual preview cards for Section Picker
 * Rich visual previews that showcase high-converting funnel templates
 */

import React from 'react';
import { Plus, Star, Calendar, CheckCircle2, Quote, Users, TrendingUp, HelpCircle, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionTemplate } from '@/builder_v2/templates/sectionTemplates';

interface HighTicketPreviewCardProps {
  template: SectionTemplate;
  onAdd: () => void;
}

// ============================================================================
// PREVIEW COMPONENTS - Rich visual representations of each template type
// ============================================================================

// ============================================================================
// HERO PREVIEWS - Perspective-Style Light Theme
// Clean, modern landing page aesthetics matching the reference designs
// ============================================================================

// Shared components for hero previews
const AvatarStack = () => (
  <div className="flex -space-x-1.5">
    {[
      'from-blue-400 to-blue-500',
      'from-emerald-400 to-emerald-500',
      'from-purple-400 to-purple-500',
      'from-orange-400 to-orange-500',
    ].map((gradient, i) => (
      <div
        key={i}
        className={cn(
          "w-4 h-4 rounded-full border-2 border-white",
          `bg-gradient-to-br ${gradient}`
        )}
      />
    ))}
  </div>
);

const StarRating = () => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={8} className="fill-yellow-400 text-yellow-400" />
    ))}
  </div>
);

const LogoBar = () => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="w-8 h-3 bg-slate-200 rounded" />
    ))}
  </div>
);

const ImagePlaceholder = ({ className }: { className?: string }) => (
  <div className={cn("bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center", className)}>
    <div className="w-8 h-8 rounded-full bg-slate-300/50" />
  </div>
);

const FormInputMockup = ({ placeholder }: { placeholder: string }) => (
  <div className="h-4 w-full bg-slate-100 rounded border border-slate-200 flex items-center px-1.5">
    <span className="text-[5px] text-slate-400">{placeholder}</span>
  </div>
);

// Hero previews with different variants - PERSPECTIVE STYLE
const HeroPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // Hero Simple - Centered with image below
    if (variant === 'simple') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-24 bg-slate-300 rounded" />
          <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
          <ImagePlaceholder className="w-full h-12 mt-2" />
        </div>
      );
    }
    
    // Hero + Reviews - With avatar stack and rating
    if (variant === 'reviews') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-24 bg-slate-300 rounded" />
          <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
          <div className="flex items-center gap-1 mt-1">
            <AvatarStack />
            <StarRating />
            <span className="text-[5px] text-slate-500">4.8</span>
          </div>
          <ImagePlaceholder className="w-full h-10 mt-1" />
        </div>
      );
    }
    
    // Hero + Logos - With trusted-by logos
    if (variant === 'logos') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-24 bg-slate-300 rounded" />
          <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
          <div className="mt-2 w-full">
            <LogoBar />
          </div>
        </div>
      );
    }
    
    // Hero Split - 50/50 layout
    if (variant === 'split') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-1 w-16 bg-slate-300 rounded" />
            <div className="h-4 w-12 bg-blue-500 rounded mt-1" />
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-5 h-2 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
          <ImagePlaceholder className="flex-1" />
        </div>
      );
    }
    
    // Hero + Form Card - Split with floating form
    if (variant === 'form-card') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2.5 w-24 bg-slate-800 rounded" />
            <div className="h-1 w-20 bg-slate-300 rounded" />
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col gap-1.5 border border-slate-100">
            <div className="h-1.5 w-16 bg-slate-700 rounded" />
            <FormInputMockup placeholder="Name" />
            <FormInputMockup placeholder="E-Mail" />
            <FormInputMockup placeholder="Phone" />
            <div className="h-4 w-full bg-blue-500 rounded mt-0.5" />
          </div>
        </div>
      );
    }
    
    // Hero + Inline Form - Form integrated with content
    if (variant === 'inline-form') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-1 w-16 bg-slate-300 rounded" />
            <div className="space-y-1 mt-1">
              <FormInputMockup placeholder="E-Mail" />
              <FormInputMockup placeholder="Phone" />
            </div>
            <div className="h-4 w-full bg-blue-500 rounded mt-1" />
          </div>
          <ImagePlaceholder className="flex-1" />
        </div>
      );
    }
    
    // Hero Gradient - Soft gradient background
    if (variant === 'gradient') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-b from-blue-50 to-slate-50 p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-24 bg-slate-400 rounded" />
          <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
          <div className="mt-2 w-full">
            <LogoBar />
          </div>
        </div>
      );
    }
    
    // Hero Dark - Dark background with light text
    if (variant === 'dark') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-700 p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-white rounded" />
          <div className="h-1.5 w-24 bg-white/40 rounded" />
          <div className="h-5 w-16 border border-white/60 rounded mt-1" />
          <div className="w-full h-10 bg-slate-600 rounded-lg mt-2" />
        </div>
      );
    }
    
    // Default fallback
    return (
      <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
        <div className="h-2.5 w-28 bg-slate-800 rounded" />
        <div className="h-1.5 w-24 bg-slate-300 rounded" />
        <div className="h-5 w-16 bg-blue-500 rounded mt-1" />
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

// CTA previews - PERSPECTIVE STYLE (10 variants)
const CTAPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // CTA Simple - White centered
    if (variant === 'simple') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-32 bg-slate-300 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded mt-2" />
        </div>
      );
    }
    
    // CTA Gray Card
    if (variant === 'gray-card') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-50 p-3 flex items-center justify-center">
          <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm flex flex-col items-center gap-1.5">
            <div className="h-2 w-24 bg-slate-800 rounded" />
            <div className="h-1 w-28 bg-slate-300 rounded" />
            <div className="h-4 w-16 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // CTA Dark with Reviews
    if (variant === 'dark-reviews') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-800 p-3 flex flex-col items-center justify-center gap-1.5">
          <AvatarStack />
          <StarRating />
          <div className="text-[5px] text-white/60">Over 200 satisfied customers</div>
          <div className="h-2.5 w-28 bg-white rounded" />
          <div className="h-1.5 w-32 bg-white/40 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded mt-1" />
        </div>
      );
    }
    
    // CTA Dark Card
    if (variant === 'dark-card') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-800 p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="bg-slate-700 rounded-lg p-3 border border-slate-600 flex flex-col items-center gap-1.5">
            <AvatarStack />
            <div className="h-4 w-16 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // CTA Gradient + Logos
    if (variant === 'gradient-logos') {
      return (
        <div ref={ref} className="w-full h-full bg-gradient-to-b from-blue-50 to-slate-50 p-3 flex flex-col items-center justify-center gap-1.5">
          <div className="h-2.5 w-28 bg-slate-800 rounded" />
          <div className="h-1.5 w-32 bg-slate-400 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded mt-1" />
          <div className="mt-2 w-full">
            <LogoBar />
          </div>
        </div>
      );
    }
    
    // CTA Form Split with Reviews
    if (variant === 'form-split-reviews') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-14 bg-slate-800 rounded" />
            <div className="h-2 w-12 bg-slate-800 rounded" />
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="flex items-center gap-1 mt-1">
              <AvatarStack />
              <StarRating />
            </div>
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col gap-1 border border-slate-100">
            <FormInputMockup placeholder="Name" />
            <FormInputMockup placeholder="E-Mail" />
            <FormInputMockup placeholder="Phone" />
            <div className="h-4 w-full bg-blue-500 rounded mt-0.5" />
          </div>
        </div>
      );
    }
    
    // CTA Form Split Simple
    if (variant === 'form-split-simple') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-14 bg-slate-800 rounded" />
            <div className="h-2 w-12 bg-slate-800 rounded" />
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="h-1 w-20 bg-slate-300 rounded mt-1" />
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-2 flex flex-col gap-1 border border-slate-100">
            <FormInputMockup placeholder="Name" />
            <FormInputMockup placeholder="E-Mail" />
            <FormInputMockup placeholder="Phone" />
            <div className="h-4 w-full bg-blue-500 rounded mt-0.5" />
          </div>
        </div>
      );
    }
    
    // CTA Split Form (Light BG with privacy note)
    if (variant === 'split-form') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2.5 w-14 bg-slate-800 rounded" />
            <div className="h-2.5 w-16 bg-slate-800 rounded" />
            <div className="h-1 w-20 bg-slate-300 rounded mt-1" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1 w-20 bg-slate-300 rounded" />
            <FormInputMockup placeholder="Name" />
            <FormInputMockup placeholder="E-Mail" />
            <div className="h-4 w-full bg-blue-500 rounded" />
            <div className="h-0.5 w-16 bg-slate-200 rounded mx-auto" />
          </div>
        </div>
      );
    }
    
    // CTA + FAQ
    if (variant === 'faq') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2.5 w-14 bg-slate-800 rounded" />
            <div className="h-2.5 w-16 bg-slate-800 rounded" />
            <div className="h-1 w-20 bg-slate-300 rounded mt-0.5" />
            <div className="h-4 w-14 bg-blue-500 rounded mt-1" />
          </div>
          <div className="flex-1 flex flex-col gap-1 justify-center">
            <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="h-1 w-16 bg-slate-600 rounded" />
                <Plus size={6} className="text-slate-400" />
              </div>
            </div>
            <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="h-1 w-14 bg-slate-600 rounded" />
                <Plus size={6} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // CTA Dual
    if (variant === 'dual') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-2">
          <div className="h-2.5 w-24 bg-slate-800 rounded" />
          <div className="h-5 w-20 bg-blue-500 rounded" />
          <div className="h-4 w-16 border border-slate-300 rounded flex items-center justify-center">
            <div className="h-1 w-10 bg-slate-400 rounded" />
          </div>
        </div>
      );
    }
    
    // Default fallback
    return (
      <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
        <div className="h-2.5 w-28 bg-slate-800 rounded" />
        <div className="h-1.5 w-32 bg-slate-300 rounded" />
        <div className="h-5 w-20 bg-blue-500 rounded mt-2" />
      </div>
    );
  }
);
CTAPreview.displayName = 'CTAPreview';

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

// Features preview - PERSPECTIVE STYLE (8 variants)
const SectionLabel = () => (
  <div className="text-[5px] font-medium text-blue-500">Our Services</div>
);

const ChecklistRow = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-1">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-1">
        <CheckCircle2 size={6} className="text-green-500" />
        <div className="h-1 w-16 bg-slate-300 rounded" />
      </div>
    ))}
  </div>
);

const IconFeature = ({ color }: { color: string }) => (
  <div className="flex items-center gap-1">
    <div className={cn("w-4 h-4 rounded-full", color)} />
    <div className="space-y-0.5">
      <div className="h-1 w-10 bg-slate-700 rounded" />
      <div className="h-0.5 w-8 bg-slate-300 rounded" />
    </div>
  </div>
);

const ImageCard = () => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-full h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg" />
    <div className="h-1 w-10 bg-slate-700 rounded" />
    <div className="h-0.5 w-12 bg-slate-300 rounded" />
  </div>
);

const FeaturesPreview = React.forwardRef<HTMLDivElement, { variant: string }>(
  ({ variant }, ref) => {
    // Features Split + Checklist
    if (variant === 'split-checklist') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-1 w-16 bg-slate-300 rounded" />
            <div className="flex items-center gap-1 mt-1">
              <AvatarStack />
              <StarRating />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-1">
            <ChecklistRow />
            <div className="h-4 w-14 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // Features Split + Image
    if (variant === 'split-image') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-1 w-16 bg-slate-300 rounded" />
            <div className="flex items-center gap-1 mt-1">
              <AvatarStack />
              <StarRating />
            </div>
          </div>
          <ImagePlaceholder className="flex-1" />
        </div>
      );
    }
    
    // Features Split + Icons (image left)
    if (variant === 'split-icons') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex gap-2">
          <ImagePlaceholder className="flex-1" />
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 w-18 bg-slate-800 rounded" />
            <div className="space-y-1 mt-1">
              <IconFeature color="bg-blue-400" />
              <IconFeature color="bg-purple-400" />
              <IconFeature color="bg-amber-400" />
            </div>
            <div className="h-4 w-14 bg-blue-500 rounded mt-1" />
          </div>
        </div>
      );
    }
    
    // Features 3-Column Cards
    if (variant === '3col-cards') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center gap-2">
          <SectionLabel />
          <div className="h-2 w-28 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-blue-500 rounded" />
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            <ImageCard />
            <ImageCard />
            <ImageCard />
          </div>
        </div>
      );
    }
    
    // Features 4-Column Icons (2x2)
    if (variant === '4col-icons') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center gap-2">
          <SectionLabel />
          <div className="h-2 w-28 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-blue-500 rounded" />
          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            <IconFeature color="bg-blue-400" />
            <IconFeature color="bg-amber-400" />
            <IconFeature color="bg-indigo-400" />
            <IconFeature color="bg-purple-400" />
          </div>
        </div>
      );
    }
    
    // Features 2-Column + Icons
    if (variant === '2col-icons') {
      return (
        <div ref={ref} className="w-full h-full bg-white p-2 flex flex-col items-center gap-1.5">
          <SectionLabel />
          <div className="h-2 w-24 bg-slate-800 rounded" />
          <div className="h-3 w-14 bg-blue-500 rounded" />
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded" />
            <div className="h-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-1 w-full">
            {['bg-blue-400', 'bg-indigo-400', 'bg-amber-400', 'bg-purple-400'].map((color, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-full mx-auto", color)} />
            ))}
          </div>
        </div>
      );
    }
    
    // Features Gray BG + Image
    if (variant === 'gray-image') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-50 p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <SectionLabel />
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="space-y-1 mt-1">
              <IconFeature color="bg-amber-400" />
              <IconFeature color="bg-blue-400" />
              <IconFeature color="bg-purple-400" />
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
            <div className="w-8 h-12 bg-slate-100 rounded-md border border-slate-300" />
          </div>
        </div>
      );
    }
    
    // Features Gray BG + Reviews
    if (variant === 'gray-reviews') {
      return (
        <div ref={ref} className="w-full h-full bg-slate-50 p-2 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <SectionLabel />
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="h-1 w-20 bg-slate-300 rounded" />
            <div className="flex items-center gap-1 mt-1">
              <AvatarStack />
              <StarRating />
            </div>
          </div>
          <ImagePlaceholder className="flex-1" />
        </div>
      );
    }
    
    // Default fallback
    return (
      <div ref={ref} className="w-full h-full bg-white p-3 flex flex-col items-center justify-center gap-1.5">
        <SectionLabel />
        <div className="h-2.5 w-28 bg-slate-800 rounded" />
        <ChecklistRow />
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
      if (id.includes('simple')) return <HeroPreview variant="simple" />;
      if (id.includes('reviews')) return <HeroPreview variant="reviews" />;
      if (id.includes('logos')) return <HeroPreview variant="logos" />;
      if (id.includes('split')) return <HeroPreview variant="split" />;
      if (id.includes('form-card')) return <HeroPreview variant="form-card" />;
      if (id.includes('inline-form')) return <HeroPreview variant="inline-form" />;
      if (id.includes('gradient')) return <HeroPreview variant="gradient" />;
      if (id.includes('dark')) return <HeroPreview variant="dark" />;
      return <HeroPreview variant="simple" />;
    
    case 'content':
      return <ContentPreview hasHeading={id.includes('heading')} />;
    
    case 'cta':
      if (id.includes('simple') && !id.includes('split')) return <CTAPreview variant="simple" />;
      if (id.includes('gray-card')) return <CTAPreview variant="gray-card" />;
      if (id.includes('dark-reviews')) return <CTAPreview variant="dark-reviews" />;
      if (id.includes('dark-card')) return <CTAPreview variant="dark-card" />;
      if (id.includes('gradient-logos')) return <CTAPreview variant="gradient-logos" />;
      if (id.includes('form-split-reviews')) return <CTAPreview variant="form-split-reviews" />;
      if (id.includes('form-split-simple')) return <CTAPreview variant="form-split-simple" />;
      if (id.includes('split-form')) return <CTAPreview variant="split-form" />;
      if (id.includes('faq')) return <CTAPreview variant="faq" />;
      if (id.includes('dual')) return <CTAPreview variant="dual" />;
      return <CTAPreview variant="simple" />;
    
    case 'embed':
      return <EmbedPreview type={id.includes('calendar') ? 'calendar' : 'empty'} />;
    
    case 'social_proof':
      if (id.includes('stars')) return <SocialProofPreview variant="stars" />;
      if (id.includes('logos')) return <SocialProofPreview variant="logos" />;
      if (id.includes('stats')) return <SocialProofPreview variant="stats" />;
      return <SocialProofPreview variant="badges" />;
    
    case 'features':
      if (id.includes('split-checklist')) return <FeaturesPreview variant="split-checklist" />;
      if (id.includes('split-image')) return <FeaturesPreview variant="split-image" />;
      if (id.includes('split-icons')) return <FeaturesPreview variant="split-icons" />;
      if (id.includes('3col-cards')) return <FeaturesPreview variant="3col-cards" />;
      if (id.includes('4col-icons')) return <FeaturesPreview variant="4col-icons" />;
      if (id.includes('2col-icons')) return <FeaturesPreview variant="2col-icons" />;
      if (id.includes('gray-image')) return <FeaturesPreview variant="gray-image" />;
      if (id.includes('gray-reviews')) return <FeaturesPreview variant="gray-reviews" />;
      return <FeaturesPreview variant="split-checklist" />;
    
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
