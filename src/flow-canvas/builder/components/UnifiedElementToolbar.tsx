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
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  textShadow?: string;
  // Background (for buttons/inputs)
  backgroundColor?: string;
  fillType?: 'solid' | 'gradient';
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
  const [bgColorOpen, setBgColorOpen] = useState(false);

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

  const handleBackgroundGradientChange = (gradient: GradientValue) => {
    onStyleChange?.({ gradient: cloneGradient(gradient), fillType: 'gradient' });
  };

  const handleBackgroundFillTypeChange = (fillType: 'solid' | 'gradient') => {
    if (fillType === 'gradient') {
      const gradient = styles.gradient || defaultGradient;
      onStyleChange?.({ fillType: 'gradient', gradient: cloneGradient(gradient) });
    } else {
      const color = styles.backgroundColor || '#8B5CF6';
      onStyleChange?.({ fillType: 'solid', backgroundColor: color });
    }
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

        {/* Text Color for text elements */}
        {showTextColor && (
          <>
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />
            
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="p-1 rounded bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors"
                  title="Text Color"
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
                className="w-56 p-2 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
                sideOffset={4}
              >
                <div className="space-y-2">
                  {/* Fill Type Toggle */}
                  <div className="flex rounded overflow-hidden border border-[hsl(var(--builder-border))]">
                    <button
                      onClick={() => handleTextFillTypeChange('solid')}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-medium transition-colors",
                        !isTextGradient 
                          ? 'bg-[hsl(var(--builder-accent))] text-white' 
                          : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                      )}
                    >
                      Solid
                    </button>
                    <button
                      onClick={() => handleTextFillTypeChange('gradient')}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-medium transition-colors",
                        isTextGradient 
                          ? 'bg-[hsl(var(--builder-accent))] text-white' 
                          : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))]'
                      )}
                    >
                      Gradient
                    </button>
                  </div>

                  {!isTextGradient && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Color</span>
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
                    </div>
                  )}

                  {isTextGradient && (
                    <GradientEditor
                      value={styles.textGradient || defaultGradient}
                      onChange={handleTextGradientChange}
                      compact
                    />
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Text Shadow */}
        {showTextShadow && (
          <Popover open={shadowOpen} onOpenChange={setShadowOpen}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "p-1 rounded transition-colors",
                  styles.textShadow && styles.textShadow !== 'none'
                    ? 'bg-[hsl(var(--builder-accent))] text-white' 
                    : 'bg-[hsl(var(--builder-surface-hover))] text-[hsl(var(--builder-text-muted))] hover:text-[hsl(var(--builder-text))] hover:bg-[hsl(var(--builder-surface-active))]'
                )}
                title="Text Shadow"
              >
                <Sparkles size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-28 p-1 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
              sideOffset={4}
            >
              <div className="flex flex-col">
                {textShadowPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleTextShadowChange(preset.value)}
                    className={cn(
                      "px-2 py-1 text-[10px] text-left rounded transition-colors",
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
        )}

        {/* Background Color for buttons/inputs */}
        {showBackgroundColor && (
          <>
            <div className="w-px h-4 mx-0.5 bg-[hsl(var(--builder-border))]" />
            
            <Popover open={bgColorOpen} onOpenChange={setBgColorOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="p-1 rounded bg-[hsl(var(--builder-surface-hover))] hover:bg-[hsl(var(--builder-surface-active))] text-[hsl(var(--builder-text))] transition-colors"
                  title="Background Color"
                >
                  <div className="relative">
                    <div 
                      className="w-3.5 h-3.5 rounded border border-[hsl(var(--builder-border))]"
                      style={{ 
                        background: isBgGradient && styles.gradient 
                          ? gradientToCSS(styles.gradient) 
                          : (styles.backgroundColor || '#8B5CF6')
                      }}
                    />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-56 p-2 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]"
                sideOffset={4}
              >
                <div className="space-y-2">
                  {/* Fill Type Toggle */}
                  <div className="flex rounded overflow-hidden border border-[hsl(var(--builder-border))]">
                    <button
                      onClick={() => handleBackgroundFillTypeChange('solid')}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-medium transition-colors",
                        !isBgGradient 
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

                  {!isBgGradient && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[hsl(var(--builder-text-muted))]">Color</span>
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
                    </div>
                  )}

                  {isBgGradient && (
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
