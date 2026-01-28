/**
 * Preview Text Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface PreviewTextBlockProps {
  block: Block;
  settings: FunnelSettings;
}

export function PreviewTextBlock({ block }: PreviewTextBlockProps) {
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
        'leading-relaxed',
        sizeClasses[size],
        alignClasses[align]
      )}
      style={{ color: color || 'inherit' }}
    >
      {block.content || 'Text content'}
    </p>
  );
}
