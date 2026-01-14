import React, { useState } from 'react';
import { 
  Search, LayoutGrid, MousePointer, Quote, 
  X, ArrowLeft, HelpCircle, UserCheck, ClipboardList, 
  ChevronRight, CheckCircle, ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Block } from '@/flow-canvas/types/infostack';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ SECTION TEMPLATES ============

interface SectionTemplate {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  template: () => Block;
}

interface SectionCategory {
  id: string;
  label: string;
  description?: string;
  defaultOpen?: boolean;
  templates: SectionTemplate[];
}

// ============ CAPTURE SECTIONS ============

const captureSections: SectionTemplate[] = [
  {
    id: 'single-question',
    label: 'Single Question',
    icon: <HelpCircle size={18} />,
    description: 'One question per screen — Typeform style',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Question',
      elements: [
        { id: generateId(), type: 'heading', content: 'What is your biggest challenge?', props: { level: 2 } },
        { id: generateId(), type: 'radio', content: 'Not enough leads', props: { name: 'challenge', value: 'leads' } },
        { id: generateId(), type: 'radio', content: 'Low conversions', props: { name: 'challenge', value: 'conversions' } },
        { id: generateId(), type: 'radio', content: 'Can\'t scale', props: { name: 'challenge', value: 'scale' } },
        { id: generateId(), type: 'button', content: 'Continue', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { trackingId: '', intent: 'qualify' },
    }),
  },
  {
    id: 'opt-in-form',
    label: 'Opt-In Form',
    icon: <UserCheck size={18} />,
    description: 'Name, email & phone capture',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Opt-In Form',
      elements: [
        { id: generateId(), type: 'heading', content: 'Get Instant Access', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Enter your details below.', props: { variant: 'subtext' } },
        { id: generateId(), type: 'text', content: 'Name', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'text', content: 'Email', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'button', content: 'Get Access', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
  {
    id: 'application-form',
    label: 'Application Form',
    icon: <ClipboardList size={18} />,
    description: 'Multi-field qualification',
    template: () => ({
      id: generateId(),
      type: 'form-field',
      label: 'Application Form',
      elements: [
        { id: generateId(), type: 'heading', content: 'Apply Now', props: { level: 2 } },
        { id: generateId(), type: 'text', content: 'Full Name', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'text', placeholder: 'Your name', required: true, fieldKey: 'name', icon: 'user' } },
        { id: generateId(), type: 'text', content: 'Email', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'email', placeholder: 'you@example.com', required: true, fieldKey: 'email', icon: 'mail' } },
        { id: generateId(), type: 'text', content: 'Phone', props: { variant: 'label' } },
        { id: generateId(), type: 'input', content: '', props: { type: 'tel', placeholder: '+1 (555) 000-0000', required: false, fieldKey: 'phone', icon: 'phone' } },
        { id: generateId(), type: 'button', content: 'Submit Application', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { trackingId: '', intent: 'capture' },
    }),
  },
];

// ============ CONTENT SECTIONS ============

const contentSections: SectionTemplate[] = [
  {
    id: 'welcome-hero',
    label: 'Welcome / Hero',
    icon: <LayoutGrid size={18} />,
    description: 'First impression — title, subtitle & CTA',
    template: () => ({
      id: generateId(),
      type: 'hero',
      label: 'Hero Section',
      elements: [
        { id: generateId(), type: 'heading', content: 'Ready to Transform Your Business?', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'Answer a few quick questions to see if you qualify.', props: {} },
        { id: generateId(), type: 'button', content: 'Get Started', props: { variant: 'primary', size: 'lg' } },
      ],
      props: { alignment: 'center', intent: 'convert' },
    }),
  },
  {
    id: 'testimonial',
    label: 'Testimonial',
    icon: <Quote size={18} />,
    description: 'Build trust — social proof',
    template: () => ({
      id: generateId(),
      type: 'testimonial',
      label: 'Testimonial',
      elements: [
        { id: generateId(), type: 'text', content: '"This changed everything for my business. I went from struggling to hitting 6 figures in 90 days."', props: {} },
        { id: generateId(), type: 'text', content: '— John Smith, Agency Owner', props: { variant: 'caption' } },
      ],
      props: { rating: 5, avatar: '' },
    }),
  },
  {
    id: 'thank-you',
    label: 'Thank You',
    icon: <CheckCircle size={18} />,
    description: 'Confirmation screen',
    template: () => ({
      id: generateId(),
      type: 'hero',
      label: 'Thank You',
      elements: [
        { id: generateId(), type: 'heading', content: 'You\'re All Set!', props: { level: 1 } },
        { id: generateId(), type: 'text', content: 'We\'ll be in touch within 24 hours.', props: {} },
        { id: generateId(), type: 'text', content: 'Check your email for next steps.', props: { variant: 'subtext' } },
      ],
      props: { alignment: 'center', intent: 'complete' },
    }),
  },
];

// ============ ADVANCED SECTIONS (collapsed by default) ============

const advancedSections: SectionTemplate[] = [
  {
    id: 'empty',
    label: 'Empty Section',
    icon: <LayoutGrid size={18} />,
    description: 'Start from scratch',
    template: () => ({
      id: generateId(),
      type: 'custom',
      label: 'Section',
      elements: [],
      props: {},
    }),
  },
  {
    id: 'cta',
    label: 'Call to Action',
    icon: <MousePointer size={18} />,
    description: 'Drive action — prompt next step',
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
];

// ============ CATEGORIES ============

const sectionCategories: SectionCategory[] = [
  {
    id: 'capture',
    label: 'Capture Sections',
    description: 'Questions and forms to qualify leads',
    defaultOpen: true,
    templates: captureSections,
  },
  {
    id: 'content',
    label: 'Content Sections',
    description: 'Supporting content for your flow',
    defaultOpen: true,
    templates: contentSections,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'More options',
    defaultOpen: false,
    templates: advancedSections,
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(sectionCategories.filter(c => c.defaultOpen).map(c => c.id))
  );

  // Flatten all templates for search
  const allTemplates = sectionCategories.flatMap(cat => cat.templates);

  const filteredTemplates = searchQuery.length > 0
    ? allTemplates.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleAddSection = (template: SectionTemplate) => {
    onAddSection(template.template());
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-builder-surface">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-builder-border">
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
      <div className="flex-shrink-0 px-3 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-builder-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sections..."
            className="pl-9 h-9 text-sm bg-builder-surface-hover border-builder-border text-builder-text placeholder:text-builder-text-dim"
          />
        </div>
      </div>

      {/* Content - Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto builder-scroll px-2 pb-20">
        {/* Search Results */}
        {filteredTemplates !== null ? (
          <div className="flex flex-col">
            {filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-builder-text-muted text-sm">
                No sections found
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleAddSection(template)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left group",
                    "hover:bg-builder-surface-hover"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-builder-surface-active flex items-center justify-center text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-builder-text">
                      {template.label}
                    </span>
                    <p className="text-[11px] text-builder-text-dim">{template.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-builder-text-dim group-hover:text-builder-text-muted transition-colors" />
                </button>
              ))
            )}
          </div>
        ) : (
          // Categorized View
          <div className="space-y-2">
            {sectionCategories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategories.has(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-builder-surface-hover transition-colors">
                  <ChevronDown 
                    size={14} 
                    className={cn(
                      "text-builder-text-dim transition-transform duration-200",
                      !expandedCategories.has(category.id) && "-rotate-90"
                    )}
                  />
                  <span className="flex-1 text-left text-xs font-semibold text-builder-text-dim uppercase tracking-wider">
                    {category.label}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-0.5 pt-1">
                    {category.templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleAddSection(template)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left group",
                          "hover:bg-builder-surface-hover"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-builder-surface-active flex items-center justify-center text-builder-text-muted group-hover:text-builder-accent group-hover:bg-builder-accent/10 transition-colors">
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-builder-text">
                            {template.label}
                          </span>
                          <p className="text-[11px] text-builder-text-dim">{template.description}</p>
                        </div>
                        <ChevronRight size={14} className="text-builder-text-dim group-hover:text-builder-text-muted transition-colors" />
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
