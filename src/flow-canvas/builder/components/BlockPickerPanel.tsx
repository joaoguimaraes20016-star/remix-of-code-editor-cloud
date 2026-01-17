import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Type, Image, MousePointer, 
  Mail, Phone, User, UserCheck, ChevronRight,
  HelpCircle, ListChecks, Video, FileText, X, ArrowLeft, Layers, Calendar, Workflow,
  Sparkles, Star, SlidersHorizontal, Shapes, Timer, Loader2, MapPin, Code,
  Upload, MessageSquare, CalendarDays, CreditCard, LayoutGrid, List, Minus, Play,
  Users, Package, Quote, PanelLeftClose, Image as ImageIcon, Layout
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Block, ApplicationFlowStep, ApplicationStepType, ApplicationFlowStepSettings, QuestionType } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';


const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ TYPE DEFINITIONS ============

interface BlockTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  template: () => Block;
}

interface BlockCategory {
  id: string;
  label: string;
  hint?: string;
  blocks: BlockTemplate[];
  defaultOpen?: boolean;
}

type AddMode = 'block' | 'section';

interface BlockPickerPanelProps {
  onAddBlock: (block: Block, options?: { type: AddMode }) => void;
  onClose: () => void;
  targetSectionId?: string | null;
  /** When true, hides the Sections tab (used when adding content inside an existing section) */
  hideSecionsTab?: boolean;
  /** Which tab to start on */
  initialTab?: ActiveTab;
  /** ID of the active Application Flow block (if one exists) */
  activeApplicationFlowBlockId?: string | null;
  /** Callback to add a step to existing Application Flow */
  onAddApplicationFlowStep?: (step: ApplicationFlowStep) => void;
  /** Callback to create a new Application Flow with an initial step */
  onCreateApplicationFlowWithStep?: (step: ApplicationFlowStep) => void;
  /** Target stack ID - when set, the picker was opened for a specific section (Add Content button) */
  targetStackId?: string | null;
  /** Callback to open AI Generate modal */
  onOpenAIGenerate?: () => void;
  /** Callback to close the entire left panel */
  onClosePanel?: () => void;
}

type ActiveTab = 'blocks' | 'sections';

// ============ QUESTIONS ============

const questionBlocks: BlockTemplate[] = [
  {
    type: 'application-step',
    label: 'Open-Ended',
    icon: <Type size={16} />,
    description: 'Free text answer',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Open Question',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your biggest challenge right now?', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Type your answer...', required: true, fieldKey: 'challenge' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    type: 'application-step',
    label: 'Single Choice',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>,
    description: 'Radio — pick one',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Single Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'What best describes you?', props: { level: 3 } },
        { id: generateId(), type: 'radio', content: 'Just getting started', props: { name: 'stage', value: 'beginner' } },
        { id: generateId(), type: 'radio', content: 'Growing my business', props: { name: 'stage', value: 'growing' } },
        { id: generateId(), type: 'radio', content: 'Scaling to 7+ figures', props: { name: 'stage', value: 'scaling' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    type: 'application-step',
    label: 'Multiple Choice',
    icon: <ListChecks size={16} />,
    description: 'Checkboxes — pick many',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Multiple Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'What are you looking for? (Select all)', props: { level: 3 } },
        { id: generateId(), type: 'checkbox', content: 'More leads', props: { name: 'goals', value: 'leads' } },
        { id: generateId(), type: 'checkbox', content: 'Higher conversions', props: { name: 'goals', value: 'conversions' } },
        { id: generateId(), type: 'checkbox', content: 'Better retention', props: { name: 'goals', value: 'retention' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    type: 'application-step',
    label: 'Video Question',
    icon: <Video size={16} />,
    description: 'Video prompt with answer',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Video Question',
      elements: [
        { id: generateId(), type: 'video', content: '', props: { src: '', autoplay: false } },
        { id: generateId(), type: 'heading', content: 'After watching, what resonated most?', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your thoughts...', required: true, fieldKey: 'video_response' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
];

// ============ FORM FIELDS ============

const formFields: BlockTemplate[] = [
  {
    type: 'application-step',
    label: 'Email',
    icon: <Mail size={16} />,
    description: 'Email with validation',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Email Capture',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your email?', props: { level: 3 } },
        { id: generateId(), type: 'text', content: 'We\'ll send your results here.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Phone',
    icon: <Phone size={16} />,
    description: 'Phone with formatting',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Phone Capture',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your phone number?', props: { level: 3 } },
        { id: generateId(), type: 'text', content: 'For important updates only.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'tel', placeholder: '+1 (555) 000-0000', required: true, fieldKey: 'phone', icon: 'phone' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Name',
    icon: <User size={16} />,
    description: 'Full name input',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Name',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your name?', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your full name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Contact Info',
    icon: <UserCheck size={16} />,
    description: 'Collect name, email, phone',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Contact Info',
      elements: [
        { id: generateId(), type: 'heading', content: 'Where can we reach you?', props: { level: 2 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'Your email address', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'tel', placeholder: 'Your phone number', required: false, fieldKey: 'phone', icon: 'phone' } },
        { id: generateId(), type: 'checkbox', content: 'I agree to the privacy policy and terms of service', props: { name: 'consent', value: 'agreed', required: true } },
        { id: generateId(), type: 'button', content: 'Submit and proceed', props: { size: 'lg', preset: 'primary', fullWidth: true, buttonAction: { type: 'submit' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Upload',
    icon: <Upload size={16} />,
    description: 'File upload field',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Upload',
      elements: [
        { id: generateId(), type: 'heading', content: 'Upload your file', props: { level: 3 } },
        { id: generateId(), type: 'text', content: 'Supported formats: PDF, DOC, JPG, PNG', props: { variant: 'subtext' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'file', required: false, fieldKey: 'file_upload' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Message',
    icon: <MessageSquare size={16} />,
    description: 'Long text input',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Message',
      elements: [
        { id: generateId(), type: 'heading', content: 'Tell us more', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'textarea', placeholder: 'Write your message here...', required: true, fieldKey: 'message' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Date',
    icon: <CalendarDays size={16} />,
    description: 'Date selection',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Date',
      elements: [
        { id: generateId(), type: 'heading', content: 'Select a date', props: { level: 3 } },
        { id: generateId(), type: 'input', content: '', props: { type: 'date', required: true, fieldKey: 'selected_date' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Dropdown',
    icon: <List size={16} />,
    description: 'Select menu',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Dropdown',
      elements: [
        { id: generateId(), type: 'heading', content: 'Choose an option', props: { level: 3 } },
        { id: generateId(), type: 'select', content: '', props: { 
          options: ['Option 1', 'Option 2', 'Option 3'], 
          placeholder: 'Select...', 
          required: true, 
          fieldKey: 'selection' 
        } },
        { id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    type: 'application-step',
    label: 'Payment',
    icon: <CreditCard size={16} />,
    description: 'Payment form',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Payment',
      elements: [
        { id: generateId(), type: 'heading', content: 'Complete your payment', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Secure payment powered by Stripe', props: { variant: 'subtext' } },
        { id: generateId(), type: 'button', content: 'Pay Now', props: { size: 'lg', preset: 'primary', fullWidth: true, buttonAction: { type: 'submit' } } },
      ],
      props: { trackingId: '', intent: 'payment' },
    }),
  },
];

// ============ BASIC BLOCKS ============

const basicBlocks: BlockTemplate[] = [
  {
    type: 'text-block',
    label: 'Text',
    icon: <Type size={16} />,
    description: 'Paragraph or body copy',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Text',
      elements: [{ id: generateId(), type: 'text', content: 'Your supporting text goes here. Keep it short and persuasive.', props: {} }],
      props: {},
    }),
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: <FileText size={16} />,
    description: 'Question or section title',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Heading',
      elements: [{ id: generateId(), type: 'heading', content: 'Your main headline', props: { level: 2 } }],
      props: {},
    }),
  },
  {
    type: 'cta',
    label: 'Button',
    icon: <MousePointer size={16} />,
    description: 'CTA or navigation button',
    template: () => ({
      id: generateId(),
      type: 'cta',
      label: 'Button',
      elements: [{ id: generateId(), type: 'button', content: 'Continue', props: { buttonAction: { type: 'next-step' } } }],
      props: { href: '' },
    }),
  },
  {
    type: 'media',
    label: 'Image',
    icon: <Image size={16} />,
    description: 'Photo or graphic',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Image',
      elements: [{ id: generateId(), type: 'image', content: '', props: { alt: 'Image', src: '' } }],
      props: { aspectRatio: '16:9' },
    }),
  },
  {
    type: 'list',
    label: 'List',
    icon: <List size={16} />,
    description: 'Bullet or numbered list',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'List',
      elements: [
        { id: generateId(), type: 'text', content: '• First item\n• Second item\n• Third item', props: {} }
      ],
      props: {},
    }),
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: <Minus size={16} />,
    description: 'Horizontal separator',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Divider',
      elements: [{ id: generateId(), type: 'divider', content: '', props: {} }],
      props: {},
    }),
  },
  {
    type: 'video',
    label: 'Video',
    icon: <Video size={16} />,
    description: 'Embed video',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Video',
      elements: [{ id: generateId(), type: 'video', content: '', props: { src: '', autoplay: false } }],
      props: { aspectRatio: '16:9' },
    }),
  },
  {
    type: 'logo-bar',
    label: 'Logo Bar',
    icon: <LayoutGrid size={16} />,
    description: 'Client/partner logos',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Logo Bar',
      elements: [{ id: generateId(), type: 'image', content: '', props: { 
        variant: 'logo-bar',
        logos: [],
        grayscale: true
      } }],
      props: {},
    }),
  },
  {
    type: 'reviews',
    label: 'Reviews',
    icon: <Star size={16} />,
    description: 'Star ratings display',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Reviews',
      elements: [{ id: generateId(), type: 'text', content: '★★★★★ 127 reviews', props: { 
        variant: 'reviews',
        rating: 5,
        count: 127,
        source: 'Google'
      } }],
      props: {},
    }),
  },
  {
    type: 'testimonial-block',
    label: 'Testimonial',
    icon: <Quote size={16} />,
    description: 'Customer quote',
    template: () => ({
      id: generateId(),
      type: 'testimonial',
      label: 'Testimonial',
      elements: [
        { id: generateId(), type: 'text', content: '"This completely transformed my business. Highly recommended!"', props: { variant: 'quote' } },
        { id: generateId(), type: 'text', content: '— Sarah M., Agency Owner', props: { variant: 'caption' } },
      ],
      props: {},
    }),
  },
  {
    type: 'slider',
    label: 'Slider',
    icon: <SlidersHorizontal size={16} />,
    description: 'Image carousel',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Slider',
      elements: [{ id: generateId(), type: 'image', content: '', props: { 
        variant: 'slider',
        slides: [],
        autoplay: true,
        interval: 5000
      } }],
      props: {},
    }),
  },
  {
    type: 'graphic',
    label: 'Graphic',
    icon: <Shapes size={16} />,
    description: 'Decorative icons/emojis',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Graphic',
      elements: [{ id: generateId(), type: 'icon', content: '🚀', props: { 
        size: 'lg',
        align: 'center'
      } }],
      props: {},
    }),
  },
];

// ============ INFORMATIVE BLOCKS ============

const informativeBlocks: BlockTemplate[] = [
  {
    type: 'webinar',
    label: 'Webinar',
    icon: <Play size={16} />,
    description: 'Video with progress bar',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Webinar',
      elements: [
        { id: generateId(), type: 'video', content: '', props: { src: '', autoplay: false, showProgress: true } },
      ],
      props: { showProgress: true, requireWatch: false },
    }),
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: <HelpCircle size={16} />,
    description: 'Accordion Q&A',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'FAQ',
      elements: [{ id: generateId(), type: 'text', content: 'Q: What is included?\nA: Everything you need to get started.\n\nQ: How long does it take?\nA: Results typically within 30 days.', props: { 
        variant: 'faq',
        items: [
          { question: 'What is included?', answer: 'Everything you need to get started.' },
          { question: 'How long does it take?', answer: 'Results typically within 30 days.' },
          { question: 'Is there a guarantee?', answer: 'Yes, 30-day money back guarantee.' },
        ]
      } }],
      props: {},
    }),
  },
  {
    type: 'countdown',
    label: 'Countdown',
    icon: <Timer size={16} />,
    description: 'Timer countdown',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Countdown',
      elements: [{ 
        id: generateId(), 
        type: 'countdown', 
        content: '', 
        props: { 
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          style: 'boxes',
          expiredAction: 'show-message',
          showLabels: true,
          showDays: true,
          showSeconds: true
        } 
      }],
      props: {},
    }),
  },
  {
    type: 'loader',
    label: 'Loader',
    icon: <Loader2 size={16} />,
    description: 'Progress indicator',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Loader',
      elements: [{ 
        id: generateId(), 
        type: 'loader', 
        content: 'Analyzing your results...', 
        props: { 
          animationType: 'analyzing',
          duration: 3000,
          autoAdvance: true,
          showProgress: true
        } 
      }],
      props: {},
    }),
  },
];

// ============ EMBED BLOCKS ============

const embedBlocks: BlockTemplate[] = [
  {
    type: 'trustpilot',
    label: 'Trustpilot',
    icon: <Star size={16} />,
    description: 'Trustpilot reviews widget',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Trustpilot',
      elements: [{ 
        id: generateId(), 
        type: 'trustpilot', 
        content: '', 
        props: { 
          rating: 4.5,
          reviewCount: 1234,
          layout: 'horizontal',
          showLogo: true,
          showReviewCount: true
        } 
      }],
      props: {},
    }),
  },
  {
    type: 'google-maps',
    label: 'Google Maps',
    icon: <MapPin size={16} />,
    description: 'Embed location map',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Google Maps',
      elements: [{ 
        id: generateId(), 
        type: 'map-embed', 
        content: '', 
        props: { 
          address: '',
          zoom: 15,
          mapType: 'roadmap'
        } 
      }],
      props: {},
    }),
  },
  {
    type: 'html-embed',
    label: 'HTML',
    icon: <Code size={16} />,
    description: 'Custom code embed',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'HTML Embed',
      elements: [{ 
        id: generateId(), 
        type: 'html-embed', 
        content: '', 
        props: { 
          code: '',
          allowScripts: false
        } 
      }],
      props: {},
    }),
  },
  {
    type: 'carousel',
    label: 'Image Carousel',
    icon: <ImageIcon size={16} />,
    description: 'Slideshow gallery',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Image Carousel',
      elements: [{ 
        id: generateId(), 
        type: 'carousel', 
        content: '', 
        props: { 
          slides: [],
          autoplay: false,
          autoplayInterval: 4000,
          navigationStyle: 'both',
          loop: true,
          aspectRatio: '16:9'
        } 
      }],
      props: {},
    }),
  },
  {
    type: 'logo-marquee',
    label: 'Logo Bar',
    icon: <Layout size={16} />,
    description: 'Animated logo scroll',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Logo Bar',
      elements: [{ 
        id: generateId(), 
        type: 'logo-marquee', 
        content: '', 
        props: { 
          logos: [],
          animated: true,
          speed: 30,
          direction: 'left',
          pauseOnHover: true,
          grayscale: true,
          logoHeight: 40,
          gap: 48
        } 
      }],
      props: {},
    }),
  },
];

// ============ SCHEDULING & BOOKING ============

const schedulingBlocks: BlockTemplate[] = [
  {
    type: 'booking',
    label: 'Book a Call',
    icon: <Calendar size={16} />,
    description: 'Calendly embed — schedule appointments',
    template: () => ({
      id: generateId(),
      type: 'booking',
      label: 'Book a Call',
      elements: [
        { id: generateId(), type: 'heading', content: 'Schedule Your Call', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Pick a time that works best for you.', props: { variant: 'subtext' } },
      ],
      props: { calendlyUrl: '', intent: 'schedule' },
    }),
  },
  {
    type: 'appointment',
    label: 'Appointment',
    icon: <CalendarDays size={16} />,
    description: 'Built-in appointment picker',
    template: () => ({
      id: generateId(),
      type: 'booking',
      label: 'Appointment',
      elements: [
        { id: generateId(), type: 'heading', content: 'Select a Time', props: { level: 2 } },
      ],
      props: { intent: 'schedule' },
    }),
  },
];


// ============ FLOW CONTAINER ============

const flowBlocks: BlockTemplate[] = [
  {
    type: 'application-flow',
    label: 'Flow Container',
    icon: <Workflow size={16} />,
    description: 'Group questions into a Typeform-style experience',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Flow Container',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#000000',
        inputBackground: '#ffffff',
        inputBorderColor: '#e5e7eb',
        steps: [
          {
            id: generateId(),
            name: 'Welcome',
            type: 'welcome',
            settings: {
              title: 'Apply Now',
              description: 'Complete your application below.',
              buttonText: 'Start →',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'next' },
          },
          {
            id: generateId(),
            name: 'Question',
            type: 'question',
            settings: {
              title: 'What is your biggest challenge?',
              questionType: 'multiple-choice',
              options: ['Not enough leads', 'Low conversions', "Can't scale"],
              buttonText: 'Continue',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'next' },
          },
          {
            id: generateId(),
            name: 'Your Info',
            type: 'capture',
            settings: {
              title: 'Where should we send your results?',
              collectName: true,
              collectEmail: true,
              collectPhone: false,
              buttonText: 'Submit',
              align: 'center',
              spacing: 'normal',
            },
            elements: [],
            navigation: { action: 'submit' },
          },
        ],
      },
    }),
  },
];

// ============ BLOCK CATEGORIES ============

const blockCategories: BlockCategory[] = [
  {
    id: 'basic',
    label: 'Basic Blocks',
    hint: 'Text, images, and layout elements',
    blocks: basicBlocks,
    defaultOpen: true,
  },
  {
    id: 'informative',
    label: 'Informative',
    hint: 'Webinar, FAQ, timers & loaders',
    blocks: informativeBlocks,
    defaultOpen: false,
  },
  {
    id: 'embed',
    label: 'Embed',
    hint: 'External widgets & custom code',
    blocks: embedBlocks,
    defaultOpen: false,
  },
  {
    id: 'questions',
    label: 'Questions',
    hint: 'Survey & qualification questions',
    blocks: questionBlocks,
    defaultOpen: true,
  },
  {
    id: 'forms',
    label: 'Forms',
    hint: 'Lead capture & data collection',
    blocks: formFields,
    defaultOpen: false,
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    hint: 'Booking & appointments',
    blocks: schedulingBlocks,
    defaultOpen: false,
  },
  {
    id: 'flows',
    label: 'Flows',
    hint: 'Multi-step experiences',
    blocks: flowBlocks,
    defaultOpen: false,
  },
];

// ============ SECTION TEMPLATES ============

interface SectionCategory {
  id: string;
  label: string;
  hint?: string;
  sections: BlockTemplate[];
  defaultOpen?: boolean;
}

const heroSections: BlockTemplate[] = [
  {
    type: 'hero',
    label: 'Welcome / Hero',
    icon: <Layers size={16} />,
    description: 'First impression with CTA',
    template: () => ({
      id: generateId(),
      type: 'hero',
      label: 'Welcome',
      elements: [
        { id: generateId(), type: 'heading', content: 'Welcome! Let\'s Get Started', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'Answer a few quick questions to see if we\'re a good fit.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'button', content: 'Start Application', props: { size: 'lg', buttonAction: { type: 'next-step' } } },
      ],
      props: { intent: 'collect' },
    }),
  },
];

const contentSections: BlockTemplate[] = [
  {
    type: 'testimonial',
    label: 'Testimonial',
    icon: <Quote size={16} />,
    description: 'Social proof with quote',
    template: () => ({
      id: generateId(),
      type: 'testimonial',
      label: 'Testimonial',
      elements: [
        { id: generateId(), type: 'text', content: '"This completely transformed my business. I went from struggling to scaling in just 3 months."', props: { variant: 'quote' } },
        { id: generateId(), type: 'text', content: '— Sarah M., Agency Owner', props: { variant: 'caption' } },
      ],
      props: {},
    }),
  },
  {
    type: 'text-block',
    label: 'Thank You',
    icon: <HelpCircle size={16} />,
    description: 'Confirmation screen',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Thank You',
      elements: [
        { id: generateId(), type: 'heading', content: 'You\'re All Set! 🎉', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'We\'ve received your application. Check your inbox for next steps.', props: { variant: 'subtext' } },
      ],
      props: { intent: 'complete' },
    }),
  },
  {
    type: 'about',
    label: 'About Us',
    icon: <Users size={16} />,
    description: 'Company or personal intro',
    template: () => ({
      id: generateId(),
      type: 'about',
      label: 'About Us',
      elements: [
        { id: generateId(), type: 'heading', content: 'About Us', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'We help businesses grow with proven strategies and expert guidance.', props: {} },
      ],
      props: {},
    }),
  },
  {
    type: 'team',
    label: 'Team',
    icon: <Users size={16} />,
    description: 'Team member cards',
    template: () => ({
      id: generateId(),
      type: 'team',
      label: 'Team',
      elements: [
        { id: generateId(), type: 'heading', content: 'Meet Our Team', props: { level: 2 } },
      ],
      props: { 
        members: [
          { name: 'John Doe', role: 'CEO', image: '' },
          { name: 'Jane Smith', role: 'CTO', image: '' },
        ]
      },
    }),
  },
  {
    type: 'product',
    label: 'Product',
    icon: <Package size={16} />,
    description: 'Product/service showcase',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Product',
      elements: [
        { id: generateId(), type: 'heading', content: 'Our Solution', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Everything you need to succeed in one powerful platform.', props: {} },
      ],
      props: {},
    }),
  },
];

const advancedSections: BlockTemplate[] = [
  {
    type: 'custom',
    label: 'Empty Section',
    icon: <Plus size={16} />,
    description: 'Build from scratch',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Section',
      elements: [],
      props: {},
    }),
  },
];

const sectionCategories: SectionCategory[] = [
  {
    id: 'hero',
    label: 'Hero',
    hint: 'Opening sections with CTAs',
    sections: heroSections,
    defaultOpen: true,
  },
  {
    id: 'content',
    label: 'Content Sections',
    hint: 'Testimonials, about, team, product',
    sections: contentSections,
    defaultOpen: true,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    hint: 'Build from scratch',
    sections: advancedSections,
    defaultOpen: false,
  },
];
// ============ COLLAPSIBLE CATEGORY COMPONENT ============

// Categories that should add to Application Engine instead of standalone blocks
const APPLICATION_ENGINE_CATEGORIES = ['interactive'];

interface CollapsibleCategoryProps {
  category: BlockCategory | SectionCategory;
  onAddBlock: (template: BlockTemplate, isSection: boolean, categoryId?: string) => void;
  isSection?: boolean;
  activeApplicationFlowBlockId?: string | null;
}

const CollapsibleCategory: React.FC<CollapsibleCategoryProps> = ({ 
  category, 
  onAddBlock,
  isSection = false,
  activeApplicationFlowBlockId,
}) => {
  const [isOpen, setIsOpen] = useState(category.defaultOpen ?? false);
  const blocks = 'blocks' in category ? category.blocks : category.sections;
  const hint = 'hint' in category ? category.hint : undefined;

  // Check if this category routes to Application Engine (only show badge when flow exists)
  const isFlowCategory = APPLICATION_ENGINE_CATEGORIES.includes(category.id);
  const showFlowBadge = isFlowCategory && activeApplicationFlowBlockId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 px-1 py-2 hover:bg-builder-surface-hover/50 rounded-lg transition-colors cursor-pointer">
          <ChevronRight 
            size={16} 
            className={`text-builder-text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
          />
          <span className="text-sm font-medium text-builder-text">{category.label}</span>
          <span className="text-[11px] text-builder-text-dim bg-builder-surface-active/80 px-2 py-0.5 rounded-full">
            {blocks.length}
          </span>
          {showFlowBadge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
              → Flow
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-1 pb-2 pt-1 space-y-2">
          {hint && (
            <p className="text-[10px] text-builder-accent mb-2">{hint}</p>
          )}
          {blocks.map((block, idx) => (
            <button
              key={`${block.label}-${idx}`}
              onClick={() => onAddBlock(block, isSection, category.id)}
              className="w-full text-left p-3 rounded-xl bg-builder-bg border border-builder-border-subtle hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-builder-surface-hover text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                  {block.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-builder-text">{block.label}</span>
                    <ChevronRight className="w-4 h-4 text-builder-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-builder-text-dim mt-0.5">{block.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============ COMPONENT ============

export const BlockPickerPanel: React.FC<BlockPickerPanelProps> = ({
  onAddBlock,
  onClose,
  targetSectionId,
  hideSecionsTab = false,
  initialTab = 'blocks',
  activeApplicationFlowBlockId,
  onAddApplicationFlowStep,
  onCreateApplicationFlowWithStep,
  targetStackId,
  onOpenAIGenerate,
  onClosePanel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  // Sync activeTab when initialTab prop changes (e.g., switching between blocks/sections)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Use the module-level constant for Application Flow categories
  // (defined at top of file for use in CollapsibleCategory)

  // Convert block template to Application Flow step
  const blockTemplateToFlowStep = (
    blockLabel: string, 
    blockType: string,
    template: Block
  ): ApplicationFlowStep => {
    const id = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Map form-field block types to Application Flow step types
    if (blockType === 'form-field') {
      const intent = template.props?.intent as string | undefined;
      const hasInputs = template.elements.some(e => e.type === 'input');
      const hasRadio = template.elements.some(e => e.type === 'radio');
      const hasCheckbox = template.elements.some(e => e.type === 'checkbox');
      
      // Determine step type
      let stepType: ApplicationStepType = 'question';
      if (intent === 'capture' || blockLabel.includes('Email') || blockLabel.includes('Phone') || blockLabel.includes('Name')) {
        stepType = 'capture';
      }
      
      // Extract question type
      let questionType: QuestionType | undefined;
      if (hasRadio) questionType = 'multiple-choice';
      else if (hasCheckbox) questionType = 'multiple-choice';
      else if (hasInputs) questionType = 'text';
      
      // Extract title from heading element
      const headingEl = template.elements.find(e => e.type === 'heading');
      const title = headingEl?.content || blockLabel;
      
      // Extract description from text element (if any)
      const textEl = template.elements.find(e => e.type === 'text');
      const description = textEl?.content || '';
      
      // Extract options from radio/checkbox elements
      const options = template.elements
        .filter(e => e.type === 'radio' || e.type === 'checkbox')
        .map(e => e.content);
      
      // Extract button text
      const buttonEl = template.elements.find(e => e.type === 'button');
      const buttonText = buttonEl?.content || 'Continue';
      
      // Build settings based on step type - no buttonColor to use neutral default
      const settings: ApplicationFlowStepSettings = {
        title,
        description: description || undefined,
        buttonText,
        questionType,
        options: options.length > 0 ? options : undefined,
        required: true,
      };
      
      // For capture steps, determine which fields to collect
      if (stepType === 'capture') {
        const labelLower = blockLabel.toLowerCase();
        const hasNameInput = template.elements.some(e => 
          e.props?.fieldKey === 'name' || (typeof e.props?.placeholder === 'string' && e.props.placeholder.toLowerCase().includes('name'))
        );
        const hasEmailInput = template.elements.some(e => 
          e.props?.type === 'email' || e.props?.fieldKey === 'email'
        );
        const hasPhoneInput = template.elements.some(e => 
          e.props?.type === 'tel' || e.props?.fieldKey === 'phone'
        );
        
        // Check both label and elements for field types
        settings.collectName = labelLower.includes('name') || hasNameInput || labelLower.includes('full');
        settings.collectEmail = labelLower.includes('email') || hasEmailInput || (!settings.collectName && !hasPhoneInput);
        settings.collectPhone = labelLower.includes('phone') || hasPhoneInput;
        
        // Default: if a "Full Form" or generic capture, enable all fields
        if (labelLower.includes('full') || labelLower.includes('opt-in') || labelLower.includes('application')) {
          settings.collectName = true;
          settings.collectEmail = true;
          settings.collectPhone = hasPhoneInput;
        }
      }
      
      return {
        id,
        name: blockLabel,
        type: stepType,
        elements: [],
        settings,
        navigation: { action: 'next' },
      };
    }
    
    return {
      id,
      name: blockLabel,
      type: 'question',
      elements: [],
      settings: { title: blockLabel, buttonText: 'Continue' },
      navigation: { action: 'next' },
    };
  };

  // Check if a template belongs to Application Engine categories
  const isApplicationFlowCategory = (categoryId: string) => {
    return APPLICATION_ENGINE_CATEGORIES.includes(categoryId);
  };

  // All templates for search
  const allTemplates = [
    ...questionBlocks.map(b => ({ ...b, isSection: false, categoryId: 'questions' })),
    ...formFields.map(b => ({ ...b, isSection: false, categoryId: 'forms' })),
    ...basicBlocks.map(b => ({ ...b, isSection: false, categoryId: 'basic' })),
    ...informativeBlocks.map(b => ({ ...b, isSection: false, categoryId: 'informative' })),
    ...embedBlocks.map(b => ({ ...b, isSection: false, categoryId: 'embed' })),
    ...schedulingBlocks.map(b => ({ ...b, isSection: false, categoryId: 'scheduling' })),
    ...flowBlocks.map(t => ({ ...t, isSection: false, categoryId: 'flows' })),
    ...heroSections.map(t => ({ ...t, isSection: true, categoryId: 'hero' })),
    ...contentSections.map(t => ({ ...t, isSection: true, categoryId: 'content-sections' })),
    ...advancedSections.map(t => ({ ...t, isSection: true, categoryId: 'advanced' })),
  ];

  const filteredResults = searchQuery.length > 0
    ? allTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleAddBlock = (template: BlockTemplate, isSection: boolean = false, categoryId?: string) => {
    // Check if this is a Flow Container (application-flow) - those should be added as standalone
    const isFlowContainer = template.type === 'application-flow';
    
    // Check if this is an application question/capture
    const isApplicationContent = categoryId && isApplicationFlowCategory(categoryId) && !isFlowContainer;
    
    // Check if the picker was opened for a specific stack (via "Add Content" button)
    // When targeting a specific stack, we should NOT route to the flow
    const wasOpenedForSpecificStack = !!targetStackId;
    
    // ONLY add to existing flow if:
    // 1. A flow is actively SELECTED (not just exists on the page)
    // 2. The block is an interactive question/capture (not a Flow Container)
    // 3. The callback exists
    // 4. The picker was NOT opened for a specific stack (Add Content button)
    if (isApplicationContent && activeApplicationFlowBlockId && onAddApplicationFlowStep && !wasOpenedForSpecificStack) {
      // Convert to flow step and add to existing selected flow
      const step = blockTemplateToFlowStep(template.label, template.type, template.template());
      onAddApplicationFlowStep(step);
      onClose();
      return;
    }
    
    // DEFAULT BEHAVIOR: Add as standalone block
    // Interactive blocks (questions, capture fields) are now first-class blocks
    // They can be placed anywhere on the canvas just like Perspective.co
    onAddBlock(template.template(), { type: isSection ? 'section' : 'block' });
    onClose();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-surface">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 py-2 border-b border-builder-border">
        <div className="flex items-center gap-1.5">
          {/* Close Panel Button */}
          {onClosePanel && (
            <button 
              onClick={onClosePanel}
              className="p-1.5 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
              title="Close panel"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
            title="Back to pages"
          >
            <ArrowLeft size={14} />
          </button>
          <Sparkles className="w-3.5 h-3.5 text-builder-accent" />
          <span className="text-xs font-medium text-builder-text">Add Content</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
          title="Close picker"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab Switcher - only show when sections tab is available */}
      {!hideSecionsTab && (
        <div className="flex-shrink-0 flex p-2 gap-1 border-b border-builder-border-subtle">
          <button
            onClick={() => setActiveTab('blocks')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === 'blocks'
                ? "bg-builder-accent text-white"
                : "bg-builder-surface-hover text-builder-text-muted hover:text-builder-text"
            )}
          >
            <Plus size={14} />
            <span>Content</span>
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              activeTab === 'sections'
                ? "bg-builder-accent text-white"
                : "bg-builder-surface-hover text-builder-text-muted hover:text-builder-text"
            )}
          >
            <Layers size={14} />
            <span>Sections</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-builder-border-subtle">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-builder-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'blocks' ? "Search content..." : "Search sections..."}
            className="pl-9 h-8 text-sm bg-builder-surface-hover border-builder-border text-builder-text placeholder:text-builder-text-dim"
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {searchQuery.length > 0 ? (
          // Search Results
          <div className="p-2 pb-20 space-y-2">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-builder-text-muted text-sm">
                No results found
              </div>
            ) : (
              filteredResults.map((template, idx) => (
                <button
                  key={`${template.type}-${template.label}-${idx}`}
                  onClick={() => handleAddBlock(template, template.isSection, template.categoryId)}
                  className="w-full text-left p-3 rounded-xl bg-builder-bg border border-builder-border-subtle hover:border-builder-accent/50 hover:bg-builder-surface-hover transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-builder-surface-hover text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-builder-text">{template.label}</span>
                          {template.isSection && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-builder-accent/20 text-builder-accent font-medium">
                              Section
                            </span>
                          )}
                          {activeApplicationFlowBlockId && template.categoryId && APPLICATION_ENGINE_CATEGORIES.includes(template.categoryId) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                              → Flow
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-builder-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-builder-text-dim mt-0.5">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : activeTab === 'blocks' ? (
          // Blocks Tab Content - Collapsible Categories
          <div className="p-2 pb-20 space-y-1">
            {blockCategories.map((category) => (
              <CollapsibleCategory
                key={category.id}
                category={category}
                onAddBlock={handleAddBlock}
                isSection={false}
                activeApplicationFlowBlockId={activeApplicationFlowBlockId}
              />
            ))}
          </div>
        ) : (
          // Sections Tab Content - Collapsible Categories
          <div className="p-2 pb-20 space-y-1">
            {sectionCategories.map((category) => (
              <CollapsibleCategory
                key={category.id}
                category={category}
                onAddBlock={handleAddBlock}
                isSection={true}
                activeApplicationFlowBlockId={activeApplicationFlowBlockId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate with AI Footer */}
      {onOpenAIGenerate && (
        <div className="flex-shrink-0 p-3 border-t border-builder-border">
          <button 
            onClick={onOpenAIGenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockPickerPanel;
