/**
 * Funnel Builder v3 - Canvas (Preview Area)
 * Dark charcoal theme matching flow-canvas aesthetic
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
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--builder-v3-canvas-bg))' }}
      >
        <p className="text-[hsl(var(--builder-v3-text-muted))]">No screen selected</p>
      </div>
    );
  }

  // Background styles - default to white for content visibility
  const getBackgroundStyle = () => {
    const defaultBg = { backgroundColor: '#ffffff' };
    
    if (!screen.background) {
      return defaultBg;
    }

    switch (screen.background.type) {
      case 'solid':
        return { backgroundColor: screen.background.color || '#ffffff' };
      case 'gradient': {
        const { from, to, angle } = screen.background.gradient || { from: '#fff', to: '#f0f0f0', angle: 180 };
        return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
      }
      case 'image':
        return {
          backgroundImage: `url(${screen.background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#ffffff',
        };
      default:
        return defaultBg;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !previewMode) {
      onSelectBlock(null);
    }
  };

  return (
    <div 
      className="flex-1 flex items-center justify-center p-8 overflow-auto"
      style={{ backgroundColor: 'hsl(var(--builder-v3-canvas-bg))' }}
      data-preview={previewMode ? 'true' : undefined}
    >
      {/* Device Frame */}
      <div
        className={cn(
          'builder-v3-device-frame builder-v3-device-frame--mobile',
          'min-h-[600px] overflow-hidden relative',
          !previewMode && 'ring-1 ring-[hsl(var(--builder-v3-border)/0.3)]'
        )}
        style={{
          ...getBackgroundStyle(),
          fontFamily: settings.fontFamily || 'Inter, sans-serif',
        }}
        onClick={handleCanvasClick}
      >
        {/* Phone Notch */}
        <div className="builder-v3-phone-notch" />
        
        {/* Progress Bar */}
        {settings.showProgress && (
          <div className="h-1 bg-[hsl(var(--builder-v3-surface))]">
            <div 
              className="h-full bg-[hsl(var(--builder-v3-accent))] transition-all" 
              style={{ width: '33%' }}
            />
          </div>
        )}

        {/* Screen Content */}
        <div className="p-6 space-y-4 flex-1">
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
        
        {/* Home Indicator */}
        <div className="builder-v3-home-indicator" />
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
      <div className="w-12 h-12 rounded-full bg-[hsl(var(--builder-v3-surface-hover))] flex items-center justify-center mb-4">
        <Plus className="h-6 w-6 text-[hsl(var(--builder-v3-text-muted))]" />
      </div>
      <p className="text-[hsl(var(--builder-v3-text-secondary))] mb-2">This screen is empty</p>
      <p className="text-sm text-[hsl(var(--builder-v3-text-dim))]">
        Add blocks from the right panel
      </p>
    </div>
  );
}
