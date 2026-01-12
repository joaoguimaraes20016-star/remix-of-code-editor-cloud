import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  GripVertical,
  Bold,
  Italic,
  Type,
  Sparkles,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { gradientToCSS, GradientEditor, defaultGradient, cloneGradient } from './modals';
import type { GradientValue } from './modals';

// Color presets
const colorPresets = [
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151',
  '#111827', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FCD34D',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F472B6',
];

// Font sizes
const fontSizes = [
  { label: 'S', value: 'sm' },
  { label: 'M', value: 'md' },
  { label: 'L', value: 'lg' },
  { label: 'XL', value: 'xl' },
  { label: '2XL', value: '2xl' },
];

// Display fonts
const displayFonts = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Anton', value: 'Anton' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
];

export interface CompactToolbarStyles {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  backgroundColor?: string;
  fillType?: 'solid' | 'gradient' | 'none';
  gradient?: GradientValue;
}

interface CompactMobileToolbarProps {
  elementId: string;
  elementType: string;
  isSelected: boolean;
  styles?: CompactToolbarStyles;
  onStyleChange?: (styles: Partial<CompactToolbarStyles>) => void;
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  targetRect?: DOMRect | null;
}

export const CompactMobileToolbar: React.FC<CompactMobileToolbarProps> = ({
  elementId,
  elementType,
  isSelected,
  styles = {},
  onStyleChange,
  onAlignChange,
  onDuplicate,
  onDelete,
  targetRect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'main' | 'font' | 'color' | null>(null);

  if (!isSelected || !targetRect) return null;

  const isTextElement = ['heading', 'text'].includes(elementType);
  const showTypography = isTextElement;
  const showAlignment = ['heading', 'text', 'button', 'input'].includes(elementType);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setActivePanel(isExpanded ? null : 'main');
  };

  const btnClass = cn(
    "flex items-center justify-center transition-all duration-150",
    "w-10 h-10 rounded-lg",
    "active:scale-95"
  );
  const btnInactive = "text-[hsl(var(--builder-text-secondary))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))] active:bg-[hsl(var(--builder-surface-hover))]";
  const btnActive = "bg-[hsl(var(--builder-accent))] text-white";

  // Position: centered below the element
  const top = Math.min(targetRect.bottom + 8, window.innerHeight - 200);
  const left = targetRect.left + targetRect.width / 2;

  const portalContainer = document.getElementById('toolbar-portal-root');
  if (!portalContainer) return null;

  // Collapsed: just show 3-dot icon
  const collapsedToolbar = (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      onClick={handleToggle}
      className={cn(
        "flex items-center justify-center",
        "w-10 h-10 rounded-full",
        "bg-[hsl(var(--builder-surface))]/98 backdrop-blur-xl",
        "border border-[hsl(var(--builder-border))]",
        "shadow-lg shadow-black/40",
        "text-[hsl(var(--builder-text-secondary))] hover:text-[hsl(var(--builder-text))]",
        "pointer-events-auto"
      )}
    >
      <MoreHorizontal size={18} />
    </motion.button>
  );

  // Expanded panel
  const expandedPanel = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cn(
        "pointer-events-auto",
        "bg-[hsl(var(--builder-surface))]/98 backdrop-blur-xl",
        "border border-[hsl(var(--builder-border))] rounded-2xl",
        "shadow-xl shadow-black/40",
        "overflow-hidden"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with close */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--builder-border))]">
        <span className="text-xs font-medium text-[hsl(var(--builder-text-muted))] uppercase tracking-wider">
          {elementType}
        </span>
        <button onClick={handleToggle} className="p-1 rounded hover:bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))]">
          <X size={14} />
        </button>
      </div>

      {/* Main actions row */}
      <div className="flex items-center gap-1 p-2">
        {/* Drag handle */}
        <button
          type="button"
          className={cn(btnClass, btnInactive, 'cursor-grab')}
          onPointerDown={(e) => e.stopPropagation()}
          {...((styles as any)?.dragHandleProps?.attributes || {})}
          {...((styles as any)?.dragHandleProps?.listeners || {})}
          aria-label="Drag"
        >
          <GripVertical size={16} />
        </button>

        {/* Typography quick actions */}
        {showTypography && (
          <>
            <button
              onClick={() => {
                const current = styles.fontWeight || 'normal';
                const isBoldLike = current === 'bold' || current === 'black';
                const prev = ((styles as any).__lastNonBoldWeight as string) || 'normal';
                if (!isBoldLike) {
                  onStyleChange?.({ fontWeight: 'bold', __lastNonBoldWeight: current } as any);
                } else {
                  onStyleChange?.({ fontWeight: prev } as any);
                }
              }}
              className={cn(btnClass, (styles.fontWeight === 'bold' || styles.fontWeight === 'black') ? btnActive : btnInactive)}
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => onStyleChange?.({ fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={cn(btnClass, styles.fontStyle === 'italic' ? btnActive : btnInactive)}
            >
              <Italic size={16} />
            </button>
          </>
        )}

        {/* Alignment */}
        {showAlignment && (
          <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--builder-border))]">
            <button
              onClick={() => onAlignChange?.('left')}
              className={cn("p-2", styles.textAlign === 'left' || !styles.textAlign ? btnActive : btnInactive)}
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => onAlignChange?.('center')}
              className={cn("p-2", styles.textAlign === 'center' ? btnActive : btnInactive)}
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => onAlignChange?.('right')}
              className={cn("p-2", styles.textAlign === 'right' ? btnActive : btnInactive)}
            >
              <AlignRight size={14} />
            </button>
          </div>
        )}

        <div className="w-px h-6 bg-[hsl(var(--builder-border))] mx-1" />

        {/* Duplicate & Delete */}
        <button onClick={onDuplicate} className={cn(btnClass, btnInactive)}>
          <Copy size={16} />
        </button>
        <button 
          onClick={onDelete} 
          className={cn(btnClass, "text-white/60 hover:text-red-400 hover:bg-red-500/20")}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Expandable typography/color panels */}
      {showTypography && (
        <div className="px-2 pb-2 space-y-2">
          {/* Font selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <Type size={14} />
                  <span>{styles.fontFamily || 'Inherit'}</span>
                </span>
                <ChevronDown size={14} className="opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1 bg-[hsl(220,13%,12%)] border-white/10">
              {displayFonts.map((font) => (
                <button
                  key={font.value}
                  onClick={() => onStyleChange?.({ fontFamily: font.value })}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left rounded transition-colors",
                    styles.fontFamily === font.value ? btnActive : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  style={{ fontFamily: font.value !== 'inherit' ? font.value : undefined }}
                >
                  {font.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Color row */}
          <div className="flex items-center gap-1">
            <Sparkles size={14} className="text-white/50 mr-1" />
            {colorPresets.slice(0, 8).map((color) => (
              <button
                key={color}
                onClick={() => onStyleChange?.({ textColor: color, textFillType: 'solid' })}
                className={cn(
                  "w-6 h-6 rounded-md border transition-transform hover:scale-110",
                  styles.textColor === color ? 'border-white ring-2 ring-white/30' : 'border-white/20'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return createPortal(
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top,
        left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? expandedPanel : collapsedToolbar}
      </AnimatePresence>
    </div>,
    portalContainer
  );
};

export default CompactMobileToolbar;
