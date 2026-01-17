import React, { useState } from 'react';
import { 
  Plus, Search, Type, Image, MousePointer, LayoutGrid, Sparkles,
  Minus, Square, ChevronRight, Award, Quote, Users, HelpCircle,
  ListChecks, Calendar, Mail, ChevronDown, Upload, Video,
  FileText, Link, Star, Package, Zap, MessageSquare, Shield,
  Play, TrendingUp, Clock, Trophy, BarChart3, Rocket, Target
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Block } from '@/flow-canvas/types/infostack';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  buildTemplateTheme, 
  type TemplateTheme, 
  type PageSettings 
} from '../utils/templateThemeUtils';

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ TYPE DEFINITIONS ============

interface BlockTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  template: (theme: TemplateTheme) => Block;
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
  pageSettings?: PageSettings;
}

// ============ THEME-AWARE HELPERS ============

/** Get text class based on theme */
const textClass = (t: TemplateTheme, variant: 'normal' | 'muted' | 'caption' = 'normal') => {
  if (t.isDark) {
    return variant === 'muted' ? 'text-white/70' : variant === 'caption' ? 'text-white/50' : 'text-white';
  }
  return variant === 'muted' ? 'text-gray-600' : variant === 'caption' ? 'text-gray-400' : 'text-gray-900';
};

/** Get surface/card background class */
const surfaceClass = (t: TemplateTheme) => 
  t.isDark ? 'bg-white/5' : 'bg-gray-50';

/** Get gradient CSS for urgency banners */
const urgencyGradient = (t: TemplateTheme) => 
  `linear-gradient(90deg, ${t.primaryColor}, ${t.accentGradient[1]})`;

// ============ BASIC BLOCKS (Single Elements) ============

const basicBlocks: BlockTemplate[] = [
  {
    type: 'text-block',
    label: 'Text',
    icon: <Type size={16} />,
    description: 'Paragraph text',
    template: (t) => ({
      id: generateId(),
      type: 'text-block',
      label: 'Text',
      elements: [{ id: generateId(), type: 'text', content: 'Your supporting text', props: { color: t.textColor } }],
      props: {},
    }),
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: <FileText size={16} />,
    description: 'Title text',
    template: (t) => ({
      id: generateId(),
      type: 'text-block',
      label: 'Heading',
      elements: [{ id: generateId(), type: 'heading', content: 'Your main headline', props: { level: 2, color: t.textColor } }],
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
    template: (t) => ({
      id: generateId(),
      type: 'cta',
      label: 'Button',
      elements: [{ id: generateId(), type: 'button', content: 'Click Here', props: { variant: 'primary', backgroundColor: t.primaryColor } }],
      props: { action: 'next-step', href: '' },
    }),
  },
  {
    type: 'link',
    label: 'Link',
    icon: <Link size={16} />,
    description: 'Text link',
    template: (t) => ({
      id: generateId(),
      type: 'text-block',
      label: 'Link',
      elements: [{ id: generateId(), type: 'link', content: 'Learn more', props: { href: '#', color: t.primaryColor } }],
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
    template: (t) => ({
      id: generateId(),
      type: 'divider',
      label: 'Divider',
      elements: [],
      props: { style: 'solid', color: t.borderColor },
    }),
  },
];

// ============ INTERACTIVE BLOCKS (Application Flow) ============

const interactiveBlocks: BlockTemplate[] = [
  {
    type: 'application-flow',
    label: 'Text Question',
    icon: <Type size={16} />,
    description: 'Open-ended text input',
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Text Question',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
        inputBackground: t.inputBg,
        inputBorderColor: t.inputBorder,
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
              align: 'center',
              spacing: 'normal',
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
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Multiple Choice',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
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
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Single Choice',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
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
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Dropdown Question',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
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
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Email Capture',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: false,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
        inputBackground: t.inputBg,
        inputBorderColor: t.inputBorder,
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
    template: (t) => ({
      id: generateId(),
      type: 'application-flow',
      label: 'Full Opt-In',
      elements: [],
      props: {
        displayMode: 'one-at-a-time',
        showProgress: false,
        transition: 'fade',
        background: { type: 'solid', color: t.backgroundColor },
        textColor: t.textColor,
        inputBackground: t.inputBg,
        inputBorderColor: t.inputBorder,
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

// ============ SECTION TEMPLATES (Pre-designed, Theme-Aware) ============

const sectionCategories: SectionCategory[] = [
  {
    id: 'hero',
    label: 'Hero',
    icon: <LayoutGrid size={16} />,
    templates: [
      {
        type: 'hero',
        label: 'VSL Hero',
        icon: <Play size={16} />,
        description: 'Premium video sales letter',
        template: (t) => ({
          id: generateId(),
          type: 'hero',
          label: 'VSL Hero',
          elements: [
            { id: generateId(), type: 'avatar-group', content: '', props: { count: 3, size: 'sm' } },
            { id: generateId(), type: 'text', content: 'From the team who helped Alex Hormozi, Mr. Beast, and more...', props: { variant: 'caption', color: t.mutedTextColor } },
            { id: generateId(), type: 'badge', content: 'FREE TRAINING', props: { variant: 'premium', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'The System That Turns Long-Form Into', props: { level: 1, color: t.textColor } },
            { id: generateId(), type: 'gradient-text', content: 'Viral Content', props: { gradient: t.accentGradient } },
            { id: generateId(), type: 'text', content: 'Watch this free training to learn the exact framework used by 9,943+ business owners', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'video-thumbnail', content: '', props: { placeholder: true, aspectRatio: '16:9' } },
            { id: generateId(), type: 'button', content: 'BOOK YOUR FREE STRATEGY CALL', props: { variant: 'primary', size: 'xl', backgroundColor: t.primaryColor } },
            { id: generateId(), type: 'text', content: 'Join 9,943+ entrepreneurs already using this system', props: { variant: 'caption', color: t.captionColor } },
          ],
          props: { alignment: 'center', className: 'py-16' },
        }),
      },
      {
        type: 'hero',
        label: 'Stats Hero',
        icon: <BarChart3 size={16} />,
        description: 'Headlines with proof numbers',
        template: (t) => ({
          id: generateId(),
          type: 'hero',
          label: 'Stats Hero',
          elements: [
            { id: generateId(), type: 'badge', content: 'PROVEN RESULTS', props: { variant: 'premium', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'Add 20+ High-Ticket Clients Per Month With', props: { level: 1, color: t.textColor } },
            { id: generateId(), type: 'underline-text', content: 'Predictable Systems', props: { color: t.primaryColor } },
            { id: generateId(), type: 'text', content: 'The exact framework used by top agencies to scale past $100K/mo without burning out', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '9,943', suffix: '+', label: 'MEMBERS', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '5', suffix: 'B+', label: 'VIEWS GENERATED', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '70', suffix: '+', label: 'COUNTRIES', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'GET STARTED TODAY', props: { variant: 'primary', size: 'xl', backgroundColor: t.primaryColor } },
          ],
          props: { alignment: 'center', className: 'py-16' },
        }),
      },
      {
        type: 'hero',
        label: 'Split Hero',
        icon: <LayoutGrid size={16} />,
        description: 'Text left, media right',
        template: (t) => ({
          id: generateId(),
          type: 'hero',
          label: 'Split Hero',
          elements: [
            { id: generateId(), type: 'badge', content: 'NEW FOR 2025', props: { variant: 'warning', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'Stop Trading Time For Money', props: { level: 1, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Learn how to build systems that generate clients on autopilot while you focus on what matters most.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'Watch Free Training', props: { variant: 'primary', size: 'lg', backgroundColor: t.primaryColor } },
            { id: generateId(), type: 'text', content: '✓ No credit card required  ✓ Instant access', props: { variant: 'caption', color: t.captionColor } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Hero image', src: '', className: 'rounded-xl shadow-2xl' } },
          ],
          props: { alignment: 'left', layout: 'split', className: 'py-16' },
        }),
      },
      {
        type: 'hero',
        label: 'Simple Hero',
        icon: <LayoutGrid size={16} />,
        description: 'Clean title + subtitle + CTA',
        template: (t) => ({
          id: generateId(),
          type: 'hero',
          label: 'Hero Section',
          elements: [
            { id: generateId(), type: 'heading', content: 'Welcome to Our Platform', props: { level: 1, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Discover how we can help you achieve your goals faster than ever before.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'Get Started', props: { variant: 'primary', size: 'lg', backgroundColor: t.primaryColor } },
          ],
          props: { alignment: 'center' },
        }),
      },
    ],
  },
  {
    id: 'credibility',
    label: 'Credibility',
    icon: <Trophy size={16} />,
    templates: [
      {
        type: 'credibility-bar',
        label: 'Credibility Bar',
        icon: <Users size={16} />,
        description: 'Avatars + authority text',
        template: (t) => ({
          id: generateId(),
          type: 'credibility-bar',
          label: 'Credibility Bar',
          elements: [
            { id: generateId(), type: 'avatar-group', content: '', props: { count: 3, size: 'md' } },
            { id: generateId(), type: 'text', content: 'From the creators who helped Alex Hormozi, Mr. Beast, and 500+ entrepreneurs scale to 7-figures', props: { color: t.mutedTextColor } },
          ],
          props: { alignment: 'center', className: 'py-4' },
        }),
      },
      {
        type: 'stats-row',
        label: 'Stats Row',
        icon: <BarChart3 size={16} />,
        description: 'Big numbers with labels',
        template: (t) => ({
          id: generateId(),
          type: 'stats-row',
          label: 'Stats Row',
          elements: [
            { id: generateId(), type: 'stat-number', content: '', props: { value: '9,943', suffix: '+', label: 'MEMBERS', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '5', suffix: 'B+', label: 'VIEWS GENERATED', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '70', suffix: '+', label: 'COUNTRIES', color: t.textColor, labelColor: t.mutedTextColor } },
          ],
          props: { layout: 'horizontal', gap: 48, className: 'py-8' },
        }),
      },
      {
        type: 'logo-bar',
        label: 'Logo Bar (Static)',
        icon: <Award size={16} />,
        description: 'As seen in logos',
        template: (t) => ({
          id: generateId(),
          type: 'logo-bar',
          label: 'Logo Bar',
          elements: [
            { id: generateId(), type: 'text', content: 'AS SEEN IN', props: { variant: 'caption', className: 'uppercase tracking-widest', color: t.captionColor } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Forbes', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Inc', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Bloomberg', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Entrepreneur', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
          ],
          props: { layout: 'horizontal', gap: 32, alignment: 'center', className: 'py-6' },
        }),
      },
      {
        type: 'ticker-bar',
        label: 'Scrolling Logos',
        icon: <TrendingUp size={16} />,
        description: 'Animated logo marquee',
        template: (t) => ({
          id: generateId(),
          type: 'ticker-bar',
          label: 'Scrolling Logos',
          elements: [
            { id: generateId(), type: 'ticker', content: '', props: { 
              items: ['FORBES', 'INC', 'BLOOMBERG', 'ENTREPRENEUR', 'BUSINESS INSIDER', 'FAST COMPANY'],
              speed: 25,
              separator: '   •   ',
              color: t.mutedTextColor,
            }},
          ],
          props: { className: `py-4 ${surfaceClass(t)}` },
        }),
      },
    ],
  },
  {
    id: 'urgency',
    label: 'Urgency',
    icon: <Clock size={16} />,
    templates: [
      {
        type: 'urgency-banner',
        label: 'Urgency Ticker',
        icon: <Clock size={16} />,
        description: 'Scrolling urgency message',
        template: (t) => ({
          id: generateId(),
          type: 'urgency-banner',
          label: 'Urgency Banner',
          elements: [
            { id: generateId(), type: 'ticker', content: '', props: {
              items: ['LIVE EVENT', 'NO REPLAYS', 'JAN 27TH 2PM EST', 'LIMITED SPOTS'],
              speed: 20,
              separator: '  •  ',
              color: '#ffffff',
            }},
          ],
          props: { className: 'py-3 text-white', style: { background: urgencyGradient(t) } },
        }),
      },
      {
        type: 'urgency-banner',
        label: 'Live Badge Banner',
        icon: <Zap size={16} />,
        description: 'Event announcement bar',
        template: (t) => ({
          id: generateId(),
          type: 'urgency-banner',
          label: 'Live Banner',
          elements: [
            { id: generateId(), type: 'badge', content: '🔴 LIVE', props: { variant: 'destructive' } },
            { id: generateId(), type: 'text', content: 'Free Workshop Starting Now — Limited Spots Available', props: { className: 'font-semibold', color: '#ffffff' } },
            { id: generateId(), type: 'button', content: 'Join Now →', props: { variant: 'ghost', size: 'sm', color: '#ffffff' } },
          ],
          props: { layout: 'horizontal', gap: 16, alignment: 'center', className: 'py-3 text-white', style: { background: urgencyGradient(t) } },
        }),
      },
    ],
  },
  {
    id: 'process',
    label: 'Process',
    icon: <Rocket size={16} />,
    templates: [
      {
        type: 'process-flow',
        label: '3-Step Process',
        icon: <Rocket size={16} />,
        description: 'Visual step-by-step',
        template: (t) => ({
          id: generateId(),
          type: 'process-flow',
          label: '3-Step Process',
          elements: [
            { id: generateId(), type: 'heading', content: 'How It Works', props: { level: 2, className: 'text-center mb-8', color: t.textColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 1, title: 'MAP THE NARRATIVE', description: 'We identify your unique story and positioning', icon: 'search', showArrow: true, color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 2, title: 'GO VIRAL', description: 'Deploy our proven content system', icon: 'share-2', showArrow: true, color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 3, title: 'SCALE', description: 'Turn views into high-ticket clients', icon: 'rocket', showArrow: false, color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
          ],
          props: { layout: 'horizontal', className: 'py-12' },
        }),
      },
      {
        type: 'process-flow',
        label: 'Vertical Timeline',
        icon: <Target size={16} />,
        description: 'Steps stacked vertically',
        template: (t) => ({
          id: generateId(),
          type: 'process-flow',
          label: 'Timeline',
          elements: [
            { id: generateId(), type: 'heading', content: 'Your Journey', props: { level: 2, className: 'text-center mb-8', color: t.textColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 1, title: 'Book Your Call', description: 'Schedule a free 30-minute strategy session', icon: 'calendar', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 2, title: 'Get Your Plan', description: 'Receive a custom growth roadmap', icon: 'file-text', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 3, title: 'Launch & Scale', description: 'Execute with our proven framework', icon: 'rocket', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
          ],
          props: { layout: 'vertical', className: 'py-12' },
        }),
      },
    ],
  },
  {
    id: 'video',
    label: 'Video',
    icon: <Video size={16} />,
    templates: [
      {
        type: 'video-hero',
        label: 'Video Hero',
        icon: <Play size={16} />,
        description: 'Full video with overlay',
        template: (t) => ({
          id: generateId(),
          type: 'video-hero',
          label: 'Video Hero',
          elements: [
            { id: generateId(), type: 'badge', content: 'WATCH NOW', props: { variant: 'premium', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'Free Training: The Exact System We Use', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'video-thumbnail', content: '', props: { placeholder: true, aspectRatio: '16:9', className: 'rounded-xl shadow-2xl' } },
            { id: generateId(), type: 'text', content: 'Over 9,943 business owners have watched this training', props: { variant: 'caption', color: t.captionColor } },
          ],
          props: { alignment: 'center', className: 'py-12' },
        }),
      },
      {
        type: 'media',
        label: 'Video Block',
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
    ],
  },
  {
    id: 'guarantee',
    label: 'Guarantee',
    icon: <Shield size={16} />,
    templates: [
      {
        type: 'guarantee',
        label: 'Money-Back Guarantee',
        icon: <Shield size={16} />,
        description: 'Risk reversal section',
        template: (t) => ({
          id: generateId(),
          type: 'guarantee',
          label: 'Guarantee',
          elements: [
            { id: generateId(), type: 'heading', content: '100% Risk-Free Guarantee', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Try it for 30 days. If you are not completely satisfied with your results, we will refund every penny. No questions asked, no hoops to jump through.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'badge', content: '30-Day Money Back', props: { variant: 'success', icon: 'shield' } },
          ],
          props: { alignment: 'center', className: `py-12 rounded-xl ${surfaceClass(t)}` },
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
        label: 'Premium CTA',
        icon: <Zap size={16} />,
        description: 'Urgency + button + trust',
        template: (t) => ({
          id: generateId(),
          type: 'cta',
          label: 'Premium CTA',
          elements: [
            { id: generateId(), type: 'badge', content: 'LIMITED OFFER', props: { variant: 'warning', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'Ready to Transform Your Business?', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Join 9,943+ entrepreneurs who are already scaling with our proven system.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'CLAIM YOUR SPOT NOW', props: { variant: 'primary', size: 'xl', backgroundColor: t.primaryColor } },
            { id: generateId(), type: 'text', content: '✓ No credit card required  ✓ Instant access  ✓ Cancel anytime', props: { variant: 'caption', color: t.captionColor } },
          ],
          props: { alignment: 'center', className: `py-12 rounded-xl ${surfaceClass(t)}` },
        }),
      },
      {
        type: 'cta-section',
        label: 'Simple CTA',
        icon: <MousePointer size={16} />,
        description: 'Text + button',
        template: (t) => ({
          id: generateId(),
          type: 'cta',
          label: 'Call to Action',
          elements: [
            { id: generateId(), type: 'heading', content: 'Ready to get started?', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Take the first step towards your goals today.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'Get Started Now', props: { variant: 'primary', size: 'lg', backgroundColor: t.primaryColor } },
          ],
          props: { action: 'next-step' },
        }),
      },
      {
        type: 'cta-section',
        label: 'CTA with Email',
        icon: <Mail size={16} />,
        description: 'Email capture + button',
        template: (t) => ({
          id: generateId(),
          type: 'cta',
          label: 'CTA with Email',
          elements: [
            { id: generateId(), type: 'heading', content: 'Get Instant Access', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Enter your email to receive the free training.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'Enter your email', backgroundColor: t.inputBg, borderColor: t.inputBorder } },
            { id: generateId(), type: 'button', content: 'Send Me The Training →', props: { variant: 'primary', size: 'lg', backgroundColor: t.primaryColor } },
            { id: generateId(), type: 'text', content: '🔒 We respect your privacy. Unsubscribe anytime.', props: { variant: 'caption', color: t.captionColor } },
          ],
          props: { action: 'submit', alignment: 'center' },
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
        label: 'Founder Story',
        icon: <Users size={16} />,
        description: 'Personal bio + image',
        template: (t) => ({
          id: generateId(),
          type: 'about',
          label: 'Founder Story',
          elements: [
            { id: generateId(), type: 'heading', content: 'Hey, I\'m [Your Name]', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Founder photo', src: '', className: 'rounded-full w-32 h-32 mx-auto mb-4' } },
            { id: generateId(), type: 'text', content: 'I\'ve helped over 500+ business owners scale past $100K/mo using the exact system you\'re about to learn. After 10 years in the trenches, I\'ve distilled everything into a simple, repeatable framework.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '500', suffix: '+', label: 'CLIENTS SERVED', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'stat-number', content: '', props: { value: '$50', suffix: 'M+', label: 'REVENUE GENERATED', color: t.textColor, labelColor: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'Learn My Story', props: { variant: 'outline', borderColor: t.borderColor, color: t.textColor } },
          ],
          props: { alignment: 'center', className: 'py-12' },
        }),
      },
      {
        type: 'about',
        label: 'About Section',
        icon: <Users size={16} />,
        description: 'Company info',
        template: (t) => ({
          id: generateId(),
          type: 'about',
          label: 'About Us',
          elements: [
            { id: generateId(), type: 'heading', content: 'About Us', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'We are a team of passionate individuals dedicated to helping you succeed. With years of experience and a commitment to excellence, we deliver results that matter.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'button', content: 'Learn More', props: { variant: 'outline', borderColor: t.borderColor, color: t.textColor } },
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
        label: 'Premium Testimonial',
        icon: <Quote size={16} />,
        description: 'Full testimonial card',
        template: (t) => ({
          id: generateId(),
          type: 'testimonial',
          label: 'Testimonial',
          elements: [
            { id: generateId(), type: 'avatar-group', content: '', props: { count: 1, size: 'lg' } },
            { id: generateId(), type: 'text', content: '"We went from struggling to adding $47K in monthly revenue within 90 days. This system actually works."', props: { className: 'text-lg italic', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Sarah Johnson', props: { className: 'font-bold', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'CEO, TechStartup • $2.4M Revenue', props: { variant: 'caption', color: t.captionColor } },
            { id: generateId(), type: 'badge', content: '✓ Verified Client', props: { variant: 'success' } },
          ],
          props: { rating: 5, className: 'py-8' },
        }),
      },
      {
        type: 'testimonial',
        label: 'Video Testimonial',
        icon: <Play size={16} />,
        description: 'Video + quote',
        template: (t) => ({
          id: generateId(),
          type: 'testimonial',
          label: 'Video Testimonial',
          elements: [
            { id: generateId(), type: 'video-thumbnail', content: '', props: { placeholder: true, aspectRatio: '16:9', className: 'rounded-xl' } },
            { id: generateId(), type: 'text', content: '"This changed everything for my business"', props: { className: 'text-lg font-semibold mt-4', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'John Smith, Founder @ AgencyXYZ', props: { variant: 'caption', color: t.captionColor } },
          ],
          props: { rating: 5, className: 'py-8' },
        }),
      },
      {
        type: 'testimonial',
        label: 'Simple Testimonial',
        icon: <Quote size={16} />,
        description: 'Basic quote',
        template: (t) => ({
          id: generateId(),
          type: 'testimonial',
          label: 'Testimonial',
          elements: [
            { id: generateId(), type: 'image', content: '', props: { alt: 'Customer photo', src: '', style: 'avatar' } },
            { id: generateId(), type: 'text', content: '"The best decision I ever made for my business."', props: { color: t.textColor } },
            { id: generateId(), type: 'text', content: '— John Smith, Founder', props: { variant: 'caption', color: t.captionColor } },
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
        template: (t) => ({
          id: generateId(),
          type: 'trust',
          label: 'Trust Badges',
          elements: [
            { id: generateId(), type: 'text', content: '⭐ 4.9/5 Rating', props: { variant: 'badge', color: t.textColor } },
            { id: generateId(), type: 'text', content: '🏆 #1 Rated', props: { variant: 'badge', color: t.textColor } },
            { id: generateId(), type: 'text', content: '✓ 10,000+ Users', props: { variant: 'badge', color: t.textColor } },
            { id: generateId(), type: 'text', content: '🔒 Secure', props: { variant: 'badge', color: t.textColor } },
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
        template: (t) => ({
          id: generateId(),
          type: 'trust',
          label: 'Logo Bar',
          elements: [
            { id: generateId(), type: 'text', content: 'Trusted by leading companies', props: { variant: 'caption', color: t.captionColor } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 1', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 2', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Logo 3', src: '', className: `h-8 ${t.isDark ? 'opacity-60 invert' : 'opacity-60 grayscale'}` } },
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
        label: 'Premium Features',
        icon: <Sparkles size={16} />,
        description: 'Icons + headlines + text',
        template: (t) => ({
          id: generateId(),
          type: 'feature',
          label: 'Premium Features',
          elements: [
            { id: generateId(), type: 'badge', content: 'EVERYTHING YOU GET', props: { variant: 'premium', backgroundColor: t.badgeBg, textColor: t.badgeText } },
            { id: generateId(), type: 'heading', content: 'The Complete System', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Everything you need to scale your business to 7-figures and beyond', props: { className: 'mb-8', color: t.mutedTextColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 1, title: 'Viral Content System', description: 'Our proven framework for creating content that converts', icon: 'video', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 2, title: 'Client Acquisition Engine', description: 'Automated systems for attracting high-ticket clients', icon: 'users', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 3, title: 'Scale & Systemize', description: 'SOPs and frameworks to remove yourself from operations', icon: 'settings', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
            { id: generateId(), type: 'process-step', content: '', props: { step: 4, title: '1-on-1 Coaching', description: 'Weekly calls with our expert team', icon: 'message-circle', color: t.textColor, mutedColor: t.mutedTextColor, accentColor: t.primaryColor } },
          ],
          props: { layout: 'grid', columns: 2, className: 'py-12' },
        }),
      },
      {
        type: 'feature',
        label: 'Features Grid',
        icon: <Package size={16} />,
        description: '3 feature cards',
        template: (t) => ({
          id: generateId(),
          type: 'feature',
          label: 'Features Grid',
          elements: [
            { id: generateId(), type: 'heading', content: 'Why Choose Us', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: '🚀 Fast & Reliable', props: { variant: 'feature', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Lightning-fast performance with 99.9% uptime', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'text', content: '🔒 Secure', props: { variant: 'feature', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Enterprise-grade security for your data', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'text', content: '💬 24/7 Support', props: { variant: 'feature', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Round-the-clock support from our team', props: { color: t.mutedTextColor } },
          ],
          props: { columns: 3 },
        }),
      },
      {
        type: 'feature',
        label: 'Benefits List',
        icon: <Zap size={16} />,
        description: 'Checkmark bullet points',
        template: (t) => ({
          id: generateId(),
          type: 'feature',
          label: 'Benefits',
          elements: [
            { id: generateId(), type: 'heading', content: 'What You Get', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: '✓ Unlimited access to all features', props: { color: t.textColor } },
            { id: generateId(), type: 'text', content: '✓ Priority customer support', props: { color: t.textColor } },
            { id: generateId(), type: 'text', content: '✓ Free updates and upgrades', props: { color: t.textColor } },
            { id: generateId(), type: 'text', content: '✓ 30-day money-back guarantee', props: { color: t.textColor } },
            { id: generateId(), type: 'button', content: 'Get Started', props: { variant: 'primary', size: 'lg', backgroundColor: t.primaryColor } },
          ],
          props: { alignment: 'center', className: 'py-8' },
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
        template: (t) => ({
          id: generateId(),
          type: 'application-flow',
          label: 'Quiz Flow',
          elements: [],
          props: {
            displayMode: 'one-at-a-time',
            showProgress: true,
            transition: 'slide-up',
            background: { type: 'solid', color: t.backgroundColor },
            textColor: t.textColor,
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
        template: (t) => ({
          id: generateId(),
          type: 'team',
          label: 'Our Team',
          elements: [
            { id: generateId(), type: 'heading', content: 'Meet Our Team', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'image', content: '', props: { alt: 'Team member 1', src: '', style: 'avatar' } },
            { id: generateId(), type: 'text', content: 'Jane Doe', props: { variant: 'strong', color: t.textColor } },
            { id: generateId(), type: 'text', content: 'CEO & Founder', props: { variant: 'caption', color: t.captionColor } },
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
        template: (t) => ({
          id: generateId(),
          type: 'application-flow',
          label: 'Contact Flow',
          elements: [],
          props: {
            displayMode: 'one-at-a-time',
            showProgress: false,
            transition: 'fade',
            background: { type: 'solid', color: t.backgroundColor },
            textColor: t.textColor,
            inputBackground: t.inputBg,
            inputBorderColor: t.inputBorder,
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
        template: (t) => ({
          id: generateId(),
          type: 'booking',
          label: 'Appointment Booking',
          elements: [
            { id: generateId(), type: 'heading', content: 'Book your appointment', props: { level: 2, color: t.textColor } },
            { id: generateId(), type: 'text', content: 'Select a date and time that works for you.', props: { color: t.mutedTextColor } },
            { id: generateId(), type: 'input', content: '', props: { type: 'datetime-local', placeholder: 'Select date & time', backgroundColor: t.inputBg, borderColor: t.inputBorder } },
            { id: generateId(), type: 'button', content: 'Book Now', props: { variant: 'primary', backgroundColor: t.primaryColor } },
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
  pageSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Build theme from page settings
  const theme = buildTemplateTheme(pageSettings);

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
    // Pass theme to template function
    onAddBlock(template.template(theme));
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
