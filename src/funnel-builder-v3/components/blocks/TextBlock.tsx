/**
 * Text Block
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

export function TextBlock({ block, previewMode }: TextBlockProps) {
  const { size = 'md', align = 'left', color } = block.props;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <p
      className={cn(
        'p-2',
        sizeClasses[size] || 'text-base',
        alignClasses[align] || 'text-left',
        !block.content && 'text-muted-foreground italic'
      )}
      style={{ color: color || undefined }}
    >
      {block.content || (previewMode ? '' : 'Click to edit text...')}
    </p>
  );
}
