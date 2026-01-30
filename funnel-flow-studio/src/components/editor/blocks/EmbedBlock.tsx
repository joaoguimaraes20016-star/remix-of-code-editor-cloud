import React from 'react';
import { EmbedContent } from '@/types/funnel';
import { Code, Star, MapPin, Award, Building2 } from 'lucide-react';

interface EmbedBlockProps {
  content: EmbedContent;
}

const providerInfo = {
  kununu: {
    name: 'Kununu',
    icon: Building2,
    placeholder: 'Embed your Kununu company reviews widget',
  },
  trustpilot: {
    name: 'Trustpilot',
    icon: Star,
    placeholder: 'Embed your Trustpilot reviews widget',
  },
  provenexpert: {
    name: 'Proven Expert',
    icon: Award,
    placeholder: 'Embed your ProvenExpert profile widget',
  },
  googlemaps: {
    name: 'Google Maps',
    icon: MapPin,
    placeholder: 'Embed a Google Maps location',
  },
  html: {
    name: 'Custom HTML',
    icon: Code,
    placeholder: 'Add your custom HTML embed code',
  },
};

export function EmbedBlock({ content }: EmbedBlockProps) {
  const { provider, embedCode, url, height = 400 } = content;
  const info = providerInfo[provider];
  const Icon = info.icon;

  // If there's a URL (for iframe embeds like Google Maps)
  if (url) {
    return (
      <div className="rounded-lg overflow-hidden border border-border">
        <iframe
          src={url}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  // If there's custom embed code
  if (embedCode) {
    return (
      <div 
        className="rounded-lg overflow-hidden"
        dangerouslySetInnerHTML={{ __html: embedCode }}
      />
    );
  }

  // Placeholder when no embed is configured
  return (
    <div 
      className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 text-center p-8"
      style={{ minHeight: height / 2 }}
    >
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{info.name}</p>
        <p className="text-sm text-muted-foreground">{info.placeholder}</p>
      </div>
    </div>
  );
}
