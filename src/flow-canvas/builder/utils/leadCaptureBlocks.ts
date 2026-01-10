import { Block, Element, BlockType } from '../../types/infostack';
import { generateId } from './helpers';

/**
 * Lead Capture Block Templates
 * Pre-configured blocks for common lead capture scenarios
 */

export function createEmailCaptureBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Email Capture',
    elements: [
      {
        id: generateId(),
        type: 'heading',
        content: 'Get Started Today',
        props: { level: 2, textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'text',
        content: 'Enter your email to receive exclusive access',
        props: { textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'input',
        content: '',
        props: { 
          fieldKey: 'email',
          inputType: 'email',
          placeholder: 'Enter your email',
          required: true,
        },
      },
      {
        id: generateId(),
        type: 'button',
        content: 'Get Access',
        props: {
          buttonAction: { type: 'submit' },
        },
      },
    ],
    props: { intent: 'capture' },
  };
}

export function createPhoneCaptureBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Phone Capture',
    elements: [
      {
        id: generateId(),
        type: 'heading',
        content: 'Get a Call Back',
        props: { level: 2, textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'text',
        content: 'Enter your phone number and we\'ll call you shortly',
        props: { textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'input',
        content: '',
        props: { 
          fieldKey: 'phone',
          inputType: 'tel',
          placeholder: 'Enter your phone number',
          required: true,
        },
      },
      {
        id: generateId(),
        type: 'button',
        content: 'Request Callback',
        props: {
          buttonAction: { type: 'submit' },
        },
      },
    ],
    props: { intent: 'capture' },
  };
}

export function createFullOptInBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Full Opt-In',
    elements: [
      {
        id: generateId(),
        type: 'heading',
        content: 'Start Your Free Trial',
        props: { level: 2, textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'text',
        content: 'Fill out the form below to get started',
        props: { textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'input',
        content: '',
        props: { 
          fieldKey: 'name',
          inputType: 'text',
          placeholder: 'Your full name',
          required: true,
        },
      },
      {
        id: generateId(),
        type: 'input',
        content: '',
        props: { 
          fieldKey: 'email',
          inputType: 'email',
          placeholder: 'Your email address',
          required: true,
        },
      },
      {
        id: generateId(),
        type: 'input',
        content: '',
        props: { 
          fieldKey: 'phone',
          inputType: 'tel',
          placeholder: 'Your phone number',
          required: false,
        },
      },
      {
        id: generateId(),
        type: 'button',
        content: 'Start Free Trial',
        props: {
          buttonAction: { type: 'submit' },
        },
      },
    ],
    props: { intent: 'capture' },
  };
}

export function createQuizQuestionBlock(
  question: string = 'What best describes you?',
  options: string[] = ['Option A', 'Option B', 'Option C']
): Block {
  return {
    id: generateId(),
    type: 'quiz' as BlockType,
    label: 'Quiz Question',
    elements: [
      {
        id: generateId(),
        type: 'heading',
        content: question,
        props: { level: 2, textAlign: 'center' },
      },
      ...options.map((option, index) => ({
        id: generateId(),
        type: 'button' as const,
        content: option,
        props: {
          fieldKey: 'quiz_answer',
          fieldValue: option,
          buttonAction: { type: 'next-step' as const },
          variant: 'outline',
        },
      })),
    ],
    props: { intent: 'qualify' },
  };
}

export function createCalendlyEmbedBlock(calendlyUrl: string = ''): Block {
  return {
    id: generateId(),
    type: 'media' as BlockType,
    label: 'Calendly Booking',
    elements: [
      {
        id: generateId(),
        type: 'heading',
        content: 'Book Your Call',
        props: { level: 2, textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'text',
        content: 'Choose a time that works best for you',
        props: { textAlign: 'center' },
      },
      {
        id: generateId(),
        type: 'video', // Use video type for embed
        content: '',
        props: { 
          embedUrl: calendlyUrl,
          embedType: 'calendly',
          height: '600px',
        },
      },
    ],
    props: { intent: 'schedule' },
  };
}

// Lead capture block template definitions for BlockPalette
export const leadCaptureBlockTemplates = [
  {
    id: 'email-capture',
    type: 'form-field' as BlockType,
    name: 'Email Capture',
    description: 'Simple email opt-in form',
    category: 'lead-capture' as const,
    preview: createEmailCaptureBlock,
  },
  {
    id: 'phone-capture',
    type: 'form-field' as BlockType,
    name: 'Phone Capture',
    description: 'Phone number collection form',
    category: 'lead-capture' as const,
    preview: createPhoneCaptureBlock,
  },
  {
    id: 'full-optin',
    type: 'form-field' as BlockType,
    name: 'Full Opt-In',
    description: 'Name, email & phone form',
    category: 'lead-capture' as const,
    preview: createFullOptInBlock,
  },
  {
    id: 'quiz-question',
    type: 'quiz' as BlockType,
    name: 'Quiz Question',
    description: 'Multi-choice question for qualification',
    category: 'lead-capture' as const,
    preview: () => createQuizQuestionBlock(),
  },
  {
    id: 'calendly-embed',
    type: 'media' as BlockType,
    name: 'Calendly Booking',
    description: 'Embedded calendar scheduling',
    category: 'lead-capture' as const,
    preview: () => createCalendlyEmbedBlock(),
  },
];
