/**
 * Canvas Renderers - Modular rendering components
 * 
 * Phase 3: Renderer Improvements
 * ─────────────────────────────────────────────────────────
 * This module exports focused rendering components extracted from the
 * monolithic CanvasRenderer.tsx for better maintainability.
 * 
 * Components:
 * - CanvasUtilities: Shared contexts, constants, and helpers
 * - ElementDragOverlay: Visual feedback for element dragging
 * - BlockDragOverlay: Visual feedback for block dragging
 * - StackRenderer: Renders block stacks with DnD support
 * - FrameRenderer: Renders frames/sections with backgrounds
 * - SortableFrameRenderer: FrameRenderer with drag reordering
 */

export { 
  CanvasUtilities, 
  ThemeContext, 
  FormStateContext, 
  effectClasses, 
  deviceWidths 
} from './CanvasUtilities';

export type { 
  ThemeContextValue, 
  FormStateContextValue 
} from './CanvasUtilities';

export { ElementDragOverlay } from './ElementDragOverlay';
export { BlockDragOverlay } from './BlockDragOverlay';
export { StackRenderer } from './StackRenderer';
export { FrameRenderer, SortableFrameRenderer } from './FrameRenderer';
