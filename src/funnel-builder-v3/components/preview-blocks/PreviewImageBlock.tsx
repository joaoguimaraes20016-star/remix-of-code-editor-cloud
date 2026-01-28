/**
 * Preview Image Block
 */

import { Block, FunnelSettings } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface PreviewImageBlockProps {
  block: Block;
  settings: FunnelSettings;
}

export function PreviewImageBlock({ block }: PreviewImageBlockProps) {
  const { src, alt, aspectRatio = 'auto', objectFit = 'cover' } = block.props;

  const aspectRatioClasses: Record<string, string> = {
    'auto': '',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  };

  if (!src) {
    return (
      <div className={cn(
        'bg-gray-100 rounded-lg flex items-center justify-center',
        aspectRatioClasses[aspectRatio] || 'min-h-[200px]'
      )}>
        <ImageIcon className="h-12 w-12 text-gray-300" />
      </div>
    );
  }

  return (
    <div className={cn(
      'overflow-hidden rounded-lg',
      aspectRatioClasses[aspectRatio]
    )}>
      <img
        src={src}
        alt={alt || 'Image'}
        className={cn(
          'w-full h-full',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill'
        )}
      />
    </div>
  );
}
