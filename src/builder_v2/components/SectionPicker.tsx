/**
 * SectionPicker - Perspective-style clean section picker
 * Tabs at top, simple grid of items - minimal, focused, fast
 */

import { useState } from 'react';
import {
  Type,
  AlignLeft,
  MousePointerClick,
  Play,
  Image,
  Mail,
  Phone,
  Calendar,
  Minus,
  Square,
  LayoutGrid,
  FormInput,
  Sparkles,
  Video,
  ListChecks,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '../templates/sectionTemplates';
import type { CanvasNode } from '../types';

interface SectionPickerProps {
  onAddSection: (node: CanvasNode) => void;
}

type TabType = 'blocks' | 'sections';

// Simplified basic blocks - the essentials
const basicBlocks = [
  { id: 'heading', name: 'Heading', icon: Type, type: 'heading', props: { text: 'Heading', level: 'h2' } },
  { id: 'text', name: 'Text', icon: AlignLeft, type: 'paragraph', props: { text: 'Add your text here.' } },
  { id: 'button', name: 'Button', icon: MousePointerClick, type: 'cta_button', props: { label: 'Continue', variant: 'primary', action: 'next' } },
  { id: 'image', name: 'Image', icon: Image, type: 'image_block', props: { src: '', alt: 'Image' } },
  { id: 'video', name: 'Video', icon: Video, type: 'video_embed', props: { url: '' } },
  { id: 'spacer', name: 'Spacer', icon: Minus, type: 'spacer', props: { height: 24 } },
  { id: 'email', name: 'Email', icon: Mail, type: 'email_input', props: { placeholder: 'Email address', fieldName: 'email' } },
  { id: 'phone', name: 'Phone', icon: Phone, type: 'phone_input', props: { placeholder: 'Phone number', fieldName: 'phone' } },
  { id: 'options', name: 'Options', icon: ListChecks, type: 'option_grid', props: { options: [{ id: 'a', label: 'Option A', emoji: '✨' }, { id: 'b', label: 'Option B', emoji: '🚀' }], autoAdvance: true } },
  { id: 'calendar', name: 'Calendar', icon: Calendar, type: 'calendar_embed', props: { url: '' } },
];

// Section templates with simple icons
const sectionItems = [
  { id: 'hero', name: 'Hero', icon: Sparkles, template: 'hero-button' },
  { id: 'content', name: 'Content', icon: AlignLeft, template: 'content-heading-text' },
  { id: 'cta', name: 'CTA', icon: MousePointerClick, template: 'cta-text' },
  { id: 'video-section', name: 'Video', icon: Video, template: 'media-video' },
  { id: 'image-section', name: 'Image', icon: Image, template: 'media-image' },
  { id: 'form', name: 'Form', icon: FormInput, template: 'form-full' },
  { id: 'choices', name: 'Choices', icon: LayoutGrid, template: 'form-multi-choice' },
  { id: 'booking', name: 'Booking', icon: Calendar, template: 'form-calendar' },
];

interface BlockItemProps {
  name: string;
  icon: typeof Type;
  onClick: () => void;
}

function BlockItem({ name, icon: Icon, onClick }: BlockItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all group"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-slate-500 group-hover:text-slate-700 shadow-sm transition-colors">
        <Icon size={18} />
      </div>
      <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900">{name}</span>
    </button>
  );
}

function SectionItem({ name, icon: Icon, onClick }: BlockItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/50 hover:from-primary/5 hover:to-primary/10 border border-slate-200/50 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-slate-500 group-hover:text-primary shadow-sm transition-colors">
        <Icon size={18} />
      </div>
      <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900">{name}</span>
    </button>
  );
}

export function SectionPicker({ onAddSection }: SectionPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('blocks');

  const handleAddBlock = (block: typeof basicBlocks[0]) => {
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

  const handleAddSection = (templateId: string) => {
    const template = allSectionTemplates.find(t => t.id === templateId);
    if (template) {
      onAddSection(template.createNode());
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('blocks')}
            className={cn(
              "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
              activeTab === 'blocks'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={cn(
              "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
              activeTab === 'sections'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sections
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {activeTab === 'blocks' && (
            <div className="grid grid-cols-3 gap-2">
              {basicBlocks.map((block) => (
                <BlockItem
                  key={block.id}
                  name={block.name}
                  icon={block.icon}
                  onClick={() => handleAddBlock(block)}
                />
              ))}
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="grid grid-cols-2 gap-2">
              {sectionItems.map((item) => (
                <SectionItem
                  key={item.id}
                  name={item.name}
                  icon={item.icon}
                  onClick={() => handleAddSection(item.template)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Hint */}
      <div className="px-3 py-2 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          Click to add • Drag to reorder
        </p>
      </div>
    </div>
  );
}
