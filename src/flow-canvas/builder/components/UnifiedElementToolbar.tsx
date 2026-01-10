import React, { forwardRef, useState } from 'react';
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
  styles = {},
  onStyleChange,
  onAlignChange,
  onDuplicate,
  onDelete,
  hidden = false,
}, ref) => {
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);
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
  const showTextShadow = isTextElement;

  if (hidden) return null;

  // Handlers
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

  const handleTextFillTypeChange = (fillType: 'solid' | 'gradient') => {
    if (fillType === 'gradient') {
      const gradient = styles.textGradient || defaultGradient;
      onStyleChange?.({ textFillType: 'gradient', textGradient: cloneGradient(gradient) });
    } else {
      const color = styles.textColor || '#FFFFFF';
      onStyleChange?.({ textFillType: 'solid', textColor: color });
    }
  };

  const handleTextShadowChange = (shadow: string) => {
    onStyleChange?.({ textShadow: shadow });
    setShadowOpen(false);
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
  const isTextGradient = styles.textFillType === 'gradient';
  const isBgGradient = styles.fillType === 'gradient';
  const isBgNone = styles.fillType === 'none' || (!styles.backgroundColor && !styles.gradient && styles.fillType !== 'solid' && styles.fillType !== 'gradient');

  // Generate readable element label
  const getElementLabel = () => {
    if (elementLabel) return elementLabel;
    const labels: Record<string, string> = {
      heading: 'Heading',
      text: 'Text',
      button: 'Button',
      input: 'Input',
      checkbox: 'Checkbox',
      radio: 'Radio',
      select: 'Select',
      image: 'Image',
      video: 'Video',
      divider: 'Divider',
      spacer: 'Spacer',
    };
    return labels[elementType] || elementType;
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Invisible hover bridge */}
      <div 
        className="absolute left-0 right-0 z-20 -top-12 h-14"
        style={{ pointerEvents: 'auto' }}
      />
      <div
        ref={ref}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-30 -top-11',
          'flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl border',
          'opacity-0 group-hover/element:opacity-100 transition-all duration-150',
          'bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Element Type Label */}
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--builder-accent))] bg-[hsl(var(--builder-accent)/0.1)] rounded">
          {getElementLabel()}
        </div>

        <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />

        {/* Drag Handle */}
        <div className="p-1 rounded cursor-grab active:cursor-grabbing bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {showTypography && (
          <>
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />

            {/* Font Family */}
            <Popover open={fontOpen} onOpenChange={setFontOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors">
                  <Type size={12} />
                  <span className="text-[10px] font-medium truncate max-w-[50px]">{currentFont}</span>
                  <ChevronDown size={10} className="text-[hsl(var(--builder-text-muted))]" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-40 p-1 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))] max-h-[240px] overflow-y-auto"
                sideOffset={4}
              >
                <div className="flex flex-col">
                  {displayFonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => handleFontFamilyChange(font.value)}
                      className={cn(
                        "px-2 py-1.5 text-xs text-left rounded transition-colors flex items-center justify-between",
                        styles.fontFamily === font.value 
                          ? 'bg-[hsl(var(--builder-accent))] text-white' 
                          : 'text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-hover))]'
                      )}
                      style={{ fontFamily: font.value !== 'inherit' ? font.value : undefined }}
                    >
                      <span>{font.label}</span>
                      {font.isDisplay && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-[hsl(var(--builder-accent-muted))] text-[hsl(var(--builder-text))]">Display</span>
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Font Size */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors">
                  <span className="text-[10px] font-bold">{fontSizes.find(f => f.value === styles.fontSize)?.label || 'M'}</span>
                  <ChevronDown size={10} className="text-[hsl(var(--builder-text-muted))]" />
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
                        "px-2 py-1 text-[10px] font-medium rounded transition-colors",
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

            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />

            {/* Bold */}
            <button
              onClick={toggleBold}
              className={cn(
                "p-1 rounded transition-colors",
                styles.fontWeight === 'bold' 
                  ? 'bg-[hsl(var(--builder-accent))] text-white' 
                  : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
              )}
              title="Bold"
            >
              <Bold size={12} />
            </button>

            {/* Italic */}
            <button
              onClick={toggleItalic}
              className={cn(
                "p-1 rounded transition-colors",
                styles.fontStyle === 'italic' 
                  ? 'bg-[hsl(var(--builder-accent))] text-white' 
                  : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
              )}
              title="Italic"
            >
              <Italic size={12} />
            </button>

            {/* Underline */}
            <button
              onClick={toggleUnderline}
              className={cn(
                "p-1 rounded transition-colors",
                styles.textDecoration === 'underline' 
                  ? 'bg-[hsl(var(--builder-accent))] text-white' 
                  : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
              )}
              title="Underline"
            >
              <Underline size={12} />
            </button>
          </>
        )}

        {/* Unified Color Picker - combines Text Color and Background Fill */}
        {(showTextColor || showBackgroundColor) && (
          <>
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />
            
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="p-1 rounded bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors"
                  title="Colors"
                >
                  <div className="relative">
                    <Palette size={12} />
                    <div 
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{ 
                        background: isTextGradient && styles.textGradient 
                          ? gradientToCSS(styles.textGradient) 
                          : (styles.textColor || '#FFFFFF')
                      }}
                    />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 p-2 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
                sideOffset={4}
              >
                <div className="space-y-3">
                  {/* Tab Navigation */}
                  <div className="flex rounded overflow-hidden border border-[hsl(var(--builder-border))]">
                    {showBackgroundColor && (
                      <button
                        onClick={() => setColorTab('background')}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-medium transition-colors",
                          colorTab === 'background' 
                            ? 'bg-[hsl(var(--builder-accent))] text-white' 
                            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))]'
                        )}
                      >
                        Background
                      </button>
                    )}
                    {showTextColor && (
                      <button
                        onClick={() => setColorTab('text')}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-medium transition-colors",
                          colorTab === 'text' 
                            ? 'bg-[hsl(var(--builder-accent))] text-white' 
                            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))]'
                        )}
                      >
                        Text Color
                      </button>
                    )}
                    {showTextColor && (
                      <button
                        onClick={() => setColorTab('gradient')}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-medium transition-colors",
                          colorTab === 'gradient' 
                            ? 'bg-[hsl(var(--builder-accent))] text-white' 
                            : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))]'
                        )}
                      >
                        Gradient
                      </button>
                    )}
                  </div>

                  {/* Background Fill Tab */}
                  {colorTab === 'background' && showBackgroundColor && (
                    <div className="space-y-2">
                      {/* Preview */}
                      <div 
                        className="w-full h-10 rounded border border-[hsl(var(--builder-border))] flex items-center justify-center text-xs font-medium relative overflow-hidden"
                        style={{ 
                          background: isBgNone 
                            ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 12px 12px'
                            : isBgGradient && styles.gradient 
                              ? gradientToCSS(styles.gradient) 
                              : (styles.backgroundColor || 'transparent'),
                          opacity: isBgNone ? 1 : (styles.backgroundOpacity ?? 100) / 100,
                          color: isBgNone ? 'hsl(var(--builder-text-muted))' : (isBgGradient || styles.backgroundColor ? '#fff' : 'hsl(var(--builder-text-muted))')
                        }}
                      >
                        {isBgNone ? 'No Fill' : isBgGradient ? 'Gradient' : (styles.backgroundColor || 'No Fill')}
                      </div>
                      
                      {/* None/Solid/Gradient Toggle */}
                      <div className="flex rounded overflow-hidden border border-[hsl(var(--builder-border))]">
                        <button
                          onClick={() => handleClearBackground()}
                          className={cn(
                            "flex-1 py-1 text-[10px] font-medium transition-colors",
                            isBgNone 
                              ? 'bg-[hsl(var(--builder-accent))] text-white' 
                              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                          )}
                        >
                          None
                        </button>
                        <button
                          onClick={() => handleBackgroundFillTypeChange('solid')}
                          className={cn(
                            "flex-1 py-1 text-[10px] font-medium transition-colors",
                            !isBgNone && !isBgGradient 
                              ? 'bg-[hsl(var(--builder-accent))] text-white' 
                              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                          )}
                        >
                          Solid
                        </button>
                        <button
                          onClick={() => handleBackgroundFillTypeChange('gradient')}
                          className={cn(
                            "flex-1 py-1 text-[10px] font-medium transition-colors",
                            isBgGradient 
                              ? 'bg-[hsl(var(--builder-accent))] text-white' 
                              : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                          )}
                        >
                          Gradient
                        </button>
                      </div>

                      {!isBgNone && !isBgGradient && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Fill Color</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={styles.backgroundColor || '#8B5CF6'}
                                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                              />
                              {'EyeDropper' in window && (
                                <button
                                  onClick={() => handleEyedropper(handleBackgroundColorChange)}
                                  className="p-1 rounded bg-[hsl(var(--builder-surface-active))] hover:bg-[hsl(var(--builder-accent)/0.2)] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] transition-colors"
                                  title="Pick color"
                                >
                                  <Pipette size={12} />
                                </button>
                              )}
                              <button
                                onClick={handleClearBackground}
                                className="p-1 rounded bg-[hsl(var(--builder-surface-active))] hover:bg-red-500/20 text-[hsl(var(--builder-text-muted))] hover:text-red-400 transition-colors"
                                title="Clear fill"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-8 gap-0.5">
                            {colorPresets.map((color) => (
                              <button
                                key={color}
                                onClick={() => handleBackgroundColorChange(color)}
                                className={cn(
                                  "w-5 h-5 rounded border transition-all",
                                  styles.backgroundColor === color 
                                    ? 'ring-1 ring-[hsl(var(--builder-accent))] ring-offset-1' 
                                    : 'border-[hsl(var(--builder-border))] hover:scale-110'
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          
                          {/* Opacity Slider */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Opacity</span>
                              <span className="text-[10px] text-[hsl(var(--builder-text))]">{styles.backgroundOpacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={styles.backgroundOpacity ?? 100}
                              onChange={(e) => handleBackgroundOpacityChange(parseInt(e.target.value))}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[hsl(var(--builder-surface-active))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--builder-accent))] [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      {!isBgNone && isBgGradient && (
                        <>
                          <GradientEditor
                            value={styles.gradient || defaultGradient}
                            onChange={handleBackgroundGradientChange}
                            compact
                          />
                          {/* Opacity Slider for Gradient */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Opacity</span>
                              <span className="text-[10px] text-[hsl(var(--builder-text))]">{styles.backgroundOpacity ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={styles.backgroundOpacity ?? 100}
                              onChange={(e) => handleBackgroundOpacityChange(parseInt(e.target.value))}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[hsl(var(--builder-surface-active))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--builder-accent))] [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Text Color (Solid) Tab */}
                  {colorTab === 'text' && showTextColor && (
                    <div className="space-y-2">
                      {/* Preview */}
                      <div 
                        className="w-full h-10 rounded border border-[hsl(var(--builder-border))] bg-[hsl(var(--builder-surface-hover))] flex items-center justify-center text-lg font-bold"
                        style={{ 
                          color: styles.textColor || '#FFFFFF',
                          opacity: (styles.textOpacity ?? 100) / 100
                        }}
                      >
                        Aa
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Text Color</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={styles.textColor || '#FFFFFF'}
                            onChange={(e) => handleTextColorChange(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                          />
                          {'EyeDropper' in window && (
                            <button
                              onClick={() => handleEyedropper(handleTextColorChange)}
                              className="p-1 rounded bg-[hsl(var(--builder-surface-active))] hover:bg-[hsl(var(--builder-accent)/0.2)] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] transition-colors"
                              title="Pick color"
                            >
                              <Pipette size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-8 gap-0.5">
                        {colorPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleTextColorChange(color)}
                            className={cn(
                              "w-5 h-5 rounded border transition-all",
                              styles.textColor === color 
                                ? 'ring-1 ring-[hsl(var(--builder-accent))] ring-offset-1' 
                                : 'border-[hsl(var(--builder-border))] hover:scale-110'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Text Opacity Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Opacity</span>
                          <span className="text-[10px] text-[hsl(var(--builder-text))]">{styles.textOpacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={styles.textOpacity ?? 100}
                          onChange={(e) => handleTextOpacityChange(parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[hsl(var(--builder-surface-active))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--builder-accent))] [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Text Gradient Tab - GradientEditor has its own preview, no need for extra one */}
                  {colorTab === 'gradient' && showTextColor && (
                    <div className="space-y-2">
                      <GradientEditor
                        value={styles.textGradient || defaultGradient}
                        onChange={(gradient) => {
                          handleTextGradientChange(gradient);
                          onStyleChange?.({ textFillType: 'gradient' });
                        }}
                        compact
                      />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Alignment */}
        {showAlignment && (
          <>
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onAlignChange?.('left'); }}
                  className={cn(
                    'p-1 rounded transition-colors',
                    styles.textAlign === 'left' || !styles.textAlign
                      ? 'bg-[hsl(var(--builder-accent))] text-white'
                      : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
                  )}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-[10px]">Left</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onAlignChange?.('center'); }}
                  className={cn(
                    'p-1 rounded transition-colors',
                    styles.textAlign === 'center'
                      ? 'bg-[hsl(var(--builder-accent))] text-white'
                      : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
                  )}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-[10px]">Center</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onAlignChange?.('right'); }}
                  className={cn(
                    'p-1 rounded transition-colors',
                    styles.textAlign === 'right'
                      ? 'bg-[hsl(var(--builder-accent))] text-white'
                      : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
                  )}
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-[10px]">Right</p></TooltipContent>
            </Tooltip>
          </>
        )}

        <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
              className="p-1 rounded transition-colors bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]"
            >
              <Copy className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-[10px]">Duplicate</p></TooltipContent>
        </Tooltip>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-1 rounded transition-colors bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-red-400 hover:bg-red-500/15"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top"><p className="text-[10px]">Delete</p></TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

UnifiedElementToolbar.displayName = 'UnifiedElementToolbar';
