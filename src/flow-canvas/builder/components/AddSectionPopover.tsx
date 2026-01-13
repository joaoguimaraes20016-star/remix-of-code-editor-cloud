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

const interactiveBlocks: BlockTemplate[] = [
  {
    type: 'form-field',
    label: 'Text Input',
    icon: <Type size={16} />,
    description: 'Text field',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Text Input',
      elements: [
        { id: generateId(), type: 'text', content: 'Enter your email', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true } },
      ],
      props: { trackingId: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'Multiple Choice',
    icon: <ListChecks size={16} />,
    description: 'Multi-select',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Multiple Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'Select all that apply:', props: { level: 3 } },
        { id: generateId(), type: 'checkbox', content: 'Option A', props: { name: 'choice', value: 'a' } },
        { id: generateId(), type: 'checkbox', content: 'Option B', props: { name: 'choice', value: 'b' } },
        { id: generateId(), type: 'checkbox', content: 'Option C', props: { name: 'choice', value: 'c' } },
      ],
      props: { trackingId: '', required: false },
    }),
  },
  {
    type: 'form-field',
    label: 'Single Choice',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>,
    description: 'Radio buttons',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Single Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'Choose one option:', props: { level: 3 } },
        { id: generateId(), type: 'radio', content: 'Option A', props: { name: 'single_choice', value: 'a' } },
        { id: generateId(), type: 'radio', content: 'Option B', props: { name: 'single_choice', value: 'b' } },
        { id: generateId(), type: 'radio', content: 'Option C', props: { name: 'single_choice', value: 'c' } },
      ],
      props: { trackingId: '', required: true },
    }),
  },
  {
    type: 'form-field',
    label: 'Dropdown',
    icon: <ChevronDown size={16} />,
    description: 'Select menu',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Dropdown',
      elements: [
        { id: generateId(), type: 'text', content: 'Choose an option', props: { variant: 'label' } },
        { id: generateId(), type: 'select', content: '', props: { options: ['Option 1', 'Option 2', 'Option 3'], placeholder: 'Select...' } },
      ],
      props: { trackingId: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'Date Picker',
    icon: <Calendar size={16} />,
    description: 'Date selection',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Date Picker',
      elements: [
        { id: generateId(), type: 'text', content: 'Select a date', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'date', placeholder: 'Choose date' } },
      ],
      props: { trackingId: '', minDate: '', maxDate: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'File Upload',
    icon: <Upload size={16} />,
    description: 'Upload files',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'File Upload',
      elements: [
        { id: generateId(), type: 'text', content: 'Upload your file', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'file', accept: '.pdf,.doc,.docx,.jpg,.png', multiple: false } },
      ],
      props: { trackingId: '', maxSize: '10MB', allowedTypes: ['pdf', 'doc', 'jpg', 'png'] },
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
        type: 'quiz',
        label: 'Quiz Question',
        icon: <HelpCircle size={16} />,
        description: 'Interactive quiz',
        template: () => ({
          id: generateId(),
          type: 'form-field',
          label: 'Quiz Question',
          elements: [
            { id: generateId(), type: 'heading', content: 'What is your biggest challenge?', props: { level: 2 } },
            { id: generateId(), type: 'radio', content: 'Time management', props: { name: 'quiz', value: 'time' } },
            { id: generateId(), type: 'radio', content: 'Budget constraints', props: { name: 'quiz', value: 'budget' } },
            { id: generateId(), type: 'radio', content: 'Finding the right tools', props: { name: 'quiz', value: 'tools' } },
            { id: generateId(), type: 'radio', content: 'Team collaboration', props: { name: 'quiz', value: 'team' } },
            { id: generateId(), type: 'button', content: 'See My Results', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { trackingId: '' },
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
        type: 'contact',
        label: 'Contact Form',
        icon: <Mail size={16} />,
        description: 'Full form',
        template: () => ({
          id: generateId(),
          type: 'form-field',
          label: 'Contact Form',
          elements: [
            { id: generateId(), type: 'heading', content: 'Get in Touch', props: { level: 2 } },
            { id: generateId(), type: 'text', content: 'Name', props: { variant: 'label' } },
            { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true } },
            { id: generateId(), type: 'text', content: 'Email', props: { variant: 'label' } },
            { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true } },
            { id: generateId(), type: 'text', content: 'Message', props: { variant: 'label' } },
            { id: generateId(), type: 'input', content: '', props: { type: 'textarea', placeholder: 'Your message...', required: true } },
            { id: generateId(), type: 'button', content: 'Send Message', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { trackingId: '' },
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
              group w-full flex flex-col items-center justify-center py-12 px-4
              transition-all duration-200
              ${className ?? ''}
            `}
          >
            {/* Empty section guidance */}
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--builder-surface-active))] flex items-center justify-center mb-3">
              <Package size={24} className="text-[hsl(var(--builder-text-dim))]" />
            </div>
            <span className="text-sm font-medium text-[hsl(var(--builder-text-muted))] mb-1">
              Add a block to this section
            </span>
            <span className="text-xs text-[hsl(var(--builder-text-dim))] mb-4">
              Headlines, text, images, buttons & more
            </span>
            <span
              className={`
                inline-flex items-center gap-2 rounded-lg px-4 py-2
                bg-[hsl(var(--builder-accent))] text-white
                text-sm font-medium
                shadow-lg shadow-[hsl(var(--builder-accent)/0.3)]
                group-hover:brightness-110
                group-active:scale-[0.98]
                transition-all duration-150
              `}
            >
              <Plus size={16} />
              <span>Add Block</span>
            </span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] shadow-2xl"
        side={position === 'above' ? 'top' : 'bottom'}
        align="center"
        sideOffset={8}
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
        <div className="max-h-[400px] overflow-y-auto builder-scroll">
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
