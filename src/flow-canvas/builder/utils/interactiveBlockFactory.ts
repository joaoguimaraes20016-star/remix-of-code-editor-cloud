/**
 * Interactive Block Factory - Creates polished, Perspective-style blocks
 * for interactive/form elements with professional defaults
 */

import type { Block, BlockType, Element, ElementType } from '../../types/infostack';

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// All interactive block IDs
const INTERACTIVE_BLOCK_IDS = [
  'multiple-choice',
  'choice',
  'quiz',
  'video-question',
  'form-block',
  'appointment',
  'upload',
  'message',
  'date',
  'dropdown',
  'payment',
  'input',
  'email-input',
  'phone-input',
  'checkbox',
  'consent',
] as const;

export type InteractiveBlockId = typeof INTERACTIVE_BLOCK_IDS[number];

/**
 * Check if a block ID is an interactive block
 */
export function isInteractiveBlockId(blockId: string): blockId is InteractiveBlockId {
  return INTERACTIVE_BLOCK_IDS.includes(blockId as InteractiveBlockId);
}

/**
 * Create an interactive block with Perspective-style defaults
 */
export function createInteractiveBlock(blockId: string): Block | null {
  switch (blockId) {
    case 'multiple-choice':
      return createMultipleChoiceBlock();
    case 'choice':
      return createChoiceBlock();
    case 'quiz':
      return createQuizBlock();
    case 'video-question':
      return createVideoQuestionBlock();
    case 'form-block':
      return createFormBlockBlock();
    case 'appointment':
      return createAppointmentBlock();
    case 'upload':
      return createUploadBlock();
    case 'message':
      return createMessageBlock();
    case 'date':
      return createDateBlock();
    case 'dropdown':
      return createDropdownBlock();
    case 'payment':
      return createPaymentBlock();
    case 'input':
      return createInputBlock();
    case 'email-input':
      return createEmailInputBlock();
    case 'phone-input':
      return createPhoneInputBlock();
    case 'checkbox':
      return createCheckboxBlock();
    case 'consent':
      return createConsentBlock();
    default:
      return null;
  }
}

/**
 * Multiple Choice Block - Perspective-style blue filled cards with emoji icons
 */
function createMultipleChoiceBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Multiple Choice',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'How did you hear about us?',
        props: {
          level: 2,
          fontSize: '2xl',
          fontWeight: 'bold',
          textAlign: 'center',
          textColor: '#111827',
          lineHeight: '1.2',
        }
      },
      {
        id: generateId(),
        type: 'multiple-choice' as ElementType,
        content: '',
        props: {
          options: [
            { id: generateId(), label: 'Social media', icon: '🎟️' },
            { id: generateId(), label: 'Word of mouth', icon: '💬' },
            { id: generateId(), label: 'Advertising', icon: '⭐' },
            { id: generateId(), label: 'Search engine', icon: '👀' },
          ],
          layout: 'vertical',
          multiSelect: false,
          // Perspective-style blue filled cards
          cardStyle: 'filled',
          cardBackgroundColor: '#2563EB',
          cardTextColor: '#FFFFFF',
          cardBorderRadius: '16px',
          cardPadding: '24px 28px',
          gap: 16,
          // Icon on left, no indicator
          showIcon: true,
          iconPosition: 'left',
          iconSize: 24,
          hoverEffect: true,
          hoverBackgroundColor: '#1D4ED8',
          selectedBackgroundColor: '#1E40AF',
          fullWidth: true,
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 24,
    }
  };
}

/**
 * Choice Block - Image card selection (2 options)
 */
function createChoiceBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Choice',
    elements: [{
      id: generateId(),
      type: 'single-choice' as ElementType,
      content: 'Make your choice',
      props: {
        options: [
          {
            id: generateId(),
            label: 'Option One',
            imageUrl: '',
            description: 'Description for option one',
          },
          {
            id: generateId(),
            label: 'Option Two',
            imageUrl: '',
            description: 'Description for option two',
          },
        ],
        layout: 'cards',
        columns: 2,
        cardBorderRadius: '16px',
        showImages: true,
        imageAspectRatio: '4:3',
        gap: 16,
        selectedBorderColor: '#2563EB',
        selectedBorderWidth: 3,
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Quiz Block - Question with blue choice cards
 */
function createQuizBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Quiz',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'What best describes your situation?',
        props: {
          level: 3,
          fontSize: 'xl',
          fontWeight: '600',
          textAlign: 'center',
          textColor: '#111827',
        }
      },
      {
        id: generateId(),
        type: 'multiple-choice' as ElementType,
        content: '',
        props: {
          options: [
            { id: generateId(), label: 'Just getting started', icon: '🤝' },
            { id: generateId(), label: 'Looking to scale', icon: '🚀' },
            { id: generateId(), label: 'Need optimization', icon: '🌟' },
            { id: generateId(), label: 'Want consultation', icon: '📞' },
          ],
          layout: 'vertical',
          cardStyle: true,
          cardBackgroundColor: '#2563EB',
          cardTextColor: '#FFFFFF',
          cardBorderRadius: '12px',
          cardPadding: '16px 24px',
          gap: 12,
          fullWidth: true,
          hoverEffect: true,
        }
      },
    ],
    props: {
      alignment: 'center',
      gap: 24,
    }
  };
}

/**
 * Video Question Block - Video with multiple choice below
 */
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
          borderRadius: '12px',
          placeholder: true,
          placeholderText: 'Add your video',
          controls: true,
        }
      },
      {
        id: generateId(),
        type: 'multiple-choice' as ElementType,
        content: 'Select your answer',
        props: {
          options: [
            { id: generateId(), label: 'Answer A' },
            { id: generateId(), label: 'Answer B' },
            { id: generateId(), label: 'Answer C' },
          ],
          layout: 'vertical',
          cardStyle: true,
          cardBackgroundColor: '#2563EB',
          cardTextColor: '#FFFFFF',
          cardBorderRadius: '12px',
          gap: 12,
          fullWidth: true,
        }
      },
    ],
    props: {
      alignment: 'center',
      gap: 20,
    }
  };
}

/**
 * Form Block Block - Multi-field form (name, email, phone)
 */
function createFormBlockBlock(): Block {
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
          placeholder: 'Your full name',
          inputType: 'text',
          required: true,
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          fullWidth: true,
          label: 'Name',
        }
      },
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'your@email.com',
          inputType: 'email',
          required: true,
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          fullWidth: true,
          label: 'Email',
        }
      },
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: '+1 (555) 000-0000',
          inputType: 'tel',
          required: false,
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          fullWidth: true,
          label: 'Phone',
        }
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Submit',
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
      alignment: 'stretch',
      gap: 16,
      maxWidth: '480px',
    }
  };
}

/**
 * Appointment Block - Calendar booking widget placeholder
 */
function createAppointmentBlock(): Block {
  return {
    id: generateId(),
    type: 'booking' as BlockType,
    label: 'Appointment',
    elements: [{
      id: generateId(),
      type: 'calendar-embed' as ElementType,
      content: '',
      props: {
        placeholder: true,
        placeholderText: 'Calendar booking will appear here',
        aspectRatio: '4:3',
        borderRadius: '12px',
        backgroundColor: '#F9FAFB',
        border: '2px dashed #E5E7EB',
        embedType: 'calendly',
        embedUrl: '',
      }
    }],
    props: {
      alignment: 'center',
    }
  };
}

/**
 * Upload Block - File upload drop zone
 */
function createUploadBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'File Upload',
    elements: [{
      id: generateId(),
      type: 'upload' as ElementType,
      content: '',
      props: {
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 10485760, // 10MB
        multiple: false,
        dropzoneText: 'Drag and drop your file here, or click to browse',
        borderRadius: '12px',
        border: '2px dashed #E5E7EB',
        backgroundColor: '#F9FAFB',
        hoverBackgroundColor: '#F3F4F6',
        iconColor: '#9CA3AF',
        padding: '40px',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Message Block - Long-form textarea input
 */
function createMessageBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Message',
    elements: [{
      id: generateId(),
      type: 'textarea' as ElementType,
      content: '',
      props: {
        placeholder: 'Type your message here...',
        rows: 4,
        required: false,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
        resize: 'vertical',
        label: 'Message',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Date Block - Date picker input
 */
function createDateBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Date Picker',
    elements: [{
      id: generateId(),
      type: 'date-picker' as ElementType,
      content: '',
      props: {
        placeholder: 'Select a date',
        required: false,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
        icon: 'calendar',
        iconPosition: 'right',
        label: 'Date',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Dropdown Block - Select menu with options
 */
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
          { value: 'option4', label: 'Option 4' },
        ],
        required: false,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
        icon: 'chevron-down',
        label: 'Select',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Payment Block - Stripe checkout placeholder
 */
function createPaymentBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'Payment',
    elements: [{
      id: generateId(),
      type: 'payment-form' as ElementType,
      content: '',
      props: {
        placeholder: true,
        placeholderText: 'Stripe payment form will appear here',
        borderRadius: '12px',
        backgroundColor: '#F9FAFB',
        border: '2px dashed #E5E7EB',
        padding: '32px',
        provider: 'stripe',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Input Block - Generic text input
 */
function createInputBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Input',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        placeholder: 'Enter your response',
        inputType: 'text',
        required: false,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Email Input Block - Email field with validation
 */
function createEmailInputBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Email Input',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        placeholder: 'your@email.com',
        inputType: 'email',
        required: true,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
        label: 'Email Address',
        validation: 'email',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Phone Input Block - Phone field with formatting
 */
function createPhoneInputBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Phone Input',
    elements: [{
      id: generateId(),
      type: 'input' as ElementType,
      content: '',
      props: {
        placeholder: '+1 (555) 000-0000',
        inputType: 'tel',
        required: false,
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '16px',
        border: '1px solid #E5E7EB',
        fullWidth: true,
        label: 'Phone Number',
        format: 'phone',
      }
    }],
    props: {
      alignment: 'stretch',
    }
  };
}

/**
 * Checkbox Block - Single checkbox option
 */
function createCheckboxBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Checkbox',
    elements: [{
      id: generateId(),
      type: 'checkbox' as ElementType,
      content: 'I agree to the terms and conditions',
      props: {
        required: false,
        checkboxSize: 20,
        checkboxColor: '#2563EB',
        labelColor: '#111827',
        labelSize: 'base',
        gap: 12,
      }
    }],
    props: {
      alignment: 'left',
    }
  };
}

/**
 * Consent Block - Privacy/marketing consent checkbox
 */
function createConsentBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Consent',
    elements: [{
      id: generateId(),
      type: 'checkbox' as ElementType,
      content: 'I consent to receive marketing communications and agree to the privacy policy.',
      props: {
        required: true,
        checkboxSize: 20,
        checkboxColor: '#2563EB',
        labelColor: 'rgba(0, 0, 0, 0.7)',
        labelSize: 'sm',
        gap: 12,
        isConsent: true,
      }
    }],
    props: {
      alignment: 'left',
    }
  };
}
