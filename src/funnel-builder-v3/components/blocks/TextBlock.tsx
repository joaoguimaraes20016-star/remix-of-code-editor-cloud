/**
 * Text Block - Renders text content with HTML support and inline editing
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
  onContentChange?: (content: string) => void;
}

// Sanitize content by stripping concatenated metadata
function sanitizeContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/\s*fontSize:\d+px\s*/g, '')
    .replace(/\s*textAlign:\w+\s*/g, '')
    .replace(/\s*placeholder:[^<]*/g, '')
    .trim();
}

// Check if content contains HTML tags
function hasHtml(content: string): boolean {
  return /<[^>]+>/.test(content);
}

export function TextBlock({ block, isSelected, previewMode, onContentChange }: TextBlockProps) {
  const { size = 'md', align = 'left', color } = block.props;
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLParagraphElement>(null);

  const sizeClasses: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const content = block.content || '';
  const sanitized = sanitizeContent(content);
  const isEmpty = !sanitized;

  // Handle double-click to enter edit mode
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (previewMode) return;
    e.stopPropagation();
    setIsEditing(true);
  }, [previewMode]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      // Select all text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // Handle blur to save and exit edit mode
  const handleBlur = useCallback(() => {
    if (editRef.current && onContentChange) {
      const newContent = editRef.current.innerText || '';
      if (newContent !== sanitized) {
        onContentChange(newContent);
      }
    }
    setIsEditing(false);
  }, [onContentChange, sanitized]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  }, [handleBlur]);

  const baseClasses = cn(
    'p-2 outline-none transition-all',
    sizeClasses[size] || 'text-base',
    alignClasses[align] || 'text-left',
    isEmpty && !isEditing && 'text-muted-foreground italic',
    isEditing && 'ring-2 ring-blue-500/50 rounded bg-white/5'
  );

  // Edit mode
  if (isEditing && !previewMode) {
    return (
      <p
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        className={baseClasses}
        style={{ color: color || undefined }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {sanitized}
      </p>
    );
  }

  // If content has HTML, render it safely
  if (hasHtml(sanitized)) {
    return (
      <p
        className={cn(baseClasses, 'cursor-text')}
        style={{ color: color || undefined }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        onDoubleClick={handleDoubleClick}
      />
    );
  }

  return (
    <p
      className={cn(baseClasses, !previewMode && 'cursor-text')}
      style={{ color: color || undefined }}
      onDoubleClick={handleDoubleClick}
    >
      {sanitized || (previewMode ? '' : 'Double-click to edit...')}
    </p>
  );
}
