import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Type, 
  Image, 
  Video, 
  MessageSquare, 
  ListChecks, 
  Calendar, 
  Upload, 
  ChevronDown, 
  Sparkles, 
  LayoutGrid, 
  MousePointer,
  Menu,
  Link2,
  Users,
  Star,
  Grid3X3,
  CreditCard,
  HelpCircle,
  Mail,
  Building2,
  Award,
  Quote,
  Grip,
  MapPin
} from 'lucide-react';
import { Block, BlockType } from '../../types/infostack';
import { generateId } from '../utils/helpers';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface AddSectionPopoverProps {
  onAddBlock: (block: Block) => void;
  onOpenAIGenerate?: () => void;
  position?: 'above' | 'below';
  variant?: 'button' | 'inline';
  className?: string;
}

interface BlockTemplate {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'layout' | 'content' | 'interactive';
  template: () => Block;
}

const blockTemplates: BlockTemplate[] = [
  // ============ LAYOUT SECTIONS ============
  {
    type: 'custom',
    label: 'Navigation',
    icon: <Menu size={18} />,
    description: 'Header with logo & nav links',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Navigation',
      elements: [
        { id: generateId(), type: 'image', content: '', props: { isLogo: true, placeholder: 'Logo', alt: 'Logo' }, styles: { width: '120px', height: '40px' } },
        { id: generateId(), type: 'button', content: 'Features', props: { variant: 'nav-pill', size: 'sm', navLink: true, href: '#features' } },
        { id: generateId(), type: 'button', content: 'Pricing', props: { variant: 'nav-pill', size: 'sm', navLink: true, href: '#pricing' } },
        { id: generateId(), type: 'button', content: 'Contact', props: { variant: 'nav-pill', size: 'sm', navLink: true, href: '#contact' } },
      ],
      props: { layout: 'navbar', direction: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', sticky: true },
      styles: { padding: '16px 48px' },
    }),
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: <LayoutGrid size={18} />,
    description: 'Hero section with CTA',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'hero',
      label: 'Hero Section',
      elements: [
        { id: generateId(), type: 'heading', content: 'Welcome to our platform', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'Build beautiful landing pages in minutes. No coding required.', props: {} },
        { id: generateId(), type: 'button', content: 'Get Started', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { backgroundImage: '', overlay: true },
    }),
  },
  {
    type: 'feature',
    label: 'Features Grid',
    icon: <Grid3X3 size={18} />,
    description: '3-column features layout',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'feature',
      label: 'Features',
      elements: [
        { id: generateId(), type: 'heading', content: 'Why Choose Us', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Everything you need to succeed', props: { variant: 'caption' } },
        { id: generateId(), type: 'icon', content: '⚡', props: { title: 'Fast & Reliable', description: 'Lightning-fast performance with 99.9% uptime' } },
        { id: generateId(), type: 'icon', content: '🔒', props: { title: 'Secure', description: 'Bank-level security for your peace of mind' } },
        { id: generateId(), type: 'icon', content: '💎', props: { title: 'Premium Quality', description: 'Exceptional craftsmanship in every detail' } },
      ],
      props: { columns: 3, layout: 'grid' },
    }),
  },
  {
    type: 'pricing',
    label: 'Pricing',
    icon: <CreditCard size={18} />,
    description: 'Pricing table with plans',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'pricing',
      label: 'Pricing',
      elements: [
        { id: generateId(), type: 'heading', content: 'Simple Pricing', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Choose the plan that works for you', props: { variant: 'caption' } },
        { id: generateId(), type: 'text', content: 'Starter|$29/mo|Perfect for getting started|5 Projects,10GB Storage,Email Support', props: { variant: 'pricing-card' } },
        { id: generateId(), type: 'text', content: 'Pro|$79/mo|Most popular choice|Unlimited Projects,100GB Storage,Priority Support,Advanced Analytics', props: { variant: 'pricing-card', featured: true } },
        { id: generateId(), type: 'text', content: 'Enterprise|$199/mo|For large teams|Everything in Pro,Dedicated Account Manager,Custom Integrations,SLA', props: { variant: 'pricing-card' } },
      ],
      props: { columns: 3, highlightPlan: 1 },
    }),
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: <HelpCircle size={18} />,
    description: 'Frequently asked questions',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'faq',
      label: 'FAQ Section',
      elements: [
        { id: generateId(), type: 'heading', content: 'Frequently Asked Questions', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'How do I get started?|Simply sign up for a free account and follow our onboarding guide.', props: { variant: 'faq-item' } },
        { id: generateId(), type: 'text', content: 'Can I cancel anytime?|Yes, you can cancel your subscription at any time with no questions asked.', props: { variant: 'faq-item' } },
        { id: generateId(), type: 'text', content: 'Do you offer refunds?|We offer a 30-day money-back guarantee on all plans.', props: { variant: 'faq-item' } },
      ],
      props: { accordion: true },
    }),
  },
  {
    type: 'logo-bar',
    label: 'Logo Bar',
    icon: <Building2 size={18} />,
    description: 'Trusted by companies',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'logo-bar',
      label: 'Logo Bar',
      elements: [
        { id: generateId(), type: 'text', content: 'Trusted by leading companies', props: { variant: 'caption' } },
        { id: generateId(), type: 'image', content: '', props: { src: '', alt: 'Company 1', width: '100px', placeholder: 'Logo 1' } },
        { id: generateId(), type: 'image', content: '', props: { src: '', alt: 'Company 2', width: '100px', placeholder: 'Logo 2' } },
        { id: generateId(), type: 'image', content: '', props: { src: '', alt: 'Company 3', width: '100px', placeholder: 'Logo 3' } },
        { id: generateId(), type: 'image', content: '', props: { src: '', alt: 'Company 4', width: '100px', placeholder: 'Logo 4' } },
        { id: generateId(), type: 'image', content: '', props: { src: '', alt: 'Company 5', width: '100px', placeholder: 'Logo 5' } },
      ],
      props: { grayscale: true, scrolling: false },
      styles: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' },
    }),
  },
  {
    type: 'footer',
    label: 'Footer',
    icon: <Grip size={18} />,
    description: 'Framer-style multi-column footer',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'footer',
      label: 'Footer',
      elements: [
        // Logo column
        { id: generateId(), type: 'text', content: '■○▲', props: { variant: 'footer-logo', fontSize: '24px', color: '#999' } },
        // Product column
        { id: generateId(), type: 'text', content: 'Product', props: { variant: 'footer-heading', fontWeight: 'semibold', fontSize: '14px' } },
        { id: generateId(), type: 'button', content: 'Features', props: { variant: 'footer-link', size: 'sm', href: '#features' } },
        { id: generateId(), type: 'button', content: 'Pricing', props: { variant: 'footer-link', size: 'sm', href: '#pricing' } },
        { id: generateId(), type: 'button', content: 'Support', props: { variant: 'footer-link', size: 'sm', href: '#support' } },
        // Company column
        { id: generateId(), type: 'text', content: 'Company', props: { variant: 'footer-heading', fontWeight: 'semibold', fontSize: '14px' } },
        { id: generateId(), type: 'button', content: 'About', props: { variant: 'footer-link', size: 'sm', href: '/about' } },
        { id: generateId(), type: 'button', content: 'Careers', props: { variant: 'footer-link', size: 'sm', href: '/careers' } },
        { id: generateId(), type: 'button', content: 'Press', props: { variant: 'footer-link', size: 'sm', href: '/press' } },
        // Resources column
        { id: generateId(), type: 'text', content: 'Resources', props: { variant: 'footer-heading', fontWeight: 'semibold', fontSize: '14px' } },
        { id: generateId(), type: 'button', content: 'Blog', props: { variant: 'footer-link', size: 'sm', href: '/blog' } },
        { id: generateId(), type: 'button', content: 'Newsletter', props: { variant: 'footer-link', size: 'sm', href: '/newsletter' } },
        { id: generateId(), type: 'button', content: 'Contact', props: { variant: 'footer-link', size: 'sm', href: '/contact' } },
      ],
      props: { layout: 'footer-framer', columns: 4, direction: 'row', gap: '48px' },
      styles: { padding: '64px 48px', backgroundColor: '#f5f5f5' },
    }),
  },
  {
    type: 'about',
    label: 'About Section',
    icon: <Users size={18} />,
    description: 'About us with image',
    category: 'layout',
    template: () => ({
      id: generateId(),
      type: 'about',
      label: 'About Us',
      elements: [
        { id: generateId(), type: 'heading', content: 'About Us', props: { level: 2 } },
        { id: generateId(), type: 'text', content: "We're on a mission to help businesses grow faster with innovative solutions. Our team of experts brings years of experience and passion to everything we do.", props: {} },
        { id: generateId(), type: 'image', content: '', props: { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', alt: 'Team photo' } },
        { id: generateId(), type: 'button', content: 'Learn More', props: { variant: 'secondary' } },
      ],
      props: { layout: 'split', imagePosition: 'right' },
    }),
  },

  // ============ CONTENT BLOCKS ============
  {
    type: 'text-block',
    label: 'Text',
    icon: <Type size={18} />,
    description: 'Paragraph or heading',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'text-block',
      label: 'Text Block',
      elements: [
        { id: generateId(), type: 'heading', content: 'Your heading here', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Add your paragraph text here. Click to edit.', props: {} },
      ],
      props: {},
    }),
  },
  {
    type: 'media',
    label: 'Image',
    icon: <Image size={18} />,
    description: 'Add an image',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Image Block',
      elements: [
        { id: generateId(), type: 'image', content: '', props: { src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop', alt: 'Placeholder image' } },
      ],
      props: {},
    }),
  },
  {
    type: 'media',
    label: 'Video',
    icon: <Video size={18} />,
    description: 'Embed a video',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'media',
      label: 'Video Block',
      elements: [
        { id: generateId(), type: 'video', content: '', props: { src: '', placeholder: 'Paste video URL' } },
      ],
      props: {},
    }),
  },
  {
    type: 'cta',
    label: 'Button',
    icon: <MousePointer size={18} />,
    description: 'Call-to-action button',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'cta',
      label: 'Button Block',
      elements: [
        { id: generateId(), type: 'button', content: 'Click me', props: { variant: 'primary' } },
      ],
      props: {},
    }),
  },
  {
    type: 'custom',
    label: 'Spacer',
    icon: <div className="w-4 h-4 border-t-2 border-b-2 border-current flex items-center justify-center" />,
    description: 'Vertical spacing',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Spacer',
      elements: [
        { id: generateId(), type: 'spacer', content: '', props: {}, styles: { height: '48px' } },
      ],
      props: {},
    }),
  },
  {
    type: 'custom',
    label: 'Divider',
    icon: <div className="w-4 h-0.5 bg-current" />,
    description: 'Horizontal separator',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Divider',
      elements: [
        { id: generateId(), type: 'divider', content: '', props: {} },
      ],
      props: {},
    }),
  },
  {
    type: 'custom',
    label: 'Icon',
    icon: <Star size={18} />,
    description: 'Decorative icon',
    category: 'content',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Icon',
      elements: [
        { id: generateId(), type: 'icon', content: 'star', props: { color: '#8B5CF6' }, styles: { fontSize: '32px' } },
      ],
      props: {},
    }),
  },
  {
    type: 'testimonial',
    label: 'Testimonial',
    icon: <Quote size={18} />,
    description: 'Customer review',
    category: 'content',
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
    type: 'trust',
    label: 'Trust Badges',
    icon: <Award size={18} />,
    description: 'Social proof badges',
    category: 'content',
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

  // ============ INTERACTIVE BLOCKS ============
  {
    type: 'form-field',
    label: 'Multiple Choice',
    icon: <ListChecks size={18} />,
    description: 'Multi-select question',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Multiple Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'Select all that apply:', props: { level: 3 } },
        { id: generateId(), type: 'checkbox', content: 'Option A', props: { name: 'choice', value: 'a' } },
        { id: generateId(), type: 'checkbox', content: 'Option B', props: { name: 'choice', value: 'b' } },
        { id: generateId(), type: 'checkbox', content: 'Option C', props: { name: 'choice', value: 'c' } },
        { id: generateId(), type: 'button', content: 'Submit and proceed', props: { variant: 'primary' } },
      ],
      props: { trackingId: '', required: false },
    }),
  },
  {
    type: 'form-field',
    label: 'Single Choice',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>,
    description: 'Radio button question',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Single Choice',
      elements: [
        { id: generateId(), type: 'heading', content: 'Choose one option:', props: { level: 3 } },
        { id: generateId(), type: 'radio', content: 'Option A', props: { name: 'single_choice', value: 'a' } },
        { id: generateId(), type: 'radio', content: 'Option B', props: { name: 'single_choice', value: 'b' } },
        { id: generateId(), type: 'radio', content: 'Option C', props: { name: 'single_choice', value: 'c' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary' } },
      ],
      props: { trackingId: '', required: true },
    }),
  },
  {
    type: 'form-field',
    label: 'Quiz Question',
    icon: <Sparkles size={18} />,
    description: 'Quiz with answer',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Quiz Question',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is the answer?', props: { level: 3 } },
        { id: generateId(), type: 'radio', content: 'Answer A', props: { name: 'quiz', value: 'a', isCorrect: false } },
        { id: generateId(), type: 'radio', content: 'Answer B (Correct)', props: { name: 'quiz', value: 'b', isCorrect: true } },
        { id: generateId(), type: 'radio', content: 'Answer C', props: { name: 'quiz', value: 'c', isCorrect: false } },
        { id: generateId(), type: 'button', content: 'Check Answer', props: { variant: 'primary' } },
      ],
      props: { trackingId: '', showCorrectAnswer: true },
    }),
  },
  {
    type: 'form-field',
    label: 'Form Input',
    icon: <Type size={18} />,
    description: 'Text input field',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Form Input',
      elements: [
        { id: generateId(), type: 'text', content: 'Enter your email', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true } },
        { id: generateId(), type: 'button', content: 'Submit', props: { variant: 'primary' } },
      ],
      props: { trackingId: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'Contact Form',
    icon: <Mail size={18} />,
    description: 'Full contact form',
    category: 'interactive',
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
    type: 'form-field',
    label: 'Date Picker',
    icon: <Calendar size={18} />,
    description: 'Date selection',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Date Picker',
      elements: [
        { id: generateId(), type: 'text', content: 'Select a date', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'date', placeholder: 'Choose date' } },
        { id: generateId(), type: 'button', content: 'Confirm', props: { variant: 'primary' } },
      ],
      props: { trackingId: '', minDate: '', maxDate: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'Dropdown',
    icon: <ChevronDown size={18} />,
    description: 'Select dropdown',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Dropdown',
      elements: [
        { id: generateId(), type: 'text', content: 'Choose an option', props: { variant: 'label' } },
        { id: generateId(), type: 'select', content: '', props: { options: ['Option 1', 'Option 2', 'Option 3'], placeholder: 'Select...' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary' } },
      ],
      props: { trackingId: '' },
    }),
  },
  {
    type: 'form-field',
    label: 'File Upload',
    icon: <Upload size={18} />,
    description: 'Upload files',
    category: 'interactive',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'File Upload',
      elements: [
        { id: generateId(), type: 'text', content: 'Upload your file', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'file', accept: '.pdf,.doc,.docx,.jpg,.png', multiple: false } },
        { id: generateId(), type: 'button', content: 'Upload', props: { variant: 'primary' } },
      ],
      props: { trackingId: '', maxSize: '10MB', allowedTypes: ['pdf', 'doc', 'jpg', 'png'] },
    }),
  },
  {
    type: 'booking',
    label: 'Appointment',
    icon: <Calendar size={18} />,
    description: 'Schedule booking',
    category: 'interactive',
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
];

export const AddSectionPopover: React.FC<AddSectionPopoverProps> = ({
  onAddBlock,
  onOpenAIGenerate,
  position = 'below',
  variant = 'button',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'interactive'>('layout');

  const filteredTemplates = blockTemplates.filter(template => {
    const matchesSearch = template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = searchQuery.length > 0 ? true : template.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const handleAddBlock = (template: BlockTemplate) => {
    onAddBlock(template.template());
    setIsOpen(false);
    setSearchQuery('');
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
        ) : (
          <button
            className={`
              group flex items-center justify-center w-full py-3.5 
              bg-[hsl(var(--builder-surface))] backdrop-blur-sm
              border-2 border-dashed border-[hsl(var(--builder-border))] rounded-xl
              text-[hsl(var(--builder-text-muted))] 
              hover:border-[hsl(var(--builder-text-muted))] hover:bg-[hsl(var(--builder-surface-hover))]
              hover:text-[hsl(var(--builder-text))]
              transition-all duration-200 gap-2
              ${className}
            `}
          >
            <Plus size={18} className="text-[hsl(var(--builder-text-muted))] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">Add Section</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] shadow-2xl"
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
              placeholder="Search sections..."
              className="pl-9 h-8 text-sm bg-[hsl(var(--builder-surface-hover))] border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text))] placeholder:text-[hsl(var(--builder-text-dim))]"
            />
          </div>
        </div>

        {/* Tabs - Only show when not searching */}
        {searchQuery.length === 0 && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'layout' | 'content' | 'interactive')} className="w-full">
            <TabsList className="w-full h-auto p-1 bg-[hsl(var(--builder-surface-hover))] rounded-none border-b border-[hsl(var(--builder-border-subtle))]">
              <TabsTrigger 
                value="layout" 
                className="flex-1 text-xs py-2 data-[state=active]:bg-[hsl(var(--builder-accent))] data-[state=active]:text-white rounded-md"
              >
                Layout
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="flex-1 text-xs py-2 data-[state=active]:bg-[hsl(var(--builder-accent))] data-[state=active]:text-white rounded-md"
              >
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="interactive" 
                className="flex-1 text-xs py-2 data-[state=active]:bg-[hsl(var(--builder-accent))] data-[state=active]:text-white rounded-md"
              >
                Forms
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Block Grid */}
        <div className="max-h-[320px] overflow-y-auto builder-scroll">
          {filteredTemplates.length === 0 ? (
            <div className="p-6 text-center text-[hsl(var(--builder-text-muted))] text-sm">
              No sections found
            </div>
          ) : (
            <div className="p-2 grid grid-cols-3 gap-1.5">
              {filteredTemplates.map((template) => (
                <button
                  key={`${template.type}-${template.label}`}
                  onClick={() => handleAddBlock(template)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[hsl(var(--builder-surface))] hover:bg-[hsl(var(--builder-surface-hover))] border border-transparent hover:border-[hsl(var(--builder-accent)/0.3)] transition-all text-center group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--builder-surface-active))] flex items-center justify-center text-[hsl(var(--builder-text-muted))] group-hover:text-[hsl(var(--builder-accent))] group-hover:bg-[hsl(var(--builder-accent)/0.1)] transition-colors">
                    {template.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[hsl(var(--builder-text))] leading-tight">
                      {template.label}
                    </div>
                  </div>
                </button>
              ))}
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