/**
 * Image Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface ImageBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function ImageBlock({ block, previewMode }: ImageBlockProps) {
  const { src, alt, aspectRatio = 'auto', objectFit = 'cover' } = block.props;

  const aspectClasses = {
    auto: '',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted rounded-lg p-8',
          aspectClasses[aspectRatio] || 'min-h-[200px]'
        )}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
        {!previewMode && (
          <span className="text-sm text-muted-foreground">Add image URL</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Image'}
      className={cn(
        'w-full rounded-lg',
        aspectClasses[aspectRatio],
        objectFit === 'cover' && 'object-cover',
        objectFit === 'contain' && 'object-contain',
        objectFit === 'fill' && 'object-fill'
      )}
    />
  );
}
