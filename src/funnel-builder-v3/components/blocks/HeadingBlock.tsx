/**
 * Heading Block - Renders headings with HTML support and inline editing
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface HeadingBlockProps {
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

export function HeadingBlock({ block, isSelected, previewMode, onContentChange }: HeadingBlockProps) {
  const { size = 'xl', align = 'left', color, fontWeight = 'bold' } = block.props;
  const [isEditing, setIsEditing] = useState(false);
  const editRef = useRef<HTMLHeadingElement>(null);

  const sizeClasses: Record<string, string> = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  };

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const weightClasses: Record<string, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  }, [handleBlur]);

  const baseClasses = cn(
    'p-2 outline-none transition-all',
    sizeClasses[size] || 'text-3xl',
    alignClasses[align] || 'text-left',
    weightClasses[fontWeight] || 'font-bold',
    isEmpty && !isEditing && 'text-muted-foreground italic',
    isEditing && 'ring-2 ring-blue-500/50 rounded bg-white/5'
  );

  // Edit mode
  if (isEditing && !previewMode) {
    return (
      <h2
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        className={baseClasses}
        style={{ color: color || undefined }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {sanitized}
      </h2>
    );
  }

  // If content has HTML, render it safely
  if (hasHtml(sanitized)) {
    return (
      <h2
        className={cn(baseClasses, 'cursor-text')}
        style={{ color: color || undefined }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        onDoubleClick={handleDoubleClick}
      />
    );
  }

  return (
    <h2
      className={cn(baseClasses, !previewMode && 'cursor-text')}
      style={{ color: color || undefined }}
      onDoubleClick={handleDoubleClick}
    >
      {sanitized || (previewMode ? '' : 'Double-click to edit...')}
    </h2>
  );
}
