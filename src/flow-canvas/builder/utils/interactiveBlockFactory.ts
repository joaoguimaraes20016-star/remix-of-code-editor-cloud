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
 * Quiz Block - Perspective-style 2x2 image grid with blue label footers
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
        content: 'What position best describes your role?',
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
        type: 'single-choice' as ElementType,
        content: '',
        props: {
          options: [
            { id: generateId(), label: 'CEO', imageUrl: '' },
            { id: generateId(), label: 'Management', imageUrl: '' },
            { id: generateId(), label: 'Employee', imageUrl: '' },
            { id: generateId(), label: 'Other Role', imageUrl: '' },
          ],
          layout: 'grid',
          columns: 2,
          // Perspective-style image cards with blue footer
          cardStyle: 'image-footer',
          cardBorderRadius: '16px',
          imageAspectRatio: '4:3',
          footerBackgroundColor: '#2563EB',
          footerTextColor: '#FFFFFF',
          footerPadding: '16px 20px',
          gap: 16,
          hoverEffect: true,
          hoverScale: 1.02,
          selectedBorderColor: '#2563EB',
          selectedBorderWidth: 3,
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
 * Video Question Block - Perspective-style dark video player with play button
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
          borderRadius: '20px',
          placeholder: true,
          // Perspective-style dark video player
          placeholderStyle: 'dark',
          backgroundColor: '#1E293B',
          showPlayButton: true,
          playButtonStyle: 'circle',
          playButtonColor: '#FFFFFF',
          playButtonSize: 56,
          controls: true,
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
 * Form Block - Perspective-style opt-in form with icons
 */
function createFormBlockBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Form',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: "What's the best way to reach you?",
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
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Your name',
          inputType: 'text',
          required: true,
          // Perspective-style rounded input with icon
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'hand',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Your email address',
          inputType: 'email',
          required: true,
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'mail',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Your phone number',
          inputType: 'tel',
          required: false,
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'phone',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'checkbox' as ElementType,
        content: 'I have read and accept the privacy policy.',
        props: {
          required: true,
          checkboxSize: 20,
          checkboxColor: '#2563EB',
          checkboxBorderRadius: '4px',
          labelColor: '#374151',
          labelSize: 'sm',
          gap: 12,
          linkText: 'privacy policy.',
          linkUrl: '/privacy',
        }
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Submit and proceed',
        props: {
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          borderRadius: '16px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
          paddingVertical: 20,
          shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 16,
    }
  };
}

/**
 * Appointment Block - Perspective-style booking form with icons
 */
function createAppointmentBlock(): Block {
  return {
    id: generateId(),
    type: 'booking' as BlockType,
    label: 'Appointment',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Book an appointment now:',
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
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Your name',
          inputType: 'text',
          required: true,
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'user',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'input' as ElementType,
        content: '',
        props: {
          placeholder: 'Your email address',
          inputType: 'email',
          required: true,
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'mail',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'checkbox' as ElementType,
        content: 'I accept the privacy policy.',
        props: {
          required: true,
          checkboxSize: 20,
          checkboxColor: '#2563EB',
          checkboxBorderRadius: '4px',
          labelColor: '#374151',
          labelSize: 'sm',
          gap: 12,
          linkText: 'privacy policy.',
          linkUrl: '/privacy',
        }
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Continue to calendar',
        props: {
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          borderRadius: '16px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
          paddingVertical: 20,
          shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 16,
    }
  };
}

/**
 * Upload Block - Perspective-style file upload with heading
 */
function createUploadBlock(): Block {
  return {
    id: generateId(),
    type: 'custom' as BlockType,
    label: 'File Upload',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Upload your resume',
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
        type: 'upload' as ElementType,
        content: '',
        props: {
          acceptedTypes: ['application/pdf', 'image/png', 'image/jpeg'],
          maxSize: 26214400, // 25MB
          multiple: false,
          // Perspective-style dropzone
          dropzoneText: 'Click here to upload file',
          dropzoneSubtext: '(max. 25MB, .pdf, .png, .jpg)',
          borderRadius: '16px',
          border: '2px dashed #E5E7EB',
          backgroundColor: '#FFFFFF',
          hoverBackgroundColor: '#F9FAFB',
          icon: 'folder',
          iconColor: '#9CA3AF',
          iconSize: 32,
          padding: '32px 24px',
          textColor: '#111827',
          subtextColor: '#6B7280',
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
          borderRadius: '16px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
          paddingVertical: 20,
          shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 16,
    }
  };
}

/**
 * Message Block - Perspective-style textarea with icon
 */
function createMessageBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Message',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Describe your current challenge:',
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
        type: 'textarea' as ElementType,
        content: '',
        props: {
          placeholder: 'Type here',
          rows: 5,
          required: false,
          // Perspective-style rounded textarea with icon
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          resize: 'none',
          icon: 'message-square',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
        }
      },
      {
        id: generateId(),
        type: 'button' as ElementType,
        content: 'Submit and proceed',
        props: {
          variant: 'primary',
          size: 'lg',
          fullWidth: true,
          borderRadius: '16px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
          paddingVertical: 20,
          shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 16,
    }
  };
}

/**
 * Date Block - Perspective-style date picker
 */
function createDateBlock(): Block {
  return {
    id: generateId(),
    type: 'form-field' as BlockType,
    label: 'Date Picker',
    elements: [
      {
        id: generateId(),
        type: 'heading' as ElementType,
        content: 'Please choose a date:',
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
        type: 'date-picker' as ElementType,
        content: '',
        props: {
          placeholder: 'Pick a date',
          required: false,
          // Perspective-style rounded date picker
          borderRadius: '16px',
          padding: '20px 24px 20px 56px',
          fontSize: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          fullWidth: true,
          icon: 'calendar',
          iconPosition: 'left',
          iconColor: '#9CA3AF',
          chevronIcon: 'chevrons-up-down',
          chevronPosition: 'right',
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
          borderRadius: '16px',
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          fontWeight: '600',
          paddingVertical: 20,
          shadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
        }
      },
    ],
    props: {
      alignment: 'stretch',
      gap: 16,
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
