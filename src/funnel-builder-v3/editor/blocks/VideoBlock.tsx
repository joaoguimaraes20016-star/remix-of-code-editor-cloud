import React from 'react';
import { VideoContent } from '@/funnel-builder-v3/types/funnel';
import { Play } from 'lucide-react';

interface VideoBlockProps {
  content: VideoContent;
}

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function getVimeoId(url: string): string | null {
  const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function VideoBlock({ content }: VideoBlockProps) {
  const { src, type, autoplay, controls } = content;

  if (!src) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Play className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add a video URL</p>
        </div>
      </div>
    );
  }

  if (type === 'youtube') {
    const videoId = getYouTubeId(src);
    if (!videoId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Invalid YouTube URL</p>
        </div>
      );
    }
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1&mute=1' : ''}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (type === 'vimeo') {
    const videoId = getVimeoId(src);
    if (!videoId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Invalid Vimeo URL</p>
        </div>
      );
    }
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1&muted=1' : ''}`}
          title="Vimeo video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Hosted video - apply controls prop (default true, can be disabled)
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <video
        className="w-full h-full object-cover"
        src={src}
        controls={controls !== false}
        autoPlay={autoplay}
        muted={autoplay}
      />
    </div>
  );
}
