/**
 * TemplatePreviewCard - Visual thumbnail preview of section templates
 * Shows a scaled-down miniature of the actual template
 */

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionTemplate } from '../templates/sectionTemplates';

interface TemplatePreviewCardProps {
  template: SectionTemplate;
  onAdd: () => void;
}

// B3: Theme-aware template preview card
export function TemplatePreviewCard({ template, onAdd }: TemplatePreviewCardProps) {
  return (
    <button
      onClick={onAdd}
      className="template-preview-card group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--builder-accent)]"
    >
      {/* Preview area */}
      <div className="template-preview-card-preview">
        <TemplatePreview template={template} />
        
        {/* Hover overlay with add button */}
        <div className="template-preview-card-overlay">
          <div className="template-preview-card-add-icon">
            <Plus size={16} />
          </div>
        </div>
      </div>
      
      {/* Template name */}
      <div className="px-2 py-1.5 text-center">
        <span className="text-[11px] font-medium text-[var(--builder-text-secondary)] truncate block">
          {template.name}
        </span>
      </div>
    </button>
  );
}

// Visual preview of different template types
function TemplatePreview({ template }: { template: SectionTemplate }) {
  const { category, id } = template;

  // Hero templates
  if (category === 'hero') {
    const showButton = id.includes('button') || id.includes('card');
    const showImage = id.includes('image');

    return (
      <div className="space-y-2">
        <div className="h-2.5 w-24 bg-white/90 rounded" />
        <div className="h-1.5 w-20 bg-white/50 rounded" />
        {showButton && (
          <div className="h-3 w-12 bg-blue-500 rounded-sm mt-2" />
        )}
        {showImage && (
          <div className="h-6 w-full bg-white/10 border border-white/20 rounded mt-2" />
        )}
      </div>
    );
  }

  // Content templates
  if (category === 'content') {
    return (
      <div className="space-y-1.5">
        {id.includes('heading') && (
          <div className="h-2 w-16 bg-white/80 rounded" />
        )}
        <div className="space-y-1">
          <div className="h-1 w-full bg-white/40 rounded" />
          <div className="h-1 w-4/5 bg-white/40 rounded" />
          <div className="h-1 w-3/4 bg-white/40 rounded" />
        </div>
      </div>
    );
  }

  // CTA templates
  if (category === 'cta') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        {id.includes('text') && (
          <div className="h-1.5 w-20 bg-white/50 rounded" />
        )}
        <div className="h-4 w-16 bg-blue-500 rounded-sm" />
      </div>
    );
  }

  // About Us templates
  if (category === 'about_us') {
    if (id.includes('contact')) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className="h-1.5 w-12 bg-white/70 rounded" />
          <div className="flex gap-2 mt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400/70" />
            ))}
          </div>
        </div>
      );
    }
    if (id.includes('split')) {
      return (
        <div className="flex gap-2 h-full items-center">
          <div className="w-10 h-8 rounded bg-white/20" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-10 bg-white/70 rounded" />
            <div className="h-1 w-14 bg-white/40 rounded" />
          </div>
        </div>
      );
    }
    // Default about layout
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <div className="h-1.5 w-16 bg-white/70 rounded" />
        <div className="h-1 w-20 bg-white/40 rounded" />
        <div className="w-full h-6 rounded bg-white/20 mt-1" />
      </div>
    );
  }

  // Quiz/Form templates
  if (category === 'quiz_form') {
    if (id.includes('image')) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className="h-1.5 w-14 bg-white/70 rounded" />
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-4 h-5 rounded bg-blue-400/50" />
            ))}
          </div>
        </div>
      );
    }
    if (id.includes('split')) {
      return (
        <div className="flex gap-2 h-full items-center">
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-12 bg-white/70 rounded" />
            <div className="space-y-0.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-1 w-full bg-white/30 rounded" />
              ))}
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-white/20" />
        </div>
      );
    }
    // Default quiz layout
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <div className="h-1.5 w-16 bg-white/70 rounded" />
        <div className="grid grid-cols-2 gap-1 w-full mt-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2 bg-blue-400/40 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Social proof / features
  if (category === 'social_proof' || category === 'features') {
    return (
      <div className="space-y-1.5">
        {category === 'features' && (
          <div className="h-2 w-14 bg-white/70 rounded mb-1" />
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400/70" />
            <div className="h-1 w-16 bg-white/40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded bg-white/20" />
    </div>
  );
}
