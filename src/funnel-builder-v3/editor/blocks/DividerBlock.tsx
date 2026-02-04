import React from 'react';
import { DividerContent } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface DividerBlockProps {
  content: DividerContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function DividerBlock({ content, blockId, stepId, isPreview }: DividerBlockProps) {
  const { style, color, thickness } = content;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'divider',
    hintText: 'Click to edit divider'
  });

  const styleClasses: Record<string, string> = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  return wrapWithOverlay(
    <hr
      className={cn(
        'w-full border-t',
        styleClasses[style]
      )}
      style={{ 
        borderColor: color || 'hsl(var(--border))',
        borderTopWidth: thickness || 1,
      }}
    />
  );
}
