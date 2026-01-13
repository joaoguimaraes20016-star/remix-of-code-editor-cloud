import React, { useState, forwardRef, useImperativeHandle, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette,
  Sparkles,
  ChevronDown,
  Pipette,
  GripVertical
} from 'lucide-react';
import { TextStyles } from './InlineTextEditor';
import type { FormatState, TriState } from '../utils/selectionFormat';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { gradientToCSS, GradientEditor, defaultGradient, cloneGradient } from './modals';
import type { GradientValue } from './modals';
import { cn } from '@/lib/utils';
import { normalizeColorForColorInput } from '../utils/color';

// Color presets - dark theme friendly
const colorPresets = [
  '#FFFFFF', '#F9FAFB', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151',
  '#111827', '#000000', '#EF4444', '#F97316', '#F59E0B', '#FCD34D',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F472B6',
];

interface RichTextToolbarProps {
  styles: Partial<TextStyles>;
  /** Tri-state formatting for current selection (bold/italic/underline). */
  formatState?: FormatState;
  onChange: (styles: Partial<TextStyles>) => void;
  position: { top: number; left: number };
  onClose: () => void;
}

// Extended font sizes for hero headlines
const fontSizes = [
  { label: 'S', value: 'sm' as const },
  { label: 'M', value: 'md' as const },
  { label: 'L', value: 'lg' as const },
  { label: 'XL', value: 'xl' as const },
  { label: '2XL', value: '2xl' as const },
  { label: '3XL', value: '3xl' as const },
  { label: '4XL', value: '4xl' as const },
  { label: '5XL', value: '5xl' as const },
];

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

const textShadowPresets = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Strong', value: 'strong' },
  { label: 'Glow', value: 'glow' },
  { label: 'Neon', value: 'neon' },
  { label: '3D', value: 'depth' },
];

export const RichTextToolbar = forwardRef<HTMLDivElement, RichTextToolbarProps>(({
  styles,
  formatState,
  onChange,
  position,
  onClose,
}, ref) => {
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);

  // Local UI state so the gradient/color editors work even when we apply styles inline (selection spans)
  // (Inline styling doesn't always update the block-level `styles`, so we can't rely on props here.)
  // IMPORTANT: Do NOT default to white when no color is provided - use the actual style value
  const [localColor, setLocalColor] = useState<string>(() =>
    normalizeColorForColorInput(styles.textColor, styles.textColor || '#000000')
  );
  const [localGradient, setLocalGradient] = useState<GradientValue>(() =>
    cloneGradient(styles.textGradient || defaultGradient)
  );

  // Track if user is actively dragging sliders to prevent external sync overriding local state
  const isDraggingRef = useRef(false);
  const dragDebounceRef = useRef<number | null>(null);

  // Manual outside-dismiss for the color/gradient popover:
  // - never closes during slider drags
  // - always closes when clicking the canvas/outside
  const colorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const colorContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!colorOpen) return;

    const onPointerDownCapture = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      if (colorContentRef.current?.contains(target)) return;
      if (colorTriggerRef.current?.contains(target)) return;

      // Allow interaction with nested Radix portals (Select, etc.) without closing.
      if (
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-popover-content]') ||
        target.closest('[data-radix-select-content]')
      ) {
        return;
      }

      setColorOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [colorOpen]);
  
  // Use ref for comparison to prevent sync loops
  const prevGradientRef = useRef<string>(JSON.stringify(styles.textGradient || defaultGradient));
  const prevFillTypeRef = useRef<string | undefined>(styles.textFillType);

  // Sync BOTH color and gradient when textFillType or values change externally
  // This ensures clicking different text elements shows correct state
  useEffect(() => {
    // Skip sync while user is actively dragging
    if (isDraggingRef.current) return;
    
    const fillTypeChanged = styles.textFillType !== prevFillTypeRef.current;
    prevFillTypeRef.current = styles.textFillType;
    
    // Sync color - always keep in sync for solid mode indicator
    const normalized = normalizeColorForColorInput(styles.textColor, styles.textColor || '#000000');
    setLocalColor((prev) => (prev === normalized ? prev : normalized));
    
    // Sync gradient
    const next = styles.textGradient || defaultGradient;
    const nextStr = JSON.stringify(next);
    
    // Only sync if the external value actually changed OR fill type changed
    if (nextStr !== prevGradientRef.current || fillTypeChanged) {
      prevGradientRef.current = nextStr;
      setLocalGradient(cloneGradient(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.textColor, styles.textGradient, styles.textFillType]);
  
  // Drag state for repositioning toolbar
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const internalRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

  const [measured, setMeasured] = useState({ width: 360, height: 44 });

  useLayoutEffect(() => {
    const el = internalRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = () => setMeasured({ width: el.offsetWidth || 360, height: el.offsetHeight || 44 });
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  
  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }, [dragOffset]);
  
  useLayoutEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setDragOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleFontSizeChange = (size: TextStyles['fontSize']) => {
    onChange({ fontSize: size });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    onChange({ fontFamily });
    setFontOpen(false);
  };

  const resolveTriState = (fallbackOn: boolean, tri?: TriState): TriState => {
    return tri ?? (fallbackOn ? 'on' : 'off');
  };

  const boldState = resolveTriState(styles.fontWeight === 'bold', formatState?.bold);
  const italicState = resolveTriState(styles.fontStyle === 'italic', formatState?.italic);
  const underlineState = resolveTriState(styles.textDecoration === 'underline', formatState?.underline);

  const toggleBold = () => {
    // True toggle:
    // on -> off, off/mixed -> on
    const next = boldState === 'on' ? 'normal' : 'bold';
    onChange({ fontWeight: next });
  };

  const toggleItalic = () => {
    const next = italicState === 'on' ? 'normal' : 'italic';
    onChange({ fontStyle: next });
  };

  const toggleUnderline = () => {
    const next = underlineState === 'on' ? 'none' : 'underline';
    onChange({ textDecoration: next });
  };

  const setAlignment = (align: TextStyles['textAlign']) => {
    onChange({ textAlign: align });
  };

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    // Ensure we have a solid color to fall back to
    onChange({
      textColor: color,
      textFillType: 'solid',
    });
  };

  const handleGradientChange = (gradient: GradientValue) => {
    const cloned = cloneGradient(gradient);
    setLocalGradient(cloned);
    // Update ref so we don't re-sync our own change
    prevGradientRef.current = JSON.stringify(cloned);
    
    // Mark as dragging to prevent external sync from overriding during slider drag
    isDraggingRef.current = true;
    if (dragDebounceRef.current) window.clearTimeout(dragDebounceRef.current);
    dragDebounceRef.current = window.setTimeout(() => {
      isDraggingRef.current = false;
    }, 300);
    
    // Always clone to prevent shared references
    onChange({
      textGradient: cloneGradient(cloned),
      textFillType: 'gradient',
    });
  };
  
  // Handle fill type toggle - ensure both values are set atomically
  const handleFillTypeChange = (fillType: 'solid' | 'gradient') => {
    if (fillType === 'gradient') {
      // Ensure gradient exists when switching to gradient mode
      const gradient = styles.textGradient || localGradient || defaultGradient;
      const cloned = cloneGradient(gradient);
      setLocalGradient(cloned);
      prevGradientRef.current = JSON.stringify(cloned);
      onChange({
        textFillType: 'gradient',
        textGradient: cloneGradient(cloned),
      });
      return;
    }

    // Solid
    const color = normalizeColorForColorInput(styles.textColor, localColor || '#FFFFFF');
    setLocalColor(color);
    onChange({
      textFillType: 'solid',
      textColor: color,
    });
  };

  const handleShadowChange = (shadow: string) => {
    onChange({ textShadow: shadow });
    setShadowOpen(false);
  };

  // Handle eyedropper
  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
        const result = await eyeDropper.open();
        handleColorChange(result.sRGBHex);
      } catch (e) {
        // User cancelled
      }
    }
  };

  // Clamp position to viewport bounds using measured toolbar size (prevents "jumping")
  const viewportPadding = 12;
  const halfWidth = measured.width / 2;

  const clampedLeft = Math.max(
    halfWidth + viewportPadding,
    Math.min(position.left + dragOffset.x, window.innerWidth - halfWidth - viewportPadding)
  );

  const clampedTop = Math.max(
    viewportPadding,
    Math.min(position.top + dragOffset.y, window.innerHeight - measured.height - viewportPadding)
  );

  const currentFont = displayFonts.find(f => f.value === styles.fontFamily)?.label || 'Inherit';
  const isGradientFill = styles.textFillType === 'gradient';

  return (
    <div 
      ref={internalRef}
      className={cn(
        "rich-text-toolbar fixed z-50 flex items-center gap-0.5 p-1.5 rounded-xl bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] shadow-2xl",
        !isDragging && "animate-in"
      )}
      style={{
        top: clampedTop,
        left: clampedLeft,
        transform: 'translateX(-50%)',
        cursor: isDragging ? 'grabbing' : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      {/* Drag Handle */}
      <button
        onMouseDown={handleDragStart}
        className="p-1 rounded-lg cursor-grab active:cursor-grabbing text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))] transition-colors"
        title="Drag to reposition"
      >
        <GripVertical size={14} />
      </button>
      
      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />
      {/* Font Family Selector */}
      <Popover open={fontOpen} onOpenChange={setFontOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] min-w-[80px] transition-colors">
            <Type size={14} />
            <span className="text-xs font-medium truncate max-w-[60px]">{currentFont}</span>
            <ChevronDown size={12} className="text-[hsl(var(--builder-text-secondary))]" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-44 p-1 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] max-h-[280px] overflow-y-auto"
          sideOffset={4}
        >
          <div className="flex flex-col">
            {displayFonts.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontFamilyChange(font.value)}
                className={cn(
                  "px-2.5 py-2 text-xs text-left rounded transition-colors flex items-center justify-between",
                  styles.fontFamily === font.value 
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))]'
                )}
                style={{ fontFamily: font.value !== 'inherit' ? font.value : undefined }}
              >
                <span>{font.label}</span>
                {font.isDisplay && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-[hsl(var(--builder-accent-muted))] text-[hsl(var(--builder-text))]">Display</span>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />

      {/* Font Size Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors">
            <span className="text-xs font-bold">{fontSizes.find(f => f.value === styles.fontSize)?.label || 'M'}</span>
            <ChevronDown size={12} className="text-[hsl(var(--builder-text-secondary))]" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-1 bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] shadow-xl"
          sideOffset={4}
        >
          <div className="flex gap-0.5">
            {fontSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => handleFontSizeChange(size.value)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium rounded transition-colors",
                  styles.fontSize === size.value 
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))]'
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />

      {/* Bold */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleBold();
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          boldState === 'on'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : boldState === 'mixed'
              ? 'bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] ring-1 ring-[hsl(var(--builder-accent))]'
              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )
        }
        title="Bold (Cmd+B)"
      >
        <Bold size={14} />
      </button>

      {/* Italic */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleItalic();
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          italicState === 'on'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : italicState === 'mixed'
              ? 'bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] ring-1 ring-[hsl(var(--builder-accent))]'
              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )
        }
        title="Italic (Cmd+I)"
      >
        <Italic size={14} />
      </button>

      {/* Underline */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleUnderline();
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          underlineState === 'on'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : underlineState === 'mixed'
              ? 'bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] ring-1 ring-[hsl(var(--builder-accent))]'
              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )
        }
        title="Underline (Cmd+U)"
      >
        <Underline size={14} />
      </button>

      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />

      {/* Text Color / Gradient - Inline Tab UI (no nested popovers) */}
      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <button 
            ref={colorTriggerRef}
            // Prevent selection collapse when clicking to open the color popover
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-1 p-1.5 rounded-lg bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors"
            title="Text Color"
          >
            <div className="relative">
              <Palette size={14} />
              {/* Color/gradient indicator bar - prominent, above icon bottom */}
              <div 
                className="absolute -bottom-0.5 left-0 right-0 h-1.5 rounded-full shadow-sm ring-1 ring-black/20"
                style={{ 
                  background: isGradientFill
                    ? gradientToCSS(localGradient)
                    : localColor
                }}
              />
              {/* Extra glow for gradient mode */}
              {isGradientFill && (
                <div 
                  className="absolute -bottom-1 left-0 right-0 h-2 rounded-full blur-sm opacity-50"
                  style={{ background: gradientToCSS(localGradient) }}
                />
              )}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          ref={colorContentRef}
          className="w-64 p-3 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // We manage outside-dismiss ourselves (document pointerdown); prevent Radix auto-dismiss.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          // Stop propagation so canvas/global handlers don't receive inside-popover events
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            {/* Fill Type Toggle - uses atomic handler to set both type and value */}
            <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--builder-border))]">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFillTypeChange('solid')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium transition-colors",
                  !isGradientFill 
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                )}
              >
                Solid
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFillTypeChange('gradient')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium transition-colors",
                  isGradientFill 
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                )}
              >
                Gradient
              </button>
            </div>

            {/* Solid Color Section - INLINE (no nested popover) */}
            {!isGradientFill && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--builder-text-muted))]">Color</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={localColor}
                      onMouseDown={(e) => e.preventDefault()}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                    {'EyeDropper' in window && (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleEyedropper}
                        className="p-1.5 rounded bg-[hsl(var(--builder-surface-active))] hover:bg-[hsl(var(--builder-accent)/0.2)] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] transition-colors"
                        title="Pick color from screen"
                      >
                        <Pipette size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleColorChange(color)}
                      className={cn(
                        "w-6 h-6 rounded border transition-all",
                        localColor === color
                          ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-1'
                          : 'border-[hsl(var(--builder-border))] hover:scale-110'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Section - Full Editor */}
              {isGradientFill && (
                <GradientEditor
                  value={localGradient}
                  onChange={handleGradientChange}
                  compact
                />
              )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Text Shadow */}
      <Popover open={shadowOpen} onOpenChange={setShadowOpen}>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              styles.textShadow && styles.textShadow !== 'none'
                ? 'bg-[hsl(var(--builder-accent))] text-white' 
                : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
            )}
            title="Text Shadow"
          >
            <Sparkles size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-32 p-1 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
          sideOffset={4}
        >
          <div className="flex flex-col">
            {textShadowPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleShadowChange(preset.value)}
                className={cn(
                  "px-2.5 py-1.5 text-xs text-left rounded transition-colors",
                  styles.textShadow === preset.value 
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))]'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />

      {/* Alignment */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAlignment('left');
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.textAlign === 'left'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Align Left"
      >
        <AlignLeft size={14} />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAlignment('center');
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.textAlign === 'center'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Align Center"
      >
        <AlignCenter size={14} />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAlignment('right');
        }}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.textAlign === 'right'
            ? 'bg-[hsl(var(--builder-accent))] text-white'
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Align Right"
      >
        <AlignRight size={14} />
      </button>
    </div>
  );
});

RichTextToolbar.displayName = 'RichTextToolbar';
