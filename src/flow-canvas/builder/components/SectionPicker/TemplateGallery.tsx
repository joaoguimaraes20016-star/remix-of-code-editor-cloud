/**
 * TemplateGallery - Grid of template preview cards
 * Used inside the SectionPicker right panel
 */

import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';
import type { SectionTemplate } from '@/builder_v2/templates/sectionTemplates';
import { HighTicketPreviewCard } from '../HighTicketPreviewCard';

interface TemplateGalleryProps {
  templates: SectionTemplate[];
  onSelectTemplate: (template: SectionTemplate) => void;
  emptyMessage?: string;
}

export function TemplateGallery({ 
  templates, 
  onSelectTemplate,
  emptyMessage = "No templates available"
}: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--builder-surface))] flex items-center justify-center mb-4">
          <Package size={28} className="text-[hsl(var(--builder-text-muted))]" />
        </div>
        <p className="text-sm font-medium text-[hsl(var(--builder-text-muted))]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map((template) => (
        <HighTicketPreviewCard
          key={template.id}
          template={template}
          onAdd={() => onSelectTemplate(template)}
        />
      ))}
    </div>
  );
}
