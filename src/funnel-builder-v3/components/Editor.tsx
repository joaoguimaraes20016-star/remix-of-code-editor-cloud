/**
 * Funnel Builder v3 - Main Editor Shell
 * 
 * Clean, simple, ~300 lines.
 * Three-panel layout: LeftPanel | Canvas | RightPanel
 */

import { useState, useCallback } from 'react';
import { Funnel, Screen, Block, BlockType, ScreenType } from '../types/funnel';
import { useFunnelState } from '../hooks/useFunnelState';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { Toolbar } from './Toolbar';

interface EditorProps {
  initialFunnel: Funnel;
  onSave: (funnel: Funnel) => Promise<void> | void;
  onPublish?: () => void;
  onBack?: () => void;
}

export function Editor({ initialFunnel, onSave, onPublish, onBack }: EditorProps) {
  const {
    funnel,
    isDirty,
    updateSettings,
    addScreen,
    updateScreen,
    deleteScreen,
    reorderScreens,
    duplicateScreen,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    duplicateBlock,
    forceSave,
  } = useFunnelState(initialFunnel, { onSave });

  // Selection state
  const [selectedScreenId, setSelectedScreenId] = useState<string>(
    funnel.screens[0]?.id || ''
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Derived state
  const selectedScreen = funnel.screens.find(s => s.id === selectedScreenId) || null;
  const selectedBlock = selectedScreen?.blocks.find(b => b.id === selectedBlockId) || null;

  // Screen handlers
  const handleSelectScreen = useCallback((screenId: string) => {
    setSelectedScreenId(screenId);
    setSelectedBlockId(null);
  }, []);

  const handleAddScreen = useCallback((type: ScreenType) => {
    const name = getScreenTypeName(type);
    addScreen(type, name, selectedScreenId);
  }, [addScreen, selectedScreenId]);

  const handleDeleteScreen = useCallback((screenId: string) => {
    deleteScreen(screenId);
    // Select next screen
    const remaining = funnel.screens.filter(s => s.id !== screenId);
    if (remaining.length > 0) {
      setSelectedScreenId(remaining[0].id);
    }
  }, [deleteScreen, funnel.screens]);

  const handleDuplicateScreen = useCallback((screenId: string) => {
    duplicateScreen(screenId);
  }, [duplicateScreen]);

  // Block handlers
  const handleSelectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);

  const handleAddBlock = useCallback((type: BlockType) => {
    if (!selectedScreenId) return;
    addBlock(selectedScreenId, type, selectedBlockId || undefined);
  }, [addBlock, selectedScreenId, selectedBlockId]);

  const handleUpdateBlock = useCallback((updates: Partial<Block>) => {
    if (!selectedScreenId || !selectedBlockId) return;
    updateBlock(selectedScreenId, selectedBlockId, updates);
  }, [updateBlock, selectedScreenId, selectedBlockId]);

  const handleDeleteBlock = useCallback(() => {
    if (!selectedScreenId || !selectedBlockId) return;
    deleteBlock(selectedScreenId, selectedBlockId);
    setSelectedBlockId(null);
  }, [deleteBlock, selectedScreenId, selectedBlockId]);

  const handleDuplicateBlock = useCallback(() => {
    if (!selectedScreenId || !selectedBlockId) return;
    duplicateBlock(selectedScreenId, selectedBlockId);
  }, [duplicateBlock, selectedScreenId, selectedBlockId]);

  const handleReorderBlocks = useCallback((blockIds: string[]) => {
    if (!selectedScreenId) return;
    reorderBlocks(selectedScreenId, blockIds);
  }, [reorderBlocks, selectedScreenId]);

  // Preview toggle
  const handleTogglePreview = useCallback(() => {
    setPreviewMode(prev => !prev);
    if (!previewMode) {
      setSelectedBlockId(null);
    }
  }, [previewMode]);

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--builder-v3-bg))]" data-theme="builder">
      <Toolbar
        funnelName={funnel.name}
        previewMode={previewMode}
        isDirty={isDirty}
        onTogglePreview={handleTogglePreview}
        onPublish={onPublish}
        onSave={forceSave}
        onBack={onBack}
      />

      <div className="flex-1 flex overflow-hidden bg-[hsl(var(--builder-v3-canvas-bg))]">
        {/* Left Panel - Screen List */}
        {!previewMode && (
          <LeftPanel
            screens={funnel.screens}
            selectedScreenId={selectedScreenId}
            onSelectScreen={handleSelectScreen}
            onAddScreen={handleAddScreen}
            onDeleteScreen={handleDeleteScreen}
            onDuplicateScreen={handleDuplicateScreen}
            onReorderScreens={reorderScreens}
          />
        )}

        {/* Canvas - Preview Area */}
        <Canvas
          screen={selectedScreen}
          selectedBlockId={selectedBlockId}
          onSelectBlock={handleSelectBlock}
          onReorderBlocks={handleReorderBlocks}
          previewMode={previewMode}
          settings={funnel.settings}
        />

        {/* Right Panel - Properties */}
        {!previewMode && (
          <RightPanel
            screen={selectedScreen}
            block={selectedBlock}
            onUpdateScreen={(updates) => selectedScreenId && updateScreen(selectedScreenId, updates)}
            onUpdateBlock={handleUpdateBlock}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
          />
        )}
      </div>
    </div>
  );
}

// Helper
function getScreenTypeName(type: ScreenType): string {
  switch (type) {
    case 'content': return 'Content';
    case 'form': return 'Form';
    case 'choice': return 'Choice';
    case 'calendar': return 'Calendar';
    case 'thankyou': return 'Thank You';
    default: return 'Screen';
  }
}
