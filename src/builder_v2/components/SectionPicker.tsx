/**
 * SectionPicker - Perspective-style clean section picker
 * Visual template previews with categorized sections
 */

import { useState } from 'react';
import {
  Type,
  AlignLeft,
  MousePointerClick,
  Image,
  Mail,
  Phone,
  Calendar,
  Minus,
  LayoutGrid,
  Video,
  ListChecks,
  ChevronRight,
  Users,
  Quote,
  Shield,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '../templates/sectionTemplates';
import { TemplatePreviewCard } from './TemplatePreviewCard';
import type { CanvasNode } from '../types';

interface SectionPickerProps {
  onAddSection: (node: CanvasNode) => void;
}

// F16: Category definitions - Title Case normalized, B3: Theme-aware colors
const sectionCategories = [
  { 
    id: 'hero', 
    name: 'Hero', 
    icon: Sparkles,
    colorClass: 'section-picker-icon--primary',
    templates: ['hero-simple', 'hero-button', 'hero-card-image']
  },
  { 
    id: 'product', 
    name: 'Product', 
    icon: LayoutGrid,
    colorClass: 'section-picker-icon--accent',
    templates: ['features-list', 'content-heading-text']
  },
  { 
    id: 'cta', 
    name: 'Call to Action',  // F16: Title Case
    icon: MousePointerClick,
    colorClass: 'section-picker-icon--cta',
    templates: ['cta-simple', 'cta-text']
  },
  { 
    id: 'about', 
    name: 'About Us',  // F16: Title Case
    icon: Users,
    colorClass: 'section-picker-icon--secondary',
    templates: ['content-text', 'content-heading-text']
  },
  { 
    id: 'quiz', 
    name: 'Quiz', 
    icon: HelpCircle,
    colorClass: 'section-picker-icon--primary',
    templates: ['form-multi-choice']
  },
  { 
    id: 'team', 
    name: 'Team', 
    icon: Users,
    colorClass: 'section-picker-icon--secondary',
    templates: ['content-heading-text']
  },
  { 
    id: 'testimonials', 
    name: 'Testimonials', 
    icon: Quote,
    colorClass: 'section-picker-icon--accent',
    templates: ['social-badges']
  },
  { 
    id: 'trust', 
    name: 'Trust', 
    icon: Shield,
    colorClass: 'section-picker-icon--muted',
    templates: ['social-badges', 'features-list']
  },
  { 
    id: 'media', 
    name: 'Media', 
    icon: Video,
    colorClass: 'section-picker-icon--primary',
    templates: ['media-video', 'media-image']
  },
  { 
    id: 'form', 
    name: 'Form', 
    icon: Mail,
    colorClass: 'section-picker-icon--primary',
    templates: ['form-email', 'form-phone', 'form-full', 'form-calendar', 'legal-consent', 'legal-optin']
  },
];

// Basic blocks - simple single elements
const basicBlocks = [
  { id: 'text', name: 'Text', icon: AlignLeft, preview: 'text-lines', type: 'paragraph', props: { text: 'Add your text here.' } },
  { id: 'heading', name: 'Heading', icon: Type, preview: 'heading', type: 'heading', props: { text: 'Your Heading', level: 'h2' } },
  { id: 'button', name: 'Button', icon: MousePointerClick, preview: 'button', type: 'cta_button', props: { label: 'Continue', variant: 'primary', action: 'next' } },
  { id: 'image', name: 'Image', icon: Image, preview: 'image', type: 'image', props: { src: '', alt: 'Image' } },
  { id: 'list', name: 'List', icon: ListChecks, preview: 'list', type: 'info_card', props: { items: [{ icon: '✓', text: 'Item 1' }, { icon: '✓', text: 'Item 2' }] } },
  { id: 'divider', name: 'Spacer', icon: Minus, preview: 'divider', type: 'spacer', props: { height: 24 } },
  { id: 'video', name: 'Video', icon: Video, preview: 'video', type: 'video_embed', props: { url: '', placeholder: 'Paste video URL' } },
];

// Interactive blocks - form elements and embeds
const interactiveBlocks = [
  { id: 'email', name: 'Email', icon: Mail, preview: 'input', type: 'email_input', props: { placeholder: 'Email address', fieldName: 'email', required: true } },
  { id: 'phone', name: 'Phone', icon: Phone, preview: 'input', type: 'phone_input', props: { placeholder: 'Phone number', fieldName: 'phone' } },
  { id: 'options', name: 'Options', icon: LayoutGrid, preview: 'options', type: 'option_grid', props: { options: [{ id: 'a', label: 'Option A', emoji: '✨' }, { id: 'b', label: 'Option B', emoji: '🚀' }], autoAdvance: true } },
  { id: 'calendar', name: 'Calendar', icon: Calendar, preview: 'calendar', type: 'calendar_embed', props: { url: '', placeholder: 'Paste calendar URL' } },
  { id: 'text-input', name: 'Text Input', icon: Type, preview: 'input', type: 'text_input', props: { placeholder: 'Type here...', fieldName: 'text' } },
];

// Block preview thumbnails
function BlockPreview({ type }: { type: string }) {
  switch (type) {
    case 'heading':
      return <div className="h-2 w-16 rounded bg-white font-bold" />;
    case 'text-lines':
      return (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded bg-slate-300" />
          <div className="h-1.5 w-4/5 rounded bg-slate-300" />
        </div>
      );
    case 'button':
      return <div className="h-5 w-12 rounded-md bg-blue-500" />;
    case 'image':
      return (
        <div className="h-10 w-14 rounded bg-slate-200 flex items-center justify-center">
          <Image size={14} className="text-slate-400" />
        </div>
      );
    case 'video':
      return (
        <div className="h-10 w-14 rounded bg-slate-200 flex items-center justify-center">
          <Video size={14} className="text-slate-400" />
        </div>
      );
    case 'list':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <div className="h-1 w-8 rounded bg-slate-300" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <div className="h-1 w-6 rounded bg-slate-300" />
          </div>
        </div>
      );
    case 'divider':
      return <div className="h-px w-10 bg-slate-300" />;
    case 'input':
      return <div className="h-4 w-12 rounded border border-slate-300 bg-white" />;
    case 'options':
      return (
        <div className="grid grid-cols-2 gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 w-4 rounded bg-slate-200" />
          ))}
        </div>
      );
    case 'calendar':
      return (
        <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center">
          <Calendar size={14} className="text-slate-400" />
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <ChevronRight size={6} className="text-slate-400" />
            <div className="h-1 w-8 rounded bg-slate-300" />
          </div>
          <div className="flex items-center gap-1">
            <ChevronRight size={6} className="text-slate-400" />
            <div className="h-1 w-6 rounded bg-slate-300" />
          </div>
        </div>
      );
    case 'countdown':
      return (
        <div className="flex gap-1">
          {['00', '12', '30'].map((n, i) => (
            <div key={i} className="bg-purple-100 rounded px-1 text-[8px] font-bold text-purple-600">{n}</div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

// Individual block item - B3: Theme-aware styling
function BlockItem({ name, icon: Icon, preview, onClick }: { name: string; icon: typeof Type; preview: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="section-picker-block-item focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--builder-accent)]"
    >
      <div className="h-10 flex items-center justify-center">
        <BlockPreview type={preview} />
      </div>
      <span className="text-[11px] font-medium text-[var(--builder-text-secondary)]">{name}</span>
    </button>
  );
}

// Expandable category row with template grid - B3: Theme-aware styling
function CategoryRow({ 
  name, 
  icon: Icon, 
  colorClass,
  isExpanded, 
  onToggle, 
  onSelectTemplate,
  templates 
}: { 
  name: string; 
  icon: typeof Sparkles;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectTemplate: (template: SectionTemplate) => void;
  templates: SectionTemplate[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "section-picker-category-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--builder-accent)]",
          isExpanded && "section-picker-category-btn--active"
        )}
      >
        <div className={cn("section-picker-category-icon", colorClass)}>
          <Icon size={14} />
        </div>
        <span className="flex-1 text-left text-sm font-medium text-[var(--builder-text-primary)]">{name}</span>
        <ChevronRight 
          size={16} 
          className={cn(
            "text-[var(--builder-text-muted)] transition-transform",
            isExpanded && "rotate-90"
          )} 
        />
      </button>
      {isExpanded && templates.length > 0 && (
        <div className="mt-2 mb-3 px-2">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <TemplatePreviewCard
                key={template.id}
                template={template}
                onAdd={() => onSelectTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionPicker({ onAddSection }: SectionPickerProps) {
  const [expandedBlock, setExpandedBlock] = useState<'basic' | 'interactive' | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleAddBlock = (block: { type: string; props: Record<string, unknown> }) => {
    const sectionNode: CanvasNode = {
      id: `section-${Date.now()}`,
      type: 'section',
      props: { variant: 'content' },
      children: [
        {
          id: `${block.type}-${Date.now()}`,
          type: block.type,
          props: block.props,
          children: [],
        },
      ],
    };
    onAddSection(sectionNode);
  };

  const handleAddTemplate = (template: SectionTemplate) => {
    onAddSection(template.createNode());
  };

  const getTemplatesForCategory = (categoryId: string): SectionTemplate[] => {
    const category = sectionCategories.find(c => c.id === categoryId);
    if (!category) return [];
    return allSectionTemplates.filter(t => category.templates.includes(t.id));
  };

  return (
    <div className="section-picker">
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Header */}
          <h3 className="text-sm font-semibold text-[var(--builder-text-primary)] mb-3">Add section</h3>
          
          {/* Blocks Section - A2: Renamed to "sections" to match behavior */}
          <div className="space-y-1 mb-4">
            {/* Basic Sections */}
            <button
              onClick={() => setExpandedBlock(expandedBlock === 'basic' ? null : 'basic')}
              className={cn(
                "section-picker-category-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--builder-accent)]",
                expandedBlock === 'basic' && "section-picker-category-btn--active"
              )}
            >
              <div className="section-picker-category-icon section-picker-icon--muted">
                <Type size={14} />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-[var(--builder-text-primary)]">Basic Sections</span>
              <ChevronRight 
                size={16} 
                className={cn(
                  "text-[var(--builder-text-muted)] transition-transform",
                  expandedBlock === 'basic' && "rotate-90"
                )} 
              />
            </button>
            {expandedBlock === 'basic' && (
              <div className="section-picker-block-grid">
                {basicBlocks.map((block) => (
                  <BlockItem
                    key={block.id}
                    name={block.name}
                    icon={block.icon}
                    preview={block.preview}
                    onClick={() => handleAddBlock(block)}
                  />
                ))}
              </div>
            )}

            {/* Form Sections */}
            <button
              onClick={() => setExpandedBlock(expandedBlock === 'interactive' ? null : 'interactive')}
              className={cn(
                "section-picker-category-btn focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--builder-accent)]",
                expandedBlock === 'interactive' && "section-picker-category-btn--active"
              )}
            >
              <div className="section-picker-category-icon section-picker-icon--primary">
                <Sparkles size={14} />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-[var(--builder-text-primary)]">Form Sections</span>
              <ChevronRight 
                size={16} 
                className={cn(
                  "text-[var(--builder-text-muted)] transition-transform",
                  expandedBlock === 'interactive' && "rotate-90"
                )} 
              />
            </button>
            {expandedBlock === 'interactive' && (
              <div className="section-picker-block-grid">
                {interactiveBlocks.map((block) => (
                  <BlockItem
                    key={block.id}
                    name={block.name}
                    icon={block.icon}
                    preview={block.preview}
                    onClick={() => handleAddBlock(block)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sections divider */}
          <div className="text-[11px] font-semibold text-[var(--builder-text-muted)] uppercase tracking-wider mb-2">
            Sections
          </div>

          {/* Section categories with visual previews */}
          <div className="space-y-0.5">
            {sectionCategories.map((category) => (
              <CategoryRow
                key={category.id}
                name={category.name}
                icon={category.icon}
                colorClass={category.colorClass}
                isExpanded={expandedSection === category.id}
                onToggle={() => setExpandedSection(expandedSection === category.id ? null : category.id)}
                onSelectTemplate={handleAddTemplate}
                templates={getTemplatesForCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
