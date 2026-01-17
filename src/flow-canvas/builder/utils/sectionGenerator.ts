/**
 * Section Generator
 * Converts scraped/AI section definitions into actual Frame stacks/blocks
 * for the flow-canvas builder.
 * 
 * Enhanced with content sanitization to prevent:
 * - Emoji/icon text injection
 * - Broken external image URLs
 * - Overly long content
 */

import type { Block, Element, Stack } from '../../types/infostack';
import { generateId } from './helpers';
import type { TemplateTheme } from './templateThemeUtils';

export interface GeneratedSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'pricing' | 'logo-bar' | 'stats' | 'text-block' | 'footer';
  layout?: 'center' | 'split' | 'grid' | 'stack';
  media?: {
    /** Main hero/section image */
    primaryImage?: string;
    /** Logo strip images */
    logos?: string[];
    /** Icon images (optional) */
    icons?: string[];
  };
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

// ========== CONTENT SANITIZATION ==========

// Remove emoji and unicode symbols from text
function sanitizeText(text: string | undefined): string {
  if (!text) return '';
  
  // Remove emoji and unicode symbols
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;
  let cleaned = text.replace(emojiRegex, '');
  
  // Remove common icon/symbol patterns
  cleaned = cleaned.replace(/[✓✔✕✖✗✘★☆●○◆◇■□▲△▼▽►◄→←↑↓↔↕⇒⇐⇑⇓•·‣⁃]/g, '');
  cleaned = cleaned.replace(/\[icon\]/gi, '');
  cleaned = cleaned.replace(/\[[^\]]+icon[^\]]*\]/gi, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Truncate with ellipsis
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Sanitize and limit text length
function sanitizeAndTruncate(text: string | undefined, maxLength: number): string {
  return truncateText(sanitizeText(text), maxLength);
}

// Supported icons in our builder
const SUPPORTED_ICONS = new Set([
  'check', 'star', 'rocket', 'users', 'clock', 'shield', 'zap', 'target', 
  'award', 'heart', 'thumbs-up', 'trending-up', 'map', 'share-2', 'search',
  'calendar', 'file-text', 'play', 'mail', 'phone', 'globe'
]);

// Normalize icon to supported set
function normalizeIcon(icon: string | undefined): string {
  if (!icon) return 'check';
  const lower = icon.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  const iconMap: Record<string, string> = {
    'checkmark': 'check', 'tick': 'check', 'verified': 'check',
    'stars': 'star', 'rating': 'star',
    'user': 'users', 'people': 'users', 'team': 'users',
    'time': 'clock', 'timer': 'clock',
    'security': 'shield', 'secure': 'shield',
    'lightning': 'zap', 'fast': 'zap', 'speed': 'zap',
    'goal': 'target', 'aim': 'target',
    'love': 'heart', 'like': 'thumbs-up',
    'growth': 'trending-up', 'increase': 'trending-up',
    'location': 'map', 'share': 'share-2', 'find': 'search',
    'date': 'calendar', 'schedule': 'calendar',
    'document': 'file-text', 'video': 'play',
    'email': 'mail', 'contact': 'phone', 'world': 'globe', 'web': 'globe',
  };
  
  if (SUPPORTED_ICONS.has(lower)) return lower;
  if (iconMap[lower]) return iconMap[lower];
  return 'check';
}

// Check if URL is from a trusted CDN (not random external site)
function isTrustedImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  const trustedDomains = [
    'images.unsplash.com',
    'cdn.lovable.dev',
    'supabase.co',
    'cloudinary.com',
    'imgix.net',
  ];
  try {
    const parsed = new URL(url);
    return trustedDomains.some(d => parsed.hostname.includes(d));
  } catch {
    return false;
  }
}

// ========== END SANITIZATION ==========

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
    textClass: isDark ? 'text-white' : 'text-gray-900',
    mutedTextClass: isDark ? 'text-white/70' : 'text-gray-600',
    bgClass: isDark ? 'bg-gray-900' : 'bg-white',
  };
}

function makeBlock(partial: Omit<Block, 'id'>): Block {
  return { id: generateId(), ...partial };
}

function makeStack(partial: Omit<Stack, 'id'>): Stack {
  return { id: generateId(), ...partial };
}

function heroTextElements(content: GeneratedSection['content'], theme: TemplateTheme): Element[] {
  const elements: Element[] = [];

  // Keep badge lightweight; many pages use one
  elements.push({
    id: generateId(),
    type: 'badge',
    content: 'NEW',
    props: { variant: 'premium', backgroundColor: theme.badgeBg, textColor: theme.badgeText },
  });

  if (content.headline) {
    elements.push({
      id: generateId(),
      type: 'heading',
      content: sanitizeAndTruncate(content.headline, 80),
      props: { level: 1, color: theme.textColor },
    });
  }

  if (content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: sanitizeAndTruncate(content.subheadline, 200),
      props: { color: theme.mutedTextColor },
    });
  }

  elements.push({
    id: generateId(),
    type: 'button',
    content: sanitizeAndTruncate(content.buttonText, 30) || 'Get Started',
    props: { variant: 'primary', size: 'xl', backgroundColor: theme.primaryColor },
  });

  return elements;
}

function generateHeroStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  // Only use image if from trusted CDN
  const hasValidImage = isTrustedImageUrl(section.media?.primaryImage);

  if (section.layout === 'split' || hasValidImage) {
    const left = makeBlock({
      type: 'hero',
      label: 'Hero Copy',
      elements: heroTextElements(section.content, theme),
      props: { alignment: 'left' },
    });

    const right = makeBlock({
      type: 'media',
      label: 'Hero Media',
      elements: [
        {
          id: generateId(),
          type: 'image',
          content: '',
          props: {
            // Only use the image if it's from a trusted CDN, otherwise use placeholder
            src: hasValidImage ? section.media?.primaryImage : undefined,
            placeholder: !hasValidImage,
            alt: sanitizeText(section.content.headline) || 'Hero image',
          },
          styles: {
            width: '100%',
            borderRadius: '16px',
          },
        },
      ],
      props: {},
    });

    return makeStack({
      label: 'Hero',
      direction: 'horizontal',
      blocks: [left, right],
      props: {},
    });
  }

  const block = makeBlock({
    type: 'hero',
    label: 'Hero',
    elements: heroTextElements(section.content, theme),
    props: { alignment: 'center' },
  });

  return makeStack({
    label: 'Hero',
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

function generateLogoBarStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const headline = sanitizeAndTruncate(section.content.headline, 50) || 'Trusted by';
  // Only use logos from trusted CDNs
  const logos = (section.media?.logos || []).filter(isTrustedImageUrl).slice(0, 10);

  const headingBlock = makeBlock({
    type: 'text-block',
    label: 'Logo Bar Heading',
    elements: [
      {
        id: generateId(),
        type: 'text',
        content: headline,
        props: { color: theme.mutedTextColor, variant: 'caption' },
      },
    ],
    props: { alignment: 'center' },
  });

  const logosBlock = makeBlock({
    type: 'logo-bar',
    label: 'Logos',
    elements: logos.length
      ? logos.map((src) => ({
          id: generateId(),
          type: 'image',
          content: '',
          props: { src, alt: 'Logo', isLogo: true },
          styles: { width: '120px', maxWidth: '160px' },
        }))
      : [
          {
            id: generateId(),
            type: 'image',
            content: '',
            props: { placeholder: 'Drop logos', isLogo: true },
            styles: { width: '140px' },
          },
        ],
    props: {
      direction: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      wrap: true,
      gap: '20px',
    },
  });

  return makeStack({
    label: 'Logo Bar',
    direction: 'vertical',
    blocks: [headingBlock, logosBlock],
    props: {},
  });
}

function generateFeaturesStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const elements: Element[] = [];

  elements.push({
    id: generateId(),
    type: 'heading',
    content: sanitizeAndTruncate(section.content.headline, 80) || 'Why this works',
    props: { level: 2, color: theme.textColor },
  });

  if (section.content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: sanitizeAndTruncate(section.content.subheadline, 200),
      props: { color: theme.mutedTextColor },
    });
  }

  const items = (section.content.items || []).slice(0, 6);
  items.forEach((item) => {
    elements.push({
      id: generateId(),
      type: 'icon-text',
      content: sanitizeAndTruncate(item.title, 60) || 'Feature',
      props: {
        icon: normalizeIcon(item.icon),
        description: sanitizeAndTruncate(item.description, 150),
        color: theme.textColor,
        descriptionColor: theme.mutedTextColor,
      },
    });
  });

  const block = makeBlock({
    type: 'feature',
    label: 'Features',
    elements,
    props: { alignment: 'center' },
  });

  return makeStack({
    label: 'Features',
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

function generateStatsStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const stats = (section.content.items || []).slice(0, 6);

  const heading = makeBlock({
    type: 'text-block',
    label: 'Stats Heading',
    elements: section.content.headline
      ? [
          {
            id: generateId(),
            type: 'heading' as const,
            content: sanitizeAndTruncate(section.content.headline, 80),
            props: { level: 2, color: theme.textColor },
          },
          ...(section.content.subheadline
            ? [
                {
                  id: generateId(),
                  type: 'text' as const,
                  content: sanitizeAndTruncate(section.content.subheadline, 200),
                  props: { color: theme.mutedTextColor },
                },
              ]
            : []),
        ]
      : [],
    props: { alignment: 'center' },
  });

  const statsBlock = makeBlock({
    type: 'stats-row',
    label: 'Stats',
    elements: stats.map((s) => ({
      id: generateId(),
      type: 'stat-number',
      content: '',
      props: {
        value: sanitizeText(s.title) || '100+',
        label: sanitizeAndTruncate(s.description, 50) || 'Stat',
        color: theme.textColor,
        labelColor: theme.mutedTextColor,
      },
    })),
    props: {
      direction: 'row',
      wrap: true,
      justifyContent: 'center',
      alignItems: 'center',
      gap: '28px',
    },
  });

  const blocks = heading.elements.length ? [heading, statsBlock] : [statsBlock];

  return makeStack({
    label: 'Stats',
    direction: 'vertical',
    blocks,
    props: {},
  });
}

function generateTestimonialsStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const items = (section.content.items || []).slice(0, 4);

  const elements: Element[] = [
    {
      id: generateId(),
      type: 'heading',
      content: sanitizeAndTruncate(section.content.headline, 80) || 'Testimonials',
      props: { level: 2, color: theme.textColor },
    },
  ];

  items.forEach((t) => {
    const desc = sanitizeAndTruncate(t.description, 200);
    elements.push({
      id: generateId(),
      type: 'text',
      content: desc ? `"${desc}"` : '"Amazing results."',
      props: { color: theme.mutedTextColor },
    });
    if (t.title) {
      elements.push({
        id: generateId(),
        type: 'text',
        content: `— ${sanitizeAndTruncate(t.title, 50)}`,
        props: { color: theme.captionColor, variant: 'caption' },
      });
    }
  });

  const block = makeBlock({
    type: 'testimonial',
    label: 'Testimonials',
    elements,
    props: { alignment: 'center' },
  });

  return makeStack({
    label: 'Testimonials',
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

function generateCTASTack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const elements: Element[] = [
    {
      id: generateId(),
      type: 'heading' as const,
      content: sanitizeAndTruncate(section.content.headline, 80) || 'Ready to start?',
      props: { level: 2, color: theme.textColor },
    },
  ];

  if (section.content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text' as const,
      content: sanitizeAndTruncate(section.content.subheadline, 200),
      props: { color: theme.mutedTextColor },
    });
  }

  elements.push({
    id: generateId(),
    type: 'button' as const,
    content: sanitizeAndTruncate(section.content.buttonText, 30) || 'Get Started',
    props: { variant: 'primary', size: 'lg', backgroundColor: theme.primaryColor },
  });

  const block = makeBlock({
    type: 'cta',
    label: 'CTA',
    elements,
    props: { alignment: 'center' },
  });

  return makeStack({
    label: 'CTA',
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

function generateTextStack(section: GeneratedSection, theme: TemplateTheme, label: string): Stack {
  const elements: Element[] = [];
  
  if (section.content.headline) {
    elements.push({
      id: generateId(),
      type: 'heading' as const,
      content: sanitizeAndTruncate(section.content.headline, 80),
      props: { level: 2, color: theme.textColor },
    });
  }
  
  if (section.content.subheadline) {
    elements.push({
      id: generateId(),
      type: 'text' as const,
      content: sanitizeAndTruncate(section.content.subheadline, 200),
      props: { color: theme.mutedTextColor },
    });
  }
  
  const block = makeBlock({
    type: 'text-block',
    label,
    elements,
    props: { alignment: 'center' },
  });

  return makeStack({
    label,
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

function generateFooterStack(section: GeneratedSection, theme: TemplateTheme): Stack {
  const block = makeBlock({
    type: 'footer',
    label: 'Footer',
    elements: [
      {
        id: generateId(),
        type: 'text' as const,
        content: section.content.headline || '© 2026. All rights reserved.',
        props: { color: theme.captionColor, variant: 'caption' },
      },
    ],
    props: { alignment: 'center' },
  });

  return makeStack({
    label: 'Footer',
    direction: 'vertical',
    blocks: [block],
    props: {},
  });
}

export function generateStacksFromSections(sections: GeneratedSection[], style: ClonedStyle): Stack[] {
  const theme = createThemeFromStyle(style);

  return sections.map((section) => {
    switch (section.type) {
      case 'hero':
        return generateHeroStack(section, theme);
      case 'logo-bar':
        return generateLogoBarStack(section, theme);
      case 'features':
        return generateFeaturesStack(section, theme);
      case 'stats':
        return generateStatsStack(section, theme);
      case 'testimonials':
        return generateTestimonialsStack(section, theme);
      case 'cta':
        return generateCTASTack(section, theme);
      case 'pricing':
        return generateTextStack(section, theme, 'Pricing');
      case 'faq':
        return generateTextStack(section, theme, 'FAQ');
      case 'text-block':
        return generateTextStack(section, theme, 'Content');
      case 'footer':
        return generateFooterStack(section, theme);
      default:
        return generateTextStack(section, theme, 'Section');
    }
  });
}
