/**
 * Button Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface ButtonBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function ButtonBlock({ block, previewMode, primaryColor }: ButtonBlockProps) {
  const { 
    variant = 'primary', 
    align = 'center', 
    fullWidth = true,
    buttonSize = 'lg',
  } = block.props;

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const getVariantStyles = () => {
    const color = primaryColor || 'hsl(262, 83%, 58%)';
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: color,
          color: '#fff',
        };
      case 'secondary':
        return {
          backgroundColor: 'hsl(var(--muted))',
          color: 'hsl(var(--foreground))',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: `2px solid ${color}`,
          color: color,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: color,
        };
      default:
        return {};
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (previewMode && block.props.action) {
      const action = block.props.action;
      if (action.type === 'url' && action.url) {
        if (action.openInNewTab) {
          window.open(action.url, '_blank');
        } else {
          window.location.href = action.url;
        }
      }
      // Other actions would be handled by the runtime
    }
  };

  return (
    <div className={cn('flex p-2', alignClasses[align])}>
      <button
        onClick={handleClick}
        className={cn(
          'rounded-lg font-semibold transition-all',
          sizeClasses[buttonSize],
          fullWidth && 'w-full',
          previewMode && 'cursor-pointer hover:opacity-90',
          !previewMode && 'pointer-events-none'
        )}
        style={getVariantStyles()}
      >
        {block.content || 'Button'}
      </button>
    </div>
  );
}
