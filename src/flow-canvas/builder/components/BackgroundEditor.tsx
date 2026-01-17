import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Video } from 'lucide-react';
import { ColorPickerPopover, GradientPickerPopover, gradientToCSS, cloneGradient } from './modals';
import type { GradientValue } from './modals';

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video';

export interface BackgroundValue {
  type: BackgroundType;
  color?: string;
  gradient?: GradientValue;
  imageUrl?: string;
  // Video background settings
  videoUrl?: string;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
}

interface BackgroundEditorProps {
  value: BackgroundValue;
  onChange: (value: BackgroundValue) => void;
  showImageOption?: boolean;
  showVideoOption?: boolean;
  className?: string;
}

const defaultGradient: GradientValue = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 }
  ]
};

// Parse gradient CSS string back to GradientValue
const parseGradientString = (gradientStr: string): GradientValue | null => {
  if (!gradientStr || !gradientStr.includes('gradient')) return null;
  
  const isRadial = gradientStr.includes('radial-gradient');
  const type = isRadial ? 'radial' : 'linear';
  
  let angle = 135;
  const angleMatch = gradientStr.match(/(\d+)deg/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1], 10);
  }
  
  const colorMatches = gradientStr.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))\s*(\d+%)?/g);
  const stops: Array<{ color: string; position: number }> = [];
  
  if (colorMatches) {
    colorMatches.forEach((match, index) => {
      const colorMatch = match.match(/(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)|hsla?\([^)]+\))/);
      const positionMatch = match.match(/(\d+)%/);
      const color = colorMatch ? colorMatch[1] : '#8B5CF6';
      const position = positionMatch ? parseInt(positionMatch[1], 10) : (index * 100) / Math.max(colorMatches.length - 1, 1);
      stops.push({ color, position });
    });
  }
  
  if (stops.length < 2) {
    stops.push({ color: '#8B5CF6', position: 0 }, { color: '#EC4899', position: 100 });
  }
  
  return { type, angle, stops };
};

// Helper to extract video ID from various platforms
const getVideoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  
  // Direct video URL (mp4, webm)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  
  return null;
};

export const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  value,
  onChange,
  showImageOption = true,
  showVideoOption = true,
  className
}) => {
  const [bgType, setBgType] = useState<BackgroundType>(value.type || 'solid');

  // Sync local state when value changes externally
  useEffect(() => {
    if (value.type && value.type !== bgType) {
      setBgType(value.type);
    }
  }, [value.type]);

  const handleTypeChange = (newType: BackgroundType) => {
    setBgType(newType);
    
    const newValue: BackgroundValue = { type: newType };
    
    if (newType === 'solid') {
      newValue.color = value.color || '#ffffff';
    } else if (newType === 'gradient') {
      newValue.gradient = value.gradient || defaultGradient;
    } else if (newType === 'image') {
      newValue.imageUrl = value.imageUrl || '';
    } else if (newType === 'video') {
      newValue.videoUrl = value.videoUrl || '';
      newValue.videoAutoplay = true;
      newValue.videoLoop = true;
      newValue.videoMuted = true;
    }
    
    onChange(newValue);
  };

  const handleColorChange = (color: string) => {
    onChange({ ...value, type: 'solid', color });
  };

  const handleGradientChange = (gradient: GradientValue) => {
    // Clone to prevent shared references
    onChange({ ...value, type: 'gradient', gradient: cloneGradient(gradient) });
  };

  const handleImageUrlChange = (imageUrl: string) => {
    onChange({ ...value, type: 'image', imageUrl });
  };

  const handleVideoChange = (updates: Partial<BackgroundValue>) => {
    onChange({ ...value, type: 'video', ...updates });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Background Type Toggle */}
      <div className="toggle-pill w-full flex-wrap">
        <button 
          onClick={() => handleTypeChange('solid')}
          className={cn(
            'toggle-pill-option flex-1 text-center',
            bgType === 'solid' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
          )}
        >
          Solid
        </button>
        <button 
          onClick={() => handleTypeChange('gradient')}
          className={cn(
            'toggle-pill-option flex-1 text-center',
            bgType === 'gradient' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
          )}
        >
          Gradient
        </button>
        {showImageOption && (
          <button 
            onClick={() => handleTypeChange('image')}
            className={cn(
              'toggle-pill-option flex-1 text-center',
              bgType === 'image' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
            )}
          >
            Image
          </button>
        )}
        {showVideoOption && (
          <button 
            onClick={() => handleTypeChange('video')}
            className={cn(
              'toggle-pill-option flex-1 text-center',
              bgType === 'video' ? 'toggle-pill-option-active' : 'toggle-pill-option-inactive'
            )}
          >
            Video
          </button>
        )}
      </div>

      {/* Solid Color Picker */}
      {bgType === 'solid' && (
        <div 
          className="flex items-center justify-between"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-builder-text-muted">Color</span>
          <ColorPickerPopover
            color={value.color || 'transparent'}
            onChange={handleColorChange}
            showGradientOption
            onGradientClick={() => handleTypeChange('gradient')}
          >
            <button 
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-builder-surface-hover hover:bg-builder-surface-active transition-colors"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div 
                className={cn(
                  "w-6 h-6 rounded-md border border-builder-border",
                  (!value.color || value.color === 'transparent') && "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%278%27%3E%3Crect width=%278%27 height=%278%27 fill=%27%23fff%27/%3E%3Crect width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3Crect x=%274%27 y=%274%27 width=%274%27 height=%274%27 fill=%27%23ccc%27/%3E%3C/svg%3E')]"
                )}
                style={{ backgroundColor: value.color && value.color !== 'transparent' ? value.color : undefined }}
              />
              <span className="text-xs text-builder-text font-mono min-w-[60px]">
                {!value.color || value.color === 'transparent' ? 'None' : value.color}
              </span>
            </button>
          </ColorPickerPopover>
        </div>
      )}

      {/* Gradient Picker */}
      {bgType === 'gradient' && (
        <GradientPickerPopover
          value={value.gradient || defaultGradient}
          onChange={handleGradientChange}
        >
          <button 
            className="w-full h-12 rounded-lg border border-builder-border hover:ring-2 hover:ring-builder-accent transition-all cursor-pointer"
            style={{ 
              background: value.gradient 
                ? gradientToCSS(value.gradient) 
                : 'linear-gradient(135deg, #667eea, #764ba2)' 
            }}
          >
            <span className="text-xs text-white font-medium drop-shadow-sm">
              Click to edit gradient
            </span>
          </button>
        </GradientPickerPopover>
      )}

      {/* Image URL Input */}
      {bgType === 'image' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-builder-text-muted">Image URL</span>
          </div>
          <Input
            value={value.imageUrl || ''}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="builder-input text-xs"
          />
          {value.imageUrl && (
            <div 
              className="w-full h-20 rounded-lg border border-builder-border bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${value.imageUrl})` }}
            />
          )}
          {!value.imageUrl && (
            <div className="w-full h-20 rounded-lg border-2 border-dashed border-builder-border flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-6 h-6 text-builder-text-muted mx-auto mb-1" />
                <span className="text-xs text-builder-text-muted">No image set</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Background Settings */}
      {bgType === 'video' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-builder-text-muted">Video URL</Label>
            <Input
              value={value.videoUrl || ''}
              onChange={(e) => handleVideoChange({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or .mp4 URL"
              className="builder-input text-xs"
            />
            <p className="text-[10px] text-builder-text-dim">
              Supports YouTube, Vimeo, or direct .mp4 URLs
            </p>
          </div>
          
          {/* Video Preview */}
          {value.videoUrl && getVideoEmbedUrl(value.videoUrl) && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-builder-border bg-gray-900">
              {getVideoEmbedUrl(value.videoUrl)?.includes('youtube') || getVideoEmbedUrl(value.videoUrl)?.includes('vimeo') ? (
                <iframe
                  src={getVideoEmbedUrl(value.videoUrl)!}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                />
              ) : (
                <video
                  src={getVideoEmbedUrl(value.videoUrl)!}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
            </div>
          )}
          
          {!value.videoUrl && (
            <div className="w-full aspect-video rounded-lg border-2 border-dashed border-builder-border flex items-center justify-center">
              <div className="text-center">
                <Video className="w-8 h-8 text-builder-text-muted mx-auto mb-2" />
                <span className="text-xs text-builder-text-muted">Enter a video URL above</span>
              </div>
            </div>
          )}
          
          {/* Video Options */}
          <div className="space-y-2 pt-2 border-t border-builder-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-builder-text-muted">Autoplay</Label>
              <Switch
                checked={value.videoAutoplay ?? true}
                onCheckedChange={(checked) => handleVideoChange({ videoAutoplay: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-builder-text-muted">Loop</Label>
              <Switch
                checked={value.videoLoop ?? true}
                onCheckedChange={(checked) => handleVideoChange({ videoLoop: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-builder-text-muted">Muted</Label>
              <Switch
                checked={value.videoMuted ?? true}
                onCheckedChange={(checked) => handleVideoChange({ videoMuted: checked })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility to convert BackgroundValue to CSS
export const backgroundValueToCSS = (value: BackgroundValue): string => {
  if (!value) return 'transparent';
  
  switch (value.type) {
    case 'solid':
      return value.color || 'transparent';
    case 'gradient':
      return value.gradient ? gradientToCSS(value.gradient) : 'linear-gradient(135deg, #667eea, #764ba2)';
    case 'image':
      return value.imageUrl ? `url(${value.imageUrl})` : 'transparent';
    case 'video':
      // Video backgrounds are handled specially in render - return transparent for CSS
      return 'transparent';
    default:
      return 'transparent';
  }
};

export { parseGradientString, getVideoEmbedUrl };
