/**
 * Section Templates - High-Converting Templates for Funnel Builder
 * Organized into clear categories for the unified Section Picker
 */

import type { CanvasNode } from '../types';

let sectionIdCounter = 5000;
function genId(prefix: string) {
  sectionIdCounter += 1;
  return `${prefix}-${sectionIdCounter}`;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'hero' | 'content' | 'cta' | 'media' | 'embed' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
  icon: string;
  createNode: () => CanvasNode;
}

// ============================================================================
// HERO SECTIONS (5 templates)
// Opening hooks - headline, subtext, CTA for high-ticket offers
// ============================================================================

export const heroImpact: SectionTemplate = {
  id: 'hero-impact',
  name: 'Impact Hero',
  description: 'Bold headline with urgency badge and CTA',
  category: 'hero',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: '🔥 Limited spots available', variant: 'urgent' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Transform Your Business in 90 Days', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Join 500+ entrepreneurs who scaled to 6-figures using our proven system.' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 24 },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Apply Now →', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const heroVideo: SectionTemplate = {
  id: 'hero-video',
  name: 'Video Hero',
  description: 'VSL player with headline below',
  category: 'hero',
  icon: 'play',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('video'),
        type: 'video_embed',
        props: { url: '', placeholder: 'Add your VSL video URL' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 20 },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Watch: How We Help Coaches Scale', level: 'h2' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Book Your Strategy Call', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const heroAuthority: SectionTemplate = {
  id: 'hero-authority',
  name: 'Authority Hero',
  description: 'Photo with credentials and headline',
  category: 'hero',
  icon: 'user',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Expert photo', width: 120, height: 120, rounded: true },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Hi, I\'m [Your Name]', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'I\'ve helped 1,000+ coaches build 6 and 7-figure businesses. Let me show you how.' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Work With Me', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const heroMinimal: SectionTemplate = {
  id: 'hero-minimal',
  name: 'Minimal Hero',
  description: 'Clean text-only with CTA',
  category: 'hero',
  icon: 'type',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Your headline here', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'A compelling subtext that supports your headline and drives action.' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 24 },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get Started', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const heroSplit: SectionTemplate = {
  id: 'hero-split',
  name: 'Split Hero',
  description: 'Image left, text right layout',
  category: 'hero',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero-card' },
    children: [
      {
        id: genId('card'),
        type: 'content_card',
        props: { backgroundColor: '#ffffff', borderRadius: 20, shadow: true, padding: 0 },
        children: [
          {
            id: genId('image'),
            type: 'image',
            props: { src: '', alt: 'Hero image', aspectRatio: '16:9' },
            children: [],
          },
          {
            id: genId('body'),
            type: 'section',
            props: { variant: 'content', padding: 28, gap: 14 },
            children: [
              {
                id: genId('heading'),
                type: 'heading',
                props: { text: 'Achieve More in Less Time', level: 'h1' },
                children: [],
              },
              {
                id: genId('paragraph'),
                type: 'paragraph',
                props: { text: 'Our tailored approach helps you reach your goals faster.' },
                children: [],
              },
              {
                id: genId('button'),
                type: 'cta_button',
                props: { label: 'Learn More', variant: 'primary', fullWidth: false },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  }),
};

// ============================================================================
// CONTENT SECTIONS (2 templates)
// Text blocks and feature explanations
// ============================================================================

export const contentText: SectionTemplate = {
  id: 'content-text',
  name: 'Text Block',
  description: 'Simple paragraph content',
  category: 'content',
  icon: 'align-left',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Add your content here. This is a simple text section for longer form content that explains your offer in detail.' },
        children: [],
      },
    ],
  }),
};

export const contentHeadingText: SectionTemplate = {
  id: 'content-heading-text',
  name: 'Heading + Text',
  description: 'Section with title and body',
  category: 'content',
  icon: 'text',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Section Title', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Explain your offer, methodology, or value proposition in detail here.' },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// CTA SECTIONS (3 templates)
// Conversion-focused call-to-action sections
// ============================================================================

export const ctaSimple: SectionTemplate = {
  id: 'cta-simple',
  name: 'Simple CTA',
  description: 'Button only',
  category: 'cta',
  icon: 'mouse-pointer-click',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta' },
    children: [
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Continue', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const ctaUrgency: SectionTemplate = {
  id: 'cta-urgency',
  name: 'CTA + Urgency',
  description: 'Button with scarcity text',
  category: 'cta',
  icon: 'clock',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta' },
    children: [
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Claim Your Spot', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 12 },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: '⏰ Only 5 spots left this week', variant: 'small', align: 'center' },
        children: [],
      },
    ],
  }),
};

export const ctaDual: SectionTemplate = {
  id: 'cta-dual',
  name: 'Dual CTA',
  description: 'Primary and secondary options',
  category: 'cta',
  icon: 'mouse-pointer-click',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta' },
    children: [
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Yes, I Want This', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 12 },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Not right now', variant: 'ghost', action: 'dismiss' },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// MEDIA SECTIONS (2 templates)
// Video and image content
// ============================================================================

export const mediaVideo: SectionTemplate = {
  id: 'media-video',
  name: 'Video',
  description: 'Embedded video player',
  category: 'media',
  icon: 'play',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'media' },
    children: [
      {
        id: genId('video'),
        type: 'video_embed',
        props: { url: '', placeholder: 'Paste your video URL' },
        children: [],
      },
    ],
  }),
};

export const mediaImage: SectionTemplate = {
  id: 'media-image',
  name: 'Image',
  description: 'Full-width image',
  category: 'media',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'media' },
    children: [
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Image description' },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// EMBED SECTIONS (2 templates)
// Calendar embeds and widgets
// ============================================================================

export const embedCalendar: SectionTemplate = {
  id: 'embed-calendar',
  name: 'Calendar Embed',
  description: 'Calendly, Cal.com, or similar',
  category: 'embed',
  icon: 'calendar',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'embed' },
    children: [
      {
        id: genId('calendar'),
        type: 'calendar_embed',
        props: { url: '', placeholder: 'Paste your Calendly or Cal.com link' },
        children: [],
      },
    ],
  }),
};

export const embedEmpty: SectionTemplate = {
  id: 'embed-empty',
  name: 'Custom Embed',
  description: 'Empty container for any widget',
  category: 'embed',
  icon: 'code',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'embed' },
    children: [],
  }),
};

// ============================================================================
// SOCIAL PROOF SECTIONS (4 templates)
// Trust indicators and credibility builders
// ============================================================================

export const socialProofStars: SectionTemplate = {
  id: 'social-stars',
  name: 'Star Rating',
  description: '5-star rating with review count',
  category: 'social_proof',
  icon: 'star',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content', align: 'center' },
    children: [
      {
        id: genId('info'),
        type: 'rating_display',
        props: { rating: 5, count: 127, source: 'Google Reviews' },
        children: [],
      },
    ],
  }),
};

export const socialProofLogos: SectionTemplate = {
  id: 'social-logos',
  name: 'Logo Bar',
  description: '"As seen in" brand logos',
  category: 'social_proof',
  icon: 'building',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content', align: 'center' },
    children: [
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'As seen in', variant: 'small', align: 'center' },
        children: [],
      },
      {
        id: genId('logos'),
        type: 'logo_bar',
        props: { logos: [], grayscale: true },
        children: [],
      },
    ],
  }),
};

export const socialProofStats: SectionTemplate = {
  id: 'social-stats',
  name: 'Results Stats',
  description: '3-column achievement numbers',
  category: 'social_proof',
  icon: 'trending-up',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('stats'),
        type: 'stats_grid',
        props: {
          items: [
            { value: '$10M+', label: 'Revenue Generated' },
            { value: '500+', label: 'Happy Clients' },
            { value: '97%', label: 'Success Rate' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const socialProofBadges: SectionTemplate = {
  id: 'social-badges',
  name: 'Trust Badges',
  description: 'Guarantee and security icons',
  category: 'social_proof',
  icon: 'shield-check',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('info'),
        type: 'info_card',
        props: {
          items: [
            { icon: '✓', text: '100% Money-Back Guarantee' },
            { icon: '🔒', text: 'Your data is secure' },
            { icon: '⚡', text: 'Instant access' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// FEATURES SECTIONS (2 templates)
// Benefits and what's included
// ============================================================================

export const featuresList: SectionTemplate = {
  id: 'features-list',
  name: 'Features List',
  description: 'Benefits with checkmarks',
  category: 'features',
  icon: 'check-circle',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What\'s Included', level: 'h2' },
        children: [],
      },
      {
        id: genId('info'),
        type: 'info_card',
        props: {
          items: [
            { icon: '✓', text: 'Weekly 1-on-1 coaching calls' },
            { icon: '✓', text: 'Private community access' },
            { icon: '✓', text: 'Done-for-you templates' },
            { icon: '✓', text: 'Lifetime updates' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const featuresGrid: SectionTemplate = {
  id: 'features-grid',
  name: 'Features Grid',
  description: '3-column benefit cards',
  category: 'features',
  icon: 'grid',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Why Choose Us', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          items: [
            { icon: '🚀', title: 'Fast Results', description: 'See improvements in just 30 days' },
            { icon: '💎', title: 'Premium Quality', description: 'Enterprise-grade solutions' },
            { icon: '🎯', title: 'Proven System', description: 'Battle-tested methodology' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// TESTIMONIALS SECTIONS (2 templates)
// Customer quotes and success stories
// ============================================================================

export const testimonialSingle: SectionTemplate = {
  id: 'testimonial-single',
  name: 'Single Testimonial',
  description: 'Quote with photo and name',
  category: 'testimonials',
  icon: 'quote',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content', align: 'center' },
    children: [
      {
        id: genId('testimonial'),
        type: 'testimonial_card',
        props: {
          quote: '"This program completely transformed my business. I went from struggling to $50K months in just 90 days."',
          author: 'Sarah M.',
          title: 'Agency Owner',
          image: '',
        },
        children: [],
      },
    ],
  }),
};

export const testimonialCarousel: SectionTemplate = {
  id: 'testimonial-carousel',
  name: 'Testimonial Stack',
  description: 'Multiple success stories',
  category: 'testimonials',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What Our Clients Say', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('testimonials'),
        type: 'testimonial_stack',
        props: {
          items: [
            { quote: '"Game-changing program!"', author: 'John D.', title: 'Coach' },
            { quote: '"Best investment I ever made."', author: 'Lisa K.', title: 'Consultant' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// FAQ SECTION (1 template)
// Common questions and answers
// ============================================================================

export const faqSection: SectionTemplate = {
  id: 'faq-accordion',
  name: 'FAQ Accordion',
  description: 'Expandable Q&A list',
  category: 'faq',
  icon: 'help-circle',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Frequently Asked Questions', level: 'h2' },
        children: [],
      },
      {
        id: genId('faq'),
        type: 'faq_accordion',
        props: {
          items: [
            { question: 'How long does it take to see results?', answer: 'Most clients see significant improvements within 30 days.' },
            { question: 'Is there a money-back guarantee?', answer: 'Yes! We offer a 30-day 100% money-back guarantee.' },
            { question: 'What if I have questions?', answer: 'Our support team is available 24/7 via chat and email.' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// TEAM SECTION (1 template)
// About and team introduction
// ============================================================================

export const teamSection: SectionTemplate = {
  id: 'team-intro',
  name: 'Team Intro',
  description: 'About the founders/team',
  category: 'team',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'content', align: 'center' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet Your Coach', level: 'h2' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team photo', width: 100, height: 100, rounded: true },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'With over 10 years of experience helping entrepreneurs scale, I\'ve developed a proven system that works.' },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// EXPORTS - All templates organized for the Section Picker
// ============================================================================

export const allSectionTemplates: SectionTemplate[] = [
  // Hero (5)
  heroImpact,
  heroVideo,
  heroAuthority,
  heroMinimal,
  heroSplit,
  // Content (2)
  contentText,
  contentHeadingText,
  // CTA (3)
  ctaSimple,
  ctaUrgency,
  ctaDual,
  // Media (2)
  mediaVideo,
  mediaImage,
  // Embed (2)
  embedCalendar,
  embedEmpty,
  // Social Proof (4)
  socialProofStars,
  socialProofLogos,
  socialProofStats,
  socialProofBadges,
  // Features (2)
  featuresList,
  featuresGrid,
  // Testimonials (2)
  testimonialSingle,
  testimonialCarousel,
  // FAQ (1)
  faqSection,
  // Team (1)
  teamSection,
];

export const sectionTemplatesByCategory = {
  hero: [heroImpact, heroVideo, heroAuthority, heroMinimal, heroSplit],
  content: [contentText, contentHeadingText],
  cta: [ctaSimple, ctaUrgency, ctaDual],
  media: [mediaVideo, mediaImage],
  embed: [embedCalendar, embedEmpty],
  social_proof: [socialProofStars, socialProofLogos, socialProofStats, socialProofBadges],
  features: [featuresList, featuresGrid],
  testimonials: [testimonialSingle, testimonialCarousel],
  faq: [faqSection],
  team: [teamSection],
};

export const categoryLabels: Record<string, string> = {
  hero: 'Hero',
  content: 'Content',
  cta: 'Call to Action',
  media: 'Media',
  embed: 'Embed',
  social_proof: 'Social Proof',
  features: 'Features',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  team: 'Team',
};

export const categoryDescriptions: Record<string, string> = {
  hero: 'Opening sections that hook visitors',
  content: 'Text and information blocks',
  cta: 'Conversion buttons and actions',
  media: 'Video and image content',
  embed: 'Calendars and external widgets',
  social_proof: 'Trust indicators and credibility',
  features: 'Benefits and what\'s included',
  testimonials: 'Customer success stories',
  faq: 'Common questions answered',
  team: 'About and introductions',
};

export const categoryIcons: Record<string, string> = {
  hero: 'layout',
  content: 'type',
  cta: 'mouse-pointer-click',
  media: 'play',
  embed: 'calendar',
  social_proof: 'star',
  features: 'package',
  testimonials: 'quote',
  faq: 'help-circle',
  team: 'users',
};
