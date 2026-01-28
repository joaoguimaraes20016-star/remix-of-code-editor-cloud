/**
 * Preview Heading Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface PreviewHeadingBlockProps {
  block: Block;
  settings: FunnelSettings;
}

export function PreviewHeadingBlock({ block }: PreviewHeadingBlockProps) {
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
        'leading-tight',
        sizeClasses[size],
        alignClasses[align],
        weightClasses[fontWeight]
      )}
      style={{ color: color || 'inherit' }}
    >
      {block.content || 'Heading'}
    </h2>
  );
}
