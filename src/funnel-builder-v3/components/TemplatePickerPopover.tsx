/**
 * Template Picker Popover
 * Allows quick insertion of pre-configured block templates
 */

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, FileText, FormInput, Image, LayoutGrid } from 'lucide-react';
import { BLOCK_TEMPLATES, BlockTemplate } from '../data/blockTemplates';
import { cn } from '@/lib/utils';

interface TemplatePickerPopoverProps {
  onSelectTemplate: (templateId: string) => void;
  children: React.ReactNode;
}

const CATEGORY_CONFIG = {
  content: { label: 'Content', icon: FileText },
  form: { label: 'Forms', icon: FormInput },
  media: { label: 'Media', icon: Image },
  layout: { label: 'Layout', icon: LayoutGrid },
};

type Category = keyof typeof CATEGORY_CONFIG;

export function TemplatePickerPopover({
  onSelectTemplate,
  children,
}: TemplatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('content');

  const categories = Object.keys(CATEGORY_CONFIG) as Category[];
  const filteredTemplates = BLOCK_TEMPLATES.filter(t => t.category === activeCategory);

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-[hsl(var(--builder-v3-surface))] border-[hsl(var(--builder-v3-border))]"
        align="start"
        side="right"
      >
        {/* Header */}
        <div className="p-3 border-b border-[hsl(var(--builder-v3-border))]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--builder-v3-accent))]" />
            <span className="text-sm font-medium text-[hsl(var(--builder-v3-text))]">
              Block Templates
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-2 border-b border-[hsl(var(--builder-v3-border))]">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors',
                  activeCategory === cat
                    ? 'bg-[hsl(var(--builder-v3-accent))] text-white'
                    : 'text-[hsl(var(--builder-v3-text-secondary))] hover:bg-[hsl(var(--builder-v3-surface-hover))]'
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Template List */}
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className="w-full p-3 rounded-lg text-left transition-colors hover:bg-[hsl(var(--builder-v3-surface-hover))] group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[hsl(var(--builder-v3-surface-active))] flex items-center justify-center shrink-0">
                    <span className="text-xs font-mono text-[hsl(var(--builder-v3-text-dim))]">
                      {template.blocks.length}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(var(--builder-v3-text))] group-hover:text-[hsl(var(--builder-v3-accent))]">
                      {template.name}
                    </div>
                    <div className="text-xs text-[hsl(var(--builder-v3-text-dim))] mt-0.5">
                      {template.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
