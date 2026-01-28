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
      className="builder-v3-canvas-viewport flex-1 flex items-center justify-center p-8 overflow-auto"
      data-preview={previewMode ? 'true' : undefined}
    >
      {/* Device Frame */}
      <div className="builder-v3-device-frame builder-v3-device-frame--mobile">
        {/* Phone Notch */}
        <div className="builder-v3-phone-notch">
          <div className="builder-v3-phone-notch-inner" />
        </div>
        
        {/* Device Screen */}
        <div 
          className="builder-v3-device-screen"
          style={{
            ...getBackgroundStyle(),
            fontFamily: settings.fontFamily || 'Inter, sans-serif',
          }}
          onClick={handleCanvasClick}
        >
          {/* Screen Content */}
          <div className="builder-v3-device-screen-content">
            {/* Progress Bar */}
            {settings.showProgress && (
              <div className="builder-v3-progress-bar">
                <div 
                  className="builder-v3-progress-fill" 
                  style={{ width: '33%' }}
                />
              </div>
            )}

            {/* Blocks */}
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
        
        {/* Home Bar */}
        <div className="builder-v3-device-home-bar">
          <div className="builder-v3-home-indicator" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ previewMode }: { previewMode: boolean }) {
  if (previewMode) {
    return (
      <div className="builder-v3-empty-page-state">
        <p className="builder-v3-empty-page-label">This screen is empty</p>
      </div>
    );
  }

  return (
    <div className="builder-v3-empty-page-state">
      <div className="builder-v3-empty-page-add-btn">
        <Plus className="h-6 w-6" />
      </div>
      <p className="builder-v3-empty-page-label">Add blocks from the right panel</p>
    </div>
  );
}
