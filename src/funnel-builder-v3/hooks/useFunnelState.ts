/**
 * Funnel State Management Hook
 * 
 * Single source of truth for all funnel operations.
 * Uses useReducer for predictable state updates.
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { 
  Funnel, 
  Screen, 
  Block, 
  ScreenType, 
  BlockType,
  createId,
  createScreen,
  createBlock,
} from '../types/funnel';

// =============================================================================
// ACTIONS
// =============================================================================

type FunnelAction =
  | { type: 'SET_FUNNEL'; payload: Funnel }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Funnel['settings']> }
  | { type: 'ADD_SCREEN'; payload: { screenType: ScreenType; name: string; afterScreenId?: string } }
  | { type: 'UPDATE_SCREEN'; payload: { screenId: string; updates: Partial<Screen> } }
  | { type: 'DELETE_SCREEN'; payload: { screenId: string } }
  | { type: 'REORDER_SCREENS'; payload: { screenIds: string[] } }
  | { type: 'ADD_BLOCK'; payload: { screenId: string; blockType: BlockType; afterBlockId?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { screenId: string; blockId: string; updates: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: { screenId: string; blockId: string } }
  | { type: 'REORDER_BLOCKS'; payload: { screenId: string; blockIds: string[] } }
  | { type: 'DUPLICATE_BLOCK'; payload: { screenId: string; blockId: string } }
  | { type: 'DUPLICATE_SCREEN'; payload: { screenId: string } }
  | { type: 'MARK_SAVED' };

// =============================================================================
// REDUCER
// =============================================================================

interface FunnelState {
  funnel: Funnel;
  isDirty: boolean;
}

function funnelReducer(state: FunnelState, action: FunnelAction): FunnelState {
  switch (action.type) {
    case 'SET_FUNNEL':
      return { funnel: action.payload, isDirty: false };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          settings: { ...state.funnel.settings, ...action.payload },
        },
      };

    case 'ADD_SCREEN': {
      const { screenType, name, afterScreenId } = action.payload;
      const newScreen = createScreen(screenType, name);
      const screens = [...state.funnel.screens];
      
      if (afterScreenId) {
        const index = screens.findIndex(s => s.id === afterScreenId);
        screens.splice(index + 1, 0, newScreen);
      } else {
        screens.push(newScreen);
      }
      
      return {
        ...state,
        isDirty: true,
        funnel: { ...state.funnel, screens },
      };
    }

    case 'UPDATE_SCREEN': {
      const { screenId, updates } = action.payload;
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(s =>
            s.id === screenId ? { ...s, ...updates } : s
          ),
        },
      };
    }

    case 'DELETE_SCREEN': {
      const { screenId } = action.payload;
      // Don't allow deleting the last screen
      if (state.funnel.screens.length <= 1) return state;
      
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.filter(s => s.id !== screenId),
        },
      };
    }

    case 'REORDER_SCREENS': {
      const { screenIds } = action.payload;
      const screenMap = new Map(state.funnel.screens.map(s => [s.id, s]));
      const reordered = screenIds.map(id => screenMap.get(id)!).filter(Boolean);
      
      return {
        ...state,
        isDirty: true,
        funnel: { ...state.funnel, screens: reordered },
      };
    }

    case 'ADD_BLOCK': {
      const { screenId, blockType, afterBlockId } = action.payload;
      const newBlock = createBlock(blockType, getDefaultContent(blockType));
      
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(screen => {
            if (screen.id !== screenId) return screen;
            
            const blocks = [...screen.blocks];
            if (afterBlockId) {
              const index = blocks.findIndex(b => b.id === afterBlockId);
              blocks.splice(index + 1, 0, newBlock);
            } else {
              blocks.push(newBlock);
            }
            
            return { ...screen, blocks };
          }),
        },
      };
    }

    case 'UPDATE_BLOCK': {
      const { screenId, blockId, updates } = action.payload;
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(screen => {
            if (screen.id !== screenId) return screen;
            return {
              ...screen,
              blocks: screen.blocks.map(block =>
                block.id === blockId ? { ...block, ...updates } : block
              ),
            };
          }),
        },
      };
    }

    case 'DELETE_BLOCK': {
      const { screenId, blockId } = action.payload;
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(screen => {
            if (screen.id !== screenId) return screen;
            return {
              ...screen,
              blocks: screen.blocks.filter(b => b.id !== blockId),
            };
          }),
        },
      };
    }

    case 'REORDER_BLOCKS': {
      const { screenId, blockIds } = action.payload;
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(screen => {
            if (screen.id !== screenId) return screen;
            
            const blockMap = new Map(screen.blocks.map(b => [b.id, b]));
            const reordered = blockIds.map(id => blockMap.get(id)!).filter(Boolean);
            
            return { ...screen, blocks: reordered };
          }),
        },
      };
    }

    case 'DUPLICATE_BLOCK': {
      const { screenId, blockId } = action.payload;
      return {
        ...state,
        isDirty: true,
        funnel: {
          ...state.funnel,
          screens: state.funnel.screens.map(screen => {
            if (screen.id !== screenId) return screen;
            
            const blockIndex = screen.blocks.findIndex(b => b.id === blockId);
            if (blockIndex === -1) return screen;
            
            const original = screen.blocks[blockIndex];
            const duplicate: Block = {
              ...JSON.parse(JSON.stringify(original)),
              id: createId(),
            };
            
            const blocks = [...screen.blocks];
            blocks.splice(blockIndex + 1, 0, duplicate);
            
            return { ...screen, blocks };
          }),
        },
      };
    }

    case 'DUPLICATE_SCREEN': {
      const { screenId } = action.payload;
      const screenIndex = state.funnel.screens.findIndex(s => s.id === screenId);
      if (screenIndex === -1) return state;
      
      const original = state.funnel.screens[screenIndex];
      const duplicate: Screen = {
        ...JSON.parse(JSON.stringify(original)),
        id: createId(),
        name: `${original.name} (Copy)`,
        blocks: original.blocks.map(b => ({ ...b, id: createId() })),
      };
      
      const screens = [...state.funnel.screens];
      screens.splice(screenIndex + 1, 0, duplicate);
      
      return {
        ...state,
        isDirty: true,
        funnel: { ...state.funnel, screens },
      };
    }

    case 'MARK_SAVED':
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// =============================================================================
// DEFAULT CONTENT
// =============================================================================

function getDefaultContent(type: BlockType): string {
  switch (type) {
    case 'heading':
      return 'Your Heading';
    case 'text':
      return 'Enter your text here...';
    case 'button':
      return 'Click Me';
    case 'input':
      return '';
    case 'choice':
      return 'Select an option';
    default:
      return '';
  }
}

// =============================================================================
// HOOK
// =============================================================================

interface UseFunnelStateOptions {
  onSave?: (funnel: Funnel) => Promise<void> | void;
  autoSaveDelay?: number;
}

export function useFunnelState(
  initialFunnel: Funnel,
  options: UseFunnelStateOptions = {}
) {
  const { onSave, autoSaveDelay = 2000 } = options;
  
  const [state, dispatch] = useReducer(funnelReducer, {
    funnel: initialFunnel,
    isDirty: false,
  });
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  // Auto-save when dirty
  useEffect(() => {
    if (!state.isDirty || !onSave) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      
      try {
        await onSave(state.funnel);
        dispatch({ type: 'MARK_SAVED' });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, autoSaveDelay);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.funnel, onSave, autoSaveDelay]);

  // Actions
  const setFunnel = useCallback((funnel: Funnel) => {
    dispatch({ type: 'SET_FUNNEL', payload: funnel });
  }, []);

  const updateSettings = useCallback((updates: Partial<Funnel['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  }, []);

  const addScreen = useCallback((screenType: ScreenType, name: string, afterScreenId?: string) => {
    dispatch({ type: 'ADD_SCREEN', payload: { screenType, name, afterScreenId } });
  }, []);

  const updateScreen = useCallback((screenId: string, updates: Partial<Screen>) => {
    dispatch({ type: 'UPDATE_SCREEN', payload: { screenId, updates } });
  }, []);

  const deleteScreen = useCallback((screenId: string) => {
    dispatch({ type: 'DELETE_SCREEN', payload: { screenId } });
  }, []);

  const reorderScreens = useCallback((screenIds: string[]) => {
    dispatch({ type: 'REORDER_SCREENS', payload: { screenIds } });
  }, []);

  const addBlock = useCallback((screenId: string, blockType: BlockType, afterBlockId?: string) => {
    dispatch({ type: 'ADD_BLOCK', payload: { screenId, blockType, afterBlockId } });
  }, []);

  const updateBlock = useCallback((screenId: string, blockId: string, updates: Partial<Block>) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { screenId, blockId, updates } });
  }, []);

  const deleteBlock = useCallback((screenId: string, blockId: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: { screenId, blockId } });
  }, []);

  const reorderBlocks = useCallback((screenId: string, blockIds: string[]) => {
    dispatch({ type: 'REORDER_BLOCKS', payload: { screenId, blockIds } });
  }, []);

  const duplicateBlock = useCallback((screenId: string, blockId: string) => {
    dispatch({ type: 'DUPLICATE_BLOCK', payload: { screenId, blockId } });
  }, []);

  const duplicateScreen = useCallback((screenId: string) => {
    dispatch({ type: 'DUPLICATE_SCREEN', payload: { screenId } });
  }, []);

  const forceSave = useCallback(async () => {
    if (!onSave || isSavingRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    isSavingRef.current = true;
    try {
      await onSave(state.funnel);
      dispatch({ type: 'MARK_SAVED' });
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, state.funnel]);

  return {
    funnel: state.funnel,
    isDirty: state.isDirty,
    
    // Funnel actions
    setFunnel,
    updateSettings,
    
    // Screen actions
    addScreen,
    updateScreen,
    deleteScreen,
    reorderScreens,
    duplicateScreen,
    
    // Block actions
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    duplicateBlock,
    
    // Save
    forceSave,
  };
}
