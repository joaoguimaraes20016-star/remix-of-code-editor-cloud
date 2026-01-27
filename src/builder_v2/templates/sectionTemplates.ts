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
  category: 'hero' | 'content' | 'cta' | 'embed' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
  icon: string;
  createNode: () => CanvasNode;
}

// ============================================================================
// HERO SECTIONS (8 templates) - Perspective-Style
// Clean, light-themed hero sections matching modern SaaS landing pages
// ============================================================================

export const heroSimple: SectionTemplate = {
  id: 'hero-simple',
  name: 'Hero Simple',
  description: 'Centered headline with image below',
  category: 'hero',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Success with Less Effort', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'With our tailored solutions, you will reach your goals faster than ever before.' },
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
        props: { label: 'Learn more now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 24 },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Hero image', aspectRatio: '16:9' },
        children: [],
      },
    ],
  }),
};

export const heroReviews: SectionTemplate = {
  id: 'hero-reviews',
  name: 'Hero + Reviews',
  description: 'With avatar stack and star rating',
  category: 'hero',
  icon: 'star',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Success with Less Effort', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'With our tailored solutions, you will reach your goals faster than ever before.' },
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
        props: { label: 'Learn more now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 16 },
        children: [],
      },
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 4.8, count: 148, source: 'reviews' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 24 },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Hero image', aspectRatio: '16:9' },
        children: [],
      },
    ],
  }),
};

export const heroLogos: SectionTemplate = {
  id: 'hero-logos',
  name: 'Hero + Logos',
  description: 'With trusted-by company logos',
  category: 'hero',
  icon: 'building',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Success with Less Effort', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'With our tailored solutions, you will reach your goals faster than ever before.' },
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
        props: { label: 'Learn more now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 32 },
        children: [],
      },
      {
        id: genId('logos'),
        type: 'logo_bar',
        props: { logos: ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'] },
        children: [],
      },
    ],
  }),
};

export const heroSplit: SectionTemplate = {
  id: 'hero-split',
  name: 'Hero Split',
  description: 'Text left, image right layout',
  category: 'hero',
  icon: 'columns',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Success with Less Effort', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'With our tailored solutions, you will reach your goals faster than ever before.' },
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
        props: { label: 'Learn more now', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('logos'),
        type: 'logo_bar',
        props: { logos: ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'] },
        children: [],
      },
    ],
  }),
};

export const heroFormCard: SectionTemplate = {
  id: 'hero-form-card',
  name: 'Hero + Form Card',
  description: 'Split layout with floating form',
  category: 'hero',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero-form' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Secure Your Exclusive Bundle Now', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Get access to our premium package with limited-time bonuses.' },
        children: [],
      },
      {
        id: genId('form'),
        type: 'form_group',
        props: { 
          fields: [
            { type: 'text', placeholder: 'Name', required: true },
            { type: 'email', placeholder: 'E-Mail', required: true },
            { type: 'tel', placeholder: 'Phone' }
          ]
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get your bundle now', variant: 'primary', action: 'next', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const heroInlineForm: SectionTemplate = {
  id: 'hero-inline-form',
  name: 'Hero + Inline Form',
  description: 'Integrated form inputs with CTA',
  category: 'hero',
  icon: 'form-input',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero-form' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Secure Your Exclusive Bundle Now', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Get access to our premium package with limited-time bonuses.' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 16 },
        children: [],
      },
      {
        id: genId('input'),
        type: 'form_input',
        props: { placeholder: 'E-Mail', type: 'email' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 12 },
        children: [],
      },
      {
        id: genId('input'),
        type: 'form_input',
        props: { placeholder: 'Phone', type: 'tel' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 16 },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get your bundle now', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const heroGradient: SectionTemplate = {
  id: 'hero-gradient',
  name: 'Hero Gradient',
  description: 'Soft gradient background with logos',
  category: 'hero',
  icon: 'palette',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero', background: 'gradient' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get Your Exclusive Discount Today', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Join thousands who have already transformed their business with our proven system.' },
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
        props: { label: 'Learn more now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 32 },
        children: [],
      },
      {
        id: genId('logos'),
        type: 'logo_bar',
        props: { logos: ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'] },
        children: [],
      },
    ],
  }),
};

export const heroDark: SectionTemplate = {
  id: 'hero-dark',
  name: 'Hero Dark',
  description: 'Dark background with light text',
  category: 'hero',
  icon: 'moon',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'hero', background: 'dark' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get Your Exclusive Discount Today', level: 'h1', color: 'white' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Join thousands who have already transformed their business with our proven system.', color: 'white' },
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
        props: { label: 'Learn more now', variant: 'outline', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 24 },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Hero image', aspectRatio: '16:9' },
        children: [],
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
// CTA SECTIONS (10 templates) - Perspective-Style
// Clean, light-themed conversion sections matching modern SaaS landing pages
// ============================================================================

export const ctaSimple: SectionTemplate = {
  id: 'cta-simple',
  name: 'Simple CTA',
  description: 'Centered title, subtext and button',
  category: 'cta',
  icon: 'mouse-pointer-click',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount now!', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer and transform your business today.' },
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
        props: { label: 'Get Discount Now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const ctaGrayCard: SectionTemplate = {
  id: 'cta-gray-card',
  name: 'Gray Card CTA',
  description: 'Card on gray background',
  category: 'cta',
  icon: 'square',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta', background: 'gray' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount now!', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer and transform your business today.' },
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
        props: { label: 'Get Discount Now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const ctaDarkReviews: SectionTemplate = {
  id: 'cta-dark-reviews',
  name: 'Dark + Reviews',
  description: 'Dark background with social proof',
  category: 'cta',
  icon: 'star',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta', background: 'dark' },
    children: [
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 200, source: 'satisfied customers' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount now!', level: 'h2', color: 'white' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer and transform your business today.', color: 'white' },
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
        props: { label: 'Get Discount Now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const ctaDarkCard: SectionTemplate = {
  id: 'cta-dark-card',
  name: 'Dark + Card',
  description: 'Dark background with inset card',
  category: 'cta',
  icon: 'moon',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta', background: 'dark' },
    children: [
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 200, source: 'satisfied customers' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 16 },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get Discount Now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
    ],
  }),
};

export const ctaGradientLogos: SectionTemplate = {
  id: 'cta-gradient-logos',
  name: 'Gradient + Logos',
  description: 'Gradient background with trusted logos',
  category: 'cta',
  icon: 'palette',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta', background: 'gradient' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount now!', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer and transform your business today.' },
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
        props: { label: 'Get Discount Now', variant: 'primary', action: 'next', size: 'lg' },
        children: [],
      },
      {
        id: genId('spacer'),
        type: 'spacer',
        props: { height: 32 },
        children: [],
      },
      {
        id: genId('logos'),
        type: 'logo_bar',
        props: { logos: ['Coca-Cola', 'Zalando', 'Braun', 'IKEA', 'Sony'] },
        children: [],
      },
    ],
  }),
};

export const ctaFormSplitReviews: SectionTemplate = {
  id: 'cta-form-split-reviews',
  name: 'Form Split + Reviews',
  description: 'Text with reviews left, form right',
  category: 'cta',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Leads.\nMore Time.\nMore Business.', level: 'h1' },
        children: [],
      },
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 5000, source: 'companies trust us' },
        children: [],
      },
      {
        id: genId('form'),
        type: 'form_group',
        props: {
          fields: [
            { type: 'text', placeholder: 'Name', required: true },
            { type: 'email', placeholder: 'E-Mail', required: true },
            { type: 'tel', placeholder: 'Phone' }
          ]
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: '14-day free trial', variant: 'primary', action: 'next', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const ctaFormSplitSimple: SectionTemplate = {
  id: 'cta-form-split-simple',
  name: 'Form Split Simple',
  description: 'Text left, form right',
  category: 'cta',
  icon: 'form-input',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'More Leads.\nMore Time.\nMore Business.', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Start your journey to success today with our proven system.' },
        children: [],
      },
      {
        id: genId('form'),
        type: 'form_group',
        props: {
          fields: [
            { type: 'text', placeholder: 'Name', required: true },
            { type: 'email', placeholder: 'E-Mail', required: true },
            { type: 'tel', placeholder: 'Phone' }
          ]
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: '14-day free trial', variant: 'primary', action: 'next', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const ctaSplitForm: SectionTemplate = {
  id: 'cta-split-form',
  name: 'Split Form',
  description: 'Title left, form with privacy right',
  category: 'cta',
  icon: 'columns',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount!', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer today.' },
        children: [],
      },
      {
        id: genId('form'),
        type: 'form_group',
        props: {
          fields: [
            { type: 'text', placeholder: 'Name', required: true },
            { type: 'email', placeholder: 'E-Mail', required: true }
          ]
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get non-binding offer', variant: 'primary', action: 'next', fullWidth: true },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We treat your data confidentially.', variant: 'small', align: 'center' },
        children: [],
      },
    ],
  }),
};

export const ctaFaq: SectionTemplate = {
  id: 'cta-faq',
  name: 'CTA + FAQ',
  description: 'Title and button left, FAQ right',
  category: 'cta',
  icon: 'help-circle',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get your exclusive discount!', level: 'h1' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Take advantage of our limited-time offer today.' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get non-binding offer', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('faq'),
        type: 'faq_accordion',
        props: {
          items: [
            { question: 'Is the offer non-binding?', answer: 'Yes, the offer you receive is completely free and non-binding.' },
            { question: 'How long does it take?', answer: 'You will receive your personalized offer within 24 hours.' },
          ]
        },
        children: [],
      },
    ],
  }),
};

export const ctaDual: SectionTemplate = {
  id: 'cta-dual',
  name: 'Dual CTA',
  description: 'Primary and secondary buttons',
  category: 'cta',
  icon: 'mouse-pointer-click',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'cta' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Ready to get started?', level: 'h2' },
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
// FEATURES SECTIONS (8 templates) - Perspective-Style
// Clean, light-themed feature sections matching modern SaaS landing pages
// ============================================================================

export const featuresSplitChecklist: SectionTemplate = {
  id: 'features-split-checklist',
  name: 'Split + Checklist',
  description: 'Text left, checklist right',
  category: 'features',
  icon: 'check-circle',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Customer Satisfaction', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Our customers report exceptional experiences with our comprehensive service approach.' },
        children: [],
      },
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 200, source: 'reviews' },
        children: [],
      },
      {
        id: genId('info'),
        type: 'info_card',
        props: {
          items: [
            { icon: '✓', text: 'Easy operation' },
            { icon: '✓', text: 'Real-time data' },
            { icon: '✓', text: 'Customizable' },
          ],
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Learn more', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const featuresSplitImage: SectionTemplate = {
  id: 'features-split-image',
  name: 'Split + Image',
  description: 'Text left, image right',
  category: 'features',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Customer Service', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Experience seamless support that meets your business needs at every level of growth.' },
        children: [],
      },
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 200, source: 'reviews' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Feature image', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

export const featuresSplitIcons: SectionTemplate = {
  id: 'features-split-icons',
  name: 'Split + Icons',
  description: 'Image left, icon features right',
  category: 'features',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-split-reverse' },
    children: [
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Feature image', aspectRatio: '4:3' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Exclusive Analyses', level: 'h2' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          items: [
            { icon: '📊', title: 'Industry Reports', description: 'Detailed market analysis' },
            { icon: '📈', title: 'Forecasts', description: 'Data-driven predictions' },
            { icon: '🎯', title: 'Strategies', description: 'Actionable recommendations' },
          ],
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Get Analysis', variant: 'primary', action: 'next' },
        children: [],
      },
    ],
  }),
};

export const features3ColCards: SectionTemplate = {
  id: 'features-3col-cards',
  name: '3-Column Cards',
  description: 'Three image cards with descriptions',
  category: 'features',
  icon: 'grid',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-centered' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Our Services', variant: 'label', align: 'center', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'These Are Your Advantages with Us', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Secure Offer Now', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          columns: 3,
          items: [
            { image: '', title: 'Fast Implementation', description: 'Quick and efficient setup process' },
            { image: '', title: 'Personal Consultation', description: 'One-on-one expert guidance' },
            { image: '', title: 'Cost-Effective Solutions', description: 'Maximum value for your investment' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const features4ColIcons: SectionTemplate = {
  id: 'features-4col-icons',
  name: '4-Column Icons',
  description: '2x2 grid of icon features',
  category: 'features',
  icon: 'grid-2x2',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-centered' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Our Services', variant: 'label', align: 'center', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'These Are Your Advantages with Us', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Secure Offer Now', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          columns: 2,
          items: [
            { icon: '🔗', title: 'Easy Integration', description: 'Seamless connection with your systems' },
            { icon: '⚡', title: 'Immediate Start', description: 'Get up and running instantly' },
            { icon: '📞', title: 'Personal Support', description: '24/7 dedicated assistance' },
            { icon: '💡', title: 'Customized Strategies', description: 'Tailored to your needs' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const features2ColIcons: SectionTemplate = {
  id: 'features-2col-icons',
  name: '2-Column + Icons',
  description: 'Image cards with icon features below',
  category: 'features',
  icon: 'columns',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-centered' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Our Services', variant: 'label', align: 'center', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'These Are Your Advantages', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Secure Offer Now', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          columns: 2,
          items: [
            { image: '', title: 'Fast Implementation', description: 'Quick setup' },
            { image: '', title: 'Personal Consultation', description: 'Expert guidance' },
          ],
        },
        children: [],
      },
      {
        id: genId('icons'),
        type: 'feature_grid',
        props: {
          columns: 4,
          items: [
            { icon: '🔗', title: 'Integration' },
            { icon: '📞', title: 'Support' },
            { icon: '⚡', title: 'Fast Start' },
            { icon: '💡', title: 'Strategies' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const featuresGrayImage: SectionTemplate = {
  id: 'features-gray-image',
  name: 'Gray BG + Image',
  description: 'Icon list with device image',
  category: 'features',
  icon: 'smartphone',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-gray' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Our Services', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Real-Time Analytics', level: 'h2' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          items: [
            { icon: '⚡', title: 'Quick Operation', description: 'Fast data processing' },
            { icon: '📊', title: 'Real-Time Data', description: 'Live insights' },
            { icon: '📱', title: 'Interactive Dashboards', description: 'Visual analytics' },
          ],
        },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Device mockup', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

export const featuresGrayReviews: SectionTemplate = {
  id: 'features-gray-reviews',
  name: 'Gray BG + Reviews',
  description: 'Text with reviews and image',
  category: 'features',
  icon: 'star',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'features-gray' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Our Services', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Real-Time Analytics', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Experience powerful analytics that transform your data into actionable business insights.' },
        children: [],
      },
      {
        id: genId('rating'),
        type: 'rating_display',
        props: { rating: 5.0, count: 200, source: 'reviews' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Feature image', aspectRatio: '4:3' },
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
  // Hero (8)
  heroSimple,
  heroReviews,
  heroLogos,
  heroSplit,
  heroFormCard,
  heroInlineForm,
  heroGradient,
  heroDark,
  // Content (2)
  contentText,
  contentHeadingText,
  // CTA (10)
  ctaSimple,
  ctaGrayCard,
  ctaDarkReviews,
  ctaDarkCard,
  ctaGradientLogos,
  ctaFormSplitReviews,
  ctaFormSplitSimple,
  ctaSplitForm,
  ctaFaq,
  ctaDual,
  // Embed (2)
  embedCalendar,
  embedEmpty,
  // Social Proof (4)
  socialProofStars,
  socialProofLogos,
  socialProofStats,
  socialProofBadges,
  // Features (8)
  featuresSplitChecklist,
  featuresSplitImage,
  featuresSplitIcons,
  features3ColCards,
  features4ColIcons,
  features2ColIcons,
  featuresGrayImage,
  featuresGrayReviews,
  // Testimonials (2)
  testimonialSingle,
  testimonialCarousel,
  // FAQ (1)
  faqSection,
  // Team (1)
  teamSection,
];

export const sectionTemplatesByCategory = {
  hero: [heroSimple, heroReviews, heroLogos, heroSplit, heroFormCard, heroInlineForm, heroGradient, heroDark],
  content: [contentText, contentHeadingText],
  cta: [ctaSimple, ctaGrayCard, ctaDarkReviews, ctaDarkCard, ctaGradientLogos, ctaFormSplitReviews, ctaFormSplitSimple, ctaSplitForm, ctaFaq, ctaDual],
  embed: [embedCalendar, embedEmpty],
  social_proof: [socialProofStars, socialProofLogos, socialProofStats, socialProofBadges],
  features: [featuresSplitChecklist, featuresSplitImage, featuresSplitIcons, features3ColCards, features4ColIcons, features2ColIcons, featuresGrayImage, featuresGrayReviews],
  testimonials: [testimonialSingle, testimonialCarousel],
  faq: [faqSection],
  team: [teamSection],
};

export const categoryLabels: Record<string, string> = {
  hero: 'Hero',
  content: 'Content',
  cta: 'Call to Action',
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
  embed: 'calendar',
  social_proof: 'star',
  features: 'package',
  testimonials: 'quote',
  faq: 'help-circle',
  team: 'users',
};
