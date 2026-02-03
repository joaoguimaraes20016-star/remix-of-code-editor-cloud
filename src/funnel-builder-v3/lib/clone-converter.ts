/**
 * Clone Converter for Funnel Builder V3
 * 
 * Converts cloned sections from clone-style function to V3 blocks
 */

import { Block, BlockType, BlockContent } from '@/funnel-builder-v3/types/funnel';
import { v4 as uuid } from 'uuid';

export interface ClonedStyle {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  theme: 'dark' | 'light';
  style: string;
  confidence: number;
}

export interface GeneratedSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'pricing' | 'logo-bar' | 'stats' | 'text-block' | 'footer';
  layout?: 'center' | 'split' | 'grid' | 'stack';
  content: {
    headline?: string;
    subheadline?: string;
    buttonText?: string;
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
    }>;
  };
}

/**
 * Convert cloned sections to V3 blocks
 */
export function convertSectionsToV3Blocks(
  sections: GeneratedSection[],
  branding: ClonedStyle
): Block[] {
  const blocks: Block[] = [];
  
  for (const section of sections) {
    switch (section.type) {
      case 'hero':
        // Hero section → heading + text + button
        if (section.content.headline) {
          blocks.push({
            id: uuid(),
            type: 'heading',
            content: {
              text: section.content.headline,
              level: 1,
            },
            styles: {
              padding: { top: 32, right: 16, bottom: 8, left: 16 },
              textAlign: 'center',
            },
            trackingId: `block-${uuid()}`,
          });
        }
        
        if (section.content.subheadline) {
          blocks.push({
            id: uuid(),
            type: 'text',
            content: {
              text: section.content.subheadline,
            },
            styles: {
              padding: { top: 8, right: 16, bottom: 16, left: 16 },
              textAlign: 'center',
            },
            trackingId: `block-${uuid()}`,
          });
        }
        
        if (section.content.buttonText) {
          blocks.push({
            id: uuid(),
            type: 'button',
            content: {
              text: section.content.buttonText,
              variant: 'primary',
              size: 'lg',
              action: 'next-step',
              fullWidth: false,
              backgroundColor: branding.primaryColor,
              color: branding.theme === 'dark' ? '#ffffff' : '#000000',
            },
            styles: {
              padding: { top: 16, right: 24, bottom: 16, left: 24 },
              margin: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'features':
        // Features → list block
        if (section.content.items && section.content.items.length > 0) {
          blocks.push({
            id: uuid(),
            type: 'list',
            content: {
              items: section.content.items.map((item, idx) => ({
                id: uuid(),
                text: item.title || item.description || `Feature ${idx + 1}`,
              })),
            },
            styles: {
              padding: { top: 24, right: 16, bottom: 24, left: 16 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'testimonials':
        // Testimonials → reviews block (if we have avatars) or text blocks
        if (section.content.items && section.content.items.length > 0) {
          // For now, create text blocks with testimonial content
          section.content.items.forEach((item) => {
            if (item.description) {
              blocks.push({
                id: uuid(),
                type: 'text',
                content: {
                  text: `"${item.description}"${item.title ? ` - ${item.title}` : ''}`,
                },
                styles: {
                  padding: { top: 16, right: 16, bottom: 16, left: 16 },
                  fontStyle: 'italic',
                  textAlign: 'center',
                },
                trackingId: `block-${uuid()}`,
              });
            }
          });
        }
        break;
        
      case 'stats':
        // Stats → social-proof block
        if (section.content.items && section.content.items.length > 0) {
          blocks.push({
            id: uuid(),
            type: 'social-proof',
            content: {
              items: section.content.items.map((item, idx) => ({
                id: uuid(),
                value: parseFloat(item.title || '0') || idx + 1,
                label: item.description || item.title || 'Stat',
                suffix: '+',
              })),
            },
            styles: {
              padding: { top: 24, right: 16, bottom: 24, left: 16 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'cta':
        // CTA → button block
        if (section.content.buttonText) {
          blocks.push({
            id: uuid(),
            type: 'button',
            content: {
              text: section.content.buttonText,
              variant: 'primary',
              size: 'lg',
              action: 'next-step',
              fullWidth: true,
              backgroundColor: branding.primaryColor,
              color: branding.theme === 'dark' ? '#ffffff' : '#000000',
            },
            styles: {
              padding: { top: 24, right: 24, bottom: 24, left: 24 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'faq':
        // FAQ → accordion block
        if (section.content.items && section.content.items.length > 0) {
          blocks.push({
            id: uuid(),
            type: 'accordion',
            content: {
              items: section.content.items.map((item) => ({
                id: uuid(),
                title: item.title || 'Question',
                content: item.description || 'Answer',
                defaultOpen: false,
              })),
            },
            styles: {
              padding: { top: 24, right: 16, bottom: 24, left: 16 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'logo-bar':
        // Logo bar → logo-bar block (empty for now, user can add logos)
        blocks.push({
          id: uuid(),
          type: 'logo-bar',
          content: {
            logos: [],
          },
          styles: {
            padding: { top: 24, right: 16, bottom: 24, left: 16 },
          },
          trackingId: `block-${uuid()}`,
        });
        break;
        
      case 'pricing':
        // Pricing → list + button blocks
        if (section.content.items && section.content.items.length > 0) {
          section.content.items.forEach((item) => {
            if (item.title) {
              blocks.push({
                id: uuid(),
                type: 'heading',
                content: {
                  text: item.title,
                  level: 2,
                },
                styles: {
                  padding: { top: 16, right: 16, bottom: 8, left: 16 },
                  textAlign: 'center',
                },
                trackingId: `block-${uuid()}`,
              });
            }
            if (item.description) {
              blocks.push({
                id: uuid(),
                type: 'text',
                content: {
                  text: item.description,
                },
                styles: {
                  padding: { top: 8, right: 16, bottom: 16, left: 16 },
                  textAlign: 'center',
                },
                trackingId: `block-${uuid()}`,
              });
            }
          });
        }
        if (section.content.buttonText) {
          blocks.push({
            id: uuid(),
            type: 'button',
            content: {
              text: section.content.buttonText,
              variant: 'primary',
              size: 'lg',
              action: 'next-step',
              fullWidth: true,
              backgroundColor: branding.primaryColor,
              color: branding.theme === 'dark' ? '#ffffff' : '#000000',
            },
            styles: {
              padding: { top: 16, right: 24, bottom: 16, left: 24 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'text-block':
        // Text block → text or heading blocks
        if (section.content.headline) {
          blocks.push({
            id: uuid(),
            type: 'heading',
            content: {
              text: section.content.headline,
              level: 2,
            },
            styles: {
              padding: { top: 24, right: 16, bottom: 8, left: 16 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        if (section.content.subheadline) {
          blocks.push({
            id: uuid(),
            type: 'text',
            content: {
              text: section.content.subheadline,
            },
            styles: {
              padding: { top: 8, right: 16, bottom: 24, left: 16 },
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
        
      case 'footer':
        // Footer → text block
        if (section.content.subheadline) {
          blocks.push({
            id: uuid(),
            type: 'text',
            content: {
              text: section.content.subheadline,
            },
            styles: {
              padding: { top: 24, right: 16, bottom: 24, left: 16 },
              textAlign: 'center',
            },
            trackingId: `block-${uuid()}`,
          });
        }
        break;
    }
    
    // Add spacer between sections (except last)
    if (section !== sections[sections.length - 1]) {
      blocks.push({
        id: uuid(),
        type: 'spacer',
        content: {
          height: 32,
        },
        styles: {},
        trackingId: `block-${uuid()}`,
      });
    }
  }
  
  return blocks;
}
