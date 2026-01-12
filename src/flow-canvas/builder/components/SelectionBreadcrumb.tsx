import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Layout, Square, Type, Image, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  type: 'section' | 'block' | 'element';
  id: string;
  label: string;
}

interface SelectionBreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (type: string, id: string) => void;
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  section: <Layout size={12} />,
  block: <Square size={12} />,
  element: <MousePointer2 size={12} />,
};

const typeColors: Record<string, string> = {
  section: 'text-[hsl(var(--builder-text-secondary))]',
  block: 'text-[hsl(var(--builder-text-secondary))]',
  element: 'text-[hsl(var(--builder-text))]',
};

export const SelectionBreadcrumb: React.FC<SelectionBreadcrumbProps> = ({
  items,
  onSelect,
  className,
}) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ 
        duration: 0.18, 
        ease: [0.32, 0.72, 0, 1],
      }}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg',
        'bg-[hsl(var(--builder-surface))] backdrop-blur-xl',
        'border border-[hsl(var(--builder-border))]',
        'shadow-xl shadow-black/50',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <React.Fragment key={`${item.type}-${item.id}`}>
            {index > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-[hsl(var(--builder-text-muted))]"
              >
                <ChevronRight size={10} />
              </motion.span>
            )}
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ delay: index * 0.03 }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item.type, item.id);
              }}
              className={cn(
                'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md',
                'text-[11px] font-medium',
                'transition-all duration-150',
                'hover:bg-[hsl(var(--builder-surface-hover))]',
                typeColors[item.type],
                index === items.length - 1 && 'text-[hsl(var(--builder-text))] bg-[hsl(var(--builder-surface-hover))]'
              )}
            >
              <span className="opacity-70">{typeIcons[item.type]}</span>
              <span className="truncate max-w-[80px]">{item.label}</span>
            </motion.button>
          </React.Fragment>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default SelectionBreadcrumb;
