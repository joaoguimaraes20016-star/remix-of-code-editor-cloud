import { BlockDefinition, BlockType, BlockStyles, CountryCode } from '@/funnel-builder-v3/types/funnel';

const defaultStyles: BlockStyles = {
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  borderRadius: 0,
  shadow: 'none',
  animation: 'none',
};

// Default country codes for phone inputs
export const defaultCountryCodes: CountryCode[] = [
  { id: '1', code: '+1', name: 'United States', flag: '🇺🇸' },
  { id: '2', code: '+1', name: 'Canada', flag: '🇨🇦' },
  { id: '3', code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { id: '4', code: '+91', name: 'India', flag: '🇮🇳' },
  { id: '5', code: '+61', name: 'Australia', flag: '🇦🇺' },
  { id: '6', code: '+49', name: 'Germany', flag: '🇩🇪' },
  { id: '7', code: '+33', name: 'France', flag: '🇫🇷' },
  { id: '8', code: '+81', name: 'Japan', flag: '🇯🇵' },
  { id: '9', code: '+86', name: 'China', flag: '🇨🇳' },
  { id: '10', code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { id: '11', code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { id: '12', code: '+34', name: 'Spain', flag: '🇪🇸' },
  { id: '13', code: '+39', name: 'Italy', flag: '🇮🇹' },
  { id: '14', code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { id: '15', code: '+46', name: 'Sweden', flag: '🇸🇪' },
];

export const blockDefinitions: Record<BlockType, BlockDefinition> = {
  // Content Blocks
  heading: {
    type: 'heading',
    name: 'Heading',
    icon: 'Type',
    category: 'content',
    defaultContent: {
      text: 'Your Headline Here',
      level: 1,
      styles: {
        fontSize: 32,
        fontWeight: 700,
        textAlign: 'center',
      },
    },
    defaultStyles: { ...defaultStyles, padding: { top: 24, right: 16, bottom: 8, left: 16 } },
  },
  text: {
    type: 'text',
    name: 'Text',
    icon: 'AlignLeft',
    category: 'content',
    defaultContent: {
      text: 'Add your body text here. Click to edit and make it your own.',
      styles: {
        fontSize: 16,
        fontWeight: 400,
        textAlign: 'center',
        lineHeight: 1.6,
      },
    },
    defaultStyles: { ...defaultStyles, padding: { top: 8, right: 16, bottom: 16, left: 16 } },
  },
  image: {
    type: 'image',
    name: 'Image',
    icon: 'Image',
    category: 'content',
    defaultContent: {
      src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
      alt: 'Image description',
      aspectRatio: '16:9',
    },
    defaultStyles: { ...defaultStyles, borderRadius: 12 },
  },
  video: {
    type: 'video',
    name: 'Video',
    icon: 'Play',
    category: 'content',
    defaultContent: {
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'youtube',
      autoplay: false,
    },
    defaultStyles: { ...defaultStyles, borderRadius: 12 },
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    icon: 'Minus',
    category: 'content',
    defaultContent: {
      style: 'solid',
    },
    defaultStyles: { ...defaultStyles, padding: { top: 16, right: 0, bottom: 16, left: 0 } },
  },
  spacer: {
    type: 'spacer',
    name: 'Spacer',
    icon: 'Square',
    category: 'content',
    defaultContent: {
      height: 40,
    },
    defaultStyles: { ...defaultStyles, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
  },

  // Conversion Blocks
  button: {
    type: 'button',
    name: 'Button',
    icon: 'MousePointer',
    category: 'conversion',
    defaultContent: {
      text: 'Get Started',
      variant: 'primary',
      size: 'lg',
      action: 'next-step',
      fullWidth: true,
      backgroundColor: '#3b82f6',
      color: '#ffffff',
    },
    defaultStyles: { ...defaultStyles, padding: { top: 16, right: 24, bottom: 16, left: 24 }, textAlign: 'center' },
  },
  form: {
    type: 'form',
    name: 'Form',
    icon: 'FileText',
    category: 'conversion',
    defaultContent: {
      title: 'Where can we reach you?',
      fields: [
        { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
        { id: '3', type: 'phone', label: 'Phone', placeholder: 'Your phone number', required: false },
      ],
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'lg',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      consent: {
        enabled: false,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  'popup-form': {
    type: 'popup-form',
    name: 'Popup Form',
    icon: 'Maximize2',
    category: 'conversion',
    defaultContent: {
      title: 'Where can we reach you?',
      popupSettings: {
        enabled: true,
        trigger: 'on-load',
        delay: 0,
        required: true,
      },
      fields: [
        { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { id: '2', type: 'email', label: 'Email', placeholder: 'Enter your email', required: true },
        { id: '3', type: 'phone', label: 'Phone', placeholder: 'Your phone number', required: false },
      ],
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'lg',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      consent: {
        enabled: true,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  'email-capture': {
    type: 'email-capture',
    name: 'Email Capture',
    icon: 'Mail',
    category: 'conversion',
    defaultContent: {
      placeholder: 'Enter your email',
      subtitle: 'Join 10,000+ subscribers',
      submitButton: {
        text: 'Subscribe',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: false,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      consent: {
        enabled: false,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  'phone-capture': {
    type: 'phone-capture',
    name: 'Phone Input',
    icon: 'Phone',
    category: 'conversion',
    defaultContent: {
      placeholder: 'Your phone number',
      submitButton: {
        text: 'Call Me',
        variant: 'primary',
        size: 'lg',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      consent: {
        enabled: false,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  calendar: {
    type: 'calendar',
    name: 'Calendar',
    icon: 'Calendar',
    category: 'conversion',
    defaultContent: {
      placeholder: 'Select a date',
      buttonText: 'Book Now',
    } as any,
    defaultStyles,
  },

  // Trust Blocks
  reviews: {
    type: 'reviews',
    name: 'Reviews Badge',
    icon: 'Star',
    category: 'trust',
    defaultContent: {
      avatars: [],
      rating: 4.8,
      reviewCount: '200+',
      starColor: '#facc15',
    },
    defaultStyles,
  },
  'testimonial-slider': {
    type: 'testimonial-slider',
    name: 'Testimonials',
    icon: 'Quote',
    category: 'trust',
    defaultContent: {
      testimonials: [
        { 
          id: '1', 
          quote: 'This product changed my life. I can\'t imagine going back to the old way of doing things.', 
          authorName: 'Sarah Johnson',
          authorTitle: 'Marketing Director',
          backgroundImage: '' 
        },
      ],
      autoPlay: false,
      interval: 5,
    },
    defaultStyles,
  },
  'logo-bar': {
    type: 'logo-bar',
    name: 'Logo Bar',
    icon: 'Layers',
    category: 'trust',
    defaultContent: {
      title: 'Trusted by leading companies',
      logos: [
        { id: '1', src: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128', alt: 'Apple' },
        { id: '2', src: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128', alt: 'Microsoft' },
        { id: '3', src: 'https://www.google.com/s2/favicons?domain=slack.com&sz=128', alt: 'Slack' },
        { id: '4', src: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128', alt: 'Stripe' },
      ],
      grayscale: false,
      animated: false,
      speed: 'medium',
      direction: 'left',
      pauseOnHover: true,
    },
    defaultStyles: { ...defaultStyles, padding: { top: 32, right: 16, bottom: 32, left: 16 } },
  },
  'social-proof': {
    type: 'social-proof',
    name: 'Social Proof',
    icon: 'Users',
    category: 'trust',
    defaultContent: {
      items: [
        { id: '1', value: 10000, label: 'Happy Customers', suffix: '+' },
        { id: '2', value: 50, label: 'Countries', suffix: '+' },
        { id: '3', value: 99, label: 'Satisfaction', suffix: '%' },
      ],
    },
    defaultStyles,
  },

  // Layout Blocks
  columns: {
    type: 'columns',
    name: 'Columns',
    icon: 'Columns',
    category: 'layout',
    defaultContent: {
      columns: 2,
      gap: 16,
      blocks: [[], []],
    },
    defaultStyles,
  },
  card: {
    type: 'card',
    name: 'Card',
    icon: 'Square',
    category: 'layout',
    defaultContent: {
      blocks: [],
    },
    defaultStyles: { ...defaultStyles, backgroundColor: 'hsl(var(--card))', borderRadius: 16, shadow: 'sm', borderWidth: 1, borderColor: 'hsl(var(--border))' },
  },
  accordion: {
    type: 'accordion',
    name: 'FAQ',
    icon: 'ChevronDown',
    category: 'layout',
    defaultContent: {
      items: [
        { id: '1', title: 'What is this product?', content: 'This is an amazing product that solves your problems.', defaultOpen: true },
        { id: '2', title: 'How does it work?', content: 'Simply sign up and start using it immediately.' },
        { id: '3', title: 'Is there a free trial?', content: 'Yes! We offer a 14-day free trial with no credit card required.' },
      ],
    },
    defaultStyles,
  },

  // Advanced Blocks
  countdown: {
    type: 'countdown',
    name: 'Countdown',
    icon: 'Clock',
    category: 'advanced',
    defaultContent: {
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      showDays: true,
      expiredText: 'Offer Expired',
    },
    defaultStyles,
  },
  quiz: {
    type: 'quiz',
    name: 'Quiz',
    icon: 'HelpCircle',
    category: 'advanced',
    defaultContent: {
      question: 'What best describes you?',
      options: [
        { id: '1', text: 'Beginner' },
        { id: '2', text: 'Intermediate' },
        { id: '3', text: 'Advanced' },
      ],
      multiSelect: false,
      showSubmitButton: true,
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
    },
    defaultStyles,
  },

  // New Block Types
  list: {
    type: 'list',
    name: 'List',
    icon: 'List',
    category: 'content',
    defaultContent: {
      items: [
        { id: '1', text: 'First item in your list' },
        { id: '2', text: 'Second item in your list' },
        { id: '3', text: 'Third item in your list' },
      ],
      style: 'bullet',
    },
    defaultStyles,
  },
  slider: {
    type: 'slider',
    name: 'Slider',
    icon: 'Images',
    category: 'content',
    defaultContent: {
      images: [
        { id: '1', src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop', alt: 'Slide 1' },
        { id: '2', src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', alt: 'Slide 2' },
        { id: '3', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', alt: 'Slide 3' },
      ],
      autoplay: true,
      interval: 5, // Now in seconds
      showDots: true,
      showArrows: true,
    },
    defaultStyles: { ...defaultStyles, borderRadius: 12 },
  },
  graphic: {
    type: 'graphic',
    name: 'Graphic',
    icon: 'Smile',
    category: 'content',
    defaultContent: {
      type: 'emoji',
      value: '🚀',
      size: 64,
    },
    defaultStyles: { ...defaultStyles, padding: { top: 24, right: 16, bottom: 24, left: 16 } },
  },
  webinar: {
    type: 'webinar',
    name: 'Webinar',
    icon: 'Video',
    category: 'content',
    defaultContent: {
      videoSrc: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoType: 'youtube',
      title: 'Watch Our Free Masterclass',
      buttonText: 'Register Now',
    },
    defaultStyles,
  },
  loader: {
    type: 'loader',
    name: 'Loader',
    icon: 'Loader2',
    category: 'content',
    defaultContent: {
      text: 'Processing your information...',
      subtext: 'This only takes a few seconds',
      loaderStyle: 'circular',
      size: 'medium',
      duration: 3,
      action: { type: 'next-step' },
    },
    defaultStyles,
  },
  embed: {
    type: 'embed',
    name: 'Embed',
    icon: 'Code',
    category: 'content',
    defaultContent: {
      provider: 'html',
      height: 400,
    },
    defaultStyles,
  },

  // Interactive - Questions
  'multiple-choice': {
    type: 'multiple-choice',
    name: 'Multiple Choice',
    icon: 'CheckSquare',
    category: 'advanced',
    defaultContent: {
      question: 'Select all that apply:',
      options: [
        { id: '1', text: 'Option A' },
        { id: '2', text: 'Option B' },
        { id: '3', text: 'Option C' },
      ],
      multiSelect: true,
      showSubmitButton: true,
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
    },
    defaultStyles,
  },
  choice: {
    type: 'choice',
    name: 'Choice',
    icon: 'CircleDot',
    category: 'advanced',
    defaultContent: {
      question: 'Choose one option:',
      options: [
        { id: '1', text: 'Option A' },
        { id: '2', text: 'Option B' },
        { id: '3', text: 'Option C' },
      ],
      multiSelect: false,
      showSubmitButton: true,
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
    },
    defaultStyles,
  },
  'image-quiz': {
    type: 'image-quiz',
    name: 'Image Quiz',
    icon: 'Image',
    category: 'advanced',
    defaultContent: {
      question: 'Which one do you prefer?',
      options: [
        { id: '1', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop', text: 'Option A' },
        { id: '2', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop', text: 'Option B' },
        { id: '3', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop', text: 'Option C' },
        { id: '4', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop', text: 'Option D' },
      ],
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
    },
    defaultStyles,
  },
  'video-question': {
    type: 'video-question',
    name: 'Video Question',
    icon: 'PlayCircle',
    category: 'advanced',
    defaultContent: {
      videoSrc: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoType: 'youtube',
      question: 'After watching, what resonated most with you?',
      options: [
        { id: '1', text: 'Option A' },
        { id: '2', text: 'Option B' },
        { id: '3', text: 'Option C' },
      ],
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
    },
    defaultStyles,
  },

  // Interactive - Forms
  upload: {
    type: 'upload',
    name: 'Upload',
    icon: 'Upload',
    category: 'conversion',
    defaultContent: {
      label: 'Upload your file',
      acceptedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
      maxSize: 10,
      buttonText: 'Submit',
      consent: {
        enabled: false,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  message: {
    type: 'message',
    name: 'Message',
    icon: 'MessageSquare',
    category: 'conversion',
    defaultContent: {
      label: 'Your Message',
      placeholder: 'Type your message here...',
      minRows: 4,
      maxLength: 500,
      submitButton: {
        text: 'Submit',
        variant: 'primary',
        size: 'md',
        action: 'next-step',
        fullWidth: true,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      consent: {
        enabled: false,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
  'date-picker': {
    type: 'date-picker',
    name: 'Date',
    icon: 'Calendar',
    category: 'conversion',
    defaultContent: {
      label: 'Select a date',
      placeholder: 'Pick a date',
    },
    defaultStyles,
  },
  dropdown: {
    type: 'dropdown',
    name: 'Dropdown',
    icon: 'ChevronDown',
    category: 'conversion',
    defaultContent: {
      label: 'Select an option',
      placeholder: 'Choose...',
      options: [
        { id: '1', value: 'option1', label: 'Option 1' },
        { id: '2', value: 'option2', label: 'Option 2' },
        { id: '3', value: 'option3', label: 'Option 3' },
      ],
    },
    defaultStyles,
  },
  payment: {
    type: 'payment',
    name: 'Payment',
    icon: 'CreditCard',
    category: 'conversion',
    defaultContent: {
      amount: 99,
      currency: 'USD',
      buttonText: 'Pay Now',
      description: 'One-time payment',
      consent: {
        enabled: true,
        text: 'I have read and accept the',
        linkText: 'privacy policy',
        linkUrl: '#',
        required: true,
      },
    },
    defaultStyles,
  },
};

export const blockCategories = [
  { id: 'content', name: 'Content', icon: 'FileText' },
  { id: 'conversion', name: 'Conversion', icon: 'Zap' },
  { id: 'trust', name: 'Trust', icon: 'Shield' },
  { id: 'layout', name: 'Layout', icon: 'Layout' },
  { id: 'advanced', name: 'Advanced', icon: 'Sparkles' },
] as const;

export function getBlocksByCategory(category: string): BlockDefinition[] {
  return Object.values(blockDefinitions).filter(b => b.category === category);
}
