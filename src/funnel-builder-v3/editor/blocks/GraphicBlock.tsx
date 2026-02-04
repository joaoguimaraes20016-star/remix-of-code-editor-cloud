import React from 'react';
import { GraphicContent } from '@/funnel-builder-v3/types/funnel';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

interface GraphicBlockProps {
  content: GraphicContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function GraphicBlock({ content, blockId, stepId, isPreview }: GraphicBlockProps) {
  const { type, value, size, color } = content;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'graphic',
    hintText: 'Click to edit graphic'
  });

  if (type === 'emoji') {
    return wrapWithOverlay(
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
    return wrapWithOverlay(
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

    return wrapWithOverlay(
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
