import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { InlineTextToolbar } from '@/components/editor/InlineTextToolbar';
import { sanitizeHtml, containsHtml, applyInlineStyle } from '@/lib/selection-utils';
import { TextStyles } from '@/types/funnel';

export interface EditableTextProps {
  /** The text/html content to display and edit */
  value: string;
  /** Called when content changes (on blur/save) */
  onChange: (newValue: string) => void;
  /** Additional className for the element */
  className?: string;
  /** Element type to render */
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote' | 'label';
  /** When true, editing is disabled (preview mode) */
  isPreview?: boolean;
  /** Text styles for the toolbar (optional - enables rich text) */
  styles?: TextStyles;
  /** Called when styles change via toolbar */
  onStyleChange?: (updates: Partial<TextStyles>) => void;
  /** Whether to show the floating toolbar (default: true) */
  showToolbar?: boolean;
  /** Whether to use rich text HTML storage (default: false = plain text) */
  richText?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether to save on Enter key (default: true for single-line) */
  singleLine?: boolean;
}

export const EditableText = memo(function EditableText({
  value,
  onChange,
  className,
  as: Component = 'span',
  isPreview = false,
  styles,
  onStyleChange,
  showToolbar = true,
  richText = false,
  placeholder,
  singleLine = true,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [toolbarPopoverOpen, setToolbarPopoverOpen] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const originalValueRef = useRef(value);
  const toolbarPopoverOpenRef = useRef(false);

  const canEdit = !isPreview;

  // Keep original value in sync when not editing
  useEffect(() => {
    if (!isEditing) {
      originalValueRef.current = value;
    }
  }, [value, isEditing]);

  // Track popover state for blur handling
  useEffect(() => {
    toolbarPopoverOpenRef.current = toolbarPopoverOpen;
  }, [toolbarPopoverOpen]);

  const handleSave = useCallback(() => {
    if (elementRef.current) {
      let newValue: string;
      
      if (richText) {
        // Get innerHTML and sanitize for rich text
        const rawHtml = elementRef.current.innerHTML || '';
        newValue = sanitizeHtml(rawHtml).trim();
      } else {
        // Get textContent for plain text
        newValue = elementRef.current.textContent?.trim() || '';
      }

      // Check if content actually changed
      const oldValue = richText 
        ? sanitizeHtml(originalValueRef.current).trim()
        : originalValueRef.current.trim();
        
      if (newValue && newValue !== oldValue) {
        onChange(newValue);
      } else if (elementRef.current) {
        // Restore original if no change or empty
        if (richText && containsHtml(originalValueRef.current)) {
          elementRef.current.innerHTML = originalValueRef.current;
        } else {
          elementRef.current.textContent = originalValueRef.current;
        }
      }
    }
    setIsEditing(false);
  }, [onChange, richText]);

  const handleDoubleClick = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.focus();
        // Select all text
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    // Rich text formatting shortcuts
    if (richText && showToolbar) {
      if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        applyInlineStyle('bold');
        return;
      }
      if (isMod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        applyInlineStyle('italic');
        return;
      }
      if (isMod && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        applyInlineStyle('underline');
        return;
      }
    }

    // Save on Enter (for single-line)
    if (singleLine && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Restore original
      if (elementRef.current) {
        if (richText && containsHtml(originalValueRef.current)) {
          elementRef.current.innerHTML = originalValueRef.current;
        } else {
          elementRef.current.textContent = originalValueRef.current;
        }
      }
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      // Don't close if toolbar popover is open
      if (isEditing && !toolbarPopoverOpenRef.current) {
        handleSave();
      }
    }, 250);
  };

  const handleStyleChange = useCallback((updates: Partial<TextStyles>) => {
    onStyleChange?.(updates);
  }, [onStyleChange]);

  const handleContentChange = useCallback(() => {
    // Content modified via execCommand - will be saved on blur
  }, []);

  // Build style object with gradient support
  const hasTextGradient = !!styles?.textGradient;
  const style: React.CSSProperties & { '--text-gradient'?: string } = {
    ...(styles?.fontSize && { fontSize: styles.fontSize }),
    ...(styles?.fontWeight && { fontWeight: styles.fontWeight }),
    ...(styles?.fontStyle && { fontStyle: styles.fontStyle }),
    ...(styles?.textAlign && { textAlign: styles.textAlign }),
    ...(styles?.lineHeight && { lineHeight: styles.lineHeight }),
    ...(styles?.letterSpacing && { letterSpacing: `${styles.letterSpacing}px` }),
    // Apply gradient via CSS variable (class handles clip) or solid color
    ...(hasTextGradient
      ? { '--text-gradient': styles.textGradient }
      : styles?.color ? { color: styles.color } : {}),
  };

  // Content rendering
  const hasHtmlContent = richText && containsHtml(value);
  const contentProps = hasHtmlContent
    ? { dangerouslySetInnerHTML: { __html: sanitizeHtml(value) } }
    : { children: value || placeholder };

  const isEmpty = !value || value.trim() === '';

  const editableElement = React.createElement(
    Component,
    {
      ref: elementRef,
      style,
      className: cn(
        'outline-none transition-all duration-150',
        // Apply gradient clip utility when gradient is set
        hasTextGradient && 'text-gradient-clip',
        // Prevent accidental selection highlighting in editor mode unless actively editing
        canEdit && !isEditing && 'select-none',
        isEditing && 'select-text',
        isEmpty && !isEditing && 'text-muted-foreground/60',
        canEdit && 'cursor-text hover:bg-accent/30 rounded px-0.5 -mx-0.5',
        isEditing && 'bg-accent/50 ring-1 ring-primary/30 rounded px-0.5 -mx-0.5',
        className
      ),
      onDoubleClick: canEdit ? handleDoubleClick : undefined,
      onKeyDown: isEditing ? handleKeyDown : undefined,
      onBlur: isEditing ? handleBlur : undefined,
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
      'data-placeholder': placeholder,
      ...contentProps,
    }
  );

  // Show toolbar only when editing and enabled
  const shouldShowToolbar = isEditing && canEdit && showToolbar && richText && styles && onStyleChange;

  const handleCloseToolbar = useCallback(() => {
    setIsEditing(false);
    // Clear selection when closing toolbar
    window.getSelection()?.removeAllRanges();
  }, []);

  return (
    <>
      {editableElement}
      {shouldShowToolbar && (
        <InlineTextToolbar
          elementRef={elementRef as React.RefObject<HTMLElement>}
          styles={styles}
          onStyleChange={handleStyleChange}
          onPopoverOpenChange={setToolbarPopoverOpen}
          onContentChange={handleContentChange}
          onClose={handleCloseToolbar}
        />
      )}
    </>
  );
});
