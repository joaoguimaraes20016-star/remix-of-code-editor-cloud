import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';
import { BlockType } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Type,
  Sparkles,
  Square,
  Grid3X3,
  Users,
  MessageCircle,
  Layers,
  Clock,
  Play,
  Info,
  Code,
  MousePointerClick,
  ChevronRight,
} from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Reset modal to core-components when opened

// Category definitions - Simple two-category structure like Perspective
const categories = [
  { 
    id: 'basic-blocks', 
    name: 'Basic blocks', 
    icon: Type,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    blocks: ['text', 'heading', 'button', 'image', 'video', 'list', 'divider', 'spacer', 'logo-bar', 'reviews', 'testimonial', 'slider', 'graphic', 'webinar', 'accordion', 'countdown', 'loader', 'embed', 'social-proof'] as BlockType[],
  },
  { 
    id: 'interactive-blocks', 
    name: 'Interactive blocks', 
    icon: Sparkles,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    blocks: [] as BlockType[],
    subCategories: [
      {
        name: 'Questions',
        blocks: ['multiple-choice', 'choice', 'image-quiz', 'video-question', 'quiz'] as BlockType[],
      },
      {
        name: 'Forms',
        blocks: ['form', 'calendar', 'upload', 'message', 'date-picker', 'dropdown', 'payment', 'email-capture', 'phone-capture'] as BlockType[],
      },
    ],
  },
];

const sectionCategories = [
  { id: 'hero', name: 'Hero', icon: Square },
  { id: 'product', name: 'Product', icon: Grid3X3 },
  { id: 'call-to-action', name: 'Call to action', icon: Square },
  { id: 'about-us', name: 'About us', icon: Users },
  { id: 'quiz', name: 'Quiz', icon: Sparkles },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'testimonials', name: 'Testimonials', icon: MessageCircle },
  { id: 'trust', name: 'Trust', icon: Layers },
];

// Enhanced section templates with conversion focus and niche-specific copy
interface SectionTemplate {
  id: string;
  name: string;
  blocks: BlockType[];
  description?: string;
  niche?: 'trading' | 'marketing' | 'consulting' | 'coaching' | 'universal';
}

const sectionTemplates: Record<string, SectionTemplate[]> = {
  'hero': [
    { 
      id: 'hero-video', 
      name: 'Video Hero', 
      blocks: ['heading', 'video', 'text', 'button'], 
      description: 'Video with headline and CTA',
      niche: 'universal'
    },
    { 
      id: 'hero-headline', 
      name: 'Headline Hero', 
      blocks: ['heading', 'text', 'button'], 
      description: 'Bold headline with CTA',
      niche: 'universal'
    },
    { 
      id: 'hero-image', 
      name: 'Image Hero', 
      blocks: ['image', 'heading', 'text', 'button'], 
      description: 'Hero with featured image',
      niche: 'universal'
    },
  ],
  'product': [
    { 
      id: 'product-showcase', 
      name: 'Product Showcase', 
      blocks: ['heading', 'image', 'text', 'button'], 
      description: 'Feature your product',
      niche: 'universal'
    },
    { 
      id: 'product-features', 
      name: 'Feature List', 
      blocks: ['heading', 'accordion', 'button'], 
      description: 'List product features',
      niche: 'universal'
    },
    { 
      id: 'product-gallery', 
      name: 'Product Gallery', 
      blocks: ['heading', 'slider', 'text', 'button'], 
      description: 'Multiple product images',
      niche: 'universal'
    },
  ],
  'call-to-action': [
    { 
      id: 'cta-simple', 
      name: 'Simple CTA', 
      blocks: ['heading', 'text', 'button'], 
      description: 'Direct call to action',
      niche: 'universal'
    },
    { 
      id: 'cta-urgency', 
      name: 'Urgency CTA', 
      blocks: ['heading', 'countdown', 'button'], 
      description: 'Time-limited CTA',
      niche: 'universal'
    },
    { 
      id: 'cta-value', 
      name: 'Value Stack CTA', 
      blocks: ['heading', 'accordion', 'button'], 
      description: 'CTA with value breakdown',
      niche: 'universal'
    },
  ],
  'about-us': [
    { 
      id: 'about-founder', 
      name: 'Founder Story', 
      blocks: ['image', 'heading', 'text'], 
      description: 'Personal founder intro',
      niche: 'universal'
    },
    { 
      id: 'about-company', 
      name: 'Company About', 
      blocks: ['heading', 'text', 'logo-bar'], 
      description: 'Company introduction',
      niche: 'universal'
    },
    { 
      id: 'about-mission', 
      name: 'Mission Statement', 
      blocks: ['heading', 'text', 'image'], 
      description: 'Your mission and values',
      niche: 'universal'
    },
  ],
  'quiz': [
    { 
      id: 'quiz-single', 
      name: 'Single Question', 
      blocks: ['heading', 'quiz'], 
      description: 'Quick qualifier',
      niche: 'universal'
    },
    { 
      id: 'quiz-image', 
      name: 'Image Quiz', 
      blocks: ['heading', 'image-quiz'], 
      description: 'Visual selection quiz',
      niche: 'universal'
    },
    { 
      id: 'quiz-multi', 
      name: 'Multi-Step Quiz', 
      blocks: ['heading', 'text', 'quiz', 'button'], 
      description: 'Detailed qualifier',
      niche: 'universal'
    },
  ],
  'team': [
    { 
      id: 'team-single', 
      name: 'Team Member', 
      blocks: ['image', 'heading', 'text'], 
      description: 'Individual team bio',
      niche: 'universal'
    },
    { 
      id: 'team-grid', 
      name: 'Team Grid', 
      blocks: ['heading', 'image', 'text', 'image', 'text'], 
      description: 'Multiple team members',
      niche: 'universal'
    },
  ],
  'testimonials': [
    { 
      id: 'testimonial-single', 
      name: 'Single Testimonial', 
      blocks: ['heading', 'testimonial'], 
      description: 'Featured testimonial',
      niche: 'universal'
    },
    { 
      id: 'testimonial-multi', 
      name: 'Multiple Testimonials', 
      blocks: ['heading', 'testimonial', 'testimonial', 'testimonial'], 
      description: 'Social proof wall',
      niche: 'universal'
    },
    { 
      id: 'testimonial-video', 
      name: 'Video Testimonial', 
      blocks: ['heading', 'video', 'text'], 
      description: 'Video social proof',
      niche: 'universal'
    },
  ],
  'trust': [
    { 
      id: 'trust-logos', 
      name: 'Logo Bar', 
      blocks: ['heading', 'logo-bar'], 
      description: 'As seen in / partners',
      niche: 'universal'
    },
    { 
      id: 'trust-stats', 
      name: 'Trust Stats', 
      blocks: ['heading', 'social-proof'], 
      description: 'Key numbers and stats',
      niche: 'universal'
    },
    { 
      id: 'trust-full', 
      name: 'Full Trust Stack', 
      blocks: ['heading', 'social-proof', 'testimonial', 'logo-bar'], 
      description: 'Complete credibility',
      niche: 'universal'
    },
  ],
};

// Block visual previews - accurate representations matching actual blocks
function BlockPreview({ type }: { type: BlockType }) {
  const definition = blockDefinitions[type];
  const content = definition?.defaultContent as any;

  switch (type) {
    case 'heading':
      return (
        <div className="text-center">
          <div className="text-[9px] font-bold text-foreground leading-tight line-clamp-2">
            Your Headline Here
          </div>
        </div>
      );
    case 'text':
      return (
        <div className="text-[7px] text-muted-foreground text-center leading-tight line-clamp-2 px-1">
          Add your body text here. Click to edit...
        </div>
      );
    case 'image':
      return (
        <div className="w-full aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-md flex items-center justify-center">
          <div className="w-6 h-6 rounded bg-muted-foreground/20 flex items-center justify-center">
            <div className="w-3 h-3 border border-muted-foreground/40 rounded-sm" />
          </div>
        </div>
      );
    case 'video':
      return (
        <div className="w-full aspect-video bg-slate-900 rounded-md flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-l-[8px] border-l-primary border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md mx-auto w-fit text-[8px] font-medium">
          {content?.text || 'Get Started'}
        </div>
      );
    case 'divider':
      return <div className="h-px w-full bg-border my-2" />;
    case 'spacer':
      return (
        <div className="w-full h-6 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
          <div className="h-px w-6 bg-muted-foreground/20" />
        </div>
      );
    case 'form':
      return (
        <div className="space-y-1">
          <div className="h-4 w-full bg-background rounded border border-input flex items-center px-1.5">
            <span className="text-[5px] text-muted-foreground">Full Name</span>
          </div>
          <div className="h-4 w-full bg-background rounded border border-input flex items-center px-1.5">
            <span className="text-[5px] text-muted-foreground">Email</span>
          </div>
          <div className="h-5 bg-primary rounded flex items-center justify-center">
            <span className="text-[6px] text-primary-foreground font-medium">Submit</span>
          </div>
        </div>
      );
    case 'email-capture':
      return (
        <div className="flex gap-1">
          <div className="h-5 flex-1 bg-background rounded border border-input flex items-center px-1.5">
            <span className="text-[6px] text-muted-foreground truncate">Enter your email</span>
          </div>
          <div className="h-5 px-2 bg-primary rounded flex items-center">
            <span className="text-[6px] text-primary-foreground font-medium">Subscribe</span>
          </div>
        </div>
      );
    case 'phone-capture':
      return (
        <div className="flex gap-1">
          <div className="h-5 w-10 bg-background rounded border border-input flex items-center justify-center">
            <span className="text-[6px] text-muted-foreground">+1</span>
          </div>
          <div className="h-5 flex-1 bg-background rounded border border-input flex items-center px-1.5">
            <span className="text-[6px] text-muted-foreground truncate">Phone number</span>
          </div>
        </div>
      );
    case 'countdown':
      return (
        <div className="flex gap-1 justify-center">
          {['07', '23', '45', '12'].map((val, i) => (
            <div key={i} className="w-7 h-7 bg-primary/10 rounded flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-primary font-mono">{val}</span>
              <span className="text-[4px] text-muted-foreground uppercase">
                {['days', 'hrs', 'min', 'sec'][i]}
              </span>
            </div>
          ))}
        </div>
      );
    case 'quiz':
      return (
        <div className="space-y-1">
          <div className="text-[7px] font-medium text-foreground text-center">What best describes you?</div>
          <div className="space-y-0.5">
            {['Beginner', 'Intermediate', 'Advanced'].map((opt, i) => (
              <div key={i} className="h-4 w-full bg-background rounded border border-input flex items-center px-1.5 gap-1">
                <div className="w-2 h-2 rounded-full border border-muted-foreground/40" />
                <span className="text-[5px] text-muted-foreground">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'calendar':
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 21 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-sm ${i === 10 ? 'bg-primary' : 'bg-muted'}`} 
              />
            ))}
          </div>
          <div className="h-4 bg-primary rounded flex items-center justify-center">
            <span className="text-[5px] text-primary-foreground font-medium">Book Now</span>
          </div>
        </div>
      );
    case 'testimonial':
      return (
        <div className="bg-muted/50 rounded-lg p-2 space-y-1">
          <div className="text-[7px] text-muted-foreground italic text-center line-clamp-2">
            "This product changed my life..."
          </div>
          <div className="flex items-center justify-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary/30" />
            <span className="text-[6px] font-medium text-foreground">Sarah J.</span>
          </div>
        </div>
      );
    case 'accordion':
      return (
        <div className="space-y-0.5">
          {['What is this product?', 'How does it work?'].map((q, i) => (
            <div key={i} className="h-4 w-full bg-muted/50 rounded border border-border flex items-center justify-between px-1.5">
              <span className="text-[5px] text-foreground truncate">{q}</span>
              <span className="text-[8px] text-muted-foreground">▼</span>
            </div>
          ))}
        </div>
      );
    case 'logo-bar':
      return (
        <div className="space-y-1">
          <div className="text-[5px] text-muted-foreground text-center">Trusted by leading companies</div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-4 bg-muted rounded-sm" />
            ))}
          </div>
        </div>
      );
    case 'social-proof':
      return (
        <div className="flex justify-center gap-3">
          {[
            { val: '10,000+', label: 'Customers' },
            { val: '50+', label: 'Countries' },
            { val: '99%', label: 'Rating' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] font-bold text-primary">{item.val}</div>
              <div className="text-[5px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      );
    // New block previews
    case 'list':
      return (
        <div className="space-y-1 px-1">
          {['First list item', 'Second list item', 'Third list item'].map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-[6px] text-muted-foreground truncate">{item}</span>
            </div>
          ))}
        </div>
      );
    case 'slider':
      return (
        <div className="relative w-full aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-md flex items-center justify-center">
          <div className="w-6 h-6 rounded bg-muted-foreground/20 flex items-center justify-center">
            <div className="w-3 h-3 border border-muted-foreground/40 rounded-sm" />
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-background/80 flex items-center justify-center">
            <span className="text-[6px]">‹</span>
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-background/80 flex items-center justify-center">
            <span className="text-[6px]">›</span>
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
      );
    case 'graphic':
      return (
        <div className="flex items-center justify-center py-2">
          <span className="text-2xl">🚀</span>
        </div>
      );
    case 'webinar':
      return (
        <div className="space-y-1.5">
          <div className="w-full aspect-video bg-slate-900 rounded-md flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-primary border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
            </div>
          </div>
          <div className="h-4 bg-primary rounded flex items-center justify-center">
            <span className="text-[5px] text-primary-foreground font-medium">Register Now</span>
          </div>
        </div>
      );
    case 'loader':
      return (
        <div className="flex items-center justify-center py-2">
          <div className="relative w-10 h-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle 
                cx="16" cy="16" r="12" fill="none" 
                stroke="hsl(var(--primary))" strokeWidth="3" 
                strokeLinecap="round"
                strokeDasharray="75.4"
                strokeDashoffset="18.85"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-primary">75%</span>
          </div>
        </div>
      );
    case 'embed':
      return (
        <div className="flex flex-col items-center justify-center py-3 gap-1">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Code className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-[6px] text-muted-foreground">Custom Embed</span>
        </div>
      );
    // Interactive - Questions
    case 'multiple-choice':
      return (
        <div className="space-y-1">
          <div className="text-[7px] font-medium text-foreground text-center">Select all that apply</div>
          <div className="space-y-0.5">
            {['Option A', 'Option B', 'Option C'].map((opt, i) => (
              <div key={i} className="h-4 w-full bg-background rounded border border-input flex items-center px-1.5 gap-1">
                <div className={cn('w-2.5 h-2.5 rounded border', i === 0 ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
                  {i === 0 && <span className="text-[6px] text-primary-foreground flex items-center justify-center">✓</span>}
                </div>
                <span className="text-[5px] text-muted-foreground">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'choice':
      return (
        <div className="space-y-1">
          <div className="text-[7px] font-medium text-foreground text-center">Choose one</div>
          <div className="space-y-0.5">
            {['Option A', 'Option B', 'Option C'].map((opt, i) => (
              <div key={i} className="h-4 w-full bg-background rounded border border-input flex items-center px-1.5 gap-1">
                <div className={cn('w-2.5 h-2.5 rounded-full border', i === 0 ? 'border-primary' : 'border-muted-foreground/40')}>
                  {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary m-auto mt-[1px]" />}
                </div>
                <span className="text-[5px] text-muted-foreground">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'image-quiz':
      return (
        <div className="space-y-1">
          <div className="text-[6px] font-medium text-foreground text-center">Pick one</div>
          <div className="grid grid-cols-2 gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn('aspect-square rounded bg-muted border', i === 1 ? 'border-primary' : 'border-transparent')}>
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-muted-foreground/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'video-question':
      return (
        <div className="space-y-1">
          <div className="w-full aspect-video bg-slate-900 rounded-md flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[5px] border-l-primary border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            {['Yes', 'No'].map((opt, i) => (
              <div key={i} className="h-3 w-full bg-background rounded border border-input flex items-center px-1 gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full border border-muted-foreground/40" />
                <span className="text-[4px] text-muted-foreground">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );
    // Interactive - Forms
    case 'upload':
      return (
        <div className="flex flex-col items-center justify-center py-3 gap-1">
          <div className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-0.5">
            <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
              <span className="text-[8px]">↑</span>
            </div>
            <span className="text-[5px] text-muted-foreground">Upload file</span>
          </div>
        </div>
      );
    case 'message':
      return (
        <div className="space-y-1">
          <div className="text-[6px] font-medium text-foreground">Your Message</div>
          <div className="h-10 w-full bg-background rounded border border-input p-1">
            <div className="space-y-0.5">
              <div className="h-px w-full bg-muted-foreground/10" />
              <div className="h-px w-3/4 bg-muted-foreground/10" />
              <div className="h-px w-1/2 bg-muted-foreground/10" />
            </div>
          </div>
        </div>
      );
    case 'date-picker':
      return (
        <div className="space-y-1">
          <div className="text-[6px] font-medium text-foreground">Select date</div>
          <div className="h-6 w-full bg-background rounded border border-input flex items-center justify-between px-1.5">
            <span className="text-[5px] text-muted-foreground">Pick a date</span>
            <div className="w-3 h-3 flex items-center justify-center">
              <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      );
    case 'dropdown':
      return (
        <div className="space-y-1">
          <div className="text-[6px] font-medium text-foreground">Select option</div>
          <div className="h-6 w-full bg-background rounded border border-input flex items-center justify-between px-1.5">
            <span className="text-[5px] text-muted-foreground">Choose...</span>
            <span className="text-[6px] text-muted-foreground">▼</span>
          </div>
        </div>
      );
    case 'payment':
      return (
        <div className="space-y-1">
          <div className="text-center py-1 bg-muted/50 rounded">
            <span className="text-[10px] font-bold text-foreground">$99</span>
          </div>
          <div className="h-5 w-full bg-background rounded border border-input flex items-center px-1.5 gap-1">
            <div className="w-3 h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-sm" />
            <span className="text-[5px] text-muted-foreground">•••• •••• ••••</span>
          </div>
          <div className="h-4 bg-primary rounded flex items-center justify-center">
            <span className="text-[5px] text-primary-foreground font-medium">Pay Now</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-8 bg-muted rounded flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">{type}</span>
        </div>
      );
  }
}

// Section template preview - shows accurate block layout
function SectionTemplatePreview({ template }: { template: SectionTemplate }) {
  return (
    <div className="flex flex-col gap-1.5 p-2 h-full">
      {template.blocks.slice(0, 5).map((type, i) => (
        <div key={i} className="flex-shrink-0">
          <BlockPreview type={type} />
        </div>
      ))}
    </div>
  );
}

export function AddBlockModal({ isOpen, onClose }: AddBlockModalProps) {
  const { currentStepId, addBlock, addBlocks } = useFunnel();
  const [selectedCategory, setSelectedCategory] = useState('basic-blocks');

  // Reset to basic-blocks whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('basic-blocks');
    }
  }, [isOpen]);

  const handleAddBlock = (type: BlockType) => {
    if (currentStepId) {
      addBlock(currentStepId, type);
      onClose();
    }
  };

  const handleAddTemplate = (template: SectionTemplate) => {
    if (currentStepId) {
      addBlocks(currentStepId, template.blocks);
      onClose();
    }
  };

  // Get blocks for current category
  const getCurrentBlocks = (): BlockType[] => {
    const category = categories.find(c => c.id === selectedCategory);
    if (category) {
      // If category has subCategories, flatten all blocks from subCategories
      if (category.subCategories) {
        return category.subCategories.flatMap(sub => sub.blocks).filter(type => blockDefinitions[type]);
      }
      return category.blocks.filter(type => blockDefinitions[type]);
    }
    return [];
  };

  // Get sub-category info for Interactive section
  const getSubCategories = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return category?.subCategories || null;
  };

  const currentBlocks = getCurrentBlocks();
  const subCategories = getSubCategories();
  const isSection = !categories.find(c => c.id === selectedCategory);
  const currentTemplates = isSection ? sectionTemplates[selectedCategory] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-card">
        <VisuallyHidden>
          <DialogTitle>Add Block or Section</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-[500px]">
          {/* Left Navigation */}
          <div className="w-52 border-r border-border bg-muted/30 flex flex-col">
            {/* Block Categories */}
            <div className="p-2 space-y-0.5">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', category.iconBg)}>
                      <Icon className={cn('h-3.5 w-3.5', category.iconColor)} />
                    </div>
                    <span className="text-sm font-medium flex-1">{category.name}</span>
                    <ChevronRight className={cn(
                      'h-4 w-4 transition-transform',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </motion.button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="px-4 py-2">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Sections
              </div>
            </div>

            {/* Section Categories */}
            <div className="p-2 space-y-0.5 flex-1 overflow-y-auto">
              {sectionCategories.map((section) => {
                const Icon = section.icon;
                const isActive = selectedCategory === section.id;
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setSelectedCategory(section.id)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm">{section.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Content - Block/Section Grid */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  {categories.find(c => c.id === selectedCategory)?.name || 
                   sectionCategories.find(c => c.id === selectedCategory)?.name || 
                   'Select'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSection ? 'Choose a template to add multiple blocks' : 'Click to add to page'}
                </p>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isSection ? (
                // Section templates grid
                <div className="grid grid-cols-2 gap-3">
                  {currentTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      onClick={() => handleAddTemplate(template)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-muted/50 rounded-xl p-3 text-left border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="aspect-[4/3] bg-background rounded-lg overflow-hidden mb-3 border border-border/50 group-hover:border-primary/20 transition-colors">
                        <SectionTemplatePreview template={template} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{template.name}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {template.blocks.length} blocks
                          </span>
                        </div>
                        {template.description && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : subCategories ? (
                // Interactive category with sub-sections
                <div className="space-y-6">
                  {subCategories.map((subCat) => (
                    <div key={subCat.name}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {subCat.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {subCat.blocks.map((type) => {
                          const definition = blockDefinitions[type];
                          if (!definition) return null;
                          return (
                            <motion.button
                              key={type}
                              onClick={() => handleAddBlock(type)}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="bg-muted/50 rounded-xl p-4 text-left border border-border hover:border-primary/30 hover:shadow-md transition-all"
                            >
                              <div className="aspect-[4/3] bg-background rounded-lg p-3 mb-3 flex items-center justify-center border border-border/50">
                                <div className="w-full">
                                  <BlockPreview type={type} />
                                </div>
                              </div>
                              <span className="text-sm font-medium">{definition.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Regular block grid
                <div className="grid grid-cols-2 gap-3">
                  {currentBlocks.map((type) => {
                    const definition = blockDefinitions[type];
                    if (!definition) return null;
                    return (
                      <motion.button
                        key={type}
                        onClick={() => handleAddBlock(type)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-muted/50 rounded-xl p-4 text-left border border-border hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="aspect-[4/3] bg-background rounded-lg p-3 mb-3 flex items-center justify-center border border-border/50">
                          <div className="w-full">
                            <BlockPreview type={type} />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{definition.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
