import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LogoMarqueeProps {
  logos: Array<{
    id: string;
    src: string;
    alt?: string;
    url?: string;
    name?: string; // Text fallback for Perspective-style wordmarks
  }>;
  animated?: boolean;
  speed?: number; // seconds for one complete scroll
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  grayscale?: boolean;
  logoHeight?: number;
  gap?: number;
  // NEW: Enhanced features
  fadeEdgeWidth?: number; // 0-100px
  hoverEffect?: 'none' | 'color' | 'scale' | 'both';
  backgroundColor?: string;
  className?: string;
  isBuilder?: boolean;
  onLogosChange?: (logos: LogoMarqueeProps['logos']) => void;
  // NEW: Perspective-style text-based logos
  showTextFallback?: boolean;
}

export const LogoMarquee: React.FC<LogoMarqueeProps> = ({
  logos = [],
  animated = true,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  grayscale = true,
  logoHeight = 40,
  gap = 48,
  fadeEdgeWidth = 48,
  hoverEffect = 'color',
  backgroundColor,
  className,
  isBuilder = false,
  onLogosChange,
  showTextFallback = false,
}) => {
  // Builder-only: Add logo
  const handleAddLogo = () => {
    if (!onLogosChange) return;
    const newLogo = {
      id: `logo-${Date.now()}`,
      src: '',
      alt: `Logo ${logos.length + 1}`,
    };
    onLogosChange([...logos, newLogo]);
  };

  // Builder-only: Remove logo
  const handleRemoveLogo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLogosChange) return;
    onLogosChange(logos.filter(l => l.id !== id));
  };

  // Empty state
  if (logos.length === 0) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center py-8',
          'border-2 border-dashed rounded-xl',
          'bg-muted/30 border-muted-foreground/20',
          className
        )}
      >
        <ImageIcon className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No logos added</p>
        {isBuilder && onLogosChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddLogo}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Logo
          </Button>
        )}
      </div>
    );
  }

  // Static display (no animation)
  if (!animated) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center flex-wrap',
          className
        )}
        style={{ gap }}
      >
        {logos.map((logo) => (
          <LogoItem 
            key={logo.id}
            logo={logo}
            height={logoHeight}
            grayscale={grayscale}
            hoverEffect={hoverEffect}
            isBuilder={isBuilder}
            onRemove={(e) => handleRemoveLogo(logo.id, e)}
            showTextFallback={showTextFallback}
          />
        ))}
        {isBuilder && onLogosChange && (
          <button
            onClick={handleAddLogo}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // Animated marquee
  // We duplicate the logos to create seamless loop
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div 
      className={cn(
        'relative w-full overflow-hidden group',
        className
      )}
      style={{ backgroundColor }}
    >
      {/* Fade edges - use backgroundColor prop */}
      {fadeEdgeWidth > 0 && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none" 
            style={{ 
              width: fadeEdgeWidth,
              background: `linear-gradient(to right, ${backgroundColor || 'hsl(var(--background))'}, transparent)`
            }}
          />
          <div 
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none" 
            style={{ 
              width: fadeEdgeWidth,
              background: `linear-gradient(to left, ${backgroundColor || 'hsl(var(--background))'}, transparent)`
            }}
          />
        </>
      )}
      
      {/* Marquee track */}
      <div 
        className={cn(
          'flex items-center',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          gap,
          animation: `marquee-${direction} ${speed}s linear infinite`,
        }}
      >
        {duplicatedLogos.map((logo, index) => (
          <LogoItem 
            key={`${logo.id}-${index}`}
            logo={logo}
            height={logoHeight}
            grayscale={grayscale}
            hoverEffect={hoverEffect}
            isBuilder={isBuilder && index < logos.length}
            onRemove={(e) => handleRemoveLogo(logo.id, e)}
            showTextFallback={showTextFallback}
          />
        ))}
      </div>

      {/* Builder: Add button */}
      {isBuilder && onLogosChange && (
        <button
          onClick={handleAddLogo}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 z-20',
            'w-8 h-8 rounded-full bg-primary text-primary-foreground',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:scale-110'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      {/* Keyframes CSS */}
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

interface LogoItemProps {
  logo: LogoMarqueeProps['logos'][0];
  height: number;
  grayscale: boolean;
  hoverEffect: 'none' | 'color' | 'scale' | 'both';
  isBuilder: boolean;
  onRemove: (e: React.MouseEvent) => void;
  showTextFallback?: boolean;
}

const LogoItem: React.FC<LogoItemProps> = ({
  logo,
  height,
  grayscale,
  hoverEffect,
  isBuilder,
  onRemove,
  showTextFallback = false,
}) => {
  const getHoverClasses = () => {
    if (hoverEffect === 'none') return '';
    if (hoverEffect === 'color') return grayscale ? 'hover:grayscale-0 hover:opacity-100' : '';
    if (hoverEffect === 'scale') return 'hover:scale-110';
    if (hoverEffect === 'both') return cn(
      grayscale && 'hover:grayscale-0 hover:opacity-100',
      'hover:scale-110'
    );
    return '';
  };

  // Perspective-style text wordmark when no image
  const textFallback = showTextFallback && (logo.name || logo.alt) ? (
    <span 
      className={cn(
        'font-bold tracking-tight transition-all duration-300 select-none whitespace-nowrap',
        grayscale ? 'text-gray-400 opacity-60' : 'text-gray-700',
        hoverEffect !== 'none' && 'hover:text-gray-900 hover:opacity-100',
        hoverEffect === 'scale' && 'hover:scale-110',
        hoverEffect === 'both' && 'hover:scale-110 hover:text-gray-900 hover:opacity-100'
      )}
      style={{ 
        fontSize: Math.max(14, height * 0.45),
        letterSpacing: '-0.02em',
      }}
    >
      {logo.name || logo.alt}
    </span>
  ) : null;

  const content = logo.src ? (
    <img 
      src={logo.src}
      alt={logo.alt || 'Logo'}
      className={cn(
        'object-contain transition-all duration-300',
        grayscale && 'grayscale opacity-60',
        getHoverClasses()
      )}
      style={{ height, maxWidth: height * 3 }}
    />
  ) : textFallback ? textFallback : (
    <div 
      className="flex items-center justify-center bg-muted/50 rounded-lg"
      style={{ height, width: height * 2 }}
    >
      <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
    </div>
  );

  return (
    <div className="relative flex-shrink-0 group/logo">
      {logo.url && !isBuilder ? (
        <a href={logo.url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
      
      {isBuilder && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default LogoMarquee;
