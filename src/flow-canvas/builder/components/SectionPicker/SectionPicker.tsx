/**
 * SectionPicker - Clean, Perspective-style section picker modal
 * Simple icons, grouped categories, light theme
 * Shows tile grid for blocks, template gallery for sections
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  allSectionTemplates,
  type SectionTemplate,
} from '@/builder_v2/templates/sectionTemplates';
import { HighTicketPreviewCard } from '../HighTicketPreviewCard';
import { CategoryIcon } from './CategoryIcon';
import { BasicBlockGrid } from './BasicBlockGrid';
import { InteractiveBlockGrid } from './InteractiveBlockGrid';

export interface SectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

// Block categories (basic elements) - show tile grid
const BLOCK_CATEGORIES = [
  { id: 'content', label: 'Basic blocks', icon: 'text' as const },
  { id: 'interactive', label: 'Interactive blocks', icon: 'sparkles' as const },
] as const;

// Section categories (full sections) - show template gallery
const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero', icon: 'square' as const },
  { id: 'features', label: 'Features', icon: 'grid' as const },
  { id: 'cta', label: 'Call to Action', icon: 'sparkles' as const },
  { id: 'about_us', label: 'About Us', icon: 'squares' as const },
  { id: 'quiz_form', label: 'Quiz/Form', icon: 'sparkles' as const },
  { id: 'team', label: 'Team', icon: 'people' as const },
  { id: 'testimonials', label: 'Testimonials', icon: 'quote' as const },
  { id: 'social_proof', label: 'Trust', icon: 'grid' as const },
] as const;

// Get templates for a category (filter out legacy)
function getTemplatesForCategory(categoryId: string): SectionTemplate[] {
  return allSectionTemplates.filter(
    t => t.category === categoryId && !t.name.includes('(Legacy)')
  );
}

// Check if category is a block category (shows tile grid)
function isBlockCategory(categoryId: string): boolean {
  return categoryId === 'content' || categoryId === 'interactive';
}

export function SectionPicker({
  isOpen,
  onClose,
  onSelectTemplate,
}: SectionPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('content');
  const containerRef = useRef<HTMLDivElement>(null);
  const templates = getTemplatesForCategory(activeCategory);
  const showBlockGrid = isBlockCategory(activeCategory);

  // Reset to content (blocks) when picker opens
  useEffect(() => {
    if (isOpen) {
      setActiveCategory('content');
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

  const handleAddBlock = (blockId: string) => {
    // For now, use the blockId as template ID - will need mapping
    onSelectTemplate(blockId);
    onClose();
  };

  const renderCategoryButton = (
    category: { id: string; label: string; icon: 'text' | 'sparkles' | 'square' | 'grid' | 'bars' | 'squares' | 'people' | 'quote' },
    isActive: boolean
  ) => {
    const isBlock = isBlockCategory(category.id);
    const templateCount = isBlock ? 1 : getTemplatesForCategory(category.id).length;
    
    return (
      <button
        key={category.id}
        onClick={() => templateCount > 0 && setActiveCategory(category.id)}
        disabled={templateCount === 0}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 text-left transition-all rounded-lg mx-2",
          "hover:bg-gray-50",
          isActive && "bg-blue-50",
          templateCount === 0 && "opacity-40 cursor-not-allowed"
        )}
        style={{ width: 'calc(100% - 16px)' }}
      >
        <CategoryIcon icon={category.icon} isActive={isActive} />
        <span className={cn(
          "flex-1 text-sm font-medium",
          isActive ? "text-blue-600" : "text-gray-900"
        )}>
          {category.label}
        </span>
        <ChevronRight 
          size={16} 
          className={cn(
            "transition-colors",
            isActive ? "text-blue-400" : "text-gray-300"
          )} 
        />
      </button>
    );
  };

  const getCategoryLabel = () => {
    const allCategories = [...BLOCK_CATEGORIES, ...SECTION_CATEGORIES];
    return allCategories.find(c => c.id === activeCategory)?.label || 'Templates';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "relative flex overflow-hidden rounded-2xl",
              "bg-white border border-gray-200",
              "shadow-2xl",
              "w-[900px] max-w-[92vw] h-[640px] max-h-[85vh]"
            )}
          >
            {/* Left Panel - Categories */}
            <div className="w-[260px] flex-shrink-0 border-r border-gray-100 bg-gray-50/50">
              {/* Blocks Section */}
              <div className="py-4">
                {BLOCK_CATEGORIES.map((category) => 
                  renderCategoryButton(category, activeCategory === category.id)
                )}
              </div>
              
              {/* Divider with Label */}
              <div className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Sections
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
              
              {/* Sections */}
              <div className="py-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 200px)' }}>
                {SECTION_CATEGORIES.map((category) => 
                  renderCategoryButton(category, activeCategory === category.id)
                )}
              </div>
            </div>

            {/* Right Panel - Template Gallery or Block Grid */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getCategoryLabel()}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Click to add to your page
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Block Grid or Template Gallery */}
              <div className="flex-1 overflow-y-auto">
                {showBlockGrid ? (
                  activeCategory === 'content' ? (
                    <BasicBlockGrid onAddBlock={handleAddBlock} />
                  ) : (
                    <InteractiveBlockGrid onAddBlock={handleAddBlock} />
                  )
                ) : templates.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <HighTicketPreviewCard
                          key={template.id}
                          template={template}
                          onAdd={() => handleSelectTemplate(template)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Package size={28} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No templates in this category
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
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
