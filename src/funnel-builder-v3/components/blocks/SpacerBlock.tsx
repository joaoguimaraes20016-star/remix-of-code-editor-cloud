/**
 * Spacer Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';

interface SpacerBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function SpacerBlock({ block, isSelected, previewMode }: SpacerBlockProps) {
  const { height = 32 } = block.props;

  return (
    <div 
      className={cn(
        'relative',
        !previewMode && isSelected && 'bg-muted/30'
      )}
      style={{ height: `${height}px` }}
    >
      {!previewMode && isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
            {height}px
          </span>
        </div>
      )}
    </div>
  );
}
