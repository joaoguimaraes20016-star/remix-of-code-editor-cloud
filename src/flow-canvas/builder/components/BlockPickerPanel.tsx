import React, { useState } from 'react';
import { 
  Plus, Search, Type, Image, MousePointer, LayoutGrid, Sparkles,
  Minus, Square, ChevronRight, Award, Quote, Users, HelpCircle,
  ListChecks, Calendar, Mail, ChevronDown, Upload, Video,
  FileText, Link, Star, Package, Zap, X, ArrowLeft, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Block } from '@/flow-canvas/types/infostack';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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

type AddMode = 'block' | 'section';

interface BlockPickerPanelProps {
  onAddBlock: (block: Block, options?: { type: AddMode }) => void;
  onClose: () => void;
  targetSectionId?: string | null;
  /** When true, hides the Sections tab (used when adding content inside an existing section) */
  hideSecionsTab?: boolean;
}

type ActiveTab = 'blocks' | 'sections';

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

// ============ SECTION TEMPLATES ============

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
          ],
          props: { columns: 3 },
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
            { id: generateId(), type: 'button', content: 'Send Message', props: { variant: 'primary', size: 'lg' } },
          ],
          props: { trackingId: '' },
        }),
      },
    ],
  },
];

// ============ COMPONENT ============

export const BlockPickerPanel: React.FC<BlockPickerPanelProps> = ({
  onAddBlock,
  onClose,
  targetSectionId,
  hideSecionsTab = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('blocks');

  // All templates for search
  const allTemplates = [
    ...basicBlocks.map(b => ({ ...b, isSection: false })),
    ...interactiveBlocks.map(b => ({ ...b, isSection: false })),
    ...sectionCategories.flatMap(cat => cat.templates.map(t => ({ ...t, isSection: true }))),
  ];

  const filteredResults = searchQuery.length > 0
    ? allTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleAddBlock = (template: BlockTemplate, isSection: boolean = false) => {
    onAddBlock(template.template(), { type: isSection ? 'section' : 'block' });
    onClose();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-surface">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-builder-border">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-builder-text">Add Content</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
        >
          <X size={16} />
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
            placeholder={activeTab === 'blocks' ? "Search blocks..." : "Search sections..."}
            className="pl-9 h-8 text-sm bg-builder-surface-hover border-builder-border text-builder-text placeholder:text-builder-text-dim"
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {searchQuery.length > 0 ? (
          // Search Results
          <div className="p-2 pb-20">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-builder-text-muted text-sm">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((template, idx) => (
                  <button
                    key={`${template.type}-${template.label}-${idx}`}
                    onClick={() => handleAddBlock(template, template.isSection)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-builder-surface-hover transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-builder-surface-active flex items-center justify-center text-builder-text-muted">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-builder-text flex items-center gap-2">
                        {template.label}
                        {template.isSection && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-builder-accent/20 text-builder-accent font-medium">
                            Section
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-builder-text-dim truncate">{template.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'blocks' ? (
          // Blocks Tab Content
          <div className="p-2 pb-20 space-y-0.5">
            {/* Quick Add - Basic Blocks Grid */}
            <div className="pb-2 mb-2 border-b border-builder-border-subtle">
              <div className="px-1 pb-2">
                <span className="text-[10px] font-semibold text-builder-text-dim uppercase tracking-wider">Quick Add</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {basicBlocks.slice(0, 8).map((block) => (
                  <button
                    key={block.label}
                    onClick={() => handleAddBlock(block, false)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-builder-surface-hover transition-colors group"
                    title={block.description}
                  >
                    <div className="w-8 h-8 rounded-lg bg-builder-surface-active flex items-center justify-center text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                      {block.icon}
                    </div>
                    <span className="text-[10px] text-builder-text-muted group-hover:text-builder-text transition-colors">{block.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Blocks */}
            <div className="pb-2">
              <div className="px-1 pb-2">
                <span className="text-[10px] font-semibold text-builder-text-dim uppercase tracking-wider">Form Elements</span>
              </div>
              <div className="space-y-0.5">
                {interactiveBlocks.map((block) => (
                  <button
                    key={block.label}
                    onClick={() => handleAddBlock(block, false)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-builder-surface-hover transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center text-builder-text-muted">
                      {block.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-builder-text">{block.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Sections Tab Content
          <div className="p-2 pb-20 space-y-0.5">
            <div className="px-1 pb-2">
              <span className="text-[10px] font-semibold text-builder-text-dim uppercase tracking-wider">Section Templates</span>
            </div>
            <p className="px-2 pb-3 text-xs text-builder-text-dim">
              Sections create a new container with content blocks.
            </p>
            {sectionCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategory === category.id}
                onOpenChange={(open) => setExpandedCategory(open ? category.id : null)}
              >
                <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-builder-surface-hover transition-colors">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-builder-text-muted">
                    {category.icon}
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-builder-text">{category.label}</span>
                  <ChevronRight 
                    size={14} 
                    className={cn(
                      "text-builder-text-dim transition-transform duration-200",
                      expandedCategory === category.id && "rotate-90"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 pl-4 border-l border-builder-border-subtle space-y-0.5 py-1">
                    {category.templates.map((template, idx) => (
                      <button
                        key={`${template.type}-${idx}`}
                        onClick={() => handleAddBlock(template, true)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-builder-surface-hover transition-colors text-left"
                      >
                        <div className="text-xs font-medium text-builder-text">{template.label}</div>
                        <div className="text-[10px] text-builder-text-dim">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockPickerPanel;
