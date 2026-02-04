import React from 'react';
import { SpacerContent } from '@/funnel-builder-v3/types/funnel';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface SpacerBlockProps {
  content: SpacerContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function SpacerBlock({ content, blockId, stepId, isPreview }: SpacerBlockProps) {
  const { height } = content;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'spacer',
    hintText: 'Click to edit spacer'
  });

  return wrapWithOverlay(
    <div style={{ height }} className="w-full" />
  );
}
