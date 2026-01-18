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
  ChevronDown,
  MoreHorizontal,
  X,
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
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Font sizes - use pixel values for consistency with the right panel slider
const fontSizes = [
  { label: 'S', value: '14px' },
  { label: 'M', value: '16px' },
  { label: 'L', value: '20px' },
  { label: 'XL', value: '24px' },
  { label: '2XL', value: '30px' },
  { label: '3XL', value: '36px' },
  { label: '4XL', value: '48px' },
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
  textGradient?: { type: string; angle?: number; stops: Array<{ color: string; position: number }> };
  textShadow?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fillType?: 'solid' | 'gradient' | 'none';
  gradient?: { type: string; angle?: number; stops: Array<{ color: string; position: number }> };
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
  /** Device mode from builder - controls mobile layout */
  deviceMode?: 'desktop' | 'tablet' | 'mobile';
  /** dnd-kit drag handle props (attributes + listeners) */
  dragHandleProps?: {
    attributes?: Record<string, any>;
    listeners?: Record<string, any>;
  };
}

// Hook to get portal container with proper cleanup
function usePortalContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const createdByUsRef = useRef(false);
  
  useEffect(() => {
    let el = document.getElementById('toolbar-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toolbar-portal-root';
      el.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9999;';
      document.body.appendChild(el);
      createdByUsRef.current = true;
    }
    setContainer(el);
    
    // Cleanup on unmount - only if we created it and no children remain
    return () => {
      if (createdByUsRef.current) {
        const portalEl = document.getElementById('toolbar-portal-root');
        if (portalEl && portalEl.childNodes.length === 0) {
          portalEl.remove();
        }
      }
    };
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
  deviceMode = 'desktop',
  dragHandleProps,
}, ref) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'bottom' });
  const portalContainer = usePortalContainer();
  // Use deviceMode prop instead of window width - this respects the builder's device preview
  const isMobilePreview = deviceMode === 'mobile';
  
  const mergedRef = (node: HTMLDivElement | null) => {
    toolbarRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref && 'current' in ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [colorTab, setColorTab] = useState<'background' | 'text' | 'gradient'>('text');
  const [mobileExpanded, setMobileExpanded] = useState(false);
  
  // Micro-delay before showing toolbar to prevent flickering during quick selections
  const [showDelayed, setShowDelayed] = useState(false);
  
  useEffect(() => {
    if (isSelected) {
      // Reduced delay from 40ms to 15ms for snappier response
      const timer = setTimeout(() => setShowDelayed(true), 15);
      return () => clearTimeout(timer);
    } else {
      // Immediate hide when deselected
      setShowDelayed(false);
    }
  }, [isSelected]);

  // Reset all internal popover/expand states when deselected to prevent "stuck" toolbars
  useEffect(() => {
    if (!isSelected) {
      setMobileExpanded(false);
      setFontOpen(false);
      setColorOpen(false);
    }
  }, [isSelected]);

  // Smart positioning like Framer - with generous breathing room
  useEffect(() => {
    if (!isSelected || !targetRef?.current) return;
    
    const updatePosition = () => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const toolbarHeight = 48; // Slightly taller for breathing room
      const topOffset = 16; // More generous offset from element (like Framer)
      const bottomOffset = 12;
      const viewportPadding = 16;
      const minTopSpace = 80; // Ensure room for section labels + block badges above
      
      let top: number;
      let placement: 'top' | 'bottom' = 'top';
      
      // Check if there's enough room above (accounting for section labels, badges, etc.)
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceAbove >= minTopSpace) {
        // Place above with generous spacing
        top = rect.top - toolbarHeight - topOffset;
        placement = 'top';
      } else if (spaceBelow >= toolbarHeight + bottomOffset + viewportPadding) {
        // Place below if not enough room above
        top = rect.bottom + bottomOffset;
        placement = 'bottom';
      } else {
        // Last resort: place at minimum safe distance from top
        top = Math.max(viewportPadding, rect.top - toolbarHeight - topOffset);
        placement = 'top';
      }
      
      // Ensure never goes above viewport
      top = Math.max(viewportPadding, top);
      
      // Center horizontally with smart edge clamping
      const toolbarWidth = toolbarRef.current?.offsetWidth || 320;
      const halfWidth = toolbarWidth / 2;
      let left = rect.left + rect.width / 2;
      
      // Clamp to viewport edges with padding
      if (left - halfWidth < viewportPadding) {
        left = halfWidth + viewportPadding;
      } else if (left + halfWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - halfWidth - viewportPadding;
      }
      
      setPosition({ top, left, placement });
    };
    
    updatePosition();
    
    // Use requestAnimationFrame for smoother updates
    let rafId: number;
    const throttledUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('scroll', throttledUpdate, true);
    window.addEventListener('resize', throttledUpdate);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', throttledUpdate, true);
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [isSelected, targetRef]);

  // Remember last non-bold weight so toggling bold doesn't nuke presets like 'semibold'
  const lastNonBoldWeightRef = useRef<UnifiedToolbarStyles['fontWeight']>('normal');

  // Element type checks - simplified
  const isTextElement = ['heading', 'text'].includes(elementType);
  const isImageElement = ['image'].includes(elementType);
  const isLayoutElement = ['divider', 'spacer'].includes(elementType);
  const showTypography = isTextElement;
  const showAlignment = ['heading', 'text', 'button'].includes(elementType);
  const showTextColor = isTextElement;
  // Only show color for buttons - images/logos don't need color picker
  const showBackgroundColor = ['button'].includes(elementType);

  // Don't render until micro-delay has passed (prevents flicker)
  if (hidden || !isSelected || !showDelayed) return null;
  
  const handleFontFamilyChange = (fontFamily: string) => {
    onStyleChange?.({ fontFamily });
    setFontOpen(false);
  };

  const handleFontSizeChange = (fontSize: string) => {
    onStyleChange?.({ fontSize });
  };

  const toggleBold = () => {
    const current = styles.fontWeight || 'normal';
    const isBoldLike = current === 'bold' || current === 'black';

    if (!isBoldLike) {
      lastNonBoldWeightRef.current = current;
      onStyleChange?.({ fontWeight: 'bold' });
    } else {
      onStyleChange?.({ fontWeight: lastNonBoldWeightRef.current || 'normal' });
    }
  };

  const toggleItalic = () => {
    onStyleChange?.({ fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic' });
  };

  // Parse current font size - handle both preset names and pixel values
  const getCurrentFontSizeLabel = () => {
    const fs = styles.fontSize;
    if (!fs) return 'M';
    // Check direct pixel match first
    const directMatch = fontSizes.find(f => f.value === fs);
    if (directMatch) return directMatch.label;
    // Parse numeric pixel value to find closest match
    const numericValue = parseInt(fs.replace('px', ''), 10);
    if (!isNaN(numericValue)) {
      // Find closest preset
      const closest = fontSizes.reduce((prev, curr) => {
        const prevVal = parseInt(prev.value.replace('px', ''), 10);
        const currVal = parseInt(curr.value.replace('px', ''), 10);
        return Math.abs(currVal - numericValue) < Math.abs(prevVal - numericValue) ? curr : prev;
      });
      return closest.label;
    }
    // Handle legacy preset names
    const presetMap: Record<string, string> = { 'sm': 'S', 'md': 'M', 'lg': 'L', 'xl': 'XL', '2xl': '2XL', '3xl': '3XL', '4xl': '4XL' };
    return presetMap[fs] || 'M';
  };
  const currentFontSize = getCurrentFontSizeLabel();

  // Framer-style button classes - but fully theme-token driven (guarantees consistent colors)
  const btnClass = cn(
    "flex items-center justify-center transition-all duration-100",
    "min-w-[28px] min-h-[28px] p-1.5 rounded-md",
    "active:scale-95 cursor-pointer"
  );
  // Inactive: always visible on any background
  const btnInactive = "text-builder-text-secondary hover:text-builder-text hover:bg-builder-surface-hover";
  // Active: subtle highlight instead of pink glow
  const btnActive = "bg-builder-surface-hover text-builder-text ring-1 ring-builder-border";

  const toolbarContent = (
    <TooltipProvider delayDuration={300}>
      <motion.div
        ref={mergedRef}
        initial={{ opacity: 0, scale: 0.95, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          'flex items-center px-2 py-1 rounded-xl',
          'bg-builder-surface/95 backdrop-blur-xl',
          'border border-builder-border-subtle/80',
          'shadow-2xl shadow-black/60',
          'pointer-events-auto gap-1'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <button
          type="button"
          className={cn(btnClass, 'text-builder-text-muted hover:text-builder-text cursor-grab active:cursor-grabbing')}
          {...(dragHandleProps?.attributes || {})}
          {...(dragHandleProps?.listeners || {})}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        
        <div className="w-px h-4 bg-builder-border-subtle/80 mx-0.5" />

        {/* Typography Controls - Compact */}
        {showTypography && (
          <>

            {/* Font Size Quick Select */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(btnClass, btnInactive, 'px-2.5 gap-1 min-w-[44px]')}>
                  <span className="text-xs font-semibold">{currentFontSize}</span>
                  <ChevronDown size={10} className="opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-1.5 bg-builder-surface/98 backdrop-blur-xl border-builder-border"
                sideOffset={8}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <div className="flex gap-1">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleFontSizeChange(size.value)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                        styles.fontSize === size.value
                          ? btnActive
                          : "text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover"
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Bold */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={toggleBold} className={cn(btnClass, (styles.fontWeight === 'bold' || styles.fontWeight === 'black') ? btnActive : btnInactive)}>
                  <Bold size={15} strokeWidth={2.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Bold</TooltipContent>
            </Tooltip>

            {/* Italic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={toggleItalic} className={cn(btnClass, styles.fontStyle === 'italic' ? btnActive : btnInactive)}>
                  <Italic size={15} strokeWidth={2.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Italic</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Alignment */}
        {showAlignment && (
          <>
            <div className="w-px h-4 bg-builder-border-subtle/80 mx-0.5" />
            <div className="flex rounded-md overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }}
                    className={cn(btnClass, 'rounded-none', (styles.textAlign === 'left' || !styles.textAlign) ? btnActive : btnInactive)}
                  >
                    <AlignLeft size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Left</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }}
                    className={cn(btnClass, 'rounded-none', styles.textAlign === 'center' ? btnActive : btnInactive)}
                  >
                    <AlignCenter size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Center</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }}
                    className={cn(btnClass, 'rounded-none', styles.textAlign === 'right' ? btnActive : btnInactive)}
                  >
                    <AlignRight size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Right</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}

        <div className="w-px h-4 bg-builder-border-subtle/80 mx-0.5" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className={cn(btnClass, btnInactive)}>
              <Copy size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Duplicate</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className={cn(btnClass, 'text-builder-text-muted hover:text-destructive hover:bg-destructive/15')}
            >
              <Trash2 size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs bg-builder-surface border-builder-border text-builder-text">Delete</TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );

  // Mobile compact 3-dot menu
  const mobileCompactToolbar = (
    <AnimatePresence mode="wait">
      {!mobileExpanded ? (
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          onClick={(e) => { e.stopPropagation(); setMobileExpanded(true); }}
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-builder-surface/95 backdrop-blur-xl",
            "border border-builder-border-subtle/80",
            "shadow-2xl shadow-black/60",
            "text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-hover",
            "pointer-events-auto",
            "transition-all duration-150 cursor-pointer"
          )}
        >
          <MoreHorizontal size={16} strokeWidth={2.5} />
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className={cn(
            'flex items-center px-1.5 py-1 rounded-full',
            'bg-builder-surface/95 backdrop-blur-xl',
            'border border-builder-border-subtle/80',
            'shadow-2xl shadow-black/60',
            'pointer-events-auto',
            'gap-0.5'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMobileExpanded(false); }}
            className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px]', btnInactive)}
          >
            <X size={14} />
          </button>

          {/* Drag handle */}
          <button
            type="button"
            className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px]', 'text-builder-text-muted hover:text-builder-text cursor-grab active:cursor-grabbing')}
            {...(dragHandleProps?.attributes || {})}
            {...(dragHandleProps?.listeners || {})}
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>

          {showTypography && (
            <>
              <button
                onClick={toggleBold}
                className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px]', (styles.fontWeight === 'bold' || styles.fontWeight === 'black') ? btnActive : btnInactive)}
              >
                <Bold size={14} />
              </button>
              <button
                onClick={toggleItalic}
                className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px]', styles.fontStyle === 'italic' ? btnActive : btnInactive)}
              >
                <Italic size={14} />
              </button>
            </>
          )}

          {showAlignment && (
            <div className="flex rounded-md overflow-hidden">
              <button
                onClick={() => onAlignChange?.('left')}
                className={cn(btnClass, 'w-7 h-8 min-w-[28px] rounded-none', (styles.textAlign === 'left' || !styles.textAlign) ? btnActive : btnInactive)}
              >
                <AlignLeft size={12} />
              </button>
              <button
                onClick={() => onAlignChange?.('center')}
                className={cn(btnClass, 'w-7 h-8 min-w-[28px] rounded-none', styles.textAlign === 'center' ? btnActive : btnInactive)}
              >
                <AlignCenter size={12} />
              </button>
              <button
                onClick={() => onAlignChange?.('right')}
                className={cn(btnClass, 'w-7 h-8 min-w-[28px] rounded-none', styles.textAlign === 'right' ? btnActive : btnInactive)}
              >
                <AlignRight size={12} />
              </button>
            </div>
          )}

          <div className="w-px h-5 bg-builder-border-subtle/80" />

          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
            className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px]', btnInactive)}
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className={cn(btnClass, 'w-8 h-8 min-w-[32px] min-h-[32px] text-builder-text-muted hover:text-destructive hover:bg-destructive/15')}
          >
            <Trash2 size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // If we have portal container and valid position, use portal
  if (portalContainer) {
    // If we have targetRef with valid position, use calculated position
    const hasValidPosition = targetRef?.current && (position.top > 0 || position.left > 0);
    
    if (hasValidPosition) {
      return createPortal(
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <div className="pointer-events-auto">
            {isMobilePreview ? mobileCompactToolbar : toolbarContent}
          </div>
        </div>,
        portalContainer
      );
    }
  }

  // Fallback: render inline relative to parent (always works)
  return (
    <div
      className="absolute z-[60] -top-12 left-1/2 -translate-x-1/2"
      style={{ pointerEvents: 'auto' }}
    >
      {isMobilePreview ? mobileCompactToolbar : toolbarContent}
    </div>
  );
});

UnifiedElementToolbar.displayName = 'UnifiedElementToolbar';
