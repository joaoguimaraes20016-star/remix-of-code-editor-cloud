import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Funnel, FunnelStep, Block, ViewportType } from '@/funnel-builder-v3/types/funnel';
import { createEmptyFunnel } from '@/funnel-builder-v3/lib/templates';
import { v4 as uuid } from 'uuid';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';

interface FunnelContextType {
  funnel: Funnel;
  currentStepId: string | null;
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  currentViewport: ViewportType;
  canvasZoom: number;
  effectiveZoom: number;
  mediaGallery: string[];
  setFunnel: (funnel: Funnel) => void;
  setCurrentStepId: (id: string | null) => void;
  setSelectedBlockId: (id: string | null) => void;
  setPreviewMode: (mode: boolean) => void;
  setCurrentViewport: (viewport: ViewportType) => void;
  setCanvasZoom: (zoom: number) => void;
  setEffectiveZoom: (zoom: number) => void;
  
  // Step operations
  addStep: () => void;
  deleteStep: (stepId: string) => void;
  updateStep: (stepId: string, updates: Partial<FunnelStep>) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;
  
  // Block operations
  addBlock: (stepId: string, blockType: Block['type'], index?: number) => void;
  addBlocks: (stepId: string, blockTypes: Block['type'][]) => void;
  deleteBlock: (stepId: string, blockId: string) => void;
  updateBlock: (stepId: string, blockId: string, updates: Partial<Block>) => void;
  updateBlockContent: (stepId: string, blockId: string, contentUpdates: any) => void;
  reorderBlocks: (stepId: string, fromIndex: number, toIndex: number) => void;
  duplicateBlock: (stepId: string, blockId: string) => void;
  
  // Funnel operations
  exportFunnel: () => string;
  importFunnel: (json: string) => boolean;
  
  // Media gallery
  addToGallery: (url: string) => void;
  removeFromGallery: (url: string) => void;
  
  // History (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Context for funnel state management - exported for direct access in components that need graceful null handling
export const FunnelContext = createContext<FunnelContextType | null>(null);

const MAX_HISTORY = 50;

const FUNNEL_STORAGE_KEY = 'funnel-editor-state';

// Load funnel from localStorage
function loadFunnelFromStorage(): Funnel | null {
  try {
    const saved = localStorage.getItem(FUNNEL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.id && parsed.steps && Array.isArray(parsed.steps)) {
        return parsed;
      }
    }
  } catch {
    // Invalid JSON, ignore
  }
  return null;
}

// Save funnel to localStorage
function saveFunnelToStorage(funnel: Funnel) {
  try {
    localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(funnel));
  } catch {
    // Storage full or unavailable, ignore
  }
}

export function FunnelProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or create new
  const [funnel, setFunnelState] = useState<Funnel>(() => {
    return loadFunnelFromStorage() || createEmptyFunnel();
  });
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [currentViewport, setCurrentViewportState] = useState<ViewportType>('mobile');
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [effectiveZoom, setEffectiveZoom] = useState<number>(1);
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);

  // Auto-save funnel to localStorage whenever it changes
  useEffect(() => {
    saveFunnelToStorage(funnel);
  }, [funnel]);

  // Load media gallery from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('funnel-media-gallery');
    if (saved) {
      try {
        setMediaGallery(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save media gallery to localStorage on change
  useEffect(() => {
    localStorage.setItem('funnel-media-gallery', JSON.stringify(mediaGallery));
  }, [mediaGallery]);

  // Add to gallery
  const addToGallery = useCallback((url: string) => {
    if (!url || url.startsWith('data:')) return; // Don't store base64 in localStorage (too large)
    setMediaGallery(prev => {
      if (prev.includes(url)) return prev;
      return [url, ...prev].slice(0, 50); // Keep last 50
    });
  }, []);

  // Remove from gallery
  const removeFromGallery = useCallback((url: string) => {
    setMediaGallery(prev => prev.filter(u => u !== url));
  }, []);

  // When viewport changes, reset zoom to 100% (baseline)
  const setCurrentViewport = (viewport: ViewportType) => {
    setCurrentViewportState(viewport);
    setCanvasZoom(1); // Always reset to 100% on viewport change
  };
  
  const [history, setHistory] = useState<Funnel[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Initialize current step when funnel changes
  React.useEffect(() => {
    if (!currentStepId && funnel.steps.length > 0) {
      setCurrentStepId(funnel.steps[0].id);
    }
  }, [funnel, currentStepId]);

  // Handle escape key for preview mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewMode) {
        setPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode]);
  
  const pushToHistory = useCallback((currentFunnel: Funnel) => {
    setHistory(prev => {
      // Slice history to current position (discard any "future" states after undo)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentFunnel);
      // Keep within max limit
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);
  
  const setFunnel = useCallback((newFunnel: Funnel) => {
    // Save current state to history before updating
    pushToHistory(funnel);
    setFunnelState({ ...newFunnel, updatedAt: new Date().toISOString() });
  }, [funnel, pushToHistory]);
  
  const undo = useCallback(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      const previousState = history[historyIndex];
      setHistoryIndex(prev => prev - 1);
      setFunnelState(previousState);
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      setFunnelState(nextState);
    }
  }, [history, historyIndex]);
  
  // Step operations
  const addStep = useCallback(() => {
    const newStep: FunnelStep = {
      id: uuid(),
      name: `Step ${funnel.steps.length + 1}`,
      type: 'capture',
      slug: `step-${funnel.steps.length + 1}`,
      blocks: [],
      settings: {},
    };
    setFunnel({
      ...funnel,
      steps: [...funnel.steps, newStep],
    });
    setCurrentStepId(newStep.id);
  }, [funnel, setFunnel]);
  
  const deleteStep = useCallback((stepId: string) => {
    if (funnel.steps.length <= 1) return;
    const newSteps = funnel.steps.filter(s => s.id !== stepId);
    setFunnel({ ...funnel, steps: newSteps });
    if (currentStepId === stepId) {
      setCurrentStepId(newSteps[0]?.id || null);
    }
  }, [funnel, currentStepId, setFunnel]);
  
  const updateStep = useCallback((stepId: string, updates: Partial<FunnelStep>) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
  }, [funnel, setFunnel]);
  
  const reorderSteps = useCallback((fromIndex: number, toIndex: number) => {
    const newSteps = [...funnel.steps];
    const [removed] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, removed);
    setFunnel({ ...funnel, steps: newSteps });
  }, [funnel, setFunnel]);
  
  // Block operations
  const addBlock = useCallback((stepId: string, blockType: Block['type'], index?: number) => {
    const definition = blockDefinitions[blockType];
    const newBlock: Block = {
      id: uuid(),
      type: blockType,
      content: JSON.parse(JSON.stringify(definition.defaultContent)),
      styles: JSON.parse(JSON.stringify(definition.defaultStyles)),
    };
    
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        const newBlocks = [...step.blocks];
        if (index !== undefined) {
          newBlocks.splice(index, 0, newBlock);
        } else {
          newBlocks.push(newBlock);
        }
        return { ...step, blocks: newBlocks };
      }),
    });
    setSelectedBlockId(newBlock.id);
  }, [funnel, setFunnel]);

  // Batch add multiple blocks atomically (avoids race conditions)
  const addBlocks = useCallback((stepId: string, blockTypes: Block['type'][]) => {
    const newBlocks: Block[] = blockTypes.map(blockType => {
      const definition = blockDefinitions[blockType];
      return {
        id: uuid(),
        type: blockType,
        content: JSON.parse(JSON.stringify(definition.defaultContent)),
        styles: JSON.parse(JSON.stringify(definition.defaultStyles)),
      };
    });
    
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        return { ...step, blocks: [...step.blocks, ...newBlocks] };
      }),
    });
    
    if (newBlocks.length > 0) {
      setSelectedBlockId(newBlocks[0].id);
    }
  }, [funnel, setFunnel]);
  
  const deleteBlock = useCallback((stepId: string, blockId: string) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        return { ...step, blocks: step.blocks.filter(b => b.id !== blockId) };
      }),
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [funnel, selectedBlockId, setFunnel]);
  
  const updateBlock = useCallback((stepId: string, blockId: string, updates: Partial<Block>) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          blocks: step.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
        };
      }),
    });
  }, [funnel, setFunnel]);

  const updateBlockContent = useCallback((stepId: string, blockId: string, contentUpdates: any) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          blocks: step.blocks.map(b => 
            b.id === blockId 
              ? { ...b, content: { ...b.content, ...contentUpdates } } 
              : b
          ),
        };
      }),
    });
  }, [funnel, setFunnel]);
  
  const reorderBlocks = useCallback((stepId: string, fromIndex: number, toIndex: number) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        const newBlocks = [...step.blocks];
        const [removed] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(toIndex, 0, removed);
        return { ...step, blocks: newBlocks };
      }),
    });
  }, [funnel, setFunnel]);
  
  const duplicateBlock = useCallback((stepId: string, blockId: string) => {
    setFunnel({
      ...funnel,
      steps: funnel.steps.map(step => {
        if (step.id !== stepId) return step;
        const blockIndex = step.blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return step;
        const originalBlock = step.blocks[blockIndex];
        const newBlock: Block = {
          ...JSON.parse(JSON.stringify(originalBlock)),
          id: uuid(),
        };
        const newBlocks = [...step.blocks];
        newBlocks.splice(blockIndex + 1, 0, newBlock);
        return { ...step, blocks: newBlocks };
      }),
    });
  }, [funnel, setFunnel]);
  
  // Import/Export
  const exportFunnel = useCallback(() => {
    return JSON.stringify(funnel, null, 2);
  }, [funnel]);
  
  const importFunnel = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.id && parsed.steps && Array.isArray(parsed.steps)) {
        setFunnel(parsed);
        setCurrentStepId(parsed.steps[0]?.id || null);
        setSelectedBlockId(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [setFunnel]);
  
  return (
    <FunnelContext.Provider value={{
      funnel,
      currentStepId,
      selectedBlockId,
      isPreviewMode,
      currentViewport,
      canvasZoom,
      effectiveZoom,
      mediaGallery,
      setFunnel,
      setCurrentStepId,
      setSelectedBlockId,
      setPreviewMode,
      setCurrentViewport,
      setCanvasZoom,
      setEffectiveZoom,
      addStep,
      deleteStep,
      updateStep,
      reorderSteps,
      addBlock,
      addBlocks,
      deleteBlock,
      updateBlock,
      updateBlockContent,
      reorderBlocks,
      duplicateBlock,
      exportFunnel,
      importFunnel,
      addToGallery,
      removeFromGallery,
      undo,
      redo,
      canUndo: historyIndex >= 0,
      canRedo: historyIndex < history.length - 1,
    }}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const context = useContext(FunnelContext);
  if (!context) {
    throw new Error('useFunnel must be used within a FunnelProvider');
  }
  return context;
}
