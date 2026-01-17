import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Film, 
  Search, 
  Sparkles, 
  Leaf, 
  Monitor, 
  Building2, 
  Palette,
  Waves,
  Play
} from 'lucide-react';

interface StockVideo {
  id: string;
  category: string;
  thumbnail: string;
  url: string;
  label: string;
  duration?: string;
}

// Curated list of high-quality free stock videos from various CDNs
const STOCK_VIDEOS: StockVideo[] = [
  // Abstract / Particles
  {
    id: 'abstract-particles-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/3141207/free-video-3141207.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3141207/3141207-uhd_2560_1440_25fps.mp4',
    label: 'Abstract Particles',
    duration: '0:10'
  },
  {
    id: 'abstract-gradient-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/4763824/free-video-4763824.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4',
    label: 'Flowing Gradients',
    duration: '0:15'
  },
  {
    id: 'abstract-liquid-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/6893673/pexels-photo-6893673.jpeg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/6893673/6893673-uhd_2560_1440_30fps.mp4',
    label: 'Liquid Motion',
    duration: '0:12'
  },
  {
    id: 'abstract-bokeh-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/856986/free-video-856986.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/856986/856986-hd_1920_1080_25fps.mp4',
    label: 'Bokeh Lights',
    duration: '0:08'
  },
  // Nature
  {
    id: 'nature-ocean-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/1093662/free-video-1093662.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/1093662/1093662-uhd_2560_1440_30fps.mp4',
    label: 'Ocean Waves',
    duration: '0:18'
  },
  {
    id: 'nature-forest-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/3571264/free-video-3571264.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4',
    label: 'Forest Canopy',
    duration: '0:14'
  },
  {
    id: 'nature-clouds-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/856024/free-video-856024.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/856024/856024-hd_1920_1080_30fps.mp4',
    label: 'Clouds Timelapse',
    duration: '0:20'
  },
  {
    id: 'nature-waterfall-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/1409899/free-video-1409899.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/1409899/1409899-uhd_2560_1440_25fps.mp4',
    label: 'Waterfall',
    duration: '0:16'
  },
  // Technology
  {
    id: 'tech-data-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4',
    label: 'Digital Network',
    duration: '0:12'
  },
  {
    id: 'tech-code-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/5496277/free-video-5496277.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5496277/5496277-uhd_2560_1440_25fps.mp4',
    label: 'Code Matrix',
    duration: '0:10'
  },
  {
    id: 'tech-circuit-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/6272953/free-video-6272953.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/6272953/6272953-uhd_2560_1440_25fps.mp4',
    label: 'Circuit Board',
    duration: '0:15'
  },
  // Business / City
  {
    id: 'business-city-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/2675510/free-video-2675510.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2675510/2675510-uhd_2560_1440_24fps.mp4',
    label: 'City Skyline',
    duration: '0:22'
  },
  {
    id: 'business-office-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/3205831/free-video-3205831.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3205831/3205831-uhd_2560_1440_25fps.mp4',
    label: 'Modern Office',
    duration: '0:18'
  },
  {
    id: 'business-night-city-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/2086103/free-video-2086103.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2086103/2086103-uhd_2560_1440_24fps.mp4',
    label: 'Night City Traffic',
    duration: '0:16'
  },
  // Textures / Minimal
  {
    id: 'texture-smoke-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/5492687/free-video-5492687.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5492687/5492687-uhd_2560_1440_25fps.mp4',
    label: 'Smoke Flow',
    duration: '0:10'
  },
  {
    id: 'texture-ink-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/4880145/free-video-4880145.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4880145/4880145-uhd_2560_1440_25fps.mp4',
    label: 'Ink in Water',
    duration: '0:08'
  },
  {
    id: 'texture-fabric-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/5548097/free-video-5548097.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5548097/5548097-uhd_2560_1440_25fps.mp4',
    label: 'Fabric Wave',
    duration: '0:12'
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'abstract', label: 'Abstract', icon: Palette },
  { id: 'nature', label: 'Nature', icon: Leaf },
  { id: 'technology', label: 'Tech', icon: Monitor },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'textures', label: 'Textures', icon: Waves },
];

interface StockVideoPickerProps {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

export const StockVideoPicker: React.FC<StockVideoPickerProps> = ({
  onSelect,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const filteredVideos = STOCK_VIDEOS.filter(video => {
    const matchesCategory = category === 'all' || video.category === category;
    const matchesSearch = !search || video.label.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[420px] p-0 bg-popover border-border" 
        align="start"
        side="left"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Stock Videos</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredVideos.length} videos
            </span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>
          
          {/* Categories */}
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                    category === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="h-[320px]">
          <div className="p-3 grid grid-cols-2 gap-2">
            {filteredVideos.map(video => (
              <button
                key={video.id}
                onClick={() => handleSelect(video.url)}
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
                className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:ring-2 hover:ring-primary/20 transition-all group"
              >
                {/* Thumbnail */}
                <img
                  src={video.thumbnail}
                  alt={video.label}
                  className="w-full h-full object-cover"
                />
                
                {/* Hover overlay with video preview hint */}
                <div className={cn(
                  'absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity',
                  hoveredVideo === video.id ? 'opacity-100' : 'opacity-0'
                )}>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* Label & duration */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white font-medium truncate">{video.label}</p>
                  {video.duration && (
                    <span className="text-[10px] text-white/70">{video.duration}</span>
                  )}
                </div>
              </button>
            ))}
            
            {filteredVideos.length === 0 && (
              <div className="col-span-2 py-8 text-center text-muted-foreground">
                <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No videos found</p>
                <p className="text-xs">Try a different search or category</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Free stock videos from Pexels • No attribution required
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StockVideoPicker;
