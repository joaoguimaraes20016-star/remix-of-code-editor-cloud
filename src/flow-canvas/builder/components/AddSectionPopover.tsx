import React, { useState } from 'react';
import { 
  Plus, Search, Type, Image, MousePointer, LayoutGrid, Sparkles,
  Minus, Square, ChevronRight, Award, Quote, Users, HelpCircle,
  ListChecks, Calendar, Mail, ChevronDown, Upload, Video,
  FileText, Link, Star, Package, Zap, MessageSquare
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Block } from '@/flow-canvas/types/infostack';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ TYPE DEFINITIONS ============

interface BlockTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  template: () => Block;
}

interface SectionCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  templates: BlockTemplate[];
}

interface AddSectionPopoverProps {
  onAddBlock: (block: Block) => void;
  onOpenAIGenerate?: () => void;
  position?: 'above' | 'below';
  variant?: 'button' | 'inline' | 'minimal';
  className?: string;
}

// ============ BASIC BLOCKS (Single Elements) ============

const basicBlocks: BlockTemplate[] = [
  {
    type: 'text-block',
    label: 'Text',
    icon: <Type size={16} />,
    description: 'Paragraph text',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Text',
      elements: [{ id: generateId(), type: 'text', content: 'Your supporting text', props: {} }],
      props: {},
    }),
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: <FileText size={16} />,
    description: 'Title text',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Heading',
      elements: [{ id: generateId(), type: 'heading', content: 'Your main headline', props: { level: 2 } }],
      props: {},
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
    type: 'cta',
    label: 'Button',
    icon: <MousePointer size={16} />,
    description: 'Call to action',
    template: () => ({
      id: generateId(),
      type: 'cta',
      label: 'Button',
      elements: [{ id: generateId(), type: 'button', content: 'Click Here', props: { variant: 'primary' } }],
      props: { action: 'next-step', href: '' },
    }),
  },
  {
    type: 'link',
    label: 'Link',
    icon: <Link size={16} />,
    description: 'Text link',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Link',
      elements: [{ id: generateId(), type: 'link', content: 'Learn more', props: { href: '#' } }],
      props: {},
    }),
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: <Minus size={16} />,
    description: 'Vertical space',
    template: () => ({
      id: generateId(),
      type: 'spacer',
      label: 'Spacer',
      elements: [],
      props: { height: 32 },
    }),
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: <Minus size={16} className="rotate-90" />,
    description: 'Horizontal line',
    template: () => ({
      id: generateId(),
      type: 'divider',
      label: 'Divider',
      elements: [],
      props: { style: 'solid', color: 'border' },
    }),
  },
];

// ============ INTERACTIVE BLOCKS (Form Elements) ============

// ============ INTERACTIVE BLOCKS (Application Flow - NOT standalone form-field) ============
// All interactive/form elements should be added through Application Flow
// This ensures unified flow behavior across the builder

const interactiveBlocks: BlockTemplate[] = [
  {
    type: 'application-flow',
    label: 'Text Question',
    icon: <Type size={16} />,
    description: 'Open-ended text input',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Text Question',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Text Question',
            type: 'question',
            settings: {
              title: 'What would you like to tell us?',
              questionType: 'text',
              placeholder: 'Type your answer here...',
              buttonText: 'Continue',
            },
            elements: [],
            navigation: { action: 'next' },
          },
        ],
      },
    }),
  },
  {
    type: 'application-flow',
    label: 'Multiple Choice',
    icon: <ListChecks size={16} />,
    description: 'Multi-select options',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Multiple Choice',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Choose Options',
            type: 'question',
            settings: {
              title: 'Select all that apply:',
              questionType: 'multiple-choice',
              options: ['Option A', 'Option B', 'Option C'],
              buttonText: 'Continue',
            },
            elements: [],
            navigation: { action: 'next' },
          },
        ],
      },
    }),
  },
  {
    type: 'application-flow',
    label: 'Single Choice',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>,
    description: 'Radio button selection',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Single Choice',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Choose One',
            type: 'question',
            settings: {
              title: 'Choose one option:',
              questionType: 'multiple-choice',
              options: ['Option A', 'Option B', 'Option C'],
              buttonText: 'Continue',
            },
            elements: [],
            navigation: { action: 'next' },
          },
        ],
      },
    }),
  },
  {
    type: 'application-flow',
    label: 'Dropdown',
    icon: <ChevronDown size={16} />,
    description: 'Select menu',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Dropdown Question',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Select Option',
            type: 'question',
            settings: {
              title: 'Choose an option',
              questionType: 'dropdown',
              options: ['Option 1', 'Option 2', 'Option 3'],
              buttonText: 'Continue',
            },
            elements: [],
            navigation: { action: 'next' },
          },
        ],
      },
    }),
  },
  {
    type: 'application-flow',
    label: 'Email Capture',
    icon: <Mail size={16} />,
    description: 'Collect email address',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Email Capture',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: false,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Get Access',
            type: 'capture',
            settings: {
              title: 'Get Instant Access',
              description: 'Enter your email below.',
              collectName: false,
              collectEmail: true,
              collectPhone: false,
              buttonText: 'Get Access',
            },
            elements: [],
            navigation: { action: 'submit' },
          },
        ],
      },
    }),
  },
  {
    type: 'application-flow',
    label: 'Full Opt-In',
    icon: <Upload size={16} />,
    description: 'Name, email & phone',
    template: () => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Full Opt-In',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: false,
        transition: 'fade',
        steps: [
          {
            id: generateId(),
            name: 'Your Details',
            type: 'capture',
            settings: {
              title: 'Complete Your Registration',
              description: 'Fill out the form below.',
              collectName: true,
              collectEmail: true,
              collectPhone: true,
              buttonText: 'Submit',
            },
            elements: [],
            navigation: { action: 'submit' },
          },
        ],
      },
    }),
  },
];

// ============ SECTION TEMPLATES (Pre-designed) ============

const sectionCategories: SectionCategory[] = [
  {
    id: 'hero',
    label: 'Hero',
    icon: <LayoutGrid size={16} />,
    templates: [
      {
        type: 'hero',
        label: 'Simple Hero',
        icon: <LayoutGrid size={16} />,
        description: 'Title + subtitle + CTA',
        template: () => ({
          id: generateId(),
          type: 'hero',
          label: 'Hero Section',
          elements: [
            { id: generateId(), type: 'heading', content: 'Welcome to Our Platform', props: { level: 1 } },
            { id: generateId(), type: 'text', content: 'Discover how we can help you achieve your goals faster than ever before.', props: {} },
            { id: generateId(), type: 'button', content: 'Get Started', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { alignment: 'center' },
        }),
      },
      {
        type: 'hero',
        label: 'Hero with Image',
        icon: <LayoutGrid size={16} />,
        description: 'Hero + media',
        template: () => ({
          id: generateId(),
          type: 'hero',
          label: 'Hero with Image',
          elements: [
            { id: generateId(), type: 'heading', content: 'Transform Your Business', props: { level: 1 } },
            { id: generateId(), type: 'text', content: 'Join thousands of companies already using our platform.', props: {} },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Hero image', src: '' } },
            { id: generateId(), type: 'button', content: 'Start Free Trial', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { alignment: 'center' },
        }),
      },
    ],
  },
  {
    id: 'cta',
    label: 'Call to Action',
    icon: <MousePointer size={16} />,
    templates: [
      {
        type: 'cta-section',
        label: 'Simple CTA',
        icon: <MousePointer size={16} />,
        description: 'Text + button',
        template: () => ({
          id: generateId(),
          type: 'cta',
          label: 'Call to Action',
          elements: [
            { id: generateId(), type: 'heading', content: 'Ready to get started?', props: { level: 2 } },
            { id: generateId(), type: 'text', content: 'Take the first step towards your goals today.', props: {} },
            { id: generateId(), type: 'button', content: 'Get Started Now', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { action: 'next-step' },
        }),
      },
      {
        type: 'cta-section',
        label: 'CTA with Input',
        icon: <MousePointer size={16} />,
        description: 'Capture + CTA',
        template: () => ({
          id: generateId(),
          type: 'cta',
          label: 'CTA with Email',
          elements: [
            { id: generateId(), type: 'heading', content: 'Join our newsletter', props: { level: 2 } },
            { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'Enter your email' } },
            { id: generateId(), type: 'button', content: 'Subscribe', props: { variant: 'primary' } },
          ],
          props: { action: 'submit' },
        }),
      },
    ],
  },
  {
    id: 'about',
    label: 'About Us',
    icon: <Users size={16} />,
    templates: [
      {
        type: 'about',
        label: 'About Section',
        icon: <Users size={16} />,
        description: 'Company info',
        template: () => ({
          id: generateId(),
          type: 'about',
          label: 'About Us',
          elements: [
            { id: generateId(), type: 'heading', content: 'About Us', props: { level: 2 } },
            { id: generateId(), type: 'text', content: 'We are a team of passionate individuals dedicated to helping you succeed. With years of experience and a commitment to excellence, we deliver results that matter.', props: {} },
            { id: generateId(), type: 'button', content: 'Learn More', props: { variant: 'outline' } },
          ],
          props: {},
        }),
      },
    ],
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: <Quote size={16} />,
    templates: [
      {
        type: 'testimonial',
        label: 'Single Testimonial',
        icon: <Quote size={16} />,
        description: 'Customer quote',
        template: () => ({
          id: generateId(),
          type: 'testimonial',
          label: 'Testimonial',
          elements: [
            { id: generateId(), type: 'text', content: '"This product changed my life! Highly recommend to everyone."', props: {} },
            { id: generateId(), type: 'text', content: '— Sarah Johnson, CEO', props: { variant: 'caption' } },
          ],
          props: { rating: 5, avatar: '' },
        }),
      },
      {
        type: 'testimonial',
        label: 'Testimonial with Image',
        icon: <Quote size={16} />,
        description: 'Quote + avatar',
        template: () => ({
          id: generateId(),
          type: 'testimonial',
          label: 'Testimonial',
          elements: [
            { id: generateId(), type: 'image', content: '', props: { alt: 'Customer photo', src: '', style: 'avatar' } },
            { id: generateId(), type: 'text', content: '"The best decision I ever made for my business."', props: {} },
            { id: generateId(), type: 'text', content: '— John Smith, Founder', props: { variant: 'caption' } },
          ],
          props: { rating: 5 },
        }),
      },
    ],
  },
  {
    id: 'trust',
    label: 'Trust',
    icon: <Award size={16} />,
    templates: [
      {
        type: 'trust',
        label: 'Trust Badges',
        icon: <Award size={16} />,
        description: 'Social proof',
        template: () => ({
          id: generateId(),
          type: 'trust',
          label: 'Trust Badges',
          elements: [
            { id: generateId(), type: 'text', content: '⭐ 4.9/5 Rating', props: { variant: 'badge' } },
            { id: generateId(), type: 'text', content: '🏆 #1 Rated', props: { variant: 'badge' } },
            { id: generateId(), type: 'text', content: '✓ 10,000+ Users', props: { variant: 'badge' } },
            { id: generateId(), type: 'text', content: '🔒 Secure', props: { variant: 'badge' } },
          ],
          props: { layout: 'horizontal' },
          styles: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' },
        }),
      },
      {
        type: 'trust',
        label: 'Logo Bar',
        icon: <Star size={16} />,
        description: 'Partner logos',
        template: () => ({
          id: generateId(),
          type: 'trust',
          label: 'Logo Bar',
          elements: [
            { id: generateId(), type: 'text', content: 'Trusted by leading companies', props: { variant: 'caption' } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 1', src: '' } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 2', src: '' } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 3', src: '' } },
          ],
          props: { layout: 'horizontal' },
        }),
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    icon: <Package size={16} />,
    templates: [
      {
        type: 'feature',
        label: 'Features Grid',
        icon: <Package size={16} />,
        description: '3 feature cards',
        template: () => ({
          id: generateId(),
          type: 'feature',
          label: 'Features Grid',
          elements: [
            { id: generateId(), type: 'heading', content: 'Why Choose Us', props: { level: 2 } },
            { id: generateId(), type: 'text', content: '🚀 Fast & Reliable', props: { variant: 'feature' } },
            { id: generateId(), type: 'text', content: 'Lightning-fast performance with 99.9% uptime', props: {} },
            { id: generateId(), type: 'text', content: '🔒 Secure', props: { variant: 'feature' } },
            { id: generateId(), type: 'text', content: 'Enterprise-grade security for your data', props: {} },
            { id: generateId(), type: 'text', content: '💬 24/7 Support', props: { variant: 'feature' } },
            { id: generateId(), type: 'text', content: 'Round-the-clock support from our team', props: {} },
          ],
          props: { columns: 3 },
        }),
      },
      {
        type: 'feature',
        label: 'Benefits List',
        icon: <Zap size={16} />,
        description: 'Bullet points',
        template: () => ({
          id: generateId(),
          type: 'feature',
          label: 'Benefits',
          elements: [
            { id: generateId(), type: 'heading', content: 'What You Get', props: { level: 2 } },
            { id: generateId(), type: 'text', content: '✓ Unlimited access to all features', props: {} },
            { id: generateId(), type: 'text', content: '✓ Priority customer support', props: {} },
            { id: generateId(), type: 'text', content: '✓ Free updates and upgrades', props: {} },
            { id: generateId(), type: 'text', content: '✓ 30-day money-back guarantee', props: {} },
          ],
          props: {},
        }),
      },
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle size={16} />,
    templates: [
      {
        type: 'application-flow',
        label: 'Quiz Question',
        icon: <HelpCircle size={16} />,
        description: 'Interactive quiz',
        template: () => ({
          id: generateId(),
          type: 'application-flow',
          label: 'Quiz Flow',
          elements: [],
          props: {
            displayMode: 'one-at-a-time',
            showProgress: true,
            transition: 'slide-up',
            steps: [
              {
                id: generateId(),
                name: 'Quiz Question',
                type: 'question',
                settings: {
                  title: 'What is your biggest challenge?',
                  questionType: 'multiple-choice',
                  options: ['Time management', 'Budget constraints', 'Finding the right tools', 'Team collaboration'],
                  buttonText: 'See My Results',
                },
                elements: [],
                navigation: { action: 'next' },
              },
            ],
          },
        }),
      },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users size={16} />,
    templates: [
      {
        type: 'team',
        label: 'Team Section',
        icon: <Users size={16} />,
        description: 'Team members',
        template: () => ({
          id: generateId(),
          type: 'team',
          label: 'Our Team',
          elements: [
            { id: generateId(), type: 'heading', content: 'Meet Our Team', props: { level: 2 } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Team member 1', src: '', style: 'avatar' } },
            { id: generateId(), type: 'text', content: 'Jane Doe', props: { variant: 'strong' } },
            { id: generateId(), type: 'text', content: 'CEO & Founder', props: { variant: 'caption' } },
          ],
          props: {},
        }),
      },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: <Mail size={16} />,
    templates: [
      {
        type: 'application-flow',
        label: 'Contact Form',
        icon: <Mail size={16} />,
        description: 'Full contact form',
        template: () => ({
          id: generateId(),
          type: 'application-flow',
          label: 'Contact Flow',
          elements: [],
          props: {
            displayMode: 'one-at-a-time',
            showProgress: false,
            transition: 'fade',
            steps: [
              {
                id: generateId(),
                name: 'Contact Info',
                type: 'capture',
                settings: {
                  title: 'Get in Touch',
                  description: 'Fill out the form below and we\'ll get back to you.',
                  collectName: true,
                  collectEmail: true,
                  collectPhone: false,
                  buttonText: 'Send Message',
                },
                elements: [],
                navigation: { action: 'submit' },
              },
              {
                id: generateId(),
                name: 'Thank You',
                type: 'ending',
                settings: {
                  title: 'Thanks for reaching out!',
                  description: 'We\'ll get back to you within 24 hours.',
                },
                elements: [],
                navigation: { action: 'submit' },
              },
            ],
          },
        }),
      },
      {
        type: 'booking',
        label: 'Appointment',
        icon: <Calendar size={16} />,
        description: 'Schedule booking',
        template: () => ({
          id: generateId(),
          type: 'booking',
          label: 'Appointment Booking',
          elements: [
            { id: generateId(), type: 'heading', content: 'Book your appointment', props: { level: 2 } },
            { id: generateId(), type: 'text', content: 'Select a date and time that works for you.', props: {} },
            { id: generateId(), type: 'input', content: '', props: { type: 'datetime-local', placeholder: 'Select date & time' } },
            { id: generateId(), type: 'button', content: 'Book Now', props: { variant: 'primary' } },
          ],
          props: { trackingId: '', duration: 30, timezone: 'auto' },
        }),
      },
    ],
  },
];

// ============ EMPTY SECTION ============

const emptySectionTemplate: BlockTemplate = {
  type: 'empty',
  label: 'Empty Section',
  icon: <Square size={16} />,
  description: 'Start from scratch',
  template: () => ({
    id: generateId(),
    type: 'custom',
    label: 'Custom Section',
    elements: [],
    props: {},
  }),
};

// ============ COMPONENT ============

export const AddSectionPopover: React.FC<AddSectionPopoverProps> = ({
  onAddBlock,
  onOpenAIGenerate,
  position = 'below',
  variant = 'button',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Collect all templates for search
  const allTemplates = [
    ...basicBlocks,
    ...interactiveBlocks,
    ...sectionCategories.flatMap(cat => cat.templates),
  ];

  const filteredResults = searchQuery.length > 0
    ? allTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleAddBlock = (template: BlockTemplate) => {
    onAddBlock(template.template());
    setIsOpen(false);
    setSearchQuery('');
    setExpandedCategory(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {variant === 'button' ? (
          <button
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              bg-[hsl(var(--builder-accent))] text-white
              shadow-lg shadow-[hsl(var(--builder-accent)/0.3)]
              hover:brightness-110 transition-all duration-200
              ${className}
            `}
          >
            <Plus size={20} />
          </button>
        ) : variant === 'minimal' ? (
          <button
            className={`
              flex items-center justify-center gap-1.5 w-full py-2
              text-xs text-[hsl(var(--builder-text-muted))]
              hover:text-[hsl(var(--builder-accent))] transition-colors
              ${className}
            `}
          >
            <Plus size={14} />
            <span>Add block</span>
          </button>
        ) : (
          <button
            type="button"
            className={`
              group w-full flex flex-col items-center justify-center py-16 px-6
              border-2 border-dashed border-gray-300 rounded-xl
              bg-gray-50/50
              hover:border-gray-400 hover:bg-gray-100/50
              transition-all duration-200
              ${className ?? ''}
            `}
          >
            {/* Empty section guidance */}
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Package size={28} className="text-gray-400" />
            </div>
            <span className="text-base font-semibold text-gray-700 mb-1">
              Add a block to this section
            </span>
            <span className="text-sm text-gray-500 mb-5">
              Headlines, text, images, buttons & more
            </span>
            <span
              className={`
                inline-flex items-center gap-2 rounded-lg px-5 py-2.5
                bg-gray-900 text-white
                text-sm font-semibold
                shadow-lg
                group-hover:bg-gray-800 group-hover:scale-[1.02]
                group-active:scale-[0.98]
                transition-all duration-150
              `}
            >
              <Plus size={18} />
              <span>Insert Block</span>
            </span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="fixed left-[260px] top-[80px] w-80 p-0 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] shadow-2xl z-[200] rounded-xl max-h-[calc(100vh-100px)] overflow-hidden"
        side="left"
        align="start"
        sideOffset={0}
        alignOffset={0}
        avoidCollisions={false}
        style={{ position: 'fixed', left: '260px', top: '80px' }}
      >
        {/* Search */}
        <div className="p-3 border-b border-[hsl(var(--builder-border-subtle))]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--builder-text-muted))]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 h-8 text-sm bg-[hsl(var(--builder-surface-hover))] border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text))] placeholder:text-[hsl(var(--builder-text-dim))]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[min(400px,60vh)] overflow-y-auto builder-scroll">
          {searchQuery.length > 0 ? (
            // Search Results
            <div className="p-2">
              {filteredResults.length === 0 ? (
                <div className="p-4 text-center text-[hsl(var(--builder-text-muted))] text-sm">
                  No results found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResults.map((template, idx) => (
                    <button
                      key={`${template.type}-${template.label}-${idx}`}
                      onClick={() => handleAddBlock(template)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[hsl(var(--builder-surface-hover))] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-md bg-[hsl(var(--builder-surface-active))] flex items-center justify-center text-[hsl(var(--builder-text-muted))]">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[hsl(var(--builder-text))]">{template.label}</div>
                        <div className="text-xs text-[hsl(var(--builder-text-dim))] truncate">{template.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Categories View
            <div className="p-2 space-y-0.5">
              {/* Quick Add - Basic Blocks Grid (always visible) */}
              <div className="pb-2 mb-2 border-b border-[hsl(var(--builder-border-subtle))]">
                <div className="px-1 pb-2">
                  <span className="text-[10px] font-semibold text-[hsl(var(--builder-text-dim))] uppercase tracking-wider">Quick Add</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {basicBlocks.slice(0, 8).map((block) => (
                    <button
                      key={block.label}
                      onClick={() => handleAddBlock(block)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--builder-surface-hover))] transition-colors group"
                      title={block.description}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--builder-surface-active))] flex items-center justify-center text-[hsl(var(--builder-text-muted))] group-hover:text-[hsl(var(--builder-accent))] group-hover:bg-[hsl(var(--builder-accent)/0.1)] transition-colors">
                        {block.icon}
                      </div>
                      <span className="text-[10px] text-[hsl(var(--builder-text-dim))] group-hover:text-[hsl(var(--builder-text))]">{block.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Blocks - Collapsible */}
              <Collapsible>

                <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--builder-surface-hover))] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <Zap size={14} className="text-amber-500" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-[hsl(var(--builder-text))]">Form inputs</span>
                      <span className="text-[10px] text-[hsl(var(--builder-text-dim))] block">Text, choice, date, upload</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[hsl(var(--builder-text-dim))]" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-2 py-1.5 space-y-0.5">
                    {interactiveBlocks.map((block) => (
                      <button
                        key={block.label}
                        onClick={() => handleAddBlock(block)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[hsl(var(--builder-surface-hover))] transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded-md bg-[hsl(var(--builder-surface-active))] flex items-center justify-center text-[hsl(var(--builder-text-muted))]">
                          {block.icon}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[hsl(var(--builder-text))]">{block.label}</span>
                          <span className="text-[10px] text-[hsl(var(--builder-text-dim))] block">{block.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Divider + Section Label */}
              <div className="pt-2 mt-2 border-t border-[hsl(var(--builder-border-subtle))]">
                <span className="text-[10px] font-semibold text-[hsl(var(--builder-text-dim))] uppercase tracking-wider px-1">Pre-built Sections</span>
              </div>

              {/* Section Categories - More visual with previews */}
              <div className="space-y-0.5">
                {sectionCategories.map((category) => (
                  <Collapsible
                    key={category.id}
                    open={expandedCategory === category.id}
                    onOpenChange={(open) => setExpandedCategory(open ? category.id : null)}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--builder-surface-hover))] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[hsl(var(--builder-accent)/0.1)] flex items-center justify-center text-[hsl(var(--builder-accent))]">
                          {category.icon}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-medium text-[hsl(var(--builder-text))]">{category.label}</span>
                          <span className="text-[10px] text-[hsl(var(--builder-text-dim))] block">{category.templates.length} templates</span>
                        </div>
                      </div>
                      <ChevronRight 
                        size={14} 
                        className={`text-[hsl(var(--builder-text-dim))] transition-transform duration-200 ${expandedCategory === category.id ? 'rotate-90' : ''}`} 
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-2 py-1.5 space-y-0.5">
                        {category.templates.map((template, idx) => (
                          <button
                            key={`${template.label}-${idx}`}
                            onClick={() => handleAddBlock(template)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[hsl(var(--builder-surface-hover))] transition-colors text-left group"
                          >
                            <div className="w-6 h-6 rounded-md bg-[hsl(var(--builder-accent)/0.15)] flex items-center justify-center text-[hsl(var(--builder-accent))] group-hover:scale-110 transition-transform">
                              {template.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-[hsl(var(--builder-text))]">{template.label}</div>
                              <div className="text-[10px] text-[hsl(var(--builder-text-dim))]">{template.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate with AI */}
        <div className="p-2 border-t border-[hsl(var(--builder-border-subtle))]">
          <button 
            onClick={() => {
              setIsOpen(false);
              onOpenAIGenerate?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg btn-gradient text-sm font-medium ai-glow"
          >
            <Sparkles size={14} />
            Generate with AI
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
