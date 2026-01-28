/**
 * Funnel Builder v3 - Video Helpers
 * 
 * Parse and embed video URLs from various platforms.
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'direct' | null;

/**
 * Detect video provider from URL
 */
export const getVideoProvider = (url: string): VideoProvider => {
  if (!url) return null;
  
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (normalizedUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (normalizedUrl.includes('loom.com')) {
    return 'loom';
  }
  if (normalizedUrl.includes('wistia.com') || normalizedUrl.includes('wi.st')) {
    return 'wistia';
  }
  if (normalizedUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return 'direct';
  }
  
  return null;
};

/**
 * Get embed URL for a video (returns null if unsupported)
 */
export const getVideoEmbedUrl = (url: string, autoplay = false): string | null => {
  if (!url) return null;
  
  const provider = getVideoProvider(url);
  const autoplayParam = autoplay ? '&autoplay=1&muted=1' : '';
  
  switch (provider) {
    case 'youtube': {
      // Handle various YouTube URL formats
      let videoId = '';
      
      if (url.includes('youtu.be/')) {
        // Short URL: https://youtu.be/VIDEO_ID
        const match = url.match(/youtu\.be\/([^?&]+)/);
        videoId = match?.[1] || '';
      } else if (url.includes('youtube.com/watch')) {
        // Standard URL: https://www.youtube.com/watch?v=VIDEO_ID
        const match = url.match(/[?&]v=([^&]+)/);
        videoId = match?.[1] || '';
      } else if (url.includes('youtube.com/embed/')) {
        // Already embed URL: https://www.youtube.com/embed/VIDEO_ID
        const match = url.match(/embed\/([^?&]+)/);
        videoId = match?.[1] || '';
      }
      
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?rel=0${autoplayParam}`;
    }
    
    case 'vimeo': {
      // Handle various Vimeo URL formats
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const videoId = match?.[1];
      
      if (!videoId) return null;
      return `https://player.vimeo.com/video/${videoId}?${autoplay ? 'autoplay=1&muted=1' : ''}`;
    }
    
    case 'loom': {
      // Handle Loom URLs
      const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
      const videoId = match?.[1];
      
      if (!videoId) return null;
      return `https://www.loom.com/embed/${videoId}`;
    }
    
    case 'wistia': {
      // Handle Wistia URLs
      let videoId = '';
      
      if (url.includes('wi.st/')) {
        const match = url.match(/wi\.st\/([a-zA-Z0-9]+)/);
        videoId = match?.[1] || '';
      } else {
        const match = url.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/);
        videoId = match?.[1] || '';
      }
      
      if (!videoId) return null;
      return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }
    
    case 'direct': {
      // Direct video file URL - return as-is
      return url;
    }
    
    default:
      return null;
  }
};

/**
 * Check if a URL is a valid video URL
 */
export const isValidVideoUrl = (url: string): boolean => {
  return getVideoProvider(url) !== null;
};

/**
 * Get provider display name
 */
export const getProviderDisplayName = (provider: VideoProvider): string => {
  switch (provider) {
    case 'youtube': return 'YouTube';
    case 'vimeo': return 'Vimeo';
    case 'loom': return 'Loom';
    case 'wistia': return 'Wistia';
    case 'direct': return 'Video File';
    default: return 'Unknown';
  }
};

/**
 * Get thumbnail URL for a video (if available)
 */
export const getVideoThumbnail = (url: string): string | null => {
  const provider = getVideoProvider(url);
  
  switch (provider) {
    case 'youtube': {
      let videoId = '';
      
      if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&]+)/);
        videoId = match?.[1] || '';
      } else if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([^&]+)/);
        videoId = match?.[1] || '';
      } else if (url.includes('youtube.com/embed/')) {
        const match = url.match(/embed\/([^?&]+)/);
        videoId = match?.[1] || '';
      }
      
      if (!videoId) return null;
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    case 'vimeo': {
      // Vimeo thumbnails require API call, return null for now
      return null;
    }
    
    default:
      return null;
  }
};
