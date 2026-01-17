import React, { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
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

// Curated list of high-quality free stock videos from Pexels
const STOCK_VIDEOS: StockVideo[] = [
  // Abstract / Particles (8 videos)
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
    thumbnail: 'https://images.pexels.com/videos/2873755/free-video-2873755.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2873755/2873755-uhd_2560_1440_24fps.mp4',
    label: 'Flowing Gradients',
    duration: '0:15'
  },
  {
    id: 'abstract-liquid-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/4691589/free-video-4691589.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4691589/4691589-uhd_2560_1440_24fps.mp4',
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
  {
    id: 'abstract-neon-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/4145356/free-video-4145356.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4145356/4145356-uhd_2560_1440_25fps.mp4',
    label: 'Neon Waves',
    duration: '0:14'
  },
  {
    id: 'abstract-geometric-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/5737722/free-video-5737722.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5737722/5737722-uhd_2560_1440_25fps.mp4',
    label: 'Geometric Patterns',
    duration: '0:11'
  },
  {
    id: 'abstract-smoke-color-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/4312282/free-video-4312282.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4312282/4312282-uhd_2560_1440_25fps.mp4',
    label: 'Color Smoke',
    duration: '0:09'
  },
  {
    id: 'abstract-light-rays-1',
    category: 'abstract',
    thumbnail: 'https://images.pexels.com/videos/5501250/free-video-5501250.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5501250/5501250-uhd_2560_1440_25fps.mp4',
    label: 'Light Rays',
    duration: '0:13'
  },
  // Nature (8 videos)
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
  {
    id: 'nature-sunset-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/857195/free-video-857195.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_25fps.mp4',
    label: 'Sunset Beach',
    duration: '0:15'
  },
  {
    id: 'nature-mountain-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/2169880/free-video-2169880.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_24fps.mp4',
    label: 'Mountain Vista',
    duration: '0:22'
  },
  {
    id: 'nature-rain-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/2491284/free-video-2491284.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2491284/2491284-uhd_2560_1440_24fps.mp4',
    label: 'Rain on Window',
    duration: '0:17'
  },
  {
    id: 'nature-aurora-1',
    category: 'nature',
    thumbnail: 'https://images.pexels.com/videos/857118/free-video-857118.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/857118/857118-hd_1920_1080_25fps.mp4',
    label: 'Aurora Borealis',
    duration: '0:19'
  },
  // Technology (8 videos)
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
  {
    id: 'tech-server-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/5380643/free-video-5380643.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5380643/5380643-uhd_2560_1440_25fps.mp4',
    label: 'Server Room',
    duration: '0:11'
  },
  {
    id: 'tech-holographic-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/6805869/free-video-6805869.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/6805869/6805869-uhd_2560_1440_25fps.mp4',
    label: 'Holographic Display',
    duration: '0:14'
  },
  {
    id: 'tech-ai-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/8721926/free-video-8721926.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/8721926/8721926-uhd_2560_1440_25fps.mp4',
    label: 'AI Neural Network',
    duration: '0:13'
  },
  {
    id: 'tech-drone-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/3155475/free-video-3155475.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3155475/3155475-uhd_2560_1440_25fps.mp4',
    label: 'Drone Footage',
    duration: '0:18'
  },
  {
    id: 'tech-typing-1',
    category: 'technology',
    thumbnail: 'https://images.pexels.com/videos/5483071/free-video-5483071.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5483071/5483071-uhd_2560_1440_25fps.mp4',
    label: 'Keyboard Typing',
    duration: '0:09'
  },
  // Business / City (8 videos)
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
  {
    id: 'business-meeting-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/3252981/free-video-3252981.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3252981/3252981-uhd_2560_1440_25fps.mp4',
    label: 'Team Meeting',
    duration: '0:14'
  },
  {
    id: 'business-coffee-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/4790088/free-video-4790088.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4790088/4790088-uhd_2560_1440_25fps.mp4',
    label: 'Coffee Shop',
    duration: '0:12'
  },
  {
    id: 'business-urban-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/2098989/free-video-2098989.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2098989/2098989-uhd_2560_1440_24fps.mp4',
    label: 'Urban Streets',
    duration: '0:20'
  },
  {
    id: 'business-stock-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/3945044/free-video-3945044.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3945044/3945044-uhd_2560_1440_25fps.mp4',
    label: 'Stock Exchange',
    duration: '0:15'
  },
  {
    id: 'business-handshake-1',
    category: 'business',
    thumbnail: 'https://images.pexels.com/videos/3252984/free-video-3252984.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/3252984/3252984-uhd_2560_1440_25fps.mp4',
    label: 'Business Handshake',
    duration: '0:10'
  },
  // Textures / Minimal (8 videos)
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
  {
    id: 'texture-water-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/2098988/free-video-2098988.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/2098988/2098988-uhd_2560_1440_24fps.mp4',
    label: 'Water Ripples',
    duration: '0:11'
  },
  {
    id: 'texture-paper-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/4823461/free-video-4823461.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4823461/4823461-uhd_2560_1440_25fps.mp4',
    label: 'Paper Texture',
    duration: '0:09'
  },
  {
    id: 'texture-metal-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/4424832/free-video-4424832.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4424832/4424832-uhd_2560_1440_25fps.mp4',
    label: 'Metal Surface',
    duration: '0:13'
  },
  {
    id: 'texture-glass-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/5532774/free-video-5532774.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/5532774/5532774-uhd_2560_1440_25fps.mp4',
    label: 'Glass Refraction',
    duration: '0:10'
  },
  {
    id: 'texture-sand-1',
    category: 'textures',
    thumbnail: 'https://images.pexels.com/videos/4098192/free-video-4098192.jpg?auto=compress&w=200',
    url: 'https://videos.pexels.com/video-files/4098192/4098192-uhd_2560_1440_25fps.mp4',
    label: 'Sand Dunes',
    duration: '0:14'
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

export const StockVideoPicker = forwardRef<HTMLButtonElement, StockVideoPickerProps>(({
  onSelect,
  children,
}, ref) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());

  const filteredVideos = STOCK_VIDEOS.filter(video => {
    const matchesCategory = category === 'all' || video.category === category;
    const matchesSearch = !search || video.label.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  };

  const handleThumbnailError = (videoId: string) => {
    setFailedThumbnails(prev => new Set([...prev, videoId]));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild ref={ref}>
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
                {/* Thumbnail with fallback */}
                <img
                  src={failedThumbnails.has(video.id) ? '/placeholder.svg' : video.thumbnail}
                  alt={video.label}
                  className="w-full h-full object-cover bg-muted"
                  onError={() => handleThumbnailError(video.id)}
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
});

StockVideoPicker.displayName = 'StockVideoPicker';

export default StockVideoPicker;
