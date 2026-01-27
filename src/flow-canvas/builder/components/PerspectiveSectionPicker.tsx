/**
 * PerspectiveSectionPicker - Premium two-panel section picker
 * Inspired by Perspective's high-fidelity template gallery
 * Designed for high-ticket coaching funnels
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Type,
  Sparkles,
  Layout,
  Package,
  MousePointerClick,
  Users,
  HelpCircle,
  Quote,
  Star,
  Play,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '@/builder_v2/templates/sectionTemplates';
import { HighTicketPreviewCard } from './HighTicketPreviewCard';

interface PerspectiveSectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

// Category configuration with icons
const SECTION_CATEGORIES = [
  // Basic Blocks
  { id: 'basic', label: 'Basic Blocks', icon: Type, group: 'blocks' },
  { id: 'interactive', label: 'Interactive', icon: Sparkles, group: 'blocks' },
  // Divider
  { id: 'divider-1', label: '', icon: null, group: 'divider' },
  // Sections
  { id: 'hero', label: 'Hero', icon: Layout, group: 'sections' },
  { id: 'content', label: 'Content', icon: Type, group: 'sections' },
  { id: 'cta', label: 'Call to Action', icon: MousePointerClick, group: 'sections' },
  { id: 'media', label: 'Media', icon: Play, group: 'sections' },
  { id: 'embed', label: 'Embed', icon: Calendar, group: 'sections' },
  { id: 'social_proof', label: 'Social Proof', icon: Star, group: 'sections' },
  { id: 'features', label: 'Features', icon: Package, group: 'sections' },
  { id: 'testimonials', label: 'Testimonials', icon: Quote, group: 'sections' },
  { id: 'team', label: 'Team', icon: Users, group: 'sections' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, group: 'sections' },
] as const;

// Map template category to picker category
function getTemplatesForCategory(categoryId: string): SectionTemplate[] {
  // Filter out deprecated templates
  const activeTemplates = allSectionTemplates.filter(
    t => !t.name.includes('(Legacy)')
  );
  
  if (categoryId === 'basic' || categoryId === 'interactive') {
    // These will be handled by BlockPickerPanel for now
    return [];
  }
  
  return activeTemplates.filter(t => t.category === categoryId);
}

export function PerspectiveSectionPicker({
  isOpen,
  onClose,
  onSelectTemplate,
}: PerspectiveSectionPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('hero');
  const containerRef = useRef<HTMLDivElement>(null);
  const templates = getTemplatesForCategory(activeCategory);

  // Reset to hero when picker opens
  useEffect(() => {
    if (isOpen) {
      setActiveCategory('hero');
    }
  }, [isOpen]);

  // Close on escape
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
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "relative flex overflow-hidden rounded-2xl",
              "bg-[hsl(var(--coaching-dark))] border border-[hsl(var(--coaching-border))]",
              "shadow-2xl shadow-black/50",
              "w-[800px] max-w-[90vw] h-[600px] max-h-[80vh]"
            )}
          >
            {/* Left Panel - Categories */}
            <div className="w-[200px] flex-shrink-0 border-r border-[hsl(var(--coaching-border))] bg-[hsl(var(--coaching-surface))]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--coaching-border))]">
                <h3 className="text-sm font-semibold text-[hsl(var(--coaching-text))]">
                  Add Section
                </h3>
              </div>
              
              {/* Category List */}
              <div className="py-2 overflow-y-auto h-[calc(100%-57px)]">
                {SECTION_CATEGORIES.map((category) => {
                  if (category.group === 'divider') {
                    return (
                      <div
                        key={category.id}
                        className="mx-3 my-3 border-t border-[hsl(var(--coaching-border))]"
                      >
                        <span className="block px-1 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--coaching-muted))]">
                          Sections
                        </span>
                      </div>
                    );
                  }
                  
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  const hasTemplates = getTemplatesForCategory(category.id).length > 0;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      disabled={!hasTemplates}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all group",
                        isActive
                          ? "bg-[hsl(var(--coaching-accent)/0.15)] text-[hsl(var(--coaching-accent))]"
                          : hasTemplates
                            ? "text-[hsl(var(--coaching-text))] hover:bg-[hsl(var(--coaching-border)/0.5)]"
                            : "text-[hsl(var(--coaching-muted))] cursor-not-allowed opacity-50"
                      )}
                    >
                      {Icon && (
                        <Icon
                          size={16}
                          className={cn(
                            isActive ? "text-[hsl(var(--coaching-accent))]" : "text-[hsl(var(--coaching-muted))]"
                          )}
                        />
                      )}
                      <span className="flex-1 text-sm font-medium">{category.label}</span>
                      {hasTemplates && (
                        <ChevronRight
                          size={14}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            isActive ? "opacity-100" : ""
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Template Gallery */}
            <div className="flex-1 flex flex-col bg-[hsl(var(--coaching-dark))]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--coaching-border))]">
                <div>
                  <h3 className="text-base font-semibold text-[hsl(var(--coaching-text))]">
                    {SECTION_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Templates'}
                  </h3>
                  <p className="text-xs text-[hsl(var(--coaching-muted))] mt-0.5">
                    {templates.length} template{templates.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[hsl(var(--coaching-muted))] hover:text-[hsl(var(--coaching-text))] hover:bg-[hsl(var(--coaching-border)/0.5)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {templates.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <HighTicketPreviewCard
                        key={template.id}
                        template={template}
                        onAdd={() => handleSelectTemplate(template)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--coaching-border)/0.3)] flex items-center justify-center mb-4">
                      <Package size={28} className="text-[hsl(var(--coaching-muted))]" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--coaching-muted))]">
                      No templates in this category
                    </p>
                    <p className="text-xs text-[hsl(var(--coaching-muted)/0.7)] mt-1">
                      Try selecting a different category
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
