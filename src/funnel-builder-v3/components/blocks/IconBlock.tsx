/**
 * Icon Block - Renders Lucide icons from name string
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { icons } from 'lucide-react';

interface IconBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function IconBlock({ block, primaryColor }: IconBlockProps) {
  const iconName = block.content || block.props?.icon || 'HelpCircle';
  const size = block.props?.size || 'md';
  const color = block.props?.color || primaryColor;
  const align = block.props?.align || 'center';

  // Map size to pixel values
  const sizeMap: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16',
  };

  const alignClasses: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  // Get the icon component safely - use CircleHelp as fallback (HelpCircle is deprecated)
  const IconComponent = icons[iconName as keyof typeof icons] || icons.CircleHelp;

  return (
    <div className={cn('flex p-2', alignClasses[align] || 'justify-center')}>
      <IconComponent
        className={cn(sizeMap[size] || 'w-6 h-6')}
        style={{ color: color || undefined }}
      />
    </div>
  );
}
