import React from 'react';
import { ImageContent } from '@/types/funnel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface ImageBlockProps {
  content: ImageContent;
}

const aspectRatioMap: Record<string, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
};

export function ImageBlock({ content }: ImageBlockProps) {
  const { src, alt, aspectRatio, borderRadius } = content;

  const imageStyle: React.CSSProperties = {};
  if (borderRadius !== undefined) imageStyle.borderRadius = borderRadius;

  const imgClassName = cn(
    'w-full h-full object-cover',
    borderRadius === undefined && 'rounded-lg'
  );

  if (aspectRatio && aspectRatio !== 'auto') {
    return (
      <AspectRatio ratio={aspectRatioMap[aspectRatio] || 16 / 9}>
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          style={imageStyle}
        />
      </AspectRatio>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-full h-auto', borderRadius === undefined && 'rounded-lg')}
      style={imageStyle}
    />
  );
}
