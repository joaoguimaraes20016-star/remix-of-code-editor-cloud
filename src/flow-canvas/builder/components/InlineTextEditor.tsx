import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RichTextToolbar } from './RichTextToolbar';
import { gradientToCSS, cloneGradient, defaultGradient } from './modals';
import type { GradientValue } from './modals';
import { parseHighlightedText, hasHighlightSyntax } from '../utils/textHighlight';

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
      const newValue = contentRef.current.innerText;
      // Only emit content on blur - styles are emitted immediately on toolbar change
      onChange(newValue);
    }
  }, [onChange]);

  // Update toolbar position based on selection
  const updateToolbarPosition = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setToolbarPosition({
      top: rect.top - 48, // Above the element
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    if (showToolbar) {
      updateToolbarPosition();
      window.addEventListener('resize', updateToolbarPosition);
      return () => window.removeEventListener('resize', updateToolbarPosition);
    }
  }, [showToolbar, updateToolbarPosition]);

  // Handle text selection for toolbar
  const handleSelect = useCallback(() => {
    if (isEditing) {
      updateToolbarPosition();
    }
  }, [isEditing, updateToolbarPosition]);

  // Apply style changes - ONLY emit the properties that were explicitly changed
  const handleStyleChange = useCallback((newStyles: Partial<TextStyles>) => {
    // Deep clone gradients to prevent shared references - use explicit property copying
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
    if (contentRef.current) {
      const currentValue = contentRef.current.innerText || value;
      onChange(currentValue, clonedStyles);
    }
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

  // Get inline styles for extended properties - NEVER apply gradient here
  // Gradients are always handled in renderContent() to ensure proper text clipping
  const getInlineStyles = (): React.CSSProperties => {
    const inlineStyles: React.CSSProperties = {};
    
    // Font family
    if (styles.fontFamily && styles.fontFamily !== 'inherit') {
      inlineStyles.fontFamily = styles.fontFamily;
    }
    
    // Text color (only if not gradient)
    if (styles.textColor && styles.textFillType !== 'gradient') {
      inlineStyles.color = styles.textColor;
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
      // Default highlight: gold/accent color
      highlightStyles.color = '#F59E0B';
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

  // Check if content has highlight syntax
  const contentHasHighlights = value && hasHighlightSyntax(value);

  // Render content with highlight syntax support
  const renderContent = () => {
    if (!value) {
      return !isEditing ? placeholder : '';
    }
    
    // When editing, show raw text (including {{}} syntax)
    if (isEditing) {
      return value;
    }
    
    // When not editing, render highlights
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

  return (
    <div ref={containerRef} className="relative">
      {/* Floating Rich Text Toolbar */}
      {showToolbar && (
        <RichTextToolbar
          styles={styles}
          onChange={handleStyleChange}
          position={toolbarPosition}
          onClose={() => setShowToolbar(false)}
        />
      )}
      
      {/* Editable Content */}
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
    </div>
  );
};
