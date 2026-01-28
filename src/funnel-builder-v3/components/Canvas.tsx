/**
 * Funnel Builder v3 - Canvas (Preview Area)
 */

import { Screen, Block, FunnelSettings } from '../types/funnel';
import { BlockRenderer } from './blocks/BlockRenderer';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CanvasProps {
  screen: Screen | null;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onReorderBlocks: (blockIds: string[]) => void;
  previewMode: boolean;
  settings: FunnelSettings;
}

export function Canvas({
  screen,
  selectedBlockId,
  onSelectBlock,
  onReorderBlocks,
  previewMode,
  settings,
}: CanvasProps) {
  if (!screen) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">No screen selected</p>
      </div>
    );
  }

  // Background styles
  const getBackgroundStyle = () => {
    if (!screen.background) {
      return { backgroundColor: 'hsl(var(--background))' };
    }

    switch (screen.background.type) {
      case 'solid':
        return { backgroundColor: screen.background.color || 'hsl(var(--background))' };
      case 'gradient':
        const { from, to, angle } = screen.background.gradient || { from: '#fff', to: '#f0f0f0', angle: 180 };
        return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
      case 'image':
        return {
          backgroundImage: `url(${screen.background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      default:
        return {};
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !previewMode) {
      onSelectBlock(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 p-8 overflow-auto">
      {/* Device Frame */}
      <div
        className={cn(
          'w-full max-w-md min-h-[600px] rounded-2xl shadow-2xl overflow-hidden transition-all',
          previewMode ? 'ring-0' : 'ring-1 ring-border'
        )}
        style={{
          ...getBackgroundStyle(),
          fontFamily: settings.fontFamily || 'Inter, sans-serif',
        }}
        onClick={handleCanvasClick}
      >
        {/* Progress Bar */}
        {settings.showProgress && (
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: '33%' }}
            />
          </div>
        )}

        {/* Screen Content */}
        <div className="p-6 space-y-4">
          {screen.blocks.length === 0 ? (
            <EmptyState previewMode={previewMode} />
          ) : (
            screen.blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                isSelected={block.id === selectedBlockId}
                onSelect={() => onSelectBlock(block.id)}
                previewMode={previewMode}
                primaryColor={settings.primaryColor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ previewMode }: { previewMode: boolean }) {
  if (previewMode) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>This screen is empty</p>
      </div>
    );
  }

  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Plus className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-2">This screen is empty</p>
      <p className="text-sm text-muted-foreground">
        Add blocks from the right panel
      </p>
    </div>
  );
}
