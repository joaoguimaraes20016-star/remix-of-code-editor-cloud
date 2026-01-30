import { useEffect, useCallback } from 'react';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

interface KeyboardShortcutsOptions {
  onAddBlock?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { 
    currentStepId, 
    selectedBlockId, 
    deleteBlock, 
    duplicateBlock, 
    undo, 
    redo,
    canUndo,
    canRedo,
    setSelectedBlockId,
    funnel,
    canvasZoom,
    setCanvasZoom,
  } = useFunnel();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    ) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Delete or Backspace - Delete selected block
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && currentStepId) {
      e.preventDefault();
      deleteBlock(currentStepId, selectedBlockId);
    }

    // Cmd/Ctrl + D - Duplicate selected block
    if (cmdOrCtrl && e.key === 'd' && selectedBlockId && currentStepId) {
      e.preventDefault();
      duplicateBlock(currentStepId, selectedBlockId);
    }

    // Cmd/Ctrl + Z - Undo
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey && canUndo) {
      e.preventDefault();
      undo();
    }

    // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y - Redo
    if (cmdOrCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) {
      e.preventDefault();
      redo();
    }

    // Cmd/Ctrl + A - Add block (opens modal)
    if (cmdOrCtrl && e.key === 'a' && !e.shiftKey && currentStepId) {
      // Only if no block is selected to avoid conflicting with text select all
      if (!selectedBlockId && options.onAddBlock) {
        e.preventDefault();
        options.onAddBlock();
      }
    }

    // Escape - Deselect block
    if (e.key === 'Escape' && selectedBlockId) {
      e.preventDefault();
      setSelectedBlockId(null);
    }

    // Arrow keys - Navigate between blocks
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && currentStepId) {
      const currentStep = funnel.steps.find(s => s.id === currentStepId);
      if (!currentStep || currentStep.blocks.length === 0) return;

      if (!selectedBlockId) {
        // Select first block if none selected
        setSelectedBlockId(currentStep.blocks[0].id);
        e.preventDefault();
        return;
      }

      const currentIndex = currentStep.blocks.findIndex(b => b.id === selectedBlockId);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (e.key === 'ArrowUp') {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(currentStep.blocks.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        e.preventDefault();
        setSelectedBlockId(currentStep.blocks[newIndex].id);
      }
    }

    // Cmd/Ctrl + Plus - Zoom in
    if (cmdOrCtrl && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      const newZoom = Math.min(MAX_ZOOM, canvasZoom + ZOOM_STEP);
      setCanvasZoom(Math.round(newZoom * 100) / 100);
    }

    // Cmd/Ctrl + Minus - Zoom out
    if (cmdOrCtrl && e.key === '-') {
      e.preventDefault();
      const newZoom = Math.max(MIN_ZOOM, canvasZoom - ZOOM_STEP);
      setCanvasZoom(Math.round(newZoom * 100) / 100);
    }
  }, [
    currentStepId, 
    selectedBlockId, 
    deleteBlock, 
    duplicateBlock, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    setSelectedBlockId,
    funnel,
    canvasZoom,
    setCanvasZoom,
    options.onAddBlock,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
