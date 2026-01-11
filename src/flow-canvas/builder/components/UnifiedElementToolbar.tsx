import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  GripVertical,
  Bold,
  Italic,
  Type,
  Palette,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { gradientToCSS, GradientEditor, defaultGradient, cloneGradient } from './modals';
import type { GradientValue } from './modals';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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
  { label: '3XL', value: '3xl' },
  { label: '4XL', value: '4xl' },
  { label: '5XL', value: '5xl' },
];

// Display fonts
const displayFonts = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Oswald', value: 'Oswald', isDisplay: true },
  { label: 'Anton', value: 'Anton', isDisplay: true },
  { label: 'Bebas Neue', value: 'Bebas Neue', isDisplay: true },
  { label: 'Archivo Black', value: 'Archivo Black', isDisplay: true },
  { label: 'Space Grotesk', value: 'Space Grotesk', isDisplay: true },
  { label: 'Syne', value: 'Syne', isDisplay: true },
  { label: 'Inter', value: 'Inter' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Playfair', value: 'Playfair Display' },
];

export interface UnifiedToolbarStyles {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  textOpacity?: number;
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  textShadow?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fillType?: 'solid' | 'gradient' | 'none';
  gradient?: GradientValue;
}

interface UnifiedElementToolbarProps {
  elementId: string;
  elementType: string;
  elementLabel?: string;
  isSelected: boolean;
  styles?: UnifiedToolbarStyles;
  onStyleChange?: (styles: Partial<UnifiedToolbarStyles>) => void;
  onAlignChange?: (align: 'left' | 'center' | 'right') => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  hidden?: boolean;
  /** Target element ref for portal positioning */
  targetRef?: React.RefObject<HTMLElement>;
}

// Hook to get portal container
function usePortalContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    let el = document.getElementById('toolbar-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toolbar-portal-root';
      el.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9999;';
      document.body.appendChild(el);
    }
    setContainer(el);
  }, []);
  
  return container;
}

// Hook to check if mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
}

export const UnifiedElementToolbar = forwardRef<HTMLDivElement, UnifiedElementToolbarProps>(({
  elementId,
  elementType,
  isSelected,
  styles = {},
  onStyleChange,
  onAlignChange,
  onDuplicate,
  onDelete,
  hidden = false,
  targetRef,
}, ref) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'bottom' });
  const portalContainer = usePortalContainer();
  const isMobile = useIsMobile();
  
  const mergedRef = (node: HTMLDivElement | null) => {
    toolbarRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref && 'current' in ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [colorTab, setColorTab] = useState<'background' | 'text' | 'gradient'>('text');

  // Calculate position when selected
  useEffect(() => {
    if (!isSelected || !targetRef?.current) return;
    
    const updatePosition = () => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const toolbarHeight = 44;
      const offset = 8;
      const padding = 12;
      
      let top = rect.top - toolbarHeight - offset;
      let placement: 'top' | 'bottom' = 'top';
      
      // If would go above viewport, place below
      if (top < padding) {
        top = rect.bottom + offset;
        placement = 'bottom';
      }
      
      // Center horizontally, clamped to viewport
      let left = rect.left + rect.width / 2;
      const toolbarWidth = toolbarRef.current?.offsetWidth || 280;
      const halfWidth = toolbarWidth / 2;
      
      if (left - halfWidth < padding) {
        left = halfWidth + padding;
      } else if (left + halfWidth > window.innerWidth - padding) {
        left = window.innerWidth - halfWidth - padding;
      }
      
      setPosition({ top, left, placement });
    };
    
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isSelected, targetRef]);

  // Element type checks
  const isTextElement = ['heading', 'text'].includes(elementType);
  const isLayoutElement = ['divider', 'spacer'].includes(elementType);
  const showTypography = isTextElement;
  const showAlignment = ['heading', 'text', 'button', 'input', 'select', 'checkbox', 'radio'].includes(elementType);
  const showTextColor = isTextElement;
  const showBackgroundColor = !isLayoutElement;

  if (hidden || !isSelected) return null;
  
  const handleFontFamilyChange = (fontFamily: string) => {
    onStyleChange?.({ fontFamily });
    setFontOpen(false);
  };

  const handleFontSizeChange = (fontSize: string) => {
    onStyleChange?.({ fontSize });
  };

  const toggleBold = () => {
    const newWeight = styles.fontWeight === 'bold' ? 'normal' : 'bold';
    onStyleChange?.({ fontWeight: newWeight });
  };

  const toggleItalic = () => {
    onStyleChange?.({ fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic' });
  };

  const handleTextColorChange = (color: string) => {
    onStyleChange?.({ textColor: color, textFillType: 'solid' });
  };

  const handleTextGradientChange = (gradient: GradientValue) => {
    onStyleChange?.({ textGradient: cloneGradient(gradient), textFillType: 'gradient' });
  };

  const handleBackgroundColorChange = (color: string) => {
    onStyleChange?.({ backgroundColor: color, fillType: 'solid' });
  };

  const handleBackgroundGradientChange = (gradient: GradientValue) => {
    onStyleChange?.({ gradient: cloneGradient(gradient), fillType: 'gradient' });
  };

  const handleBackgroundFillTypeChange = (fillType: 'solid' | 'gradient' | 'none') => {
    if (fillType === 'none') {
      onStyleChange?.({ fillType: 'none', backgroundColor: undefined, gradient: undefined });
    } else if (fillType === 'gradient') {
      const gradient = styles.gradient || defaultGradient;
      onStyleChange?.({ fillType: 'gradient', gradient: cloneGradient(gradient) });
    } else {
      const color = styles.backgroundColor || '#8B5CF6';
      onStyleChange?.({ fillType: 'solid', backgroundColor: color });
    }
  };

  const handleClearBackground = () => {
    onStyleChange?.({ fillType: 'none', backgroundColor: undefined, gradient: undefined, backgroundOpacity: undefined });
  };

  const currentFont = displayFonts.find(f => f.value === styles.fontFamily)?.label || 'Inherit';
  const currentFontSize = fontSizes.find(f => f.value === styles.fontSize)?.label || 'M';
  const isTextGradient = styles.textFillType === 'gradient';
  const isBgGradient = styles.fillType === 'gradient';
  const isBgNone = styles.fillType === 'none' || (!styles.backgroundColor && !styles.gradient && styles.fillType !== 'solid' && styles.fillType !== 'gradient');

  // Touch-friendly button classes (min 44px tap target)
  const btnClass = "min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] p-2 sm:p-1.5 rounded-lg sm:rounded-md transition-colors flex items-center justify-center";
  const btnInactive = "text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10 active:bg-white/20";
  const btnActive = "bg-[hsl(var(--builder-accent))] text-white";

  const toolbarContent = (
    <TooltipProvider delayDuration={500}>
      <motion.div
        ref={mergedRef}
        initial={{ opacity: 0, scale: 0.95, y: position.placement === 'top' ? 4 : -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={cn(
          'flex items-center gap-0.5 px-1.5 py-1 rounded-xl',
          'bg-[hsl(220,13%,12%)] border border-white/10',
          'shadow-xl shadow-black/50',
          'pointer-events-auto',
          // Mobile: full width at bottom
          isMobile && 'w-full flex-wrap justify-center gap-1'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(btnClass, btnInactive, 'cursor-grab active:cursor-grabbing')}>
              <GripVertical size={16} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Drag to reorder</TooltipContent>
        </Tooltip>

        {/* Typography Controls */}
        {showTypography && (
          <>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />

            {/* Font Family */}
            <Popover open={fontOpen} onOpenChange={setFontOpen}>
              <PopoverTrigger asChild>
                <button className={cn(btnClass, btnInactive, 'gap-1 px-2')}>
                  <Type size={16} />
                  <span className="text-xs font-medium max-w-[60px] truncate hidden sm:inline">{currentFont}</span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-44 p-1 bg-[hsl(220,13%,12%)] border-white/10 max-h-[280px] overflow-y-auto"
                sideOffset={8}
              >
                {displayFonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontFamilyChange(font.value)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left rounded-lg transition-colors flex items-center justify-between",
                      styles.fontFamily === font.value 
                        ? btnActive
                        : 'text-[hsl(var(--builder-text-muted))] hover:text-white hover:bg-white/10'
                    )}
                    style={{ fontFamily: font.value !== 'inherit' ? font.value : undefined }}
                  >
                    <span>{font.label}</span>
                    {font.isDisplay && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">Display</span>
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Font Size */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(btnClass, btnInactive, 'gap-0.5 px-2')}>
                  <span className="text-sm font-bold">{currentFontSize}</span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1 bg-[hsl(220,13%,12%)] border-white/10" sideOffset={8}>
                <div className="flex gap-0.5">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleFontSizeChange(size.value)}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        styles.fontSize === size.value ? btnActive : 'text-[hsl(var(--builder-text-muted))] hover:text-white hover:bg-white/10'
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-white/10 hidden sm:block" />

            {/* Bold */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={toggleBold} className={cn(btnClass, styles.fontWeight === 'bold' ? btnActive : btnInactive)}>
                  <Bold size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Bold</TooltipContent>
            </Tooltip>

            {/* Italic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={toggleItalic} className={cn(btnClass, styles.fontStyle === 'italic' ? btnActive : btnInactive)}>
                  <Italic size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Italic</TooltipContent>
            </Tooltip>

            {/* Color */}
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <button className={cn(btnClass, btnInactive, 'relative')}>
                  <Sparkles size={16} />
                  <div 
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                    style={{ 
                      background: isTextGradient && styles.textGradient 
                        ? gradientToCSS(styles.textGradient) 
                        : (styles.textColor || '#FFFFFF')
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-[hsl(220,13%,12%)] border-white/10" sideOffset={8}>
                <div className="space-y-3">
                  {/* Tabs */}
                  <div className="flex rounded-lg overflow-hidden border border-white/10">
                    {showBackgroundColor && (
                      <button
                        onClick={() => setColorTab('background')}
                        className={cn("flex-1 py-2 text-xs font-medium", colorTab === 'background' ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                      >Fill</button>
                    )}
                    {showTextColor && (
                      <button
                        onClick={() => setColorTab('text')}
                        className={cn("flex-1 py-2 text-xs font-medium", colorTab === 'text' ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                      >Text</button>
                    )}
                    {showTextColor && (
                      <button
                        onClick={() => setColorTab('gradient')}
                        className={cn("flex-1 py-2 text-xs font-medium", colorTab === 'gradient' ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                      >Gradient</button>
                    )}
                  </div>

                  {/* Text Color */}
                  {colorTab === 'text' && showTextColor && (
                    <div className="grid grid-cols-8 gap-1.5">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleTextColorChange(color)}
                          className={cn(
                            "w-6 h-6 rounded-lg border transition-all",
                            styles.textColor === color 
                              ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-2 ring-offset-[hsl(220,13%,12%)]' 
                              : 'border-white/10 hover:scale-110'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Background */}
                  {colorTab === 'background' && showBackgroundColor && (
                    <div className="space-y-2">
                      <div className="flex rounded-lg overflow-hidden border border-white/10">
                        <button onClick={handleClearBackground} className={cn("flex-1 py-1.5 text-xs", isBgNone ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>None</button>
                        <button onClick={() => handleBackgroundFillTypeChange('solid')} className={cn("flex-1 py-1.5 text-xs", !isBgNone && !isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>Solid</button>
                        <button onClick={() => handleBackgroundFillTypeChange('gradient')} className={cn("flex-1 py-1.5 text-xs", isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>Gradient</button>
                      </div>
                      {!isBgNone && !isBgGradient && (
                        <div className="grid grid-cols-8 gap-1.5">
                          {colorPresets.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleBackgroundColorChange(color)}
                              className={cn(
                                "w-6 h-6 rounded-lg border transition-all",
                                styles.backgroundColor === color 
                                  ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-2 ring-offset-[hsl(220,13%,12%)]' 
                                  : 'border-white/10 hover:scale-110'
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                      {isBgGradient && (
                        <GradientEditor value={styles.gradient || defaultGradient} onChange={handleBackgroundGradientChange} compact />
                      )}
                    </div>
                  )}

                  {/* Gradient */}
                  {colorTab === 'gradient' && showTextColor && (
                    <GradientEditor
                      value={styles.textGradient || defaultGradient}
                      onChange={(gradient) => {
                        handleTextGradientChange(gradient);
                        onStyleChange?.({ textFillType: 'gradient' });
                      }}
                      compact
                    />
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Non-text elements color */}
        {!showTypography && showBackgroundColor && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <button className={cn(btnClass, btnInactive)}>
                  <Palette size={16} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-[hsl(220,13%,12%)] border-white/10" sideOffset={8}>
                <div className="space-y-2">
                  <div className="flex rounded-lg overflow-hidden border border-white/10">
                    <button onClick={handleClearBackground} className={cn("flex-1 py-1.5 text-xs", isBgNone ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>None</button>
                    <button onClick={() => handleBackgroundFillTypeChange('solid')} className={cn("flex-1 py-1.5 text-xs", !isBgNone && !isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>Solid</button>
                    <button onClick={() => handleBackgroundFillTypeChange('gradient')} className={cn("flex-1 py-1.5 text-xs", isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}>Gradient</button>
                  </div>
                  {!isBgNone && !isBgGradient && (
                    <div className="grid grid-cols-8 gap-1.5">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleBackgroundColorChange(color)}
                          className={cn("w-6 h-6 rounded-lg border transition-all", styles.backgroundColor === color ? 'ring-2 ring-[hsl(var(--builder-accent))]' : 'border-white/10 hover:scale-110')}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                  {isBgGradient && <GradientEditor value={styles.gradient || defaultGradient} onChange={handleBackgroundGradientChange} compact />}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Alignment */}
        {showAlignment && (
          <>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex">
              <button
                onClick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }}
                className={cn(btnClass, 'rounded-r-none', (styles.textAlign === 'left' || !styles.textAlign) ? btnActive : btnInactive)}
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }}
                className={cn(btnClass, 'rounded-none', styles.textAlign === 'center' ? btnActive : btnInactive)}
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }}
                className={cn(btnClass, 'rounded-l-none', styles.textAlign === 'right' ? btnActive : btnInactive)}
              >
                <AlignRight size={16} />
              </button>
            </div>
          </>
        )}

        <div className="w-px h-6 bg-white/10" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className={cn(btnClass, btnInactive)}>
              <Copy size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Duplicate</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className={cn(btnClass, 'text-[hsl(var(--builder-text-muted))] hover:text-red-400 hover:bg-red-500/20')}
            >
              <Trash2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Delete</TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );

  // On mobile, render at bottom of screen
  if (isMobile && portalContainer) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-0 left-0 right-0 p-2 pointer-events-auto safe-area-bottom bg-[hsl(220,13%,8%)] border-t border-white/10"
        >
          {toolbarContent}
        </motion.div>
      </AnimatePresence>,
      portalContainer
    );
  }

  // Desktop: use portal with calculated position
  if (portalContainer && targetRef?.current) {
    return createPortal(
      <AnimatePresence>
        <div
          className="pointer-events-auto"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          {toolbarContent}
        </div>
      </AnimatePresence>,
      portalContainer
    );
  }

  // Fallback: render inline (legacy behavior)
  return (
    <AnimatePresence>
      <div
        className="absolute z-[60] -top-12 left-1/2 -translate-x-1/2"
        style={{ pointerEvents: 'auto' }}
      >
        {toolbarContent}
      </div>
    </AnimatePresence>
  );
});

UnifiedElementToolbar.displayName = 'UnifiedElementToolbar';
