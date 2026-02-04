import React from 'react';
import { VideoContent } from '@/funnel-builder-v3/types/funnel';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface VideoBlockProps {
  content: VideoContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
  isEmbedded?: boolean; // True when used inside another block like VideoQuestionBlock
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

function getWistiaId(url: string): string | null {
  const patterns = [
    /wistia\.com\/medias\/([a-zA-Z0-9]+)/,
    /fast\.wistia\.net\/embed\/iframe\/([a-zA-Z0-9]+)/,
    /wistia\.com\/embed\/iframe\/([a-zA-Z0-9]+)/,
    /\.wistia\.com\/.*?([a-zA-Z0-9]{10,})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getLoomId(url: string): string | null {
  const regExp = /loom\.com\/share\/([a-zA-Z0-9]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function detectVideoType(url: string): VideoContent['type'] {
  if (!url) return 'hosted';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('wistia')) return 'wistia';
  if (lowerUrl.includes('loom.com')) return 'loom';
  return 'hosted';
}

function getAspectRatioPadding(ratio: string = '16:9'): string {
  switch (ratio) {
    case '9:16': return '177.78%'; // 16/9 * 100 (height/width * 100)
    case '4:3': return '75%'; // 3/4 * 100 (height/width * 100)
    case '1:1': return '100%'; // 1/1 * 100 (height/width * 100)
    case '16:9':
    default: return '56.25%'; // 9/16 * 100 (height/width * 100)
  }
}

export function VideoBlock({ content, blockId, stepId, isPreview, isEmbedded }: VideoBlockProps) {
  const { src, type: providedType, autoplay, controls, aspectRatio, muted, loop } = content;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const funnelContext = useFunnelOptional();
  const selectedChildElement = funnelContext?.selectedChildElement ?? null;
  
  const type = providedType || detectVideoType(src);
  // Ensure aspectRatio has a value, default to '16:9' if undefined
  const effectiveAspectRatio = aspectRatio || '16:9';
  const aspectPadding = getAspectRatioPadding(effectiveAspectRatio);
  
  // Determine if we're in editor mode and should show hover overlay
  const canEdit = blockId && stepId && !isPreview;
  const isVideoSelected = !isPreview && isEmbedded && selectedChildElement === 'video';

  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'video',
    hintText: 'Click to edit video',
    isEmbedded,
    childElementId: isEmbedded ? 'video' : undefined,
    isChildSelected: isVideoSelected
  });
  
  // Handle autoplay for hosted videos
  React.useEffect(() => {
    if (type !== 'hosted' || !videoRef.current) return;
    
    const video = videoRef.current;
    
    if (autoplay) {
      video.play().catch(() => {
        // Autoplay was prevented - browser may require muted or user interaction
      });
    }
  }, [autoplay, type, src]);
  
  // Handle loop changes
  React.useEffect(() => {
    if (type !== 'hosted' || !videoRef.current) return;
    videoRef.current.loop = !!loop;
  }, [loop, type]);
  
  // Handle muted changes
  React.useEffect(() => {
    if (type !== 'hosted' || !videoRef.current) return;
    videoRef.current.muted = !!muted;
  }, [muted, type]);

  if (!src) {
    return wrapWithOverlay(
      <div 
        className="bg-muted rounded-lg flex items-center justify-center w-full" 
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: aspectPadding,
          height: 0,
          boxSizing: 'border-box',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Paste a video URL</p>
            <p className="text-xs opacity-60">YouTube, Vimeo, Wistia, Loom, or direct link</p>
          </div>
        </div>
      </div>
    );
  }

  // YouTube
  if (type === 'youtube') {
    const videoId = getYouTubeId(src);
    if (!videoId) {
      return (
        <div 
          className="bg-muted rounded-lg flex items-center justify-center w-full" 
          style={{ 
            position: 'relative',
            width: '100%',
            paddingBottom: aspectPadding,
            minHeight: 0,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Invalid YouTube URL</p>
          </div>
        </div>
      );
    }
    
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('mute', '1');
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', videoId);
    }
    
    return wrapWithOverlay(
      <div 
        key={`youtube-${effectiveAspectRatio}`}
        className="relative rounded-lg overflow-hidden w-full"
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: aspectPadding,
          height: 0,
          boxSizing: 'border-box',
        }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://www.youtube.com/embed/${videoId}${params.toString() ? '?' + params.toString() : ''}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Vimeo
  if (type === 'vimeo') {
    const videoId = getVimeoId(src);
    if (!videoId) {
      return (
        <div 
          className="bg-muted rounded-lg flex items-center justify-center w-full" 
          style={{ 
            position: 'relative',
            width: '100%',
            paddingBottom: aspectPadding,
            height: 0,
            boxSizing: 'border-box',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Invalid Vimeo URL</p>
          </div>
        </div>
      );
    }
    
    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (muted) params.set('muted', '1');
    if (loop) params.set('loop', '1');
    
    return wrapWithOverlay(
      <div 
        key={`vimeo-${effectiveAspectRatio}`}
        className="relative rounded-lg overflow-hidden w-full"
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: aspectPadding,
          height: 0,
          boxSizing: 'border-box',
        }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://player.vimeo.com/video/${videoId}${params.toString() ? '?' + params.toString() : ''}`}
          title="Vimeo video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Wistia
  if (type === 'wistia') {
    const videoId = getWistiaId(src);
    if (!videoId) {
      return (
        <div 
          className="bg-muted rounded-lg flex items-center justify-center w-full" 
          style={{ 
            position: 'relative',
            width: '100%',
            paddingBottom: aspectPadding,
            height: 0,
            boxSizing: 'border-box',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Invalid Wistia URL</p>
          </div>
        </div>
      );
    }
    
    const params = new URLSearchParams();
    if (autoplay) params.set('autoPlay', 'true');
    if (muted) params.set('muted', 'true');
    if (loop) params.set('endVideoBehavior', 'loop');
    else params.set('endVideoBehavior', 'default');
    
    return wrapWithOverlay(
      <div 
        key={`wistia-${effectiveAspectRatio}`}
        className="relative rounded-lg overflow-hidden w-full"
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: aspectPadding,
          height: 0,
          boxSizing: 'border-box',
        }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://fast.wistia.net/embed/iframe/${videoId}?${params.toString()}`}
          title="Wistia video"
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Loom
  if (type === 'loom') {
    const videoId = getLoomId(src);
    if (!videoId) {
      return (
        <div 
          className="bg-muted rounded-lg flex items-center justify-center w-full" 
          style={{ 
            position: 'relative',
            width: '100%',
            paddingBottom: aspectPadding,
            height: 0,
            boxSizing: 'border-box',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Invalid Loom URL</p>
          </div>
        </div>
      );
    }
    
    return wrapWithOverlay(
      <div 
        key={`loom-${effectiveAspectRatio}`}
        className="relative rounded-lg overflow-hidden w-full"
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: aspectPadding,
          height: 0,
          boxSizing: 'border-box',
        }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://www.loom.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`}
          title="Loom video"
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Hosted video (direct file or uploaded)
  const isDataUrl = src.startsWith('data:') || src.startsWith('blob:');
  const showControls = controls !== false;
  
  return wrapWithOverlay(
    <div 
      key={`hosted-${effectiveAspectRatio}`}
      className="relative rounded-lg overflow-hidden bg-black w-full"
      style={{ 
        position: 'relative',
        width: '100%',
        paddingBottom: aspectPadding,
        height: 0,
        boxSizing: 'border-box',
      }}
    >
      <video
        ref={videoRef}
        key={src.slice(0, 50)}
        className="absolute top-0 left-0 w-full h-full object-cover"
        src={src}
        controls={showControls}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      {/* Show play overlay when controls are hidden */}
      {!showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-black ml-1" fill="black" />
          </div>
        </div>
      )}
    </div>
  );
}
