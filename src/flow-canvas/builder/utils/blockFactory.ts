/**
 * Block Factory - Creates all block types for the funnel builder
 * This is the unified source of truth for creating blocks from the SectionPicker
 */

import type { Block, BlockType, Element, ElementType } from '../../types/infostack';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Master block factory - routes to specific creators
 */
export function createBlock(blockId: string): Block | null {
  const factory = BLOCK_FACTORIES[blockId];
  if (factory) {
    return factory();
  }
  return null;
}

/**
 * Check if a block ID is supported
 */
export function isValidBlockId(blockId: string): boolean {
  return blockId in BLOCK_FACTORIES;
}

/**
 * Get all supported block IDs
 */
export function getAllBlockIds(): string[] {
  return Object.keys(BLOCK_FACTORIES);
}

// ============================================================
// BASIC BLOCKS
// ============================================================

function createTextBlock(): Block {
  return {
    id: generateId(),
    type: 'text-block' as BlockType,
    label: 'Text',
    elements: [{
      id: generateId(),
      type: 'text' as ElementType,
      content: 'Add your text here. Click to edit.',
      props: {
        fontSize: 'base',
        textAlign: 'left',
        textColor: '#374151',
      },
    }],
    props: { alignment: 'left' },
  };
}

function createButtonBlock(): Block {
  return {
    id: generateId(),
    type: 'cta' as BlockType,
    label: 'Button',
    elements: [{
      id: generateId(),
      type: 'button' as ElementType,
      content: 'Click Me',
      props: {
        variant: 'primary',
        size: 'lg',
        fullWidth: false,
        backgroundColor: '#8B5CF6',
        textColor: '#FFFFFF',
        borderRadius: '12px',
        action: { type: 'next-step' },
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        alt: 'Image',
        aspectRatio: '16:9',
        objectFit: 'cover',
        borderRadius: '12px',
      },
    }],
    props: { alignment: 'center' },
  };
}

function createListBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'List',
    elements: [{
      id: generateId(),
      type: 'feature-list' as ElementType,
      content: '',
      props: {
        items: [
          { id: generateId(), text: 'First item in your list', icon: 'Check' },
          { id: generateId(), text: 'Second item in your list', icon: 'Check' },
          { id: generateId(), text: 'Third item in your list', icon: 'Check' },
        ],
        iconColor: '#22C55E',
        layout: 'vertical',
        gap: 12,
      },
    }],
    props: { alignment: 'left' },
  };
}

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
        style: 'solid',
        color: 'rgba(0,0,0,0.1)',
        thickness: 1,
        width: '100%',
      },
    }],
    props: {},
  };
}

function createLogoBarBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Logo Bar',
    elements: [{
      id: generateId(),
      type: 'logo-marquee' as ElementType,
      content: '',
      props: {
        logos: [
          { id: 'logo-1', name: 'Coca-Cola', src: '', alt: 'Coca-Cola' },
          { id: 'logo-2', name: 'Zalando', src: '', alt: 'Zalando' },
          { id: 'logo-3', name: 'Braun', src: '', alt: 'Braun' },
          { id: 'logo-4', name: 'IKEA', src: '', alt: 'IKEA' },
          { id: 'logo-5', name: 'Sony', src: '', alt: 'Sony' },
        ],
        speed: 25,
        pauseOnHover: true,
        grayscale: true,
        showTextFallback: true,
        hoverEffect: 'color',
        logoHeight: 32,
        gap: 40,
      },
    }],
    props: { fullWidth: true },
  };
}

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
        count: 5,
        size: 'md',
        colorMode: 'varied',
        overlap: 12,
        showRating: true,
        rating: 4.9,
        ratingCount: 2847,
        ratingSource: 'reviews',
        alignment: 'center',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        responsive: {
          mobile: 24,
          tablet: 32,
        },
      },
    }],
    props: {},
  };
}

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
      },
    }],
    props: { alignment: 'center' },
  };
}

function createTestimonialBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Testimonial',
    elements: [{
      id: generateId(),
      type: 'testimonial' as ElementType,
      content: '"This product completely transformed how I work. The results speak for themselves."',
      props: {
        author: 'Sarah Johnson',
        role: 'CEO',
        company: 'TechStart Inc.',
        avatar: '',
        rating: 5,
        layout: 'card',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
          { id: generateId(), question: 'What is included in the package?', answer: 'Everything you need to get started, including full access to all features.' },
          { id: generateId(), question: 'How long does setup take?', answer: 'Most customers are up and running within 5 minutes.' },
          { id: generateId(), question: 'Is there a money-back guarantee?', answer: 'Yes! We offer a 30-day no-questions-asked refund policy.' },
        ],
        allowMultiple: false,
        defaultOpen: 0,
        iconStyle: 'chevron',
        borderStyle: 'separated',
      },
    }],
    props: { alignment: 'left' },
  };
}

function createTeamBlock(): Block {
  return {
    id: generateId(),
    type: 'team' as BlockType,
    label: 'Team',
    elements: [
      {
        id: generateId(),
        type: 'image' as ElementType,
        content: '',
        props: {
          src: '',
          alt: 'Team Member 1',
          aspectRatio: '1:1',
          borderRadius: '50%',
          size: 80,
          name: 'John Doe',
          role: 'CEO & Founder',
        },
      },
      {
        id: generateId(),
        type: 'image' as ElementType,
        content: '',
        props: {
          src: '',
          alt: 'Team Member 2',
          aspectRatio: '1:1',
          borderRadius: '50%',
          size: 80,
          name: 'Jane Smith',
          role: 'CTO',
        },
      },
      {
        id: generateId(),
        type: 'image' as ElementType,
        content: '',
        props: {
          src: '',
          alt: 'Team Member 3',
          aspectRatio: '1:1',
          borderRadius: '50%',
          size: 80,
          name: 'Mike Wilson',
          role: 'Head of Design',
        },
      },
    ],
    props: { 
      layout: 'grid',
      columns: 3,
      gap: 24,
      alignment: 'center',
    },
  };
}

function createCalendarBlock(): Block {
  return {
    id: generateId(),
    type: 'booking' as BlockType,
    label: 'Calendar',
    elements: [{
      id: generateId(),
      type: 'html-embed' as ElementType,
      content: '',
      props: {
        embedType: 'calendly',
        calendlyUrl: '',
        height: 600,
        hideHeader: false,
        hideEventType: false,
      },
    }],
    props: { alignment: 'center' },
  };
}

function createHtmlBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Custom HTML',
    elements: [{
      id: generateId(),
      type: 'html-embed' as ElementType,
      content: '<div style="padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">Your custom HTML goes here</div>',
      props: {
        embedType: 'custom',
        sandbox: true,
        height: 200,
      },
    }],
    props: {},
  };
}

function createFormBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Form',
    elements: [{
      id: generateId(),
      type: 'form-group' as ElementType,
      content: '',
      props: {
        fields: [
          { id: generateId(), type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name' },
          { id: generateId(), type: 'email', placeholder: 'Your email', required: true, fieldKey: 'email' },
          { id: generateId(), type: 'tel', placeholder: 'Your phone', required: false, fieldKey: 'phone' },
        ],
        layout: 'vertical',
        gap: 12,
      },
    }],
    props: { alignment: 'center' },
  };
}

// ============================================================
// INTERACTIVE BLOCKS
// ============================================================

function createMultipleChoiceBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Multiple Choice',
    elements: [{
      id: generateId(),
      type: 'multiple-choice' as ElementType,
      content: '',
      props: {
        question: 'Select all that apply:',
        options: [
          { id: generateId(), label: 'Option A', value: 'option_a', imageUrl: '' },
          { id: generateId(), label: 'Option B', value: 'option_b', imageUrl: '' },
          { id: generateId(), label: 'Option C', value: 'option_c', imageUrl: '' },
        ],
        allowMultiple: true,
        layout: 'vertical',
        required: false,
        fieldKey: 'multiple_choice',
      },
    }],
    props: { alignment: 'center' },
  };
}

function createSingleChoiceBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Choice',
    elements: [{
      id: generateId(),
      type: 'single-choice' as ElementType,
      content: '',
      props: {
        question: 'Select one:',
        options: [
          { id: generateId(), label: 'Yes', value: 'yes', imageUrl: '' },
          { id: generateId(), label: 'No', value: 'no', imageUrl: '' },
        ],
        layout: 'horizontal',
        required: false,
        fieldKey: 'single_choice',
      },
    }],
    props: { alignment: 'center' },
  };
}

function createQuizBlock(): Block {
  const blockId = generateId();
  
  // Generate step IDs upfront for proper references
  const welcomeStepId = generateId();
  const question1StepId = generateId();
  const question2StepId = generateId();
  const thankYouStepId = generateId();
  
  return {
    id: blockId,
    type: 'application-flow' as BlockType,
    label: 'Quiz',
    // Top-level elements for welcome step display (ApplicationFlowCard renders from here)
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Quick Quiz',
        props: {
          level: 2,
          fontSize: '2xl',
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#111827',
        },
      },
      {
        id: generateId(),
        type: 'text' as ElementType,
        content: 'Answer a few quick questions to see if we\'re a good fit.',
        props: {
          fontSize: 'base',
          textAlign: 'center',
          textColor: '#6B7280',
        },
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Start Quiz →',
        props: {
          variant: 'primary',
          size: 'lg',
          backgroundColor: '#8B5CF6',
          textColor: '#FFFFFF',
          borderRadius: '12px',
          action: { type: 'next-step' },
        },
      },
    ],
    props: {
      // Flow settings stored at block.props level (not nested in flowSettings)
      displayMode: 'one-at-a-time',
      showProgress: true,
      designPreset: 'none', // Invisible by default - user styles the block
      contentWidth: 'md',
      contentAlign: 'center',
      steps: [
        {
          id: welcomeStepId,
          name: 'Welcome',
          type: 'welcome',
          settings: {
            title: 'Quick Quiz',
            description: 'Answer a few quick questions to see if we\'re a good fit.',
            buttonText: 'Start Quiz →',
            buttonAction: { type: 'next-step' },
          },
        },
        {
          id: question1StepId,
          name: 'Question 1',
          type: 'question',
          settings: {
            title: 'What best describes you?',
            questionType: 'single-choice',
            options: ['Beginner', 'Intermediate', 'Expert'],
            buttonText: 'Next',
            buttonAction: { type: 'next-step' },
            fieldKey: 'experience_level',
          },
        },
        {
          id: question2StepId,
          name: 'Question 2',
          type: 'question',
          settings: {
            title: 'What is your main goal?',
            questionType: 'single-choice',
            options: ['Learn new skills', 'Grow my business', 'Scale to new levels'],
            buttonText: 'See Results',
            buttonAction: { type: 'next-step' },
            fieldKey: 'main_goal',
          },
        },
        {
          id: thankYouStepId,
          name: 'Thank You',
          type: 'ending',
          settings: {
            title: 'Thanks for completing the quiz!',
            description: 'We\'ll be in touch with personalized recommendations.',
            buttonText: 'Learn More',
            buttonAction: { type: 'url', value: '' },
            showConfetti: false,
          },
        },
      ],
    },
  };
}

function createVideoQuestionBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Video Question',
    elements: [
      {
        id: generateId(),
        type: 'video' as ElementType,
        content: '',
        props: {
          src: '',
          aspectRatio: '16:9',
          autoplay: true,
          muted: false,
          loop: false,
          controls: true,
        },
      },
      {
        id: generateId(),
        type: 'single-choice' as ElementType,
        content: '',
        props: {
          question: 'Did this video answer your question?',
          options: [
            { id: generateId(), label: 'Yes, continue', value: 'yes' },
            { id: generateId(), label: 'I have more questions', value: 'no' },
          ],
          layout: 'horizontal',
          fieldKey: 'video_question',
        },
      },
    ],
    props: { alignment: 'center', gap: 24 },
  };
}

function createFormBlockInteractive(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Form',
    elements: [{
      id: generateId(),
      type: 'form-group' as ElementType,
      content: '',
      props: {
        fields: [
          { id: generateId(), type: 'text', placeholder: 'Full name', required: true, fieldKey: 'full_name' },
          { id: generateId(), type: 'email', placeholder: 'Email address', required: true, fieldKey: 'email' },
          { id: generateId(), type: 'tel', placeholder: 'Phone number', required: false, fieldKey: 'phone' },
          { id: generateId(), type: 'textarea', placeholder: 'Your message', required: false, fieldKey: 'message' },
        ],
        layout: 'vertical',
        gap: 16,
        showLabels: true,
      },
    }],
    props: { alignment: 'center' },
  };
}

function createAppointmentBlock(): Block {
  return {
    id: generateId(),
    type: 'booking' as BlockType,
    label: 'Appointment',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Book Your Free Consultation',
        props: {
          level: 2,
          fontSize: '2xl',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        id: generateId(),
        type: 'html-embed' as ElementType,
        content: '',
        props: {
          embedType: 'calendly',
          calendlyUrl: '',
          height: 650,
          hideHeader: true,
          hideEventType: false,
        },
      },
    ],
    props: { alignment: 'center' },
  };
}

function createUploadBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Upload',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        inputType: 'file',
        accept: 'image/*,.pdf,.doc,.docx',
        multiple: false,
        maxSize: 10, // MB
        placeholder: 'Drop files here or click to upload',
        fieldKey: 'file_upload',
        required: false,
      },
    }],
    props: { alignment: 'center' },
  };
}

function createMessageBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Message',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        inputType: 'textarea',
        placeholder: 'Type your message here...',
        rows: 4,
        fieldKey: 'message',
        required: false,
        maxLength: 1000,
      },
    }],
    props: { alignment: 'center' },
  };
}

function createDateBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Date',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        inputType: 'date',
        placeholder: 'Select a date',
        fieldKey: 'date',
        required: false,
        minDate: 'today',
        maxDate: '',
      },
    }],
    props: { alignment: 'center' },
  };
}

function createDropdownBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Dropdown',
    elements: [{
      id: generateId(),
      type: 'select' as ElementType,
      content: '',
      props: {
        placeholder: 'Select an option',
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ],
        fieldKey: 'dropdown',
        required: false,
        searchable: false,
      },
    }],
    props: { alignment: 'center' },
  };
}

function createPaymentBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Payment',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Complete Your Purchase',
        props: {
          level: 2,
          fontSize: 'xl',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        id: generateId(),
        type: 'html-embed' as ElementType,
        content: '',
        props: {
          embedType: 'stripe',
          priceId: '',
          successUrl: '',
          cancelUrl: '',
          mode: 'payment', // 'payment' | 'subscription'
        },
      },
    ],
    props: { alignment: 'center' },
  };
}

// ============================================================
// PREMIUM BLOCKS (migrated from premiumBlockFactory)
// ============================================================

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
            { color: '#EC4899', position: 100 },
          ],
        },
        fontSize: '2xl',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        fontSize: 'xl',
        fontWeight: '600',
        textAlign: 'center',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        textAlign: 'center',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        count: 5,
        size: 'md',
        colorMode: 'varied',
        overlap: 12,
        alignment: 'center',
      },
    }],
    props: { alignment: 'center' },
  };
}

function createTickerBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Ticker',
    elements: [{
      id: generateId(),
      type: 'ticker' as ElementType,
      content: '',
      props: {
        items: ['Featured in Forbes', 'Inc Magazine', 'TechCrunch', 'Entrepreneur'],
        speed: 30,
        direction: 'left',
        pauseOnHover: true,
        separator: '  •  ',
      },
    }],
    props: { fullWidth: true },
  };
}

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
            { color: '#EC4899', position: 100 },
          ],
        },
        icon: 'sparkles',
        size: 'md',
        textTransform: 'uppercase',
      },
    }],
    props: { alignment: 'center' },
  };
}

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
        showConnector: false,
      },
    }],
    props: { alignment: 'center' },
  };
}

// ============================================================
// FACTORY REGISTRY
// ============================================================

const BLOCK_FACTORIES: Record<string, () => Block> = {
  // Basic blocks
  'text': createTextBlock,
  'button': createButtonBlock,
  'image': createImageBlock,
  'list': createListBlock,
  'divider': createDividerBlock,
  'logo-bar': createLogoBarBlock,
  'reviews': createReviewsBlock,
  'spacer': createSpacerBlock,
  'video': createVideoBlock,
  'testimonial': createTestimonialBlock,
  'faq': createFaqBlock,
  'team': createTeamBlock,
  'calendar': createCalendarBlock,
  'html': createHtmlBlock,
  'form': createFormBlock,
  
  // Interactive blocks
  'multiple-choice': createMultipleChoiceBlock,
  'choice': createSingleChoiceBlock,
  'quiz': createQuizBlock,
  'video-question': createVideoQuestionBlock,
  'form-block': createFormBlockInteractive,
  'appointment': createAppointmentBlock,
  'upload': createUploadBlock,
  'message': createMessageBlock,
  'date': createDateBlock,
  'dropdown': createDropdownBlock,
  'payment': createPaymentBlock,
  
  // Premium blocks
  'gradient-text': createGradientTextBlock,
  'underline-text': createUnderlineTextBlock,
  'stat-number': createStatNumberBlock,
  'avatar-group': createAvatarGroupBlock,
  'ticker': createTickerBlock,
  'badge': createBadgeBlock,
  'process-step': createProcessStepBlock,
};
