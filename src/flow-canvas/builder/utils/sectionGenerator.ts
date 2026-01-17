/**
 * Section Generator
 * Converts section type definitions into Block objects for the canvas
 */

import { Block, Element } from '../../types/infostack';
import { generateId } from './helpers';
import { buildTemplateTheme, TemplateTheme } from './templateThemeUtils';

export interface GeneratedSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'pricing' | 'logo-bar' | 'stats' | 'text-block' | 'footer';
  content: {
    headline?: string;
    subheadline?: string;
    buttonText?: string;
    items?: Array<{
      title?: string;
      description?: string;
      icon?: string;
    }>;
  };
}

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

/**
 * Create a theme object from cloned style
 */
function createThemeFromStyle(style: ClonedStyle): TemplateTheme {
  const isDark = style.theme === 'dark';
  
  return {
    isDark,
    primaryColor: style.primaryColor,
    accentGradient: [style.primaryColor, style.accentColor] as [string, string],
    textColor: isDark ? '#ffffff' : '#111827',
    mutedTextColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    captionColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
    backgroundColor: style.backgroundColor,
    surfaceColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    surfaceHover: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderSubtle: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    badgeBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    badgeText: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    // Tailwind class names
    textClass: isDark ? 'text-white' : 'text-gray-900',
    mutedTextClass: isDark ? 'text-white/70' : 'text-gray-600',
    bgClass: isDark ? 'bg-gray-900' : 'bg-white',
  };
}

/**
 * Generate a hero section block
 */
function generateHeroBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  // Badge
  elements.push({
    id: generateId(),
    type: 'badge',
    content: 'NEW',
    props: { variant: 'premium', backgroundColor: theme.badgeBg, textColor: theme.badgeText },
  });
  
  // Headline
  if (content.headline) {
    elements.push({
      id: generateId(),
      type: 'heading',
      content: content.headline,
      props: { level: 1, color: theme.textColor },
    });
  }
  
  // Subheadline
  if (content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: content.subheadline,
      props: { color: theme.mutedTextColor },
    });
  }
  
  // Button
  elements.push({
    id: generateId(),
    type: 'button',
    content: content.buttonText || 'Get Started',
    props: { variant: 'primary', size: 'xl', backgroundColor: theme.primaryColor },
  });
  
  return {
    id: generateId(),
    type: 'hero',
    label: 'Hero Section',
    elements,
    props: { alignment: 'center', className: 'py-16' },
  };
}

/**
 * Generate a features section block
 */
function generateFeaturesBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  // Section heading
  elements.push({
    id: generateId(),
    type: 'heading',
    content: content.headline || 'Why Choose Us',
    props: { level: 2, color: theme.textColor },
  });
  
  if (content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: content.subheadline,
      props: { color: theme.mutedTextColor },
    });
  }
  
  // Feature items
  const items = content.items || [
    { title: 'Feature 1', description: 'Description of feature 1' },
    { title: 'Feature 2', description: 'Description of feature 2' },
    { title: 'Feature 3', description: 'Description of feature 3' },
  ];
  
  items.forEach((item) => {
    elements.push({
      id: generateId(),
      type: 'icon-text',
      content: item.title || 'Feature',
      props: { 
        icon: item.icon || 'check', 
        description: item.description,
        color: theme.textColor,
        descriptionColor: theme.mutedTextColor,
      },
    });
  });
  
  return {
    id: generateId(),
    type: 'feature',
    label: 'Features',
    elements,
    props: { alignment: 'center', className: 'py-12' },
  };
}

/**
 * Generate a testimonials section block
 */
function generateTestimonialsBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  elements.push({
    id: generateId(),
    type: 'heading',
    content: content.headline || 'What Our Clients Say',
    props: { level: 2, color: theme.textColor },
  });
  
  const items = content.items || [
    { title: 'John D.', description: 'This product changed my life!' },
    { title: 'Sarah M.', description: 'Incredible results in just 30 days.' },
  ];
  
  items.forEach((item) => {
    elements.push({
      id: generateId(),
      type: 'text',
      content: `"${item.description}"`,
      props: { color: theme.mutedTextColor, className: 'italic' },
    });
    elements.push({
      id: generateId(),
      type: 'text',
      content: `— ${item.title}`,
      props: { color: theme.captionColor, variant: 'caption' },
    });
  });
  
  return {
    id: generateId(),
    type: 'testimonial',
    label: 'Testimonials',
    elements,
    props: { alignment: 'center', className: 'py-12' },
  };
}

/**
 * Generate a CTA section block
 */
function generateCTABlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  elements.push({
    id: generateId(),
    type: 'heading',
    content: content.headline || 'Ready to Get Started?',
    props: { level: 2, color: theme.textColor },
  });
  
  if (content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: content.subheadline,
      props: { color: theme.mutedTextColor },
    });
  }
  
  elements.push({
    id: generateId(),
    type: 'button',
    content: content.buttonText || 'Start Now',
    props: { variant: 'primary', size: 'lg', backgroundColor: theme.primaryColor },
  });
  
  return {
    id: generateId(),
    type: 'cta',
    label: 'Call to Action',
    elements,
    props: { alignment: 'center', className: 'py-16' },
  };
}

/**
 * Generate a stats section block
 */
function generateStatsBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  const items = content.items || [
    { title: '10K+', description: 'Happy Customers' },
    { title: '99%', description: 'Satisfaction Rate' },
    { title: '24/7', description: 'Support Available' },
  ];
  
  items.forEach((item) => {
    elements.push({
      id: generateId(),
      type: 'stat-number',
      content: '',
      props: { 
        value: item.title || '100+', 
        label: item.description || 'Stat',
        color: theme.textColor,
        labelColor: theme.mutedTextColor,
      },
    });
  });
  
  return {
    id: generateId(),
    type: 'trust',
    label: 'Stats',
    elements,
    props: { alignment: 'center', className: 'py-12', layout: 'row' },
  };
}

/**
 * Generate a text block section
 */
function generateTextBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  const elements: Element[] = [];
  
  if (content.headline) {
    elements.push({
      id: generateId(),
      type: 'heading',
      content: content.headline,
      props: { level: 2, color: theme.textColor },
    });
  }
  
  if (content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: content.subheadline,
      props: { color: theme.mutedTextColor },
    });
  }
  
  return {
    id: generateId(),
    type: 'text-block',
    label: 'Text Block',
    elements,
    props: { alignment: 'center', className: 'py-8' },
  };
}

/**
 * Generate a footer section block
 */
function generateFooterBlock(content: GeneratedSection['content'], theme: TemplateTheme): Block {
  return {
    id: generateId(),
    type: 'footer',
    label: 'Footer',
    elements: [
      {
        id: generateId(),
        type: 'text',
        content: content.headline || '© 2025 Your Company. All rights reserved.',
        props: { color: theme.captionColor, variant: 'caption' },
      },
    ],
    props: { alignment: 'center', className: 'py-8' },
  };
}

/**
 * Main function: Convert sections array to Block array
 */
export function generateBlocksFromSections(
  sections: GeneratedSection[], 
  style: ClonedStyle
): Block[] {
  const theme = createThemeFromStyle(style);
  
  return sections.map((section) => {
    switch (section.type) {
      case 'hero':
        return generateHeroBlock(section.content, theme);
      case 'features':
        return generateFeaturesBlock(section.content, theme);
      case 'testimonials':
        return generateTestimonialsBlock(section.content, theme);
      case 'cta':
        return generateCTABlock(section.content, theme);
      case 'stats':
        return generateStatsBlock(section.content, theme);
      case 'text-block':
        return generateTextBlock(section.content, theme);
      case 'footer':
        return generateFooterBlock(section.content, theme);
      case 'faq':
        return generateTextBlock({ headline: section.content.headline || 'Frequently Asked Questions', ...section.content }, theme);
      case 'pricing':
        return generateTextBlock({ headline: section.content.headline || 'Pricing', ...section.content }, theme);
      case 'logo-bar':
        return generateTextBlock({ headline: section.content.headline || 'Trusted By', ...section.content }, theme);
      default:
        return generateTextBlock(section.content, theme);
    }
  });
}
