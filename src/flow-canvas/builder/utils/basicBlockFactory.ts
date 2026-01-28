/**
 * Basic Block Factory - Creates polished, Perspective-style blocks
 * for basic content elements with professional defaults
 */

import type { Block, BlockType, Element, ElementType } from '../../types/infostack';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// All basic block IDs
const BASIC_BLOCK_IDS = [
  'text',
  'button',
  'image',
  'video',
  'divider',
  'spacer',
  'logo-bar',
  'reviews',
  'list',
  'testimonial',
  'faq',
  'team',
  'calendar',
  'form',
  'html',
  'heading',
  'icon',
] as const;

export type BasicBlockId = typeof BASIC_BLOCK_IDS[number];

/**
 * Check if a block ID is a basic block
 */
export function isBasicBlockId(blockId: string): blockId is BasicBlockId {
  return BASIC_BLOCK_IDS.includes(blockId as BasicBlockId);
}

/**
 * Create a basic block with Perspective-style defaults
 */
export function createBasicBlock(blockId: string): Block | null {
  switch (blockId) {
    case 'text':
      return createTextBlock();
    case 'heading':
      return createHeadingBlock();
    case 'button':
      return createButtonBlock();
    case 'image':
      return createImageBlock();
    case 'video':
      return createVideoBlock();
    case 'divider':
      return createDividerBlock();
    case 'spacer':
      return createSpacerBlock();
    case 'logo-bar':
      return createLogoBarBlock();
    case 'reviews':
      return createReviewsBlock();
    case 'list':
      return createListBlock();
    case 'testimonial':
      return createTestimonialBlock();
    case 'faq':
      return createFaqBlock();
    case 'team':
      return createTeamBlock();
    case 'calendar':
      return createCalendarBlock();
    case 'form':
      return createFormBlock();
    case 'html':
      return createHtmlBlock();
    case 'icon':
      return createIconBlock();
    default:
      return null;
  }
}

/**
 * Text Block - Clean, readable paragraph text
 */
function createTextBlock(): Block {
  return {
    id: generateId(),
    type: 'text-block' as BlockType,
    label: 'Text',
    elements: [{
      id: generateId(),
      type: 'text' as ElementType,
      content: 'Your text here. Click to edit and add your message.',
      props: {
        fontSize: 'base',
        textAlign: 'center',
        textColor: 'rgba(17, 24, 39, 0.8)',
        lineHeight: '1.6',
        maxWidth: '640px',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Heading Block - Bold, impactful heading
 */
function createHeadingBlock(): Block {
  return {
    id: generateId(),
    type: 'text-block' as BlockType,
    label: 'Heading',
    elements: [{
      id: generateId(),
      type: 'heading' as ElementType,
      content: 'Your Heading Here',
      props: {
        level: 2,
        fontSize: '2xl',
        fontWeight: 'bold',
        textAlign: 'center',
        textColor: '#111827',
        letterSpacing: '-0.02em',
        lineHeight: '1.2',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Button Block - Primary CTA with polished styling
 */
function createButtonBlock(): Block {
  return {
    id: generateId(),
    type: 'cta' as BlockType,
    label: 'Button',
    elements: [{
      id: generateId(),
      type: 'button' as ElementType,
      content: 'Get Started',
      props: {
        variant: 'primary',
        size: 'lg',
        fullWidth: false,
        borderRadius: '12px',
        backgroundColor: '#2563EB',
        textColor: '#FFFFFF',
        fontWeight: '600',
        paddingHorizontal: 32,
        paddingVertical: 16,
        hoverTransform: 'translateY(-2px)',
        shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Image Block - Clean image placeholder with proper aspect ratio
 */
function createImageBlock(): Block {
  return {
    id: generateId(),
    type: 'media' as BlockType,
    label: 'Image',
    elements: [{
      id: generateId(),
      type: 'image' as ElementType,
      content: '',
      props: {
        src: '',
        alt: 'Image description',
        aspectRatio: '16:9',
        objectFit: 'cover',
        borderRadius: '12px',
        placeholder: true,
        maxWidth: '100%',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Video Block - Video placeholder with thumbnail mode
 */
function createVideoBlock(): Block {
  return {
    id: generateId(),
    type: 'media' as BlockType,
    label: 'Video',
    elements: [{
      id: generateId(),
      type: 'video' as ElementType,
      content: '',
      props: {
        src: '',
        aspectRatio: '16:9',
        autoplay: false,
        muted: true,
        loop: false,
        controls: true,
        borderRadius: '12px',
        placeholder: true,
        thumbnailMode: true,
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Divider Block - Subtle horizontal rule
 */
function createDividerBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Divider',
    elements: [{
      id: generateId(),
      type: 'divider' as ElementType,
      content: '',
      props: {
        color: 'rgba(0, 0, 0, 0.1)',
        thickness: 1,
        width: '80%',
        style: 'solid',
        margin: '16px 0',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Spacer Block - Vertical spacing element
 */
function createSpacerBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Spacer',
    elements: [{
      id: generateId(),
      type: 'spacer' as ElementType,
      content: '',
      props: {
        height: 40,
      }
    }],
    props: {}
  };
}

/**
 * Logo Bar Block - Perspective-style horizontal logo display
 */
function createLogoBarBlock(): Block {
  const brandNames = ['Zalando', 'Google', 'Deutsche Bahn', 'Coca-Cola', 'Sony'];
  
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Logo Bar',
    elements: [{
      id: generateId(),
      type: 'logo-marquee' as ElementType,
      content: '',
      props: {
        logos: brandNames.map((name, i) => ({
          id: `logo-${i}`,
          src: '',
          alt: name,
          name,
        })),
        // Perspective-style logo bar
        layout: 'horizontal',
        animated: false,
        grayscale: true,
        showTextFallback: true,
        hoverEffect: 'color',
        logoHeight: 28,
        gap: 32,
        padding: '24px 16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '16px',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'inherit',
        fontWeight: '600',
        textColor: '#6B7280',
        opacity: 0.7,
      }
    }],
    props: {
      fullWidth: true,
    }
  };
}

/**
 * Reviews Block - Social proof with avatar group and rating
 */
function createReviewsBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Reviews',
    elements: [{
      id: generateId(),
      type: 'avatar-group' as ElementType,
      content: '',
      props: {
        count: 4,
        size: 'sm',
        colorMode: 'varied',
        overlap: 10,
        showRating: true,
        rating: 4.8,
        ratingCount: 148,
        ratingSource: 'reviews',
        alignment: 'center',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * List Block - Bullet points with checkmark icons
 */
function createListBlock(): Block {
  return {
    id: generateId(),
    type: 'text-block' as BlockType,
    label: 'List',
    elements: [
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: '✓ First benefit or feature point',
        props: {
          fontSize: 'base',
          textColor: '#111827',
          lineHeight: '1.6',
          icon: 'check',
          iconColor: '#10B981',
        }
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: '✓ Second benefit or feature point',
        props: {
          fontSize: 'base',
          textColor: '#111827',
          lineHeight: '1.6',
          icon: 'check',
          iconColor: '#10B981',
        }
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: '✓ Third benefit or feature point',
        props: {
          fontSize: 'base',
          textColor: '#111827',
          lineHeight: '1.6',
          icon: 'check',
          iconColor: '#10B981',
        }
      },
    ],
    props: {
      alignment: 'left',
      gap: 12,
    }
  };
}

/**
 * Testimonial Block - Quote with author attribution
 */
function createTestimonialBlock(): Block {
  return {
    id: generateId(),
    type: 'text-block' as BlockType,
    label: 'Testimonial',
    elements: [
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: '"This product completely transformed how we work. The results exceeded all our expectations."',
        props: {
          fontSize: 'lg',
          textColor: '#111827',
          textAlign: 'center',
          fontStyle: 'italic',
          lineHeight: '1.7',
          maxWidth: '600px',
        }
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: '— Sarah Johnson, CEO at TechCorp',
        props: {
          fontSize: 'sm',
          textColor: 'rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
          fontWeight: '500',
        }
      },
    ],
    props: {
      alignment: 'center',
      gap: 16,
    }
  };
}

/**
 * FAQ Block - Accordion-style Q&A
 */
function createFaqBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'FAQ',
    elements: [{
      id: generateId(),
      type: 'faq' as ElementType,
      content: '',
      props: {
        items: [
          {
            id: generateId(),
            question: 'What is included in the package?',
            answer: 'Our package includes everything you need to get started, including 24/7 support, regular updates, and comprehensive documentation.',
          },
          {
            id: generateId(),
            question: 'How do I get started?',
            answer: 'Simply sign up for an account and follow our quick setup guide. You\'ll be up and running in under 5 minutes.',
          },
        ],
        style: 'accordion',
        spacing: 8,
        borderRadius: '8px',
        questionColor: '#111827',
        answerColor: 'rgba(0, 0, 0, 0.7)',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Team Block - Team member card with photo and name
 */
function createTeamBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Team',
    elements: [
      {
        id: generateId(),
        type: 'image' as ElementType,
        content: '',
        props: {
          src: '',
          alt: 'Team member photo',
          aspectRatio: '1:1',
          objectFit: 'cover',
          borderRadius: '50%',
          width: 80,
          height: 80,
          placeholder: true,
        }
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: 'John Doe',
        props: {
          fontSize: 'lg',
          fontWeight: '600',
          textColor: '#111827',
          textAlign: 'center',
        }
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: 'CEO & Founder',
        props: {
          fontSize: 'sm',
          textColor: 'rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
        }
      },
    ],
    props: {
      alignment: 'center',
      gap: 8,
    }
  };
}

/**
 * Calendar Block - Booking embed placeholder
 */
function createCalendarBlock(): Block {
  return {
    id: generateId(),
    type: 'booking' as BlockType,
    label: 'Calendar',
    elements: [{
      id: generateId(),
      type: 'video' as ElementType, // Using video as placeholder for embed
      content: '',
      props: {
        placeholder: true,
        placeholderText: 'Calendar Booking Widget',
        aspectRatio: '4:3',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '2px dashed rgba(0, 0, 0, 0.1)',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Form Block - Simple email capture form
 */
function createFormBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Form',
    elements: [
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Enter your email address',
          inputType: 'email',
          required: true,
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          fullWidth: true,
        }
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Subscribe',
        props: {
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          borderRadius: '12px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
        }
      },
    ],
    props: {
      alignment: 'center',
      gap: 12,
      maxWidth: '400px',
    }
  };
}

/**
 * HTML Block - Custom HTML embed placeholder
 */
function createHtmlBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'HTML Embed',
    elements: [{
      id: generateId(),
      type: 'html-embed' as ElementType,
      content: '<div style="padding: 20px; text-align: center; color: #6B7280; font-family: monospace;">Custom HTML goes here</div>',
      props: {
        placeholder: true,
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '2px dashed rgba(0, 0, 0, 0.1)',
        padding: '24px',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Icon Block - Lucide icon display
 */
function createIconBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Icon',
    elements: [{
      id: generateId(),
      type: 'icon' as ElementType,
      content: 'star',
      props: {
        name: 'star',
        size: 48,
        color: '#8B5CF6',
        strokeWidth: 2,
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}
