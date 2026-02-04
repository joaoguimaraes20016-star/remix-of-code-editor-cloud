import React from 'react';
import { ImageContent } from '@/funnel-builder-v3/types/funnel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface ImageBlockProps {
  content: ImageContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

const aspectRatioMap: Record<string, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
};

export function ImageBlock({ content, blockId, stepId, isPreview }: ImageBlockProps) {
  const { src, alt, aspectRatio, borderRadius } = content;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'image',
    hintText: 'Click to edit image'
  });

  const imageStyle: React.CSSProperties = {};
  if (borderRadius !== undefined) imageStyle.borderRadius = borderRadius;

  const imgClassName = cn(
    'w-full h-full object-cover',
    borderRadius === undefined && 'rounded-lg'
  );

  if (aspectRatio && aspectRatio !== 'auto') {
    return wrapWithOverlay(
      <div className="w-full max-w-full">
        <AspectRatio ratio={aspectRatioMap[aspectRatio] || 16 / 9}>
          <img
            src={src}
            alt={alt}
            className={imgClassName}
            style={imageStyle}
          />
        </AspectRatio>
      </div>
    );
  }

  return wrapWithOverlay(
    <img
      src={src}
      alt={alt}
      className={cn('w-full max-w-full h-auto', borderRadius === undefined && 'rounded-lg')}
      style={imageStyle}
    />
  );
}
