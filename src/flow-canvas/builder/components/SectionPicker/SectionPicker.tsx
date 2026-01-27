/**
 * SectionPicker - Main unified section picker modal
 * Two-panel layout with category navigation and template gallery
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layout,
  MousePointerClick,
  Star,
  Package,
  Quote,
  Users,
  HelpCircle,
  Play,
  Calendar,
  ChevronRight,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '@/builder_v2/templates/sectionTemplates';
import { HighTicketPreviewCard } from '../HighTicketPreviewCard';

export interface SectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

// Category configuration with icons
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: Layout, description: 'Opening sections' },
  { id: 'content', label: 'Content', icon: Type, description: 'Text and info' },
  { id: 'cta', label: 'Call to Action', icon: MousePointerClick, description: 'Conversion sections' },
  { id: 'media', label: 'Media', icon: Play, description: 'Video and images' },
  { id: 'embed', label: 'Embed', icon: Calendar, description: 'Calendly, forms' },
  { id: 'social_proof', label: 'Social Proof', icon: Star, description: 'Trust indicators' },
  { id: 'features', label: 'Features', icon: Package, description: 'Benefits and lists' },
  { id: 'testimonials', label: 'Testimonials', icon: Quote, description: 'Customer quotes' },
  { id: 'team', label: 'Team', icon: Users, description: 'About sections' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Questions' },
] as const;

// Get templates for a category (filter out legacy)
function getTemplatesForCategory(categoryId: string): SectionTemplate[] {
  return allSectionTemplates.filter(
    t => t.category === categoryId && !t.name.includes('(Legacy)')
  );
}

export function SectionPicker({
  isOpen,
  onClose,
  onSelectTemplate,
}: SectionPickerProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "relative flex overflow-hidden rounded-2xl",
              "bg-[hsl(var(--builder-bg))] border border-[hsl(var(--builder-border))]",
              "shadow-2xl shadow-black/50",
              "w-[860px] max-w-[92vw] h-[640px] max-h-[85vh]"
            )}
          >
            {/* Left Panel - Categories */}
            <div className="w-[220px] flex-shrink-0 border-r border-[hsl(var(--builder-border))] bg-[hsl(var(--builder-surface))]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--builder-border))]">
                <h3 className="text-sm font-semibold text-[hsl(var(--builder-text))]">
                  Add Section
                </h3>
              </div>
              
              {/* Category List */}
              <div className="py-3 overflow-y-auto h-[calc(100%-57px)]">
                {SECTION_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  const templateCount = getTemplatesForCategory(category.id).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      disabled={templateCount === 0}
                      className={cn(
                        "flex items-center gap-3 w-full px-5 py-3 text-left transition-all group",
                        isActive
                          ? "bg-[hsl(var(--builder-accent)/0.12)] text-[hsl(var(--builder-accent))]"
                          : templateCount > 0
                            ? "text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))]"
                            : "text-[hsl(var(--builder-text-muted))] cursor-not-allowed opacity-50"
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          isActive ? "text-[hsl(var(--builder-accent))]" : "text-[hsl(var(--builder-text-muted))]"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-medium">{category.label}</span>
                        <span className="block text-[10px] text-[hsl(var(--builder-text-muted))] truncate">
                          {category.description}
                        </span>
                      </div>
                      {templateCount > 0 && (
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          isActive 
                            ? "bg-[hsl(var(--builder-accent)/0.2)] text-[hsl(var(--builder-accent))]"
                            : "bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]"
                        )}>
                          {templateCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Template Gallery */}
            <div className="flex-1 flex flex-col bg-[hsl(var(--builder-bg))]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--builder-border))]">
                <div>
                  <h3 className="text-base font-semibold text-[hsl(var(--builder-text))]">
                    {SECTION_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Templates'}
                  </h3>
                  <p className="text-xs text-[hsl(var(--builder-text-muted))] mt-0.5">
                    {templates.length} template{templates.length !== 1 ? 's' : ''} • Click to add
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto p-5">
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
                    <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--builder-surface))] flex items-center justify-center mb-4">
                      <Package size={28} className="text-[hsl(var(--builder-text-muted))]" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--builder-text-muted))]">
                      No templates in this category
                    </p>
                    <p className="text-xs text-[hsl(var(--builder-text-dim))] mt-1">
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
