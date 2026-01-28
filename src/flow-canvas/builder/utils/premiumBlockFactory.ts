/**
 * Premium Block Factory - Creates polished, Perspective-style blocks
 * for premium elements with professional defaults
 */

import type { Block, BlockType, Element, ElementType } from '../../types/infostack';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a premium block with Perspective-style defaults
 */
export function createPremiumBlock(blockId: string): Block | null {
  switch (blockId) {
    case 'gradient-text':
      return createGradientTextBlock();
    case 'underline-text':
      return createUnderlineTextBlock();
    case 'stat-number':
      return createStatNumberBlock();
    case 'avatar-group':
      return createAvatarGroupBlock();
    case 'ticker':
      return createTickerBlock();
    case 'badge':
      return createBadgeBlock();
    case 'process-step':
      return createProcessStepBlock();
    default:
      return null;
  }
}

/**
 * Gradient Text - Bold statement with smooth gradient
 */
function createGradientTextBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Gradient Text',
    elements: [{
      id: generateId(),
      type: 'gradient-text' as ElementType,
      content: 'Transform Your Business',
      props: {
        gradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { color: '#8B5CF6', position: 0 },
            { color: '#EC4899', position: 100 }
          ]
        },
        fontSize: '2xl',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '1.2'
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 8, bottom: 8 }
    }
  };
}

/**
 * Underline Text - Accent underline for emphasis
 */
function createUnderlineTextBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Underline Text',
    elements: [{
      id: generateId(),
      type: 'underline-text' as ElementType,
      content: 'Your Success Story',
      props: {
        underlineColor: '#F97316',
        underlineThickness: 3,
        underlineOffset: 4,
        fontSize: 'xl',
        fontWeight: '600',
        textAlign: 'center',
        textColor: '#111827'
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 8, bottom: 8 }
    }
  };
}

/**
 * Stat Number - Large impactful number with label
 */
function createStatNumberBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Stat Number',
    elements: [{
      id: generateId(),
      type: 'stat-number' as ElementType,
      content: '2,847',
      props: {
        suffix: '+',
        label: 'Happy Customers',
        numberSize: '4xl',
        fontWeight: 'bold',
        numberColor: '#111827',
        suffixColorType: 'gradient',
        suffixGradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { color: '#8B5CF6', position: 0 },
            { color: '#EC4899', position: 100 }
          ]
        },
        labelColor: 'rgba(0,0,0,0.6)',
        labelSize: 'sm',
        textAlign: 'center'
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 12, bottom: 12 }
    }
  };
}

/**
 * Avatar Group - Social proof with overlapping avatars
 */
function createAvatarGroupBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Avatar Group',
    elements: [{
      id: generateId(),
      type: 'avatar-group' as ElementType,
      content: '',
      props: {
        avatars: [
          { initials: 'JD', gradient: ['#8B5CF6', '#6366F1'] },
          { initials: 'SK', gradient: ['#EC4899', '#F43F5E'] },
          { initials: 'MR', gradient: ['#14B8A6', '#22C55E'] },
          { initials: 'AL', gradient: ['#F97316', '#EAB308'] },
          { initials: 'TC', gradient: ['#3B82F6', '#6366F1'] }
        ],
        size: 40,
        overlap: -12,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        showCount: false,
        alignment: 'center'
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 8, bottom: 8 }
    }
  };
}

/**
 * Ticker - Scrolling marquee for credibility
 */
function createTickerBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Ticker',
    elements: [{
      id: generateId(),
      type: 'ticker' as ElementType,
      content: 'Featured in Forbes • Inc Magazine • TechCrunch • Entrepreneur • Business Insider',
      props: {
        speed: 30,
        direction: 'left',
        pauseOnHover: true,
        textColor: '#6B7280',
        fontSize: 'sm',
        fontWeight: '500',
        letterSpacing: '0.05em',
        separator: ' • ',
        backgroundColor: 'transparent'
      }
    }],
    props: {
      fullWidth: true,
      padding: { top: 12, bottom: 12 }
    }
  };
}

/**
 * Badge - Attention-grabbing pill
 */
function createBadgeBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Badge',
    elements: [{
      id: generateId(),
      type: 'badge' as ElementType,
      content: 'LIMITED TIME OFFER',
      props: {
        variant: 'gradient',
        gradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { color: '#8B5CF6', position: 0 },
            { color: '#EC4899', position: 100 }
          ]
        },
        icon: 'sparkles',
        iconPosition: 'left',
        size: 'md',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: '600',
        borderRadius: '9999px',
        textColor: '#FFFFFF',
        padding: { horizontal: 16, vertical: 8 }
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 8, bottom: 8 }
    }
  };
}

/**
 * Process Step - Numbered step indicator
 */
function createProcessStepBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Process Step',
    elements: [{
      id: generateId(),
      type: 'process-step' as ElementType,
      content: 'Get Started',
      props: {
        stepNumber: 1,
        title: 'Get Started',
        description: 'Sign up in under 2 minutes',
        indicatorStyle: 'circle',
        indicatorColor: '#8B5CF6',
        indicatorSize: 40,
        titleSize: 'lg',
        titleWeight: '600',
        titleColor: '#111827',
        descriptionColor: 'rgba(0,0,0,0.6)',
        descriptionSize: 'sm',
        showConnector: false,
        alignment: 'center'
      }
    }],
    props: {
      alignment: 'center',
      padding: { top: 16, bottom: 16 }
    }
  };
}

/**
 * Check if a block ID is a premium block
 */
export function isPremiumBlockId(blockId: string): boolean {
  const premiumIds = [
    'gradient-text',
    'underline-text', 
    'stat-number',
    'avatar-group',
    'ticker',
    'badge',
    'process-step'
  ];
  return premiumIds.includes(blockId);
}
