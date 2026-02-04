import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TextContent } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { InlineTextToolbar } from '@/funnel-builder-v3/editor/InlineTextToolbar';
import { sanitizeHtml, containsHtml, applyInlineStyle } from '@/funnel-builder-v3/lib/selection-utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface TextBlockProps {
  content: TextContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function TextBlock({ content, blockId, stepId, isPreview }: TextBlockProps) {
  // Add null/undefined checks with defaults to prevent missing text
  const { text = '', styles = {} } = content || {};
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const [isEditing, setIsEditing] = useState(false);
  const [toolbarPopoverOpen, setToolbarPopoverOpen] = useState(false);
  const elementRef = useRef<HTMLParagraphElement>(null);
  const originalValueRef = useRef(text);
  const toolbarPopoverOpenRef = useRef(false);

  const canEdit = blockId && stepId && !isPreview;

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'text',
    hintText: 'Click to edit text',
    isEditing // Disable overlay when editing
  });

  useEffect(() => {
    if (!isEditing) {
      originalValueRef.current = text;
    }
  }, [text, isEditing]);

  // Avoid stale-closure issues inside blur timeouts (popover state may change after blur fires)
  useEffect(() => {
    toolbarPopoverOpenRef.current = toolbarPopoverOpen;
  }, [toolbarPopoverOpen]);

  // Auto-enter edit mode when block is selected
  useEffect(() => {
    if (canEdit && funnelContext?.selectedBlockId === blockId && !isEditing) {
      setIsEditing(true);
      // Focus and select text when entering edit mode
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(elementRef.current);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [funnelContext?.selectedBlockId, blockId, canEdit, isEditing]);

  const handleSave = useCallback(() => {
    if (elementRef.current && blockId && stepId) {
      // Get innerHTML and sanitize it to preserve inline formatting
      const rawHtml = elementRef.current.innerHTML || '';
      const newHtml = sanitizeHtml(rawHtml).trim();
      
      // Check if content actually changed
      const oldHtml = sanitizeHtml(originalValueRef.current).trim();
      if (newHtml && newHtml !== oldHtml) {
        updateBlockContent(stepId, blockId, { text: newHtml });
      }
      // Don't revert innerHTML if unchanged - style changes (like gradients) may have been applied
    }
    setIsEditing(false);
  }, [blockId, stepId, updateBlockContent]);

  // Callback for when inline formatting changes (triggered by toolbar)
  const handleContentChange = useCallback(() => {
    // Content has been modified via execCommand, mark for save
    // We don't save immediately to allow for multiple formatting operations
  }, []);

  const handleDoubleClick = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  // Handle clicks outside the element to close editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the element itself
      if (elementRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the toolbar (it's portaled to body)
      const toolbar = document.querySelector('[data-inline-toolbar]');
      if (toolbar?.contains(target)) {
        return;
      }
      
      // Don't close if a popover is open (user is interacting with color picker, etc.)
      if (toolbarPopoverOpenRef.current) {
        return;
      }
      
      // Close editing and deselect block
      handleSave();
      funnelContext?.setSelectedBlockId(null);
    };

    // Add listener after a short delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;
    
    // Formatting shortcuts
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
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (elementRef.current) {
        elementRef.current.innerHTML = originalValueRef.current;
      }
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      // Don't close if a toolbar popover is open
      if (isEditing && !toolbarPopoverOpenRef.current) {
        handleSave();
      }
    }, 250);
  };

  const handleStyleChange = useCallback((updates: Partial<typeof styles>) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { 
        styles: { ...styles, ...updates } 
      });
    }
  }, [blockId, stepId, styles, updateBlockContent]);

  // Text gradient styles using background-clip technique
  const hasTextGradient = !!styles?.textGradient;
  
  const style: React.CSSProperties & { '--text-gradient'?: string } = {
    fontSize: styles?.fontSize,
    fontWeight: styles?.fontWeight,
    fontStyle: styles?.fontStyle,
    textDecoration: styles?.textDecoration,
    textAlign: styles?.textAlign || 'center', // Default to center if not set
    lineHeight: styles?.lineHeight,
    letterSpacing: styles?.letterSpacing ? `${styles.letterSpacing}px` : undefined,
    // Apply gradient via CSS variable (class handles clip) or solid color
    ...(hasTextGradient
      ? { '--text-gradient': styles.textGradient }
      : { color: styles?.color }),
  };

  // Use dangerouslySetInnerHTML for rich text, but only when content contains HTML
  // Ensure text is a string before processing
  const safeText = text || '';
  const hasHtmlContent = safeText && containsHtml(safeText);
  const contentProps = hasHtmlContent 
    ? { dangerouslySetInnerHTML: { __html: sanitizeHtml(safeText) } }
    : { children: safeText };

  const textElement = (
    <p
      ref={elementRef}
      style={style}
      className={cn(
        'outline-none transition-all duration-200',
        // Apply gradient clip utility when gradient is set
        hasTextGradient && 'text-gradient-clip',
        // Only apply text-foreground if no gradient and no explicit color
        !hasTextGradient && !styles?.color && 'text-foreground',
        canEdit && 'cursor-text hover:ring-2 hover:ring-primary/20 hover:ring-offset-2 rounded',
        isEditing && 'ring-2 ring-primary ring-offset-2 rounded bg-accent/50'
      )}
      onDoubleClick={canEdit ? handleDoubleClick : undefined}
      onKeyDown={isEditing ? handleKeyDown : undefined}
      onBlur={isEditing ? handleBlur : undefined}
      contentEditable={isEditing}
      suppressContentEditableWarning
      {...contentProps}
    />
  );

  const handleCloseToolbar = useCallback(() => {
    setIsEditing(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  const contentElement = (
    <>
      {textElement}
      {isEditing && canEdit && (
        <InlineTextToolbar
          elementRef={elementRef as React.RefObject<HTMLElement>}
          styles={styles || {}}
          onStyleChange={handleStyleChange}
          onPopoverOpenChange={setToolbarPopoverOpen}
          onContentChange={handleContentChange}
          onClose={handleCloseToolbar}
        />
      )}
    </>
  );

  // Wrap in link if URL is set and in preview mode (only for block-level links without inline HTML)
  if (isPreview && styles?.linkUrl && !hasHtmlContent) {
    return (
      <a 
        href={styles.linkUrl} 
        target={styles.linkTarget || '_blank'}
        rel={styles.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
        className="block"
      >
        {textElement}
      </a>
    );
  }

  return wrapWithOverlay(contentElement);
}
