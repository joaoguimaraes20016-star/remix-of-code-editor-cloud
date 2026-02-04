import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Funnel, FunnelStep, Block, ViewportType, CountryCode, BlockContent } from '@/funnel-builder-v3/types/funnel';
import { createEmptyFunnel } from '@/funnel-builder-v3/lib/templates';
import { v4 as uuid } from 'uuid';
import { blockDefinitions } from '@/funnel-builder-v3/lib/block-definitions';
import { defaultCountryCodes } from '@/funnel-builder-v3/lib/block-definitions';
import { generateTrackingId } from '@/funnel-builder-v3/lib/tracking-ids';
import { getColorContext, applyColorContextToContent, applyColorContextToStyles } from '@/funnel-builder-v3/lib/color-context';

// Media Library Types
export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  folderId?: string; // undefined = root/All Media
  createdAt: number;
}

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: number;
}

interface FunnelContextType {
  funnel: Funnel;
  currentStepId: string | null;
  selectedBlockId: string | null;
  selectedChildElement: string | null; // e.g., 'submit-button', 'option-0', 'country-codes', etc.
  isPreviewMode: boolean;
  currentViewport: ViewportType;
  canvasZoom: number;
  effectiveZoom: number;
  mediaGallery: string[];
  // Global country codes (shared across all phone inputs)
  countryCodes: CountryCode[];
  defaultCountryId: string;
  updateCountryCodes: (codes: CountryCode[]) => void;
  setDefaultCountryId: (id: string) => void;
  setFunnel: (funnel: Funnel) => void;
  setCurrentStepId: (id: string | null) => void;
  setSelectedBlockId: (id: string | null) => void;
  setSelectedChildElement: (element: string | null) => void;
  setPreviewMode: (mode: boolean) => void;
  setCurrentViewport: (viewport: ViewportType) => void;
  setCanvasZoom: (zoom: number) => void;
  setEffectiveZoom: (zoom: number) => void;
  
  // Step operations
  addStep: (step?: FunnelStep) => void;
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
  
  // Media gallery (legacy)
  addToGallery: (url: string) => void;
  removeFromGallery: (url: string) => void;
  
  // Media library with folders
  mediaItems: MediaItem[];
  mediaFolders: MediaFolder[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  removeMediaItem: (id: string) => void;
  createMediaFolder: (name: string) => void;
  deleteMediaFolder: (id: string) => void;
  moveMediaToFolder: (itemId: string, folderId: string | undefined) => void;
  
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

// Normalize funnel to ensure steps is always an array (guards against malformed data)
function normalizeFunnel(f: Funnel): Funnel {
  // Migrate options in all blocks to new action format
  const migratedSteps = (Array.isArray(f?.steps) ? f.steps : []).map(step => ({
    ...step,
    blocks: step.blocks.map(block => {
      // Migrate options for quiz/image-quiz/video-question blocks
      const content = block.content as any;
      if (['quiz', 'image-quiz', 'video-question', 'multiple-choice', 'choice'].includes(block.type) && Array.isArray(content?.options)) {
        const newContent = { ...content };
        
        // Ensure showSubmitButton is true when multiSelect is true
        if (newContent.multiSelect && newContent.showSubmitButton !== true) {
          newContent.showSubmitButton = true;
        }
        
        return {
          ...block,
          content: {
            ...newContent,
            options: content.options.map((opt: any) => {
              // Migrate old nextStepId to new action/actionValue format
              if (opt.nextStepId && !opt.action) {
                return {
                  ...opt,
                  action: 'next-step',
                  actionValue: opt.nextStepId,
                };
              } else if (!opt.action) {
                return {
                  ...opt,
                  action: 'next-step',
                };
              }
              return opt;
            }),
          },
        };
      }
      return block;
    }),
  }));

  // Ensure settings has required properties with defaults
  const defaultSettings = {
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
  };

  return {
    ...f,
    steps: migratedSteps,
    settings: { ...defaultSettings, ...(f?.settings ?? {}) },
  };
}

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

interface FunnelProviderProps {
  children: ReactNode;
  initialFunnel?: Funnel;
  onFunnelChange?: (funnel: Funnel) => void;
}

export function FunnelProvider({ children, initialFunnel, onFunnelChange }: FunnelProviderProps) {
  // Initialize from prop, localStorage, or create new
  const [funnel, setFunnelState] = useState<Funnel>(() => {
    const raw = initialFunnel ?? loadFunnelFromStorage() ?? createEmptyFunnel();
    return normalizeFunnel(raw);
  });
  const [currentStepId, setCurrentStepIdState] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockIdState] = useState<string | null>(null);
  const [selectedChildElement, setSelectedChildElement] = useState<string | null>(null);
  const [isPreviewMode, setPreviewMode] = useState(false);
  
  // Wrapper for setCurrentStepId that clears child selection when step changes
  const setCurrentStepId = useCallback((id: string | null) => {
    setCurrentStepIdState(id);
    setSelectedChildElement(null); // Clear child selection when step changes
  }, []);
  
  // Wrapper for setSelectedBlockId that clears child selection
  const setSelectedBlockId = useCallback((id: string | null) => {
    setSelectedBlockIdState(id);
    setSelectedChildElement(null); // Clear child selection when block changes
  }, []);
  const [currentViewport, setCurrentViewportState] = useState<ViewportType>('mobile');
  const [canvasZoom, setCanvasZoom] = useState<number>(1);
  const [effectiveZoom, setEffectiveZoom] = useState<number>(1);
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>([]);

  // Auto-save funnel to localStorage whenever it changes (only if no external handler)
  useEffect(() => {
    if (!onFunnelChange) {
      saveFunnelToStorage(funnel);
    }
  }, [funnel, onFunnelChange]);

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

  // Load media items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('funnel-media-items');
    if (saved) {
      try {
        setMediaItems(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save media items to localStorage on change
  useEffect(() => {
    localStorage.setItem('funnel-media-items', JSON.stringify(mediaItems));
  }, [mediaItems]);

  // Load media folders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('funnel-media-folders');
    if (saved) {
      try {
        setMediaFolders(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save media folders to localStorage on change
  useEffect(() => {
    localStorage.setItem('funnel-media-folders', JSON.stringify(mediaFolders));
  }, [mediaFolders]);

  // Add media item
  const addMediaItem = useCallback((item: Omit<MediaItem, 'id' | 'createdAt'>) => {
    const newItem: MediaItem = {
      ...item,
      id: uuid(),
      createdAt: Date.now(),
    };
    setMediaItems(prev => [newItem, ...prev].slice(0, 100)); // Keep last 100 items
  }, []);

  // Remove media item
  const removeMediaItem = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Create media folder
  const createMediaFolder = useCallback((name: string) => {
    const newFolder: MediaFolder = {
      id: uuid(),
      name,
      createdAt: Date.now(),
    };
    setMediaFolders(prev => [...prev, newFolder]);
  }, []);

  // Delete media folder (moves items to root)
  const deleteMediaFolder = useCallback((id: string) => {
    setMediaFolders(prev => prev.filter(folder => folder.id !== id));
    // Move all items from this folder to root
    setMediaItems(prev => prev.map(item => 
      item.folderId === id ? { ...item, folderId: undefined } : item
    ));
  }, []);

  // Move media item to folder
  const moveMediaToFolder = useCallback((itemId: string, folderId: string | undefined) => {
    setMediaItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, folderId } : item
    ));
  }, []);

  // When viewport changes, reset zoom to 100% (baseline)
  const setCurrentViewport = (viewport: ViewportType) => {
    setCurrentViewportState(viewport);
    setCanvasZoom(1); // Always reset to 100% on viewport change
  };
  
  const [history, setHistory] = useState<Funnel[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Use ref to track history index to avoid stale closures during rapid updates
  const historyIndexRef = React.useRef(-1);
  React.useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);
  
  // Initialize current step when funnel changes
  React.useEffect(() => {
    if (!currentStepId && funnel.steps.length > 0) {
      setCurrentStepId(funnel.steps[0].id);
    }
  }, [funnel, currentStepId, setCurrentStepId]);
  
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
      // Use ref to get current historyIndex to avoid stale closure issues during rapid updates
      const currentIndex = historyIndexRef.current;
      // Slice history to current position (discard any "future" states after undo)
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(currentFunnel);
      // Keep within max limit
      let newIndex: number;
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        // Adjust index if we shifted (history is full)
        newIndex = MAX_HISTORY - 1;
      } else {
        // Update index to match new history length
        newIndex = newHistory.length - 1;
      }
      // Update both state and ref atomically
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      return newHistory;
    });
  }, []);
  
  const setFunnel = useCallback((newFunnel: Funnel) => {
    // Save current state to history before updating
    pushToHistory(funnel);
    const updated = normalizeFunnel({ ...newFunnel, updatedAt: new Date().toISOString() });
    setFunnelState(updated);
    // Notify external handler if provided
    onFunnelChange?.(updated);
  }, [funnel, pushToHistory, onFunnelChange]);
  
  const undo = useCallback(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      const previousState = history[historyIndex];
      const newIndex = historyIndex - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setFunnelState(normalizeFunnel(previousState));
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      const newIndex = historyIndex + 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      setFunnelState(normalizeFunnel(nextState));
    }
  }, [history, historyIndex]);
  
  // Step operations
  const addStep = useCallback((providedStep?: FunnelStep) => {
    const newStep: FunnelStep = providedStep ?? {
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
  
  // Helper function to add tracking IDs to content
  const addTrackingIdsToContent = useCallback((content: any, blockType: Block['type']): any => {
    if (!content) return content;
    
    const processed = { ...content };
    
    // Add tracking ID to embedded submitButton
    if (processed.submitButton && typeof processed.submitButton === 'object' && !Array.isArray(processed.submitButton)) {
      processed.submitButton = {
        ...processed.submitButton,
        trackingId: processed.submitButton.trackingId || generateTrackingId('button'),
      };
    }
    
    // Add tracking IDs to form fields
    if (Array.isArray(processed.fields)) {
      processed.fields = processed.fields.map((field: any) => ({
        ...field,
        trackingId: field.trackingId || generateTrackingId('field'),
      }));
    }
    
    // Add tracking IDs to quiz/choice options and migrate to new action format
    if (Array.isArray(processed.options)) {
      processed.options = processed.options.map((option: any) => {
        const migrated = {
          ...option,
          trackingId: option.trackingId || generateTrackingId('option'),
        };
        
        // Migrate old nextStepId to new action/actionValue format
        if (option.nextStepId && !option.action) {
          migrated.action = 'next-step';
          migrated.actionValue = option.nextStepId;
        } else if (!option.action) {
          // Default to next-step if no action specified
          migrated.action = 'next-step';
        }
        
        return migrated;
      });
    }
    
    return processed;
  }, []);
  
  // Block operations
  const addBlock = useCallback((stepId: string, blockType: Block['type'], index?: number) => {
    const definition = blockDefinitions[blockType];
    const rawContent = JSON.parse(JSON.stringify(definition.defaultContent));
    const processedContent = addTrackingIdsToContent(rawContent, blockType);
    
    // Get the step to access its background color for color-context awareness
    const step = funnel.steps.find(s => s.id === stepId);
    const backgroundColor = step?.settings?.backgroundColor || '#ffffff';
    
    // Get color context based on background
    const colorContext = getColorContext(backgroundColor);
    
    // Apply color-aware defaults to content
    applyColorContextToContent(processedContent, blockType, colorContext);
    
    // Ensure textAlign is set for text-based blocks - always default to center
    const defaultStylesCopy = JSON.parse(JSON.stringify(definition.defaultStyles));
    const textBasedBlocks = ['heading', 'text', 'list', 'button', 'accordion', 'social-proof', 'reviews', 'testimonial-slider'];
    if (textBasedBlocks.includes(blockType) && !defaultStylesCopy.textAlign) {
      // Check if content.styles has textAlign, otherwise default to center
      const contentStyles = processedContent?.styles as any;
      if (contentStyles?.textAlign && ['left', 'center', 'right'].includes(contentStyles.textAlign)) {
        defaultStylesCopy.textAlign = contentStyles.textAlign;
      } else {
        defaultStylesCopy.textAlign = 'center'; // Always default to center
      }
    }
    
    // Apply color-aware styles (borders, outlines, etc.)
    applyColorContextToStyles(defaultStylesCopy, blockType, colorContext);
    
    const newBlock: Block = {
      id: uuid(),
      type: blockType,
      content: processedContent,
      styles: defaultStylesCopy,
      trackingId: generateTrackingId('block'),
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
  }, [funnel, setFunnel, addTrackingIdsToContent]);

  // Batch add multiple blocks atomically (avoids race conditions)
  const addBlocks = useCallback((stepId: string, blockTypes: Block['type'][]) => {
    // Get the step to access its background color for color-context awareness
    const step = funnel.steps.find(s => s.id === stepId);
    const backgroundColor = step?.settings?.backgroundColor || '#ffffff';
    
    // Get color context based on background (shared for all blocks in batch)
    const colorContext = getColorContext(backgroundColor);
    
    const newBlocks: Block[] = blockTypes.map(blockType => {
      const definition = blockDefinitions[blockType];
      const rawContent = JSON.parse(JSON.stringify(definition.defaultContent));
      const processedContent = addTrackingIdsToContent(rawContent, blockType);
      
      // Apply color-aware defaults to content
      applyColorContextToContent(processedContent, blockType, colorContext);
      
      // Ensure textAlign is set for text-based blocks - always default to center
      const defaultStylesCopy = JSON.parse(JSON.stringify(definition.defaultStyles));
      const textBasedBlocks = ['heading', 'text', 'list', 'button', 'accordion', 'social-proof', 'reviews', 'testimonial-slider'];
      if (textBasedBlocks.includes(blockType) && !defaultStylesCopy.textAlign) {
        const contentStyles = processedContent?.styles as any;
        if (contentStyles?.textAlign && ['left', 'center', 'right'].includes(contentStyles.textAlign)) {
          defaultStylesCopy.textAlign = contentStyles.textAlign;
        } else {
          defaultStylesCopy.textAlign = 'center';
        }
      }
      
      // Apply color-aware styles
      applyColorContextToStyles(defaultStylesCopy, blockType, colorContext);
      
      return {
        id: uuid(),
        type: blockType,
        content: processedContent,
        styles: defaultStylesCopy,
        trackingId: generateTrackingId('block'),
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
  }, [funnel, setFunnel, addTrackingIdsToContent]);
  
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
    // Use functional update to avoid race conditions
    setFunnelState(currentFunnel => {
      const updated = normalizeFunnel({
        ...currentFunnel,
        steps: currentFunnel.steps.map(step => {
          if (step.id !== stepId) return step;
          return {
            ...step,
            blocks: step.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
          };
        }),
        updatedAt: new Date().toISOString(),
      });
      
      // Save to history
      pushToHistory(currentFunnel);
      
      // Notify external handler if provided
      onFunnelChange?.(updated);
      
      return updated;
    });
  }, [pushToHistory, onFunnelChange]);

  const updateBlockContent = useCallback((stepId: string, blockId: string, contentUpdates: any) => {
    // Use functional update to avoid race conditions when multiple updates happen in quick succession
    setFunnelState(currentFunnel => {
      const updated = normalizeFunnel({
        ...currentFunnel,
        steps: currentFunnel.steps.map(step => {
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
        updatedAt: new Date().toISOString(),
      });
      
      // Save to history
      pushToHistory(currentFunnel);
      
      // Notify external handler if provided
      onFunnelChange?.(updated);
      
      return updated;
    });
  }, [pushToHistory, onFunnelChange]);
  
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
        const duplicatedContent = JSON.parse(JSON.stringify(originalBlock.content));
        const processedContent = addTrackingIdsToContent(duplicatedContent, originalBlock.type);
        
        const newBlock: Block = {
          ...JSON.parse(JSON.stringify(originalBlock)),
          id: uuid(),
          trackingId: generateTrackingId('block'),
          content: processedContent,
        };
        const newBlocks = [...step.blocks];
        newBlocks.splice(blockIndex + 1, 0, newBlock);
        return { ...step, blocks: newBlocks };
      }),
    });
  }, [funnel, setFunnel, addTrackingIdsToContent]);
  
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

  // Global country codes management
  const countryCodes = funnel.countryCodes && funnel.countryCodes.length > 0 
    ? funnel.countryCodes 
    : defaultCountryCodes;
  
  const defaultCountryId = funnel.defaultCountryId || defaultCountryCodes[0]?.id || '1';

  const updateCountryCodes = useCallback((codes: CountryCode[]) => {
    setFunnel({
      ...funnel,
      countryCodes: codes,
    });
  }, [funnel, setFunnel]);

  const setDefaultCountryId = useCallback((id: string) => {
    setFunnel({
      ...funnel,
      defaultCountryId: id,
    });
  }, [funnel, setFunnel]);
  
  return (
    <FunnelContext.Provider value={{
      funnel,
      currentStepId,
      selectedBlockId,
      selectedChildElement,
      isPreviewMode,
      currentViewport,
      canvasZoom,
      effectiveZoom,
      mediaGallery,
      setFunnel,
      setCurrentStepId,
      setSelectedBlockId,
      setSelectedChildElement,
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
      mediaItems,
      mediaFolders,
      addMediaItem,
      removeMediaItem,
      createMediaFolder,
      deleteMediaFolder,
      moveMediaToFolder,
      undo,
      redo,
      canUndo: historyIndex >= 0,
      canRedo: historyIndex < history.length - 1,
      // Global country codes
      countryCodes,
      defaultCountryId,
      updateCountryCodes,
      setDefaultCountryId,
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

// Optional hook that returns null if outside provider (for runtime use)
export function useFunnelOptional() {
  return useContext(FunnelContext);
}
