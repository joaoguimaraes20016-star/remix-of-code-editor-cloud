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
  styles: TextStyles;
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
  onChange,
  position,
  onClose,
}, ref) => {
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);

  // Local UI state so the gradient/color editors work even when we apply styles inline (selection spans)
  // (Inline styling doesn't always update the block-level `styles`, so we can't rely on props here.)
  const [localColor, setLocalColor] = useState<string>(() =>
    normalizeColorForColorInput(styles.textColor, '#FFFFFF')
  );
  const [localGradient, setLocalGradient] = useState<GradientValue>(() =>
    cloneGradient(styles.textGradient || defaultGradient)
  );

  // Keep local state in sync when block-level styles change externally
  useEffect(() => {
    if (!styles.textColor) return;
    const normalized = normalizeColorForColorInput(styles.textColor, localColor);
    setLocalColor((prev) => (prev === normalized ? prev : normalized));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles.textColor]);

  // Use ref for comparison to prevent sync loops
  const prevGradientRef = useRef<string>(JSON.stringify(styles.textGradient || defaultGradient));
  
  useEffect(() => {
    const next = styles.textGradient || defaultGradient;
    const nextStr = JSON.stringify(next);
    
    // Only sync if the external value actually changed (not our own update)
    if (nextStr !== prevGradientRef.current) {
      prevGradientRef.current = nextStr;
      setLocalGradient(cloneGradient(next));
    }
  }, [styles.textGradient]);
  
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

  const toggleBold = () => {
    const newWeight = styles.fontWeight === 'bold' ? 'normal' : 'bold';
    onChange({ fontWeight: newWeight });
  };

  const toggleItalic = () => {
    onChange({ fontStyle: styles.fontStyle === 'italic' ? 'normal' : 'italic' });
  };

  const toggleUnderline = () => {
    onChange({ textDecoration: styles.textDecoration === 'underline' ? 'none' : 'underline' });
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
          className="w-auto p-1 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
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
        onClick={toggleBold}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.fontWeight === 'bold' 
            ? 'bg-[hsl(var(--builder-accent))] text-white' 
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Bold (Cmd+B)"
      >
        <Bold size={14} />
      </button>

      {/* Italic */}
      <button
        onClick={toggleItalic}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.fontStyle === 'italic' 
            ? 'bg-[hsl(var(--builder-accent))] text-white' 
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Italic (Cmd+I)"
      >
        <Italic size={14} />
      </button>

      {/* Underline */}
      <button
        onClick={toggleUnderline}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          styles.textDecoration === 'underline' 
            ? 'bg-[hsl(var(--builder-accent))] text-white' 
            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text))] opacity-80 hover:opacity-100 hover:bg-[hsl(var(--builder-surface-active))]'
        )}
        title="Underline (Cmd+U)"
      >
        <Underline size={14} />
      </button>

      <div className="w-px h-5 bg-[hsl(var(--builder-border))] mx-0.5" />

      {/* Text Color / Gradient - Inline Tab UI (no nested popovers) */}
      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <button 
            className="flex items-center gap-1 p-1.5 rounded-lg bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors"
            title="Text Color"
          >
            <div className="relative">
              <Palette size={14} />
              <div 
                className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full"
                style={{ 
                  background: isGradientFill
                    ? gradientToCSS(localGradient)
                    : localColor
                }}
              />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            {/* Fill Type Toggle - uses atomic handler to set both type and value */}
            <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--builder-border))]">
              <button
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
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                    />
                    {'EyeDropper' in window && (
                      <button
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
        onClick={() => setAlignment('left')}
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
        onClick={() => setAlignment('center')}
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
        onClick={() => setAlignment('right')}
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
