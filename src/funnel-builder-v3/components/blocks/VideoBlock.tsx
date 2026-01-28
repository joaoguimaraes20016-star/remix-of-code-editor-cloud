/**
 * Video Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { Video } from 'lucide-react';

interface VideoBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function VideoBlock({ block, previewMode }: VideoBlockProps) {
  const { src } = block.props;

  // Parse YouTube/Vimeo URLs
  const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8 aspect-video">
        <Video className="h-12 w-12 text-muted-foreground mb-2" />
        {!previewMode && (
          <span className="text-sm text-muted-foreground">Add video URL</span>
        )}
      </div>
    );
  }

  const embedUrl = getEmbedUrl(src);

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        src={embedUrl || src}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
