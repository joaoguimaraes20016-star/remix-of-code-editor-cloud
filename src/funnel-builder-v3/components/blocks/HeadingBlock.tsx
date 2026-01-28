/**
 * Heading Block - Renders headings with HTML support
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface HeadingBlockProps {
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

export function HeadingBlock({ block, previewMode }: HeadingBlockProps) {
  const { size = 'xl', align = 'left', color, fontWeight = 'bold' } = block.props;

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

  const baseClasses = cn(
    'p-2',
    sizeClasses[size] || 'text-3xl',
    alignClasses[align] || 'text-left',
    weightClasses[fontWeight] || 'font-bold'
  );

  // If content has HTML, render it safely
  if (hasHtml(sanitized)) {
    return (
      <h2
        className={baseClasses}
        style={{ color: color || undefined }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <h2
      className={cn(baseClasses, isEmpty && 'text-muted-foreground italic')}
      style={{ color: color || undefined }}
    >
      {sanitized || (previewMode ? '' : 'Your Heading')}
    </h2>
  );
}
