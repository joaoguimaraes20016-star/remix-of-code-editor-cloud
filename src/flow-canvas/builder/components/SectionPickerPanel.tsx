import React, { useState } from 'react';
import { 
  Plus, Search, LayoutGrid, MousePointer, Quote, Package, Mail,
  X, ArrowLeft, Layers, Square
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Block } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ SECTION TEMPLATES ============

interface SectionTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  template: () => Block;
}

const sectionTemplates: SectionTemplate[] = [
  {
    id: 'empty',
    label: 'Empty Section',
    icon: <Square size={20} />,
    description: 'Start with a blank canvas',
    color: 'bg-gray-100 text-gray-500',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Section',
      elements: [],
      props: {},
    }),
  },
  {
    id: 'hero',
    label: 'Hero',
    icon: <LayoutGrid size={20} />,
    description: 'Title, subtitle & CTA',
    color: 'bg-purple-100 text-purple-600',
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
    id: 'cta',
    label: 'Call to Action',
    icon: <MousePointer size={20} />,
    description: 'Prompt user action',
    color: 'bg-blue-100 text-blue-600',
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
    id: 'features',
    label: 'Features',
    icon: <Package size={20} />,
    description: 'Highlight key benefits',
    color: 'bg-green-100 text-green-600',
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
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: <Quote size={20} />,
    description: 'Social proof & reviews',
    color: 'bg-amber-100 text-amber-600',
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
    id: 'contact',
    label: 'Contact Form',
    icon: <Mail size={20} />,
    description: 'Capture leads',
    color: 'bg-rose-100 text-rose-600',
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
];

// ============ COMPONENT ============

interface SectionPickerPanelProps {
  onAddSection: (block: Block) => void;
  onClose: () => void;
}

export const SectionPickerPanel: React.FC<SectionPickerPanelProps> = ({
  onAddSection,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = searchQuery.length > 0
    ? sectionTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sectionTemplates;

  const handleAddSection = (template: SectionTemplate) => {
    onAddSection(template.template());
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
          <span className="text-sm font-medium text-builder-text">Add Section</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-builder-border-subtle">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-builder-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sections..."
            className="pl-9 h-8 text-sm bg-builder-surface-hover border-builder-border text-builder-text placeholder:text-builder-text-dim"
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 pb-20">
        <div className="grid gap-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleAddSection(template)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                "bg-builder-surface-hover hover:bg-builder-surface-active",
                "border border-transparent hover:border-builder-border"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                template.color
              )}>
                {template.icon}
              </div>
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-builder-text">
                  {template.label}
                </div>
                <div className="text-xs text-builder-text-muted truncate">
                  {template.description}
                </div>
              </div>

              {/* Add indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={16} className="text-builder-text-muted" />
              </div>
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="p-4 text-center text-builder-text-muted text-sm">
            No sections found
          </div>
        )}
      </div>
    </div>
  );
};
