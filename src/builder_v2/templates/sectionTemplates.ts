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
  category: 'hero' | 'content' | 'cta' | 'about_us' | 'quiz_form' | 'social_proof' | 'features' | 'testimonials' | 'team' | 'faq';
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
// ABOUT US SECTIONS (9 templates)
// Company info, contact, and team sections
// ============================================================================

export const aboutSplitIcons: SectionTemplate = {
  id: 'about-split-icons',
  name: 'About + Icon Features',
  description: 'Image left, icon features right',
  category: 'about_us',
  icon: 'sparkles',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team workspace', aspectRatio: '4:3' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'A smart future.', level: 'h2' },
        children: [],
      },
      {
        id: genId('features'),
        type: 'feature_list',
        props: {
          items: [
            { icon: 'sparkles', title: 'Innovation', description: 'Cutting-edge technologies for modern manufacturing' },
            { icon: 'zap', title: 'Efficiency', description: 'Automated systems that optimize production' },
            { icon: 'leaf', title: 'Sustainability', description: 'Optimized use of resources and energy' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const aboutSplitFaq: SectionTemplate = {
  id: 'about-split-faq',
  name: 'About + FAQ',
  description: 'FAQ left, image right',
  category: 'about_us',
  icon: 'help-circle',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Our company', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Learn how we are transforming the industry with innovative solutions.' },
        children: [],
      },
      {
        id: genId('faq'),
        type: 'faq_list',
        props: {
          items: [
            { question: 'How do we promote innovation?', answer: 'Our technologies enable next-generation automation.' },
            { question: 'Which industries do we serve?', answer: 'We work across manufacturing, logistics, and more.' },
            { question: 'How safe are our solutions?', answer: 'Safety is built into every system we design.' },
          ],
        },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Office interior', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

export const aboutFullImage: SectionTemplate = {
  id: 'about-full-image',
  name: 'About Full Image',
  description: 'Centered title with full-width image',
  category: 'about_us',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about', align: 'center' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'This is us', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Learn more about our company', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We want to show you how we are transforming the manufacturing sector with advanced robotics and intelligent automation.', align: 'center' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team photo', aspectRatio: '16:9', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const aboutLogos: SectionTemplate = {
  id: 'about-logos',
  name: 'About + Logos',
  description: 'Centered with partner logos',
  category: 'about_us',
  icon: 'building',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about', align: 'center' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Learn more about our company', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We want to show you how we are transforming the industry with advanced solutions.', align: 'center' },
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

export const about2ColText: SectionTemplate = {
  id: 'about-2col-text',
  name: 'About 2-Column Text',
  description: 'Two-column text layout',
  category: 'about_us',
  icon: 'columns',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'About us', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We want to show you how we are transforming the manufacturing sector with advanced robotics and intelligent automation.' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Our mission is to improve manufacturing through cutting-edge technologies that increase efficiency while reducing environmental impact.' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We develop tailor-made solutions perfectly tailored to the individual needs and requirements of our customers.' },
        children: [],
      },
    ],
  }),
};

export const aboutSplitImage: SectionTemplate = {
  id: 'about-split-image',
  name: 'About Split + Image',
  description: 'Text left, image right',
  category: 'about_us',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Learn more about our company', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'We want to show you how we are transforming the manufacturing sector with advanced robotics and intelligent automation.' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Our mission is to improve the manufacturing sector through cutting-edge technologies that increase efficiency while reducing environmental impact.' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Office interior', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

export const aboutContactInfo: SectionTemplate = {
  id: 'about-contact-info',
  name: 'Contact Info',
  description: 'Contact details with icons',
  category: 'about_us',
  icon: 'mail',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'This is us', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Contact us.', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'State-of-the-art technologies and innovative solutions optimize the manufacturing process.' },
        children: [],
      },
      {
        id: genId('contact'),
        type: 'contact_info',
        props: {
          items: [
            { icon: 'mail', label: 'E-Mail', value: 'contact@company.com' },
            { icon: 'phone', label: 'Phone', value: '+1 234 567 890' },
            { icon: 'map-pin', label: 'Location', value: '123 Business Street' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const aboutContactImage: SectionTemplate = {
  id: 'about-contact-image',
  name: 'Contact + Image',
  description: 'Contact info with building image',
  category: 'about_us',
  icon: 'building',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'This is us', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Contact us.', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'State-of-the-art technologies and innovative solutions.' },
        children: [],
      },
      {
        id: genId('contact'),
        type: 'contact_info',
        props: {
          items: [
            { icon: 'mail', label: 'E-Mail', value: 'contact@company.com' },
            { icon: 'phone', label: 'Phone', value: '+1 234 567 890' },
            { icon: 'map-pin', label: 'Location', value: '123 Business Street' },
          ],
        },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Office building', aspectRatio: '21:9', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const aboutContactMap: SectionTemplate = {
  id: 'about-contact-map',
  name: 'Contact + Map',
  description: 'Contact info with embedded map',
  category: 'about_us',
  icon: 'map-pin',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'about' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'This is us', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Contact us.', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'State-of-the-art technologies and innovative solutions.' },
        children: [],
      },
      {
        id: genId('contact'),
        type: 'contact_info',
        props: {
          items: [
            { icon: 'mail', label: 'E-Mail', value: 'contact@company.com' },
            { icon: 'phone', label: 'Phone', value: '+1 234 567 890' },
            { icon: 'map-pin', label: 'Location', value: '123 Business Street' },
          ],
        },
        children: [],
      },
      {
        id: genId('map'),
        type: 'map_embed',
        props: { location: '123 Business Street', height: 300 },
        children: [],
      },
    ],
  }),
};

// ============================================================================
// QUIZ/FORM SECTIONS (9 templates) - Perspective-Style
// Interactive quiz and form templates for lead qualification
// ============================================================================

export const quizSplitBenefits: SectionTemplate = {
  id: 'quiz-split-benefits',
  name: 'Quiz + Benefits',
  description: 'Quiz question with benefits card',
  category: 'quiz_form',
  icon: 'list',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-split' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'Tell us about your goals', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your goal with the Community?', level: 'h2' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'list',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ],
        },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Submit and Continue', variant: 'primary', action: 'next', fullWidth: true },
        children: [],
      },
    ],
  }),
};

export const quizCenteredSimple: SectionTemplate = {
  id: 'quiz-centered-simple',
  name: 'Quiz Centered',
  description: 'Centered quiz with 2x2 choice grid',
  category: 'quiz_form',
  icon: 'grid-2x2',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Answer the question to find the right course for you.', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2x2',
          variant: 'outline',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizCenteredFilled: SectionTemplate = {
  id: 'quiz-centered-filled',
  name: 'Quiz Filled',
  description: 'Centered quiz with filled button options',
  category: 'quiz_form',
  icon: 'check-square',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Answer the question to find the right course for you.', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2x2',
          variant: 'filled',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizCenteredGray: SectionTemplate = {
  id: 'quiz-centered-gray',
  name: 'Quiz Gray BG',
  description: 'Quiz with gray background',
  category: 'quiz_form',
  icon: 'square',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered', background: 'gray' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Answer the question to find the right course for you.', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2x2',
          variant: 'outline',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizCenteredCard: SectionTemplate = {
  id: 'quiz-centered-card',
  name: 'Quiz Card',
  description: 'Quiz inside a card container',
  category: 'quiz_form',
  icon: 'credit-card',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-card', background: 'gray' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2x2',
          variant: 'outline',
          options: [
            { label: 'Gain loyal fans', icon: 'trophy' },
            { label: 'Secure competitive advantage', icon: 'rocket' },
            { label: 'Create customer loyalty', icon: 'star' },
            { label: 'Receive support', icon: 'phone' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizImageCards: SectionTemplate = {
  id: 'quiz-image-cards',
  name: 'Quiz Image Cards',
  description: '4 image cards in a row',
  category: 'quiz_form',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-4',
          variant: 'image-card',
          options: [
            { label: 'Gain loyal fans', imageUrl: '' },
            { label: 'Stay competitive', imageUrl: '' },
            { label: 'Build loyalty', imageUrl: '' },
            { label: 'Get support', imageUrl: '' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizImageCardsGray: SectionTemplate = {
  id: 'quiz-image-cards-gray',
  name: 'Quiz Images Gray',
  description: 'Image cards with gray background',
  category: 'quiz_form',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered', background: 'gray' },
    children: [
      {
        id: genId('badge'),
        type: 'badge',
        props: { text: 'One last Question', variant: 'primary' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-4',
          variant: 'image-card',
          options: [
            { label: 'Gain loyal fans', imageUrl: '' },
            { label: 'Stay competitive', imageUrl: '' },
            { label: 'Build loyalty', imageUrl: '' },
            { label: 'Get support', imageUrl: '' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quiz2Images: SectionTemplate = {
  id: 'quiz-2-images',
  name: 'Quiz 2 Options',
  description: 'Two large image cards',
  category: 'quiz_form',
  icon: 'columns',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-centered' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Choose your Model', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Which model would you like to test drive?', align: 'center' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2',
          variant: 'image-card-large',
          options: [
            { label: 'Model A', imageUrl: '' },
            { label: 'Model B', imageUrl: '' },
          ],
        },
        children: [],
      },
    ],
  }),
};

export const quizSplitInfo: SectionTemplate = {
  id: 'quiz-split-info',
  name: 'Quiz + Info',
  description: 'Quiz with info card right',
  category: 'quiz_form',
  icon: 'layout',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'quiz-split' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'What is your Community goal?', level: 'h2' },
        children: [],
      },
      {
        id: genId('choice'),
        type: 'choice_group',
        props: {
          layout: 'grid-2x2',
          variant: 'image-card',
          options: [
            { label: 'Gain loyal fans', imageUrl: '' },
            { label: 'Stay competitive', imageUrl: '' },
            { label: 'Build loyalty', imageUrl: '' },
            { label: 'Get support', imageUrl: '' },
          ],
        },
        children: [],
      },
    ],
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
// TEAM SECTIONS (10 templates) - Perspective-Style
// Professional team showcasing layouts for individual members and team grids
// ============================================================================

// Team Member Split - Text Left
export const teamMemberTextLeft: SectionTemplate = {
  id: 'team-member-text-left',
  name: 'Team Member (Text Left)',
  description: 'Name and bio left, large photo right',
  category: 'team',
  icon: 'user',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-split' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Head of Engineering', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Philipp Schilling', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Philipp is Head of Engineering at our company. He brings extensive experience in software development and leads our technical team with excellence.' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team member photo', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

// Team Member Split - Image Left
export const teamMemberImageLeft: SectionTemplate = {
  id: 'team-member-image-left',
  name: 'Team Member (Image Left)',
  description: 'Large photo left, bio right',
  category: 'team',
  icon: 'user',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-split-reverse' },
    children: [
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team member photo', aspectRatio: '4:3' },
        children: [],
      },
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Digital Marketing', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Julia Schmidt', level: 'h2' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Julia is Head of Digital Marketing with extensive experience in online marketing strategies and brand building.' },
        children: [],
      },
    ],
  }),
};

// Team Member + Features
export const teamMemberFeatures: SectionTemplate = {
  id: 'team-member-features',
  name: 'Team Member + Features',
  description: 'Bio with icon features and photo',
  category: 'team',
  icon: 'user-check',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-split' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Financial Director', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Maximilian Weber', level: 'h2' },
        children: [],
      },
      {
        id: genId('grid'),
        type: 'feature_grid',
        props: {
          items: [
            { icon: '💰', title: 'Financial Planning', description: 'Maximilian leads strategic financial planning' },
            { icon: '📊', title: 'Risk Management', description: 'Monitors and mitigates business risks' },
            { icon: '📈', title: 'Investment Strategy', description: 'Develops growth investment strategies' },
          ],
        },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team member photo', aspectRatio: '4:3' },
        children: [],
      },
    ],
  }),
};

// Team Grid Simple
export const teamGridSimple: SectionTemplate = {
  id: 'team-grid-simple',
  name: 'Team Grid',
  description: '3-column grid with photos and bios',
  category: 'team',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-grid' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Discover our diverse, talented team committed to your success.', align: 'center' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_grid',
        props: {
          items: [
            { image: '', name: 'Philipp Schilling', description: 'Leading technical innovation' },
            { image: '', name: 'Julia Schmidt', description: 'Driving marketing success' },
            { image: '', name: 'Maximilian Weber', description: 'Managing financial growth' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// Team Grid + Label
export const teamGridLabel: SectionTemplate = {
  id: 'team-grid-label',
  name: 'Team Grid + Label',
  description: 'With blue section label',
  category: 'team',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-grid' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'This is our Team', variant: 'label', color: 'blue', align: 'center' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Discover our diverse, talented team committed to your success.', align: 'center' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_grid',
        props: {
          items: [
            { image: '', name: 'Philipp Schilling', description: 'Leading technical innovation' },
            { image: '', name: 'Julia Schmidt', description: 'Driving marketing success' },
            { image: '', name: 'Maximilian Weber', description: 'Managing financial growth' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// Team Grid No Description
export const teamGridNoDesc: SectionTemplate = {
  id: 'team-grid-no-desc',
  name: 'Team Grid (No Description)',
  description: 'Clean grid with names only',
  category: 'team',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-grid' },
    children: [
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Discover our diverse, talented team committed to your success.', align: 'center' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_grid',
        props: {
          showDescription: false,
          items: [
            { image: '', name: 'Philipp Schilling' },
            { image: '', name: 'Julia Schmidt' },
            { image: '', name: 'Maximilian Weber' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// Team Full Image
export const teamFullImage: SectionTemplate = {
  id: 'team-full-image',
  name: 'Team Full Image',
  description: 'Full-width team photo',
  category: 'team',
  icon: 'image',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-full' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'This is our Team', variant: 'label', color: 'blue', align: 'center' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('paragraph'),
        type: 'paragraph',
        props: { text: 'Discover our diverse, talented team committed to your success.', align: 'center' },
        children: [],
      },
      {
        id: genId('image'),
        type: 'image',
        props: { src: '', alt: 'Team photo', aspectRatio: '16:9', fullWidth: true },
        children: [],
      },
    ],
  }),
};

// Team Grid Cards
export const teamGridCards: SectionTemplate = {
  id: 'team-grid-cards',
  name: 'Team Grid Cards',
  description: '2x3 cards with avatars',
  category: 'team',
  icon: 'layout-grid',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-cards' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'This is our Team', variant: 'label', color: 'blue', align: 'center' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_cards',
        props: {
          items: [
            { image: '', name: 'Philipp Schilling', role: 'Engineering', description: 'Technical leadership' },
            { image: '', name: 'Julia Schmidt', role: 'Marketing', description: 'Brand strategy' },
            { image: '', name: 'Maximilian Weber', role: 'Finance', description: 'Growth planning' },
            { image: '', name: 'Anna Müller', role: 'Design', description: 'User experience' },
            { image: '', name: 'Thomas Klein', role: 'Sales', description: 'Client success' },
            { image: '', name: 'Laura Fischer', role: 'Support', description: 'Customer care' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// Team Grid Cards (Gray BG)
export const teamGridCardsGray: SectionTemplate = {
  id: 'team-grid-cards-gray',
  name: 'Team Grid Cards (Gray)',
  description: 'Card grid on gray background',
  category: 'team',
  icon: 'layout-grid',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-cards', background: 'gray' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'This is our Team', variant: 'label', color: 'blue', align: 'center' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Meet our Experts', level: 'h2', align: 'center' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_cards',
        props: {
          items: [
            { image: '', name: 'Philipp Schilling', role: 'Engineering', description: 'Technical leadership' },
            { image: '', name: 'Julia Schmidt', role: 'Marketing', description: 'Brand strategy' },
            { image: '', name: 'Maximilian Weber', role: 'Finance', description: 'Growth planning' },
            { image: '', name: 'Anna Müller', role: 'Design', description: 'User experience' },
            { image: '', name: 'Thomas Klein', role: 'Sales', description: 'Client success' },
            { image: '', name: 'Laura Fischer', role: 'Support', description: 'Customer care' },
          ],
        },
        children: [],
      },
    ],
  }),
};

// Team Split + CTA
export const teamSplitCta: SectionTemplate = {
  id: 'team-split-cta',
  name: 'Team + CTA',
  description: 'CTA left, 2x2 team grid right',
  category: 'team',
  icon: 'users',
  createNode: () => ({
    id: genId('section'),
    type: 'section',
    props: { variant: 'team-cta' },
    children: [
      {
        id: genId('label'),
        type: 'paragraph',
        props: { text: 'Become part of the community', variant: 'label', color: 'blue' },
        children: [],
      },
      {
        id: genId('heading'),
        type: 'heading',
        props: { text: 'Get to know our Team', level: 'h2' },
        children: [],
      },
      {
        id: genId('button'),
        type: 'cta_button',
        props: { label: 'Apply now', variant: 'primary', action: 'next' },
        children: [],
      },
      {
        id: genId('team'),
        type: 'team_grid',
        props: {
          columns: 2,
          items: [
            { image: '', name: 'Philipp', description: 'Engineering' },
            { image: '', name: 'Julia', description: 'Marketing' },
            { image: '', name: 'Max', description: 'Finance' },
            { image: '', name: 'Anna', description: 'Design' },
          ],
        },
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
  // About Us (9)
  aboutSplitIcons,
  aboutSplitFaq,
  aboutFullImage,
  aboutLogos,
  about2ColText,
  aboutSplitImage,
  aboutContactInfo,
  aboutContactImage,
  aboutContactMap,
  // Quiz/Form (9)
  quizSplitBenefits,
  quizCenteredSimple,
  quizCenteredFilled,
  quizCenteredGray,
  quizCenteredCard,
  quizImageCards,
  quizImageCardsGray,
  quiz2Images,
  quizSplitInfo,
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
  // Team (10)
  teamMemberTextLeft,
  teamMemberImageLeft,
  teamMemberFeatures,
  teamGridSimple,
  teamGridLabel,
  teamGridNoDesc,
  teamFullImage,
  teamGridCards,
  teamGridCardsGray,
  teamSplitCta,
];

export const sectionTemplatesByCategory = {
  hero: [heroSimple, heroReviews, heroLogos, heroSplit, heroFormCard, heroInlineForm, heroGradient, heroDark],
  content: [contentText, contentHeadingText],
  cta: [ctaSimple, ctaGrayCard, ctaDarkReviews, ctaDarkCard, ctaGradientLogos, ctaFormSplitReviews, ctaFormSplitSimple, ctaSplitForm, ctaFaq, ctaDual],
  about_us: [aboutSplitIcons, aboutSplitFaq, aboutFullImage, aboutLogos, about2ColText, aboutSplitImage, aboutContactInfo, aboutContactImage, aboutContactMap],
  quiz_form: [quizSplitBenefits, quizCenteredSimple, quizCenteredFilled, quizCenteredGray, quizCenteredCard, quizImageCards, quizImageCardsGray, quiz2Images, quizSplitInfo],
  social_proof: [socialProofStars, socialProofLogos, socialProofStats, socialProofBadges],
  features: [featuresSplitChecklist, featuresSplitImage, featuresSplitIcons, features3ColCards, features4ColIcons, features2ColIcons, featuresGrayImage, featuresGrayReviews],
  testimonials: [testimonialSingle, testimonialCarousel],
  faq: [faqSection],
  team: [teamMemberTextLeft, teamMemberImageLeft, teamMemberFeatures, teamGridSimple, teamGridLabel, teamGridNoDesc, teamFullImage, teamGridCards, teamGridCardsGray, teamSplitCta],
};

export const categoryLabels: Record<string, string> = {
  hero: 'Hero',
  content: 'Content',
  cta: 'Call to Action',
  about_us: 'About Us',
  quiz_form: 'Quiz/Form',
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
  about_us: 'Company info and contact',
  quiz_form: 'Interactive quizzes and forms',
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
  about_us: 'building',
  quiz_form: 'list-checks',
  social_proof: 'star',
  features: 'package',
  testimonials: 'quote',
  faq: 'help-circle',
  team: 'users',
};
