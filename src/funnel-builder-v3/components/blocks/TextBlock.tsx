/**
 * Text Block - Renders text content with HTML support
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
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

export function TextBlock({ block, previewMode }: TextBlockProps) {
  const { size = 'md', align = 'left', color } = block.props;

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

  // If content has HTML, render it safely
  if (hasHtml(sanitized)) {
    return (
      <p
        className={cn(
          'p-2',
          sizeClasses[size] || 'text-base',
          alignClasses[align] || 'text-left'
        )}
        style={{ color: color || undefined }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <p
      className={cn(
        'p-2',
        sizeClasses[size] || 'text-base',
        alignClasses[align] || 'text-left',
        isEmpty && 'text-muted-foreground italic'
      )}
      style={{ color: color || undefined }}
    >
      {sanitized || (previewMode ? '' : 'Click to edit text...')}
    </p>
  );
}
