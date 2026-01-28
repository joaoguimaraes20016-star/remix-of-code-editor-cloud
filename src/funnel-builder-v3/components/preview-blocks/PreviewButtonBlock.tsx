/**
 * Preview Button Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PreviewButtonBlockProps {
  block: Block;
  settings: FunnelSettings;
  onAction: () => void;
  isSubmitting?: boolean;
}

export function PreviewButtonBlock({ block, settings, onAction, isSubmitting }: PreviewButtonBlockProps) {
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
    const color = settings.primaryColor || 'hsl(262, 83%, 58%)';
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: color,
          color: '#fff',
        };
      case 'secondary':
        return {
          backgroundColor: '#f1f5f9',
          color: '#1e293b',
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

  return (
    <div className={cn('flex p-2', alignClasses[align])}>
      <button
        onClick={onAction}
        disabled={isSubmitting}
        className={cn(
          'rounded-lg font-semibold transition-all',
          sizeClasses[buttonSize],
          fullWidth && 'w-full',
          'hover:opacity-90 active:scale-[0.98]',
          isSubmitting && 'opacity-70 cursor-not-allowed'
        )}
        style={getVariantStyles()}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </span>
        ) : (
          block.content || 'Button'
        )}
      </button>
    </div>
  );
}
