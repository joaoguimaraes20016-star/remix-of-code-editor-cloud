import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Layers, Square, MousePointer2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  type: 'page' | 'section' | 'block' | 'element';
  id: string;
  label: string;
}

interface SelectionBreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (type: string, id: string) => void;
  className?: string;
}

// Color tokens per level - uses CSS variables for consistency
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  page: { 
    bg: 'bg-[hsl(var(--builder-surface-active))]', 
    text: 'text-[hsl(var(--builder-text-muted))]',
    border: 'border-[hsl(var(--builder-border))]'
  },
  section: { 
    bg: 'bg-[hsl(var(--builder-accent))]/15', 
    text: 'text-[hsl(var(--builder-accent-glow))]',
    border: 'border-[hsl(var(--builder-accent))]/30'
  },
  block: { 
    bg: 'bg-[hsl(var(--builder-accent-secondary))]/15', 
    text: 'text-[hsl(var(--builder-accent-secondary))]',
    border: 'border-[hsl(var(--builder-accent-secondary))]/30'
  },
  element: { 
    bg: 'bg-[hsl(var(--builder-accent-tertiary))]/15', 
    text: 'text-[hsl(var(--builder-accent-tertiary))]',
    border: 'border-[hsl(var(--builder-accent-tertiary))]/30'
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  page: <FileText size={11} />,
  section: <Layers size={11} />,
  block: <Square size={11} />,
  element: <MousePointer2 size={11} />,
};

const typeLabels: Record<string, string> = {
  page: 'Canvas',
  section: 'Section',
  block: 'Block',
  element: 'Element',
};

const SelectionBreadcrumbInner: React.FC<SelectionBreadcrumbProps> = ({
  items,
  onSelect,
  className,
}) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-center gap-1 px-3 py-2',
        'bg-[hsl(var(--builder-bg))]',
        'border-b border-[hsl(var(--builder-border))]',
        'overflow-x-auto overflow-y-hidden scrollbar-none flex-shrink-0',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const colors = typeColors[item.type] || typeColors.element;
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={`${item.type}-${item.id}`}>
              {index > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-[hsl(var(--builder-text-dim))]"
                >
                  <ChevronRight size={10} />
                </motion.span>
              )}
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ delay: index * 0.02 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item.type, item.id);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md border',
                  'text-[10px] font-medium',
                  'transition-all duration-150',
                  'hover:brightness-110',
                  colors.bg,
                  colors.text,
                  colors.border,
                  isLast && 'ring-1 ring-white/10'
                )}
              >
                <span className="opacity-80">{typeIcons[item.type]}</span>
                <span className="truncate max-w-[70px]">
                  {item.label || typeLabels[item.type]}
                </span>
              </motion.button>
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export const SelectionBreadcrumb = SelectionBreadcrumbInner;

export default SelectionBreadcrumb;
