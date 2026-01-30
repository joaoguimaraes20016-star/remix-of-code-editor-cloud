import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Underline, Strikethrough as StrikethroughIcon, Link, AlignLeft, AlignCenter, AlignRight, MoreHorizontal, Highlighter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFunnel } from '@/context/FunnelContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorGradientSwatchPicker, ColorSwatchPicker } from './inspector/InspectorUI';
import { TextStyles } from '@/types/funnel';
import {
  hasSelectionInElement,
  getSelectionStyles,
  applyInlineStyle,
  applyColor,
  applyHighlight,
  createLink,
  removeLink,
  SelectionStyles,
} from '@/lib/selection-utils';

interface InlineTextToolbarProps {
  elementRef: React.RefObject<HTMLElement>;
  styles: TextStyles;
  onStyleChange: (updates: Partial<TextStyles>) => void;
  onPopoverOpenChange?: (isOpen: boolean) => void;
  onContentChange?: () => void; // Called when inline content changes (for saving)
  onClose?: () => void; // Manual close handler
}

const fontSizeOptions = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

const colorPresets = [
  '#000000', '#ffffff', '#374151', '#6b7280',
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
];

const highlightPresets = [
  'transparent', '#fef08a', '#fde047', '#fbbf24', '#fb923c',
  '#fca5a5', '#f9a8d4', '#c4b5fd', '#93c5fd', '#86efac',
];

export function InlineTextToolbar({ 
  elementRef, 
  styles, 
  onStyleChange, 
  onPopoverOpenChange,
  onContentChange,
  onClose
}: InlineTextToolbarProps) {
  const { isPreviewMode } = useFunnel();
  
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  const [isHighlightPopoverOpen, setIsHighlightPopoverOpen] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [isMorePopoverOpen, setIsMorePopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState(styles.linkUrl || '');
  const [linkTarget, setLinkTarget] = useState<'_self' | '_blank'>(styles.linkTarget || '_blank');
  
  // Selection-aware state
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionStyles, setSelectionStyles] = useState<SelectionStyles>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    color: '',
    backgroundColor: '',
    hasLink: false,
  });

  // Report popover state to parent
  useEffect(() => {
    const anyPopoverOpen = isColorPopoverOpen || isHighlightPopoverOpen || isLinkPopoverOpen || isMorePopoverOpen;
    onPopoverOpenChange?.(anyPopoverOpen);
  }, [isColorPopoverOpen, isHighlightPopoverOpen, isLinkPopoverOpen, isMorePopoverOpen, onPopoverOpenChange]);

  // Sync local link state when styles change externally
  useEffect(() => {
    if (!hasSelection) {
      setLinkUrl(styles.linkUrl || '');
      setLinkTarget(styles.linkTarget || '_blank');
    }
  }, [styles.linkUrl, styles.linkTarget, hasSelection]);

  // Track selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const hasSelNow = hasSelectionInElement(elementRef.current);
      setHasSelection(hasSelNow);
      
      if (hasSelNow) {
        const selStyles = getSelectionStyles();
        setSelectionStyles(selStyles);
        // Update link URL from selection if inside a link
        if (selStyles.hasLink && selStyles.linkUrl) {
          setLinkUrl(selStyles.linkUrl);
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [elementRef]);

  const updatePosition = useCallback(() => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const toolbarHeight = 44;
      const gap = 8;
      
      // Position above the element
      let top = rect.top - toolbarHeight - gap;
      let left = rect.left + (rect.width / 2);
      
      // If toolbar would go above viewport, position below
      if (top < 10) {
        top = rect.bottom + gap;
      }
      
      // Keep toolbar within horizontal bounds
      const minLeft = 240;
      const maxLeft = window.innerWidth - 240;
      left = Math.max(minLeft, Math.min(maxLeft, left));
      
      setPosition({ top, left });
    }
  }, [elementRef]);

  useEffect(() => {
    updatePosition();
    
    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // Prevent blur when clicking toolbar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Parse current styles - use selection styles when text is selected
  const currentFontSize = String(styles.fontSize || 16);
  const isBold = hasSelection ? selectionStyles.isBold : (styles.fontWeight === 700 || styles.fontWeight === 800);
  const isItalic = hasSelection ? selectionStyles.isItalic : styles.fontStyle === 'italic';
  const isUnderline = hasSelection ? selectionStyles.isUnderline : styles.textDecoration === 'underline';
  const isStrikethrough = hasSelection ? selectionStyles.isStrikethrough : styles.textDecoration === 'line-through';
  const currentColor = hasSelection && selectionStyles.color ? selectionStyles.color : (styles.color || '#000000');
  const currentGradient = styles.textGradient || '';
  const currentHighlight = hasSelection && selectionStyles.backgroundColor ? selectionStyles.backgroundColor : '';
  const hasHighlight = currentHighlight && currentHighlight !== 'transparent' && currentHighlight !== 'rgba(0, 0, 0, 0)';
  const currentAlign = styles.textAlign || 'left';
  const currentLineHeight = styles.lineHeight ?? 1.5;
  const currentLetterSpacing = styles.letterSpacing ?? 0;
  const hasLink = hasSelection ? selectionStyles.hasLink : !!styles.linkUrl;
  const hasAdvancedStyles = currentLineHeight !== 1.5 || currentLetterSpacing !== 0;

  const toggleBold = () => {
    if (hasSelection) {
      applyInlineStyle('bold');
      onContentChange?.();
      // Update selection styles after applying
      setSelectionStyles(getSelectionStyles());
    } else {
      onStyleChange({ fontWeight: isBold ? 400 : 700 });
    }
  };

  const toggleItalic = () => {
    if (hasSelection) {
      applyInlineStyle('italic');
      onContentChange?.();
      setSelectionStyles(getSelectionStyles());
    } else {
      onStyleChange({ fontStyle: isItalic ? 'normal' : 'italic' });
    }
  };

  const toggleUnderline = () => {
    if (hasSelection) {
      applyInlineStyle('underline');
      onContentChange?.();
      setSelectionStyles(getSelectionStyles());
    } else {
      onStyleChange({ textDecoration: isUnderline ? 'none' : 'underline' });
    }
  };

  const toggleStrikethrough = () => {
    if (hasSelection) {
      applyInlineStyle('strikeThrough');
      onContentChange?.();
      setSelectionStyles(getSelectionStyles());
    } else {
      onStyleChange({ textDecoration: isStrikethrough ? 'none' : 'line-through' });
    }
  };

  const handleFontSizeChange = (size: string) => {
    // Font size always applies to block level
    onStyleChange({ fontSize: parseInt(size, 10) });
  };

  const handleColorChange = (color: string) => {
    if (hasSelection) {
      applyColor(color);
      onContentChange?.();
      setSelectionStyles(getSelectionStyles());
    } else {
      // Apply immediately to avoid needing a blur/click-out for preview
      if (elementRef.current) {
        // Remove gradient class and variable when switching to solid color
        elementRef.current.classList.remove('text-gradient-clip');
        elementRef.current.style.removeProperty('--text-gradient');
        // Clear all gradient-related styles
        elementRef.current.style.background = '';
        elementRef.current.style.backgroundImage = '';
        elementRef.current.style.setProperty('-webkit-background-clip', '');
        elementRef.current.style.setProperty('background-clip', '');
        elementRef.current.style.setProperty('-webkit-text-fill-color', '');
        elementRef.current.style.color = color;
        
        // Also reset child elements that may have inherited gradient styles
        elementRef.current.querySelectorAll('*').forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('-webkit-text-fill-color', '');
            child.style.color = '';
          }
        });
      }
      onStyleChange({ color, textGradient: '' }); // Clear gradient when setting solid color
    }
  };

  const handleGradientChange = (gradient: string) => {
    // Gradients apply to block level only (not inline selections)
    // Apply immediately for in-place preview (no click-out needed)
    if (elementRef.current) {
      if (gradient) {
        // Use the CSS utility class + variable for consistent descendant clipping
        elementRef.current.classList.add('text-gradient-clip');
        elementRef.current.style.setProperty('--text-gradient', gradient);
        // Clear any inline overrides that might conflict with gradient clipping
        elementRef.current.style.background = '';
        elementRef.current.style.backgroundColor = '';
        elementRef.current.style.color = '';
        (elementRef.current.style as any).webkitTextFillColor = '';
        
        // Also clear inline styles on child elements that could interfere
        elementRef.current.querySelectorAll('*').forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.color = '';
            (child.style as any).webkitTextFillColor = '';
          }
        });
      } else {
        // Remove gradient class and variable
        elementRef.current.classList.remove('text-gradient-clip');
        elementRef.current.style.removeProperty('--text-gradient');
        elementRef.current.style.background = '';
        (elementRef.current.style as any).webkitBackgroundClip = '';
        (elementRef.current.style as any).webkitTextFillColor = '';
        (elementRef.current.style as any).backgroundClip = '';
        elementRef.current.style.color = styles.color || '';
      }
    }
    onStyleChange({ textGradient: gradient });
  };

  const handleHighlightChange = (color: string) => {
    if (hasSelection) {
      applyHighlight(color);
      onContentChange?.();
      setSelectionStyles(getSelectionStyles());
    }
    // Highlight only makes sense for selections, not block-level
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    // Alignment always applies to block level
    onStyleChange({ textAlign: align });
  };

  const handleLineHeightChange = (value: number[]) => {
    onStyleChange({ lineHeight: value[0] });
  };

  const handleLetterSpacingChange = (value: number[]) => {
    onStyleChange({ letterSpacing: value[0] });
  };

  const handleLinkSave = () => {
    if (hasSelection) {
      if (linkUrl) {
        createLink(linkUrl, linkTarget);
        onContentChange?.();
      }
    } else {
      onStyleChange({ 
        linkUrl: linkUrl || undefined,
        linkTarget: linkUrl ? linkTarget : undefined
      });
    }
    setIsLinkPopoverOpen(false);
  };

  const handleRemoveLink = () => {
    if (hasSelection) {
      removeLink();
      onContentChange?.();
    } else {
      onStyleChange({ linkUrl: undefined, linkTarget: undefined });
    }
    setLinkUrl('');
    setIsLinkPopoverOpen(false);
  };

  const handleResetAdvanced = () => {
    onStyleChange({ lineHeight: 1.5, letterSpacing: 0 });
  };

  // Don't render toolbar in preview mode
  if (isPreviewMode) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-[100] flex items-center gap-0.5 bg-card border border-border shadow-lg rounded-lg px-1.5 py-1"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Font Size Dropdown */}
      <Select value={currentFontSize} onValueChange={handleFontSizeChange}>
        <SelectTrigger className="w-[68px] h-8 border-0 bg-transparent text-xs font-medium focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="16px" />
        </SelectTrigger>
        <SelectContent>
          {fontSizeOptions.map((size) => (
            <SelectItem key={size} value={String(size)} className="text-xs">
              {size}px
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* Bold */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleBold}
        className={cn(
          'w-8 h-8',
          isBold && 'bg-accent text-accent-foreground'
        )}
        title="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleItalic}
        className={cn(
          'w-8 h-8',
          isItalic && 'bg-accent text-accent-foreground'
        )}
        title="Italic (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Underline */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleUnderline}
        className={cn(
          'w-8 h-8',
          isUnderline && 'bg-accent text-accent-foreground'
        )}
        title="Underline (⌘U)"
      >
        <Underline className="h-4 w-4" />
      </Button>

      {/* Strikethrough */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleStrikethrough}
        className={cn(
          'w-8 h-8',
          isStrikethrough && 'bg-accent text-accent-foreground'
        )}
        title="Strikethrough"
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* Text Alignment */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleAlignChange('left')}
        className={cn(
          'w-8 h-8',
          currentAlign === 'left' && 'bg-accent text-accent-foreground'
        )}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleAlignChange('center')}
        className={cn(
          'w-8 h-8',
          currentAlign === 'center' && 'bg-accent text-accent-foreground'
        )}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleAlignChange('right')}
        className={cn(
          'w-8 h-8',
          currentAlign === 'right' && 'bg-accent text-accent-foreground'
        )}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* Color Picker */}
      <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            title={hasSelection ? "Color selection" : "Text Color / Gradient"}
          >
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ 
                background: currentGradient || (currentColor === 'transparent' ? 'transparent' : currentColor)
              }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3" 
          align="center" 
          sideOffset={8}
          onMouseDown={handleMouseDown}
        >
          {/* 
            Show gradient picker when:
            - No text is selected (cursor positioned), OR  
            - All text is selected (block-level operation)
            
            Show solid color picker only when partial text is selected
            (can't apply CSS gradient to inline text)
          */}
          <ColorGradientSwatchPicker
            solidColor={currentColor}
            gradient={currentGradient}
            onSolidChange={handleColorChange}
            onGradientChange={handleGradientChange}
            colorPresets={colorPresets}
            showCustom={true}
          />
        </PopoverContent>
      </Popover>

      {/* Highlight/Background Color Picker */}
      <Popover open={isHighlightPopoverOpen} onOpenChange={setIsHighlightPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-8 h-8',
              hasHighlight && 'bg-accent text-accent-foreground'
            )}
            title={hasSelection ? "Highlight selection" : "Select text to highlight"}
            disabled={!hasSelection}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-3" 
          align="center" 
          sideOffset={8}
          onMouseDown={handleMouseDown}
        >
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Highlight Color</Label>
            <ColorSwatchPicker
              value={currentHighlight || 'transparent'}
              onChange={handleHighlightChange}
              presets={highlightPresets}
              showCustom={true}
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Link Button */}
      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-8 h-8',
              hasLink && 'bg-accent text-accent-foreground'
            )}
            title={hasSelection ? "Link selection" : "Add Link"}
          >
            <Link className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-3" 
          align="center"
          onMouseDown={handleMouseDown}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={linkTarget === '_blank'}
                onCheckedChange={(checked) => setLinkTarget(checked ? '_blank' : '_self')}
              />
              <Label className="text-xs">Open in new tab</Label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleLinkSave} className="flex-1">
                Apply
              </Button>
              {hasLink && (
                <Button size="sm" variant="outline" onClick={handleRemoveLink}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* More Options */}
      <Popover open={isMorePopoverOpen} onOpenChange={setIsMorePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'w-8 h-8',
              hasAdvancedStyles && 'bg-accent text-accent-foreground'
            )}
            title="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3" 
          align="end"
          onMouseDown={handleMouseDown}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">Advanced</span>
              {hasAdvancedStyles && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={handleResetAdvanced}
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Line Height</Label>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {currentLineHeight.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[currentLineHeight]}
                onValueChange={handleLineHeightChange}
                min={0.8}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Letter Spacing</Label>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {currentLetterSpacing.toFixed(1)}px
                </span>
              </div>
              <Slider
                value={[currentLetterSpacing]}
                onValueChange={handleLetterSpacingChange}
                min={-2}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Selection indicator */}
            {hasSelection && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ✓ Formatting will apply to selected text
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Close button - always show for manual dismissal */}
      <Separator orientation="vertical" className="h-6 mx-0.5" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onClose?.()}
        className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Close toolbar (Esc)"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>,
    document.body
  );
}
