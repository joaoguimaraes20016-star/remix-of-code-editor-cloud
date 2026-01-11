import React, { forwardRef, useRef, useState } from 'react';
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
  Underline,
  Type,
  Palette,
  ChevronDown,
  Sparkles,
  Pipette,
  X,
  MoreHorizontal,
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
import { gradientToCSS, GradientEditor, defaultGradient, cloneGradient, ColorPickerPopover } from './modals';
import type { GradientValue } from './modals';
import { motion, AnimatePresence } from 'framer-motion';

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

// Text shadow presets
const textShadowPresets = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Strong', value: 'strong' },
  { label: 'Glow', value: 'glow' },
  { label: 'Neon', value: 'neon' },
  { label: '3D', value: 'depth' },
];

export interface UnifiedToolbarStyles {
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  // Colors
  textColor?: string;
  textOpacity?: number;
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  textShadow?: string;
  // Background (for buttons/inputs)
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
}

export const UnifiedElementToolbar = forwardRef<HTMLDivElement, UnifiedElementToolbarProps>(({
  elementId,
  elementType,
  elementLabel,
  isSelected,
  styles = {},
  onStyleChange,
  onAlignChange,
  onDuplicate,
  onDelete,
  hidden = false,
}, ref) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  
  // Merge refs
  const mergedRef = (node: HTMLDivElement | null) => {
    toolbarRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref && 'current' in ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Unified color tab: 'background' | 'text' | 'gradient'
  const [colorTab, setColorTab] = useState<'background' | 'text' | 'gradient'>('text');

  // Determine what controls to show based on element type
  const isTextElement = ['heading', 'text'].includes(elementType);
  const isButton = elementType === 'button';
  const isInput = ['input', 'select'].includes(elementType);
  const isFormElement = ['checkbox', 'radio'].includes(elementType);
  const isMediaElement = ['image', 'video'].includes(elementType);
  const isLayoutElement = ['divider', 'spacer'].includes(elementType);
  
  const showTypography = isTextElement;
  const showAlignment = ['heading', 'text', 'button', 'input', 'select', 'checkbox', 'radio'].includes(elementType);
  const showTextColor = isTextElement;
  // Show background color for ALL elements except pure layout elements
  const showBackgroundColor = !isLayoutElement;

  if (hidden) return null;
  
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

  const toggleUnderline = () => {
    onStyleChange?.({ textDecoration: styles.textDecoration === 'underline' ? 'none' : 'underline' });
  };

  const handleTextColorChange = (color: string) => {
    onStyleChange?.({ textColor: color, textFillType: 'solid' });
  };

  const handleTextOpacityChange = (opacity: number) => {
    onStyleChange?.({ textOpacity: opacity });
  };

  const handleTextGradientChange = (gradient: GradientValue) => {
    onStyleChange?.({ textGradient: cloneGradient(gradient), textFillType: 'gradient' });
  };

  const handleBackgroundColorChange = (color: string) => {
    onStyleChange?.({ backgroundColor: color, fillType: 'solid' });
  };

  const handleBackgroundOpacityChange = (opacity: number) => {
    onStyleChange?.({ backgroundOpacity: opacity });
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

  const handleEyedropper = async (callback: (color: string) => void) => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
        const result = await eyeDropper.open();
        callback(result.sRGBHex);
      } catch (e) {
        // User cancelled
      }
    }
  };

  const currentFont = displayFonts.find(f => f.value === styles.fontFamily)?.label || 'Inherit';
  const currentFontSize = fontSizes.find(f => f.value === styles.fontSize)?.label || 'M';
  const isTextGradient = styles.textFillType === 'gradient';
  const isBgGradient = styles.fillType === 'gradient';
  const isBgNone = styles.fillType === 'none' || (!styles.backgroundColor && !styles.gradient && styles.fillType !== 'solid' && styles.fillType !== 'gradient');

  // Compact button style
  const btnClass = "p-1.5 rounded-md transition-colors";
  const btnInactive = "text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-white/10";
  const btnActive = "bg-[hsl(var(--builder-accent))] text-white";

  return (
    <AnimatePresence>
      {isSelected && (
        <TooltipProvider delayDuration={300}>
          <motion.div
            ref={mergedRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-[60]',
              // Position above element, centered
              '-top-11 left-1/2 -translate-x-1/2',
              // Compact pill style matching highlight
              'flex items-center gap-0.5 px-1 py-0.5 rounded-lg',
              'bg-[hsl(220,13%,12%)] border border-[hsl(var(--builder-border))]',
              'shadow-lg shadow-black/40',
              'pointer-events-auto'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(btnClass, btnInactive, 'cursor-grab active:cursor-grabbing')}>
                  <GripVertical size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Drag to reorder</TooltipContent>
            </Tooltip>

            {/* Typography Controls - Compact */}
            {showTypography && (
              <>
                <div className="w-px h-4 bg-white/10" />

                {/* Font Family Dropdown */}
                <Popover open={fontOpen} onOpenChange={setFontOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(btnClass, btnInactive, 'flex items-center gap-1')}>
                      <Type size={14} />
                      <span className="text-xs font-medium max-w-[50px] truncate">{currentFont}</span>
                      <ChevronDown size={10} className="opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-40 p-1 bg-[hsl(220,13%,12%)] border-[hsl(var(--builder-border))] max-h-[240px] overflow-y-auto"
                    sideOffset={8}
                  >
                    {displayFonts.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => handleFontFamilyChange(font.value)}
                        className={cn(
                          "w-full px-2 py-1.5 text-xs text-left rounded transition-colors flex items-center justify-between",
                          styles.fontFamily === font.value 
                            ? 'bg-[hsl(var(--builder-accent))] text-white' 
                            : 'text-[hsl(var(--builder-text-muted))] hover:text-white hover:bg-white/10'
                        )}
                        style={{ fontFamily: font.value !== 'inherit' ? font.value : undefined }}
                      >
                        <span>{font.label}</span>
                        {font.isDisplay && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-white/10">Display</span>
                        )}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Font Size */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(btnClass, btnInactive, 'flex items-center gap-0.5 min-w-[28px] justify-center')}>
                      <span className="text-xs font-bold">{currentFontSize}</span>
                      <ChevronDown size={10} className="opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-1 bg-[hsl(220,13%,12%)] border-[hsl(var(--builder-border))]"
                    sideOffset={8}
                  >
                    <div className="flex gap-0.5">
                      {fontSizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => handleFontSizeChange(size.value)}
                          className={cn(
                            "px-2 py-1 text-xs font-medium rounded transition-colors",
                            styles.fontSize === size.value 
                              ? btnActive
                              : 'text-[hsl(var(--builder-text-muted))] hover:text-white hover:bg-white/10'
                          )}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="w-px h-4 bg-white/10" />

                {/* Bold */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleBold}
                      className={cn(btnClass, styles.fontWeight === 'bold' ? btnActive : btnInactive)}
                    >
                      <Bold size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Bold (⌘B)</TooltipContent>
                </Tooltip>

                {/* Italic */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleItalic}
                      className={cn(btnClass, styles.fontStyle === 'italic' ? btnActive : btnInactive)}
                    >
                      <Italic size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Italic (⌘I)</TooltipContent>
                </Tooltip>

                {/* Color */}
                <Popover open={colorOpen} onOpenChange={setColorOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(btnClass, btnInactive, 'relative')}>
                      <Sparkles size={14} />
                      <div 
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
                        style={{ 
                          background: isTextGradient && styles.textGradient 
                            ? gradientToCSS(styles.textGradient) 
                            : (styles.textColor || '#FFFFFF')
                        }}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-56 p-2 bg-[hsl(220,13%,12%)] border-[hsl(var(--builder-border))]"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      {/* Tab switcher */}
                      <div className="flex rounded overflow-hidden border border-white/10">
                        {showBackgroundColor && (
                          <button
                            onClick={() => setColorTab('background')}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-medium transition-colors",
                              colorTab === 'background' ? btnActive : 'text-[hsl(var(--builder-text-muted))] hover:text-white'
                            )}
                          >
                            Fill
                          </button>
                        )}
                        {showTextColor && (
                          <button
                            onClick={() => setColorTab('text')}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-medium transition-colors",
                              colorTab === 'text' ? btnActive : 'text-[hsl(var(--builder-text-muted))] hover:text-white'
                            )}
                          >
                            Text
                          </button>
                        )}
                        {showTextColor && (
                          <button
                            onClick={() => setColorTab('gradient')}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-medium transition-colors",
                              colorTab === 'gradient' ? btnActive : 'text-[hsl(var(--builder-text-muted))] hover:text-white'
                            )}
                          >
                            Gradient
                          </button>
                        )}
                      </div>

                      {/* Text Color Tab */}
                      {colorTab === 'text' && showTextColor && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-8 gap-1">
                            {colorPresets.map((color) => (
                              <button
                                key={color}
                                onClick={() => handleTextColorChange(color)}
                                className={cn(
                                  "w-5 h-5 rounded border transition-all",
                                  styles.textColor === color 
                                    ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-1 ring-offset-[hsl(220,13%,12%)]' 
                                    : 'border-white/10 hover:scale-110'
                                )}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={styles.textColor || '#FFFFFF'}
                              onChange={(e) => handleTextColorChange(e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <span className="text-xs text-[hsl(var(--builder-text-muted))]">Custom</span>
                          </div>
                        </div>
                      )}

                      {/* Background Tab */}
                      {colorTab === 'background' && showBackgroundColor && (
                        <div className="space-y-2">
                          <div className="flex rounded overflow-hidden border border-white/10">
                            <button
                              onClick={handleClearBackground}
                              className={cn("flex-1 py-1 text-[10px] font-medium", isBgNone ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                            >None</button>
                            <button
                              onClick={() => handleBackgroundFillTypeChange('solid')}
                              className={cn("flex-1 py-1 text-[10px] font-medium", !isBgNone && !isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                            >Solid</button>
                            <button
                              onClick={() => handleBackgroundFillTypeChange('gradient')}
                              className={cn("flex-1 py-1 text-[10px] font-medium", isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                            >Gradient</button>
                          </div>
                          {!isBgNone && !isBgGradient && (
                            <div className="grid grid-cols-8 gap-1">
                              {colorPresets.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleBackgroundColorChange(color)}
                                  className={cn(
                                    "w-5 h-5 rounded border transition-all",
                                    styles.backgroundColor === color 
                                      ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-1 ring-offset-[hsl(220,13%,12%)]' 
                                      : 'border-white/10 hover:scale-110'
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                          {!isBgNone && isBgGradient && (
                            <GradientEditor
                              value={styles.gradient || defaultGradient}
                              onChange={handleBackgroundGradientChange}
                              compact
                            />
                          )}
                        </div>
                      )}

                      {/* Gradient Tab */}
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

            {/* Non-text elements: just show color picker */}
            {!showTypography && showBackgroundColor && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <Popover open={colorOpen} onOpenChange={setColorOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(btnClass, btnInactive)}>
                      <Palette size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-56 p-2 bg-[hsl(220,13%,12%)] border-[hsl(var(--builder-border))]"
                    sideOffset={8}
                  >
                    <div className="space-y-2">
                      <div className="flex rounded overflow-hidden border border-white/10">
                        <button
                          onClick={handleClearBackground}
                          className={cn("flex-1 py-1 text-[10px] font-medium", isBgNone ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                        >None</button>
                        <button
                          onClick={() => handleBackgroundFillTypeChange('solid')}
                          className={cn("flex-1 py-1 text-[10px] font-medium", !isBgNone && !isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                        >Solid</button>
                        <button
                          onClick={() => handleBackgroundFillTypeChange('gradient')}
                          className={cn("flex-1 py-1 text-[10px] font-medium", isBgGradient ? btnActive : 'text-[hsl(var(--builder-text-muted))]')}
                        >Gradient</button>
                      </div>
                      {!isBgNone && !isBgGradient && (
                        <div className="grid grid-cols-8 gap-1">
                          {colorPresets.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleBackgroundColorChange(color)}
                              className={cn(
                                "w-5 h-5 rounded border transition-all",
                                styles.backgroundColor === color 
                                  ? 'ring-2 ring-[hsl(var(--builder-accent))] ring-offset-1 ring-offset-[hsl(220,13%,12%)]' 
                                  : 'border-white/10 hover:scale-110'
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                      {!isBgNone && isBgGradient && (
                        <GradientEditor
                          value={styles.gradient || defaultGradient}
                          onChange={handleBackgroundGradientChange}
                          compact
                        />
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}

            {/* Alignment */}
            {showAlignment && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }}
                    className={cn(btnClass, 'rounded-r-none', (styles.textAlign === 'left' || !styles.textAlign) ? btnActive : btnInactive)}
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }}
                    className={cn(btnClass, 'rounded-none', styles.textAlign === 'center' ? btnActive : btnInactive)}
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }}
                    className={cn(btnClass, 'rounded-l-none', styles.textAlign === 'right' ? btnActive : btnInactive)}
                  >
                    <AlignRight size={14} />
                  </button>
                </div>
              </>
            )}

            <div className="w-px h-4 bg-white/10" />

            {/* Actions: Duplicate & Delete */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
                  className={cn(btnClass, btnInactive)}
                >
                  <Copy size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Duplicate</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  className={cn(btnClass, 'text-[hsl(var(--builder-text-muted))] hover:text-red-400 hover:bg-red-500/20')}
                >
                  <Trash2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Delete</TooltipContent>
            </Tooltip>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
});

UnifiedElementToolbar.displayName = 'UnifiedElementToolbar';
