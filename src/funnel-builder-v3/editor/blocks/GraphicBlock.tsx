import React from 'react';
import { GraphicContent } from '@/funnel-builder-v3/types/funnel';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphicBlockProps {
  content: GraphicContent;
}

export function GraphicBlock({ content }: GraphicBlockProps) {
  const { type, value, size, color } = content;

  if (type === 'emoji') {
    return (
      <div className="flex justify-center">
        <span style={{ fontSize: size }} className="leading-none">
          {value}
        </span>
      </div>
    );
  }

  if (type === 'icon') {
    // Dynamically get icon from lucide-react
    const IconComponent = (LucideIcons as any)[value] || LucideIcons.HelpCircle;
    return (
      <div className="flex justify-center">
        <IconComponent
          style={{ width: size, height: size, color: color || 'currentColor' }}
          className="text-primary"
        />
      </div>
    );
  }

  if (type === 'shape') {
    const shapeStyles: Record<string, string> = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-lg',
      diamond: 'rotate-45 rounded-sm',
    };

    return (
      <div className="flex justify-center">
        <div
          className={cn(shapeStyles[value] || 'rounded-full', 'bg-primary')}
          style={{
            width: size,
            height: size,
            backgroundColor: color || undefined,
          }}
        />
      </div>
    );
  }

  return null;
}
