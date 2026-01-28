/**
 * Heading Block
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

export function HeadingBlock({ block, previewMode }: HeadingBlockProps) {
  const { size = 'xl', align = 'left', color, fontWeight = 'bold' } = block.props;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <h2
      className={cn(
        'p-2',
        sizeClasses[size] || 'text-3xl',
        alignClasses[align] || 'text-left',
        weightClasses[fontWeight] || 'font-bold',
        !block.content && 'text-muted-foreground italic'
      )}
      style={{ color: color || undefined }}
    >
      {block.content || (previewMode ? '' : 'Your Heading')}
    </h2>
  );
}
