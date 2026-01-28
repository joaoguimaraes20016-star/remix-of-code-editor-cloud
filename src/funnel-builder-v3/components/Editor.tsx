/**
 * Funnel Builder v3 - Main Editor Shell
 * 
 * Enhanced with device mode, theme toggle, panel collapse, keyboard shortcuts.
 * Three-panel layout: LeftPanel | Canvas | RightPanel
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Funnel, Screen, Block, BlockType, ScreenType } from '../types/funnel';
import { useFunnelState } from '../hooks/useFunnelState';
import { useHistory } from '../hooks/useHistory';
import { useClipboard } from '../hooks/useClipboard';
import { getTemplateBlocks } from '../data/blockTemplates';
import { LeftPanel } from './LeftPanel';
import { Canvas } from './Canvas';
import { PreviewCanvas } from './PreviewCanvas';
import { RightPanel } from './RightPanel';
import { Toolbar, DeviceMode, SaveStatus } from './Toolbar';
import { SectionPicker } from './SectionPicker';
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
  // History management
  const {
    funnel: historyFunnel,
    pushState,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory(initialFunnel);

  const {
    funnel,
    isDirty,
    setFunnel,
    updateSettings,
    addScreen,
    updateScreen,
    deleteScreen,
    reorderScreens,
    duplicateScreen,
    renameScreen,
    addBlock,
    addBlocks,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    duplicateBlock,
    pasteBlock,
    forceSave,
  } = useFunnelState(initialFunnel, { onSave });

  // Clipboard management
  const { copy, paste, hasClipboard } = useClipboard();

  // Sync history state to funnel state
  const lastHistoryFunnelRef = useRef(historyFunnel);
  useEffect(() => {
    if (JSON.stringify(historyFunnel) !== JSON.stringify(lastHistoryFunnelRef.current)) {
      lastHistoryFunnelRef.current = historyFunnel;
      setFunnel(historyFunnel);
    }
  }, [historyFunnel, setFunnel]);

  // Push funnel changes to history
  const lastFunnelRef = useRef(funnel);
  useEffect(() => {
    if (JSON.stringify(funnel) !== JSON.stringify(lastFunnelRef.current)) {
      lastFunnelRef.current = funnel;
      pushState(funnel);
    }
  }, [funnel, pushState]);

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
  
  // Section picker state
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  
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

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    historyUndo();
  }, [historyUndo]);

  const handleRedo = useCallback(() => {
    historyRedo();
  }, [historyRedo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isModifier = e.metaKey || e.ctrlKey;
      
      // Undo: Cmd+Z
      if (isModifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Redo: Cmd+Shift+Z or Cmd+Y
      if (isModifier && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      
      // Save: Cmd+S
      if (isModifier && e.key === 's') {
        e.preventDefault();
        forceSave();
        return;
      }

      // Copy: Cmd+C
      if (isModifier && e.key === 'c') {
        if (selectedBlock) {
          e.preventDefault();
          copy(selectedBlock);
        }
        return;
      }

      // Paste: Cmd+V
      if (isModifier && e.key === 'v') {
        e.preventDefault();
        const pastedBlock = paste();
        if (pastedBlock && selectedScreenId) {
          pasteBlock(selectedScreenId, pastedBlock, selectedBlockId || undefined);
        }
        return;
      }

      // Duplicate: Cmd+D
      if (isModifier && e.key === 'd') {
        e.preventDefault();
        if (selectedBlockId && selectedScreenId) {
          duplicateBlock(selectedScreenId, selectedBlockId);
        }
        return;
      }

      // Delete: Backspace or Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedBlockId && selectedScreenId) {
        e.preventDefault();
        deleteBlock(selectedScreenId, selectedBlockId);
        setSelectedBlockId(null);
        return;
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedBlockId(null);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave, handleUndo, handleRedo, selectedBlockId, selectedScreenId, selectedBlock, duplicateBlock, deleteBlock, copy, paste, pasteBlock]);

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

  const handleRenameScreen = useCallback((screenId: string, name: string) => {
    renameScreen(screenId, name);
  }, [renameScreen]);

  // Block handlers
  const handleSelectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);

  const handleAddBlock = useCallback((type: BlockType) => {
    if (!selectedScreenId) return;
    addBlock(selectedScreenId, type, selectedBlockId || undefined);
  }, [addBlock, selectedScreenId, selectedBlockId]);

  const handleAddTemplate = useCallback((templateId: string) => {
    if (!selectedScreenId) return;
    const blocks = getTemplateBlocks(templateId);
    if (blocks.length > 0) {
      addBlocks(selectedScreenId, blocks, selectedBlockId || undefined);
    }
  }, [addBlocks, selectedScreenId, selectedBlockId]);

  // Section picker handlers
  const handleOpenSectionPicker = useCallback(() => {
    setSectionPickerOpen(true);
  }, []);

  const handleSectionPickerSelect = useCallback((blockId: string) => {
    if (!selectedScreenId) return;
    
    // Map block ID to BlockType for known types
    const blockTypeMap: Record<string, BlockType> = {
      'heading': 'heading',
      'text': 'text',
      'button': 'button',
      'image': 'image',
      'video': 'video',
      'divider': 'divider',
      'spacer': 'spacer',
      'input': 'input',
      'choice': 'choice',
      'embed': 'embed',
      'icon': 'icon',
    };

    const blockType = blockTypeMap[blockId];
    if (blockType) {
      addBlock(selectedScreenId, blockType, selectedBlockId || undefined);
    } else {
      // For template-based blocks, try to get template
      const blocks = getTemplateBlocks(blockId);
      if (blocks.length > 0) {
        addBlocks(selectedScreenId, blocks, selectedBlockId || undefined);
      }
    }
    
    setSectionPickerOpen(false);
  }, [addBlock, addBlocks, selectedScreenId, selectedBlockId]);

  const handleQuickAdd = useCallback((type: 'hero' | 'cta' | 'form') => {
    if (!selectedScreenId) return;
    
    // Map quick-add types to default blocks
    switch (type) {
      case 'hero':
        addBlock(selectedScreenId, 'heading', selectedBlockId || undefined);
        break;
      case 'cta':
        addBlock(selectedScreenId, 'button', selectedBlockId || undefined);
        break;
      case 'form':
        addBlock(selectedScreenId, 'input', selectedBlockId || undefined);
        break;
    }
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

  // Get grid template columns based on panel collapse state AND preview mode
  const getGridTemplateColumns = () => {
    if (previewMode) {
      return 'builder-v3-editor-shell--preview';
    }
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
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          saveStatus={saveStatus}
        />

        <div className={cn(
          'builder-v3-editor-shell',
          getGridTemplateColumns()
        )}>
          {/* Left Panel - Screen List */}
          {!previewMode && !leftPanelCollapsed && (
            <LeftPanel
              screens={funnel.screens}
              selectedScreenId={selectedScreenId}
              selectedBlockId={selectedBlockId}
              onSelectScreen={handleSelectScreen}
              onSelectBlock={handleSelectBlock}
              onAddScreen={handleAddScreen}
              onDeleteScreen={handleDeleteScreen}
              onDuplicateScreen={handleDuplicateScreen}
              onRenameScreen={handleRenameScreen}
              onReorderScreens={reorderScreens}
              onAddTemplate={handleAddTemplate}
              isCollapsed={false}
              onToggleCollapse={() => setLeftPanelCollapsed(true)}
            />
          )}

          {/* Canvas - Edit or Preview Mode */}
          {previewMode ? (
            <PreviewCanvas
              funnel={funnel}
              deviceMode={deviceMode}
              onExitPreview={handleTogglePreview}
            />
          ) : (
            <Canvas
              screen={selectedScreen}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              onReorderBlocks={handleReorderBlocks}
              previewMode={false}
              settings={funnel.settings}
              deviceMode={deviceMode}
              onOpenSectionPicker={handleOpenSectionPicker}
              onQuickAdd={handleQuickAdd}
            />
          )}

          {/* Right Panel - Properties */}
          {!previewMode && !rightPanelCollapsed && (
            <RightPanel
              screen={selectedScreen}
              block={selectedBlock}
              funnelSettings={funnel.settings}
              onUpdateScreen={(updates) => selectedScreenId && updateScreen(selectedScreenId, updates)}
              onUpdateBlock={handleUpdateBlock}
              onUpdateSettings={updateSettings}
              onAddBlock={handleAddBlock}
              onDeleteBlock={handleDeleteBlock}
              onDuplicateBlock={handleDuplicateBlock}
              isCollapsed={false}
              onToggleCollapse={() => setRightPanelCollapsed(true)}
            />
          )}
        </div>

        {/* Panel Toggle Buttons - Outside grid to avoid layout interference */}
        {leftPanelCollapsed && !previewMode && (
          <button
            onClick={() => setLeftPanelCollapsed(false)}
            className="builder-v3-panel-toggle builder-v3-panel-toggle--left"
          >
            <PanelLeftClose className="h-4 w-4 rotate-180" />
          </button>
        )}

        {rightPanelCollapsed && !previewMode && (
          <button
            onClick={() => setRightPanelCollapsed(false)}
            className="builder-v3-panel-toggle builder-v3-panel-toggle--right"
          >
            <PanelRightClose className="h-4 w-4 rotate-180" />
          </button>
        )}

        {/* Section Picker Modal */}
        <SectionPicker
          isOpen={sectionPickerOpen}
          onClose={() => setSectionPickerOpen(false)}
          onSelectBlock={handleSectionPickerSelect}
        />
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
