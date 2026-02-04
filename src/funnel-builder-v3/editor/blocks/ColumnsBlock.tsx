import React from 'react';
import { ColumnsContent, Block } from '@/funnel-builder-v3/types/funnel';
import { BlockRenderer } from './BlockRenderer';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface ColumnsBlockProps {
  content: ColumnsContent;
  blockId?: string;
  stepId: string;
  isPreview?: boolean;
}

export function ColumnsBlock({ content, blockId, stepId, isPreview }: ColumnsBlockProps) {
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'columns',
    hintText: 'Click to edit columns'
  });
  const columnCount = content.columns || 2;
  const gap = content.gap || 16;
  const columnBlocks = content.blocks || Array(columnCount).fill([]);

  return wrapWithOverlay(
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: columnCount }).map((_, colIndex) => {
        const blocks = columnBlocks[colIndex] || [];
        
        return (
          <div
            key={colIndex}
            className={cn(
              "min-h-[60px] rounded-lg",
              blocks.length === 0 && "border-2 border-dashed border-muted-foreground/20 flex items-center justify-center"
            )}
          >
            {blocks.length === 0 ? (
              <span className="text-xs text-muted-foreground">Column {colIndex + 1}</span>
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
      })}
    </div>
  );
}
