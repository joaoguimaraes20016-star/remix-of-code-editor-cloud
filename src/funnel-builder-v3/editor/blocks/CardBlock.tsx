import React from 'react';
import { CardContent, Block } from '@/funnel-builder-v3/types/funnel';
import { BlockRenderer } from './BlockRenderer';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface CardBlockProps {
  content: CardContent;
  blockId?: string;
  stepId: string;
  isPreview?: boolean;
}

export function CardBlock({ content, blockId, stepId, isPreview }: CardBlockProps) {
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'card',
    hintText: 'Click to edit card'
  });
  const blocks = content.blocks || [];

  // Removed internal shadow/bg/radius handling - now controlled via Style tab in BlockRenderer
  return wrapWithOverlay(
    <div
      className={cn(
        "p-4",
        blocks.length === 0 && "min-h-[80px] flex items-center justify-center"
      )}
    >
      {blocks.length === 0 ? (
        <span className="text-xs text-muted-foreground">
          Empty card — add blocks inside
        </span>
      ) : (
        <div className="space-y-2">
          {blocks.map((block: Block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              stepId={stepId}
              isPreview={isPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
