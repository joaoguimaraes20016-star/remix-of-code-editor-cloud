/**
 * InlineSectionPicker - Focused popover for adding sections directly on canvas
 * Clean, minimal design that appears where the user clicks
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MousePointerClick,
  Mail,
  Video,
  HelpCircle,
  LayoutGrid,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '@/builder_v2/templates/sectionTemplates';

interface InlineSectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  position?: 'center' | 'bottom';
}

// Simplified categories for quick access
const quickCategories = [
  { 
    id: 'hero', 
    name: 'Hero', 
    icon: Sparkles,
    description: 'Headline & intro',
    templates: ['hero-simple', 'hero-button']
  },
  { 
    id: 'cta', 
    name: 'Call to Action', 
    icon: MousePointerClick,
    description: 'Buttons & links',
    templates: ['cta-simple', 'cta-text']
  },
  { 
    id: 'embed', 
    name: 'Embed', 
    icon: Mail,
    description: 'Calendar & widgets',
    templates: ['embed-calendar', 'embed-empty']
  },
  { 
    id: 'social', 
    name: 'Social Proof', 
    icon: HelpCircle,
    description: 'Trust badges',
    templates: ['social-badges']
  },
  { 
    id: 'media', 
    name: 'Media', 
    icon: Video,
    description: 'Video & images',
    templates: ['media-video', 'media-image']
  },
  { 
    id: 'features', 
    name: 'Features', 
    icon: LayoutGrid,
    description: 'Lists & grids',
    templates: ['features-list', 'content-heading-text']
  },
];

export function InlineSectionPicker({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  position = 'center' 
}: InlineSectionPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when picker closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategory(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      // Small delay to prevent immediate close from the trigger click
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleSelectTemplate = (template: SectionTemplate) => {
    onSelectTemplate(template.id);
    onClose();
    setSelectedCategory(null);
  };

  const getCategoryTemplates = (categoryId: string) => {
    const category = quickCategories.find(c => c.id === categoryId);
    if (!category) return [];
    return allSectionTemplates.filter(t => category.templates.includes(t.id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "relative bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] rounded-2xl shadow-2xl overflow-hidden",
              "w-[400px] max-h-[500px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--builder-border))]">
              <div>
                <h3 className="text-base font-semibold text-[hsl(var(--builder-text))]">
                  {selectedCategory ? 'Choose Template' : 'Add Section'}
                </h3>
                <p className="text-xs text-[hsl(var(--builder-text-muted))] mt-0.5">
                  {selectedCategory 
                    ? 'Pick a template to add' 
                    : 'Select a category to get started'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[400px]">
              <AnimatePresence mode="wait">
                {!selectedCategory ? (
                  /* Category Grid */
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {quickCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border transition-all text-left group",
                          "bg-[hsl(var(--builder-surface-hover)/0.5)] border-[hsl(var(--builder-border))]",
                          "hover:bg-[hsl(var(--builder-surface-active))] hover:border-[hsl(var(--builder-accent)/0.5)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--builder-accent))]"
                        )}
                      >
                        <div className="p-2.5 rounded-lg bg-[hsl(var(--builder-accent)/0.15)] text-[hsl(var(--builder-accent))] mb-3 group-hover:bg-[hsl(var(--builder-accent)/0.2)] transition-colors">
                          <category.icon size={20} />
                        </div>
                        <span className="text-sm font-medium text-[hsl(var(--builder-text))]">
                          {category.name}
                        </span>
                        <span className="text-xs text-[hsl(var(--builder-text-muted))] mt-0.5">
                          {category.description}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  /* Template List */
                  <motion.div
                    key="templates"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Back button */}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-2 mb-4 text-sm text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] transition-colors"
                    >
                      <span>←</span>
                      <span>Back to categories</span>
                    </button>

                    {/* Templates grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {getCategoryTemplates(selectedCategory).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                            "bg-[hsl(var(--builder-surface-hover)/0.5)] border-[hsl(var(--builder-border))]",
                            "hover:bg-[hsl(var(--builder-surface-active))] hover:border-[hsl(var(--builder-accent)/0.5)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--builder-accent))]"
                          )}
                        >
                          {/* Template preview thumbnail */}
                          <div className="w-16 h-12 rounded-lg bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--builder-accent)/0.2)] to-transparent flex items-center justify-center">
                              <Plus size={16} className="text-[hsl(var(--builder-text-muted))]" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[hsl(var(--builder-text))] block truncate">
                              {template.name}
                            </span>
                            <span className="text-xs text-[hsl(var(--builder-text-muted))] block truncate mt-0.5">
                              {template.description}
                            </span>
                          </div>

                          <div className="text-[hsl(var(--builder-text-muted))] group-hover:text-[hsl(var(--builder-accent))] transition-colors">
                            <Plus size={18} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
