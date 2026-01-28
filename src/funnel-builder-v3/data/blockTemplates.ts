/**
 * Block Templates - Pre-configured block presets for quick insertion
 */

import { Block, BlockType, createId } from '../types/funnel';

export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'form' | 'media' | 'layout';
  blocks: Omit<Block, 'id'>[];
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Content templates
  {
    id: 'hero-headline',
    name: 'Hero Headline',
    description: 'Large heading with subtext',
    category: 'content',
    blocks: [
      {
        type: 'heading',
        content: 'Your Main Headline Here',
        props: { size: '2xl', align: 'center' },
      },
      {
        type: 'text',
        content: 'Supporting text that explains your value proposition',
        props: { size: 'lg', align: 'center', color: '#6b7280' },
      },
    ],
  },
  {
    id: 'cta-section',
    name: 'Call to Action',
    description: 'Headline + button combo',
    category: 'content',
    blocks: [
      {
        type: 'heading',
        content: 'Ready to Get Started?',
        props: { size: 'xl', align: 'center' },
      },
      {
        type: 'spacer',
        content: '',
        props: { height: 16 },
      },
      {
        type: 'button',
        content: 'Get Started Now',
        props: {
          variant: 'primary',
          buttonSize: 'lg',
          fullWidth: true,
          action: { type: 'next-screen' },
        },
      },
    ],
  },
  {
    id: 'feature-list',
    name: 'Feature List',
    description: 'Icon + text benefit points',
    category: 'content',
    blocks: [
      {
        type: 'heading',
        content: 'Why Choose Us',
        props: { size: 'lg', align: 'left' },
      },
      {
        type: 'text',
        content: '✓ Benefit one that matters to your audience',
        props: { size: 'md' },
      },
      {
        type: 'text',
        content: '✓ Another compelling reason to choose you',
        props: { size: 'md' },
      },
      {
        type: 'text',
        content: '✓ Third benefit that seals the deal',
        props: { size: 'md' },
      },
    ],
  },

  // Form templates
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Name, email, message fields',
    category: 'form',
    blocks: [
      {
        type: 'heading',
        content: 'Get in Touch',
        props: { size: 'xl', align: 'center' },
      },
      {
        type: 'input',
        content: '',
        props: {
          inputType: 'name',
          label: 'Your Name',
          placeholder: 'Enter your name',
          fieldKey: 'name',
          required: true,
        },
      },
      {
        type: 'input',
        content: '',
        props: {
          inputType: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          fieldKey: 'email',
          required: true,
        },
      },
      {
        type: 'input',
        content: '',
        props: {
          inputType: 'textarea',
          label: 'Your Message',
          placeholder: 'How can we help?',
          fieldKey: 'message',
          required: false,
        },
      },
      {
        type: 'button',
        content: 'Send Message',
        props: {
          variant: 'primary',
          fullWidth: true,
          action: { type: 'submit' },
        },
      },
    ],
  },
  {
    id: 'email-capture',
    name: 'Email Capture',
    description: 'Simple email opt-in',
    category: 'form',
    blocks: [
      {
        type: 'heading',
        content: 'Join Our Newsletter',
        props: { size: 'lg', align: 'center' },
      },
      {
        type: 'text',
        content: 'Get exclusive updates delivered to your inbox',
        props: { size: 'md', align: 'center', color: '#6b7280' },
      },
      {
        type: 'spacer',
        content: '',
        props: { height: 16 },
      },
      {
        type: 'input',
        content: '',
        props: {
          inputType: 'email',
          placeholder: 'Enter your email',
          fieldKey: 'email',
          required: true,
        },
      },
      {
        type: 'button',
        content: 'Subscribe',
        props: {
          variant: 'primary',
          fullWidth: true,
          action: { type: 'submit' },
        },
      },
    ],
  },
  {
    id: 'phone-capture',
    name: 'Phone Capture',
    description: 'Phone number collection',
    category: 'form',
    blocks: [
      {
        type: 'input',
        content: '',
        props: {
          inputType: 'phone',
          label: 'Phone Number',
          placeholder: '(555) 123-4567',
          fieldKey: 'phone',
          required: true,
        },
      },
      {
        type: 'text',
        content: 'We\'ll text you important updates',
        props: { size: 'sm', align: 'center', color: '#9ca3af' },
      },
    ],
  },

  // Media templates
  {
    id: 'video-section',
    name: 'Video Section',
    description: 'Video with headline',
    category: 'media',
    blocks: [
      {
        type: 'heading',
        content: 'Watch This First',
        props: { size: 'xl', align: 'center' },
      },
      {
        type: 'spacer',
        content: '',
        props: { height: 16 },
      },
      {
        type: 'video',
        content: '',
        props: { src: '' },
      },
    ],
  },
  {
    id: 'image-header',
    name: 'Image Header',
    description: 'Full-width image',
    category: 'media',
    blocks: [
      {
        type: 'image',
        content: '',
        props: {
          src: '',
          alt: 'Header image',
          aspectRatio: '16:9',
        },
      },
    ],
  },

  // Layout templates
  {
    id: 'divider-section',
    name: 'Section Divider',
    description: 'Space with divider line',
    category: 'layout',
    blocks: [
      {
        type: 'spacer',
        content: '',
        props: { height: 24 },
      },
      {
        type: 'divider',
        content: '',
        props: { color: '#e5e7eb' },
      },
      {
        type: 'spacer',
        content: '',
        props: { height: 24 },
      },
    ],
  },
  {
    id: 'spacer-large',
    name: 'Large Spacer',
    description: '48px vertical space',
    category: 'layout',
    blocks: [
      {
        type: 'spacer',
        content: '',
        props: { height: 48 },
      },
    ],
  },
];

/**
 * Get blocks from a template with fresh IDs
 */
export function getTemplateBlocks(templateId: string): Block[] {
  const template = BLOCK_TEMPLATES.find(t => t.id === templateId);
  if (!template) return [];
  
  return template.blocks.map(block => ({
    ...block,
    id: createId(),
  }));
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: BlockTemplate['category']): BlockTemplate[] {
  return BLOCK_TEMPLATES.filter(t => t.category === category);
}
