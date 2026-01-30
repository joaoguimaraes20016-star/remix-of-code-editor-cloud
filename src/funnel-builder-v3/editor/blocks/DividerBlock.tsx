import React from 'react';
import { DividerContent } from '@/types/funnel';
import { cn } from '@/lib/utils';

interface DividerBlockProps {
  content: DividerContent;
}

export function DividerBlock({ content }: DividerBlockProps) {
  const { style, color, thickness } = content;

  const styleClasses: Record<string, string> = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  return (
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
