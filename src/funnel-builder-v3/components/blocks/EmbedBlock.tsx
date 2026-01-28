/**
 * Embed Block
 */

import { Block } from '../../types/funnel';
import { cn } from '@/lib/utils';
import { Code, Calendar } from 'lucide-react';

interface EmbedBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  previewMode: boolean;
  primaryColor?: string;
}

export function EmbedBlock({ block, previewMode }: EmbedBlockProps) {
  const { embedType = 'html', embedCode, calendarUrl } = block.props;

  if (embedType === 'calendar') {
    if (!calendarUrl) {
      return (
        <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8 min-h-[300px]">
          <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
          {!previewMode && (
            <span className="text-sm text-muted-foreground">Add calendar URL</span>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-lg overflow-hidden min-h-[400px]">
        <iframe
          src={calendarUrl}
          className="w-full h-[500px] border-0"
          title="Calendar"
        />
      </div>
    );
  }

  // HTML embed
  if (!embedCode) {
    return (
      <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8 min-h-[200px]">
        <Code className="h-12 w-12 text-muted-foreground mb-2" />
        {!previewMode && (
          <span className="text-sm text-muted-foreground">Add embed code</span>
        )}
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg overflow-hidden"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  );
}
