import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RichTextToolbar } from './RichTextToolbar';
import { gradientToCSS, cloneGradient, defaultGradient } from './modals';
import type { GradientValue } from './modals';
import { parseHighlightedText, hasHighlightSyntax } from '../utils/textHighlight';
import { applyStylesToSelection, hasSelectionInElement, sanitizeStyledHTML, htmlToPlainText, containsHTML, mergeAdjacentStyledSpans } from '../utils/selectionStyles';
export interface TextStyles {
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  // Extended styles for Framer-level editing
  fontFamily?: string;
  textColor?: string;
  textFillType?: 'solid' | 'gradient';
  textGradient?: GradientValue;
  textShadow?: string;
  // Highlight styles for {{text}} syntax
  highlightColor?: string;
  highlightGradient?: GradientValue;
  highlightUseGradient?: boolean;
}

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string, styles?: Partial<TextStyles>) => void;
  elementType: 'text' | 'heading' | 'button';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  initialStyles?: Partial<TextStyles>;
  onEditingChange?: (isEditing: boolean) => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  elementType,
  className = '',
  placeholder = 'Click to edit...',
  disabled = false,
  initialStyles,
  onEditingChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  
  // Track which properties have been explicitly modified by the user
  const [modifiedProps, setModifiedProps] = useState<Set<keyof TextStyles>>(new Set());
  
  // Current styles state - initialize with cloned values to prevent shared references
  const [styles, setStyles] = useState<Partial<TextStyles>>(() => {
    if (!initialStyles) return {};
    // Deep clone gradient objects on initial state
    const cloned: Partial<TextStyles> = { ...initialStyles };
    if (initialStyles.textGradient) {
      cloned.textGradient = cloneGradient(initialStyles.textGradient);
    }
    if (initialStyles.highlightGradient) {
      cloned.highlightGradient = cloneGradient(initialStyles.highlightGradient);
    }
    return cloned;
  });
  
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Deep compare for gradient objects
  const gradientEquals = (a: GradientValue | undefined, b: GradientValue | undefined): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.type !== b.type || a.angle !== b.angle) return false;
    if (a.stops.length !== b.stops.length) return false;
    for (let i = 0; i < a.stops.length; i++) {
      if (a.stops[i].color !== b.stops[i].color || a.stops[i].position !== b.stops[i].position) {
        return false;
      }
    }
    return true;
  };

  // Update styles when initialStyles changes - with proper deep comparison for gradients
  useEffect(() => {
    if (initialStyles) {
      const needsUpdate = 
        initialStyles.textFillType !== styles.textFillType ||
        initialStyles.textColor !== styles.textColor ||
        !gradientEquals(initialStyles.textGradient, styles.textGradient) ||
        initialStyles.fontSize !== styles.fontSize ||
        initialStyles.fontWeight !== styles.fontWeight ||
        initialStyles.fontFamily !== styles.fontFamily ||
        initialStyles.textShadow !== styles.textShadow ||
        initialStyles.fontStyle !== styles.fontStyle ||
        initialStyles.textDecoration !== styles.textDecoration ||
        initialStyles.textAlign !== styles.textAlign ||
        initialStyles.highlightColor !== styles.highlightColor ||
        initialStyles.highlightUseGradient !== styles.highlightUseGradient ||
        !gradientEquals(initialStyles.highlightGradient, styles.highlightGradient);
      
      if (needsUpdate) {
        // Deep clone the initialStyles to prevent shared references
        const clonedStyles: Partial<TextStyles> = { ...initialStyles };
        if (initialStyles.textGradient) {
          clonedStyles.textGradient = cloneGradient(initialStyles.textGradient);
        }
        if (initialStyles.highlightGradient) {
          clonedStyles.highlightGradient = cloneGradient(initialStyles.highlightGradient);
        }
        
        setStyles(prev => ({ ...prev, ...clonedStyles }));
        // Mark initial styles as modified so they persist
        const keys = Object.keys(initialStyles) as (keyof TextStyles)[];
        setModifiedProps(prev => {
          const next = new Set(prev);
          keys.forEach(k => next.add(k));
          return next;
        });
      }
    }
  }, [
    initialStyles?.textFillType, 
    initialStyles?.textColor, 
    // Use JSON.stringify for gradient to ensure deep change detection
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(initialStyles?.textGradient),
    initialStyles?.fontSize,
    initialStyles?.fontWeight,
    initialStyles?.fontFamily,
    initialStyles?.textShadow,
    initialStyles?.fontStyle,
    initialStyles?.textDecoration,
    initialStyles?.textAlign,
    initialStyles?.highlightColor,
    initialStyles?.highlightUseGradient,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(initialStyles?.highlightGradient),
  ]);

  // Notify parent when editing state changes
  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  // Handle double click to start editing
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setShowToolbar(true);
    
    // Focus the contenteditable
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }, [disabled]);

  // Handle blur to stop editing - only emit content, not styles (styles are emitted on change)
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if clicking on toolbar (including portaled popovers)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    
    // Don't blur if clicking on the toolbar itself
    if (relatedTarget?.closest('.rich-text-toolbar')) return;
    
    // Don't blur if clicking on Radix portaled content (popovers, selects, etc.)
    // These are rendered to document.body but have data attributes we can check
    if (relatedTarget?.closest('[data-radix-popper-content-wrapper]')) return;
    if (relatedTarget?.closest('[data-radix-select-content]')) return;
    if (relatedTarget?.closest('[data-radix-popover-content]')) return;
    
    // Also check if the active element is inside a popover (for color inputs, etc.)
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement?.closest('[data-radix-popper-content-wrapper]')) return;
    
    // Additional check: if relatedTarget is null (clicking non-focusable elements like sliders),
    // check if any Radix popover is currently open in the DOM
    if (!relatedTarget) {
      const openPopover = document.querySelector('[data-radix-popper-content-wrapper]');
      if (openPopover) return;
    }
    
    setIsEditing(false);
    setShowToolbar(false);
    
    if (contentRef.current) {
      // Clean up adjacent spans with same styles
      mergeAdjacentStyledSpans(contentRef.current);
      
      // Check if content has inline styled spans - if so, preserve HTML
      const hasInlineStyles = contentRef.current.querySelector('span[style]') !== null;
      
      if (hasInlineStyles) {
        // Save sanitized HTML to preserve inline styling
        const htmlContent = sanitizeStyledHTML(contentRef.current.innerHTML);
        onChange(htmlContent);
      } else {
        // Plain text - just save the text content
        const newValue = contentRef.current.innerText;
        onChange(newValue);
      }
    }
  }, [onChange]);

  // Update toolbar position based on current selection (snaps to highlighted text)
  const updateToolbarPosition = useCallback(() => {
    const editorEl = contentRef.current;
    if (!editorEl) return;

    const viewportPadding = 12;
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 44;
    const gap = 10;

    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

    // Only react to selections inside this editor.
    const selectionInside =
      !!range &&
      (editorEl.contains(range.commonAncestorContainer) ||
        // commonAncestorContainer can be a text node; contains() can be false in some cases
        editorEl.contains(sel?.anchorNode ?? null) ||
        editorEl.contains(sel?.focusNode ?? null));

    let rect: DOMRect | null = null;

    if (range && selectionInside) {
      // Prefer client rects (more stable for multi-line selections)
      const clientRects = Array.from(range.getClientRects?.() ?? []);
      rect =
        clientRects.find((r) => r.width > 0 && r.height > 0) ??
        clientRects[0] ??
        range.getBoundingClientRect();

      // Some browsers return 0-sized rect for collapsed caret; fall back to container.
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        rect = null;
      }
    }

    // Fallback: position above the whole element (when nothing selected)
    if (!rect && containerRef.current) {
      rect = containerRef.current.getBoundingClientRect();
    }

    if (!rect) return;

    const left = rect.left + rect.width / 2;

    // Try above selection; if there's not enough space, place below.
    const aboveTop = rect.top - toolbarHeight - gap;
    const belowTop = rect.bottom + gap;
    const top = aboveTop < viewportPadding ? belowTop : aboveTop;

    setToolbarPosition({
      top: Math.max(viewportPadding, top),
      left,
    });
  }, []);

  useEffect(() => {
    if (!showToolbar || !isEditing) return;

    let rafId = 0;
    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateToolbarPosition);
    };

    // Initial snap
    schedule();

    document.addEventListener('selectionchange', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [showToolbar, isEditing, updateToolbarPosition]);

  // Handle text selection for toolbar (mouse selection inside the editor)
  const handleSelect = useCallback(() => {
    if (isEditing) updateToolbarPosition();
  }, [isEditing, updateToolbarPosition]);

  // Apply style changes - handle both selection-based and whole-block styling
  const handleStyleChange = useCallback((newStyles: Partial<TextStyles>) => {
    const editorEl = contentRef.current;
    
    // Check if there's a text selection inside the editor
    const hasSelection = editorEl && hasSelectionInElement(editorEl);
    
    // Build style options for selection-based styling
    const buildSelectionOptions = (): Parameters<typeof applyStylesToSelection>[0] | null => {
      const options: Record<string, unknown> = {};
      
      // Color/gradient
      if (newStyles.textFillType === 'gradient') {
        options.gradient = newStyles.textGradient || styles.textGradient || defaultGradient;
      } else if (newStyles.textColor) {
        options.color = newStyles.textColor;
      } else if (newStyles.textFillType === 'solid' && (newStyles.textColor || styles.textColor)) {
        options.color = newStyles.textColor || styles.textColor;
      }
      
      // Font formatting
      if (newStyles.fontWeight) {
        const weightMap: Record<string, string> = { normal: '400', medium: '500', semibold: '600', bold: '700', black: '900' };
        options.fontWeight = weightMap[newStyles.fontWeight] || newStyles.fontWeight;
      }
      if (newStyles.fontStyle) {
        options.fontStyle = newStyles.fontStyle;
      }
      if (newStyles.textDecoration) {
        options.textDecoration = newStyles.textDecoration;
      }
      
      return Object.keys(options).length > 0 ? options as Parameters<typeof applyStylesToSelection>[0] : null;
    };
    
    // Try to apply to selection first (for color, gradient, and formatting)
    if (hasSelection) {
      const shouldApplyToSelection = 
        newStyles.textColor !== undefined ||
        newStyles.textGradient !== undefined ||
        newStyles.textFillType !== undefined ||
        newStyles.fontWeight !== undefined ||
        newStyles.fontStyle !== undefined ||
        newStyles.textDecoration !== undefined;
      
      if (shouldApplyToSelection) {
        const styleOptions = buildSelectionOptions();
        
        if (styleOptions) {
          const applied = applyStylesToSelection(styleOptions);
          
          if (applied && editorEl) {
            // Clean up and save HTML
            mergeAdjacentStyledSpans(editorEl);
            const htmlContent = sanitizeStyledHTML(editorEl.innerHTML);
            onChange(htmlContent, { _hasInlineStyles: true } as Partial<TextStyles>);
            return; // Don't update block-level styles since we applied to selection
          }
        }
      }
    }
    
    // No selection or style that should apply to whole block - apply block-level styles
    // Deep clone gradients to prevent shared references
    const clonedStyles: Partial<TextStyles> = {};
    
    // Copy all scalar properties
    if (newStyles.fontSize !== undefined) clonedStyles.fontSize = newStyles.fontSize;
    if (newStyles.fontWeight !== undefined) clonedStyles.fontWeight = newStyles.fontWeight;
    if (newStyles.fontStyle !== undefined) clonedStyles.fontStyle = newStyles.fontStyle;
    if (newStyles.textDecoration !== undefined) clonedStyles.textDecoration = newStyles.textDecoration;
    if (newStyles.textAlign !== undefined) clonedStyles.textAlign = newStyles.textAlign;
    if (newStyles.fontFamily !== undefined) clonedStyles.fontFamily = newStyles.fontFamily;
    if (newStyles.textColor !== undefined) clonedStyles.textColor = newStyles.textColor;
    if (newStyles.textFillType !== undefined) clonedStyles.textFillType = newStyles.textFillType;
    if (newStyles.textShadow !== undefined) clonedStyles.textShadow = newStyles.textShadow;
    if (newStyles.highlightColor !== undefined) clonedStyles.highlightColor = newStyles.highlightColor;
    if (newStyles.highlightUseGradient !== undefined) clonedStyles.highlightUseGradient = newStyles.highlightUseGradient;
    
    // Deep clone gradient objects to prevent shared references
    if (newStyles.textGradient) {
      clonedStyles.textGradient = cloneGradient(newStyles.textGradient);
    }
    if (newStyles.highlightGradient) {
      clonedStyles.highlightGradient = cloneGradient(newStyles.highlightGradient);
    }
    
    // Handle case where fillType is gradient but no gradient exists
    // This prevents the "white flash" when switching to gradient mode
    if (clonedStyles.textFillType === 'gradient' && !clonedStyles.textGradient && !styles.textGradient) {
      clonedStyles.textGradient = cloneGradient(defaultGradient);
    }
    
    // Update local state
    setStyles(prev => ({ ...prev, ...clonedStyles }));
    
    // Track which properties are now modified
    const changedKeys = Object.keys(clonedStyles) as (keyof TextStyles)[];
    setModifiedProps(prev => {
      const next = new Set(prev);
      changedKeys.forEach(k => next.add(k));
      return next;
    });
    
    // Emit ONLY the properties that were just changed (already cloned)
    // Always call onChange - use contentRef.innerText if available, otherwise use value prop
    const currentValue = contentRef.current?.innerText ?? value;
    onChange(currentValue, clonedStyles);
  }, [styles, value, onChange]);

  // Get CSS classes based on styles
  const getStyleClasses = () => {
    const classes: string[] = [];
    
    // Font size (extended for hero headlines)
    switch (styles.fontSize) {
      case 'sm': classes.push('text-sm'); break;
      case 'md': classes.push('text-base'); break;
      case 'lg': classes.push('text-lg'); break;
      case 'xl': classes.push('text-xl'); break;
      case '2xl': classes.push('text-2xl'); break;
      case '3xl': classes.push('text-3xl'); break;
      case '4xl': classes.push('text-4xl'); break;
      case '5xl': classes.push('text-5xl'); break;
    }
    
    // Font weight (extended)
    switch (styles.fontWeight) {
      case 'normal': classes.push('font-normal'); break;
      case 'medium': classes.push('font-medium'); break;
      case 'semibold': classes.push('font-semibold'); break;
      case 'bold': classes.push('font-bold'); break;
      case 'black': classes.push('font-black'); break;
    }
    
    // Font style
    if (styles.fontStyle === 'italic') classes.push('italic');
    
    // Text decoration
    if (styles.textDecoration === 'underline') classes.push('underline');
    
    // Text align
    switch (styles.textAlign) {
      case 'left': classes.push('text-left'); break;
      case 'center': classes.push('text-center'); break;
      case 'right': classes.push('text-right'); break;
    }
    
    return classes.join(' ');
  };

  // Get base gradient styles (for direct application to text)
  const getGradientStyles = (): React.CSSProperties => {
    if (styles.textFillType === 'gradient' && styles.textGradient) {
      return {
        // Use backgroundImage instead of background to avoid CSS shorthand conflicts
        backgroundImage: gradientToCSS(styles.textGradient),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } as React.CSSProperties;
    }
    // Fallback: if fillType is gradient but no gradient exists, use default
    if (styles.textFillType === 'gradient') {
      return {
        backgroundImage: gradientToCSS(defaultGradient),
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } as React.CSSProperties;
    }
    return {};
  };

  // Get inline styles for extended properties
  // When editing AND using gradient, apply gradient to the contenteditable div itself
  const getInlineStyles = (): React.CSSProperties => {
    const inlineStyles: React.CSSProperties = {};

    // Font family
    if (styles.fontFamily && styles.fontFamily !== 'inherit') {
      inlineStyles.fontFamily = styles.fontFamily;
    }

    // Font size - apply as inline style for pixel values (Tailwind classes handle presets)
    if (styles.fontSize) {
      const presetSizes = new Set(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']);
      if (!presetSizes.has(styles.fontSize)) {
        inlineStyles.fontSize = styles.fontSize;
      }
    }

    // Font weight - ALWAYS apply as inline style for reliability
    // (Tailwind classes are backup but inline takes precedence)
    if (styles.fontWeight) {
      const weightMap: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 };
      inlineStyles.fontWeight = weightMap[styles.fontWeight] || 400;
    }

    // Font style (italic)
    if (styles.fontStyle === 'italic') {
      inlineStyles.fontStyle = 'italic';
    }

    // When editing with gradient, apply gradient styles to the container div
    // This ensures the gradient is visible while the user is editing
    if (isEditing && styles.textFillType === 'gradient') {
      const gradientValue = styles.textGradient || defaultGradient;
      inlineStyles.backgroundImage = gradientToCSS(gradientValue);
      inlineStyles.WebkitBackgroundClip = 'text';
      inlineStyles.WebkitTextFillColor = 'transparent';
      (inlineStyles as Record<string, string>).backgroundClip = 'text';
    } else if (styles.textFillType !== 'gradient') {
      // Text color (only if not gradient) - apply even if undefined to ensure color shows
      if (styles.textColor) {
        inlineStyles.color = styles.textColor;
      }
    }

    // Text shadow
    if (styles.textShadow && styles.textShadow !== 'none') {
      const shadowMap: Record<string, string> = {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.15)',
        medium: '0 2px 4px rgba(0, 0, 0, 0.25)',
        strong: '0 4px 8px rgba(0, 0, 0, 0.4)',
        glow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)',
        neon: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
        depth: '0 1px 0 rgba(0, 0, 0, 0.1), 0 2px 0 rgba(0, 0, 0, 0.08), 0 3px 0 rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.15)',
      };
      inlineStyles.textShadow = shadowMap[styles.textShadow];
    }

    return inlineStyles;
  };

  // Get highlight styles for {{text}} syntax
  const getHighlightStyles = (): React.CSSProperties => {
    const highlightStyles: React.CSSProperties = {};
    
    if (styles.highlightUseGradient && styles.highlightGradient) {
      // Use backgroundImage to avoid CSS shorthand conflicts
      highlightStyles.backgroundImage = gradientToCSS(styles.highlightGradient);
      highlightStyles.WebkitBackgroundClip = 'text';
      highlightStyles.WebkitTextFillColor = 'transparent';
      (highlightStyles as Record<string, string>).backgroundClip = 'text';
    } else if (styles.highlightColor) {
      highlightStyles.color = styles.highlightColor;
    } else {
      // Default highlight: use builder accent (pink/magenta) instead of gold
      highlightStyles.color = 'hsl(var(--builder-accent-secondary))';
    }
    
    return highlightStyles;
  };
  
  // Get non-highlighted segment styles (applies base gradient to non-highlighted text)
  const getNonHighlightStyles = (): React.CSSProperties => {
    // For non-highlighted segments when base is gradient, apply gradient per span
    if (styles.textFillType === 'gradient' && styles.textGradient) {
      return {
        ...getGradientStyles(),
        display: 'inline', // Important: inline-block can break text flow
      };
    }
    // Otherwise just use the text color
    if (styles.textColor) {
      return { color: styles.textColor };
    }
    return {};
  };

  // Check if content has highlight syntax (only for plain text values)
  const isHtmlContent = value && containsHTML(value);
  const contentHasHighlights = value && !isHtmlContent && hasHighlightSyntax(value);

  // Render content with highlight syntax support and HTML preservation
  const renderContent = () => {
    if (!value) {
      return !isEditing ? placeholder : '';
    }
    
    // When editing, check if the value contains HTML (inline styled spans)
    if (isEditing) {
      // If value is HTML, we need to render it using dangerouslySetInnerHTML
      // The contentEditable will handle the HTML natively
      if (isHtmlContent) {
        // Return null here - we'll use dangerouslySetInnerHTML on the div instead
        return null;
      }
      return value;
    }
    
    // When not editing and content is HTML, render it directly
    if (isHtmlContent) {
      // Return null - will use dangerouslySetInnerHTML
      return null;
    }
    
    // When not editing, render highlights (for legacy {{text}} syntax)
    if (contentHasHighlights) {
      const segments = parseHighlightedText(value);
      const highlightStyles = getHighlightStyles();
      const nonHighlightStyles = getNonHighlightStyles();
      
      return segments.map((segment, index) => {
        if (segment.isHighlighted) {
          return (
            <span key={index} style={highlightStyles} className="font-bold">
              {segment.text}
            </span>
          );
        }
        // Apply base gradient/color to non-highlighted segments
        return (
          <span key={index} style={nonHighlightStyles}>
            {segment.text}
          </span>
        );
      });
    }
    
    // No highlights - check if gradient should be applied
    if (styles.textFillType === 'gradient') {
      // Use existing gradient or fallback to default
      const gradientValue = styles.textGradient || defaultGradient;
      return (
        <span style={{
          backgroundImage: gradientToCSS(gradientValue),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } as React.CSSProperties}>
          {value}
        </span>
      );
    }
    
    // Solid color - apply via inline style if set
    if (styles.textColor) {
      return (
        <span style={{ color: styles.textColor }}>
          {value}
        </span>
      );
    }
    
    return value;
  };
  
  // Determine if we should use dangerouslySetInnerHTML
  const useHtmlRendering = isHtmlContent;

  return (
    <div ref={containerRef} className="relative">
      {/* Floating Rich Text Toolbar */}
      {showToolbar && (
        <RichTextToolbar
          ref={toolbarRef}
          styles={styles}
          onChange={handleStyleChange}
          position={toolbarPosition}
          onClose={() => setShowToolbar(false)}
        />
      )}
      
      {/* Editable Content */}
      {useHtmlRendering ? (
        <div
          ref={contentRef}
          contentEditable={isEditing && !disabled}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          onSelect={handleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
              setShowToolbar(false);
              contentRef.current?.blur();
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setIsEditing(false);
              setShowToolbar(false);
              contentRef.current?.blur();
            }
          }}
          style={getInlineStyles()}
          className={`
            outline-none transition-all duration-150
            ${getStyleClasses()}
            ${isEditing 
              ? 'ring-2 ring-[hsl(var(--builder-accent))] rounded px-1 -mx-1 bg-white/5' 
              : 'cursor-pointer hover:ring-1 hover:ring-[hsl(var(--builder-accent-muted))] rounded'
            }
            ${!value && !isEditing ? 'text-gray-400' : ''}
            ${className}
          `}
          dangerouslySetInnerHTML={{ __html: sanitizeStyledHTML(value || '') }}
        />
      ) : (
        <div
          ref={contentRef}
          contentEditable={isEditing && !disabled}
          suppressContentEditableWarning
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
          onSelect={handleSelect}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
              setShowToolbar(false);
              contentRef.current?.blur();
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setIsEditing(false);
              setShowToolbar(false);
              contentRef.current?.blur();
            }
          }}
          style={getInlineStyles()}
          className={`
            outline-none transition-all duration-150
            ${getStyleClasses()}
            ${isEditing 
              ? 'ring-2 ring-[hsl(var(--builder-accent))] rounded px-1 -mx-1 bg-white/5' 
              : 'cursor-pointer hover:ring-1 hover:ring-[hsl(var(--builder-accent-muted))] rounded'
            }
            ${!value && !isEditing ? 'text-gray-400' : ''}
            ${className}
          `}
        >
          {renderContent()}
        </div>
      )}
    </div>
  );
};
