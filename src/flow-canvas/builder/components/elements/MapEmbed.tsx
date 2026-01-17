import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

export interface MapEmbedProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  showMarker?: boolean;
  className?: string;
  isBuilder?: boolean;
}

export const MapEmbed: React.FC<MapEmbedProps> = ({
  address = '',
  latitude,
  longitude,
  zoom = 15,
  mapType = 'roadmap',
  width = '100%',
  height = 300,
  borderRadius = 12,
  showMarker = true,
  className,
  isBuilder = false,
}) => {
  const embedUrl = useMemo(() => {
    // If we have coordinates, use them
    if (latitude !== undefined && longitude !== undefined) {
      return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${latitude},${longitude}&zoom=${zoom}&maptype=${mapType}`;
    }
    
    // If we have an address, geocode it
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=${zoom}&maptype=${mapType}`;
    }
    
    return null;
  }, [address, latitude, longitude, zoom, mapType]);

  // Empty state
  if (!address && latitude === undefined) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-xl',
          'bg-muted/30 border-muted-foreground/20',
          className
        )}
        style={{ 
          width, 
          height, 
          borderRadius 
        }}
      >
        <MapPin className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground text-center px-4">
          {isBuilder 
            ? 'Enter an address in the settings panel' 
            : 'No location specified'}
        </p>
      </div>
    );
  }

  // Use OpenStreetMap as fallback (no API key required)
  const fallbackUrl = useMemo(() => {
    if (latitude !== undefined && longitude !== undefined) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    }
    // For address-based, we'll show a static placeholder and link
    return null;
  }, [latitude, longitude]);

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      style={{ width, height, borderRadius }}
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : fallbackUrl ? (
        <iframe
          src={fallbackUrl}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius }}
        />
      ) : (
        // Static map placeholder with link
        <div 
          className="w-full h-full flex flex-col items-center justify-center bg-muted/50"
          style={{ borderRadius }}
        >
          <MapPin className="w-10 h-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3 text-center px-4">
            {address}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View on Google Maps →
          </a>
        </div>
      )}

      {/* Overlay for builder to prevent iframe interaction */}
      {isBuilder && (
        <div 
          className="absolute inset-0 cursor-pointer"
          style={{ borderRadius }}
        />
      )}
    </div>
  );
};

export default MapEmbed;
