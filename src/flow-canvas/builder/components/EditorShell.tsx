import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Page, SelectionState, StepIntent, AIsuggestion, Block, Element, ApplicationFlowStep, ApplicationFlowSettings } from '../../types/infostack';
import { LeftPanel } from './LeftPanel';
import { CanvasRenderer } from './CanvasRenderer';
import { RightPanel } from './RightPanel';
import { TopToolbar, DeviceMode } from './TopToolbar';
import { AIBuilderCopilot } from './AIBuilderCopilot';
import { BlockPickerPanel } from './BlockPickerPanel';
import { useHistory } from '../hooks/useHistory';
import { 
  deepClone, 
  updateNodeByPath, 
  createDefaultStep,
  createBlankStep,
  generateId 
} from '../utils/helpers';
import {
  CollaboratorsModal,
  SEOSettingsModal,
  FunnelSettingsModal,
  ShareModal,
  AnalyticsPanel,
  TextStylesModal,
  AIGenerateModal,
  KeyboardShortcutsModal,
  ImagePickerModal,
} from './modals';
import { CaptureFlowModal } from './CaptureFlowModal';
import type { CaptureFlow } from '../../types/captureFlow';
import type { TextPreset } from './modals';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelRightClose, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { InlineEditProvider } from '../contexts/InlineEditContext';
import { CaptureFlowProvider } from '../contexts/CaptureFlowContext';
import { FlowContainerProvider, FlowStep } from '../contexts/FlowContainerContext';

// Multi-selection state type
interface MultiSelection {
  type: 'element' | 'block';
  ids: Set<string>;
}

// Save status type
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
}

interface EditorShellProps {
  initialState: Page;
  onChange: (updatedState: Page) => void;
  onSelect: (selection: SelectionState) => void;
  onPublish?: (page: Page) => void;
  readOnly?: boolean;
  /** Save status for auto-save indicator */
  saveStatus?: SaveStatus;
  /** Last saved timestamp */
  lastSavedAt?: Date | null;
}

export const EditorShell: React.FC<EditorShellProps> = ({
  initialState,
  onChange,
  onSelect,
  onPublish,
  readOnly = false,
  saveStatus = 'idle',
  lastSavedAt = null,
}) => {
  const isMobile = useIsMobile();
  
  // Panel visibility state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  // Use history hook for undo/redo
  const { page, setPage, undo, redo, canUndo, canRedo } = useHistory(initialState);
  
  const [selection, setSelection] = useState<SelectionState>({
    type: null,
    id: null,
    path: [],
  });
  
  // Multi-selection state
  const [multiSelection, setMultiSelection] = useState<MultiSelection | null>(null);
  
  const [activeStepId, setActiveStepId] = useState<string | null>(
    page.steps[0]?.id || null
  );
  // State for selected step within Application Flow blocks - scoped per block ID
  const [selectedFlowSteps, setSelectedFlowSteps] = useState<Record<string, string | null>>({});
  // State for selected element within a flow step (for element-level editing)
  const [selectedStepElement, setSelectedStepElement] = useState<{
    stepId: string;
    elementType: 'title' | 'description' | 'button' | 'option' | 'input';
    optionIndex?: number;
  } | null>(null);
  const [isAICopilotExpanded, setIsAICopilotExpanded] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [showGrid, setShowGrid] = useState(false);
  const [replayAnimationKey, setReplayAnimationKey] = useState(0);
  
  // Block picker state - for left panel integration
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);
  const [blockPickerTargetStackId, setBlockPickerTargetStackId] = useState<string | null>(null);
  const [blockPickerMode, setBlockPickerMode] = useState<'blocks' | 'sections'>('blocks');
  
  // Editor UI theme state - controls panels/toolbar appearance (LIGHT by default to match brand aesthetic)
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('light');

  // Sync editor theme to document body for Radix portals (they render outside the React tree)
  useEffect(() => {
    document.body.classList.remove('dark', 'editor-light');
    document.body.classList.add(editorTheme === 'dark' ? 'dark' : 'editor-light');
    
    // Also sync to toolbar portal root if it exists
    const portalRoot = document.getElementById('toolbar-portal-root');
    if (portalRoot) {
      portalRoot.classList.remove('dark', 'editor-light');
      portalRoot.classList.add(editorTheme === 'dark' ? 'dark' : 'editor-light');
    }
    
    return () => {
      // Cleanup on unmount
      document.body.classList.remove('dark', 'editor-light');
    };
  }, [editorTheme]);

  // Handler to replay animation on an element
  const handleReplayAnimation = useCallback((elementId: string) => {
    setReplayAnimationKey(prev => prev + 1);
  }, []);

  // Modal states
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isSEOOpen, setIsSEOOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isTextStylesOpen, setIsTextStylesOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSocialImagePickerOpen, setIsSocialImagePickerOpen] = useState(false);
  
  // CaptureFlow modal state (Phase 7)
  const [openCaptureFlowId, setOpenCaptureFlowId] = useState<string | null>(null);
  const [openCaptureFlow, setOpenCaptureFlow] = useState<CaptureFlow | null>(null);
  
  // Design mode state (select vs pan)
  const [designMode, setDesignMode] = useState<'select' | 'pan'>('select');
  
  // Clipboard state for copy/paste
  const clipboardRef = useRef<{ type: 'element' | 'block'; data: Element | Block } | null>(null);

  // Get active step
  const activeStep = page.steps.find(s => s.id === activeStepId) || null;

  // Helper to get the active Application Flow block from current selection
  const getActiveApplicationFlowBlock = useCallback((): Block | null => {
    if (selection.type === 'block' && selection.id && activeStep) {
      for (const frame of activeStep.frames || []) {
        for (const stack of frame.stacks) {
          const block = stack.blocks.find(b => b.id === selection.id);
          if (block?.type === 'application-flow') {
            return block;
          }
        }
      }
    }
    return null;
  }, [selection, activeStep]);
  
  // Set selected step ID for a specific Application Flow block
  const setSelectedStepForBlock = useCallback((blockId: string, stepId: string | null) => {
    setSelectedFlowSteps(prev => ({
      ...prev,
      [blockId]: stepId
    }));
  }, []);
  
  // Computed: active flow block and its selected step
  const activeFlowBlock = getActiveApplicationFlowBlock();
  const activeFlowBlockId = activeFlowBlock?.id || null;
  const selectedApplicationStepId = activeFlowBlockId ? selectedFlowSteps[activeFlowBlockId] || null : null;
  
  // Handler for setting selected step (scoped to active flow block)
  const handleSelectApplicationStep = useCallback((stepId: string | null) => {
    if (activeFlowBlockId) {
      setSelectedStepForBlock(activeFlowBlockId, stepId);

      // UX: keep the element-level inspector open when navigating between steps,
      // so "Button" editing doesn't disappear when you click step toggles.
      setSelectedStepElement((prev) => {
        if (!prev) return null;
        if (!stepId) return null;
        // Option editing is step-specific; clear it on step change.
        if (prev.elementType === 'option') return null;
        return { ...prev, stepId, optionIndex: undefined };
      });
    }
  }, [activeFlowBlockId, setSelectedStepForBlock]);

  // Handler for selecting an element within a step
  const handleSelectStepElement = useCallback((element: typeof selectedStepElement) => {
    setSelectedStepElement(element);
  }, []);

  // Clear step element selection when flow block is deselected
  useEffect(() => {
    if (!activeFlowBlock) {
      setSelectedStepElement(null);
    }
  }, [activeFlowBlock]);

  // Track whether step was explicitly set to null (user clicked "All Steps")
  const [explicitNullStep, setExplicitNullStep] = useState<Record<string, boolean>>({});
  
  // Modified handler to track explicit null selections
  const handleSelectApplicationStepWithTracking = useCallback((stepId: string | null) => {
    if (activeFlowBlockId) {
      // Track if user explicitly selected null (clicked "All Steps")
      if (stepId === null) {
        setExplicitNullStep(prev => ({ ...prev, [activeFlowBlockId]: true }));
      } else {
        setExplicitNullStep(prev => ({ ...prev, [activeFlowBlockId]: false }));
      }
      handleSelectApplicationStep(stepId);
    }
  }, [activeFlowBlockId, handleSelectApplicationStep]);
  
  // Auto-select first step when clicking an Application Flow block
  // Only auto-select if user hasn't explicitly clicked "All Steps"
  useEffect(() => {
    if (activeFlowBlock && activeFlowBlockId) {
      const currentSelection = selectedFlowSteps[activeFlowBlockId];
      const steps = (activeFlowBlock.props as any)?.steps || [];
      const wasExplicitlyNull = explicitNullStep[activeFlowBlockId];
      
      // Only auto-select first step if:
      // 1. No step is selected AND user didn't explicitly click "All Steps"
      // 2. OR the selected step no longer exists (was deleted)
      if (!currentSelection && steps.length > 0 && !wasExplicitlyNull) {
        setSelectedFlowSteps(prev => ({
          ...prev,
          [activeFlowBlockId]: steps[0].id
        }));
      }
      
      // If the selected step no longer exists (was deleted), reset to first step
      if (currentSelection && !steps.find((s: any) => s.id === currentSelection)) {
        setSelectedFlowSteps(prev => ({
          ...prev,
          [activeFlowBlockId]: steps[0]?.id || null
        }));
        // Clear explicit null since we're auto-selecting due to deletion
        setExplicitNullStep(prev => ({ ...prev, [activeFlowBlockId]: false }));
      }
    }
  }, [activeFlowBlock, activeFlowBlockId, selectedFlowSteps, explicitNullStep]);

  // Handle page updates with history and action labels
  const handlePageUpdate = useCallback((updatedPage: Page, actionLabel?: string) => {
    const newPage = {
      ...updatedPage,
      updated_at: new Date().toISOString(),
    };
    setPage(newPage, false, actionLabel);
    onChange(newPage);
  }, [onChange, setPage]);

  // Undo with toast feedback
  const handleUndo = useCallback(() => {
    const result = undo();
    if (result?.actionLabel) {
      toast.info(`Undid: ${result.actionLabel}`, { duration: 2000 });
    }
  }, [undo]);

  // Redo with toast feedback
  const handleRedo = useCallback(() => {
    const result = redo();
    if (result?.actionLabel) {
      toast.info(`Redid: ${result.actionLabel}`, { duration: 2000 });
    }
  }, [redo]);

  // Handle selection with shift for multi-select
  const handleSelect = useCallback((newSelection: SelectionState, isShiftHeld = false) => {
    // Auto-close block picker when user selects content on canvas
    if (newSelection.id && blockPickerOpen) {
      setBlockPickerOpen(false);
      setBlockPickerTargetStackId(null);
      setBlockPickerMode('blocks');
    }
    
    // Clear step element selection when selecting something different
    // This ensures inspector updates correctly when clicking away from flow elements
    const isSelectingDifferentBlock = newSelection.id !== selection.id;
    if (isSelectingDifferentBlock) {
      setSelectedStepElement(null);
    }
    
    if (isShiftHeld && newSelection.id && (newSelection.type === 'element' || newSelection.type === 'block')) {
      // Multi-select mode
      setMultiSelection(prev => {
        if (!prev || prev.type !== newSelection.type) {
          // Start new multi-selection
          return {
            type: newSelection.type as 'element' | 'block',
            ids: new Set([newSelection.id!]),
          };
        }
        // Toggle item in selection
        const newIds = new Set(prev.ids);
        if (newIds.has(newSelection.id!)) {
          newIds.delete(newSelection.id!);
        } else {
          newIds.add(newSelection.id!);
        }
        return newIds.size === 0 ? null : { ...prev, ids: newIds };
      });
      // Also update single selection to last clicked
      setSelection(newSelection);
      onSelect(newSelection);
    } else {
      // Normal single selection - clear multi-select
      setMultiSelection(null);
      setSelection(newSelection);
      onSelect(newSelection);
    }
  }, [onSelect, blockPickerOpen, selection.id]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelection({ type: null, id: null, path: [] });
    setMultiSelection(null);
    setSelectedStepElement(null); // Also clear step element selection
    onSelect({ type: null, id: null, path: [] });
  }, [onSelect]);
  
  // Escape key to close block picker and clear selection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // First priority: close block picker if open
        if (blockPickerOpen) {
          setBlockPickerOpen(false);
          setBlockPickerTargetStackId(null);
          setBlockPickerMode('blocks');
          return;
        }
        // Second priority: clear any selection (this will close floating toolbars)
        if (selection.id) {
          handleClearSelection();
          return;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blockPickerOpen, selection.id, handleClearSelection]);

  // Step operations
  const handleStepSelect = useCallback((stepId: string) => {
    setActiveStepId(stepId);
    handleSelect({ type: 'step', id: stepId, path: ['step', stepId] });
  }, [handleSelect]);

  const handleAddStep = useCallback((intent: StepIntent) => {
    const newStep = createDefaultStep(intent);
    const updatedPage = deepClone(page);
    updatedPage.steps.push(newStep);
    handlePageUpdate(updatedPage, 'Add page');
    setActiveStepId(newStep.id);
    toast.success('Page added');
  }, [page, handlePageUpdate]);

  const handleAddBlankStep = useCallback(() => {
    const newStep = createBlankStep();
    const updatedPage = deepClone(page);
    updatedPage.steps.push(newStep);
    handlePageUpdate(updatedPage, 'Add page');
    setActiveStepId(newStep.id);
    toast.success('Page added');
  }, [page, handlePageUpdate]);

  const handleDeleteStep = useCallback((stepId: string) => {
    if (page.steps.length <= 1) {
      toast.error('Cannot delete the only page');
      return;
    }
    
    const updatedPage = deepClone(page);
    updatedPage.steps = updatedPage.steps.filter(s => s.id !== stepId);
    handlePageUpdate(updatedPage, 'Delete page');
    
    if (activeStepId === stepId) {
      setActiveStepId(updatedPage.steps[0]?.id || null);
    }
    toast.success('Page deleted');
  }, [page, activeStepId, handlePageUpdate]);

  const handleDuplicateStep = useCallback((stepId: string) => {
    const stepToDuplicate = page.steps.find(s => s.id === stepId);
    if (!stepToDuplicate) return;

    const duplicatedStep = deepClone(stepToDuplicate);
    duplicatedStep.id = generateId();
    duplicatedStep.name = `${stepToDuplicate.name} (Copy)`;
    
    const regenerateIds = (obj: any) => {
      if (obj && typeof obj === 'object') {
        if (obj.id) obj.id = generateId();
        Object.values(obj).forEach(regenerateIds);
      }
      if (Array.isArray(obj)) {
        obj.forEach(regenerateIds);
      }
    };
    regenerateIds(duplicatedStep.frames);

    const updatedPage = deepClone(page);
    const stepIndex = updatedPage.steps.findIndex(s => s.id === stepId);
    updatedPage.steps.splice(stepIndex + 1, 0, duplicatedStep);
    handlePageUpdate(updatedPage, 'Duplicate page');
    toast.success('Page duplicated');
  }, [page, handlePageUpdate]);

  const handleReorderSteps = useCallback((fromIndex: number, toIndex: number) => {
    const updatedPage = deepClone(page);
    const [movedStep] = updatedPage.steps.splice(fromIndex, 1);
    updatedPage.steps.splice(toIndex, 0, movedStep);
    handlePageUpdate(updatedPage, 'Reorder pages');
  }, [page, handlePageUpdate]);

  // Block reordering within a stack
  const handleReorderBlocks = useCallback((stackId: string, fromIndex: number, toIndex: number) => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          if (stack.id === stackId) {
            const [movedBlock] = stack.blocks.splice(fromIndex, 1);
            stack.blocks.splice(toIndex, 0, movedBlock);
            handlePageUpdate(updatedPage, 'Reorder blocks');
            return;
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Element reordering within a block
  const handleReorderElements = useCallback((blockId: string, fromIndex: number, toIndex: number) => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            if (block.id === blockId) {
              const [movedElement] = block.elements.splice(fromIndex, 1);
              block.elements.splice(toIndex, 0, movedElement);
              handlePageUpdate(updatedPage, 'Reorder elements');
              return;
            }
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Add block from palette (with optional position)
  const handleAddBlock = useCallback((newBlock: Block, position?: { stackId: string; index: number }, options?: { type?: 'block' | 'section'; createSectionIfNeeded?: boolean }) => {
    const updatedPage = deepClone(page);
    const addMode = options?.type || 'block';
    
    // If it's a section, create a new frame with the block
    if (addMode === 'section') {
      const step = updatedPage.steps.find(s => s.id === activeStepId);
      if (step) {
        const newFrame = {
          id: generateId(),
          label: newBlock.label || 'New Section',
          stacks: [{
            id: generateId(),
            label: 'Main Stack',
            direction: 'vertical' as const,
            blocks: [newBlock],
            props: { alignment: 'center' },
          }],
          props: {},
        };
        step.frames.push(newFrame);
        handlePageUpdate(updatedPage, 'Add section');
        toast.success('Section added');
        return;
      }
    }
    
    if (position) {
      // Insert at specific position in stack - add at end (use Infinity)
      for (const step of updatedPage.steps) {
        for (const frame of step.frames) {
          for (const stack of frame.stacks) {
            if (stack.id === position.stackId) {
              // Always insert at end of stack
              stack.blocks.push(newBlock);
              handlePageUpdate(updatedPage, 'Add content');
              toast.success('Content added');
              return;
            }
          }
        }
      }
    } else {
      // Default: add to first stack of active step at the end
      const step = updatedPage.steps.find(s => s.id === activeStepId);
      
      // If page is empty and createSectionIfNeeded is true, create a section first
      if (options?.createSectionIfNeeded && step && (!step.frames?.length || !step.frames[0]?.stacks?.length)) {
        const newFrame = {
          id: generateId(),
          label: newBlock.label || 'New Section',
          stacks: [{
            id: generateId(),
            label: 'Main Stack',
            direction: 'vertical' as const,
            blocks: [newBlock],
            props: { alignment: 'center' },
          }],
          props: {},
        };
        if (!step.frames) step.frames = [];
        step.frames.push(newFrame);
        handlePageUpdate(updatedPage, 'Add content');
        return;
      }
      
      if (step && step.frames[0] && step.frames[0].stacks[0]) {
        step.frames[0].stacks[0].blocks.push(newBlock);
        handlePageUpdate(updatedPage, 'Add content');
      }
    }
  }, [page, activeStepId, handlePageUpdate]);

  // Handle AI-generated full page update
  const handleAIPageUpdate = useCallback((generatedPage: Page) => {
    // Merge with existing page (keep ID, update structure)
    const updatedPage: Page = {
      ...page,
      name: generatedPage.name || page.name,
      slug: generatedPage.slug || page.slug,
      steps: generatedPage.steps.length > 0 ? generatedPage.steps : page.steps,
      settings: {
        ...page.settings,
        ...generatedPage.settings,
      },
    };
    
    handlePageUpdate(updatedPage, 'AI generated funnel');
    
    // Select first step after generation
    if (updatedPage.steps.length > 0) {
      setActiveStepId(updatedPage.steps[0].id);
    }
  }, [page, handlePageUpdate]);

  // Duplicate block
  const handleDuplicateBlock = useCallback((blockId: string) => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          const blockIndex = stack.blocks.findIndex(b => b.id === blockId);
          if (blockIndex !== -1) {
            const blockToDuplicate = deepClone(stack.blocks[blockIndex]);
            blockToDuplicate.id = generateId();
            blockToDuplicate.label = `${blockToDuplicate.label} (Copy)`;
            blockToDuplicate.elements.forEach(el => { el.id = generateId(); });
            stack.blocks.splice(blockIndex + 1, 0, blockToDuplicate);
            handlePageUpdate(updatedPage, 'Duplicate content');
            toast.success('Content duplicated');
            return;
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Update element content
  const handleUpdateElement = useCallback((elementId: string, updates: Partial<Element>) => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            const element = block.elements.find(el => el.id === elementId);
            if (element) {
              // CRITICAL: Merge props AND styles instead of replacing to prevent stale closure overwrites
              // When updates.props is provided, merge it with existing element.props
              if (updates.props && element.props) {
                updates = {
                  ...updates,
                  props: { ...element.props, ...updates.props }
                };
              }
              // Also merge styles to prevent style overwrites
              if (updates.styles && element.styles) {
                updates = {
                  ...updates,
                  styles: { ...element.styles, ...updates.styles }
                };
              }
              Object.assign(element, updates);
              handlePageUpdate(updatedPage, 'Update element');
              return;
            }
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Duplicate element
  const handleDuplicateElement = useCallback((elementId: string) => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            const elementIndex = block.elements.findIndex(el => el.id === elementId);
            if (elementIndex !== -1) {
              const elementToDuplicate = deepClone(block.elements[elementIndex]);
              elementToDuplicate.id = generateId();
              block.elements.splice(elementIndex + 1, 0, elementToDuplicate);
              handlePageUpdate(updatedPage, 'Duplicate element');
              toast.success('Element duplicated');
              return;
            }
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Delete element (single or batch)
  const handleDeleteElement = useCallback((elementId: string) => {
    // Check if we're deleting from multi-selection
    const idsToDelete = multiSelection?.type === 'element' && multiSelection.ids.size > 1 
      ? Array.from(multiSelection.ids)
      : [elementId];
    
    const updatedPage = deepClone(page);
    let deletedCount = 0;
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            const initialLen = block.elements.length;
            block.elements = block.elements.filter(el => !idsToDelete.includes(el.id));
            deletedCount += initialLen - block.elements.length;
          }
        }
      }
    }
    
    if (deletedCount > 0) {
      handlePageUpdate(updatedPage, `Delete ${deletedCount} element${deletedCount > 1 ? 's' : ''}`);
      handleClearSelection();
      toast.success(`${deletedCount} element${deletedCount > 1 ? 's' : ''} deleted`);
    }
  }, [page, multiSelection, handlePageUpdate, handleClearSelection]);
  // Delete block (single or batch)
  const handleDeleteBlock = useCallback((blockId: string) => {
    // Check if we're deleting from multi-selection
    const idsToDelete = multiSelection?.type === 'block' && multiSelection.ids.size > 1 
      ? Array.from(multiSelection.ids)
      : [blockId];
    
    const updatedPage = deepClone(page);
    let deletedCount = 0;
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          const initialLen = stack.blocks.length;
          stack.blocks = stack.blocks.filter(b => !idsToDelete.includes(b.id));
          deletedCount += initialLen - stack.blocks.length;
        }
      }
    }
    
    if (deletedCount > 0) {
      handlePageUpdate(updatedPage, `Delete ${deletedCount} content item${deletedCount > 1 ? 's' : ''}`);
      handleClearSelection();
      toast.success(`${deletedCount} content item${deletedCount > 1 ? 's' : ''} deleted`);
    }
  }, [page, multiSelection, handlePageUpdate, handleClearSelection]);

  // Find the first application-flow block (check active step first, then all steps)
  const findApplicationFlowBlock = useCallback((): Block | null => {
    // First check active step (most common case)
    const activeStep = page.steps.find(s => s.id === activeStepId);
    if (activeStep) {
      for (const frame of activeStep.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            if (block.type === 'application-flow') {
              return block;
            }
          }
        }
      }
    }
    
    // Fallback: search all steps
    for (const step of page.steps) {
      if (step.id === activeStepId) continue; // Already checked
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            if (block.type === 'application-flow') {
              return block;
            }
          }
        }
      }
    }
    
    return null;
  }, [page, activeStepId]);

  // Add step to existing Application Flow block
  const handleAddApplicationFlowStep = useCallback((newStep: ApplicationFlowStep) => {
    const flowBlock = findApplicationFlowBlock();
    if (!flowBlock) {
      toast.error('No Application Flow found. Add one first.');
      return;
    }
    
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          const blockIndex = stack.blocks.findIndex(b => b.id === flowBlock.id);
          if (blockIndex !== -1) {
            const block = stack.blocks[blockIndex];
            const settings = (block.props || {}) as unknown as ApplicationFlowSettings;
            const steps = [...(settings.steps || [])];
            
            // Insert before ending step (if exists), otherwise at end
            const endingIndex = steps.findIndex(s => s.type === 'ending');
            if (endingIndex !== -1) {
              steps.splice(endingIndex, 0, newStep);
            } else {
              steps.push(newStep);
            }
            
            block.props = { ...settings, steps } as unknown as Record<string, unknown>;
            handlePageUpdate(updatedPage, 'Add flow step');
            
            // Select the new step (scoped to this flow block)
            setSelectedStepForBlock(flowBlock.id, newStep.id);
            
            // Select the flow block
            handleSelect({ type: 'block', id: flowBlock.id, path: ['block', flowBlock.id] });
            
            // Scroll the flow block into view
            setTimeout(() => {
              const flowBlockElement = document.querySelector(`[data-block-id="${flowBlock.id}"]`);
              if (flowBlockElement) {
                flowBlockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
            
            toast.success('Step added to flow');
            return;
          }
        }
      }
    }
  }, [page, findApplicationFlowBlock, handlePageUpdate, handleSelect]);

  // Create new Application Flow with initial step
  const handleCreateApplicationFlowWithStep = useCallback((initialStep: ApplicationFlowStep) => {
    const newFlowBlock: Block = {
      id: generateId(),
      type: 'application-flow',
      label: 'Application',
      elements: [],
      props: ({
        displayMode: 'one-at-a-time',
        showProgress: true,
        transition: 'slide-up',
        steps: [
          { 
            id: generateId(), 
            name: 'Welcome', 
            type: 'welcome',
            settings: {
              title: 'Apply Now',
              description: 'Answer a few quick questions.',
              buttonText: 'Start →',
            },
            elements: [], 
            navigation: { action: 'next' } 
          },
          initialStep,
          { 
            id: generateId(), 
            name: 'Thank You', 
            type: 'ending',
            settings: {
              title: "Thanks — we'll be in touch!",
            },
            elements: [], 
            navigation: { action: 'submit' } 
          },
        ]
      }) as unknown as Record<string, unknown>,
    };
    
    // Add as section
    handleAddBlock(newFlowBlock, undefined, { type: 'section' });
    
    // Select the initial step (scoped to the new flow block)
    setSelectedStepForBlock(newFlowBlock.id, initialStep.id);
    
    toast.success('Application Flow created');
  }, [handleAddBlock]);

  // Move element up/down
  const handleMoveElement = useCallback((elementId: string, direction: 'up' | 'down') => {
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            const elementIndex = block.elements.findIndex(el => el.id === elementId);
            if (elementIndex !== -1) {
              const newIndex = direction === 'up' ? elementIndex - 1 : elementIndex + 1;
              if (newIndex < 0 || newIndex >= block.elements.length) {
                toast.error(`Cannot move ${direction}`);
                return;
              }
              const [movedElement] = block.elements.splice(elementIndex, 1);
              block.elements.splice(newIndex, 0, movedElement);
              handlePageUpdate(updatedPage, `Move element ${direction}`);
              return;
            }
          }
        }
      }
    }
  }, [page, handlePageUpdate]);

  // Node updates
  const handleUpdateNode = useCallback((path: string[], updates: Record<string, unknown>) => {
    const updatedPage = updateNodeByPath(page, path, updates);
    handlePageUpdate(updatedPage);
  }, [page, handlePageUpdate]);

  // SEO/Meta update handlers
  const handleMetaUpdate = useCallback((key: string, value: string) => {
    const updatedPage = deepClone(page);
    updatedPage.settings = {
      ...updatedPage.settings,
      meta: {
        ...updatedPage.settings.meta,
        [key]: value,
      },
    };
    handlePageUpdate(updatedPage);
  }, [page, handlePageUpdate]);

  const handleSettingsUpdate = useCallback((key: string, value: any) => {
    const updatedPage = deepClone(page);

    updatedPage.settings = {
      ...updatedPage.settings,
      [key]: value,
    };

    // IMPORTANT: Steps currently default to an explicit white background.
    // That means changing the global `page_background` will not be visible unless a step
    // background is unset or still at the default. To make "Canvas Theme" feel real and
    // predictable, we propagate the new page background to steps that are still at the
    // default background (i.e., not customized).
    if (key === 'page_background' && value?.type === 'solid' && typeof value?.color === 'string') {
      const defaultStepBgColor = '#ffffff';
      updatedPage.steps = (updatedPage.steps || []).map((s) => {
        const stepBgColor = (s as any)?.background?.color;
        const stepBgType = (s as any)?.background?.type;

        const isDefaultStepBackground = stepBgType === 'solid' && (stepBgColor || '').toLowerCase() === defaultStepBgColor;

        if (!isDefaultStepBackground) return s;

        return {
          ...s,
          background: { type: 'solid', color: value.color },
        };
      });
    }

    handlePageUpdate(updatedPage);
  }, [page, handlePageUpdate]);

  // AI Copilot suggestion handler
  const handleApplySuggestion = useCallback((suggestion: AIsuggestion) => {
    if (suggestion.type === 'step' && suggestion.preview) {
      const intent = suggestion.id.replace('add-', '') as StepIntent;
      handleAddStep(intent);
    } else if (suggestion.type === 'copy') {
      // Open AI Generate modal for copy improvement
      setIsAIGenerateOpen(true);
      toast.info('Use the AI Generate modal to improve your copy');
    } else if (suggestion.type === 'layout') {
      // Focus on selected element's layout settings
      if (selection.type === 'block' || selection.type === 'element') {
        toast.info('Adjust layout settings in the right panel');
      } else {
        toast.info('Select a block or element to optimize its layout');
      }
    } else {
      toast.info('Feature coming soon!');
    }
  }, [handleAddStep, selection]);

  // Publish handler
  const handlePublish = useCallback(() => {
    onPublish?.(page);
    toast.success('Page published successfully!');
  }, [page, onPublish]);

  // Add frame handler
  const handleAddFrame = useCallback(() => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step) {
      step.frames.push({
        id: generateId(),
        label: 'Section',
        stacks: [{
          id: generateId(),
          label: 'Main Stack',
          direction: 'vertical',
          blocks: [],
          props: {},
        }],
        props: {},
      });
      handlePageUpdate(updatedPage);
      toast.success('Section added');
    }
  }, [activeStepId, page, handlePageUpdate]);

  // Delete frame handler - now allows deleting the last section (0 sections allowed)
  const handleDeleteFrame = useCallback((frameId: string) => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step) {
      step.frames = step.frames.filter(f => f.id !== frameId);
      handlePageUpdate(updatedPage);
      handleClearSelection();
      toast.success('Section deleted');
    }
  }, [activeStepId, page, handlePageUpdate, handleClearSelection]);

  // Reorder frames within a step
  const handleReorderFrames = useCallback((fromIndex: number, toIndex: number) => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step && fromIndex >= 0 && toIndex >= 0 && fromIndex < step.frames.length && toIndex < step.frames.length) {
      const [movedFrame] = step.frames.splice(fromIndex, 1);
      step.frames.splice(toIndex, 0, movedFrame);
      handlePageUpdate(updatedPage, 'Reorder sections');
    }
  }, [activeStepId, page, handlePageUpdate]);

  // Duplicate frame
  const handleDuplicateFrame = useCallback((frameId: string) => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step) {
      const frameIndex = step.frames.findIndex(f => f.id === frameId);
      if (frameIndex !== -1) {
        const frameToDuplicate = deepClone(step.frames[frameIndex]);
        frameToDuplicate.id = generateId();
        frameToDuplicate.label = `${frameToDuplicate.label || 'Section'} (Copy)`;
        // Generate new IDs for nested stacks and blocks
        frameToDuplicate.stacks.forEach(stack => {
          stack.id = generateId();
          stack.blocks.forEach(block => {
            block.id = generateId();
            block.elements.forEach(el => { el.id = generateId(); });
          });
        });
        step.frames.splice(frameIndex + 1, 0, frameToDuplicate);
        handlePageUpdate(updatedPage, 'Duplicate section');
        toast.success('Section duplicated');
      }
    }
  }, [activeStepId, page, handlePageUpdate]);

  // Add frame at specific position
  const handleAddFrameAt = useCallback((position: 'above' | 'below', referenceFrameId: string) => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step) {
      const referenceIndex = step.frames.findIndex(f => f.id === referenceFrameId);
      if (referenceIndex !== -1) {
        const newFrame = {
          id: generateId(),
          label: 'Section',
          layout: 'full-width' as const, // Default to full-width for better UX
          stacks: [{
            id: generateId(),
            label: 'Main Stack',
            direction: 'vertical' as const,
            blocks: [],
            props: {},
          }],
          props: {},
        };
        const insertIndex = position === 'above' ? referenceIndex : referenceIndex + 1;
        step.frames.splice(insertIndex, 0, newFrame);
        handlePageUpdate(updatedPage, 'Add section');
        toast.success('Section added');
      }
    }
  }, [activeStepId, page, handlePageUpdate]);

  // Rename frame
  const handleRenameFrame = useCallback((frameId: string, newName: string) => {
    if (!activeStepId) return;
    
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === activeStepId);
    if (step) {
      const frame = step.frames.find(f => f.id === frameId);
      if (frame) {
        frame.label = newName;
        handlePageUpdate(updatedPage, 'Rename section');
        toast.success('Section renamed');
      }
    }
  }, [activeStepId, page, handlePageUpdate]);

  // Rename step handler
  const handleRenameStep = useCallback((stepId: string, newName: string) => {
    const updatedPage = deepClone(page);
    const step = updatedPage.steps.find(s => s.id === stepId);
    if (step) {
      step.name = newName;
      handlePageUpdate(updatedPage);
      toast.success('Step renamed');
    }
  }, [page, handlePageUpdate]);

  // Rename project handler
  const handleRenameProject = useCallback((newName: string) => {
    const updatedPage = deepClone(page);
    updatedPage.name = newName;
    handlePageUpdate(updatedPage);
    toast.success(`Project renamed to "${newName}"`);
  }, [page, handlePageUpdate]);

  // Export project handler - copies page JSON to clipboard
  const handleExportProject = useCallback(() => {
    const projectData = JSON.stringify(page, null, 2);
    navigator.clipboard.writeText(projectData).then(() => {
      toast.success('Project JSON copied to clipboard!');
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${page.name || 'project'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Project exported as JSON file!');
    });
  }, [page]);

  // Copy selected element/block to clipboard
  const handleCopy = useCallback(() => {
    if (selection.type === 'element' && selection.id) {
      // Find the element
      for (const step of page.steps) {
        for (const frame of step.frames) {
          for (const stack of frame.stacks) {
            for (const block of stack.blocks) {
              const element = block.elements.find(el => el.id === selection.id);
              if (element) {
                clipboardRef.current = { type: 'element', data: deepClone(element) };
                toast.success('Element copied');
                return;
              }
            }
          }
        }
      }
    } else if (selection.type === 'block' && selection.id) {
      // Find the block
      for (const step of page.steps) {
        for (const frame of step.frames) {
          for (const stack of frame.stacks) {
            const block = stack.blocks.find(b => b.id === selection.id);
            if (block) {
              clipboardRef.current = { type: 'block', data: deepClone(block) };
              toast.success('Block copied');
              return;
            }
          }
        }
      }
    }
  }, [page, selection]);

  // Paste from clipboard
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) {
      toast.info('Nothing to paste');
      return;
    }

    const clipboard = clipboardRef.current;
    
    if (clipboard.type === 'element') {
      // Paste element into selected block or after selected element
      const elementToPaste = deepClone(clipboard.data) as Element;
      elementToPaste.id = generateId();
      
      const updatedPage = deepClone(page);
      
      if (selection.type === 'element' && selection.id) {
        // Paste after selected element
        for (const step of updatedPage.steps) {
          for (const frame of step.frames) {
            for (const stack of frame.stacks) {
              for (const block of stack.blocks) {
                const elementIndex = block.elements.findIndex(el => el.id === selection.id);
                if (elementIndex !== -1) {
                  block.elements.splice(elementIndex + 1, 0, elementToPaste);
                  handlePageUpdate(updatedPage);
                  toast.success('Element pasted');
                  return;
                }
              }
            }
          }
        }
      } else if (selection.type === 'block' && selection.id) {
        // Paste into selected block
        for (const step of updatedPage.steps) {
          for (const frame of step.frames) {
            for (const stack of frame.stacks) {
              const block = stack.blocks.find(b => b.id === selection.id);
              if (block) {
                block.elements.push(elementToPaste);
                handlePageUpdate(updatedPage);
                toast.success('Element pasted into block');
                return;
              }
            }
          }
        }
      } else {
        toast.info('Select a block or element to paste into');
      }
    } else if (clipboard.type === 'block') {
      // Paste block after selected block or at end of first stack
      const blockToPaste = deepClone(clipboard.data) as Block;
      blockToPaste.id = generateId();
      blockToPaste.label = `${blockToPaste.label} (Copy)`;
      blockToPaste.elements.forEach(el => { el.id = generateId(); });
      
      const updatedPage = deepClone(page);
      
      if (selection.type === 'block' && selection.id) {
        // Paste after selected block
        for (const step of updatedPage.steps) {
          for (const frame of step.frames) {
            for (const stack of frame.stacks) {
              const blockIndex = stack.blocks.findIndex(b => b.id === selection.id);
              if (blockIndex !== -1) {
                stack.blocks.splice(blockIndex + 1, 0, blockToPaste);
                handlePageUpdate(updatedPage);
                toast.success('Block pasted');
                return;
              }
            }
          }
        }
      } else {
        // Paste at end of first stack in active step
        const step = updatedPage.steps.find(s => s.id === activeStepId);
        if (step && step.frames[0] && step.frames[0].stacks[0]) {
          step.frames[0].stacks[0].blocks.push(blockToPaste);
          handlePageUpdate(updatedPage);
          toast.success('Block pasted');
          return;
        }
      }
    }
  }, [page, selection, activeStepId, handlePageUpdate]);

  // Apply text style preset to selected element
  const handleApplyTextPreset = useCallback((preset: TextPreset) => {
    if (selection.type !== 'element' || !selection.id) {
      toast.info('Select a text element first to apply this style');
      return;
    }
    
    // Map preset weight to CSS font-weight
    const weightMap: Record<string, string> = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    };
    
    const updatedPage = deepClone(page);
    
    for (const step of updatedPage.steps) {
      for (const frame of step.frames) {
        for (const stack of frame.stacks) {
          for (const block of stack.blocks) {
            const element = block.elements.find(el => el.id === selection.id);
            if (element) {
              // Check if it's a text-based element
              if (['text', 'heading', 'button'].includes(element.type)) {
                element.props = {
                  ...element.props,
                  fontSize: preset.size,
                  fontWeight: weightMap[preset.weight] || '400',
                };
                handlePageUpdate(updatedPage);
                return;
              } else {
                toast.info('This preset can only be applied to text elements');
                return;
              }
            }
          }
        }
      }
    }
  }, [page, selection, handlePageUpdate]);

  // Layer selection handlers
  const handleSelectFrame = useCallback((frameId: string, path: string[]) => {
    handleSelect({ type: 'frame', id: frameId, path });
  }, [handleSelect]);

  const handleSelectBlock = useCallback((blockId: string, path: string[]) => {
    handleSelect({ type: 'block', id: blockId, path });
  }, [handleSelect]);

  const handleSelectElement = useCallback((elementId: string, path: string[]) => {
    handleSelect({ type: 'element', id: elementId, path });
  }, [handleSelect]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }
      
      // 'B' - Open Block Picker Panel
      if (e.key === 'b' && !modifier && !e.shiftKey && !previewMode && !readOnly) {
        e.preventDefault();
        setBlockPickerOpen(true);
        setBlockPickerMode('blocks');
      }
      
      // 'Escape' - Step up selection hierarchy or close picker
      if (e.key === 'Escape') {
        e.preventDefault();
        if (blockPickerOpen) {
          setBlockPickerOpen(false);
          setBlockPickerTargetStackId(null);
          setBlockPickerMode('blocks');
        } else if (selection.type === 'element' && selection.path.length >= 2) {
          // Step up from element to block
          const blockIndex = selection.path.findIndex((p, i) => p === 'block' && selection.path[i + 1]);
          if (blockIndex !== -1) {
            const blockId = selection.path[blockIndex + 1];
            const blockPath = selection.path.slice(0, blockIndex + 2);
            handleSelect({ type: 'block', id: blockId, path: blockPath });
          } else {
            handleClearSelection();
          }
        } else if (selection.type === 'block' && selection.path.length >= 2) {
          // Step up from block to frame (section) - skip stack as it's not inspectable
          const frameIndex = selection.path.findIndex((p, i) => p === 'frame' && selection.path[i + 1]);
          if (frameIndex !== -1) {
            const frameId = selection.path[frameIndex + 1];
            const framePath = selection.path.slice(0, frameIndex + 2);
            handleSelect({ type: 'frame', id: frameId, path: framePath });
          } else {
            handleClearSelection();
          }
        } else if (selection.type === 'stack' && selection.path.length >= 2) {
          // CRITICAL: Stack is not inspectable - redirect to parent frame
          const frameIndex = selection.path.findIndex((p, i) => p === 'frame' && selection.path[i + 1]);
          if (frameIndex !== -1) {
            const frameId = selection.path[frameIndex + 1];
            const framePath = selection.path.slice(0, frameIndex + 2);
            handleSelect({ type: 'frame', id: frameId, path: framePath });
          } else {
            handleClearSelection();
          }
        } else if (selection.id) {
          handleClearSelection();
        }
      }
      
      // 'Delete' or 'Backspace' - Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && !previewMode && !readOnly) {
        if (selection.type === 'element' && selection.id) {
          e.preventDefault();
          handleDeleteElement(selection.id);
        } else if (selection.type === 'block' && selection.id) {
          e.preventDefault();
          handleDeleteBlock(selection.id);
        }
      }
      
      // 'D' with modifier - Duplicate selected element
      if (e.key === 'd' && modifier && !previewMode && !readOnly) {
        if (selection.type === 'element' && selection.id) {
          e.preventDefault();
          handleDuplicateElement(selection.id);
        } else if (selection.type === 'block' && selection.id) {
          e.preventDefault();
          handleDuplicateBlock(selection.id);
        }
      }
      
      // 'C' with modifier - Copy selected element/block
      if (e.key === 'c' && modifier && !previewMode && !readOnly) {
        if (selection.type === 'element' || selection.type === 'block') {
          e.preventDefault();
          handleCopy();
        }
      }
      
      // 'V' with modifier - Paste element/block (different from 'v' alone for select mode)
      if (e.key === 'v' && modifier && !previewMode && !readOnly) {
        e.preventDefault();
        handlePaste();
      }
      // 'G' - Toggle grid
      if (e.key === 'g' && !modifier && !e.shiftKey) {
        e.preventDefault();
        setShowGrid(prev => !prev);
      }
      
      // 'P' - Toggle preview mode
      if (e.key === 'p' && !modifier && !e.shiftKey) {
        e.preventDefault();
        setPreviewMode(prev => !prev);
      }
      
      // 'F' - Add frame/section
      if (e.key === 'f' && !modifier && !e.shiftKey && !previewMode && !readOnly) {
        e.preventDefault();
        handleAddFrame();
      }
      
      // 'T' - Open text styles
      if (e.key === 't' && !modifier && !e.shiftKey && !previewMode && !readOnly) {
        e.preventDefault();
        setIsTextStylesOpen(true);
      }
      
      // '?' - Show keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
      
      // 'V' - Select mode
      if (e.key === 'v' && !modifier && !e.shiftKey && !previewMode) {
        e.preventDefault();
        setDesignMode('select');
      }
      
      // 'H' - Pan/Hand mode
      if (e.key === 'h' && !modifier && !e.shiftKey && !previewMode) {
        e.preventDefault();
        setDesignMode('pan');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    previewMode, 
    readOnly, 
    selection, 
    blockPickerOpen, 
    handleClearSelection, 
    handleDeleteElement, 
    handleDeleteBlock, 
    handleDuplicateElement, 
    handleDuplicateBlock,
    handleAddFrame,
    handleCopy,
    handlePaste
  ]);

  return (
    <CaptureFlowProvider>
    <InlineEditProvider>
    <div
      className={
        `h-screen flex flex-col overflow-hidden ` +
        (editorTheme === 'dark'
          ? 'dark bg-builder-bg'
          : 'editor-light bg-background')
      }
    >
      {/* Top Toolbar */}
      <TopToolbar
        pageName={page.name}
        pageSlug={page.slug}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        previewMode={previewMode}
        onPreviewToggle={() => setPreviewMode(!previewMode)}
        onPublish={onPublish ? handlePublish : undefined}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenBlockPalette={() => {
          setBlockPickerOpen(true);
          setBlockPickerMode('blocks');
        }}
        onAddFrame={handleAddFrame}
        onOpenTextStyles={() => setIsTextStylesOpen(true)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onOpenCollaborators={() => setIsCollaboratorsOpen(true)}
        onOpenSEO={() => setIsSEOOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenTheme={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAIGenerate={() => setIsAIGenerateOpen(true)}
        onRenameProject={handleRenameProject}
        onExportProject={handleExportProject}
        canvasTheme={editorTheme}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onCanvasThemeToggle={() => {
          setEditorTheme(prev => prev === 'dark' ? 'light' : 'dark');
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Mobile panel toggles */}
        {isMobile && !previewMode && (
          <div className="absolute top-2 left-2 z-50 flex gap-2">
            <button
              onClick={() => setMobileLeftOpen(true)}
              className="p-2 rounded-lg bg-[hsl(var(--builder-surface))] border border-[hsl(var(--builder-border))] text-[hsl(var(--builder-text-muted))]"
            >
              <Menu size={18} />
            </button>
          </div>
        )}
        
        {/* Left Panel Toggle Button - when collapsed */}
        {!previewMode && !isMobile && !leftPanelOpen && (
          <div className="shrink-0 h-full flex flex-col border-r border-builder-border bg-builder-surface">
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="p-2 hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
              title="Open left panel"
            >
              <PanelLeftClose size={16} className="rotate-180" />
            </button>
          </div>
        )}
        
        {/* Left Panel - Desktop */}
        {!previewMode && !isMobile && leftPanelOpen && (
          <div className="w-60 shrink-0 h-full overflow-hidden flex flex-col border-r border-builder-border bg-builder-surface">
            {blockPickerOpen ? (
              <BlockPickerPanel
                onAddBlock={(block, options) => {
                  if (options?.type === 'section') {
                    // Add as a new section (frame)
                    handleAddBlock(block, undefined, { type: 'section' });
                  } else if (blockPickerTargetStackId) {
                    // Add to specific stack at the end
                    handleAddBlock(block, { stackId: blockPickerTargetStackId, index: Infinity });
                  } else {
                    // Add to first stack of active step
                    handleAddBlock(block);
                  }
                  setBlockPickerOpen(false);
                  setBlockPickerTargetStackId(null);
                  setBlockPickerMode('blocks');
                }}
                onClose={() => {
                  setBlockPickerOpen(false);
                  setBlockPickerTargetStackId(null);
                  setBlockPickerMode('blocks');
                }}
                targetSectionId={blockPickerTargetStackId}
                hideSecionsTab={!!blockPickerTargetStackId}
                initialTab={blockPickerMode === 'sections' ? 'sections' : 'blocks'}
                activeApplicationFlowBlockId={findApplicationFlowBlock()?.id || null}
                onAddApplicationFlowStep={(step) => {
                  handleAddApplicationFlowStep(step);
                  setBlockPickerOpen(false);
                  setBlockPickerTargetStackId(null);
                  setBlockPickerMode('blocks');
                }}
                onCreateApplicationFlowWithStep={(step) => {
                  handleCreateApplicationFlowWithStep(step);
                  setBlockPickerOpen(false);
                  setBlockPickerTargetStackId(null);
                  setBlockPickerMode('blocks');
                }}
                targetStackId={blockPickerTargetStackId}
                onOpenAIGenerate={() => {
                  setBlockPickerOpen(false);
                  setIsAIGenerateOpen(true);
                }}
                onClosePanel={() => setLeftPanelOpen(false)}
              />
            ) : (
              <LeftPanel
                steps={page.steps}
                activeStepId={activeStepId}
                selection={selection}
                onStepSelect={handleStepSelect}
                onAddStep={handleAddStep}
                onDeleteStep={handleDeleteStep}
                onDuplicateStep={handleDuplicateStep}
                onAddBlankStep={handleAddBlankStep}
                onReorderSteps={handleReorderSteps}
                onSelectFrame={handleSelectFrame}
                onSelectBlock={handleSelectBlock}
                onSelectElement={handleSelectElement}
                onRenameStep={handleRenameStep}
                onOpenImagePicker={() => setIsSocialImagePickerOpen(true)}
                onOpenBlockPicker={() => {
                  setBlockPickerOpen(true);
                  setBlockPickerMode('sections');
                }}
                onClosePanel={() => setLeftPanelOpen(false)}
              />
            )}
          </div>
        )}
        
        {/* Left Panel - Mobile Sheet */}
        {isMobile && !previewMode && (
          <Sheet open={mobileLeftOpen} onOpenChange={setMobileLeftOpen}>
            <SheetContent side="left" className="w-72 p-0 bg-[hsl(var(--builder-surface))] border-[hsl(var(--builder-border))]">
              <LeftPanel
                steps={page.steps}
                activeStepId={activeStepId}
                selection={selection}
                onStepSelect={(id) => { handleStepSelect(id); setMobileLeftOpen(false); }}
                onAddStep={handleAddStep}
                onDeleteStep={handleDeleteStep}
                onDuplicateStep={handleDuplicateStep}
                onAddBlankStep={handleAddBlankStep}
                onReorderSteps={handleReorderSteps}
                onSelectFrame={(id, path) => { handleSelectFrame(id, path); setMobileLeftOpen(false); }}
                onSelectBlock={(id, path) => { handleSelectBlock(id, path); setMobileLeftOpen(false); }}
                onSelectElement={(id, path) => { handleSelectElement(id, path); setMobileLeftOpen(false); }}
                onOpenImagePicker={() => setIsSocialImagePickerOpen(true)}
                onOpenBlockPicker={() => {
                  setBlockPickerOpen(true);
                  setBlockPickerMode('sections');
                  setMobileLeftOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Canvas */}
        <div className="flex-1 relative min-h-0 h-full overflow-hidden flex flex-col">
          {previewMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 glass border border-builder-border rounded-full">
              <div className="w-2 h-2 rounded-full bg-builder-success animate-pulse" />
              <span className="text-xs font-medium text-builder-text">Preview Mode</span>
              <button 
                onClick={() => setPreviewMode(false)}
                className="ml-2 text-xs text-builder-text-muted hover:text-builder-text"
              >
                Exit
              </button>
            </div>
          )}
          <CanvasRenderer
            step={activeStep}
            selection={selection}
            onSelect={handleSelect}
            deviceMode={deviceMode}
            readOnly={readOnly || previewMode}
            designMode={designMode}
            onReorderBlocks={handleReorderBlocks}
            onReorderElements={handleReorderElements}
            onOpenBlockPalette={() => {
              setBlockPickerOpen(true);
              setBlockPickerMode('blocks');
            }}
            onAddBlock={handleAddBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onUpdateElement={handleUpdateElement}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onCopy={handleCopy}
            onPaste={handlePaste}
            selectedApplicationStepId={selectedApplicationStepId}
            activeApplicationFlowBlockId={activeFlowBlockId}
            selectedStepElement={selectedStepElement}
            onSelectStepElement={handleSelectStepElement}
            canPaste={!!clipboardRef.current}
            pageSettings={page.settings}
            replayAnimationKey={replayAnimationKey}
            showGrid={showGrid}
            onAddFrame={handleAddFrame}
            onOpenAIGenerate={() => setIsAIGenerateOpen(true)}
            // Section management
            onReorderFrames={handleReorderFrames}
            onDuplicateFrame={handleDuplicateFrame}
            onDeleteFrame={handleDeleteFrame}
            onAddFrameAt={handleAddFrameAt}
            onRenameFrame={handleRenameFrame}
            onOpenBlockPickerInPanel={(stackId) => {
              setBlockPickerTargetStackId(stackId);
              setBlockPickerMode('blocks');
              setBlockPickerOpen(true);
            }}
            onOpenSectionPicker={() => {
              setBlockPickerOpen(true);
              setBlockPickerMode('sections');
            }}
            onNextStep={() => {
              const currentIndex = page.steps.findIndex(s => s.id === activeStepId);
              if (currentIndex >= 0 && currentIndex < page.steps.length - 1) {
                setActiveStepId(page.steps[currentIndex + 1].id);
              }
            }}
            onGoToStep={(stepId) => {
              const stepExists = page.steps.some(s => s.id === stepId);
              if (stepExists) {
                setActiveStepId(stepId);
              }
            }}
            onFormSubmit={(values) => {
              console.log('Form submitted:', values);
              const currentIndex = page.steps.findIndex(s => s.id === activeStepId);
              if (currentIndex >= 0 && currentIndex < page.steps.length - 1) {
                setActiveStepId(page.steps[currentIndex + 1].id);
              }
            }}
          />
        </div>

        {/* Right Panel */}
        {!previewMode && !isMobile && rightPanelOpen && (
          <RightPanel
            page={page}
            selection={selection}
            onUpdateNode={handleUpdateNode}
            onClearSelection={handleClearSelection}
            onSelect={handleSelect}
            onPublish={handlePublish}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onMoveElement={handleMoveElement}
            onUpdateElement={handleUpdateElement}
            onReplayAnimation={handleReplayAnimation}
            currentDeviceMode={deviceMode}
            onDeleteFrame={handleDeleteFrame}
            onDuplicateFrame={handleDuplicateFrame}
            onMoveFrame={(frameId, direction) => {
              if (!activeStep) return;
              const currentIndex = activeStep.frames.findIndex(f => f.id === frameId);
              if (currentIndex === -1) return;
              const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
              if (newIndex >= 0 && newIndex < activeStep.frames.length) {
                handleReorderFrames(currentIndex, newIndex);
              }
            }}
            onAddFrameAt={handleAddFrameAt}
            activeStep={activeStep}
            selectedApplicationStepId={selectedApplicationStepId}
            onSelectApplicationStep={handleSelectApplicationStepWithTracking}
            selectedStepElement={selectedStepElement}
            onClearStepElement={() => setSelectedStepElement(null)}
            onClosePanel={() => setRightPanelOpen(false)}
          />
        )}
        
        {/* Right Panel Toggle Button - when collapsed */}
        {!previewMode && !isMobile && !rightPanelOpen && (
          <div className="shrink-0 h-full flex flex-col border-l border-builder-border bg-builder-surface">
            <button
              onClick={() => setRightPanelOpen(true)}
              className="p-2 hover:bg-builder-surface-hover text-builder-text-muted hover:text-builder-text transition-colors"
              title="Open right panel"
            >
              <PanelRightClose size={16} className="rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* AI Copilot */}
      {!readOnly && !previewMode && (
        <AIBuilderCopilot
          currentPage={page}
          selection={selection}
          onApplySuggestion={handleApplySuggestion}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleDeleteBlock}
          onUpdatePage={handleAIPageUpdate}
          isExpanded={isAICopilotExpanded}
          onToggle={() => setIsAICopilotExpanded(!isAICopilotExpanded)}
        />
      )}


      {/* Modals */}
      <CollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        pageSlug={page.slug}
      />
      <SEOSettingsModal
        isOpen={isSEOOpen}
        onClose={() => setIsSEOOpen(false)}
        meta={page.settings.meta || {}}
        onUpdateMeta={handleMetaUpdate}
      />
      <FunnelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={page.settings}
        pageSlug={page.slug}
        onUpdateSettings={handleSettingsUpdate}
      />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        pageSlug={page.slug}
        pageTitle={page.name}
      />
      <AnalyticsPanel
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
      <TextStylesModal
        isOpen={isTextStylesOpen}
        onClose={() => setIsTextStylesOpen(false)}
        onApplyPreset={handleApplyTextPreset}
      />
      <AIGenerateModal
        isOpen={isAIGenerateOpen}
        onClose={() => setIsAIGenerateOpen(false)}
        onGenerateBlock={handleAddBlock}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <ImagePickerModal
        isOpen={isSocialImagePickerOpen}
        onClose={() => setIsSocialImagePickerOpen(false)}
        onSelectImage={(url) => {
          handleMetaUpdate('og_image', url);
          setIsSocialImagePickerOpen(false);
        }}
        currentImage={page.settings.meta?.og_image}
      />
      {/* CaptureFlow Modal - Phase 7 */}
      {openCaptureFlow && (
        <CaptureFlowModal
          isOpen={!!openCaptureFlowId}
          onClose={() => {
            setOpenCaptureFlowId(null);
            setOpenCaptureFlow(null);
          }}
          captureFlow={openCaptureFlow}
          onComplete={(answers) => {
            console.log('CaptureFlow completed:', answers);
            toast.success('Response submitted successfully!');
          }}
        />
      )}
    </div>
    </InlineEditProvider>
    </CaptureFlowProvider>
  );
};
