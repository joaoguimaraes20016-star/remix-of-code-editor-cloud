/**
 * Funnel Builder v3 - Main Editor Shell
 * 
 * Enhanced with device mode, theme toggle, panel collapse, keyboard shortcuts.
 * Three-panel layout: LeftPanel | Canvas | RightPanel
 */

import { useState, useCallback, useEffect } from 'react';
import { Funnel, Screen, Block, BlockType, ScreenType } from '../types/funnel';
import { useFunnelState } from '../hooks/useFunnelState';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { RightPanel } from './RightPanel';
import { Toolbar, DeviceMode, SaveStatus } from './Toolbar';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';

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

  // Device mode state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('mobile');
  
  // Editor theme state (light by default to match brand aesthetic)
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('dark');
  
  // Panel collapse state
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  // Save status (for now, track based on isDirty)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Derived state
  const selectedScreen = funnel.screens.find(s => s.id === selectedScreenId) || null;
  const selectedBlock = selectedScreen?.blocks.find(b => b.id === selectedBlockId) || null;

  // Sync editor theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (editorTheme === 'light') {
      root.setAttribute('data-builder-theme', 'light');
    } else {
      root.removeAttribute('data-builder-theme');
    }
    
    return () => {
      root.removeAttribute('data-builder-theme');
    };
  }, [editorTheme]);

  // Track save status based on isDirty
  useEffect(() => {
    if (isDirty) {
      setSaveStatus('pending');
    } else {
      setSaveStatus('saved');
      // Reset to idle after showing "Saved" briefly
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isDirty]);

  // Keyboard shortcuts for undo/redo (placeholder - needs history hook)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;
      if (!isModifier) return;
      
      // Undo: Cmd+Z
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // TODO: Implement undo when history hook is added
        console.log('Undo triggered');
      }
      
      // Redo: Cmd+Shift+Z or Cmd+Y
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        // TODO: Implement redo when history hook is added
        console.log('Redo triggered');
      }
      
      // Save: Cmd+S
      if (e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

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

  // Theme toggle
  const handleThemeToggle = useCallback(() => {
    setEditorTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Get grid template columns based on panel collapse state
  const getGridTemplateColumns = () => {
    if (leftPanelCollapsed && rightPanelCollapsed) {
      return 'builder-v3-editor-shell--both-collapsed';
    }
    if (leftPanelCollapsed) {
      return 'builder-v3-editor-shell--left-collapsed';
    }
    if (rightPanelCollapsed) {
      return 'builder-v3-editor-shell--right-collapsed';
    }
    return '';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen flex flex-col bg-[hsl(var(--builder-v3-bg))]" data-theme="builder">
        <Toolbar
          funnelName={funnel.name}
          previewMode={previewMode}
          isDirty={isDirty}
          onTogglePreview={handleTogglePreview}
          onPublish={onPublish}
          onSave={forceSave}
          onBack={onBack}
          deviceMode={deviceMode}
          onDeviceModeChange={setDeviceMode}
          editorTheme={editorTheme}
          onThemeToggle={handleThemeToggle}
          canUndo={false} // TODO: Wire up when history hook is added
          canRedo={false}
          onUndo={() => console.log('Undo')}
          onRedo={() => console.log('Redo')}
          saveStatus={saveStatus}
        />

        <div className={cn(
          'builder-v3-editor-shell',
          getGridTemplateColumns()
        )}>
          {/* Panel Toggle - Left (shown when collapsed) */}
          {leftPanelCollapsed && !previewMode && (
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              className="builder-v3-panel-toggle builder-v3-panel-toggle--left"
            >
              <PanelLeftClose className="h-4 w-4 rotate-180" />
            </button>
          )}

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
              isCollapsed={leftPanelCollapsed}
              onToggleCollapse={() => setLeftPanelCollapsed(true)}
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
            deviceMode={deviceMode}
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
              isCollapsed={rightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(true)}
            />
          )}

          {/* Panel Toggle - Right (shown when collapsed) */}
          {rightPanelCollapsed && !previewMode && (
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="builder-v3-panel-toggle builder-v3-panel-toggle--right"
            >
              <PanelRightClose className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
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
